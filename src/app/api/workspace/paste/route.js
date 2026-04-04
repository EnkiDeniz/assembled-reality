import { NextResponse } from "next/server";
import { ingestPastedDocument } from "@/lib/document-import";
import {
  buildImageAssetDraft,
  deriveMarkdownFromImage,
  normalizeImageDerivationMode,
  parseImageDataUrl,
  uploadImageAssetToBlob,
} from "@/lib/image-intake";
import {
  createImageDerivedDocumentForUser,
  createReaderDocumentForUser,
  getReaderDocumentDataForUser,
} from "@/lib/reader-documents";
import { getRequiredSession } from "@/lib/server-session";
import {
  createSourceProvenanceSeed,
  createSourceTrustProfileSeed,
  SOURCE_MODALITIES,
  SOURCE_ORIGINS,
} from "@/lib/source-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePasteMode(value) {
  if (value === "clipboard") {
    return { target: "clipboard", derivationMode: "" };
  }

  if (value === "source-image-document") {
    return { target: "source", derivationMode: "document" };
  }

  if (value === "source-image-notes") {
    return { target: "source", derivationMode: "notes" };
  }

  if (value === "source") {
    return { target: "source", derivationMode: "" };
  }

  return { target: "", derivationMode: "" };
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const projectKey = String(body?.projectKey || "").trim();
    const parsedMode = normalizePasteMode(String(body?.mode || "").trim().toLowerCase());
    const derivationMode =
      parsedMode.derivationMode ||
      normalizeImageDerivationMode(String(body?.derivationMode || "").trim());
    const imageDataUrl = String(body?.imageDataUrl || "").trim();
    const imageMimeType = String(body?.imageMimeType || "").trim();
    const imageFilename = String(body?.imageFilename || "").trim();

    if (!parsedMode.target) {
      return NextResponse.json({ error: "Choose a paste target." }, { status: 400 });
    }

    if (imageDataUrl) {
      if (parsedMode.target !== "source") {
        return NextResponse.json(
          { error: "Images are imported as source documents for now." },
          { status: 400 },
        );
      }

      if (!derivationMode) {
        return NextResponse.json(
          { error: "Choose whether to convert this image into a document or source notes." },
          { status: 400 },
        );
      }

      const { buffer, mimeType } = parseImageDataUrl(imageDataUrl, imageFilename);
      const derived = await deriveMarkdownFromImage({
        buffer,
        mimeType: imageMimeType || mimeType,
        filename: imageFilename,
        derivationMode,
      });
      const assetDraft = buildImageAssetDraft({
        buffer,
        mimeType: imageMimeType || mimeType,
        originalFilename: imageFilename || "clipboard-image.png",
        projectKey,
        userId: session.user.id,
      });
      const sourceAsset = await uploadImageAssetToBlob(assetDraft, buffer);
      const created = await createImageDerivedDocumentForUser(session.user.id, {
        title: derived.title,
        subtitle: derived.subtitle,
        projectKey,
        originalFilename: imageFilename || "clipboard-image.png",
        mimeType: imageMimeType || mimeType,
        blocks: derived.blocks,
        wordCount: derived.wordCount,
        sectionCount: derived.sectionCount,
        intakeKind: `paste-image-${derivationMode}`,
        intakeDiagnostics: derived.diagnostics || [],
        derivationKind: derived.derivationKind,
        derivationModel: derived.derivationModel,
        derivationStatus: derived.derivationStatus,
        sourceAsset: {
          ...sourceAsset,
          originalFilename: imageFilename || null,
        },
        sourceProvenance: createSourceProvenanceSeed({
          modality: SOURCE_MODALITIES.image,
          origin: SOURCE_ORIGINS.pasted,
          captureMethod: `clipboard-image:${derivationMode}`,
          capturedAt: new Date().toISOString(),
          sourceLabel: derived.title,
          transformationHistory: [
            `pasted-image:${derivationMode}`,
            derived.derivationKind,
            derived.derivationModel ? `model:${derived.derivationModel}` : "",
          ],
        }),
        sourceTrustProfile: createSourceTrustProfileSeed({
          basis: "visual-signal",
          verification: "captured",
          trustLevelHint: "L2",
          summary:
            "Visual signal pasted into the box. Derived description is normalized from the image, not automatic truth.",
        }),
      });

      return NextResponse.json({
        ok: true,
        document: created.document,
        sourceAsset: created.sourceAsset,
        intake: {
          format: "markdown",
          diagnostics: derived.diagnostics || [],
        },
        derivation: {
          kind: derived.derivationKind,
          mode: derivationMode,
          model: derived.derivationModel,
        },
      });
    }

    const imported = await ingestPastedDocument({
      html: body?.html || "",
      text: body?.text || "",
      mode: parsedMode.target,
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
      intakeKind: parsedMode.target === "clipboard" ? "paste-clipboard" : "paste-source",
      intakeDiagnostics: imported.diagnostics || [],
      hiddenFromProjectHome: parsedMode.target === "clipboard",
      sourceProvenance: createSourceProvenanceSeed({
        modality: SOURCE_MODALITIES.text,
        origin: SOURCE_ORIGINS.pasted,
        captureMethod: parsedMode.target === "clipboard" ? "clipboard-selection" : "clipboard-source",
        capturedAt: new Date().toISOString(),
        sourceLabel: imported.title,
        transformationHistory: [
          parsedMode.target === "clipboard" ? "paste:clipboard" : "paste:source",
        ],
      }),
      sourceTrustProfile: createSourceTrustProfileSeed({
        basis: "pasted-text",
        verification: "normalized",
        trustLevelHint: "L2",
        summary:
          "Pasted text preserved in the box. It is readable and attributable to a paste event, but not independently verified.",
      }),
    });
    const document = await getReaderDocumentDataForUser(session.user.id, summary.documentKey);

    if (!document) {
      throw new Error("The pasted source was created, but could not be loaded.");
    }

    const intake = {
      format: imported.format,
      diagnostics: imported.diagnostics || [],
    };

    if (parsedMode.target === "clipboard") {
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
