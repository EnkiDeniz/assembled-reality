import { NextResponse } from "next/server";
import {
  normalizeWorkspaceBlocks,
  normalizeWorkspaceLogEntries,
} from "@/lib/document-blocks";
import {
  createRemoteReadingReceiptDraft,
  getGetReceiptsConnectionForUser,
} from "@/lib/getreceipts";
import {
  buildRemoteSealState,
  syncReceiptDraftToCourthouse,
} from "@/lib/receipt-remote-sync";
import {
  buildAssemblyIndexEvent,
  buildAssemblyStateSummary,
} from "@/lib/assembly-architecture";
import {
  buildReceiptSealAudit,
  buildEvidenceSnapshot,
  listConfirmedEvidenceBlocksFromDocuments,
} from "@/lib/receipt-seal-audit";
import {
  createReadingReceiptDraftForUser,
  getReaderProfileByUserId,
  getReadingReceiptDraftByIdForUser,
  listReadingReceiptDraftsForProjectForUser,
  updateReadingReceiptDraftForUser,
} from "@/lib/reader-db";
import { buildOperateOverrideSummary } from "@/lib/operate-overlay";
import {
  getLatestReaderOperateRunForUser,
  listReaderAttestedOverridesForUser,
} from "@/lib/reader-operate";
import { getProjectByKey, getProjectDocuments } from "@/lib/project-model";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import {
  getReaderProjectForUser,
  listReaderProjectsForUser,
  updateReaderProjectForUser,
} from "@/lib/reader-projects";
import { getRequiredSession } from "@/lib/server-session";
import {
  buildWorkspaceReceiptDraftInput,
  buildWorkspaceReceiptPayload,
} from "@/lib/workspace-receipts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const document = body?.document || null;
  const projectKey = String(body?.projectKey || "").trim();
  const mode = body?.mode === "operate" ? "operate" : document?.isAssembly ? "assembly" : "workspace";
  const operateResult =
    mode === "operate" && body?.operateResult && typeof body.operateResult === "object"
      ? body.operateResult
      : null;
  const blocks = normalizeWorkspaceBlocks(body?.blocks, {
    documentKey: document?.documentKey || "",
    defaultSourceDocumentKey: document?.documentKey || "",
    defaultIsEditable: true,
    defaultIsAssemblyBlock: Boolean(document?.isAssembly),
  });
  const logEntries = normalizeWorkspaceLogEntries(
    body?.logEntries,
    document?.documentKey || "",
  );

  if (!document?.documentKey) {
    return NextResponse.json({ error: "Document is required." }, { status: 400 });
  }

  const [readerData, connection, project] = await Promise.all([
    getReaderProfileByUserId(session.user.id),
    getGetReceiptsConnectionForUser(session.user.id),
    projectKey ? getReaderProjectForUser(session.user.id, projectKey) : null,
  ]);

  if (!readerData?.profile) {
    return NextResponse.json({ error: "Reader profile not found." }, { status: 404 });
  }

  const payload = buildWorkspaceReceiptPayload({
    profile: readerData.profile,
    project,
    document,
    blocks,
    logEntries,
    mode,
    operateResult,
  });

  let remoteReceipt = null;
  let remoteError = null;
  let remoteSeal = null;
  let status = "LOCAL_DRAFT";

  if (connection?.status === "CONNECTED" && connection?.accessTokenEncrypted) {
    try {
      remoteReceipt = await createRemoteReadingReceiptDraft(connection, payload);
      status = "REMOTE_DRAFT";
      remoteSeal = buildRemoteSealState({
        status: "pending_seal",
        receiptId: remoteReceipt?.id || null,
      });
    } catch (error) {
      remoteError = error instanceof Error ? error.message : "getreceipts-create-failed";
      remoteSeal = buildRemoteSealState({
        status: error?.retryable ? "pending_create" : "failed",
        error,
      });
    }
  }

  const draft = await createReadingReceiptDraftForUser(session.user.id, {
    ...buildWorkspaceReceiptDraftInput({
      document,
      blocks,
      logEntries,
      remoteReceiptId: remoteReceipt?.id || null,
      status,
      mode,
      project,
      operateResult,
    }),
    projectId: project?.id || null,
    projectKey,
    payload: {
      ...payload,
      remoteReceipt,
      remoteError,
      remoteSeal,
    },
  });

  if (projectKey) {
    await updateReaderProjectForUser(session.user.id, projectKey, {
      touchSystemExample: true,
      appendEvents: [
        buildAssemblyIndexEvent("receipt_drafted", {
          move: `Drafted receipt ${draft.title || draft.id} for ${document.title || document.documentKey}.`,
          return:
            status === "REMOTE_DRAFT"
              ? "Receipt draft is also pushed outward as a courthouse draft."
              : "Receipt draft is held locally until you seal it.",
          echo: status.toLowerCase(),
          context: {
            receiptId: draft.id,
            draftId: draft.id,
            documentKey: document.documentKey,
            primaryDocumentKey: document.documentKey,
            relatedSourceDocumentKeys: [
              ...new Set(
                blocks
                  .map((block) => String(block?.sourceDocumentKey || "").trim())
                  .filter(Boolean),
              ),
            ],
            remoteDraft: status === "REMOTE_DRAFT",
          },
        }),
      ],
    });
  }

  return NextResponse.json({
    ok: true,
    draft,
    remoteReceipt,
    remoteError,
    remoteSeal,
  });
}

export async function PUT(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const draftId = String(body?.draftId || "").trim();
  const deltaStatement = String(body?.deltaStatement || "").trim();
  const projectKey = String(body?.projectKey || "").trim();
  const overrideAudit = Boolean(body?.overrideAudit);
  const overrideAcknowledged = Boolean(body?.overrideAcknowledged);

  if (!draftId || !deltaStatement) {
    return NextResponse.json(
      { error: "Receipt draft and delta statement are required." },
      { status: 400 },
    );
  }

  const draft = await getReadingReceiptDraftByIdForUser(session.user.id, draftId);
  if (!draft) {
    return NextResponse.json({ error: "Receipt draft not found." }, { status: 404 });
  }

  const allDocuments = await listReaderDocumentsForUser(session.user.id);
  const targetDocument = allDocuments.find((document) => document.documentKey === draft.documentKey) || null;
  const rawProject = projectKey ? await getReaderProjectForUser(session.user.id, projectKey) : null;
  const hydratedProjects = projectKey ? await listReaderProjectsForUser(session.user.id, allDocuments) : [];
  const hydratedProject = projectKey ? getProjectByKey(hydratedProjects, projectKey) : null;
  const evidenceDocuments = projectKey
    ? getProjectDocuments(allDocuments, hydratedProject)
    : targetDocument
      ? [targetDocument]
      : [];
  const audit = await buildReceiptSealAudit({
    project: hydratedProject || rawProject,
    projectDocuments: evidenceDocuments,
    targetDocument,
    deltaStatement,
  });
  const projectId = hydratedProject?.id || rawProject?.id || null;
  const [operateRun, overrides] = await Promise.all([
    getLatestReaderOperateRunForUser(session.user.id, {
      projectId,
      documentKey: draft.documentKey,
      mode: "overlay",
    }),
    listReaderAttestedOverridesForUser(session.user.id, {
      projectId,
      documentKey: draft.documentKey,
    }),
  ]);
  const overrideSummary = buildOperateOverrideSummary(overrides, targetDocument);
  const enrichedAudit = {
    ...audit,
    operateRunId: operateRun?.id || "",
    overrideSummary,
    warnings:
      overrideSummary.activeOverrideCount > 0
        ? [`${overrideSummary.activeOverrideCount} attested override${overrideSummary.activeOverrideCount === 1 ? "" : "s"} will be disclosed at seal.`]
        : [],
    requiresOverrideAcknowledgement: overrideSummary.activeOverrideCount > 0,
  };

  if (!audit.canOverride) {
    return NextResponse.json(
      {
        error: enrichedAudit.summary || "The receipt is not ready to seal yet.",
        audit: enrichedAudit,
      },
      { status: 400 },
    );
  }

  if (!audit.sealReady && !overrideAudit) {
    return NextResponse.json(
      {
        error: enrichedAudit.summary || "Review the pre-seal audit before sealing this receipt.",
        audit: enrichedAudit,
      },
      { status: 409 },
    );
  }

  if (overrideSummary.activeOverrideCount > 0 && !overrideAcknowledged) {
    return NextResponse.json(
      {
        error: "Acknowledge the attested overrides before sealing this receipt.",
        audit: enrichedAudit,
      },
      { status: 409 },
    );
  }

  const confirmedEvidenceBlocks = listConfirmedEvidenceBlocksFromDocuments(evidenceDocuments);
  const evidenceSnapshot = audit.evidenceSnapshot || buildEvidenceSnapshot(confirmedEvidenceBlocks);
  const localSealedAt = new Date().toISOString();
  const nextPayload = {
    ...(draft.payload && typeof draft.payload === "object" ? draft.payload : {}),
    deltaStatement,
    sealedAt: localSealedAt,
    evidenceSnapshot,
    sealAudit: {
      summary: enrichedAudit.summary,
      checks: enrichedAudit.checks,
      usedFallback: enrichedAudit.usedFallback,
      overrideApplied: !audit.sealReady && overrideAudit,
      operateRunId: enrichedAudit.operateRunId,
      overrideSummary,
      warnings: enrichedAudit.warnings,
      overrideAcknowledged,
    },
  };
  let sealedDraft = await updateReadingReceiptDraftForUser(session.user.id, draftId, {
    status: "SEALED",
    sourceSections: evidenceSnapshot.sourceDocumentKeys,
    sourceMarkIds: evidenceSnapshot.blocks.map((block) => block.blockId),
    payload: nextPayload,
  });
  let remoteSync = null;

  const connection = await getGetReceiptsConnectionForUser(session.user.id);
  if (connection?.status === "CONNECTED" && connection?.accessTokenEncrypted) {
    remoteSync = await syncReceiptDraftToCourthouse({
      userId: session.user.id,
      connection,
      draft: {
        ...sealedDraft,
        payload: nextPayload,
      },
      remotePayload: nextPayload,
      evidenceSnapshot,
    });

    const remoteSeal = remoteSync?.remoteSeal || null;
    const remotePayload = {
      ...nextPayload,
      sealedAt: remoteSeal?.sealedAt || nextPayload.sealedAt,
      remoteReceipt:
        remoteSync?.remoteReceipt ||
        nextPayload.remoteReceipt ||
        null,
      remoteError: remoteSync?.ok
        ? null
        : remoteSync?.error instanceof Error
          ? remoteSync.error.message
          : nextPayload.remoteError || null,
      remoteSeal,
    };

    sealedDraft = await updateReadingReceiptDraftForUser(session.user.id, draftId, {
      status: "SEALED",
      getReceiptsReceiptId:
        remoteSync?.remoteReceiptId ||
        sealedDraft.getReceiptsReceiptId ||
        null,
      payload: remotePayload,
    });
  }

  if (!projectKey) {
    return NextResponse.json({ ok: true, draft: sealedDraft, audit: enrichedAudit, remoteSync });
  }

  const projectDocuments = getProjectDocuments(allDocuments, hydratedProject);
  const projectDrafts = await listReadingReceiptDraftsForProjectForUser(session.user.id, {
    projectId: hydratedProject?.id || rawProject?.id || null,
    documentKeys: hydratedProject?.documentKeys || [],
    take: 24,
  });
  const nextStateSummary = buildAssemblyStateSummary({
    project: hydratedProject,
    projectDocuments,
    projectDrafts,
  });
  const currentMeta = hydratedProject?.metadataJson || rawProject?.metadataJson || null;
  const previousState = String(currentMeta?.assemblyState?.current || "").trim().toLowerCase();
  const declaration = String(nextStateSummary?.root?.text || "").trim();
  const remoteSeal = sealedDraft?.payload?.remoteSeal || nextPayload.remoteSeal || null;
  const nextStateHistory = Array.isArray(currentMeta?.stateHistory) ? [...currentMeta.stateHistory] : [];
  const nextEvents = [
    buildAssemblyIndexEvent("receipt_sealed", {
      declaration,
      move: `Sealed receipt ${draft.title || draft.id} for ${draft.documentKey || "the box"}.`,
      return: remoteSeal?.sealHash
        ? `${evidenceSnapshot.blockCount} confirmed evidence block${evidenceSnapshot.blockCount === 1 ? "" : "s"} support this seal. Courthouse verification is available.`
        : `${evidenceSnapshot.blockCount} confirmed evidence block${evidenceSnapshot.blockCount === 1 ? "" : "s"} support this seal.`,
      echo:
        nextStateSummary.current && nextStateSummary.current !== previousState
          ? `${previousState || "declare-root"} -> ${nextStateSummary.current}`
          : "state unchanged",
      context: {
        receiptId: draftId,
        draftId,
        documentKey: draft.documentKey,
        primaryDocumentKey: draft.documentKey,
        deltaStatement,
        evidenceBlockCount: evidenceSnapshot.blockCount,
        evidenceDomains: evidenceSnapshot.domains,
        evidenceSourceDocumentKeys: evidenceSnapshot.sourceDocumentKeys,
        overrideApplied: !audit.sealReady && overrideAudit,
        overrideCount: overrideSummary.activeOverrideCount,
        remoteSealStatus: remoteSeal?.status || null,
        sealHash: remoteSeal?.sealHash || null,
        verifyUrl: remoteSeal?.verifyUrl || null,
        remoteLevel: remoteSeal?.level || null,
      },
    }),
  ];

  if (nextStateSummary.current && nextStateSummary.current !== previousState) {
    nextEvents.push(
      buildAssemblyIndexEvent("state_advanced", {
        declaration,
        move: `Advanced the assembly state from ${previousState || "declare-root"} to ${nextStateSummary.current}.`,
        return: nextStateSummary.nextRequirement,
        echo: `${previousState || "declare-root"} -> ${nextStateSummary.current}`,
        context: {
          from: previousState || "declare-root",
          to: nextStateSummary.current,
          reason: "receipt sealed",
          receiptId: draftId,
        },
      }),
    );
    nextStateHistory.push({
      state: nextStateSummary.current,
      at: new Date().toISOString(),
      reason: "receipt sealed",
      receiptId: draftId,
    });
  }

  await updateReaderProjectForUser(session.user.id, projectKey, {
    touchSystemExample: true,
    assemblyState: {
      current: nextStateSummary.current,
      updatedAt: new Date().toISOString(),
      nextRequirement: nextStateSummary.nextRequirement,
      coverageRatio: nextStateSummary.coverageRatio,
      unconfirmedCount: nextStateSummary.unconfirmedCount,
      confirmedEvidenceDomains: nextStateSummary.confirmedEvidenceDomains.length,
    },
    stateHistory: nextStateHistory,
    appendEvents: nextEvents,
  });

  return NextResponse.json({
    ok: true,
    draft: sealedDraft,
    state: nextStateSummary,
    audit: enrichedAudit,
    remoteSync,
  });
}
