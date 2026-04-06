import { NextResponse } from "next/server";
import { getProjectByKey, getProjectDocuments } from "@/lib/project-model";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { getReadingReceiptDraftByIdForUser } from "@/lib/reader-db";
import { buildOperateOverrideSummary } from "@/lib/operate-overlay";
import {
  getLatestReaderOperateRunForUser,
  listReaderAttestedOverridesForUser,
} from "@/lib/reader-operate";
import { getReaderProjectForUser, listReaderProjectsForUser } from "@/lib/reader-projects";
import { buildReceiptSealAudit } from "@/lib/receipt-seal-audit";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const draftId = String(body?.draftId || "").trim();
  const deltaStatement = String(body?.deltaStatement || "").trim();
  const projectKey = String(body?.projectKey || "").trim();

  if (!draftId) {
    return NextResponse.json({ error: "Receipt draft is required." }, { status: 400 });
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
  const projectDocuments = projectKey
    ? getProjectDocuments(allDocuments, hydratedProject)
    : targetDocument
      ? [targetDocument]
      : [];

  const audit = await buildReceiptSealAudit({
    project: hydratedProject || rawProject,
    projectDocuments,
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

  return NextResponse.json({
    ok: true,
    audit: enrichedAudit,
  });
}
