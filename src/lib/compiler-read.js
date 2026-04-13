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

function normalizeClaim(rawClaim = null, index = 0) {
  const claim = rawClaim && typeof rawClaim === "object" ? rawClaim : {};
  const sourceExcerpt = normalizeLongText(claim.sourceExcerpt);
  if (!sourceExcerpt) {
    throw new CompilerReadError("Seven returned a claim without a source excerpt.", {
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

function buildWitnessSourceLabel(claim = null) {
  const primaryRef = Array.isArray(claim?.evidenceRefs) ? claim.evidenceRefs[0] : "";
  if (normalizeText(primaryRef)) return normalizeText(primaryRef);
  if (claim?.provenanceClass === "quoted_witness") return "quoted witness";
  if (claim?.provenanceClass === "external_citation") return "external citation";
  if (claim?.provenanceClass === "self_reported") return "self report";
  return "document excerpt";
}

function buildLoeCandidate({ documentId = "", documentSummary = null, claims = [] } = {}) {
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

  if (translatableClaims.length) {
    lines.push(`GND box ${boxRef}`);
    lines.push(`DIR aim ${quoteLoeString(deriveAimText(protocolClaims.length ? protocolClaims : translatableClaims, documentSummary), 100)}`);
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
      witnessClaims.length ? `plus ${witnessClaims.length} witness${witnessClaims.length === 1 ? "" : "es"}` : "",
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

function toCompileResult(artifact, source = "") {
  return {
    compileState: normalizeText(artifact?.compileState).toLowerCase() || (source ? "unknown" : "clean"),
    runtimeState: normalizeText(artifact?.runtimeState).toLowerCase() || "open",
    closureType: normalizeText(artifact?.closureType) || null,
    mergedWindowState: normalizeText(artifact?.mergedWindowState).toLowerCase() || "open",
    diagnostics: Array.isArray(artifact?.diagnostics)
      ? artifact.diagnostics.map((diagnostic) => ({
          code: normalizeText(diagnostic?.code) || "diag",
          severity: normalizeText(diagnostic?.severity).toLowerCase() || "info",
          message: normalizeText(diagnostic?.message),
          line: Number.isFinite(Number(diagnostic?.span?.line)) ? Number(diagnostic.span.line) : null,
        }))
      : [],
  };
}

function buildVerdict({ claims, compileResult }) {
  const totalClaims = claims.length;
  const candidateClaims = claims.filter((claim) => claim.translationReadiness === "candidate_for_translation");
  const philosophyClaims = claims.filter(
    (claim) =>
      claim.translationReadiness === "non_compilable_philosophy" || claim.claimKind === "philosophy",
  );
  const mixedProtocolAndPhilosophy = candidateClaims.length > 0 && philosophyClaims.length > 0;
  const compilerGapClaims = claims.filter(
    (claim) => claim.translationReadiness === "meaningful_but_not_representable",
  );
  const supportedWitnessClaims = claims.filter(
    (claim) =>
      claim.supportStatus === "supported" &&
      ["quoted_witness", "external_citation"].includes(claim.provenanceClass),
  );
  const blockedClaims = claims.filter((claim) => claim.translationReadiness === "blocked_by_structure");
  const compileBlocked = normalizeText(compileResult?.compileState).toLowerCase() === "blocked";

  if (compilerGapClaims.length && !candidateClaims.length) {
    return {
      overall: "compiler_gap_exposed",
      primaryFinding: "The document contains at least one meaningful structured claim the current language cannot represent honestly yet.",
      failureClass: "compiler_gap",
      readDisposition: "needs_language_extension",
    };
  }

  if (philosophyClaims.length === totalClaims && totalClaims > 0) {
    return {
      overall: "document_mostly_philosophy",
      primaryFinding: "This document currently reads more like philosophy than protocol.",
      failureClass: "out_of_scope",
      readDisposition: "informative_only",
    };
  }

  if (!candidateClaims.length && blockedClaims.length) {
    return {
      overall: "lawful_subset_blocked",
      primaryFinding: "The document has meaning, but the current translation would lose too much structure.",
      failureClass: "translation_loss",
      readDisposition: "needs_clearer_split",
    };
  }

  if (compileBlocked) {
    return {
      overall: "lawful_subset_blocked",
      primaryFinding: "The translated subset still blocks under the current compiler.",
      failureClass: "thought_flaw",
      readDisposition: "needs_clearer_split",
    };
  }

  if (candidateClaims.length) {
    if (mixedProtocolAndPhilosophy && supportedWitnessClaims.length) {
      return {
        overall: "lawful_subset_compiles",
        primaryFinding: "A grounded operational subset holds, but philosophy still needs to stay separate.",
        failureClass: "mixed",
        readDisposition: "ready_for_room_work",
      };
    }

    if (mixedProtocolAndPhilosophy) {
      return {
        overall: "lawful_subset_compiles",
        primaryFinding: "The operational subset is usable, but the document still mixes protocol and philosophy.",
        failureClass: "mixed",
        readDisposition: "needs_clearer_split",
      };
    }

    if (!supportedWitnessClaims.length) {
      return {
        overall: "lawful_subset_compiles",
        primaryFinding: "The language can hold part of this document, but the central protocol still needs stronger witness.",
        failureClass: "mixed",
        readDisposition: "needs_more_witness",
      };
    }

    return {
      overall: "lawful_subset_compiles",
      primaryFinding: "A grounded subset is lawful enough to continue with normal Room work.",
      failureClass: "mixed",
      readDisposition: "ready_for_room_work",
    };
  }

  return {
    overall: "document_mostly_hypothesis",
    primaryFinding: "The document is still more hypothesis than lawful operational structure.",
    failureClass: "mixed",
    readDisposition: "informative_only",
  };
}

function buildNextMoves({ verdict, claims }) {
  const omittedCount = claims.filter((claim) => claim.translationReadiness !== "candidate_for_translation").length;
  if (verdict.readDisposition === "needs_more_witness") {
    return [
      "Add one quoted witness or external citation for the central protocol claim.",
      "Keep the operational subset, then rerun Compiler Read.",
    ];
  }
  if (verdict.readDisposition === "needs_clearer_split") {
    return [
      "Separate protocol from philosophy before the next read.",
      omittedCount ? "Review omitted claims and decide which ones belong in the operational subset." : "Tighten the smallest operational claim and rerun.",
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
      "Keep omitted philosophy and commentary outside canon until they earn stronger grounding.",
    ];
  }
  return [
    "Use this read as pressure, not proof.",
    "Keep only the grounded operational subset if you carry anything forward.",
  ];
}

export function buildCompilerReadFromExtraction({
  documentId = "",
  title = "",
  extracted = null,
} = {}) {
  const payload = extracted && typeof extracted === "object" ? extracted : {};
  const rawClaims = Array.isArray(payload.claimSet) ? payload.claimSet : [];
  const claimSet = rawClaims.map((claim, index) => normalizeClaim(claim, index));
  const documentSummary = normalizeDocumentSummary(payload.documentSummary, claimSet, title);
  const loeCandidate = buildLoeCandidate({ documentId, documentSummary, claims: claimSet });
  const artifact = compileSource({
    filename: `${toIdentifier(documentId || title || "compiler_read", "compiler_read")}.loe`,
    source: loeCandidate.source,
  });
  const compileResult = toCompileResult(artifact, loeCandidate.source);
  const verdict = buildVerdict({ documentSummary, claims: claimSet, loeCandidate, compileResult });
  const nextMoves = buildNextMoves({ verdict, claims: claimSet });

  return {
    documentSummary,
    claimSet,
    loeCandidate: {
      source: loeCandidate.source,
      translationStrategy: loeCandidate.translationStrategy,
      omittedClaims: loeCandidate.omittedClaims,
    },
    compileResult,
    verdict,
    nextMoves,
  };
}

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

  return buildCompilerReadFromExtraction({
    documentId: normalizedDocumentId,
    title,
    extracted,
  });
}
