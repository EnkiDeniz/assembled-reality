import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import { getParsedDocument } from "@/lib/document";
import { buildReadingReceiptPayload } from "@/lib/getreceipts";
import {
  createReadingReceiptDraftForUser,
  loadReaderPageData,
} from "@/lib/reader-db";

export const dynamic = "force-dynamic";

function pickSourceSections(documentData, slugs) {
  const wanted = new Set(slugs);
  return documentData.sections.filter((section) => wanted.has(section.slug));
}

function pickMarks(annotations, markIds) {
  const wanted = new Set(markIds);
  return [...annotations.highlights, ...annotations.notes].filter((mark) => wanted.has(mark.id));
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const sourceSections = Array.isArray(body?.sourceSections) ? body.sourceSections : [];
  const sourceMarkIds = Array.isArray(body?.sourceMarkIds) ? body.sourceMarkIds : [];

  const [documentData, readerData] = await Promise.all([
    Promise.resolve(getParsedDocument()),
    loadReaderPageData(session.user.id),
  ]);

  if (!readerData?.profile) {
    return NextResponse.json({ error: "Reader profile not found" }, { status: 404 });
  }

  const sections = pickSourceSections(documentData, sourceSections);
  const marks = pickMarks(readerData.annotations, sourceMarkIds);
  const payload = buildReadingReceiptPayload({
    profile: readerData.profile,
    sections,
    marks,
    learned: body?.learned || "",
  });

  const draft = await createReadingReceiptDraftForUser(session.user.id, {
    title: body?.title || `Reading receipt · ${sections[0]?.title || "Beginning"}`,
    sourceSections,
    sourceMarkIds,
    payload,
  });

  return NextResponse.json({
    ok: true,
    draft: {
      id: draft.id,
      status: draft.status,
      title: draft.title,
      sourceSections: draft.sourceSections,
      sourceMarkIds: draft.sourceMarkIds,
      payload,
    },
  });
}
