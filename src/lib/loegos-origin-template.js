export const LOEGOS_ORIGIN_TEMPLATE_ID = "loegos-origin-example";
export const LOEGOS_ORIGIN_TEMPLATE_VERSION = 1;
export const LOEGOS_ORIGIN_PROJECT_KEY = "loegos-origin-example";
export const LOEGOS_ORIGIN_BOX_TITLE = "How Lœgos Assembled Itself";
export const LOEGOS_ORIGIN_BOX_SUBTITLE =
  "Editable example seeded from the real Lœgos origin corpus.";
export const LOEGOS_ORIGIN_INTRO_LINE =
  "Editable example. Seeded from the real Lœgos origin corpus. Delete anytime.";
export const LOEGOS_ORIGIN_ROOT = Object.freeze({
  text: "Show how Lœgos assembled itself",
  gloss:
    "Use the actual origin corpus to reconstruct how naming, theory, pivots, and proof became the product.",
  occurredAt: "2026-03-28T12:00:00-04:00",
});

export const LOEGOS_SOURCE_CLASSIFICATION_LABELS = Object.freeze({
  load_bearing: "Load-bearing",
  carried_indirectly: "Carried indirectly",
  latent: "Latent",
  proof_witness: "Proof witness",
});

export const SOURCE_ROLE_LABELS = Object.freeze({
  "origin-fragment": "Origin fragment",
  theory: "Theory",
  "product-spec": "Product spec",
  "evidence-spine": "Evidence spine",
  "platform-history": "Platform history",
});

export const CHRONOLOGY_AUTHORITY_LABELS = Object.freeze({
  primary: "Primary chronology",
  corroborating: "Corroborating chronology",
  contextual: "Contextual",
});

export const EVIDENCE_BASIS_LABELS = Object.freeze({
  "direct-text": "Direct text",
  "image-derived-markdown": "Image-derived markdown",
  "platform-export": "Platform export",
});

export const LOEGOS_ORIGIN_SOURCE_DEFS = Object.freeze([
  {
    id: "words-are-loegos",
    title: "words are lœgos",
    relativePath: "docs/First seed/words are lœgos/words are lœgos.md",
    sourceRole: "origin-fragment",
    sourceClassification: "load_bearing",
    evidenceBasis: "direct-text",
    chronologyAuthority: "primary",
    occurredAt: "2026-03-28T12:00:00-04:00",
  },
  {
    id: "assembled-reality",
    title: "Assembled Reality",
    relativePath: "docs/First seed/# ASSEMBLED REALITY/# ASSEMBLED REALITY.md",
    sourceRole: "theory",
    sourceClassification: "load_bearing",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
    occurredAt: "2026-03-28T21:39:41-04:00",
  },
  {
    id: "operator-sentences",
    title: "Operator Sentences",
    relativePath: "docs/First seed/# Operator Sentences/# Operator Sentences.md",
    sourceRole: "theory",
    sourceClassification: "load_bearing",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
    occurredAt: "2026-03-30T20:10:02-04:00",
  },
  {
    id: "ghost-operator",
    title: "The Ghost Operator",
    relativePath: "docs/First seed/# The Ghost Operator/# The Ghost Operator.md",
    sourceRole: "theory",
    sourceClassification: "latent",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
    occurredAt: "2026-04-04T00:35:38-04:00",
  },
  {
    id: "law-of-the-echo",
    title: "The Law of the Echo",
    relativePath: "docs/First seed/# The Law of the Echo/# The Law of the Echo.md",
    sourceRole: "theory",
    sourceClassification: "carried_indirectly",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
    occurredAt: "2026-04-05T12:30:00-04:00",
  },
  {
    id: "meaning-operator",
    title: "The Meaning Operator",
    relativePath: "docs/First seed/# The Meaning Operator/# The Meaning Operator.md",
    sourceRole: "theory",
    sourceClassification: "carried_indirectly",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
    occurredAt: "2026-04-03T09:14:58-04:00",
  },
  {
    id: "monolith-does-not-move",
    title: "A monolith does not move.",
    relativePath: "docs/First seed/A monolith does not move./A monolith does not move..md",
    sourceRole: "theory",
    sourceClassification: "latent",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
    occurredAt: "2026-04-02T09:30:00-04:00",
  },
  {
    id: "echo-canon",
    title: "Echo Canon",
    relativePath: "docs/First seed/ECHO CANON/ECHO CANON.md",
    sourceRole: "theory",
    sourceClassification: "latent",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
    occurredAt: "2026-04-02T09:00:00-04:00",
  },
  {
    id: "loegos-self-assembly-spec",
    title: "Lœgos Self-Assembly Seed Spec",
    relativePath: "docs/First seed/Loegos_Self_Assembly_Seed_Spec_v0.2.md",
    sourceRole: "product-spec",
    sourceClassification: "carried_indirectly",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
    occurredAt: "2026-04-05T09:00:00-04:00",
  },
  {
    id: "loegos-origin-receipt-arc",
    title: "Lœgos — Origin, Evolution, Feedback, and Receipt",
    relativePath:
      "docs/First seed/# Lœgos — Origin, Evolution, Feedback, and Receipt/# Lœgos — Origin, Evolution, Feedback, and Receipt.md",
    sourceRole: "evidence-spine",
    sourceClassification: "proof_witness",
    evidenceBasis: "image-derived-markdown",
    chronologyAuthority: "primary",
    occurredAt: "2026-04-05T14:30:00-04:00",
  },
  {
    id: "loegos-git-history",
    title: "Loegos Git history export",
    relativePath:
      "docs/First seed/commit c71b1d6cf6c34916fbc85d08ecfd1bf05371aebf/commit c71b1d6cf6c34916fbc85d08ecfd1bf05371aebf.md",
    sourceRole: "platform-history",
    sourceClassification: "proof_witness",
    evidenceBasis: "platform-export",
    chronologyAuthority: "corroborating",
    historyKind: "git-log",
    platform: "github",
    occurredAt: "2026-04-05T09:30:00-04:00",
  },
]);

export const LOEGOS_ORIGIN_HISTORY_CLUSTER_DEFS = Object.freeze([
  {
    id: "initial-scaffold",
    title: "Initial scaffold and document viewer",
    description:
      "The earliest structural commits that establish the project shell and the first document-viewer form.",
  },
  {
    id: "collaborative-reader",
    title: "Collaborative reader",
    description:
      "Reader-focused iterations that made the product feel like a shared reading surface rather than a static file.",
  },
  {
    id: "receipt-integration",
    title: "Receipt integration",
    description:
      "Commits that pull proof, GetReceipts, sealing, and receipt-oriented workflows into the product surface.",
  },
  {
    id: "audio-seven-evolution",
    title: "Audio and Seven evolution",
    description:
      "Commits that pushed the reader toward a player through listening, Seven, manuscript, and playback flows.",
  },
  {
    id: "box-architecture",
    title: "Root, workspace, and box architecture",
    description:
      "Commits where root, workspace chrome, box architecture, and assembly surfaces become explicit product primitives.",
  },
]);

export const LOEGOS_ORIGIN_MILESTONE_DEFS = Object.freeze([
  {
    id: "naming",
    label: "Image 1",
    sectionPattern: /^Image 1\b/i,
    supportingSourceIds: ["words-are-loegos"],
    historyClusterIds: [],
    stagedSummary:
      "Select the naming fragment and stage the ligature explanation as the first live seed candidate.",
    sealedSummary: "Not sealed yet. This remains an origin fragment, not a receipt.",
  },
  {
    id: "box-home",
    label: "Image 2",
    sectionPattern: /^Image 2\b/i,
    supportingSourceIds: ["assembled-reality", "loegos-self-assembly-spec"],
    historyClusterIds: ["initial-scaffold", "collaborative-reader", "receipt-integration"],
    stagedSummary:
      "Stage the first visible box grammar: sources, assemblies, receipts, and a next move.",
    sealedSummary: "Not sealed. This is product-state evidence rather than a proof artifact.",
  },
  {
    id: "document-player",
    label: "Image 3",
    sectionPattern: /^Image 3\b/i,
    supportingSourceIds: ["assembled-reality", "operator-sentences"],
    historyClusterIds: ["collaborative-reader", "audio-seven-evolution"],
    stagedSummary:
      "Advance the reader into a player by staging block playback, voiced navigation, and operable source blocks.",
    sealedSummary: "Not sealed. This move shows interaction form, not external proof.",
  },
  {
    id: "declare-root",
    label: "Image 4",
    sectionPattern: /^Image 4\b/i,
    supportingSourceIds: ["loegos-self-assembly-spec", "meaning-operator"],
    historyClusterIds: ["box-architecture"],
    stagedSummary:
      "Stage the architectural turn where the box needs a fixed origin before assembly can move cleanly.",
    sealedSummary: "Not sealed. This is an architectural move, not a receipt event.",
  },
  {
    id: "investor-share",
    label: "Image 5",
    sectionPattern: /^Image 5\b/i,
    supportingSourceIds: ["loegos-self-assembly-spec"],
    historyClusterIds: [],
    stagedSummary:
      "Stage the first outside contact: the prototype is shared, the privacy posture is stated, and reality answers back.",
    sealedSummary: "Contact happened here. The receipt closes in the following moves.",
  },
  {
    id: "receipt-feed",
    label: "Image 6",
    sectionPattern: /^Image 6\b/i,
    supportingSourceIds: ["assembled-reality", "law-of-the-echo"],
    historyClusterIds: ["receipt-integration"],
    stagedSummary:
      "Stage the proof layer as an operational ledger where the share becomes countable, reviewable evidence.",
    sealedSummary:
      "The product share appears in the ledger as a sealed L3 receipt, but this view is still the feed-level witness.",
  },
  {
    id: "sealed-receipt",
    label: "Image 7",
    sectionPattern: /^Image 7\b/i,
    supportingSourceIds: ["assembled-reality", "law-of-the-echo", "loegos-self-assembly-spec"],
    historyClusterIds: ["receipt-integration"],
    stagedSummary:
      "Seal the strongest public proof in the corpus: the tool receipted its own release with attached evidence and verification.",
    sealedSummary:
      "Sealed by the WhatsApp screenshot, AI verification, receipt status, and the visible receipt hash.",
  },
]);

export const LOEGOS_ORIGIN_MOVE_DEFS = Object.freeze([
  {
    id: "naming-arrives",
    title: "Naming arrives",
    detail: "The ligature lands before the product. The word gives the future box a shape to cohere around.",
    occurredAt: "2026-03-28T12:00:00-04:00",
    groupId: "origin",
    stageStatus: "selected",
    proofStatus: "open",
    linkedSourceIds: ["words-are-loegos"],
  },
  {
    id: "assembled-reality-first-source",
    title: "Assembled Reality becomes the first source",
    detail: "The project starts as a document viewer for the theory note that created the need for the tool.",
    occurredAt: "2026-03-28T21:39:41-04:00",
    groupId: "origin",
    stageStatus: "staged",
    proofStatus: "witness",
    linkedSourceIds: ["assembled-reality", "loegos-git-history"],
  },
  {
    id: "collaborative-reader-and-receipts",
    title: "Collaborative reader and receipts appear",
    detail: "Shared reading and proof begin to enter the product surface instead of living outside it.",
    occurredAt: "2026-03-29T17:04:49-04:00",
    groupId: "assembly",
    stageStatus: "advanced",
    proofStatus: "witness",
    linkedSourceIds: ["assembled-reality", "loegos-git-history"],
  },
  {
    id: "seven-audio-player",
    title: "Seven, audio, and the player take over",
    detail: "The interface shifts from a reader toward a player: blocks become tracks, listening becomes a primary path, and Seven becomes a visible guide.",
    occurredAt: "2026-03-30T20:10:02-04:00",
    groupId: "assembly",
    stageStatus: "advanced",
    proofStatus: "witness",
    linkedSourceIds: ["operator-sentences", "loegos-origin-receipt-arc", "loegos-git-history"],
  },
  {
    id: "listener-first-experiment",
    title: "Listener-first experiment lands",
    detail: "The product tests a listener-first guest flow and pushes harder on audio-led assembly.",
    occurredAt: "2026-04-02T21:31:36-04:00",
    groupId: "assembly",
    stageStatus: "advanced",
    proofStatus: "witness",
    linkedSourceIds: ["loegos-git-history"],
  },
  {
    id: "listener-first-rollback",
    title: "Listener-first rollback becomes a lesson",
    detail: "The flow is rolled back, and the rollback itself becomes evidence about what the product should not become.",
    occurredAt: "2026-04-02T21:42:44-04:00",
    groupId: "assembly",
    stageStatus: "advanced",
    proofStatus: "witness",
    linkedSourceIds: ["loegos-git-history"],
    isLakinMoment: true,
    pivotFrom: "listener",
    pivotTo: "box",
    lakinSummary:
      "The audio-led guest direction is explicitly rolled back, and the box keeps what it learned without pretending the turn never happened.",
  },
  {
    id: "pivot-to-workspace",
    title: "Pivot to document assembler workspace",
    detail: "The center of gravity moves from reader/player to a workspace that can read, assemble, and prove.",
    occurredAt: "2026-04-03T09:14:58-04:00",
    groupId: "assembly",
    stageStatus: "advanced",
    proofStatus: "witness",
    linkedSourceIds: ["assembled-reality", "meaning-operator", "loegos-git-history"],
    isLakinMoment: true,
    pivotFrom: "player",
    pivotTo: "workspace",
    lakinSummary:
      "The product carries assembly and proof forward while dropping the player-first center of gravity.",
  },
  {
    id: "workspace-shell-and-home",
    title: "Workspace shell and box home become explicit",
    detail: "Project-aware shell, home, and receipt history make the box itself legible as a working object.",
    occurredAt: "2026-04-03T13:58:02-04:00",
    groupId: "assembly",
    stageStatus: "advanced",
    proofStatus: "witness",
    linkedSourceIds: ["loegos-git-history", "loegos-origin-receipt-arc"],
  },
  {
    id: "rebrand-as-loegos",
    title: "The product becomes Lœgos",
    detail: "The naming fragment and the product finally fuse. The app inherits the word that had been waiting for it.",
    occurredAt: "2026-04-04T00:35:38-04:00",
    groupId: "assembly",
    stageStatus: "advanced",
    proofStatus: "witness",
    linkedSourceIds: ["words-are-loegos", "loegos-git-history"],
  },
  {
    id: "migrate-to-boxes",
    title: "Workspace language migrates to boxes",
    detail: "The product stops talking about generic projects and starts speaking in the box grammar that now defines it.",
    occurredAt: "2026-04-04T08:15:09-04:00",
    groupId: "assembly",
    stageStatus: "advanced",
    proofStatus: "witness",
    linkedSourceIds: ["loegos-origin-receipt-arc", "loegos-git-history"],
  },
  {
    id: "operate-and-seed-first",
    title: "Operate and the seed-first loop land",
    detail: "Think, Create, Operate, and the seed-first flow turn the box into a readable assembly machine instead of a storage surface.",
    occurredAt: "2026-04-04T16:18:37-04:00",
    groupId: "assembly",
    stageStatus: "advanced",
    proofStatus: "supported",
    linkedSourceIds: [
      "assembled-reality",
      "operator-sentences",
      "loegos-self-assembly-spec",
      "loegos-git-history",
    ],
  },
  {
    id: "share-prototype",
    title: "Prototype is shared for feedback",
    detail: "The tool reaches a real stakeholder. The product sentence travels in its natural habitat and reality answers back.",
    occurredAt: "2026-04-05T11:43:00-04:00",
    groupId: "proof",
    stageStatus: "advanced",
    proofStatus: "witness",
    linkedSourceIds: ["loegos-origin-receipt-arc"],
  },
  {
    id: "seal-the-proof",
    title: "The tool receipted its own release",
    detail: "The WhatsApp share becomes attached evidence, AI verification runs over it, and the proof closes as a seal.",
    occurredAt: "2026-04-05T14:30:00-04:00",
    groupId: "proof",
    stageStatus: "sealed",
    proofStatus: "sealed",
    linkedSourceIds: ["loegos-origin-receipt-arc", "law-of-the-echo"],
    linkedReceiptId: "loegos-origin-sealed-receipt",
  },
]);

export const LOEGOS_ORIGIN_RECEIPT_SEED = Object.freeze({
  id: "loegos-origin-sealed-receipt",
  title: "Share prototype for feedback",
  note: "Shared with Melih",
  status: "SEALED",
  stance: "CONFIDENT",
  level: "L3",
  occurredAt: "2026-04-05T14:30:00-04:00",
  interpretation:
    "The prototype was shared with a real stakeholder, the share was witnessed in WhatsApp, and the contact became portable proof.",
  implications:
    "The tool receipted its own release. Story followed proof, and the first outside contact now travels with evidence.",
  context:
    "Share prototype for feedback with Melih and builders.",
  historicalWitness: {
    hash: "5a5…5941",
    verifiedSummary:
      "Historical witness from the corpus: the WhatsApp screenshot, AI assessment, and sealed receipt detail all describe the same product share.",
  },
});

export const LOEGOS_ORIGIN_ROLE_ORDER = Object.freeze([
  "origin-fragment",
  "evidence-spine",
  "platform-history",
  "product-spec",
  "theory",
]);

export function getLoegosSourceClassificationLabel(value = "") {
  return LOEGOS_SOURCE_CLASSIFICATION_LABELS[value] || "Source";
}

export function normalizeProjectSystemMeta(system = null) {
  const nextSystem = system && typeof system === "object" ? system : {};
  return {
    ...nextSystem,
    templates:
      nextSystem.templates && typeof nextSystem.templates === "object"
        ? nextSystem.templates
        : {},
  };
}
