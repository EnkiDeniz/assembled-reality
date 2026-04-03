import { NextResponse } from "next/server";
import { createReaderProjectForUser, getReaderProjectForUser } from "@/lib/reader-projects";
import { getRequiredSession } from "@/lib/server-session";
import {
  ingestUploadedSourceForUser,
  supportsSourceUpload,
} from "@/lib/source-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function summarizeIntakeReceipt(results = [], skipped = [], bundleName = "") {
  const totalBlocks = results.reduce(
    (count, result) => count + Number(result?.document?.sectionCount || 0),
    0,
  );

  return {
    bundleName: bundleName || "Folder intake",
    acceptedCount: results.length,
    skippedCount: skipped.length,
    totalBlockCount: totalBlocks,
    files: results.map((result) => ({
      name: result.fileName,
      documentKey: result.document?.documentKey || "",
      title: result.document?.title || result.fileName,
      blockCount: Number(result.document?.sectionCount || 0),
    })),
    skipped,
  };
}

function sanitizeBundleName(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const bundleName = sanitizeBundleName(String(formData.get("bundleName") || ""));
    let projectKey = sanitizeBundleName(String(formData.get("projectKey") || ""));
    const files = formData
      .getAll("files")
      .filter((file) => file && typeof file.arrayBuffer === "function");

    if (!files.length) {
      return NextResponse.json({ error: "Choose one or more files." }, { status: 400 });
    }

    const ingestible = files.filter((file) =>
      supportsSourceUpload({ name: file.name, type: file.type }),
    );

    if (!ingestible.length) {
      return NextResponse.json(
        { error: "No supported files were found. Use documents, images, or voice memos." },
        { status: 400 },
      );
    }

    let project = null;
    if (projectKey) {
      project = await getReaderProjectForUser(session.user.id, projectKey);
      if (!project) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
      }
    } else {
      project = await createReaderProjectForUser(session.user.id, {
        title: bundleName || "Imported Folder",
        includeDefaultSource: false,
        sourceDocumentKeys: [],
      });
      projectKey = project?.projectKey || "";
    }

    const results = [];
    const skipped = [];

    for (const file of files) {
      const fileName = file.name || "Untitled file";

      if (!supportsSourceUpload({ name: file.name, type: file.type })) {
        skipped.push({
          name: fileName,
          reason: "unsupported_type",
          error: "Unsupported file type.",
        });
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const derivationMode =
          String(file.type || "").trim().toLowerCase().startsWith("image/") ||
          /\.(png|jpe?g|webp|gif)$/i.test(file.name || "")
            ? "document"
            : "";
        const result = await ingestUploadedSourceForUser(session.user.id, {
          buffer,
          filename: file.name,
          mimeType: file.type || "",
          projectKey,
          derivationMode,
        });
        results.push({
          fileName,
          ...result,
        });
      } catch (error) {
        skipped.push({
          name: fileName,
          reason: error?.code || "ingest_failed",
          error:
            error instanceof Error ? error.message : "Could not import this file.",
        });
      }
    }

    if (!results.length) {
      return NextResponse.json(
        {
          error: "No files could be imported from this folder.",
          skipped,
        },
        { status: 400 },
      );
    }

    const intakeReceipt = summarizeIntakeReceipt(results, skipped, bundleName);

    return NextResponse.json({
      ok: true,
      project: project
        ? {
            projectKey: project.projectKey,
            title: project.title,
            subtitle: project.subtitle || "",
          }
        : {
            projectKey,
            title: bundleName || "Imported Folder",
            subtitle: "",
          },
      results: results.map((result) => ({
        fileName: result.fileName,
        document: result.document,
        sourceAsset: result.sourceAsset || null,
        derivation: result.derivation || null,
        intake: result.intake || null,
      })),
      skipped,
      intakeReceipt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: error?.code || null,
        error:
          error instanceof Error ? error.message : "Could not import this folder.",
      },
      { status: 400 },
    );
  }
}
