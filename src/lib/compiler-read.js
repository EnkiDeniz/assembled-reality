import { appEnv } from "./env.js";
import { compileSource } from "../../LoegosCLI/packages/compiler/src/index.mjs";

const CLAIM_KINDS = new Set([
  "ground",
  "protocol",
  "testable_hypothesis",
  "interpretation",
  "philosophy",
]);

const TRANSLATION_READINESS_VALUES = new Set([
  "candidate_for_translation",
  "blocked_by_structure",
  "meaningful_but_not_representable",
  "non_compilable_philosophy",
]);

const PROVENANCE_CLASSES = new Set([
  "self_reported",
  "quoted_witness",
  "external_citation",
  "unknown",
]);

const SUPPORT_STATUSES = new Set(["supported", "weakly_supported", "unsupported"]);

const DOCUMENT_TYPES = new Set(["protocol", "architecture", "theory", "essay", "mixed"]);
const DOMINANT_MODES = new Set(["ground", "interpretation", "proposal", "philosophy", "mixed"]);
const CLAUSE_HEADS = new Set(["DIR", "GND", "INT", "XFM", "MOV", "TST", "RTN", "CLS"]);

export class CompilerReadError extends Error {
  constructor(message, { status = 500, unavailable = false } = {}) {
    super(message);
    this.name = "CompilerReadError";
    this.status = status;
    this.unavailable = unavailable;
  }
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

function quoteLoeString(value = "", maxLength = 140) {
  const normalized = normalizeText(value)
    .replace(/"/g, "'")
    .replace(/\s+/g, " ");

  if (!normalized) return '"Untitled read."';
  const clipped =
    normalized.length > maxLength ? `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…` : normalized;
  return `"${clipped}"`;
}

function toIdentifier(value = "", fallback = "item") {
  const normalized = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
}

function extractOutputText(payload) {
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

function extractJsonObject(text = "") {
  const normalized = String(text || "").trim();
  if (!normalized) return null;

  try {
    return JSON.parse(normalized);
  } catch {
    // Keep trying.
  }

  const fenced = normalized.match(/```json\s*([\s\S]+?)```/i) || normalized.match(/```([\s\S]+?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // Keep trying.
    }
  }

  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(normalized.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeEnum(value, allowedValues, fallback) {
  const normalized = normalizeText(value).toLowerCase();
  return allowedValues.has(normalized) ? normalized : fallback;
}

function inferDocumentType(claims = []) {
  const kinds = new Set((Array.isArray(claims) ? claims : []).map((claim) => claim.claimKind));
  if (kinds.has("protocol") && kinds.size === 1) return "protocol";
  if (kinds.has("protocol") || kinds.has("testable_hypothesis")) return "architecture";
  if (kinds.has("philosophy") && kinds.size === 1) return "essay";
  if (kinds.has("interpretation") && kinds.size === 1) return "theory";
  return claims.length > 1 ? "mixed" : "theory";
}

function inferDominantMode(claims = []) {
  const counts = new Map();
  (Array.isArray(claims) ? claims : []).forEach((claim) => {
    const mode =
      claim.claimKind === "ground"
        ? "ground"
        : claim.claimKind === "philosophy"
          ? "philosophy"
          : claim.claimKind === "interpretation"
            ? "interpretation"
            : "proposal";
    counts.set(mode, (counts.get(mode) || 0) + 1);
  });

  const entries = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  if (!entries.length) return "mixed";
  if (entries.length > 1 && entries[0][1] === entries[1][1]) return "mixed";
  return entries[0][0];
}

function normalizeClaim(rawClaim = null, index = 0, documentText = "") {
  const claim = rawClaim && typeof rawClaim === "object" ? rawClaim : {};
  const sourceExcerpt = normalizeLongText(claim.sourceExcerpt);
  if (!sourceExcerpt) {
    throw new CompilerReadError("Seven returned a claim without a source excerpt.", {
      status: 503,
      unavailable: true,
    });
  }
  if (normalizeLongText(documentText) && !String(documentText).includes(sourceExcerpt)) {
    throw new CompilerReadError("Seven returned a claim whose source excerpt is not present in the document.", {
      status: 503,
      unavailable: true,
    });
  }

  const evidenceRefs = Array.isArray(claim.evidenceRefs)
    ? claim.evidenceRefs.map((entry) => normalizeText(entry)).filter(Boolean)
    : [];

  return {
    id: normalizeText(claim.id) || `claim_${index + 1}`,
    text: normalizeText(claim.text) || sourceExcerpt,
    claimKind: normalizeEnum(claim.claimKind, CLAIM_KINDS, "interpretation"),
    translationReadiness: normalizeEnum(
      claim.translationReadiness,
      TRANSLATION_READINESS_VALUES,
      "blocked_by_structure",
    ),
    provenanceClass: normalizeEnum(claim.provenanceClass, PROVENANCE_CLASSES, "unknown"),
    supportStatus: normalizeEnum(claim.supportStatus, SUPPORT_STATUSES, "unsupported"),
    evidenceRefs,
    reason: normalizeText(claim.reason) || "Seven classified this claim provisionally.",
    sourceExcerpt,
  };
}

function normalizeDocumentSummary(raw = null, claims = [], title = "") {
  const summary = raw && typeof raw === "object" ? raw : {};
  return {
    title: normalizeText(summary.title) || normalizeText(title) || "Untitled Dream document",
    documentType: normalizeEnum(summary.documentType, DOCUMENT_TYPES, inferDocumentType(claims)),
    dominantMode: normalizeEnum(summary.dominantMode, DOMINANT_MODES, inferDominantMode(claims)),
    summary:
      normalizeText(summary.summary) ||
      "Seven produced a provisional structural read of the active Dream document.",
  };
}

function buildPromptContext({ title = "", text = "", focus = null, strictness = null, question = null } = {}) {
  const parts = [
    title ? `Title: ${normalizeText(title)}` : "",
    focus ? `Focus: ${normalizeText(focus)}` : "",
    strictness ? `Strictness: ${normalizeText(strictness)}` : "",
    question ? `Question: ${normalizeText(question)}` : "",
    "Document:",
    normalizeLongText(text),
  ].filter(Boolean);

  return parts.join("\n\n");
}

async function extractClaimsWithSeven({
  title = "",
  text = "",
  focus = null,
  strictness = null,
  question = null,
  fetchImpl = fetch,
} = {}) {
  if (!appEnv.openai.enabled) {
    throw new CompilerReadError("Compiler Read is unavailable right now.", {
      status: 503,
      unavailable: true,
    });
  }

  const response = await fetchImpl("https://api.openai.com/v1/responses", {
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
          content: [
            {
              type: "input_text",
              text: [
                "You are Seven, performing a provisional Compiler Read inside Dream.",
                "Return strict JSON only.",
                "Never invent claims. Every claim must include a direct sourceExcerpt copied from the document.",
                "Classify claims conservatively. If a sentence is philosophical or not honestly translatable, say so.",
                "Use this shape:",
                JSON.stringify({
                  documentSummary: {
                    title: "string",
                    documentType: "protocol|architecture|theory|essay|mixed",
                    dominantMode: "ground|interpretation|proposal|philosophy|mixed",
                    summary: "string",
                  },
                  claimSet: [
                    {
                      id: "string",
                      text: "string",
                      claimKind: "ground|protocol|testable_hypothesis|interpretation|philosophy",
                      translationReadiness:
                        "candidate_for_translation|blocked_by_structure|meaningful_but_not_representable|non_compilable_philosophy",
                      provenanceClass: "self_reported|quoted_witness|external_citation|unknown",
                      supportStatus: "supported|weakly_supported|unsupported",
                      evidenceRefs: ["string"],
                      reason: "string",
                      sourceExcerpt: "string",
                    },
                  ],
                }),
                "Keep the claim set small and useful. Prefer 3 to 8 claims.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: buildPromptContext({ title, text, focus, strictness, question }) }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new CompilerReadError(`Compiler Read extraction failed (${response.status}).`, {
      status: 503,
      unavailable: true,
    });
  }

  const payload = await response.json().catch(() => null);
  const parsed = extractJsonObject(extractOutputText(payload));
  if (!parsed || !Array.isArray(parsed.claimSet)) {
    throw new CompilerReadError("Seven returned an invalid Compiler Read payload.", {
      status: 503,
      unavailable: true,
    });
  }

  return parsed;
}

function deriveAimText(claims = [], documentSummary = null) {
  const candidates = (Array.isArray(claims) ? claims : []).filter((claim) =>
    ["protocol", "testable_hypothesis", "interpretation"].includes(claim.claimKind),
  );
  return (
    normalizeText(candidates[0]?.text) ||
    normalizeText(documentSummary?.summary) ||
    "Inspect the active Dream document."
  );
}

function deriveAimClaim(claims = []) {
  return (
    (Array.isArray(claims) ? claims : []).find((claim) =>
      ["protocol", "testable_hypothesis", "interpretation"].includes(claim.claimKind),
    ) || null
  );
}

function buildWitnessSourceLabel(claim = null) {
  const primaryRef = Array.isArray(claim?.evidenceRefs) ? claim.evidenceRefs[0] : "";
  if (normalizeText(primaryRef)) return normalizeText(primaryRef);
  if (claim?.provenanceClass === "quoted_witness") return "quoted witness";
  if (claim?.provenanceClass === "external_citation") return "external citation";
  if (claim?.provenanceClass === "self_reported") return "self report";
  return "document excerpt";
}

function buildTranslatedSubset({ documentId = "", documentSummary = null, claims = [] } = {}) {
  const normalizedClaims = Array.isArray(claims) ? claims : [];
  const translatableClaims = normalizedClaims.filter(
    (claim) => claim.translationReadiness === "candidate_for_translation",
  );
  const protocolClaims = translatableClaims.filter((claim) =>
    ["protocol", "testable_hypothesis"].includes(claim.claimKind),
  );
  const witnessClaims = translatableClaims
    .filter(
      (claim) =>
        claim.claimKind === "ground" ||
        claim.provenanceClass === "quoted_witness" ||
        claim.provenanceClass === "external_citation",
    )
    .slice(0, 3);

  const lines = [];
  const usedIds = new Set();
  const boxRef = `@${toIdentifier(documentId || documentSummary?.title || "compiler_read", "compiler_read")}`;
  const aimSourceClaim = deriveAimClaim(protocolClaims.length ? protocolClaims : translatableClaims);

  if (translatableClaims.length) {
    lines.push(`GND box ${boxRef}`);
    lines.push(
      `DIR aim ${quoteLoeString(
        deriveAimText(protocolClaims.length ? protocolClaims : translatableClaims, documentSummary),
        100,
      )}`,
    );
    if (aimSourceClaim?.id) {
      usedIds.add(aimSourceClaim.id);
    }
  }

  witnessClaims.forEach((claim, index) => {
    const ref = `@${toIdentifier(claim.id, `claim_${index + 1}`)}`;
    const version = toIdentifier(claim.evidenceRefs[0] || claim.id, `v_claim_${index + 1}`);
    lines.push(
      `GND witness ${ref} from ${quoteLoeString(buildWitnessSourceLabel(claim), 48)} with ${version}`,
    );
    usedIds.add(claim.id);
  });

  const primaryProtocolClaim = protocolClaims[0] || null;
  if (primaryProtocolClaim) {
    lines.push(`MOV move ${quoteLoeString(primaryProtocolClaim.text, 108)} via manual`);
    lines.push(
      `TST test ${
        primaryProtocolClaim.supportStatus === "supported" &&
        primaryProtocolClaim.provenanceClass !== "self_reported"
          ? quoteLoeString("A cited witness can confirm or falsify this protocol step.", 108)
          : quoteLoeString("A concrete witness can confirm or falsify this protocol step.", 108)
      }`,
    );
    usedIds.add(primaryProtocolClaim.id);
  }

  const source = lines.join("\n");
  const omittedClaims = normalizedClaims
    .filter((claim) => !usedIds.has(claim.id))
    .map((claim) => claim.id);

  let translationStrategy = "No lawful subset was translated in v0.";
  if (source) {
    translationStrategy = [
      `Carried ${protocolClaims.length ? "one protocol line" : "the minimal aim"}`,
      witnessClaims.length
        ? `plus ${witnessClaims.length} witness${witnessClaims.length === 1 ? "" : "es"}`
        : "",
      primaryProtocolClaim ? "and one move/test pair" : "",
      "from the provisional claim set.",
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ");
  }

  return {
    source,
    translationStrategy,
    omittedClaims,
    selectedClaimIds: [...usedIds],
  };
}

function normalizeDiagnostics(diagnostics = []) {
  return Array.isArray(diagnostics)
    ? diagnostics.map((diagnostic) => ({
        code: normalizeText(diagnostic?.code) || "diag",
        severity: normalizeText(diagnostic?.severity).toLowerCase() || "info",
        message: normalizeText(diagnostic?.message),
        line: Number.isFinite(Number(diagnostic?.span?.line)) ? Number(diagnostic.span.line) : null,
      }))
    : [];
}

function buildCompileLayer(artifact, source = "", { present = true, trustSecondaryRuntime = null } = {}) {
  if (!present || !normalizeLongText(source)) {
    const notRun = {
      present,
      executed: false,
      compileState: "not_run",
      runtimeState: "not_run",
      closureType: null,
      mergedWindowState: "not_run",
      diagnostics: [],
    };
    if (trustSecondaryRuntime !== null) {
      notRun.secondaryRuntimeTrusted = false;
    }
    return notRun;
  }

  const compileState = normalizeText(artifact?.compileState).toLowerCase() || "unknown";
  const layer = {
    present,
    executed: true,
    compileState,
    runtimeState: normalizeText(artifact?.runtimeState).toLowerCase() || "open",
    closureType: normalizeText(artifact?.closureType) || null,
    mergedWindowState: normalizeText(artifact?.mergedWindowState).toLowerCase() || "open",
    diagnostics: normalizeDiagnostics(artifact?.diagnostics),
  };

  if (trustSecondaryRuntime !== null) {
    layer.secondaryRuntimeTrusted = Boolean(trustSecondaryRuntime) && compileState !== "blocked";
  }

  return layer;
}

function hasClauseHead(line = "") {
  const normalized = normalizeText(line);
  if (!normalized || normalized.startsWith("#")) return true;
  const [head] = normalized.split(/\s+/, 1);
  return CLAUSE_HEADS.has(head);
}

function detectEmbeddedExecutable(text = "") {
  const sourceText = String(text || "");
  const blockPattern = /```([^\n]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = blockPattern.exec(sourceText))) {
    const label = normalizeText(match[1]).toLowerCase();
    const body = normalizeLongText(match[2]);
    if (!body) continue;

    if (label === "loe") {
      return {
        source: body,
        detectionMethod: "fenced_loe",
      };
    }

    if (label === "loegos") {
      return {
        source: body,
        detectionMethod: "fenced_loegos",
      };
    }

    if (!label) {
      const nonEmptyLines = body
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (nonEmptyLines.length && nonEmptyLines.every((line) => hasClauseHead(line))) {
        return {
          source: body,
          detectionMethod: "fenced_clause_block",
        };
      }
    }
  }

  return {
    source: "",
    detectionMethod: null,
  };
}

function deriveLimitationClass(claims = []) {
  const normalizedClaims = Array.isArray(claims) ? claims : [];
  const totalClaims = normalizedClaims.length;
  const candidateClaims = normalizedClaims.filter((claim) => claim.translationReadiness === "candidate_for_translation");
  const philosophyClaims = normalizedClaims.filter(
    (claim) =>
      claim.translationReadiness === "non_compilable_philosophy" || claim.claimKind === "philosophy",
  );
  const compilerGapClaims = normalizedClaims.filter(
    (claim) => claim.translationReadiness === "meaningful_but_not_representable",
  );
  const blockedClaims = normalizedClaims.filter((claim) => claim.translationReadiness === "blocked_by_structure");

  if (philosophyClaims.length === totalClaims && totalClaims > 0) {
    return "out_of_scope";
  }

  if (!candidateClaims.length && compilerGapClaims.length) {
    return "compiler_gap";
  }

  if (!candidateClaims.length && blockedClaims.length) {
    return "translation_loss";
  }

  return null;
}

function deriveOutcomeClass({ rawDocumentResult, translatedSubsetResult, embeddedExecutableResult }) {
  const outcomes = [];
  const rawCompileState = normalizeText(rawDocumentResult?.compileState).toLowerCase();
  const translatedCompileState = normalizeText(translatedSubsetResult?.compileState).toLowerCase();
  const embeddedCompileState = normalizeText(embeddedExecutableResult?.compileState).toLowerCase();

  if (rawCompileState === "blocked") {
    outcomes.push("raw_not_direct_source");
  }

  if (translatedSubsetResult?.present && translatedCompileState === "clean") {
    outcomes.push("translated_subset_compiled");
  }

  if (embeddedExecutableResult?.present && embeddedCompileState === "clean") {
    outcomes.push("direct_program_found");
  }

  if (!outcomes.length) {
    if (rawCompileState === "blocked") {
      return "raw_not_direct_source";
    }

    if (rawCompileState === "clean") {
      return "direct_source_compiled";
    }

    return null;
  }

  if (outcomes.length === 1) return outcomes[0];
  return "mixed";
}

function buildVerdict({
  claims,
  translatedSubsetResult,
  embeddedExecutableResult,
  limitationClass,
  outcomeClass,
}) {
  const normalizedClaims = Array.isArray(claims) ? claims : [];
  const totalClaims = normalizedClaims.length;
  const candidateClaims = normalizedClaims.filter((claim) => claim.translationReadiness === "candidate_for_translation");
  const philosophyClaims = normalizedClaims.filter(
    (claim) =>
      claim.translationReadiness === "non_compilable_philosophy" || claim.claimKind === "philosophy",
  );
  const supportedWitnessClaims = normalizedClaims.filter(
    (claim) =>
      claim.supportStatus === "supported" &&
      ["quoted_witness", "external_citation"].includes(claim.provenanceClass),
  );
  const mixedProtocolAndPhilosophy = candidateClaims.length > 0 && philosophyClaims.length > 0;
  const translatedClean =
    translatedSubsetResult?.present &&
    normalizeText(translatedSubsetResult?.compileState).toLowerCase() === "clean";
  const translatedBlocked =
    translatedSubsetResult?.present &&
    normalizeText(translatedSubsetResult?.compileState).toLowerCase() === "blocked";
  const embeddedClean =
    embeddedExecutableResult?.present &&
    normalizeText(embeddedExecutableResult?.compileState).toLowerCase() === "clean";

  if (outcomeClass === "direct_source_compiled") {
    return {
      overall: "direct_source_compiles",
      primaryFinding:
        "This document already compiles directly as source, so no translation boundary was needed for this read.",
      readDisposition: "inspect_direct_source",
    };
  }

  if (embeddedClean && translatedClean) {
    return {
      overall: "mixed_document_with_direct_program",
      primaryFinding:
        "This document is not direct source, but it contains both a lawful translated subset and an embedded executable program.",
      readDisposition: "inspect_direct_program",
    };
  }

  if (embeddedClean) {
    return {
      overall: "direct_program_found",
      primaryFinding: "This document already contains executable Lœgos that runs directly when extracted.",
      readDisposition: "inspect_direct_program",
    };
  }

  if (limitationClass === "compiler_gap") {
    return {
      overall: "compiler_gap_exposed",
      primaryFinding:
        "The document contains meaningful structure the current language cannot represent honestly yet.",
      readDisposition: "needs_language_extension",
    };
  }

  if (limitationClass === "out_of_scope" && totalClaims > 0) {
    return {
      overall: "document_mostly_philosophy",
      primaryFinding: "This document currently reads more like philosophy than protocol.",
      readDisposition: "informative_only",
    };
  }

  if (translatedBlocked || limitationClass === "translation_loss") {
    return {
      overall: "translation_loss_exposed",
      primaryFinding: "The document has meaning, but the current translation would lose too much structure.",
      readDisposition: "needs_clearer_split",
    };
  }

  if (translatedClean) {
    if (mixedProtocolAndPhilosophy && supportedWitnessClaims.length) {
      return {
        overall: "lawful_subset_compiles",
        primaryFinding:
          "A grounded operational subset holds, but some of the document still belongs outside the language.",
        readDisposition: "ready_for_room_work",
      };
    }

    if (mixedProtocolAndPhilosophy) {
      return {
        overall: "lawful_subset_compiles",
        primaryFinding: "A lawful subset exists, but the document still mixes protocol and non-operational material.",
        readDisposition: "needs_clearer_split",
      };
    }

    if (!supportedWitnessClaims.length) {
      return {
        overall: "lawful_subset_compiles",
        primaryFinding:
          "The language can hold part of this document, but the central protocol still needs stronger witness.",
        readDisposition: "needs_more_witness",
      };
    }

    return {
      overall: "lawful_subset_compiles",
      primaryFinding: "A grounded subset is lawful enough to continue with normal Room work.",
      readDisposition: "ready_for_room_work",
    };
  }

  if (outcomeClass === "raw_not_direct_source") {
    return {
      overall: "structural_read_opened",
      primaryFinding: "The document is not direct source, so the structural read stays open at the interpretation boundary.",
      readDisposition: "informative_only",
    };
  }

  return {
    overall: "document_mostly_hypothesis",
    primaryFinding: "The document is not direct source, and no strong lawful subset was established yet.",
    readDisposition: "informative_only",
  };
}

function buildNextMoves({ verdict, claims, outcomeClass }) {
  const omittedCount = (Array.isArray(claims) ? claims : []).filter(
    (claim) => claim.translationReadiness !== "candidate_for_translation",
  ).length;

  if (verdict.readDisposition === "inspect_direct_source") {
    return [
      "Treat the direct source compile as the primary read for this document.",
      "Do not force a translated subset when the document already runs honestly as source.",
    ];
  }

  if (verdict.readDisposition === "inspect_direct_program") {
    return [
      "Inspect the embedded `.loe` program separately from the surrounding prose.",
      "Keep direct executable structure distinct from any translated subset.",
    ];
  }

  if (verdict.readDisposition === "needs_more_witness") {
    return [
      "Add one quoted witness or external citation for the central protocol claim.",
      "Keep the operational subset, then rerun Compiler Read.",
    ];
  }

  if (verdict.readDisposition === "needs_clearer_split") {
    return [
      "Separate protocol from non-operational prose before the next read.",
      omittedCount
        ? "Review omitted claims and decide which ones belong in the operational subset."
        : "Tighten the smallest operational claim and rerun.",
    ];
  }

  if (verdict.readDisposition === "needs_language_extension") {
    return [
      "Capture the non-representable claim explicitly as a compiler or language gap.",
      "Do not force a lossy translation just to get a clean compile.",
    ];
  }

  if (verdict.readDisposition === "ready_for_room_work") {
    return [
      "Carry the translated subset forward manually if it is worth active Room work.",
      "Keep omitted commentary outside authority until it earns stronger grounding.",
    ];
  }

  if (outcomeClass === "raw_not_direct_source") {
    return [
      "Treat the blocked raw result as admission control, not terminal failure.",
      "Read the translated subset or embedded executable layer before deciding what this document can carry.",
    ];
  }

  return [
    "Use this read as pressure, not proof.",
    "Keep only the grounded operational subset if you carry anything forward.",
  ];
}

function compileWithFilename(source = "", filename = "compiler_read.loe") {
  return compileSource({
    filename,
    source,
  });
}

export function evaluateCompilerRead({
  documentId = "",
  title = "",
  text = "",
  extracted = null,
} = {}) {
  const normalizedDocumentId = normalizeText(documentId);
  const normalizedTitle = normalizeText(title);
  const normalizedText = normalizeLongText(text);
  const payload = extracted && typeof extracted === "object" ? extracted : {};
  const rawClaims = Array.isArray(payload.claimSet) ? payload.claimSet : [];
  const claimSet = rawClaims.map((claim, index) => normalizeClaim(claim, index, normalizedText));
  const documentSummary = normalizeDocumentSummary(payload.documentSummary, claimSet, normalizedTitle);

  const rawArtifact = normalizedText
    ? compileWithFilename(
        normalizedText,
        normalizedTitle || `${toIdentifier(normalizedDocumentId || "compiler_read", "compiler_read")}.md`,
      )
    : null;
  const rawDocumentResult = buildCompileLayer(rawArtifact, normalizedText, {
    present: true,
    trustSecondaryRuntime: true,
  });

  const translatedSubsetCandidate = buildTranslatedSubset({
    documentId: normalizedDocumentId,
    documentSummary,
    claims: claimSet,
  });
  const translatedArtifact = translatedSubsetCandidate.source
    ? compileWithFilename(
        translatedSubsetCandidate.source,
        `${toIdentifier(normalizedDocumentId || normalizedTitle || "compiler_read", "compiler_read")}.loe`,
      )
    : null;
  const translatedSubsetResult = {
    source: translatedSubsetCandidate.source,
    translationStrategy: translatedSubsetCandidate.translationStrategy,
    omittedClaims: translatedSubsetCandidate.omittedClaims,
    selectedClaimIds: translatedSubsetCandidate.selectedClaimIds,
    ...buildCompileLayer(translatedArtifact, translatedSubsetCandidate.source, {
      present: Boolean(normalizeLongText(translatedSubsetCandidate.source)),
    }),
  };

  const embeddedCandidate = detectEmbeddedExecutable(normalizedText);
  const embeddedArtifact = embeddedCandidate.source
    ? compileWithFilename(
        embeddedCandidate.source,
        `${toIdentifier(normalizedDocumentId || normalizedTitle || "compiler_read", "compiler_read")}_embedded.loe`,
      )
    : null;
  const embeddedExecutableResult = {
    source: embeddedCandidate.source,
    detectionMethod: embeddedCandidate.detectionMethod,
    ...buildCompileLayer(embeddedArtifact, embeddedCandidate.source, {
      present: Boolean(normalizeLongText(embeddedCandidate.source)),
    }),
  };

  const limitationClass = deriveLimitationClass(claimSet);
  const outcomeClass = deriveOutcomeClass({
    rawDocumentResult,
    translatedSubsetResult,
    embeddedExecutableResult,
  });
  const verdict = buildVerdict({
    claims: claimSet,
    translatedSubsetResult,
    embeddedExecutableResult,
    limitationClass,
    outcomeClass,
  });
  const nextMoves = buildNextMoves({
    verdict,
    claims: claimSet,
    outcomeClass,
  });

  return {
    documentSummary,
    claimSet,
    rawDocumentResult,
    translatedSubsetResult,
    embeddedExecutableResult,
    limitationClass,
    outcomeClass,
    verdict,
    nextMoves,
  };
}

export const buildCompilerReadFromExtraction = evaluateCompilerRead;

export async function runCompilerRead({
  documentId = "",
  title = "",
  text = "",
  focus = null,
  strictness = "soft",
  question = null,
  fetchImpl = fetch,
} = {}) {
  const normalizedDocumentId = normalizeText(documentId);
  const normalizedText = normalizeLongText(text);

  if (!normalizedDocumentId || !normalizedText) {
    throw new CompilerReadError("Document id and text are required.", { status: 400 });
  }

  const extracted = await extractClaimsWithSeven({
    title,
    text: normalizedText,
    focus,
    strictness,
    question,
    fetchImpl,
  });

  return evaluateCompilerRead({
    documentId: normalizedDocumentId,
    title,
    text: normalizedText,
    extracted,
  });
}
