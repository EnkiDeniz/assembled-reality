import { NextResponse } from "next/server";
import { ingestPastedDocument } from "@/lib/document-import";
import {
  createReaderDocumentForUser,
  getReaderDocumentDataForUser,
} from "@/lib/reader-documents";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePasteMode(value) {
  return value === "clipboard" ? "clipboard" : value === "source" ? "source" : "";
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const projectKey = String(body?.projectKey || "").trim();
    const mode = normalizePasteMode(String(body?.mode || "").trim().toLowerCase());

    if (!mode) {
      return NextResponse.json({ error: "Choose a paste target." }, { status: 400 });
    }

    const imported = await ingestPastedDocument({
      html: body?.html || "",
      text: body?.text || "",
      mode,
    });

    const summary = await createReaderDocumentForUser(session.user.id, {
      title: imported.title,
      subtitle: imported.subtitle,
      projectKey,
      format: imported.format,
      mimeType: "text/markdown",
      contentMarkdown: imported.contentMarkdown,
      wordCount: imported.wordCount,
      sectionCount: imported.sectionCount,
      sourceFiles: [],
      intakeKind: mode === "clipboard" ? "paste-clipboard" : "paste-source",
      intakeDiagnostics: imported.diagnostics || [],
      hiddenFromProjectHome: mode === "clipboard",
    });
    const document = await getReaderDocumentDataForUser(session.user.id, summary.documentKey);

    if (!document) {
      throw new Error("The pasted source was created, but could not be loaded.");
    }

    const intake = {
      format: imported.format,
      diagnostics: imported.diagnostics || [],
    };

    if (mode === "clipboard") {
      return NextResponse.json({
        ok: true,
        sourceDocument: document,
        blocks: Array.isArray(document.blocks) ? document.blocks : [],
        intake,
      });
    }

    return NextResponse.json({
      ok: true,
      document,
      intake,
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: error?.code || null,
        error: error instanceof Error ? error.message : "Could not paste into the workspace.",
      },
      { status: 400 },
    );
  }
}
