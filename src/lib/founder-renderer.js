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

function truncateText(value = "", maxLength = 180) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
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

export function getActiveBlockOverride(overrides = []) {
  return sortOverridesForDisplay(overrides).find(
    (override) =>
      override?.status === "active" &&
      !Number.isInteger(override?.spanStart) &&
      !Number.isInteger(override?.spanEnd),
  ) || null;
}

export function buildLoegosBlockView(block = null, finding = null) {
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

  return {
    block: normalizedBlock,
    finding: finding || null,
    shapeKey,
    shapeLabel: getShapeLabel(shapeKey),
    shapeFallbackLabel: getShapeFallbackLabel(shapeKey),
    shapeRationale: diagnostics[0]?.message || defaultShapeRationale(shapeKey),
    signalKey: findingSignal,
    signalLabel: getSignalLabel(findingSignal),
    trustLevel: String(finding?.trustLevel || "").trim(),
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
} = {}) {
  if (!block) {
    return {
      empty: true,
      title: contextTitle || "Select a block to inspect its read.",
      copy: contextCopy || "The selected block drives the explainability panel.",
      contextExcerpt,
      contextExcerptLabel,
    };
  }

  const blockView = buildLoegosBlockView(block, finding);
  const evidence = Array.isArray(finding?.evidence) ? finding.evidence.filter(Boolean) : [];
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
