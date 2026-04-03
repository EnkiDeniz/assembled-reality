import { NextResponse } from "next/server";
import {
  ingestUploadedDocument,
  MAX_DOCUMENT_UPLOAD_BYTES,
} from "@/lib/document-import";
import {
  createReaderDocumentForUser,
  getReaderDocumentDataForUser,
  listReaderDocumentsForUser,
} from "@/lib/reader-documents";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await listReaderDocumentsForUser(session.user.id);
  return NextResponse.json({ documents });
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const projectKey = String(formData.get("projectKey") || "").trim();

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  if (!file.size) {
    return NextResponse.json({ error: "The uploaded file was empty." }, { status: 400 });
  }

  if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: "This file is too large. Keep uploads under 15 MB for now.",
      },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const imported = await ingestUploadedDocument({
      filename: file.name,
      mimeType: file.type || "",
      buffer,
    });

    const documentSummary = await createReaderDocumentForUser(session.user.id, {
      title: imported.title,
      subtitle: imported.subtitle,
      projectKey,
      format: imported.format,
      originalFilename: file.name,
      mimeType: file.type || "",
      contentMarkdown: imported.contentMarkdown,
      wordCount: imported.wordCount,
      sectionCount: imported.sectionCount,
      intakeKind: "upload",
      intakeDiagnostics: imported.diagnostics || [],
    });
    const document = await getReaderDocumentDataForUser(session.user.id, documentSummary.documentKey);

    return NextResponse.json({
      ok: true,
      document,
      intake: {
        format: imported.format,
        diagnostics: imported.diagnostics || [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: error?.code || null,
        error:
          error instanceof Error ? error.message : "The document could not be imported.",
      },
      { status: 400 },
    );
  }
}
