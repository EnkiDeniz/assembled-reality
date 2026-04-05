import "server-only";

import { appEnv } from "@/lib/env";
import { PRODUCT_NAME } from "@/lib/product-language";
import { normalizeProjectArchitectureMeta } from "@/lib/assembly-architecture";
import { getSeedDocument, getSeedSectionsFromDocument } from "@/lib/seed-model";
import { buildExcerpt } from "@/lib/text";

const RECEIPT_AUDIT_CHECKS = Object.freeze([
  { key: "root-alignment", label: "Root alignment", hardBlock: true },
  { key: "evidence-contact", label: "Evidence contact", hardBlock: true },
  { key: "seed-alignment", label: "Seed alignment", hardBlock: false },
]);

const ROOT_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "then",
  "this",
  "to",
  "was",
  "we",
  "will",
  "with",
]);

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function normalizeStatus(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "pass" || normalized === "warn" || normalized === "fail") {
    return normalized;
  }
  return "warn";
}

function tokenize(value = "") {
  return unique(
    normalizeText(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length >= 4 && !ROOT_STOPWORDS.has(entry)),
  );
}

function countTermMatches(terms = [], text = "") {
  const normalized = normalizeText(text).toLowerCase();
  return terms.filter((term) => normalized.includes(term));
}

function extractResponseText(payload) {
  const output = Array.isArray(payload?.output) ? payload.output : [];
  const parts = [];

  output.forEach((item) => {
    const content = Array.isArray(item?.content) ? item.content : [];
    content.forEach((entry) => {
      if (
        (entry?.type === "output_text" || entry?.type === "text") &&
        typeof entry?.text === "string"
      ) {
        parts.push(entry.text);
      }
    });
  });

  return parts.join("\n\n").trim();
}

function parseJsonObject(text = "") {
  const normalized = String(text || "").trim();
  if (!normalized) return null;

  try {
    return JSON.parse(normalized);
  } catch {
    // Ignore the first parse failure and try to recover from wrapped output.
  }

  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(normalized.slice(start, end + 1));
  } catch {
    return null;
  }
}

function summarizeAuditChecks(checks = []) {
  const normalizedChecks = Array.isArray(checks) ? checks.filter(Boolean) : [];
  const firstHardFail = normalizedChecks.find((check) => check.hardBlock && check.status === "fail");
  if (firstHardFail?.message) {
    return firstHardFail.message;
  }

  const firstWarning = normalizedChecks.find((check) => check.status === "warn");
  if (firstWarning?.message) {
    return firstWarning.message;
  }

  return "Root, evidence, and seed are aligned enough to seal.";
}

function normalizeAuditChecks(candidateChecks = [], fallbackChecks = []) {
  const candidateMap = new Map(
    (Array.isArray(candidateChecks) ? candidateChecks : [])
      .filter(Boolean)
      .map((entry) => [String(entry?.key || "").trim().toLowerCase(), entry]),
  );

  return RECEIPT_AUDIT_CHECKS.map((definition) => {
    const fallback =
      fallbackChecks.find((entry) => entry?.key === definition.key) || definition;
    const candidate = candidateMap.get(definition.key) || null;
    const fallbackStatus = normalizeStatus(fallback.status || (definition.hardBlock ? "fail" : "warn"));

    return {
      key: definition.key,
      label: definition.label,
      hardBlock: Boolean(definition.hardBlock),
      status:
        fallback.hardBlock && fallbackStatus === "fail"
          ? "fail"
          : normalizeStatus(candidate?.status || fallbackStatus),
      message:
        normalizeText(candidate?.message) ||
        normalizeText(fallback.message) ||
        `${definition.label} needs review before sealing.`,
    };
  });
}

function finalizeAuditResult(result = {}, fallbackChecks = [], usedFallback = false) {
  const checks = normalizeAuditChecks(result.checks, fallbackChecks);
  const hardFailure = checks.some((check) => check.hardBlock && check.status === "fail");
  const advisoryFailure = checks.some(
    (check) => check.status === "warn" || (!check.hardBlock && check.status === "fail"),
  );

  return {
    sealReady: !hardFailure && !advisoryFailure,
    canOverride: !hardFailure,
    usedFallback,
    summary: normalizeText(result.summary) || summarizeAuditChecks(checks),
    checks,
  };
}

function buildFallbackAudit({
  root,
  deltaStatement = "",
  evidenceSnapshot = null,
  seedAim = "",
}) {
  const normalizedDelta = normalizeText(deltaStatement);
  const normalizedRoot = normalizeText(root?.text);
  const normalizedGloss = normalizeText(root?.gloss);
  const normalizedSeedAim = normalizeText(seedAim);
  const rootTerms = tokenize(`${normalizedRoot} ${normalizedGloss}`);
  const deltaMatches = countTermMatches(rootTerms, normalizedDelta);
  const seedMatches = countTermMatches(rootTerms, normalizedSeedAim);
  const evidenceText = (evidenceSnapshot?.blocks || [])
    .map((block) => normalizeText(block?.textExcerpt || ""))
    .join(" ");
  const seedTerms = tokenize(normalizedSeedAim);
  const deltaSeedMatches = countTermMatches(seedTerms, normalizedDelta);
  const evidenceSeedMatches = countTermMatches(seedTerms, evidenceText);
  const evidenceBlockCount = Number(evidenceSnapshot?.blockCount) || 0;
  const evidenceDomains = Array.isArray(evidenceSnapshot?.domains)
    ? evidenceSnapshot.domains.filter(Boolean)
    : [];

  const checks = [];

  if (!normalizedRoot) {
    checks.push({
      key: "root-alignment",
      label: "Root alignment",
      hardBlock: true,
      status: "fail",
      message: "Declare the Root before sealing a receipt.",
    });
  } else if (deltaMatches.length > 0 || seedMatches.length > 0) {
    checks.push({
      key: "root-alignment",
      label: "Root alignment",
      hardBlock: true,
      status: "pass",
      message: `The delta still points at the Root through ${deltaMatches.concat(seedMatches).slice(0, 2).join(", ")}.`,
    });
  } else {
    checks.push({
      key: "root-alignment",
      label: "Root alignment",
      hardBlock: true,
      status: "warn",
      message: "The delta does not restate the Root clearly. Seal only if the line still serves the declared aim.",
    });
  }

  if (!normalizedDelta) {
    checks.push({
      key: "evidence-contact",
      label: "Evidence contact",
      hardBlock: true,
      status: "fail",
      message: "Write one operator sentence describing what changed before sealing.",
    });
  } else if (!evidenceBlockCount) {
    checks.push({
      key: "evidence-contact",
      label: "Evidence contact",
      hardBlock: true,
      status: "fail",
      message: "Seal a receipt only after confirmed ◻ evidence exists in the box.",
    });
  } else {
    checks.push({
      key: "evidence-contact",
      label: "Evidence contact",
      hardBlock: true,
      status: "pass",
      message:
        evidenceDomains.length > 0
          ? `Confirmed evidence is present across ${evidenceDomains.join(", ")}.`
          : `Confirmed evidence is present across ${evidenceBlockCount} block${evidenceBlockCount === 1 ? "" : "s"}.`,
    });
  }

  if (!normalizedSeedAim) {
    checks.push({
      key: "seed-alignment",
      label: "Seed alignment",
      hardBlock: false,
      status: "warn",
      message: "The Seed Aim is empty, so this seal cannot check whether the story still matches the evidence.",
    });
  } else if (deltaSeedMatches.length > 0 || evidenceSeedMatches.length > 0) {
    checks.push({
      key: "seed-alignment",
      label: "Seed alignment",
      hardBlock: false,
      status: "pass",
      message: "The Seed Aim still overlaps with the evidence and the delta statement.",
    });
  } else {
    checks.push({
      key: "seed-alignment",
      label: "Seed alignment",
      hardBlock: false,
      status: "warn",
      message: "The Seed Aim and the current evidence are drifting apart. Seal only if you are intentionally changing the line.",
    });
  }

  return finalizeAuditResult({}, checks, true);
}

async function requestSevenReceiptAudit({
  root,
  applicableDomains = [],
  deltaStatement = "",
  seedAim = "",
  evidenceSnapshot = null,
}) {
  if (!appEnv.openai.enabled) {
    return null;
  }

  const evidenceLines = (evidenceSnapshot?.blocks || []).slice(0, 8).map((block, index) => {
    const domainLabel = normalizeText(block?.domain) || "undeclared";
    return `${index + 1}. [${domainLabel}] ${normalizeText(block?.textExcerpt || "")}`;
  });

  const systemPrompt = [
    `You are Seven, the seal auditor inside ${PRODUCT_NAME}.`,
    "Judge whether a receipt is ready to seal.",
    "Stay close to the provided Root, Seed, delta statement, and confirmed evidence.",
    "Return strict JSON only.",
    "Use three checks with these exact keys: root-alignment, evidence-contact, seed-alignment.",
    "Each check status must be one of: pass, warn, fail.",
    "Use fail only when the seal should not proceed without explicit structural repair.",
    "Use warn when the seal can proceed only as an informed override.",
  ].join(" ");

  const userPrompt = [
    "Return JSON in this shape:",
    '{"summary":"...","checks":[{"key":"root-alignment","status":"pass","message":"..."},{"key":"evidence-contact","status":"pass","message":"..."},{"key":"seed-alignment","status":"warn","message":"..."}]}',
    `Root: ${normalizeText(root?.text) || "(missing)"}`,
    `Root gloss: ${normalizeText(root?.gloss) || "(missing)"}`,
    `Applicable domains: ${(Array.isArray(applicableDomains) ? applicableDomains : []).join(", ") || "(none)"}`,
    `Seed Aim: ${normalizeText(seedAim) || "(missing)"}`,
    `Delta statement: ${normalizeText(deltaStatement) || "(missing)"}`,
    `Confirmed evidence block count: ${Number(evidenceSnapshot?.blockCount) || 0}`,
    `Evidence domains: ${(evidenceSnapshot?.domains || []).join(", ") || "(none)"}`,
    evidenceLines.length ? `Evidence excerpts:\n${evidenceLines.join("\n")}` : "Evidence excerpts: (none)",
  ].join("\n\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appEnv.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: appEnv.openai.textModel,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return null;
    }

    return parseJsonObject(extractResponseText(payload));
  } catch {
    return null;
  }
}

export function listConfirmedEvidenceBlocksFromDocuments(documents = []) {
  return (Array.isArray(documents) ? documents : [])
    .filter(
      (document) =>
        document &&
        !document.isAssembly &&
        document.documentType !== "assembly" &&
        document.documentType !== "builtin" &&
        document.sourceType !== "builtin",
    )
    .flatMap((document) => {
      const sourceTitle = document?.title || "Untitled document";
      return (Array.isArray(document?.blocks) ? document.blocks : [])
        .filter(
          (block) =>
            String(block?.confirmationStatus || "").trim().toLowerCase() === "confirmed" &&
            String(block?.primaryTag || "").trim().toLowerCase() === "evidence",
        )
        .map((block) => ({
          ...block,
          sourceTitle: block?.sourceTitle || sourceTitle,
          sourceDocumentKey: block?.sourceDocumentKey || document?.documentKey || "",
        }));
    });
}

export function buildEvidenceSnapshot(blocks = []) {
  const normalizedBlocks = Array.isArray(blocks) ? blocks : [];
  return {
    blockCount: normalizedBlocks.length,
    sourceDocumentKeys: unique(
      normalizedBlocks.map((block) => block.sourceDocumentKey || block.documentKey),
    ),
    domains: unique(normalizedBlocks.map((block) => block.domain).filter(Boolean)),
    blocks: normalizedBlocks.map((block, index) => ({
      order: index,
      blockId: block.id,
      sourceDocumentKey: block.sourceDocumentKey || block.documentKey || "",
      sourceTitle: block.sourceTitle || "",
      sourcePosition: Number.isFinite(Number(block.sourcePosition)) ? Number(block.sourcePosition) : index,
      extractionPassId: block.extractionPassId || null,
      domain: block.domain || "",
      sevenStage: Number.isFinite(Number(block.sevenStage)) ? Number(block.sevenStage) : null,
      textExcerpt: buildExcerpt(block.plainText || block.text || "", 180),
    })),
  };
}

export async function buildReceiptSealAudit({
  project = null,
  projectDocuments = [],
  targetDocument = null,
  deltaStatement = "",
} = {}) {
  const meta = normalizeProjectArchitectureMeta(project?.metadataJson || project?.architectureMeta || null);
  const seedDocument = getSeedDocument(project, projectDocuments, project?.currentAssemblyDocumentKey || "");
  const seedSections = getSeedSectionsFromDocument(seedDocument);
  const evidenceDocuments =
    Array.isArray(projectDocuments) && projectDocuments.length
      ? projectDocuments
      : targetDocument
        ? [targetDocument]
        : [];
  const confirmedEvidenceBlocks = listConfirmedEvidenceBlocksFromDocuments(evidenceDocuments);
  const evidenceSnapshot = buildEvidenceSnapshot(confirmedEvidenceBlocks);
  const applicableDomains = meta.applicableDomains.length
    ? meta.applicableDomains
    : [];
  const fallbackAudit = buildFallbackAudit({
    root: meta.root,
    deltaStatement,
    evidenceSnapshot,
    seedAim: seedSections.aim,
  });
  const sevenAudit = await requestSevenReceiptAudit({
    root: meta.root,
    applicableDomains,
    deltaStatement,
    seedAim: seedSections.aim,
    evidenceSnapshot,
  });
  const auditResult = sevenAudit
    ? finalizeAuditResult(sevenAudit, fallbackAudit.checks, false)
    : fallbackAudit;

  return {
    ...auditResult,
    root: meta.root,
    evidenceSnapshot,
    seedAim: seedSections.aim,
    applicableDomains,
  };
}
