import { stripMarkdownSyntax } from "@/lib/document-blocks";
import { buildFormalSentenceAnnotations } from "@/lib/formal-core/runtime";
import { sortOverridesForDisplay } from "@/lib/operate-overlay";
import { getSeedSectionsFromDocument, SEED_SECTIONS } from "@/lib/seed-model";

const SIGNAL_LABELS = Object.freeze({
  green: "Grounded",
  amber: "Partial",
  red: "Unsupported",
  neutral: "Uninformed",
  override: "Attested",
});

const SHAPE_LABELS = Object.freeze({
  aim: "Aim",
  reality: "Reality",
  weld: "Weld",
  seal: "Seal",
});

const SHAPE_FALLBACK_LABELS = Object.freeze({
  aim: "Aim·",
  reality: "Re·",
  weld: "Weld·",
  seal: "Seal·",
});

const STAGE_LABELS = Object.freeze({
  witness: "WIT",
  staged: "STG",
  draft: "DRF",
  confirmed: "CNF",
  discarded: "DSC",
  sealed: "SEA",
});

const PRIMARY_TAG_TO_SHAPE = Object.freeze({
  aim: "aim",
  evidence: "reality",
  story: "weld",
});

function normalizeSignalKey(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "green" || normalized === "amber" || normalized === "red") return normalized;
  if (normalized === "override" || normalized === "attested") return "override";
  return "neutral";
}

function normalizeShapeKey(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "aim" || normalized === "△") return "aim";
  if (normalized === "reality" || normalized === "□") return "reality";
  if (normalized === "weld" || normalized === "œ") return "weld";
  if (normalized === "seal" || normalized === "𒐛") return "seal";
  return "aim";
}

function normalizeTextLine(value = "") {
  return stripMarkdownSyntax(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStageKey(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "witness") return "witness";
  if (normalized === "staged") return "staged";
  if (normalized === "confirmed") return "confirmed";
  if (normalized === "discarded") return "discarded";
  if (normalized === "sealed") return "sealed";
  return "draft";
}

function truncateText(value = "", maxLength = 180) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function normalizeBlockOrigin(block = null) {
  if (!block || typeof block !== "object") {
    return {
      sourceDocumentKey: "",
      sourcePosition: -1,
      importedFromBlockId: "",
    };
  }

  const provenance = block?.provenance && typeof block.provenance === "object" ? block.provenance : null;
  const sourcePosition = Number.isFinite(Number(block?.sourcePosition))
    ? Number(block.sourcePosition)
    : -1;

  return {
    sourceDocumentKey: String(
      provenance?.importedFromDocumentKey ||
        block?.sourceDocumentKey ||
        block?.documentKey ||
        "",
    ).trim(),
    sourcePosition,
    importedFromBlockId: String(provenance?.importedFromBlockId || "").trim(),
  };
}

function defaultShapeRationale(shapeKey = "aim") {
  if (shapeKey === "reality") {
    return "This block reads as witness, observation, or evidence already inside the box.";
  }
  if (shapeKey === "weld") {
    return "This block reads as convergence language joining declaration to what reality returned.";
  }
  if (shapeKey === "seal") {
    return "This block reads as closure language: proof, deadline, commitment, or completed return.";
  }
  return "This block reads as declaration, intention, or directional pressure.";
}

function defaultSignalAnnotation(signalKey = "neutral") {
  if (signalKey === "green") {
    return "Clear enough to travel inside the current box.";
  }
  if (signalKey === "amber") {
    return "Some contact exists, but the grounding is still partial.";
  }
  if (signalKey === "red") {
    return "This line is unsupported or contradicted by what the box can currently prove.";
  }
  if (signalKey === "override") {
    return "This line is held by attestation, not by local evidence.";
  }
  return "Operate has not read this block yet, so signal stays neutral.";
}

function inferStageKey(block = null, { artifactKind = "", isStaged = false } = {}) {
  if (isStaged) return "staged";

  const confirmationStatus = String(block?.confirmationStatus || "").trim().toLowerCase();
  if (confirmationStatus === "confirmed") return "confirmed";
  if (confirmationStatus === "discarded") return "discarded";

  const artifact = String(artifactKind || "").trim().toLowerCase();
  if (artifact === "source" || artifact === "witness") return "witness";

  const blockStatus = String(block?.status || "").trim().toLowerCase();
  if (blockStatus === "sealed") return "sealed";

  return "draft";
}

function getExceptionState(signalKey = "neutral", finding = null) {
  if (signalKey === "override" || finding?.overrideApplied) {
    return {
      key: "attested",
      marker: "ATT",
      label: "Attested override",
    };
  }

  if (signalKey === "red") {
    return {
      key: "unsupported",
      marker: "!",
      label: "Unsupported",
    };
  }

  if (signalKey === "amber") {
    return {
      key: "partial",
      marker: "~",
      label: "Partial support",
    };
  }

  return {
    key: "none",
    marker: "",
    label: "No exception",
  };
}

function defaultSignalRationale(signalKey = "neutral", contextCopy = "") {
  if (signalKey === "green") {
    return "Local evidence survived the read strongly enough for this line to render as grounded.";
  }
  if (signalKey === "amber") {
    return "The system found some contact, but not enough to treat the line as fully grounded.";
  }
  if (signalKey === "red") {
    return "The system could not support this line from the current box, or reality contradicted it.";
  }
  if (signalKey === "override") {
    return "A human attested this line directly. The receipt keeps the override explicit instead of presenting it as evidence.";
  }
  return contextCopy || "This block has shape, but no declared Operate read yet, so the signal remains uninformed.";
}

function buildCompilerChecks({
  block = null,
  diagnostics = [],
  shapeKey = "aim",
  signalKey = "neutral",
  evidence = [],
} = {}) {
  const checks = [];
  const codes = new Set((Array.isArray(diagnostics) ? diagnostics : []).map((item) => item?.code).filter(Boolean));
  const primaryTag = String(block?.primaryTag || "").trim().toLowerCase();
  const taggedShapeKey = PRIMARY_TAG_TO_SHAPE[primaryTag] || "";

  if (codes.has("ungrounded")) {
    checks.push({
      key: "missing-reality",
      label: "Missing reality",
      tone: "warning",
      detail: "The line names direction, but not enough grounded reality.",
    });
  }

  if (
    shapeKey === "weld" &&
    (codes.has("directionless") || codes.has("ungrounded") || signalKey === "amber" || signalKey === "red")
  ) {
    checks.push({
      key: "weak-weld",
      label: "Weak weld",
      tone: signalKey === "red" ? "danger" : "warning",
      detail: "The weld does not yet bind aim and reality strongly enough.",
    });
  }

  if (
    shapeKey === "seal" &&
    signalKey !== "override" &&
    !evidence.length
  ) {
    checks.push({
      key: "move-without-test",
      label: "Move without test",
      tone: "warning",
      detail: "This closure reads ahead of what the current box has actually tested.",
    });
  }

  if (signalKey === "red") {
    checks.push({
      key: "unsupported-support",
      label: "Unsupported support",
      tone: "danger",
      detail: "The line claims support the current box cannot carry.",
    });
  }

  if (shapeKey === "seal" && (signalKey === "amber" || signalKey === "red" || codes.has("ungrounded"))) {
    checks.push({
      key: "overclaimed-closure",
      label: "Overclaimed closure",
      tone: signalKey === "red" ? "danger" : "warning",
      detail: "The line closes too strongly for the support now present.",
    });
  }

  if (codes.has("sentence-length") || codes.has("position-overflow")) {
    checks.push({
      key: "compressible-line",
      label: "Compressible line",
      tone: "neutral",
      detail: "The line is carrying more than the preferred compact Lœgos frame.",
    });
  }

  if (
    (taggedShapeKey && taggedShapeKey !== shapeKey) ||
    Boolean(block?.formalMeta?.recastHistory?.length)
  ) {
    checks.push({
      key: "stage-confusion",
      label: "Stage confusion",
      tone: "neutral",
      detail: "The typed read and the current cast still pull in different directions.",
    });
  }

  return checks;
}

function buildCommitmentBoundarySummary(block = null, witnessBlock = null) {
  const activeText = normalizeTextLine(block?.plainText || block?.text || "");
  const witnessText = normalizeTextLine(witnessBlock?.plainText || witnessBlock?.text || "");

  if (!activeText || !witnessText) {
    return "Witness stays immutable here while the compiled line becomes the active structure you can now inspect and carry forward.";
  }

  if (activeText === witnessText) {
    return "The wording stayed close to the witness, but the line has crossed into active structure: it is now the object the box can inspect and work on.";
  }

  return "The compiled line has been reshaped from the witness so the statement can carry type, stage, and support more explicitly than the original prose.";
}

function buildSignalChangeHint(signalKey = "neutral", { hasEvidence = false, hasOverride = false } = {}) {
  if (signalKey === "green") {
    return hasEvidence
      ? "Keep the attached witnesses current if you want this line to stay grounded."
      : "Add or preserve local evidence so the grounded read stays deserved.";
  }
  if (signalKey === "amber") {
    return "Add a clearer local witness or reduce the claim until declaration and evidence actually meet.";
  }
  if (signalKey === "red") {
    return "Either add direct local evidence for this line or recast it so the claim matches what the box can honestly prove.";
  }
  if (signalKey === "override" || hasOverride) {
    return "Attach local evidence if you want this line to move from attested to grounded.";
  }
  return "Run Operate after the human declares that this material should be read.";
}

function buildSeedSectionsFromBlocks(blocks = []) {
  const sections = {
    aim: "",
    whatsHere: "",
    gap: "",
    sealed: "",
  };

  (Array.isArray(blocks) ? blocks : []).forEach((block) => {
    const title = String(block?.sectionTitle || block?.sectionLabel || "").trim().toLowerCase();
    const text = normalizeTextLine(block?.plainText || block?.text || "");
    if (!text) return;

    if (title.includes(SEED_SECTIONS.aim.toLowerCase())) {
      sections.aim = sections.aim ? `${sections.aim} ${text}` : text;
      return;
    }
    if (title.includes(SEED_SECTIONS.whatsHere.toLowerCase())) {
      sections.whatsHere = sections.whatsHere ? `${sections.whatsHere} ${text}` : text;
      return;
    }
    if (title.includes(SEED_SECTIONS.gap.toLowerCase())) {
      sections.gap = sections.gap ? `${sections.gap} ${text}` : text;
      return;
    }
    if (title.includes(SEED_SECTIONS.sealed.toLowerCase())) {
      sections.sealed = sections.sealed ? `${sections.sealed} ${text}` : text;
    }
  });

  return sections;
}

function getResolvedSeedSections(seedDocument = null) {
  const fromMarkdown = getSeedSectionsFromDocument(seedDocument);
  if (Object.values(fromMarkdown).some(Boolean)) {
    return fromMarkdown;
  }
  return buildSeedSectionsFromBlocks(seedDocument?.blocks || []);
}

export function getSignalLabel(signalKey = "neutral") {
  return SIGNAL_LABELS[normalizeSignalKey(signalKey)] || SIGNAL_LABELS.neutral;
}

export function getShapeLabel(shapeKey = "aim") {
  return SHAPE_LABELS[normalizeShapeKey(shapeKey)] || SHAPE_LABELS.aim;
}

export function getShapeFallbackLabel(shapeKey = "aim") {
  return SHAPE_FALLBACK_LABELS[normalizeShapeKey(shapeKey)] || SHAPE_FALLBACK_LABELS.aim;
}

export function getStageLabel(stageKey = "draft") {
  return STAGE_LABELS[normalizeStageKey(stageKey)] || STAGE_LABELS.draft;
}

export function getActiveBlockOverride(overrides = []) {
  return sortOverridesForDisplay(overrides).find(
    (override) =>
      override?.status === "active" &&
      !Number.isInteger(override?.spanStart) &&
      !Number.isInteger(override?.spanEnd),
  ) || null;
}

export function findWitnessBlockForActiveBlock(
  activeBlock = null,
  witnessBlocks = [],
  witnessDocumentKey = "",
) {
  if (!activeBlock) return null;

  const origin = normalizeBlockOrigin(activeBlock);
  const normalizedWitnessDocumentKey = String(witnessDocumentKey || "").trim();
  const blocks = Array.isArray(witnessBlocks) ? witnessBlocks : [];

  if (origin.importedFromBlockId) {
    const byId = blocks.find((block) => String(block?.id || "").trim() === origin.importedFromBlockId);
    if (byId) return byId;
  }

  return blocks.find((block) => {
    const blockId = String(block?.id || "").trim();
    const blockDocumentKey = String(block?.documentKey || block?.sourceDocumentKey || "").trim();
    const blockPosition = Number.isFinite(Number(block?.sourcePosition))
      ? Number(block.sourcePosition)
      : -1;

    if (origin.importedFromBlockId && blockId === origin.importedFromBlockId) return true;
    if (
      normalizedWitnessDocumentKey &&
      origin.sourceDocumentKey &&
      origin.sourceDocumentKey === normalizedWitnessDocumentKey &&
      blockDocumentKey === normalizedWitnessDocumentKey &&
      origin.sourcePosition === blockPosition
    ) {
      return true;
    }

    return origin.sourcePosition >= 0 && origin.sourcePosition === blockPosition;
  }) || null;
}

export function findActiveBlockForWitnessBlock(
  witnessBlock = null,
  activeBlocks = [],
  witnessDocumentKey = "",
) {
  if (!witnessBlock) return null;

  const blocks = Array.isArray(activeBlocks) ? activeBlocks : [];
  const witnessId = String(witnessBlock?.id || "").trim();
  const witnessPosition = Number.isFinite(Number(witnessBlock?.sourcePosition))
    ? Number(witnessBlock.sourcePosition)
    : -1;
  const normalizedWitnessDocumentKey = String(
    witnessDocumentKey ||
      witnessBlock?.documentKey ||
      witnessBlock?.sourceDocumentKey ||
      "",
  ).trim();

  return blocks.find((block) => {
    const origin = normalizeBlockOrigin(block);
    if (origin.importedFromBlockId && origin.importedFromBlockId === witnessId) return true;
    if (
      normalizedWitnessDocumentKey &&
      origin.sourceDocumentKey &&
      origin.sourceDocumentKey === normalizedWitnessDocumentKey &&
      witnessPosition >= 0 &&
      origin.sourcePosition === witnessPosition
    ) {
      return true;
    }
    return false;
  }) || null;
}

export function buildLoegosBlockView(block = null, finding = null, options = {}) {
  const normalizedBlock = block && typeof block === "object" ? block : null;
  const findingSignal = normalizeSignalKey(finding?.displaySignal || finding?.signal);
  const annotation = buildFormalSentenceAnnotations(
    normalizedBlock?.plainText || normalizedBlock?.text || "",
    {
      sentenceIdPrefix: normalizedBlock?.id || "founder-block",
      signalHint: findingSignal === "override" ? "neutral" : findingSignal,
    },
  );
  const primarySentence = annotation.sentences[0] || null;
  const shapeKey = normalizeShapeKey(primarySentence?.shapeKey || "aim");
  const diagnostics = Array.isArray(annotation?.diagnostics) ? annotation.diagnostics : [];
  const annotationSource =
    finding?.rationale ||
    finding?.uncertainty ||
    diagnostics[0]?.message ||
    defaultSignalAnnotation(findingSignal);
  const stageKey = inferStageKey(normalizedBlock, options);
  const exception = getExceptionState(findingSignal, finding);
  const evidence = Array.isArray(finding?.evidence) ? finding.evidence.filter(Boolean) : [];
  const compilerChecks = buildCompilerChecks({
    block: normalizedBlock,
    diagnostics,
    shapeKey,
    signalKey: findingSignal,
    evidence,
  });

  return {
    block: normalizedBlock,
    finding: finding || null,
    shapeKey,
    shapeLabel: getShapeLabel(shapeKey),
    shapeFallbackLabel: getShapeFallbackLabel(shapeKey),
    shapeRationale: diagnostics[0]?.message || defaultShapeRationale(shapeKey),
    signalKey: findingSignal,
    signalLabel: getSignalLabel(findingSignal),
    stageKey,
    stageLabel: getStageLabel(stageKey),
    exceptionKey: exception.key,
    exceptionMarker: exception.marker,
    exceptionLabel: exception.label,
    trustLevel: String(finding?.trustLevel || "").trim(),
    compilerChecks,
    evidence,
    annotation: truncateText(annotationSource, 148),
    annotationTone:
      findingSignal === "green"
        ? "clear"
        : findingSignal === "neutral"
          ? "neutral"
          : "warning",
  };
}

export function buildExplainPanelView({
  block = null,
  finding = null,
  contextCopy = "",
  contextTitle = "",
  contextExcerpt = "",
  contextExcerptLabel = "",
  witnessBlock = null,
  witnessTitle = "",
  activeTitle = "",
} = {}) {
  if (!block) {
    return {
      empty: true,
      title: contextTitle || "Select a block to inspect its read.",
      copy: contextCopy || "The selected block drives the explainability panel.",
    contextExcerpt,
    contextExcerptLabel,
    witnessExcerpt: "",
    witnessExcerptLabel: "",
    compareSummary: "",
    activeTitle,
    witnessTitle,
    };
  }

  const blockView = buildLoegosBlockView(block, finding);
  const evidence = Array.isArray(blockView?.evidence) ? blockView.evidence : [];
  const overrides = Array.isArray(finding?.overrides) ? sortOverridesForDisplay(finding.overrides) : [];
  const activeBlockOverride = getActiveBlockOverride(overrides);
  const signalKey = blockView.signalKey;

  const trustChain = [];
  if (finding?.trustLevel) {
    trustChain.push(`Current read: ${blockView.signalLabel} at ${finding.trustLevel}.`);
  } else {
    trustChain.push("Current state: shape-inferred only. No Operate trust level yet.");
  }
  if (finding?.overrideApplied) {
    trustChain.push(
      `Underlying machine read: ${getSignalLabel(finding?.baseSignal || finding?.signal)} at ${
        finding?.baseTrustLevel || finding?.trustLevel || "L1"
      }.`,
    );
  } else if (evidence.length) {
    trustChain.push(
      `${evidence.length} local witness${evidence.length === 1 ? "" : "es"} attached to this line.`,
    );
  } else if (signalKey !== "neutral") {
    trustChain.push("No local witness excerpt survived into this read.");
  }

  return {
    ...blockView,
    empty: false,
    evidence,
    compilerChecks: Array.isArray(blockView.compilerChecks) ? blockView.compilerChecks : [],
    overrides,
    activeBlockOverride,
    signalRationale: truncateText(
      finding?.rationale || defaultSignalRationale(signalKey, contextCopy),
      280,
    ),
    uncertainty: truncateText(
      finding?.uncertainty ||
        (signalKey === "neutral"
          ? "Signal stays neutral until the human declares an Operate run."
          : ""),
      220,
    ),
    trustChain,
    signalChangeHint: buildSignalChangeHint(signalKey, {
      hasEvidence: evidence.length > 0,
      hasOverride: Boolean(activeBlockOverride),
    }),
    witnessExcerpt: truncateText(
      witnessBlock?.plainText || witnessBlock?.text || "",
      220,
    ),
    witnessExcerptLabel:
      witnessBlock && Number.isFinite(Number(witnessBlock?.sourcePosition))
        ? `${witnessTitle || "Witness"} · line ${String(Number(witnessBlock.sourcePosition) + 1).padStart(3, "0")}`
        : witnessTitle || "",
    compareSummary: buildCommitmentBoundarySummary(block, witnessBlock),
    activeTitle,
    witnessTitle,
    contextTitle,
    contextExcerpt,
    contextExcerptLabel,
  };
}

export function buildFounderSeedState({
  seedDocument = null,
  stateSummary = null,
  operateResult = null,
  projectDrafts = [],
} = {}) {
  const sections = getResolvedSeedSections(seedDocument);
  const latestSealedDraft = [...(Array.isArray(projectDrafts) ? projectDrafts : [])]
    .filter(
      (draft) => String(draft?.status || "").trim().toUpperCase() === "SEALED",
    )
    .sort(
      (left, right) =>
        Date.parse(String(right?.updatedAt || right?.createdAt || "")) -
        Date.parse(String(left?.updatedAt || left?.createdAt || "")),
    )[0] || null;

  return [
    {
      key: "aim",
      label: SEED_SECTIONS.aim,
      value:
        truncateText(
          sections.aim || operateResult?.aim?.sentence || "Not shaped yet.",
          160,
        ) || "Not shaped yet.",
    },
    {
      key: "here",
      label: SEED_SECTIONS.whatsHere,
      value:
        truncateText(
          sections.whatsHere ||
            operateResult?.ground?.sentence ||
            "Source is still raw. Shape the seed to name what is actually here.",
          160,
        ) || "Source is still raw. Shape the seed to name what is actually here.",
    },
    {
      key: "gap",
      label: SEED_SECTIONS.gap,
      value:
        truncateText(
          sections.gap ||
            operateResult?.bridge?.sentence ||
            stateSummary?.nextRequirement ||
            "The gap becomes explicit once declaration and evidence are read together.",
          160,
        ) ||
        "The gap becomes explicit once declaration and evidence are read together.",
    },
    {
      key: "sealed",
      label: SEED_SECTIONS.sealed,
      value:
        truncateText(
          sections.sealed ||
            String(
              latestSealedDraft?.payload?.deltaStatement ||
                latestSealedDraft?.title ||
                "No receipts sealed yet.",
            ).trim(),
          160,
        ) || "No receipts sealed yet.",
    },
    {
      key: "next",
      label: "Next",
      value:
        truncateText(
          stateSummary?.nextRequirement ||
            operateResult?.nextMove ||
            "Keep one honest next move visible.",
          160,
        ) || "Keep one honest next move visible.",
    },
  ];
}
