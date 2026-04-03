import { NextResponse } from "next/server";
import {
  ingestUploadedDocument,
  MAX_DOCUMENT_UPLOAD_BYTES,
} from "@/lib/document-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

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

    return NextResponse.json({
      ok: true,
      imported,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "The document could not be imported.",
      },
      { status: 400 },
    );
  }
}
