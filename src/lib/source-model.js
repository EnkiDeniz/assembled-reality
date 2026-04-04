const SOURCE_MODALITIES = Object.freeze({
  text: "text",
  voice: "voice",
  image: "image",
  link: "link",
  humanState: "human-state",
  derived: "derived",
  assembly: "assembly",
  receipt: "receipt",
});

const SOURCE_ORIGINS = Object.freeze({
  builtin: "builtin",
  uploaded: "uploaded",
  pasted: "pasted",
  linked: "linked",
  spoken: "spoken",
  derived: "derived",
  assembled: "assembled",
  received: "received",
  unknown: "unknown",
});

function normalizeText(value, fallback = "") {
  const trimmed = String(value || "").trim();
  return trimmed || fallback;
}

function isBuiltIn(document = null) {
  return (
    document?.documentType === "builtin" ||
    document?.sourceType === "builtin" ||
    String(document?.intakeKind || "").trim().toLowerCase() === "builtin"
  );
}

function getDocumentAssets(document = null) {
  return Array.isArray(document?.sourceAssets) ? document.sourceAssets.filter(Boolean) : [];
}

function getPrimaryAsset(document = null, assets = []) {
  const resolvedAssets = Array.isArray(assets) && assets.length ? assets : getDocumentAssets(document);
  return resolvedAssets[0] || null;
}

export function createSourceProvenanceSeed({
  modality = SOURCE_MODALITIES.text,
  origin = SOURCE_ORIGINS.unknown,
  captureMethod = "",
  capturedAt = null,
  capturedBy = "operator",
  sourceUrl = null,
  sourceLabel = "",
  transformationHistory = [],
} = {}) {
  return {
    modality,
    origin,
    captureMethod: normalizeText(captureMethod, origin),
    capturedAt: capturedAt || null,
    capturedBy: normalizeText(capturedBy, "operator"),
    attributionStatus: capturedBy && capturedBy !== "operator" ? "attributed" : "operator",
    sourceUrl: sourceUrl || null,
    sourceLabel: normalizeText(sourceLabel, "Untitled source"),
    transformationHistory: Array.isArray(transformationHistory)
      ? transformationHistory.filter(Boolean)
      : [],
  };
}

export function createSourceTrustProfileSeed({
  basis = "uploaded-text",
  verification = "normalized",
  trustLevelHint = "L2",
  summary = "",
} = {}) {
  return {
    basis: normalizeText(basis, "uploaded-text"),
    verification: normalizeText(verification, "normalized"),
    trustLevelHint: normalizeText(trustLevelHint, "L2"),
    summary: normalizeText(summary),
  };
}

export function inferSourceModality(document = null, assets = []) {
  if (!document) return SOURCE_MODALITIES.text;
  if (document?.documentType === "assembly" || document?.isAssembly) {
    return SOURCE_MODALITIES.assembly;
  }

  const primaryAsset = getPrimaryAsset(document, assets);
  const assetKind = String(primaryAsset?.kind || "").trim().toLowerCase();
  if (assetKind === "audio") return SOURCE_MODALITIES.voice;
  if (assetKind === "image") return SOURCE_MODALITIES.image;
  if (assetKind === "link") return SOURCE_MODALITIES.link;

  const intakeKind = String(document?.intakeKind || "").trim().toLowerCase();
  const derivationKind = String(document?.derivationKind || "").trim().toLowerCase();

  if (intakeKind.includes("audio") || intakeKind.includes("voice") || derivationKind.includes("audio")) {
    return SOURCE_MODALITIES.voice;
  }
  if (intakeKind.includes("image") || derivationKind.includes("image") || derivationKind.includes("ocr")) {
    return SOURCE_MODALITIES.image;
  }
  if (intakeKind.includes("link") || derivationKind.includes("link")) {
    return SOURCE_MODALITIES.link;
  }

  if (document?.documentType === "receipt") {
    return SOURCE_MODALITIES.receipt;
  }

  return SOURCE_MODALITIES.text;
}

export function inferSourceOrigin(document = null, assets = []) {
  if (!document) return SOURCE_ORIGINS.unknown;
  if (isBuiltIn(document)) return SOURCE_ORIGINS.builtin;
  if (document?.documentType === "assembly" || document?.isAssembly) {
    return SOURCE_ORIGINS.assembled;
  }

  const primaryAsset = getPrimaryAsset(document, assets);
  const intakeKind = String(document?.intakeKind || "").trim().toLowerCase();

  if (primaryAsset?.kind === "LINK" || intakeKind.includes("link")) {
    return SOURCE_ORIGINS.linked;
  }
  if (primaryAsset?.kind === "AUDIO" || intakeKind.includes("voice") || intakeKind.includes("audio")) {
    return SOURCE_ORIGINS.spoken;
  }
  if (intakeKind.startsWith("paste")) {
    return SOURCE_ORIGINS.pasted;
  }
  if (intakeKind.startsWith("upload")) {
    return SOURCE_ORIGINS.uploaded;
  }
  if (document?.derivationKind) {
    return SOURCE_ORIGINS.derived;
  }

  return SOURCE_ORIGINS.uploaded;
}

function buildTransformationHistory(document = null, assets = []) {
  const history = [];
  const primaryAsset = getPrimaryAsset(document, assets);

  const origin = inferSourceOrigin(document, assets);
  const modality = inferSourceModality(document, assets);

  history.push(`${origin}:${modality}`);

  if (document?.derivationKind) {
    history.push(`derived:${String(document.derivationKind).trim().toLowerCase()}`);
  }

  if (document?.derivationModel) {
    history.push(`model:${String(document.derivationModel).trim()}`);
  }

  if (primaryAsset?.metadata?.contentType || primaryAsset?.mimeType) {
    history.push(`asset:${primaryAsset.metadata?.contentType || primaryAsset.mimeType}`);
  }

  return history.filter(Boolean);
}

export function buildSourceProvenance(document = null, assets = []) {
  const primaryAsset = getPrimaryAsset(document, assets);
  const modality = inferSourceModality(document, assets);
  const origin = inferSourceOrigin(document, assets);
  const capturedAt =
    normalizeText(document?.updatedAt) ||
    normalizeText(document?.createdAt) ||
    normalizeText(primaryAsset?.updatedAt) ||
    normalizeText(primaryAsset?.createdAt) ||
    "";
  const sourceUrl = primaryAsset?.canonicalUrl || primaryAsset?.sourceUrl || primaryAsset?.blobUrl || "";

  return {
    modality,
    origin,
    captureMethod: normalizeText(document?.intakeKind, origin),
    capturedAt: capturedAt || null,
    capturedBy: primaryAsset?.metadata?.capturedBy || primaryAsset?.metadata?.author || "operator",
    attributionStatus: primaryAsset?.metadata?.capturedBy ? "attributed" : "operator",
    sourceUrl: sourceUrl || null,
    sourceLabel: primaryAsset?.label || document?.originalFilename || document?.title || "Untitled source",
    transformationHistory: buildTransformationHistory(document, assets),
  };
}

export function buildSourceTrustProfile(document = null, assets = []) {
  const modality = inferSourceModality(document, assets);
  const origin = inferSourceOrigin(document, assets);
  const primaryAsset = getPrimaryAsset(document, assets);

  if (isBuiltIn(document)) {
    return {
      basis: "built-in-guide",
      verification: "reference",
      trustLevelHint: "guide",
      summary: "Built-in reference inside the box. Useful for orientation, excluded from Operate by default.",
    };
  }

  if (document?.documentType === "assembly" || document?.isAssembly) {
    return {
      basis: "assembled-position",
      verification: "constructed",
      trustLevelHint: "working",
      summary: "Current seed of the box. Useful for Create and Operate, not independent proof.",
    };
  }

  if (modality === SOURCE_MODALITIES.link) {
    return {
      basis: "captured-link",
      verification: primaryAsset?.canonicalUrl ? "captured" : "normalized",
      trustLevelHint: "L2",
      summary: "Readable linked material captured into the box. Provenance is explicit; verification is separate.",
    };
  }

  if (modality === SOURCE_MODALITIES.image) {
    return {
      basis: "visual-signal",
      verification: primaryAsset?.blobUrl ? "captured" : "normalized",
      trustLevelHint: "L2",
      summary: "Visual signal captured into the box. Description and OCR are derived readings, not automatic truth.",
    };
  }

  if (modality === SOURCE_MODALITIES.voice) {
    return {
      basis: "recorded-voice",
      verification: primaryAsset?.blobUrl ? "captured" : "normalized",
      trustLevelHint: "L2",
      summary: "Recorded voice in the box. Transcript is normalized signal with explicit provenance.",
    };
  }

  return {
    basis: origin === SOURCE_ORIGINS.pasted ? "pasted-text" : "uploaded-text",
    verification: "normalized",
    trustLevelHint: "L2",
    summary: "Source text preserved in the box. Normalization is separate from verification.",
  };
}

export function getSourceModalityLabel(modality = SOURCE_MODALITIES.text) {
  if (modality === SOURCE_MODALITIES.voice) return "Voice";
  if (modality === SOURCE_MODALITIES.image) return "Image";
  if (modality === SOURCE_MODALITIES.link) return "Link";
  if (modality === SOURCE_MODALITIES.assembly) return "Seed";
  if (modality === SOURCE_MODALITIES.receipt) return "Receipt";
  if (modality === SOURCE_MODALITIES.humanState) return "Human state";
  return "Text";
}

export function getSourceOriginLabel(origin = SOURCE_ORIGINS.unknown) {
  if (origin === SOURCE_ORIGINS.builtin) return "Built in";
  if (origin === SOURCE_ORIGINS.uploaded) return "Uploaded";
  if (origin === SOURCE_ORIGINS.pasted) return "Pasted";
  if (origin === SOURCE_ORIGINS.linked) return "Linked";
  if (origin === SOURCE_ORIGINS.spoken) return "Spoken";
  if (origin === SOURCE_ORIGINS.derived) return "Derived";
  if (origin === SOURCE_ORIGINS.assembled) return "Assembled";
  if (origin === SOURCE_ORIGINS.received) return "Received";
  return "Source";
}

export function buildBoxSource(document = null, assets = []) {
  if (!document) return null;

  const resolvedAssets = Array.isArray(assets) && assets.length ? assets : getDocumentAssets(document);
  const modality = inferSourceModality(document, resolvedAssets);
  const origin = inferSourceOrigin(document, resolvedAssets);
  const provenance =
    document?.sourceProvenance && typeof document.sourceProvenance === "object"
      ? document.sourceProvenance
      : buildSourceProvenance(document, resolvedAssets);
  const trustProfile =
    document?.sourceTrustProfile && typeof document.sourceTrustProfile === "object"
      ? document.sourceTrustProfile
      : buildSourceTrustProfile(document, resolvedAssets);
  const sourceLabel = getSourceModalityLabel(modality);
  const originLabel = getSourceOriginLabel(origin);

  return {
    documentKey: document.documentKey,
    title: normalizeText(document.title, "Untitled source"),
    modality,
    modalityLabel: sourceLabel,
    origin,
    originLabel,
    provenance,
    trustProfile,
    documentType: normalizeText(document.documentType, "source"),
    intakeKind: normalizeText(document.intakeKind, "upload"),
    derivationKind: normalizeText(document.derivationKind),
    isBuiltIn: isBuiltIn(document),
    isAssembly: Boolean(document?.isAssembly) || document?.documentType === "assembly",
    blockCount: Array.isArray(document?.blocks)
      ? document.blocks.length
      : Number(document?.sectionCount) || 0,
    excerpt: normalizeText(document?.excerpt),
    assetCount: resolvedAssets.length,
  };
}

export function getBoxSourceMetaLine(source = null) {
  if (!source) return "";

  const parts = [];
  if (Number.isFinite(source.blockCount) && source.blockCount > 0) {
    parts.push(`${source.blockCount} block${source.blockCount === 1 ? "" : "s"}`);
  }
  parts.push(`${source.modalityLabel} source`);
  if (source.originLabel) {
    parts.push(source.originLabel.toLowerCase());
  }

  return parts.filter(Boolean).join(" · ");
}

export function getBoxSourceBadge(source = null) {
  if (!source) return "Source";
  if (source.isBuiltIn) return "Guide";
  if (source.isAssembly) return "Seed";
  return source.modalityLabel;
}

export function buildOperateSourceSummary(source = null) {
  if (!source) return "";

  return [
    `${source.modalityLabel} source`,
    source.originLabel ? `${source.originLabel.toLowerCase()}` : "",
    source.trustProfile?.summary || "",
    Array.isArray(source.provenance?.transformationHistory)
      ? source.provenance.transformationHistory.join(" → ")
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export {
  SOURCE_MODALITIES,
  SOURCE_ORIGINS,
};
