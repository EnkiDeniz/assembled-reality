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
  buildAssemblyIndexEvent,
  buildAssemblyStateSummary,
} from "@/lib/assembly-architecture";
import {
  createReadingReceiptDraftForUser,
  getReaderProfileByUserId,
  getReadingReceiptDraftByIdForUser,
  listReadingReceiptDraftsForProjectForUser,
  updateReadingReceiptDraftForUser,
} from "@/lib/reader-db";
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
import { buildExcerpt } from "@/lib/text";

export const dynamic = "force-dynamic";

function unique(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function listConfirmedEvidenceBlocksFromDocuments(documents = []) {
  return (Array.isArray(documents) ? documents : [])
    .filter(
      (document) =>
        document &&
        !document.isAssembly &&
        document.documentType !== "assembly" &&
        document.documentType !== "builtin" &&
        document.sourceType !== "builtin",
    )
    .flatMap((document) => {
      const sourceTitle = document?.title || "Untitled document";
      return (Array.isArray(document?.blocks) ? document.blocks : [])
        .filter(
          (block) =>
            String(block?.confirmationStatus || "").trim().toLowerCase() === "confirmed" &&
            String(block?.primaryTag || "").trim().toLowerCase() === "evidence",
        )
        .map((block) => ({
          ...block,
          sourceTitle: block?.sourceTitle || sourceTitle,
          sourceDocumentKey: block?.sourceDocumentKey || document?.documentKey || "",
        }));
    });
}

function buildEvidenceSnapshot(blocks = []) {
  const normalizedBlocks = Array.isArray(blocks) ? blocks : [];
  return {
    blockCount: normalizedBlocks.length,
    sourceDocumentKeys: unique(
      normalizedBlocks.map((block) => block.sourceDocumentKey || block.documentKey),
    ),
    domains: unique(normalizedBlocks.map((block) => block.domain).filter(Boolean)),
    blocks: normalizedBlocks.map((block, index) => ({
      order: index,
      blockId: block.id,
      sourceDocumentKey: block.sourceDocumentKey || block.documentKey || "",
      sourceTitle: block.sourceTitle || "",
      sourcePosition: Number.isFinite(Number(block.sourcePosition)) ? Number(block.sourcePosition) : index,
      extractionPassId: block.extractionPassId || null,
      domain: block.domain || "",
      sevenStage: Number.isFinite(Number(block.sevenStage)) ? Number(block.sevenStage) : null,
      textExcerpt: buildExcerpt(block.plainText || block.text || "", 180),
    })),
  };
}

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
  let status = "LOCAL_DRAFT";

  if (connection?.status === "CONNECTED" && connection?.accessTokenEncrypted) {
    try {
      remoteReceipt = await createRemoteReadingReceiptDraft(connection, payload);
      status = "REMOTE_DRAFT";
    } catch (error) {
      remoteError = error instanceof Error ? error.message : "getreceipts-create-failed";
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
    },
  });

  return NextResponse.json({
    ok: true,
    draft,
    remoteReceipt,
    remoteError,
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
  const confirmedEvidenceBlocks = listConfirmedEvidenceBlocksFromDocuments(evidenceDocuments);

  if (!confirmedEvidenceBlocks.length) {
    return NextResponse.json(
      {
        error: "Seal a receipt only after at least one confirmed evidence block is in the box.",
      },
      { status: 400 },
    );
  }

  const evidenceSnapshot = buildEvidenceSnapshot(confirmedEvidenceBlocks);
  const nextPayload = {
    ...(draft.payload && typeof draft.payload === "object" ? draft.payload : {}),
    deltaStatement,
    sealedAt: new Date().toISOString(),
    evidenceSnapshot,
  };
  const sealedDraft = await updateReadingReceiptDraftForUser(session.user.id, draftId, {
    status: "SEALED",
    sourceSections: evidenceSnapshot.sourceDocumentKeys,
    sourceMarkIds: evidenceSnapshot.blocks.map((block) => block.blockId),
    payload: nextPayload,
  });

  if (!projectKey) {
    return NextResponse.json({ ok: true, draft: sealedDraft });
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
  const nextStateHistory = Array.isArray(currentMeta?.stateHistory) ? [...currentMeta.stateHistory] : [];
  const nextEvents = [
    buildAssemblyIndexEvent("receipt_sealed", {
      draftId,
      documentKey: draft.documentKey,
      deltaStatement,
      evidenceBlockCount: evidenceSnapshot.blockCount,
      evidenceDomains: evidenceSnapshot.domains,
      evidenceSourceDocumentKeys: evidenceSnapshot.sourceDocumentKeys,
    }),
  ];

  if (nextStateSummary.current && nextStateSummary.current !== previousState) {
    nextEvents.push(
      buildAssemblyIndexEvent("state_advanced", {
        from: previousState || "declare-root",
        to: nextStateSummary.current,
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
  });
}
