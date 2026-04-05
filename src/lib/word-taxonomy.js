const WORD_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "almost",
  "also",
  "among",
  "around",
  "because",
  "before",
  "being",
  "between",
  "both",
  "could",
  "does",
  "doing",
  "done",
  "down",
  "during",
  "each",
  "even",
  "every",
  "from",
  "have",
  "having",
  "here",
  "into",
  "just",
  "like",
  "made",
  "many",
  "more",
  "most",
  "much",
  "must",
  "only",
  "other",
  "over",
  "same",
  "should",
  "since",
  "some",
  "such",
  "than",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "toward",
  "under",
  "until",
  "very",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would",
  "your",
  "yours",
  "ours",
  "ourselves",
  "themselves",
  "herself",
  "himself",
  "myself",
  "itself",
  "theirs",
  "therefore",
  "however",
  "within",
  "without",
  "across",
  "still",
  "whose",
  "whom",
  "shall",
  "might",
  "unto",
  "upon",
  "https",
  "http",
  "www",
  "com",
  "org",
  "net",
  "markdown",
  "section",
  "sections",
  "title",
  "untitled",
]);

export const WORD_ALIAS_MAP = Object.freeze({
  loegos: "lœgos",
  receipts: "receipt",
  seals: "seal",
  assemblies: "assembly",
  boxes: "box",
  seeds: "seed",
  witnesses: "witness",
});

export const WORD_TAXONOMY = Object.freeze({
  structural: new Set([
    "receipt",
    "seal",
    "assembly",
    "proof",
    "aim",
    "basis",
    "root",
    "seed",
    "box",
    "witness",
    "evidence",
    "trust",
    "convergence",
  ]),
  diagnostic: new Set([
    "verify",
    "signal",
    "friction",
    "index",
    "reroute",
    "gap",
    "drift",
    "threshold",
    "align",
    "divergence",
    "pressure",
    "contact",
  ]),
  canonical: new Set([
    "lœgos",
    "ghost",
    "hineni",
    "monolith",
    "chemotaxis",
    "volunteer",
    "lakin",
    "seven",
    "getreceipts",
    "œ",
  ]),
  operational: new Set([
    "build",
    "ship",
    "move",
    "update",
    "send",
    "check",
    "add",
    "open",
    "run",
    "change",
    "make",
    "fix",
  ]),
});

export const WORD_TAXONOMY_LABELS = Object.freeze({
  structural: "Structural",
  diagnostic: "Diagnostic",
  canonical: "Canonical",
  operational: "Operational",
  uncategorized: "Uncategorized",
});

export const WORD_CANONICAL_ALLOWLIST = new Set(
  [...WORD_TAXONOMY.canonical].filter((token) => String(token || "").length < 3),
);

export function normalizeWordToken(token = "") {
  const normalized = String(token || "").trim().toLowerCase();
  if (!normalized) return "";
  return WORD_ALIAS_MAP[normalized] || normalized;
}

export function isWordStopWord(token = "") {
  return WORD_STOP_WORDS.has(String(token || "").trim().toLowerCase());
}

export function getWordTaxonomyBucket(token = "") {
  const normalized = normalizeWordToken(token);
  if (!normalized) return "uncategorized";

  if (WORD_TAXONOMY.structural.has(normalized)) return "structural";
  if (WORD_TAXONOMY.diagnostic.has(normalized)) return "diagnostic";
  if (WORD_TAXONOMY.canonical.has(normalized)) return "canonical";
  if (WORD_TAXONOMY.operational.has(normalized)) return "operational";
  return "uncategorized";
}

export function getWordTaxonomyLabel(bucket = "") {
  return WORD_TAXONOMY_LABELS[bucket] || WORD_TAXONOMY_LABELS.uncategorized;
}

export function isAllowedShortWordToken(token = "") {
  return WORD_CANONICAL_ALLOWLIST.has(normalizeWordToken(token));
}
