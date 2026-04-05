import { NextResponse } from "next/server";
import {
  ASSEMBLY_CONFIRMATION_STATUSES,
  ASSEMBLY_PRIMARY_TAGS,
  buildAssemblyIndexEvent,
  buildAssemblyStateSummary,
  normalizeAssemblyDomain,
  normalizeAssemblyPrimaryTag,
} from "@/lib/assembly-architecture";
import { createWorkspaceLogEntry } from "@/lib/document-blocks";
import { getProjectByKey, getProjectDocuments } from "@/lib/project-model";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { listReadingReceiptDraftsForProjectForUser } from "@/lib/reader-db";
import {
  getReaderProjectForUser,
  listReaderProjectsForUser,
  updateReaderProjectForUser,
} from "@/lib/reader-projects";
import { getRequiredSession } from "@/lib/server-session";
import { getWorkspaceDocumentForUser, saveWorkspaceDocumentForUser } from "@/lib/workspace-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const documentKey = String(body?.documentKey || "").trim();
  const blockId = String(body?.blockId || "").trim();
  const action = String(body?.action || "confirm").trim().toLowerCase();
  const primaryTag = normalizeAssemblyPrimaryTag(body?.primaryTag || "");
  const secondaryTag = normalizeAssemblyPrimaryTag(body?.secondaryTag || "");
  const domain = normalizeAssemblyDomain(body?.domain || "");

  if (!projectKey || !documentKey || !blockId) {
    return NextResponse.json(
      { error: "Project, document, and block are required." },
      { status: 400 },
    );
  }

  if (!["confirm", "discard"].includes(action)) {
    return NextResponse.json({ error: "Unsupported confirmation action." }, { status: 400 });
  }

  const currentDocument = await getWorkspaceDocumentForUser(session.user.id, documentKey);
  if (!currentDocument) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const targetBlock = (Array.isArray(currentDocument.blocks) ? currentDocument.blocks : []).find(
    (block) => block.id === blockId,
  );
  if (!targetBlock) {
    return NextResponse.json({ error: "Block not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const nextBlocks = currentDocument.blocks.map((block) => {
    if (block.id !== blockId) return block;

    if (action === "discard") {
      return {
        ...block,
        primaryTag: ASSEMBLY_PRIMARY_TAGS.unconfirmed,
        secondaryTag: "",
        domain: "",
        confirmationStatus: ASSEMBLY_CONFIRMATION_STATUSES.discarded,
        discardedAt: now,
        resolvedAt: now,
      };
    }

    return {
      ...block,
      primaryTag: primaryTag || block.suggestedPrimaryTag || ASSEMBLY_PRIMARY_TAGS.story,
      secondaryTag:
        secondaryTag && secondaryTag !== ASSEMBLY_PRIMARY_TAGS.unconfirmed ? secondaryTag : "",
      domain: domain || block.suggestedDomain || "vision",
      confirmationStatus: ASSEMBLY_CONFIRMATION_STATUSES.confirmed,
      resolvedAt: now,
      discardedAt: null,
    };
  });

  const actionDetail =
    action === "discard"
      ? `Discarded "${targetBlock.plainText || targetBlock.text || "block"}" from active confirmation.`
      : `Confirmed "${targetBlock.plainText || targetBlock.text || "block"}" as ${primaryTag || targetBlock.suggestedPrimaryTag || "story"} in ${domain || targetBlock.suggestedDomain || "vision"}.`;
  const nextLogEntries = [
    ...(currentDocument.logEntries || []),
    createWorkspaceLogEntry({
      action: action === "discard" ? "DISCARDED" : "CONFIRMED",
      detail: actionDetail,
      documentKey,
      blockIds: [blockId],
    }),
  ];

  const savedDocument = await saveWorkspaceDocumentForUser(session.user.id, {
    documentKey,
    title: currentDocument.title,
    subtitle: currentDocument.subtitle || "",
    blocks: nextBlocks,
    logEntries: nextLogEntries,
    baseUpdatedAt: currentDocument.updatedAt,
  });

  const [allDocuments, rawProject] = await Promise.all([
    listReaderDocumentsForUser(session.user.id),
    getReaderProjectForUser(session.user.id, projectKey),
  ]);
  const hydratedProjects = await listReaderProjectsForUser(session.user.id, allDocuments);
  const hydratedProject = getProjectByKey(hydratedProjects, projectKey);
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
  const resolvedPrimaryTag =
    action === "discard"
      ? ASSEMBLY_PRIMARY_TAGS.unconfirmed
      : primaryTag || targetBlock.suggestedPrimaryTag || ASSEMBLY_PRIMARY_TAGS.story;
  const resolvedDomain = action === "discard" ? "" : domain || targetBlock.suggestedDomain || "vision";
  const nextEvents = [
    buildAssemblyIndexEvent(action === "discard" ? "block_discarded" : "block_confirmed", {
      declaration,
      move:
        action === "discard"
          ? `Discarded a queued block from ${currentDocument.title || "the source"}.`
          : `Confirmed ${resolvedPrimaryTag} in ${resolvedDomain || "vision"} from ${currentDocument.title || "the source"}.`,
      return: `${nextStateSummary.unconfirmedCount} unconfirmed block${nextStateSummary.unconfirmedCount === 1 ? "" : "s"} remain in the box.`,
      echo:
        nextStateSummary.current && nextStateSummary.current !== previousState
          ? `${previousState || "declare-root"} -> ${nextStateSummary.current}`
          : "state unchanged",
      context: {
        documentKey,
        primaryDocumentKey: documentKey,
        relatedSourceDocumentKeys: [documentKey],
        blockId,
        primaryTag: resolvedPrimaryTag,
        domain: resolvedDomain,
        unconfirmedCount: nextStateSummary.unconfirmedCount,
      },
    }),
  ];
  const nextStateHistory = Array.isArray(currentMeta?.stateHistory)
    ? [...currentMeta.stateHistory]
    : [];

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
          reason: action === "discard" ? "confirmation discard" : "block confirmation",
        },
      }),
    );
    nextStateHistory.push({
      state: nextStateSummary.current,
      at: now,
      reason: action === "discard" ? "confirmation discard" : "block confirmation",
      receiptId: "",
    });
  }

  await updateReaderProjectForUser(session.user.id, projectKey, {
    assemblyState: {
      current: nextStateSummary.current,
      updatedAt: now,
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
    document: savedDocument,
    state: nextStateSummary,
  });
}
