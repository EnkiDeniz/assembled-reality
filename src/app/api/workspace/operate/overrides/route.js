import { NextResponse } from "next/server";
import { getReaderDocumentDataForUser, listReaderDocumentsForUser } from "@/lib/reader-documents";
import { buildOperateOverrideSummary, getOverrideExcerptSnapshot } from "@/lib/operate-overlay";
import {
  deleteReaderAttestedOverrideForUser,
  listReaderAttestedOverridesForUser,
  upsertReaderAttestedOverrideForUser,
} from "@/lib/reader-operate";
import { getProjectByKey } from "@/lib/project-model";
import { listReaderProjectsForUser } from "@/lib/reader-projects";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";

async function loadOperateOverrideContext(userId, { projectKey = "", documentKey = "" } = {}) {
  const documents = await listReaderDocumentsForUser(userId);
  const projects = await listReaderProjectsForUser(userId, documents);
  const activeProject = projectKey ? getProjectByKey(projects, projectKey) : null;
  const targetDocument = documentKey
    ? await getReaderDocumentDataForUser(userId, documentKey)
    : null;

  return {
    activeProject,
    targetDocument,
  };
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const documentKey = String(body?.documentKey || "").trim();
  const blockId = String(body?.blockId || "").trim();
  const note = String(body?.note || "").trim();
  const spanStart = Number.isInteger(body?.spanStart) ? body.spanStart : null;
  const spanEnd = Number.isInteger(body?.spanEnd) ? body.spanEnd : null;

  if (!documentKey || !blockId || !note) {
    return NextResponse.json(
      { ok: false, error: "Document key, block id, and note are required." },
      { status: 400 },
    );
  }

  const { activeProject, targetDocument } = await loadOperateOverrideContext(session.user.id, {
    projectKey,
    documentKey,
  });

  if (!targetDocument?.documentKey) {
    return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  }

  const targetBlock = (Array.isArray(targetDocument.blocks) ? targetDocument.blocks : []).find(
    (block) => String(block?.id || "").trim() === blockId,
  );
  if (!targetBlock) {
    return NextResponse.json({ ok: false, error: "Block not found." }, { status: 404 });
  }

  const override = await upsertReaderAttestedOverrideForUser(session.user.id, {
    projectId: activeProject?.id || null,
    documentKey,
    blockId,
    spanStart,
    spanEnd,
    excerptSnapshot: getOverrideExcerptSnapshot(targetBlock, spanStart, spanEnd),
    note,
  });
  const overrides = await listReaderAttestedOverridesForUser(session.user.id, {
    projectId: activeProject?.id || null,
    documentKey,
  });
  const overrideSummary = buildOperateOverrideSummary(overrides, targetDocument);

  return NextResponse.json({
    ok: true,
    override,
    overrideSummary,
  });
}

export async function DELETE(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const overrideId = String(searchParams.get("id") || "").trim();
  const projectKey = String(searchParams.get("projectKey") || "").trim();
  const documentKey = String(searchParams.get("documentKey") || "").trim();

  if (!overrideId || !documentKey) {
    return NextResponse.json(
      { ok: false, error: "Override id and document key are required." },
      { status: 400 },
    );
  }

  const { activeProject, targetDocument } = await loadOperateOverrideContext(session.user.id, {
    projectKey,
    documentKey,
  });
  const result = await deleteReaderAttestedOverrideForUser(session.user.id, overrideId);
  const overrides = await listReaderAttestedOverridesForUser(session.user.id, {
    projectId: activeProject?.id || null,
    documentKey,
  });
  const overrideSummary = buildOperateOverrideSummary(overrides, targetDocument);

  return NextResponse.json({
    ok: true,
    removed: result.removed,
    overrideSummary,
  });
}
