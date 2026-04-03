import { NextResponse } from "next/server";
import { createReaderDocumentForUser } from "@/lib/reader-documents";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function trimString(value) {
  return String(value || "").trim();
}

function normalizeDocumentFormat(value) {
  const normalized = trimString(value).toLowerCase();
  if (normalized === "doc" || normalized === "docx" || normalized === "pdf") {
    return normalized;
  }

  return "markdown";
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const contentMarkdown = trimString(body?.contentMarkdown);
  const title = trimString(body?.title);

  if (!title || !contentMarkdown) {
    return NextResponse.json(
      { error: "A title and normalized document content are required." },
      { status: 400 },
    );
  }

  const document = await createReaderDocumentForUser(session.user.id, {
    title,
    subtitle: trimString(body?.subtitle),
    format: normalizeDocumentFormat(body?.format),
    originalFilename: trimString(body?.originalFilename),
    mimeType: trimString(body?.mimeType),
    contentMarkdown,
    wordCount: Math.max(0, Number(body?.wordCount) || 0),
    sectionCount: Math.max(0, Number(body?.sectionCount) || 0),
  });

  return NextResponse.json({
    ok: true,
    document,
  });
}
