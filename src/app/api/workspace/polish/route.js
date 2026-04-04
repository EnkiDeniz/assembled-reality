import { NextResponse } from "next/server";
import {
  createReaderDocumentForUser,
  getReaderDocumentDataForUser,
} from "@/lib/reader-documents";
import { polishWorkspaceSourceDocument } from "@/lib/document-import";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildPolishedTitle(title) {
  const normalized = String(title || "").trim() || "Untitled document";
  if (/\(polished\)$/i.test(normalized)) {
    return `${normalized} copy`;
  }

  return `${normalized} (Polished)`;
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const documentKey = String(body?.documentKey || "").trim();
    const projectKey = String(body?.projectKey || "").trim();

    if (!documentKey) {
      return NextResponse.json({ error: "Document key is required." }, { status: 400 });
    }

    const sourceDocument = await getReaderDocumentDataForUser(session.user.id, documentKey);
    if (!sourceDocument) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (sourceDocument.isAssembly || sourceDocument.documentType === "assembly") {
      return NextResponse.json(
        { error: "Polish source is only available for source documents right now." },
        { status: 400 },
      );
    }

    const polished = polishWorkspaceSourceDocument({
      title: sourceDocument.title,
      subtitle: sourceDocument.subtitle || "",
      blocks: sourceDocument.blocks,
      sectionTitle: "Document",
    });

    if (!polished.changed) {
      return NextResponse.json({
        ok: true,
        unchanged: true,
        intake: {
          format: "markdown",
          diagnostics: polished.diagnostics || [],
        },
        changes: polished.stats,
      });
    }

    const summary = await createReaderDocumentForUser(session.user.id, {
      title: buildPolishedTitle(sourceDocument.title),
      subtitle: sourceDocument.subtitle || "",
      projectKey,
      format: "markdown",
      mimeType: "text/markdown",
      contentMarkdown: polished.contentMarkdown,
      wordCount: polished.wordCount,
      sectionCount: polished.sectionCount,
      sourceFiles: sourceDocument.sourceFiles,
      intakeKind: `${sourceDocument.intakeKind || "upload"}-polished`,
      sourceProvenance: sourceDocument.sourceProvenance || null,
      sourceTrustProfile: sourceDocument.sourceTrustProfile || null,
      intakeDiagnostics: [
        ...(Array.isArray(sourceDocument.intakeDiagnostics) ? sourceDocument.intakeDiagnostics : []),
        ...(Array.isArray(polished.diagnostics) ? polished.diagnostics : []),
      ],
    });
    const document = await getReaderDocumentDataForUser(session.user.id, summary.documentKey);

    return NextResponse.json({
      ok: true,
      document,
      intake: {
        format: "markdown",
        diagnostics: [
          ...(Array.isArray(sourceDocument.intakeDiagnostics) ? sourceDocument.intakeDiagnostics : []),
          ...(Array.isArray(polished.diagnostics) ? polished.diagnostics : []),
        ],
      },
      changes: polished.stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not polish this source.",
      },
      { status: 400 },
    );
  }
}
