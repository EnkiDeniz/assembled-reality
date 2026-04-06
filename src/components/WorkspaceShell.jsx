"use client";

import Link from "next/link";
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SkipBack, Rewind, Play, Pause, FastForward, SkipForward } from "lucide-react";
import AssemblyWorkspaceScreen from "@/components/AssemblyWorkspaceScreen";
import AssemblyLane from "@/components/AssemblyLane";
import BoxHomeScreen from "@/components/BoxHomeScreen";
import BoxManagementDialog from "@/components/BoxManagementDialog";
import BoxesIndex from "@/components/BoxesIndex";
import ConfirmationQueueDialog from "@/components/ConfirmationQueueDialog";
import CloseMoveDialog from "@/components/CloseMoveDialog";
import FirstBoxComposer from "@/components/FirstBoxComposer";
import LaunchpadScreen from "@/components/LaunchpadScreen";
import MobileBottomNav from "@/components/MobileBottomNav";
import OperateScreen from "@/components/OperateScreen";
import ProjectHome from "@/components/ProjectHome";
import RealityInstrument from "@/components/RealityInstrument";
import ReceiptsScreen from "@/components/ReceiptsScreen";
import RootBar from "@/components/RootBar";
import RootEditor from "@/components/RootEditor";
import OperateSurface from "@/components/OperateSurface";
import ReceiptSurface from "@/components/ReceiptSurface";
import ReceiptSealDialog from "@/components/ReceiptSealDialog";
import SeedSurface from "@/components/SeedSurface";
import SourceRail from "@/components/SourceRail";
import StagingPanel from "@/components/StagingPanel";
import ThinkSurface from "@/components/ThinkSurface";
import WorkspaceControlSurface from "@/components/WorkspaceControlSurface";
import WorkspaceDiagnosticsRail from "@/components/WorkspaceDiagnosticsRail";
import WorkspaceGlyph from "@/components/WorkspaceGlyph";
import { ShapeGlyph, SignalChip } from "@/components/LoegosSystem";
import {
  buildWorkspaceMarkdown,
  createWorkspaceLogEntry,
  normalizeWorkspaceBlockKind,
  normalizeWorkspaceBlocks,
  normalizeWorkspaceLogEntries,
  stripMarkdownSyntax,
} from "@/lib/document-blocks";
import {
  clampListeningRate,
  formatVoiceLabel,
  VOICE_PROVIDERS,
} from "@/lib/listening";
import {
  BOX_PHASES,
  buildBoxAssemblyLaneViewModel,
  buildBoxViewModel,
  buildControlSurfaceViewModel,
  buildCreateViewModel,
  buildEntryStateViewModel,
  buildOperateViewModel,
  buildReceiptSummaryViewModel,
  buildRootViewModel,
  buildSeedViewModel,
  buildThinkViewModel,
  normalizeBoxPhase,
} from "@/lib/box-view-models";
import {
  DEFAULT_PROJECT_KEY,
  buildProjectsFromDocuments,
  getProjectByKey,
  getProjectDocuments,
  getProjectEntryDocumentKey,
  getProjectListenDocumentKey,
  hydrateProjectsWithDocuments,
  isProjectDocumentVisible,
  PRIMARY_WORKSPACE_DOCUMENT_KEY,
} from "@/lib/project-model";
import {
  buildOperateAuditPrompt,
  getOperateAssemblyDocument,
  listOperateIncludedDocuments,
} from "@/lib/operate";
import { PRODUCT_MARK } from "@/lib/product-language";
import { recordProductEvent } from "@/lib/product-analytics";
import { parseSevenAudioHeaders } from "@/lib/seven";
import {
  buildSeedFingerprint,
  getSeedDocument,
  listRealSourceDocuments,
} from "@/lib/seed-model";
import {
  buildRealityInstrumentIssue,
  buildWorkspaceRealityIssues,
  buildRealityInstrumentViewModel,
} from "@/lib/reality-instrument";
import {
  ASSEMBLY_CONFIRMATION_STATUSES,
  ASSEMBLY_PRIMARY_TAGS,
} from "@/lib/assembly-architecture";
import { getPrimaryBoxPhaseForShape, getWorkspaceShapeAndVerb } from "@/lib/loegos-system";
import {
  buildFormalBoxState,
  buildFormalSealCheck,
  buildFormalSentenceAnnotations,
} from "@/lib/formal-core/runtime";
import {
  buildWorkspaceBlockProvenanceView,
  buildWorkspaceTransferredBlock,
} from "@/lib/workspace-provenance";
import {
  deleteVoiceMemoDraft,
  loadVoiceMemoDraft,
  saveVoiceMemoDraft,
} from "@/lib/voice-memo-drafts";

const STORAGE_VERSION = 3;
const RATE_STEPS = [0.75, 1, 1.25, 1.5, 2];
const STATUS_TIMEOUT_MS = 5000;
const EMPTY_BLOCKS = [];
const WORKSPACE_MODES = {
  listen: "listen",
  assemble: "assemble",
};
const LAUNCHPAD_VIEWS = Object.freeze({
  boxes: "boxes",
  box: "box",
});
const ACTIVE_VOICE_MEMO_DRAFT_KEY = "active";
const DESKTOP_SIDECAR_PANELS = Object.freeze({
  seven: "seven",
  stage: "stage",
  details: "details",
});
const IMAGE_DERIVATION_OPTIONS = [
  { value: "document", label: "Convert to document", shortLabel: "IMAGE → DOC" },
  { value: "notes", label: "Create source notes", shortLabel: "IMAGE → NOTES" },
];
const SOURCE_ACCEPT_VALUE = ".txt,.md,.markdown,.docx,.pdf";
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);
const LAUNCH_SOURCE_HINT = "Supports PDF, DOCX, Markdown, TXT, link import, paste, and Speak note.";

function isCloseMoveSealEligible(result = null) {
  return (
    String(result?.convergence || "").trim().toLowerCase() === "convergent" &&
    Number(result?.gradient) >= 6
  );
}

function getCloseMoveMode(result = null) {
  return isCloseMoveSealEligible(result) ? "seal" : "reroute";
}

function buildCloseMoveDeltaStatement(result = null) {
  return (
    String(result?.nextMove || "").trim() ||
    String(result?.bridge?.sentence || "").trim() ||
    ""
  );
}

function buildRerouteContext(result = null, deltaStatement = "") {
  if (!result) return null;

  return {
    delta: String(deltaStatement || "").trim(),
    nextMove: String(result?.nextMove || "").trim(),
    aim: String(result?.aim?.sentence || "").trim(),
    ground: String(result?.ground?.sentence || "").trim(),
    bridge: String(result?.bridge?.sentence || "").trim(),
    createdAt: new Date().toISOString(),
  };
}

function buildRootSuggestionDocumentSummary(document = null) {
  if (!document) return null;

  const snippets = (Array.isArray(document?.blocks) ? document.blocks : [])
    .map((block) => stripMarkdownSyntax(block?.plainText || block?.text || ""))
    .map((text) => String(text || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 2);

  return {
    title: String(document?.title || "").trim(),
    subtitle: String(document?.subtitle || "").trim(),
    snippets,
  };
}

function normalizeImageDerivationMode(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "notes") return "notes";
  if (normalized === "document") return "document";
  return "";
}

function normalizePreferredImageDerivationMode(value = "") {
  return normalizeImageDerivationMode(value) || IMAGE_DERIVATION_OPTIONS[0].value;
}

function isWorkspaceMode(value) {
  return value === WORKSPACE_MODES.listen || value === WORKSPACE_MODES.assemble;
}

function normalizeWorkspaceMode(value, fallback = WORKSPACE_MODES.assemble) {
  return isWorkspaceMode(value) ? value : fallback;
}

function normalizeLaunchpadView(value, fallback = LAUNCHPAD_VIEWS.boxes) {
  return Object.values(LAUNCHPAD_VIEWS).includes(value) ? value : fallback;
}

function normalizeDesktopSidecarPanel(value, fallback = DESKTOP_SIDECAR_PANELS.details) {
  return Object.values(DESKTOP_SIDECAR_PANELS).includes(value) ? value : fallback;
}

function getDefaultDesktopSidecarPanel(phase) {
  if (phase === BOX_PHASES.create) return DESKTOP_SIDECAR_PANELS.stage;
  if (phase === BOX_PHASES.think) return DESKTOP_SIDECAR_PANELS.seven;
  return DESKTOP_SIDECAR_PANELS.details;
}

function getSevenSurface({ boxPhase = BOX_PHASES.think, workspaceMode = WORKSPACE_MODES.assemble } = {}) {
  if (boxPhase === BOX_PHASES.create) return "seed";
  if (boxPhase === BOX_PHASES.operate) return "operate";
  if (boxPhase === BOX_PHASES.receipts) return "receipts";
  return workspaceMode === WORKSPACE_MODES.listen ? "listen" : "think";
}

function browserSupportsDeviceVoice() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

function inferBoxPhaseForDocument(document = null, fallback = BOX_PHASES.think) {
  if (document?.isAssembly || document?.documentType === "assembly") {
    return BOX_PHASES.create;
  }

  return normalizeBoxPhase(fallback, BOX_PHASES.think);
}

function createInitialDocumentLogMap(documents = []) {
  return documents.reduce((map, document) => {
    map[document.documentKey] = normalizeWorkspaceLogEntries(
      document.logEntries,
      document.documentKey,
    );
    return map;
  }, {});
}

function getDocumentLogEntries(logMap, documentKey, fallback = []) {
  return normalizeWorkspaceLogEntries(
    logMap?.[documentKey] || fallback,
    documentKey,
  );
}

function mergeDocumentLogEntries(logMap, documentKey, incoming) {
  return {
    ...logMap,
    [documentKey]: mergeLogs(logMap?.[documentKey] || [], incoming),
  };
}

function applyDocumentLogState(document, logMap) {
  if (!document?.documentKey) return document;

  return {
    ...document,
    logEntries: getDocumentLogEntries(logMap, document.documentKey, document.logEntries),
  };
}

function formatActualProviderLabel(provider, voiceId = null) {
  if (!provider) return "Voice";
  return formatVoiceLabel(provider, voiceId);
}

function formatDocumentFormat(value, originalFilename = "") {
  const normalized = String(value || "markdown").toLowerCase();
  if (normalized === "docx") return "DOCX";
  if (normalized === "doc") return "DOC";
  if (normalized === "pdf") return "PDF";
  if (String(originalFilename || "").trim().toLowerCase().endsWith(".txt")) {
    return "TXT";
  }
  return "Markdown";
}

function getPrimaryDiagnosticMessage(intake = null) {
  return (
    intake?.diagnostics?.find(
      (diagnostic) =>
        diagnostic?.severity === "warning" || diagnostic?.severity === "error",
    )?.message || ""
  );
}

function getDocumentByKey(documentKey, documentCache = {}, documents = []) {
  const normalizedDocumentKey = String(documentKey || "").trim();
  if (!normalizedDocumentKey) return null;

  return (
    documentCache[normalizedDocumentKey] ||
    documents.find((document) => document.documentKey === normalizedDocumentKey) ||
    null
  );
}

function isTypingTarget(target) {
  const tagName = target?.tagName?.toLowerCase?.() || "";
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target?.isContentEditable
  );
}

function buildEmptySevenThread(documentKey = "") {
  return {
    id: "",
    documentKey,
    createdAt: null,
    updatedAt: null,
    messages: [],
  };
}

function formatSevenContextBlock(block) {
  const sourcePosition =
    typeof block?.sourcePosition === "number" ? block.sourcePosition + 1 : null;
  const label = block?.sectionLabel || block?.sourceTitle || (sourcePosition ? `Block ${sourcePosition}` : "Block");
  const text = stripMarkdownSyntax(block?.text || block?.plainText || "").trim();
  return [`${label}${sourcePosition ? ` · ${sourcePosition}` : ""}`, text].filter(Boolean).join("\n");
}

function buildSevenContextOutline(blocks = []) {
  return blocks
    .filter((block) => block?.kind === "heading")
    .slice(0, 8)
    .map((block) => {
      const sourcePosition =
        typeof block?.sourcePosition === "number" ? block.sourcePosition + 1 : null;
      return `${sourcePosition ? `${sourcePosition}. ` : ""}${stripMarkdownSyntax(block?.text || "").trim()}`;
    })
    .filter(Boolean)
    .join("\n");
}

function buildSevenRequestContext(document, focusedBlock = null) {
  const blocks = Array.isArray(document?.blocks) ? document.blocks : [];
  const focusIndex = focusedBlock
    ? Math.max(
        0,
        blocks.findIndex((block) => block.id === focusedBlock.id),
      )
    : 0;
  const start = Math.max(0, focusIndex - 2);
  const end = Math.min(blocks.length, focusIndex + 4);
  const focusBlocks = (blocks.slice(start, end).length ? blocks.slice(start, end) : blocks.slice(0, 6))
    .filter(Boolean);

  return {
    introMarkdown: String(document?.subtitle || "").trim(),
    sectionOutline: buildSevenContextOutline(blocks),
    currentLabel:
      focusedBlock && typeof focusedBlock.sourcePosition === "number"
        ? `Block ${focusedBlock.sourcePosition + 1}`
        : `Document context · ${blocks.length} block${blocks.length === 1 ? "" : "s"}`,
    currentSectionTitle: focusedBlock?.sectionLabel || document?.title || "Current document",
    currentSectionMarkdown: focusBlocks.map(formatSevenContextBlock).join("\n\n"),
  };
}

function normalizeInstrumentText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildFeedbackInstrumentIssue(message, tone = "", options = {}) {
  const normalizedMessage = normalizeInstrumentText(message);
  if (!normalizedMessage || tone !== "error") return null;

  const recovery =
    normalizedMessage.toLowerCase().includes("preserved") ||
    normalizedMessage.toLowerCase().includes("kept on this device") ||
    normalizedMessage.toLowerCase().includes("try again");

  return buildRealityInstrumentIssue({
    key: options?.issueKey || `feedback:${options?.surfaceKey || "workspace"}:${normalizedMessage}`,
    surfaceKey: options?.surfaceKey || "workspace",
    severity: recovery ? "recovery" : "blocked",
    priority: recovery ? 62 : 82,
    label: recovery ? "Recovery" : "Constraint",
    headline:
      normalizeInstrumentText(options?.headline) ||
      (recovery ? "The box preserved your place." : "The box hit a hard stop."),
    summary: normalizedMessage,
    compactSummary: normalizedMessage,
    evidence: Array.isArray(options?.evidence) ? options.evidence : [],
    moveSpace: Array.isArray(options?.moveSpace)
      ? options.moveSpace
      : [
          {
            key: recovery ? "instrument-interpret" : "instrument-interpret",
            label: "Infer with Seven",
            disabled: Boolean(options?.disableInterpret),
          },
          { key: "instrument-dismiss", label: "Dismiss" },
        ],
    sevenAssist: options?.sevenAssist || {
      intent: options?.instrumentIntent || "warning-interpret",
      context: options?.instrumentContext || {},
      surface: options?.surfaceKey || "workspace",
    },
  });
}

function buildInstrumentAssistPrompt(intent = "", context = {}) {
  const normalizedIntent = normalizeInstrumentText(intent).toLowerCase();
  if (normalizedIntent === "root-suggest") {
    return `Suggest up to three seven-word-or-fewer Roots for ${normalizeInstrumentText(context?.boxTitle) || "this box"} from the current source material.`;
  }
  if (normalizedIntent === "root-compress") {
    return `Compress this Root into up to three seven-word-or-fewer declarations: ${normalizeInstrumentText(context?.rootText)}`;
  }
  if (normalizedIntent === "root-rewrite") {
    return `Rewrite this Root and gloss into a cleaner operator form without changing the intent: ${normalizeInstrumentText(context?.rootText)} ${normalizeInstrumentText(context?.rootGloss)}`;
  }
  if (normalizedIntent === "receipt-interpret") {
    return "Infer the weakest pre-seal gap here and name the smallest honest move before sealing.";
  }
  if (normalizedIntent === "conflict-orient") {
    return "Infer the safest next move from this save conflict.";
  }
  if (normalizedIntent === "voice-recovery") {
    return "Infer the clearest recovery move from this preserved voice memo state.";
  }
  return "Infer the clearest next move from this reality state.";
}

function buildWordLayerInstrumentContext(viewModel = null, wordLayer = null) {
  const hypothesisReadyEvidence =
    wordLayer?.hypothesisReadyEvidence && typeof wordLayer.hypothesisReadyEvidence === "object"
      ? wordLayer.hypothesisReadyEvidence
      : {};

  return {
    boxTitle: String(viewModel?.boxTitle || "").trim(),
    protocolPosition: String(viewModel?.protocolPosition || "").trim(),
    protocolStateLabel: String(viewModel?.protocolStateLabel || "").trim(),
    dominantClasses: Array.isArray(wordLayer?.dominantClasses)
      ? wordLayer.dominantClasses.map((entry) => entry.label)
      : [],
    hasEnoughChronology: Boolean(wordLayer?.hasEnoughChronology),
    chronologyKind: String(wordLayer?.chronologyKind || "").trim() || "inferred",
    lowHistoryNote: String(wordLayer?.lowHistoryNote || "").trim(),
    ...hypothesisReadyEvidence,
    lakinMoments: Array.isArray(hypothesisReadyEvidence?.lakinMoments)
      ? hypothesisReadyEvidence.lakinMoments
      : Array.isArray(wordLayer?.lakinMoments)
        ? wordLayer.lakinMoments
        : [],
  };
}

function normalizeWordLayerHypotheses(result = null) {
  const hypotheses = Array.isArray(result?.hypotheses) ? result.hypotheses : [];
  return hypotheses
    .map((hypothesis) => ({
      label: normalizeInstrumentText(hypothesis?.label),
      summary: normalizeInstrumentText(hypothesis?.summary),
      evidenceTerms: Array.isArray(hypothesis?.evidenceTerms)
        ? hypothesis.evidenceTerms.map((term) => normalizeInstrumentText(term)).filter(Boolean)
        : [],
      evidenceMoments: Array.isArray(hypothesis?.evidenceMoments)
        ? hypothesis.evidenceMoments
            .map((moment) => normalizeInstrumentText(moment))
            .filter(Boolean)
        : [],
      confidence:
        String(hypothesis?.confidence || "").trim().toLowerCase() === "medium"
          ? "medium"
          : "low",
    }))
    .filter((hypothesis) => hypothesis.label && hypothesis.summary)
    .slice(0, 3);
}

function buildSevenSuggestions(focusedBlock = null) {
  if (focusedBlock) {
    return [
      "What matters in this block?",
      "Rewrite this more clearly.",
      "What evidence supports this?",
      "What should change here?",
    ];
  }

  return [
    "Summarize this document.",
    "What matters most here?",
    "Where is the strongest evidence?",
    "What should I change first?",
  ];
}

function mapFormalShapeToConfirmationTag(shapeKey = "") {
  const normalized = String(shapeKey || "").trim().toLowerCase();
  if (normalized === "aim") return ASSEMBLY_PRIMARY_TAGS.aim;
  if (normalized === "reality") return ASSEMBLY_PRIMARY_TAGS.evidence;
  return ASSEMBLY_PRIMARY_TAGS.story;
}

function getConfirmationStateView(block = null) {
  const status = String(block?.confirmationStatus || "").trim().toLowerCase();
  const tag = String(block?.primaryTag || "").trim().toLowerCase();

  if (status === ASSEMBLY_CONFIRMATION_STATUSES.confirmed) {
    return {
      label: tag ? `${tag} confirmed` : "confirmed",
      tone: "green",
    };
  }

  if (status === ASSEMBLY_CONFIRMATION_STATUSES.discarded) {
    return {
      label: "discarded",
      tone: "red",
    };
  }

  return {
    label: "draft",
    tone: "neutral",
  };
}

function buildBlockMetaDetail(block = null) {
  if (!block) return "";
  const currentTag = String(block?.primaryTag || "").trim().toLowerCase();
  if (!currentTag || currentTag === ASSEMBLY_PRIMARY_TAGS.unconfirmed) return "";
  return currentTag;
}

function buildStagedBlocksFromSevenMessage(document, message, projectKey = "") {
  const text = String(message?.content || "").trim();
  if (!text || !document?.documentKey) {
    return [];
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  const blocks = (paragraphs.length ? paragraphs : [text]).map((part, index) => ({
    id: `seven-${message?.id || Date.now()}-${index + 1}`,
    documentKey: document.documentKey,
    sourceDocumentKey: document.documentKey,
    sourcePosition: index,
    kind: normalizeWorkspaceBlockKind("", part),
    text: part,
    plainText: stripMarkdownSyntax(part),
    author: "ai",
    operation: "synthesized",
    isEditable: true,
    isPlayable: true,
    provenance: {
      transferKind: "recast",
      importedFromProjectKey: String(projectKey || "").trim(),
      importedFromDocumentKey: document.documentKey,
      importedFromBlockId: "",
      importedFromTitle: document.title || document.documentKey,
      carriedAt: new Date().toISOString(),
      carriedBy: "seven",
    },
  }));

  return normalizeWorkspaceBlocks(blocks, {
    documentKey: document.documentKey,
    defaultSourceDocumentKey: document.documentKey,
    defaultIsEditable: true,
  });
}

function getImageDerivationLabel(value = "") {
  return (
    IMAGE_DERIVATION_OPTIONS.find((option) => option.value === value)?.label ||
    IMAGE_DERIVATION_OPTIONS[0].label
  );
}

function isSupportedImageMimeType(value = "") {
  return SUPPORTED_IMAGE_MIME_TYPES.has(String(value || "").trim().toLowerCase());
}

function isImageFilename(value = "") {
  return /\.(png|jpe?g|webp|gif|heic|heif|bmp|tiff?)$/i.test(String(value || "").trim());
}

function isImageFileLike(file) {
  if (!file) return false;
  return String(file.type || "").trim().toLowerCase().startsWith("image/") || isImageFilename(file.name || "");
}

function isAudioFilename(value = "") {
  return /\.(m4a|mp3|wav|webm|mp4)$/i.test(String(value || "").trim());
}

function isAudioFileLike(file) {
  if (!file) return false;
  return String(file.type || "").trim().toLowerCase().startsWith("audio/") || isAudioFilename(file.name || "");
}

function isLegacyDocFilename(value = "") {
  return /\.doc$/i.test(String(value || "").trim());
}

function isLaunchSupportedUpload(file) {
  if (!file) return false;

  const name = String(file.name || "").trim().toLowerCase();
  const mimeType = String(file.type || "").trim().toLowerCase();

  return (
    name.endsWith(".pdf") ||
    name.endsWith(".docx") ||
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    name.endsWith(".txt") ||
    mimeType === "application/pdf" ||
    mimeType.includes("wordprocessingml") ||
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    mimeType === "text/x-markdown"
  );
}

function getSourceIntakeKind(file, sourceKind = "") {
  if (sourceKind === "voice") return "voice_memo";
  if (!file) return "unknown";
  if (isImageFileLike(file)) return "image";
  if (isAudioFileLike(file)) return "audio_upload";
  if (isLegacyDocFilename(file.name || "")) return "doc";

  const name = String(file.name || "").trim().toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "markdown";
  if (name.endsWith(".txt")) return "txt";

  const mimeType = String(file.type || "").trim().toLowerCase();
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("wordprocessingml")) return "docx";
  if (mimeType === "text/plain") return "txt";
  if (mimeType === "text/markdown" || mimeType === "text/x-markdown") return "markdown";
  return "unknown";
}

function getLaunchUploadBlockedMessage(file, sourceKind = "") {
  const intakeKind = getSourceIntakeKind(file, sourceKind);

  if (intakeKind === "voice_memo") {
    return "";
  }

  if (intakeKind === "image") {
    return "Use Photo to turn an image into a source.";
  }

  if (intakeKind === "audio_upload") {
    return "Audio file upload stays in beta for now. Use Speak note to capture a voice memo.";
  }

  if (intakeKind === "doc") {
    return "Legacy DOC upload stays in beta for now. Use DOCX, PDF, Markdown, or TXT.";
  }

  return "Version 1.0 accepts PDF, DOCX, Markdown, and TXT uploads. Use link import, paste, or Speak note for the rest.";
}

function extractSingleUrlText(text = "") {
  const normalized = String(text || "").trim();
  if (!normalized || /\s/.test(normalized)) return "";

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function formatAssetDuration(durationMs = 0) {
  const totalSeconds = Math.max(0, Math.round(Number(durationMs || 0) / 1000));
  if (!totalSeconds) return "";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRecordingElapsed(totalSeconds = 0) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function mergeRecordingChunks(chunks = []) {
  const totalLength = chunks.reduce((sum, chunk) => sum + (chunk?.length || 0), 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    if (!chunk?.length) return;
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  return merged;
}

function downsampleRecording(samples, inputRate, targetRate = 16000) {
  const normalizedInputRate = Number(inputRate || 0);
  if (!samples?.length || !Number.isFinite(normalizedInputRate) || normalizedInputRate <= 0) {
    return {
      samples: new Float32Array(0),
      sampleRate: targetRate,
    };
  }

  if (normalizedInputRate <= targetRate) {
    return {
      samples,
      sampleRate: normalizedInputRate,
    };
  }

  const ratio = normalizedInputRate / targetRate;
  const outputLength = Math.max(1, Math.round(samples.length / ratio));
  const output = new Float32Array(outputLength);

  let outputIndex = 0;
  let inputIndex = 0;

  while (outputIndex < outputLength) {
    const nextInputIndex = Math.min(samples.length, Math.round((outputIndex + 1) * ratio));
    let sum = 0;
    let count = 0;

    for (let index = inputIndex; index < nextInputIndex; index += 1) {
      sum += samples[index];
      count += 1;
    }

    output[outputIndex] = count ? sum / count : samples[Math.min(inputIndex, samples.length - 1)] || 0;
    outputIndex += 1;
    inputIndex = nextInputIndex;
  }

  return {
    samples: output,
    sampleRate: targetRate,
  };
}

function encodeMonoWaveFile(samples, sampleRate) {
  const safeSampleRate = Math.max(8000, Math.round(Number(sampleRate || 16000)));
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  function writeAscii(offset, value) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, safeSampleRate, true);
  view.setUint32(28, safeSampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index] || 0));
    view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
    offset += bytesPerSample;
  }

  return buffer;
}

function getSourceAssetLabel(asset) {
  if (!asset) return "";
  if (asset.kind === "link") {
    try {
      return new URL(asset.canonicalUrl || asset.sourceUrl || asset.url || "").hostname;
    } catch {
      return asset.label || "Original link";
    }
  }

  if (asset.kind === "audio") {
    return asset.originalFilename || asset.label || "Original audio";
  }

  return asset.originalFilename || asset.label || "Original source";
}

function dataUrlMimeType(dataUrl = "") {
  const match = String(dataUrl || "")
    .trim()
    .match(/^data:([^;,]+);base64,/i);
  return match?.[1]?.trim()?.toLowerCase() || "";
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the pasted image."));
    reader.readAsDataURL(blob);
  });
}

function summarizePolishChanges(changes = null) {
  const parts = [];
  const normalized = changes || {};

  if (normalized.decorativeLinesRemoved) {
    parts.push(
      `${normalized.decorativeLinesRemoved} decorative line${
        normalized.decorativeLinesRemoved === 1 ? "" : "s"
      }`,
    );
  }

  if (normalized.pageLinesRemoved) {
    parts.push(
      `${normalized.pageLinesRemoved} page marker${normalized.pageLinesRemoved === 1 ? "" : "s"}`,
    );
  }

  if (normalized.bulletLinesNormalized) {
    parts.push(
      `${normalized.bulletLinesNormalized} list marker${
        normalized.bulletLinesNormalized === 1 ? "" : "s"
      }`,
    );
  }

  if (normalized.repeatedParagraphsRemoved) {
    parts.push(
      `${normalized.repeatedParagraphsRemoved} repeated artifact paragraph${
        normalized.repeatedParagraphsRemoved === 1 ? "" : "s"
      }`,
    );
  }

  if (normalized.markdownEscapesRemoved) {
    parts.push(
      `${normalized.markdownEscapesRemoved} markdown escape${
        normalized.markdownEscapesRemoved === 1 ? "" : "s"
      }`,
    );
  }

  if (normalized.blocksRemoved) {
    parts.push(`${normalized.blocksRemoved} empty block${normalized.blocksRemoved === 1 ? "" : "s"}`);
  }

  return parts.length ? parts.join(", ") : "";
}

function countLiteralOccurrences(text, query) {
  if (!query) return 0;
  return String(text || "").split(query).length - 1;
}

function unescapeMarkdownEscapes(text) {
  let replacements = 0;
  const next = String(text || "").replace(/\\(\\|`|\*|_|{|}|\[|\]|\(|\)|#|\+|-|!|\.|>)/g, (_, character) => {
    replacements += 1;
    return character;
  });

  return {
    text: next,
    replacements,
  };
}

function SourceActionIcon({ kind }) {
  if (kind === "clean") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="m12 4 1.2 3.3L16.5 8.5l-3.3 1.2L12 13l-1.2-3.3L7.5 8.5l3.3-1.2z" />
        <path d="m18 13 0.8 2.2L21 16l-2.2 0.8L18 19l-0.8-2.2L15 16l2.2-0.8z" />
      </svg>
    );
  }

  if (kind === "replace") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M7 7h10" />
        <path d="m13 3 4 4-4 4" />
        <path d="M17 17H7" />
        <path d="m11 13-4 4 4 4" />
      </svg>
    );
  }

  if (kind === "unescape") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M8 5 5 12l3 7" />
        <path d="m16 5 3 7-3 7" />
        <path d="m10 17 4-10" />
      </svg>
    );
  }

  if (kind === "delete") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5.5 7h13" />
        <path d="M9.5 4.5h5" />
        <path d="M8 7l0.8 11h6.4L16 7" />
      </svg>
    );
  }

  if (kind === "close") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="m6 6 12 12" />
        <path d="M18 6 6 18" />
      </svg>
    );
  }

  return null;
}

function WorkspaceActionIcon({ kind }) {
  if (kind === "back") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M19 12H5" />
        <path d="m11 6-6 6 6 6" />
      </svg>
    );
  }

  if (kind === "listen") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="m9 7 8 5-8 5z" />
        <path d="M5 6.5v11" />
      </svg>
    );
  }

  if (kind === "assemble") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="4.5" y="5.5" width="6" height="6" rx="1.2" />
        <rect x="13.5" y="5.5" width="6" height="6" rx="1.2" />
        <rect x="9" y="14.5" width="6" height="6" rx="1.2" />
      </svg>
    );
  }

  if (kind === "browse") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4.5 7h15" />
        <path d="M4.5 12h15" />
        <path d="M4.5 17h15" />
      </svg>
    );
  }

  if (kind === "continue") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5 7.5h8.5L17 11l-3.5 3.5H5z" />
        <path d="M17 11h2" />
      </svg>
    );
  }

  if (kind === "upload") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 16V5" />
        <path d="m7.5 9.5 4.5-4.5 4.5 4.5" />
        <path d="M5 18.5h14" />
      </svg>
    );
  }

  if (kind === "photo") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5 8.5h14v10H5z" />
        <path d="M9 8.5 10.5 6h3L15 8.5" />
        <circle cx="12" cy="13.5" r="2.8" />
      </svg>
    );
  }

  if (kind === "paste-source") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="7" y="4.5" width="10" height="15" rx="1.8" />
        <path d="M9.5 3.5h5" />
        <path d="M9.5 9.5h5" />
        <path d="M9.5 13h5" />
      </svg>
    );
  }

  if (kind === "speak") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="9" y="3.5" width="6" height="10" rx="3" />
        <path d="M6.5 10.5a5.5 5.5 0 0 0 11 0" />
        <path d="M12 16v4" />
        <path d="M8.5 20h7" />
      </svg>
    );
  }

  if (kind === "clipboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M9 5.5h6" />
        <rect x="6.5" y="4" width="11" height="15.5" rx="2" />
        <path d="M10 8.5h4" />
        <path d="M9.5 12h5" />
      </svg>
    );
  }

  if (kind === "delete") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5.5 7h13" />
        <path d="M9.5 4.5h5" />
        <path d="M8 7l0.8 11h6.4L16 7" />
      </svg>
    );
  }

  if (kind === "account") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.2" />
        <path d="M5 19c1.8-3 4.1-4.5 7-4.5S17.2 16 19 19" />
      </svg>
    );
  }

  if (kind === "menu") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5 7h14" />
        <path d="M5 12h14" />
        <path d="M5 17h14" />
      </svg>
    );
  }

  if (kind === "log") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M7 6.5h10" />
        <path d="M7 11.5h10" />
        <path d="M7 16.5h6" />
        <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      </svg>
    );
  }

  return null;
}

async function readClipboardPayloadFromNavigator() {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    throw new Error("Clipboard access is unavailable here. Press Cmd/Ctrl+V in the workspace instead.");
  }

  let lastError = null;

  if (typeof navigator.clipboard.read === "function") {
    try {
      const items = await navigator.clipboard.read();
      let html = "";
      let text = "";
      let imageDataUrl = "";
      let imageMimeType = "";
      let imageFilename = "";

      for (const item of items) {
        const imageType = item.types.find((type) => isSupportedImageMimeType(type));
        if (!imageDataUrl && imageType) {
          const blob = await item.getType(imageType);
          imageDataUrl = await blobToDataUrl(blob);
          imageMimeType = blob.type || imageType;
          imageFilename = imageType.replace("image/", "clipboard-image.") || "clipboard-image.png";
          break;
        }
        if (!html && item.types.includes("text/html")) {
          const blob = await item.getType("text/html");
          html = await blob.text();
        }
        if (!text && item.types.includes("text/plain")) {
          const blob = await item.getType("text/plain");
          text = await blob.text();
        }
        if (html || text) {
          break;
        }
      }

      if (imageDataUrl || html || text) {
        return { html, text, imageDataUrl, imageMimeType, imageFilename };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (typeof navigator.clipboard.readText === "function") {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        return { html: "", text, imageDataUrl: "", imageMimeType: "", imageFilename: "" };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw new Error("Clipboard access was blocked. Press Cmd/Ctrl+V in the workspace instead.");
  }

  throw new Error("Clipboard is empty.");
}

async function getClipboardPayloadFromPasteEvent(event) {
  const items = Array.from(event?.clipboardData?.items || []);
  const imageItem = items.find(
    (item) =>
      item?.kind === "file" &&
      isSupportedImageMimeType(item?.type || ""),
  );

  if (imageItem?.getAsFile) {
    const file = imageItem.getAsFile();
    if (file) {
      return {
        html: "",
        text: "",
        imageDataUrl: await blobToDataUrl(file),
        imageMimeType: file.type || "",
        imageFilename: file.name || "clipboard-image.png",
      };
    }
  }

  const html = event?.clipboardData?.getData("text/html") || "";
  const text = event?.clipboardData?.getData("text/plain") || "";

  if (!html.trim() && !text.trim()) {
    return null;
  }

  return { html, text, imageDataUrl: "", imageMimeType: "", imageFilename: "" };
}

function toDocumentSummary(document, previous = null) {
  return {
    documentKey: document.documentKey,
    title: document.title,
    subtitle: document.subtitle || "",
    excerpt: document.excerpt || previous?.excerpt || "",
    sourceType: document.sourceType || previous?.sourceType || "upload",
    documentType: document.documentType || previous?.documentType || "source",
    format: String(document.format || previous?.format || "markdown").toLowerCase(),
    formatLabel: formatDocumentFormat(
      document.format || previous?.format || "markdown",
      document.originalFilename || previous?.originalFilename || "",
    ),
    originalFilename: document.originalFilename || previous?.originalFilename || null,
    href:
      document.documentKey === PRIMARY_WORKSPACE_DOCUMENT_KEY
        ? "/workspace"
        : `/workspace?document=${encodeURIComponent(document.documentKey)}`,
    wordCount: previous?.wordCount || 0,
    sectionCount: Array.isArray(document.blocks)
      ? document.blocks.length
      : previous?.sectionCount || 0,
    progressPercent: previous?.progressPercent || 0,
    createdAt: document.createdAt || previous?.createdAt || null,
    updatedAt: document.updatedAt || previous?.updatedAt || null,
    isAssembly: Boolean(document.isAssembly),
    isEditable: Boolean(document.isEditable),
    intakeKind: document.intakeKind || previous?.intakeKind || "upload",
    intakeDiagnostics: Array.isArray(document.intakeDiagnostics)
      ? document.intakeDiagnostics
      : previous?.intakeDiagnostics || [],
    hiddenFromProjectHome: Boolean(
      document.hiddenFromProjectHome ?? previous?.hiddenFromProjectHome,
    ),
    sourceFiles: Array.isArray(document.sourceFiles) ? document.sourceFiles : [],
    sourceAssetIds: Array.isArray(document.sourceAssetIds)
      ? document.sourceAssetIds
      : previous?.sourceAssetIds || [],
    sourceAssets: Array.isArray(document.sourceAssets)
      ? document.sourceAssets
      : previous?.sourceAssets || [],
    derivationKind: document.derivationKind || previous?.derivationKind || "",
    derivationModel: document.derivationModel || previous?.derivationModel || "",
    derivationStatus: document.derivationStatus || previous?.derivationStatus || "",
  };
}

function mergeDocumentSummary(documents, document) {
  const nextSummary = toDocumentSummary(
    document,
    documents.find((entry) => entry.documentKey === document.documentKey) || null,
  );
  const remaining = documents.filter((entry) => entry.documentKey !== document.documentKey);
  return sortDocuments(
    nextSummary.documentType === "builtin" ? [nextSummary, ...remaining] : [...remaining, nextSummary],
  );
}

function sortDocuments(documents) {
  const builtin = [];
  const sources = [];
  const assemblies = [];

  documents.forEach((document) => {
    if (document.documentType === "builtin" || document.sourceType === "builtin") {
      builtin.push(document);
      return;
    }

    if (document.isAssembly || document.documentType === "assembly") {
      assemblies.push(document);
      return;
    }

    sources.push(document);
  });

  const byUpdatedAt = (left, right) => {
    const leftTime = Date.parse(left.updatedAt || left.createdAt || 0);
    const rightTime = Date.parse(right.updatedAt || right.createdAt || 0);
    return rightTime - leftTime;
  };

  sources.sort(byUpdatedAt);
  assemblies.sort(byUpdatedAt);

  return [...builtin, ...sources, ...assemblies];
}

function removeDocumentSummary(documents, documentKey) {
  return sortDocuments(
    (Array.isArray(documents) ? documents : []).filter(
      (document) => document.documentKey !== documentKey,
    ),
  );
}

function removeDocumentFromProjects(projects, documentKey) {
  const nextUpdatedAt = new Date().toISOString();

  return (Array.isArray(projects) ? projects : []).map((project) => {
    const nextDocumentKeys = (Array.isArray(project.documentKeys) ? project.documentKeys : []).filter(
      (key) => key !== documentKey,
    );
    const nextSourceDocumentKeys = (
      Array.isArray(project.sourceDocumentKeys) ? project.sourceDocumentKeys : []
    ).filter((key) => key !== documentKey);
    const nextAssemblyDocumentKeys = (
      Array.isArray(project.assemblyDocumentKeys) ? project.assemblyDocumentKeys : []
    ).filter((key) => key !== documentKey);
    const nextCurrentAssemblyDocumentKey =
      project.currentAssemblyDocumentKey === documentKey
        ? nextAssemblyDocumentKeys[0] || null
        : project.currentAssemblyDocumentKey;

    return {
      ...project,
      documentKeys: nextDocumentKeys,
      sourceDocumentKeys: nextSourceDocumentKeys,
      assemblyDocumentKeys: nextAssemblyDocumentKeys,
      currentAssemblyDocumentKey: nextCurrentAssemblyDocumentKey,
      subtitle:
        nextCurrentAssemblyDocumentKey !== project.currentAssemblyDocumentKey
          ? ""
          : project.subtitle,
      updatedAt: nextUpdatedAt,
    };
  });
}

function mergeLogs(existing, incoming) {
  const map = new Map();

  [...existing, ...incoming].forEach((entry) => {
    if (!entry?.id) return;
    map.set(entry.id, entry);
  });

  return normalizeWorkspaceLogEntries([...map.values()]);
}

function mergeClipboard(existing, incoming) {
  const next = [...existing];
  const seen = new Set(existing.map((item) => item.id));

  incoming.forEach((item) => {
    if (seen.has(item.id)) {
      const existingIndex = next.findIndex((entry) => entry.id === item.id);
      if (existingIndex >= 0 && item?.provenance && !next[existingIndex]?.provenance) {
        next[existingIndex] = {
          ...next[existingIndex],
          provenance: item.provenance,
        };
      }
      return;
    }
    seen.add(item.id);
    next.push(item);
  });

  return next;
}

function moveListItem(items, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function readWorkspaceState(storageKey) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STORAGE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeWorkspaceState(storageKey, payload) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      version: STORAGE_VERSION,
      ...payload,
    }),
  );
}

function groupedDocuments(documents) {
  const visibleDocuments = (Array.isArray(documents) ? documents : []).filter((document) =>
    isProjectDocumentVisible(document),
  );
  return {
    sources: visibleDocuments.filter(
      (document) =>
        document.documentType === "builtin" ||
        (!document.isAssembly && document.documentType !== "assembly"),
    ),
    assemblies: visibleDocuments.filter(
      (document) => document.isAssembly || document.documentType === "assembly",
    ),
  };
}

function buildWorkspaceUrl(
  documentKey,
  projectKey = DEFAULT_PROJECT_KEY,
  {
    launchpad = false,
    launchpadView = "",
    mode = "",
    phase = "",
  } = {},
) {
  const params = new URLSearchParams();

  if (projectKey && projectKey !== DEFAULT_PROJECT_KEY) {
    params.set("project", projectKey);
  }

  if (isWorkspaceMode(mode)) {
    params.set("mode", mode);
  }

  const normalizedPhase = Object.values(BOX_PHASES).includes(phase) ? phase : "";
  if (normalizedPhase) {
    params.set("phase", normalizedPhase);
  }

  if (launchpad) {
    params.set("launchpad", "1");
    const normalizedLaunchpadView = normalizeLaunchpadView(launchpadView, "");
    if (normalizedLaunchpadView) {
      params.set("launchpadView", normalizedLaunchpadView);
    }
  }

  if (documentKey && documentKey !== PRIMARY_WORKSPACE_DOCUMENT_KEY) {
    params.set("document", documentKey);
  }

  const query = params.toString();
  return query ? `/workspace?${query}` : "/workspace";
}

function getDocumentKindLabel(document) {
  if (!document) return "Document";
  if (document.documentType === "builtin" || document.sourceType === "builtin") {
    return "Guide";
  }
  if (document.isAssembly || document.documentType === "assembly") {
    return "Seed";
  }
  if (document.derivationKind === "ocr-document") {
    return "Image → Doc";
  }
  if (document.derivationKind === "image-notes") {
    return "Image → Notes";
  }
  if (document.derivationKind === "link-document") {
    return "Link → Doc";
  }
  if (document.derivationKind === "audio-transcript") {
    return "Audio → Transcript";
  }
  return document.formatLabel || "Document";
}

function canDeleteDocument(document) {
  return (
    Boolean(document?.documentKey) &&
    document?.documentType !== "builtin" &&
    document?.sourceType !== "builtin"
  );
}

function getPrimarySourceAsset(document, kind = "") {
  const assets = Array.isArray(document?.sourceAssets) ? document.sourceAssets : [];
  const normalizedKind = String(kind || "").trim().toLowerCase();

  if (normalizedKind) {
    return assets.find((asset) => String(asset?.kind || "").trim().toLowerCase() === normalizedKind) || null;
  }

  return assets[0] || null;
}

function getDocumentBlockCount(document) {
  return Number(document?.sectionCount) || 0;
}

function getDocumentBlockCountLabel(document) {
  const blockCount = getDocumentBlockCount(document);
  return `${blockCount} block${blockCount === 1 ? "" : "s"}`;
}

function WorkspaceShelf({
  open = false,
  activeProject,
  documents,
  activeDocumentKey,
  loadingDocumentKey,
  onOpenProjectHome,
  onOpenDocument,
  onUpload,
  onPasteSource,
  onClose,
  uploading = false,
}) {
  if (!open) return null;
  const boxTitle = activeProject?.boxTitle || activeProject?.title || "Untitled Box";

  return (
    <div className={`assembler-sheet assembler-sheet--workspace ${open ? "is-open" : ""}`}>
      <div className="assembler-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="assembler-sheet__panel assembler-sheet__panel--workspace">
        <div className="assembler-sheet__header">
          <div className="assembler-home__copy">
            <span className="assembler-sheet__eyebrow">{boxTitle}</span>
            <span className="assembler-sheet__title">Sources</span>
          </div>

          <div className="assembler-sheet__section-actions">
            <button type="button" className="assembler-sheet__close" onClick={onOpenProjectHome}>
              Lane
            </button>
            <button
              type="button"
              className="assembler-sheet__close"
              onClick={onUpload}
              disabled={uploading}
            >
              {uploading ? "Importing…" : "Upload"}
            </button>
            <button type="button" className="assembler-sheet__close" onClick={onClose}>
              Done
            </button>
          </div>
        </div>

        <div className="assembler-sheet__content">
          <ListenPicker
            documents={documents}
            activeDocumentKey={activeDocumentKey}
            loadingDocumentKey={loadingDocumentKey}
            onOpenDocument={(documentKey, mode, options = {}) => {
              onClose();
              onOpenDocument(documentKey, mode, options);
            }}
          />
        </div>

        <div className="assembler-sheet__footer">
          <button
            type="button"
            className="assembler-sheet__primary"
            onClick={() => {
              onClose();
              onPasteSource();
            }}
          >
            Paste
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileSheetAction({
  icon,
  label,
  detail = "",
  onClick,
  disabled = false,
}) {
  return (
    <button
      type="button"
      className="assembler-mobile-sheet__action"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="assembler-mobile-sheet__action-icon" aria-hidden="true">
        <WorkspaceGlyph kind={icon} />
      </span>
      <span className="assembler-mobile-sheet__action-copy">
        <span className="assembler-mobile-sheet__action-label">{label}</span>
        {detail ? (
          <span className="assembler-mobile-sheet__action-detail">{detail}</span>
        ) : null}
      </span>
    </button>
  );
}

function MobileSourceSheet({
  open = false,
  intent = "switch",
  boxTitle = "Untitled Box",
  activeDocument = null,
  currentSeedDocument = null,
  documents = [],
  activeDocumentKey = "",
  loadingDocumentKey = "",
  onClose,
  onOpenDocument,
  onUpload,
  onOpenPhoto,
  onPasteSource,
  onOpenSpeak,
  onImportLink,
  uploading = false,
  linkPending = false,
}) {
  const [manualLink, setManualLink] = useState("");

  if (!open) return null;

  const normalizedLink = extractSingleUrlText(manualLink);
  const title = intent === "add" ? "Add source" : "Switch source";
  const activeSeedDocument =
    activeDocument?.documentKey && activeDocument.documentKey === currentSeedDocument?.documentKey
      ? currentSeedDocument
      : null;
  const isActiveAssemblyContext = Boolean(
    activeSeedDocument ||
      activeDocument?.isAssembly ||
      activeDocument?.documentType === "assembly",
  );
  const summaryEntries = [];

  if (activeDocument?.documentKey) {
    summaryEntries.push({
      key: `summary-${activeDocument.documentKey}`,
      eyebrow: activeSeedDocument ? "Current seed" : "Current",
      title: activeDocument.title,
      meta: `${getDocumentKindLabel(activeSeedDocument || activeDocument)} · ${getDocumentBlockCountLabel(activeSeedDocument || activeDocument)}`,
      onClick: () => {
        onClose();
        onOpenDocument(
          activeDocument.documentKey,
          isActiveAssemblyContext ? WORKSPACE_MODES.assemble : WORKSPACE_MODES.listen,
          {
            phase: isActiveAssemblyContext ? BOX_PHASES.create : BOX_PHASES.think,
          },
        );
      },
    });
  }

  if (currentSeedDocument?.documentKey && currentSeedDocument.documentKey !== activeDocument?.documentKey) {
    summaryEntries.push({
      key: `summary-${currentSeedDocument.documentKey}`,
      eyebrow: "Seed",
      title: currentSeedDocument.title,
      meta: `${getDocumentKindLabel(currentSeedDocument)} · ${getDocumentBlockCountLabel(currentSeedDocument)}`,
      onClick: () => {
        onClose();
        onOpenDocument(currentSeedDocument.documentKey, WORKSPACE_MODES.assemble, {
          phase: BOX_PHASES.create,
        });
      },
    });
  }

  const addSection = (
    <section className="assembler-mobile-sheet__section" aria-label="Add source">
      <span className="assembler-mobile-sheet__section-label">Add</span>
      <div className="assembler-mobile-sheet__panel-group assembler-mobile-sheet__panel-group--actions">
        <MobileSheetAction
          icon="upload"
          label="Upload file"
          detail="PDF, DOCX, Markdown, TXT"
          onClick={() => {
            onClose();
            onUpload();
          }}
          disabled={uploading || linkPending}
        />
        <MobileSheetAction
          icon="photo"
          label="Photo"
          detail="Camera or library"
          onClick={() => {
            onClose();
            onOpenPhoto();
          }}
          disabled={uploading || linkPending}
        />
        <MobileSheetAction
          icon="clipboard"
          label="Paste text"
          detail="Keep raw text as a source"
          onClick={() => {
            onClose();
            onPasteSource();
          }}
          disabled={uploading || linkPending}
        />
        <MobileSheetAction
          icon="speak"
          label="Speak note"
          detail="Record a voice memo"
          onClick={() => {
            onClose();
            onOpenSpeak();
          }}
          disabled={uploading || linkPending}
        />

        <div className="assembler-mobile-sheet__link">
          <label className="assembler-mobile-sheet__section-label" htmlFor="mobile-source-link">
            Add link
          </label>
          <div className="assembler-mobile-sheet__link-row">
            <input
              id="mobile-source-link"
              name="mobile-source-link"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="assembler-mobile-sheet__input"
              value={manualLink}
              onChange={(event) => setManualLink(event.target.value)}
              placeholder="Paste a URL…"
              disabled={uploading || linkPending}
              onKeyDown={(event) => {
                if (event.key === "Enter" && normalizedLink && !uploading && !linkPending) {
                  event.preventDefault();
                  onClose();
                  onImportLink(normalizedLink);
                }
              }}
            />
            <button
              type="button"
              className="assembler-mobile-sheet__submit"
              disabled={!normalizedLink || uploading || linkPending}
              onClick={() => {
                if (!normalizedLink) return;
                onClose();
                onImportLink(normalizedLink);
              }}
            >
              Add link
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  const switchSection = (
    <section className="assembler-mobile-sheet__section" aria-label="Switch source">
      <ListenPicker
        documents={documents}
        activeDocumentKey={activeDocumentKey}
        loadingDocumentKey={loadingDocumentKey}
        onOpenDocument={(documentKey, mode, options = {}) => {
          onClose();
          onOpenDocument(documentKey, mode, options);
        }}
        variant="source-sheet"
      />
    </section>
  );

  return (
    <div className="assembler-sheet assembler-sheet--workspace is-open">
      <div className="assembler-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="assembler-sheet__panel assembler-sheet__panel--workspace assembler-sheet__panel--mobile-source">
        <div className="assembler-sheet__header">
          <div className="assembler-home__copy">
            <span className="assembler-sheet__eyebrow">{boxTitle}</span>
            <span className="assembler-sheet__title">{title}</span>
          </div>

          <button type="button" className="assembler-sheet__close" onClick={onClose}>
            Done
          </button>
        </div>

        <div className="assembler-mobile-sheet__layout">
          {summaryEntries.length ? (
            <section className="assembler-mobile-sheet__section" aria-label="Current context">
              <span className="assembler-mobile-sheet__section-label">Context</span>
              <div className="assembler-mobile-sheet__panel-group assembler-mobile-sheet__panel-group--summary">
                {summaryEntries.map((entry) => (
                  <button
                    key={entry.key}
                    type="button"
                    className="assembler-mobile-sheet__summary-card"
                    onClick={entry.onClick}
                  >
                    <span className="assembler-mobile-sheet__summary-eyebrow">{entry.eyebrow}</span>
                    <strong>{entry.title}</strong>
                    <span className="assembler-mobile-sheet__summary-meta">{entry.meta}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {intent === "add" ? addSection : switchSection}
          {intent === "add" ? switchSection : addSection}
        </div>
      </div>
    </div>
  );
}

function MobileBoxSheet({
  open = false,
  activeProject = null,
  sourceCount = 0,
  hasSeed = false,
  receiptCount = 0,
  onClose,
  onGoHome,
  onOpenBoxes,
  onManageBox,
}) {
  if (!open) return null;

  const boxTitle = activeProject?.boxTitle || activeProject?.title || "Untitled Box";

  return (
    <div className="assembler-sheet assembler-sheet--workspace is-open">
      <div className="assembler-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="assembler-sheet__panel assembler-sheet__panel--workspace assembler-sheet__panel--mobile-source">
        <div className="assembler-sheet__header">
          <div className="assembler-home__copy">
            <span className="assembler-sheet__eyebrow">Box</span>
            <span className="assembler-sheet__title">{boxTitle}</span>
          </div>

          <button type="button" className="assembler-sheet__close" onClick={onClose}>
            Done
          </button>
        </div>

        <div className="assembler-mobile-sheet__box-summary">
          <span>{sourceCount} real source{sourceCount === 1 ? "" : "s"}</span>
          <span>{hasSeed ? "Seed ready" : "No seed yet"}</span>
          <span>{receiptCount} proof draft{receiptCount === 1 ? "" : "s"}</span>
        </div>

        <div className="assembler-mobile-sheet__layout">
          <section className="assembler-mobile-sheet__section" aria-label="Box actions">
            <span className="assembler-mobile-sheet__section-label">Actions</span>
            <div className="assembler-mobile-sheet__panel-group">
              <MobileSheetAction
                icon="box"
                label="Open lane"
                detail="Return to Assembly lane"
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
              />
              <MobileSheetAction
                icon="open"
                label="All boxes"
                detail="Switch or create a box"
                onClick={() => {
                  onClose();
                  onOpenBoxes();
                }}
              />
              <MobileSheetAction
                icon="manage"
                label="Manage box"
                detail="Rename, pin, archive, or delete"
                onClick={() => {
                  onClose();
                  onManageBox();
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function WorkspaceLaunchpad({
  launchpadView = LAUNCHPAD_VIEWS.boxes,
  activeProject,
  activeProjectKey,
  projects,
  documents,
  projectDrafts = [],
  getReceiptsConnectionStatus = "DISCONNECTED",
  getReceiptsConnectionLastError = "",
  projectActionPending = "",
  loadingDocumentKey = "",
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
  onManageProjects,
  onToggleProjectPinned,
  onToggleProjectArchived,
  onOpenReceipts,
  onOpenDocument,
  onOpenProject,
  onBrowseBoxes,
  onOpenRoot,
  onRunContextualAction,
  onInterpretWordLayer,
  onResumeProject,
  onOpenIntake,
  onInspectEvidence,
  wordLayerHypotheses = [],
  wordLayerHypothesesPending = false,
  wordLayerHypothesesError = "",
  resumeSessionSummary = null,
}) {
  const grouped = groupedDocuments(documents);
  const currentAssemblyDocument =
    (activeProject?.currentAssemblyDocumentKey &&
      documents.find((document) => document.documentKey === activeProject.currentAssemblyDocumentKey)) ||
    grouped.assemblies[0] ||
    null;
  const boxViewModel = buildBoxViewModel({
    activeProject,
    projectDocuments: documents,
    currentAssemblyDocument,
    projectDrafts,
    resumeSessionSummary,
    connectionStatus: getReceiptsConnectionStatus,
    connectionLastError: getReceiptsConnectionLastError,
  });
  const assemblyLaneViewModel = buildBoxAssemblyLaneViewModel({
    activeProject,
    projectDocuments: documents,
    currentAssemblyDocument,
    projectDrafts,
    resumeSessionSummary,
    connectionStatus: getReceiptsConnectionStatus,
    connectionLastError: getReceiptsConnectionLastError,
  });
  const resumeTarget = boxViewModel?.resumeTarget || null;
  const guideDocument =
    grouped.sources.find(
      (document) => document?.documentType === "builtin" || document?.sourceType === "builtin",
    ) || null;
  const realSourceDocuments = grouped.sources.filter((document) => document !== guideDocument);
  const currentPositionAction =
    activeProjectKey
      ? {
          label: resumeTarget?.title ? "Resume" : "Return to box",
          disabled: projectActionPending === activeProjectKey,
          onClick: () => onResumeProject?.(activeProjectKey),
        }
      : null;

  if (normalizeLaunchpadView(launchpadView, LAUNCHPAD_VIEWS.boxes) === LAUNCHPAD_VIEWS.boxes) {
    return (
      <BoxesIndex
        activeProject={activeProject}
        activeProjectKey={activeProjectKey}
        projects={projects}
        resumeTarget={resumeTarget}
        projectActionPending={projectActionPending}
        onOpenProjectHome={onOpenProject}
        onResumeProject={onResumeProject}
        onManageProjects={onManageProjects}
        onOpenIntake={onOpenIntake}
        onToggleProjectPinned={onToggleProjectPinned}
        onToggleProjectArchived={onToggleProjectArchived}
      />
    );
  }

  return (
    <BoxHomeScreen
      title={boxViewModel?.boxTitle || activeProject?.boxTitle || activeProject?.title || "Untitled Box"}
      subtitle={
        resumeTarget?.detail ||
        "Orient in the box, inspect the latest materials, then enter the room that matches the next move."
      }
      activeShape="aim"
      activeVerb="declare"
    >
      <ProjectHome
        boxViewModel={boxViewModel}
        activeProject={activeProject}
        loadingDocumentKey={loadingDocumentKey}
        guideDocument={guideDocument}
        sourceDocuments={realSourceDocuments}
        currentPositionAction={currentPositionAction}
        onBrowseBoxes={onBrowseBoxes}
        onOpenReceipts={onOpenReceipts}
        onOpenDocument={onOpenDocument}
        getDocumentBlockCountLabel={getDocumentBlockCountLabel}
        getDocumentKindLabel={getDocumentKindLabel}
        sourceOpenMode={WORKSPACE_MODES.listen}
      />

      <AssemblyLane
        viewModel={assemblyLaneViewModel}
        onRunContextualAction={onRunContextualAction}
        onInterpretWordLayer={onInterpretWordLayer}
        wordLayerHypotheses={wordLayerHypotheses}
        wordLayerHypothesesPending={wordLayerHypothesesPending}
        wordLayerHypothesesError={wordLayerHypothesesError}
        onOpenEntry={(entry) => {
          if (entry?.actionKind === "root") {
            onOpenRoot?.();
            return;
          }

          if (entry?.actionKind === "receipt") {
            onOpenReceipts();
            return;
          }

          if (!entry?.documentKey) return;

          const openAsSeed = entry.actionKind === "seed";
          onOpenDocument(
            entry.documentKey,
            WORKSPACE_MODES.assemble,
            {
              phase: openAsSeed ? BOX_PHASES.create : BOX_PHASES.think,
            },
          );
        }}
        onInspectEvidence={(entry) => {
          onInspectEvidence?.(entry);
        }}
      />
    </BoxHomeScreen>
  );
}

function ListenPicker({
  documents,
  activeDocumentKey,
  loadingDocumentKey,
  onOpenDocument,
  variant = "default",
}) {
  const grouped = groupedDocuments(documents);

  function renderDocumentRow(document) {
    const isSeed = document?.isAssembly || document?.documentType === "assembly";

    return (
      <div
        key={document.documentKey}
        className={`assembler-document-row assembler-document-row--picker ${
          document.documentKey === activeDocumentKey ? "is-active" : ""
        }`}
      >
        <button
          type="button"
          className="assembler-document-row__quick"
          onClick={() => onOpenDocument(document.documentKey, WORKSPACE_MODES.listen)}
          aria-label={`Listen to ${document.title}`}
        >
          <WorkspaceGlyph kind="listen" />
        </button>
        <button
          type="button"
          className="assembler-document-row__body"
          onClick={() =>
            onOpenDocument(document.documentKey, WORKSPACE_MODES.assemble, {
              phase: isSeed ? BOX_PHASES.create : BOX_PHASES.think,
            })
          }
        >
          <span className="assembler-document-row__title">{document.title}</span>
          <span className="assembler-document-row__meta">
            {getDocumentBlockCountLabel(document)}
          </span>
        </button>
        <span className="assembler-document-row__badge">
          {loadingDocumentKey === document.documentKey
            ? "Loading…"
            : getDocumentKindLabel(document)}
        </span>
      </div>
    );
  }

  return (
    <div className={`assembler-listen-picker ${variant === "source-sheet" ? "assembler-listen-picker--sheet" : ""}`}>
      <div className="assembler-listen-picker__section">
        <span className="assembler-listen-picker__label">Sources</span>
        <div className="assembler-listen-picker__panel">
          {grouped.sources.length
            ? grouped.sources.map((document) => renderDocumentRow(document))
            : <span className="assembler-listen-picker__empty">No visible sources.</span>}
        </div>
      </div>

      <div className="assembler-listen-picker__section">
        <span className="assembler-listen-picker__label">Seeds</span>
        <div className="assembler-listen-picker__panel">
          {grouped.assemblies.length
            ? grouped.assemblies.map((document) => renderDocumentRow(document))
            : <span className="assembler-listen-picker__empty">No seed yet.</span>}
        </div>
      </div>
    </div>
  );
}

function ListenSurface({
  activeDocument,
  activeDocumentWarning,
  instrumentViewModel = null,
  blocks,
  currentBlockId,
  focusedBlockId,
  nextBlockId,
  onFocusBlock,
  onSwitchToAssemble,
  pickerOpen,
  onTogglePicker,
  onOpenProjectHome,
  onOpenDocument,
  onInstrumentMove,
  projectDocuments,
  loadingDocumentKey,
  onOpenLog,
  onExportDocument,
  isMobileLayout = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {!isMobileLayout ? (
        <div className="assembler-listen__chrome">
          <div className="assembler-listen__topbar">
            <button
              type="button"
              className="assembler-listen__topbar-icon"
              onClick={onOpenProjectHome}
              aria-label="Open Assembly lane"
            >
              <WorkspaceActionIcon kind="back" />
            </button>

            <span className="assembler-listen__topbar-title">{activeDocument.title}</span>

            <div className="assembler-listen__topbar-actions">
              <button
                type="button"
                className={`assembler-listen__topbar-button ${pickerOpen ? "is-active" : ""}`}
                onClick={onTogglePicker}
              >
                Sources
              </button>

              <div className="assembler-listen__menu">
                <button
                  type="button"
                  className="assembler-listen__topbar-icon"
                  onClick={() => setMenuOpen((value) => !value)}
                  aria-label="More listening actions"
                >
                  <WorkspaceActionIcon kind="menu" />
                </button>

                {menuOpen ? (
                  <div className="assembler-listen__menu-panel">
                    <button
                      type="button"
                      className="assembler-listen__menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onTogglePicker();
                      }}
                    >
                      Sources
                    </button>
                    <button
                      type="button"
                      className="assembler-listen__menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onSwitchToAssemble();
                      }}
                    >
                      Seed
                    </button>
                    <button
                      type="button"
                      className="assembler-listen__menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenLog();
                      }}
                    >
                      Receipts
                    </button>
                    <button
                      type="button"
                      className="assembler-listen__menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onExportDocument();
                      }}
                    >
                      Export Document
                    </button>
                    <Link
                      href="/account"
                      className="assembler-listen__menu-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      Account
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {pickerOpen ? (
            <ListenPicker
              documents={projectDocuments}
              activeDocumentKey={activeDocument.documentKey}
              loadingDocumentKey={loadingDocumentKey}
              onOpenDocument={onOpenDocument}
            />
          ) : null}
        </div>
      ) : null}

      <section className="assembler-surface assembler-surface--listen">
        <div className="assembler-listen">
          {activeDocument.subtitle || activeDocumentWarning || instrumentViewModel ? (
            <div className="assembler-listen__lead">
              {activeDocument.subtitle ? (
                <p className="assembler-listen__subtitle">{activeDocument.subtitle}</p>
              ) : null}
              {instrumentViewModel ? (
                <RealityInstrument
                  viewModel={instrumentViewModel}
                  variant="inline"
                  onMove={onInstrumentMove}
                />
              ) : activeDocumentWarning ? (
                <p className="assembler-listen__warning">{activeDocumentWarning}</p>
              ) : null}
            </div>
          ) : null}

          <div className="assembler-listen__blocks">
            {blocks.map((block) => {
              const headingText = block.text.replace(/^#{1,6}\s+/, "");

              return (
                <article
                  key={block.id}
                  className={`assembler-listen-block is-${block.kind} ${
                    block.id === currentBlockId ? "is-playing" : ""
                  } ${block.id === nextBlockId ? "is-next" : ""} ${
                    block.id === focusedBlockId ? "is-focused" : ""
                  }`}
                  onClick={() => onFocusBlock(block.id)}
                >
                  <span className="assembler-listen-block__index">
                    {String(block.sourcePosition + 1).padStart(3, "0")}
                  </span>

                  <div className="assembler-listen-block__body">
                    {block.kind === "heading" ? (
                      <h2 className="assembler-listen-block__heading">{headingText}</h2>
                    ) : block.kind === "list" ? (
                      <div className="assembler-listen-block__text">
                        {String(block.text || "")
                          .split("\n")
                          .filter(Boolean)
                          .map((line, index) => (
                            <div key={`${block.id}-listen-line-${index}`} className="assembler-listen-block__list-line">
                              <span className="assembler-listen-block__bullet">•</span>
                              <span>{line.replace(/^[-+*]\s+/, "").trim()}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="assembler-listen-block__text">{headingText}</div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function ImageIntakeChooser({
  open = false,
  draft = null,
  pending = false,
  preferredMode = IMAGE_DERIVATION_OPTIONS[0].value,
  onChoose,
  onClose,
}) {
  if (!open || !draft) return null;

  const resolvedFilename = draft.filename || "Clipboard image";
  const resolvedMimeType =
    draft.mimeType || dataUrlMimeType(draft?.payload?.imageDataUrl || "") || "image";
  const sourceLabel = draft.source === "paste" ? "Pasted image" : "Uploaded image";

  return (
    <div className="assembler-image-chooser">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close image import chooser"
        onClick={pending ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-intake-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <span className="assembler-sheet__eyebrow">{sourceLabel}</span>
            <h2 id="image-intake-title" className="assembler-image-chooser__title">
              Image
            </h2>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={pending ? undefined : onClose}
            disabled={pending}
          >
            Close
          </button>
        </div>

        <div className="assembler-image-chooser__meta">
          <span>{resolvedFilename}</span>
          <span>{resolvedMimeType.replace("image/", "").toUpperCase()}</span>
        </div>

        <div className="assembler-image-chooser__actions">
          {IMAGE_DERIVATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`assembler-image-chooser__action ${
                preferredMode === option.value ? "is-primary" : ""
              }`}
              onClick={() => onChoose(option.value)}
              disabled={pending}
            >
              <span className="assembler-image-chooser__action-label">{option.shortLabel}</span>
              <span className="assembler-image-chooser__action-title">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LinkIntakeChooser({
  open = false,
  draft = null,
  pending = false,
  onFetchLink,
  onPasteRaw,
  onClose,
}) {
  if (!open || !draft?.url) return null;

  return (
    <div className="assembler-image-chooser assembler-image-chooser--link">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close link import chooser"
        onClick={pending ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-intake-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <span className="assembler-sheet__eyebrow">Pasted link</span>
            <h2 id="link-intake-title" className="assembler-image-chooser__title">
              Link
            </h2>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={pending ? undefined : onClose}
            disabled={pending}
          >
            Close
          </button>
        </div>

        <div className="assembler-image-chooser__meta">
          <span className="assembler-link-chooser__url">{draft.url}</span>
        </div>

        <div className="assembler-image-chooser__actions">
          <button
            type="button"
            className="assembler-image-chooser__action is-primary"
            onClick={onFetchLink}
            disabled={pending}
          >
            <span className="assembler-image-chooser__action-label">LINK</span>
            <span className="assembler-image-chooser__action-title">Import page</span>
          </button>

          <button
            type="button"
            className="assembler-image-chooser__action"
            onClick={onPasteRaw}
            disabled={pending}
          >
            <span className="assembler-image-chooser__action-label">TEXT</span>
            <span className="assembler-image-chooser__action-title">Keep as text</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteDocumentDialog({
  open = false,
  document = null,
  pending = false,
  errorMessage = "",
  onConfirm,
  onClose,
}) {
  if (!open || !document?.documentKey) return null;

  const documentTypeLabel =
    document.isAssembly || document.documentType === "assembly"
      ? "seed"
      : "source";

  return (
    <div className="assembler-image-chooser assembler-image-chooser--delete">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close delete dialog"
        onClick={pending ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel assembler-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-document-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <span className="assembler-sheet__eyebrow">Delete {documentTypeLabel}</span>
            <h2 id="delete-document-title" className="assembler-image-chooser__title">
              {document.title}
            </h2>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={pending ? undefined : onClose}
            disabled={pending}
          >
            Close
          </button>
        </div>

        <p className="assembler-delete-dialog__body">
          This removes the whole {documentTypeLabel}, including its listening state,
          staging references, and workspace receipts.
        </p>

        {errorMessage ? (
          <p className="assembler-delete-dialog__error" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}

        <div className="assembler-delete-dialog__actions">
          <button
            type="button"
            className="terminal-button"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="terminal-button assembler-delete-dialog__confirm"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Deleting…" : `Delete ${documentTypeLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function DropAnythingSheet({
  open = false,
  pending = false,
  onClose,
  onUpload,
  onPhoto,
  onPaste,
  onSpeak,
  onImportLink,
}) {
  const [manualLink, setManualLink] = useState("");

  if (!open) return null;

  const normalizedLink = extractSingleUrlText(manualLink);

  return (
    <div className="assembler-image-chooser assembler-image-chooser--intake">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close intake sheet"
        onClick={pending ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel assembler-drop-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drop-anything-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <h2 id="drop-anything-title" className="assembler-image-chooser__title">
              Add source
            </h2>
            <p className="assembler-drop-sheet__note">{LAUNCH_SOURCE_HINT}</p>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={pending ? undefined : onClose}
            disabled={pending}
          >
            Close
          </button>
        </div>

        <div className="assembler-drop-sheet__actions">
          <button
            type="button"
            className="assembler-drop-sheet__action is-primary"
            onClick={onUpload}
            disabled={pending}
          >
            <span className="assembler-drop-sheet__action-icon" aria-hidden="true">
              <WorkspaceGlyph kind="upload" />
            </span>
            <span className="assembler-drop-sheet__action-copy">
              <span className="assembler-drop-sheet__action-title">Upload file</span>
            </span>
          </button>

          <button
            type="button"
            className="assembler-drop-sheet__action"
            onClick={onPhoto}
            disabled={pending}
          >
            <span className="assembler-drop-sheet__action-icon" aria-hidden="true">
              <WorkspaceGlyph kind="photo" />
            </span>
            <span className="assembler-drop-sheet__action-copy">
              <span className="assembler-drop-sheet__action-title">Photo library</span>
            </span>
          </button>

          <button
            type="button"
            className="assembler-drop-sheet__action"
            onClick={onPaste}
            disabled={pending}
          >
            <span className="assembler-drop-sheet__action-icon" aria-hidden="true">
              <WorkspaceGlyph kind="clipboard" />
            </span>
            <span className="assembler-drop-sheet__action-copy">
              <span className="assembler-drop-sheet__action-title">Paste text</span>
            </span>
          </button>

          <button
            type="button"
            className="assembler-drop-sheet__action"
            onClick={onSpeak}
            disabled={pending}
          >
            <span className="assembler-drop-sheet__action-icon" aria-hidden="true">
              <WorkspaceGlyph kind="speak" />
            </span>
            <span className="assembler-drop-sheet__action-copy">
              <span className="assembler-drop-sheet__action-title">Speak note</span>
            </span>
          </button>
        </div>

        <div className="assembler-drop-sheet__link">
          <label className="assembler-drop-sheet__label" htmlFor="manual-link-input">
            Link
          </label>
          <div className="assembler-drop-sheet__link-row">
            <input
              id="manual-link-input"
              name="manual-link-input"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="assembler-drop-sheet__input"
              value={manualLink}
              onChange={(event) => setManualLink(event.target.value)}
              placeholder="Paste a URL…"
              disabled={pending}
              onKeyDown={(event) => {
                if (event.key === "Enter" && normalizedLink && !pending) {
                  event.preventDefault();
                  onImportLink(normalizedLink);
                }
              }}
            />
            <button
              type="button"
              className="assembler-drop-sheet__submit"
              disabled={!normalizedLink || pending}
              onClick={() => {
                if (normalizedLink) {
                  onImportLink(normalizedLink);
                }
              }}
            >
              Add link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoSourceSheet({
  open = false,
  pending = false,
  onClose,
  onTakePhoto,
  onChooseLibrary,
}) {
  if (!open) return null;

  return (
    <div className="assembler-image-chooser assembler-image-chooser--intake">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close photo intake"
        onClick={pending ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel assembler-drop-sheet assembler-drop-sheet--photo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-intake-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <h2 id="photo-intake-title" className="assembler-image-chooser__title">
              Photo
            </h2>
            <p className="assembler-drop-sheet__note">
              Capture a photo or choose one from your library, then turn it into a source.
            </p>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={pending ? undefined : onClose}
            disabled={pending}
          >
            Close
          </button>
        </div>

        <div className="assembler-drop-sheet__actions">
          <button
            type="button"
            className="assembler-drop-sheet__action is-primary"
            onClick={onTakePhoto}
            disabled={pending}
          >
            <span className="assembler-drop-sheet__action-icon" aria-hidden="true">
              <WorkspaceGlyph kind="photo" />
            </span>
            <span className="assembler-drop-sheet__action-copy">
              <span className="assembler-drop-sheet__action-title">Take photo</span>
            </span>
          </button>

          <button
            type="button"
            className="assembler-drop-sheet__action"
            onClick={onChooseLibrary}
            disabled={pending}
          >
            <span className="assembler-drop-sheet__action-icon" aria-hidden="true">
              <WorkspaceGlyph kind="upload" />
            </span>
            <span className="assembler-drop-sheet__action-copy">
              <span className="assembler-drop-sheet__action-title">Photo library</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function VoiceRecorderDialog({
  open = false,
  phase = "idle",
  elapsedSeconds = 0,
  level = 0,
  errorMessage = "",
  hasSavedDraft = false,
  draftFilename = "",
  instrumentViewModel = null,
  onClose,
  onStart,
  onPause,
  onResume,
  onStop,
  onRetryDraft,
  onSaveDraft,
  onDiscardDraft,
  onInstrumentMove,
}) {
  if (!open) return null;

  const recording = phase === "recording";
  const paused = phase === "paused";
  const busy = phase === "requesting" || phase === "finishing" || phase === "transcribing";
  const meterLevel = Math.max(0.06, Math.min(1, Number(level || 0)));
  const headline =
    phase === "requesting"
      ? "Getting the mic"
      : phase === "recording"
        ? "Listening"
        : phase === "paused"
          ? "Paused"
          : phase === "finishing"
            ? "Wrapping up"
            : phase === "transcribing"
              ? "Creating source"
              : hasSavedDraft
                ? "Voice memo kept"
              : "Start talking";
  return (
    <div className="assembler-image-chooser assembler-image-chooser--recorder assembler-voice-screen">
      <button
        type="button"
        className="assembler-image-chooser__backdrop assembler-voice-screen__backdrop"
        aria-label="Close recorder"
        onClick={busy ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel assembler-recorder assembler-voice-screen__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-recorder-title"
      >
        <div className="assembler-voice-screen__top">
          <span className={`assembler-voice-screen__live ${recording ? "is-live" : ""} ${paused ? "is-paused" : ""}`}>
            Speak
          </span>
          <button
            type="button"
            className="assembler-sheet__close assembler-voice-screen__close"
            onClick={busy ? undefined : onClose}
            disabled={busy}
          >
            Close
          </button>
        </div>

        <div className="assembler-voice-screen__center">
          <h2 id="voice-recorder-title" className="assembler-voice-screen__title">
            {headline}
          </h2>
          <p className="assembler-voice-screen__time">{formatRecordingElapsed(elapsedSeconds)}</p>
          <div className="assembler-voice-screen__meter" aria-hidden="true">
            <span
              className={`assembler-voice-screen__meter-fill ${recording ? "is-live" : ""} ${paused ? "is-paused" : ""}`}
              style={{ transform: `scaleX(${meterLevel})` }}
            />
          </div>
          {instrumentViewModel ? (
            <RealityInstrument
              viewModel={instrumentViewModel}
              variant="inline"
              onMove={onInstrumentMove}
            />
          ) : errorMessage ? (
            <p className="assembler-voice-screen__detail is-error">{errorMessage}</p>
          ) : null}
        </div>

        <div className="assembler-voice-screen__controls">
          {phase === "idle" && hasSavedDraft && !instrumentViewModel ? (
            <div className="assembler-voice-screen__recovery">
              <button
                type="button"
                className="assembler-voice-screen__secondary"
                onClick={onRetryDraft}
                disabled={busy}
              >
                Retry
              </button>
              <button
                type="button"
                className="assembler-voice-screen__secondary"
                onClick={onSaveDraft}
                disabled={busy}
              >
                Save recording
              </button>
              <button
                type="button"
                className="assembler-voice-screen__stop"
                onClick={onDiscardDraft}
                disabled={busy}
              >
                Discard
              </button>
            </div>
          ) : phase === "idle" ? (
            <>
              <span className="assembler-voice-screen__secondary-placeholder" aria-hidden="true" />
              <button
                type="button"
                className="assembler-voice-screen__mic"
                onClick={onStart}
                disabled={busy}
                aria-label="Start recording"
              >
                <WorkspaceActionIcon kind="speak" />
              </button>
              <span className="assembler-voice-screen__stop-placeholder" aria-hidden="true" />
            </>
          ) : (
            <>
              <span className="assembler-voice-screen__secondary-placeholder" aria-hidden="true" />
              <button
                type="button"
                className={`assembler-voice-screen__mic ${recording ? "is-live" : ""} ${paused ? "is-paused" : ""}`}
                onClick={paused ? onResume : onPause}
                disabled={busy || (!recording && !paused)}
                aria-label={paused ? "Resume recording" : "Pause recording"}
              >
                {paused ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="m9 7 8 5-8 5z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M9 7.5v9" />
                    <path d="M15 7.5v9" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                className="assembler-voice-screen__stop"
                onClick={onStop}
                disabled={busy || (!recording && !paused)}
              >
                {busy && phase === "transcribing" ? "Creating…" : "Stop"}
              </button>
            </>
          )}
        </div>
        {hasSavedDraft && draftFilename ? (
          <p className="assembler-voice-screen__detail">{draftFilename}</p>
        ) : null}
      </div>
    </div>
  );
}

function SourceActionButton({
  kind,
  label,
  active = false,
  disabled = false,
  danger = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`assembler-icon-button ${active ? "is-active" : ""} ${danger ? "is-danger" : ""}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <SourceActionIcon kind={kind} />
    </button>
  );
}

function SourceCleanupTray({
  findValue,
  replaceValue,
  pendingAction = "",
  onFindChange,
  onReplaceChange,
  onReplaceAll,
  onDeleteMatches,
  onClose,
}) {
  const replaceDisabled = !findValue.trim() || Boolean(pendingAction);
  const deleteDisabled = !findValue.trim() || Boolean(pendingAction);

  return (
    <div className="assembler-cleanup">
      <input
        className="assembler-cleanup__input"
        value={findValue}
        onChange={(event) => onFindChange(event.target.value)}
        placeholder="Find"
        aria-label="Find text"
      />
      <input
        className="assembler-cleanup__input"
        value={replaceValue}
        onChange={(event) => onReplaceChange(event.target.value)}
        placeholder="Replace"
        aria-label="Replace with"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !replaceDisabled) {
            event.preventDefault();
            onReplaceAll();
          }
        }}
      />
      <div className="assembler-cleanup__actions">
        <SourceActionButton
          kind="replace"
          label={pendingAction === "replace" ? "Replacing…" : "Replace all"}
          disabled={replaceDisabled}
          onClick={onReplaceAll}
        />
        <SourceActionButton
          kind="delete"
          label={pendingAction === "deleteMatches" ? "Deleting…" : "Delete matching blocks"}
          disabled={deleteDisabled}
          danger
          onClick={onDeleteMatches}
        />
        <SourceActionButton kind="close" label="Close cleanup tools" onClick={onClose} />
      </div>
    </div>
  );
}

function WorkspaceToolbar({
  viewModel,
  instrument = null,
  activeSidecar = "",
  onSetBoxPhase,
  onOpenBoxes,
  onOpenBoxHome,
  onOpenIntake,
  onOpenSpeak,
  onOpenSeven,
  onOpenStage,
  onRunOperate,
  onOpenReceipts,
  onManageBox,
  onOpenConfirmation,
  onOpenRoot,
  onInstrumentMove,
  isMobileLayout = false,
  receiptAttentionTone = "",
}) {
  return (
    <WorkspaceControlSurface
      viewModel={viewModel}
      instrument={instrument}
      isMobileLayout={isMobileLayout}
      activeSidecar={activeSidecar}
      onOpenBoxes={onOpenBoxes}
      onOpenBoxHome={onOpenBoxHome}
      onSelectPhase={onSetBoxPhase}
      onOpenIntake={onOpenIntake}
      onOpenSpeak={onOpenSpeak}
      onOpenSeven={onOpenSeven}
      onOpenStage={onOpenStage}
      onRunOperate={onRunOperate}
      onOpenReceipts={onOpenReceipts}
      onManageBox={onManageBox}
      onOpenConfirmation={onOpenConfirmation}
      onOpenRoot={onOpenRoot}
      onInstrumentMove={onInstrumentMove}
      receiptAttentionTone={receiptAttentionTone}
    />
  );
}

function SidecarTab({ icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      className={`assembler-sidecar-shell__tab ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      <WorkspaceGlyph kind={icon} />
      <span>{label}</span>
    </button>
  );
}

function DetailsMetric({ label, value, detail = "" }) {
  return (
    <article className="assembler-details-panel__metric">
      <span className="assembler-details-panel__metric-label">{label}</span>
      <strong className="assembler-details-panel__metric-value">{value}</strong>
      {detail ? <span className="assembler-details-panel__metric-detail">{detail}</span> : null}
    </article>
  );
}

function DetailsRow({ label, value, detail = "" }) {
  return (
    <div className="assembler-details-panel__row">
      <span className="assembler-details-panel__row-label">{label}</span>
      <div className="assembler-details-panel__row-copy">
        <strong className="assembler-details-panel__row-value">{value}</strong>
        {detail ? <span className="assembler-details-panel__row-detail">{detail}</span> : null}
      </div>
    </div>
  );
}

function WorkspaceDetailsPanel({
  activeProject = null,
  activeDocument = null,
  currentSeedDocument = null,
  activeDocumentAsset = null,
  activeDocumentWarning = "",
  receiptSummary = null,
  clipboardCount = 0,
  stagedCount = 0,
  sourceCount = 0,
  seedCount = 0,
  getDocumentKindLabel,
  getDocumentBlockCountLabel,
}) {
  const boxTitle = activeProject?.boxTitle || activeProject?.title || "Untitled Box";
  const latestProofLabel =
    receiptSummary?.latestDraftStatusLabel ||
    (receiptSummary?.draftCount ? "Draft ready" : "No proof yet");
  const latestProofDetail =
    receiptSummary?.latestDraftTitle ||
    receiptSummary?.syncLine ||
    "Draft a receipt when the box is ready.";
  const activeDocumentLabel = activeDocument?.title || currentSeedDocument?.title || "No active focus";
  const activeDocumentDetail = activeDocument
    ? `${getDocumentKindLabel(activeDocument)} · ${getDocumentBlockCountLabel(activeDocument)}`
    : "Open a source or seed to keep the current working context visible.";
  const queueCount = Math.max(0, Number(clipboardCount) || 0) + Math.max(0, Number(stagedCount) || 0);
  const provenanceLabel = activeDocumentAsset
    ? getSourceAssetLabel(activeDocumentAsset)
    : activeDocument?.sourceFiles?.length
      ? activeDocument.sourceFiles.join(", ")
      : "No original asset visible";
  const provenanceDetail = [
    activeDocumentAsset?.kind ? `${activeDocumentAsset.kind} source` : "",
    activeDocument?.derivationModel || "",
    activeDocument?.derivationStatus || "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="assembler-details-panel">
      <div className="assembler-details-panel__grid">
        <DetailsMetric
          label="Current focus"
          value={activeDocumentLabel}
          detail={activeDocumentDetail}
        />
        <DetailsMetric
          label="Seed"
          value={currentSeedDocument?.title || "No seed yet"}
          detail={seedCount ? `${seedCount} seed in this box` : "The first real source creates the first seed."}
        />
        <DetailsMetric
          label="Receipts"
          value={latestProofLabel}
          detail={latestProofDetail}
        />
        <DetailsMetric
          label="Queue"
          value={queueCount ? `${queueCount} staged block${queueCount === 1 ? "" : "s"}` : "Empty"}
          detail={queueCount ? "Ready to shape the next seed revision." : "Add blocks from sources or Seven."}
        />
      </div>

      <div className="assembler-details-panel__section">
        <div className="assembler-details-panel__section-head">
          <span>Box status</span>
          <span>{boxTitle}</span>
        </div>
        <div className="assembler-details-panel__rows">
          <DetailsRow
            label="Sources"
            value={`${sourceCount} real source${sourceCount === 1 ? "" : "s"}`}
            detail={sourceCount ? "Use Think to compare and listen before shaping the seed." : "Add the first real source to start the box."}
          />
          <DetailsRow
            label="Connection"
            value={receiptSummary?.connectionStatusLabel || "Not connected"}
            detail={receiptSummary?.syncLine || "Local proof remains first-class even without GetReceipts."}
          />
        </div>
      </div>

      <div className="assembler-details-panel__section">
        <div className="assembler-details-panel__section-head">
          <span>Source provenance</span>
          <span>{activeDocument?.title || "Current context"}</span>
        </div>
        <div className="assembler-details-panel__rows">
          <DetailsRow
            label="Original"
            value={provenanceLabel}
            detail={provenanceDetail || "The current source did not expose an original asset or derivation trace."}
          />
          {activeDocument?.updatedAt ? (
            <DetailsRow
              label="Updated"
              value={new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(activeDocument.updatedAt))}
              detail="Latest visible edit in this workspace."
            />
          ) : null}
        </div>
      </div>

      {activeDocumentWarning ? (
        <p className="assembler-details-panel__note">{activeDocumentWarning}</p>
      ) : null}
    </section>
  );
}

function DesktopAssemblySidecar({
  activePanel = DESKTOP_SIDECAR_PANELS.details,
  stageCount = 0,
  onSelectPanel,
  activeProject,
  activeDocument,
  currentSeedDocument,
  activeDocumentAsset,
  activeDocumentWarning,
  receiptSummary,
  clipboardCount = 0,
  stagedCount = 0,
  sourceCount = 0,
  seedCount = 0,
  getDocumentKindLabel,
  getDocumentBlockCountLabel,
  sevenContent,
  stageContent,
}) {
  const panelCopy =
    activePanel === DESKTOP_SIDECAR_PANELS.seven
      ? {
          eyebrow: "Seven",
          title: "Ask against the current box.",
          detail: "Keep the conversation anchored to the current source or seed, then move useful replies into staging.",
        }
      : activePanel === DESKTOP_SIDECAR_PANELS.stage
        ? {
            eyebrow: "Stage",
            title: "Shape the next seed revision.",
            detail: "The queue is the handoff between sources, Seven, and the living seed.",
          }
        : {
            eyebrow: "Details",
            title: "Keep trust visible.",
            detail: "Use this panel to read provenance, proof state, and the current box posture without leaving the canvas.",
          };

  return (
    <aside className="assembler-workbench__sidecar">
      <div className="assembler-sidecar-shell">
        <div className="assembler-sidecar-shell__header">
          <div className="assembler-sidecar-shell__copy">
            <span className="assembler-sidecar-shell__eyebrow">{panelCopy.eyebrow}</span>
            <h3 className="assembler-sidecar-shell__title">{panelCopy.title}</h3>
            <p className="assembler-sidecar-shell__detail">{panelCopy.detail}</p>
          </div>

          <div className="assembler-sidecar-shell__tabs" role="tablist" aria-label="Workspace sidecar">
            <SidecarTab
              icon="seven"
              label="Seven"
              active={activePanel === DESKTOP_SIDECAR_PANELS.seven}
              onClick={() => onSelectPanel(DESKTOP_SIDECAR_PANELS.seven)}
            />
            <SidecarTab
              icon="seed"
              label={stageCount ? `Stage ${stageCount}` : "Stage"}
              active={activePanel === DESKTOP_SIDECAR_PANELS.stage}
              onClick={() => onSelectPanel(DESKTOP_SIDECAR_PANELS.stage)}
            />
            <SidecarTab
              icon="manage"
              label="Details"
              active={activePanel === DESKTOP_SIDECAR_PANELS.details}
              onClick={() => onSelectPanel(DESKTOP_SIDECAR_PANELS.details)}
            />
          </div>
        </div>

        <div className="assembler-sidecar-shell__body">
          {activePanel === DESKTOP_SIDECAR_PANELS.seven ? (
            sevenContent
          ) : activePanel === DESKTOP_SIDECAR_PANELS.stage ? (
            stageContent
          ) : (
            <WorkspaceDetailsPanel
              activeProject={activeProject}
              activeDocument={activeDocument}
              currentSeedDocument={currentSeedDocument}
              activeDocumentAsset={activeDocumentAsset}
              activeDocumentWarning={activeDocumentWarning}
              receiptSummary={receiptSummary}
              clipboardCount={clipboardCount}
              stagedCount={stagedCount}
              sourceCount={sourceCount}
              seedCount={seedCount}
              getDocumentKindLabel={getDocumentKindLabel}
              getDocumentBlockCountLabel={getDocumentBlockCountLabel}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

function getFormalSignalHintForBlock(block = null) {
  if (!block) return "neutral";
  if (block.author === "ai" || block.operation === "edited") return "amber";
  if (String(block.confirmationStatus || "").trim().toLowerCase() === "confirmed") return "green";
  return "neutral";
}

function getFormalDiagnosticTone(level = "") {
  const normalized = String(level || "").trim().toLowerCase();
  if (normalized === "error") return "alert";
  if (normalized === "warn") return "active";
  return "neutral";
}

function formatShapeLabel(shapeKey = "") {
  const normalized = String(shapeKey || "").trim();
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function BlockFormalAnnotations({ block, annotation = null }) {
  const resolvedAnnotation = useMemo(
    () =>
      annotation ||
      buildFormalSentenceAnnotations(block?.plainText || block?.text || "", {
        sentenceIdPrefix: block?.id || "block",
        signalHint: getFormalSignalHintForBlock(block),
      }),
    [annotation, block],
  );
  const primarySentence = resolvedAnnotation.sentences[0] || null;
  const diagnostics = Array.isArray(resolvedAnnotation.diagnostics)
    ? resolvedAnnotation.diagnostics.slice(0, 2)
    : [];

  if (!primarySentence && diagnostics.length === 0) return null;

  return (
    <div className="assembler-block__formal">
      <div className="assembler-block__formal-head">
        {primarySentence ? (
          <div className="assembler-block__formal-shape">
            <ShapeGlyph shapeKey={primarySentence.shapeKey} size={14} />
            <span>Reads as {formatShapeLabel(primarySentence.shapeKey)}</span>
          </div>
        ) : null}
        {primarySentence?.signal ? (
          <SignalChip tone={primarySentence.signal} subtle>
            {primarySentence.signal}
          </SignalChip>
        ) : null}
      </div>
      {diagnostics.length ? (
        <div className="assembler-block__formal-notes">
          {diagnostics.map((diagnostic, index) => (
            <div key={`${diagnostic.code || "formal"}-${index}`} className="assembler-block__formal-note">
              <SignalChip tone={getFormalDiagnosticTone(diagnostic.level)} subtle>
                {diagnostic.level || "info"}
              </SignalChip>
              <span>{diagnostic.message}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BlockRow({
  block,
  documents = [],
  isFocused,
  isPlaying,
  isNext,
  isSelected,
  editMode,
  showNativeActions = false,
  actionPending = false,
  canDelete = false,
  saveState,
  onFocus,
  onAdd,
  onDelete,
  onRemove,
  onEdit,
  onKeepDraft,
  onAcceptInference,
  onRecastTag,
  onOpenSourceWitness,
  blockRef,
}) {
  const [recastOpen, setRecastOpen] = useState(false);
  const annotation = useMemo(
    () =>
      buildFormalSentenceAnnotations(block?.plainText || block?.text || "", {
        sentenceIdPrefix: block?.id || "block",
        signalHint: getFormalSignalHintForBlock(block),
      }),
    [block],
  );
  const primarySentence = annotation.sentences[0] || null;
  const provenanceView = useMemo(
    () => buildWorkspaceBlockProvenanceView(block, documents),
    [block, documents],
  );
  const confirmationState = useMemo(() => getConfirmationStateView(block), [block]);
  const currentTag = buildBlockMetaDetail(block);
  const controlsDisabled = actionPending || saveState === "saving";

  return (
    <article
      ref={blockRef}
      className={`assembler-block is-${block.kind} ${
        isFocused ? "is-focused" : ""
      } ${isPlaying ? "is-playing" : ""} ${isNext ? "is-next" : ""} ${
        isSelected ? "is-selected" : ""
      } ${block.author === "ai" ? "is-ai" : ""} ${
        block.operation === "edited" ? "is-edited" : ""
      }`}
      onClick={() => onFocus(block.id)}
      data-block-id={block.id}
    >
      <div className="assembler-block__stripe" aria-hidden="true" />

      <div className="assembler-block__select">
        {isSelected ? (
          <button
            type="button"
            className="assembler-block__toggle is-selected"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(block.id);
            }}
          >
            −
          </button>
        ) : (
          <button
            type="button"
            className="assembler-block__toggle"
            onClick={(event) => {
              event.stopPropagation();
              onAdd(block);
            }}
          >
            +
          </button>
        )}

        {canDelete ? (
          <button
            type="button"
            className="assembler-block__icon assembler-block__icon--danger"
            aria-label={`Delete block ${block.sourcePosition + 1}`}
            title={`Delete block ${block.sourcePosition + 1}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(block.id);
            }}
          >
            <SourceActionIcon kind="delete" />
          </button>
        ) : null}
      </div>

      <div className="assembler-block__body">
        <div className="assembler-block__meta">
          <span>{String(block.sourcePosition + 1).padStart(3, "0")}</span>
          <span>{block.sectionLabel || block.sourceTitle || block.sourceDocumentKey}</span>
          <span>{block.author === "ai" ? "AI" : block.operation}</span>
        </div>

        {editMode && block.isEditable ? (
          <BlockEditor
            key={`${block.id}:${block.updatedAt || block.text}`}
            block={block}
            saveState={saveState}
            onEdit={onEdit}
          />
        ) : block.kind === "list" ? (
          <div className="assembler-block__text">
            {String(block.text || "")
              .split("\n")
              .filter(Boolean)
              .map((line, index) => (
                <div key={`${block.id}-line-${index}`} className="assembler-block__list-line">
                  <span className="assembler-block__bullet">•</span>
                  <span>{line.replace(/^[-+*]\s+/, "").trim()}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="assembler-block__text">{block.text.replace(/^#{1,6}\s+/, "")}</div>
        )}

        {block.author === "ai" ? (
          <span className="assembler-block__badge">AI-GENERATED · {block.operation}</span>
        ) : null}
        <div className="assembler-block__runtime">
          <div className="assembler-block__runtime-row">
            <SignalChip tone={confirmationState.tone} subtle>
              {confirmationState.label}
            </SignalChip>
            {currentTag ? (
              <span className="assembler-block__runtime-detail">working tag · {currentTag}</span>
            ) : null}
          </div>
          <div className="assembler-block__runtime-row">
            <span className="assembler-block__runtime-label">{provenanceView.label}</span>
            <span className="assembler-block__runtime-detail">{provenanceView.detail}</span>
          </div>
        </div>
        <BlockFormalAnnotations block={block} annotation={annotation} />
        {showNativeActions ? (
          <div className="assembler-block__actions">
            <button
              type="button"
              className="assembler-tiny-button"
              onClick={() => onKeepDraft?.(block)}
              disabled={controlsDisabled}
            >
              Keep draft
            </button>
            <button
              type="button"
              className="assembler-tiny-button"
              onClick={() => onAcceptInference?.(block, primarySentence)}
              disabled={controlsDisabled || !primarySentence?.shapeKey}
            >
              Accept read
            </button>
            <button
              type="button"
              className="assembler-tiny-button"
              onClick={() => setRecastOpen((value) => !value)}
              disabled={controlsDisabled}
            >
              Recast tag
            </button>
            <button
              type="button"
              className={`assembler-tiny-button ${isSelected ? "is-active" : ""}`}
              onClick={() => (isSelected ? onRemove(block.id) : onAdd(block))}
              disabled={controlsDisabled}
            >
              {isSelected ? "Remove from weld" : "Stage into weld"}
            </button>
            <button
              type="button"
              className="assembler-tiny-button"
              onClick={() => onOpenSourceWitness?.(block)}
              disabled={controlsDisabled || !String(block?.sourceDocumentKey || block?.documentKey || "").trim()}
            >
              Open witness
            </button>
          </div>
        ) : null}
        {showNativeActions && recastOpen ? (
          <div className="assembler-block__recast">
            {[
              ["Aim", ASSEMBLY_PRIMARY_TAGS.aim],
              ["Evidence", ASSEMBLY_PRIMARY_TAGS.evidence],
              ["Story", ASSEMBLY_PRIMARY_TAGS.story],
            ].map(([label, tag]) => (
              <button
                key={tag}
                type="button"
                className={`assembler-tiny-button ${currentTag === tag ? "is-active" : ""}`}
                onClick={() => {
                  setRecastOpen(false);
                  onRecastTag?.(block, tag);
                }}
                disabled={controlsDisabled}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function BlockEditor({ block, saveState, onEdit }) {
  const [draftText, setDraftText] = useState(block.text);

  return (
    <div className="assembler-block__editor-wrap">
      <textarea
        className="assembler-block__editor"
        value={draftText}
        onChange={(event) => setDraftText(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        onBlur={() => onEdit(block.id, draftText)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void onEdit(block.id, draftText);
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setDraftText(block.text);
            event.currentTarget.blur();
          }
        }}
      />

      <div className={`assembler-block__editor-status is-${saveState || "idle"}`}>
        {saveState === "saving"
          ? "Saving…"
          : saveState === "saved"
            ? "Saved"
            : saveState === "conflict"
              ? "Reload latest before saving again"
              : saveState === "error"
                ? "Not saved"
                : "Blur or Cmd/Ctrl+Enter to save"}
      </div>
    </div>
  );
}

function LogView({
  logEntries,
  drafts,
  receiptSummary,
  receiptPending,
  activeDocumentTitle,
  onCreateReceipt,
  onRunOperate,
  onExportReceipt,
  onExportDocument,
  onOpenGetReceipts,
  onSealReceipt,
  isMobileLayout = false,
}) {
  return (
    <ReceiptSurface
      logEntries={logEntries}
      drafts={drafts}
      receiptSummary={receiptSummary}
      receiptPending={receiptPending}
      activeDocumentTitle={activeDocumentTitle}
      onCreateReceipt={onCreateReceipt}
      onRunOperate={onRunOperate}
      onExportReceipt={onExportReceipt}
      onExportDocument={onExportDocument}
      onOpenGetReceipts={onOpenGetReceipts}
      onSealReceipt={onSealReceipt}
      isMobileLayout={isMobileLayout}
    />
  );
}

function AiBar({
  inputRef,
  value,
  pending,
  loading = false,
  errorMessage = "",
  documentTitle = "",
  thread = null,
  suggestions = [],
  onChange,
  onSubmit,
  onSuggestion,
  onStageMessage,
  onClose,
}) {
  const messages = Array.isArray(thread?.messages) ? thread.messages : [];

  return (
    <div className="assembler-seven-sheet">
      <div className="assembler-seven-sheet__header">
        <div className="assembler-seven-sheet__copy">
          <span className="assembler-seven-sheet__eyebrow">7</span>
          <span className="assembler-seven-sheet__title">Conversation</span>
          <span className="assembler-seven-sheet__document">
            {documentTitle || "Current document"}
          </span>
        </div>
        <button type="button" className="assembler-seven-sheet__close" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="assembler-seven-sheet__suggestions">
        {suggestions.map((label) => (
          <button
            key={label}
            type="button"
            className="assembler-seven-sheet__suggestion"
            onClick={() => onSuggestion(label)}
            disabled={pending}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="assembler-seven-sheet__messages">
        {loading && messages.length === 0 ? (
          <p className="assembler-seven-sheet__empty">Loading conversation…</p>
        ) : messages.length ? (
          messages.map((message) => {
            const citations = Array.isArray(message?.citations) ? message.citations : [];
            const isAssistant = message?.role === "assistant";
            const isPending = Boolean(message?.pending);
            const isError = Boolean(message?.error);

            return (
              <article
                key={message.id}
                className={`assembler-seven-sheet__message ${
                  isAssistant ? "is-assistant" : "is-user"
                } ${isError ? "is-error" : ""}`}
              >
                <span className="assembler-seven-sheet__message-role">
                  {isAssistant ? "7" : "You"}
                </span>
                <div className="assembler-seven-sheet__message-body">
                  <p className="assembler-seven-sheet__message-text">
                    {isPending ? "Thinking…" : message?.content || ""}
                  </p>
                  {citations.length ? (
                    <div className="assembler-seven-sheet__citations">
                      {citations.map((citation) => (
                        <div
                          key={citation.id || `${citation.sectionSlug}-${citation.sectionLabel}`}
                          className="assembler-seven-sheet__citation"
                        >
                          <span className="assembler-seven-sheet__citation-label">
                            {citation.sectionLabel || citation.sectionTitle || "Context"}
                          </span>
                          {citation.excerpt ? (
                            <span className="assembler-seven-sheet__citation-excerpt">
                              {citation.excerpt}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {isAssistant && !isPending && !isError ? (
                    <button
                      type="button"
                      className="assembler-seven-sheet__message-action"
                      onClick={() => onStageMessage(message)}
                    >
                      Add to staging
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <p className="assembler-seven-sheet__empty">
            Ask Seven about this document.
          </p>
        )}
      </div>

      {errorMessage ? (
        <p className="assembler-seven-sheet__error" aria-live="polite">
          {errorMessage}
        </p>
      ) : null}

      <div className="assembler-seven-sheet__field">
        <span className="assembler-seven-sheet__prompt">7</span>
        <textarea
          ref={inputRef}
          className="assembler-seven-sheet__input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={pending ? "Seven is thinking…" : "Ask about this document…"}
          rows={3}
          disabled={pending}
        />
        <button
          type="button"
          className="assembler-seven-sheet__run"
          disabled={!value.trim() || pending}
          onClick={onSubmit}
        >
          {pending ? "Thinking…" : "Ask"}
        </button>
      </div>
    </div>
  );
}

function ClipboardTray({
  stagedBlocks,
  clipboard,
  documents,
  embedded = false,
  onAcceptStagedBlock,
  onAcceptAllStagedBlocks,
  onClearStagedBlocks,
  onRemoveClipboardIndex,
  onReorderClipboard,
  onClearClipboard,
  onAssemble,
}) {
  return (
    <StagingPanel
      stagedBlocks={stagedBlocks}
      clipboard={clipboard}
      documents={documents}
      embedded={embedded}
      onAcceptStagedBlock={onAcceptStagedBlock}
      onAcceptAllStagedBlocks={onAcceptAllStagedBlocks}
      onClearStagedBlocks={onClearStagedBlocks}
      onRemoveClipboardIndex={onRemoveClipboardIndex}
      onReorderClipboard={onReorderClipboard}
      onClearClipboard={onClearClipboard}
      onAssemble={onAssemble}
    />
  );
}

function MobileComposeSheet({
  open = false,
  clipboard,
  stagedBlocks,
  documents,
  onClose,
  onAcceptStagedBlock,
  onAcceptAllStagedBlocks,
  onClearStagedBlocks,
  onRemoveClipboardIndex,
  onReorderClipboard,
  onClearClipboard,
  onAssemble,
}) {
  const sourceCount = new Set(
    clipboard.map((block) => block.sourceDocumentKey || block.documentKey).filter(Boolean),
  ).size;

  function getDocumentTitle(documentKey) {
    return (
      documents.find((document) => document.documentKey === documentKey)?.title ||
      documentKey ||
      "document"
    );
  }

  return (
    <div className={`assembler-sheet assembler-sheet--compose ${open ? "is-open" : ""}`}>
      <div className="assembler-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="assembler-sheet__panel">
        <div className="assembler-sheet__header">
          <div>
            <span className="assembler-sheet__eyebrow">Staging</span>
            <span className="assembler-sheet__title">
              {clipboard.length} block{clipboard.length === 1 ? "" : "s"} from {sourceCount} source{sourceCount === 1 ? "" : "s"}
            </span>
          </div>
          <button
            type="button"
            className="assembler-sheet__close"
            onClick={onClose}
          >
            Done
          </button>
        </div>

        <div className="assembler-sheet__content">
          {stagedBlocks.length ? (
            <div className="assembler-sheet__section">
              <div className="assembler-sheet__section-head">
                <span>Seven replies</span>
                <div className="assembler-sheet__section-actions">
                  <button type="button" className="assembler-tiny-button" onClick={onAcceptAllStagedBlocks}>
                    Add all
                  </button>
                  <button type="button" className="assembler-tiny-button" onClick={onClearStagedBlocks}>
                    Clear
                  </button>
                </div>
              </div>

              {stagedBlocks.map((block, index) => (
                <div key={block.id} className="assembler-mobile-clipboard__row is-staged">
                  <span className="assembler-mobile-clipboard__source">7</span>
                  <div className="assembler-mobile-clipboard__main">
                    <span className="assembler-mobile-clipboard__source">
                      {buildWorkspaceBlockProvenanceView(block, documents).label}
                    </span>
                    <span className="assembler-mobile-clipboard__text">{block.plainText || block.text}</span>
                    <span className="assembler-mobile-clipboard__detail">
                      {buildWorkspaceBlockProvenanceView(block, documents).detail}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="assembler-tiny-button"
                    onClick={() => onAcceptStagedBlock(index)}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="assembler-sheet__section">
            <div className="assembler-sheet__section-head">
              <span>Selected Blocks</span>
              <button type="button" className="assembler-tiny-button" onClick={onClearClipboard}>
                Clear
              </button>
            </div>

            {clipboard.length ? (
              clipboard.map((block, index) => (
                <div key={`${block.id}-${index}`} className="assembler-mobile-clipboard__row">
                  <div className="assembler-mobile-clipboard__main">
                    <span className="assembler-mobile-clipboard__index">{index + 1}</span>
                    <span className="assembler-mobile-clipboard__source">
                      {getDocumentTitle(block.sourceDocumentKey || block.documentKey)}
                    </span>
                    <span className="assembler-mobile-clipboard__text">{block.plainText || block.text}</span>
                    <span className="assembler-mobile-clipboard__detail">
                      {buildWorkspaceBlockProvenanceView(block, documents).label} · {buildWorkspaceBlockProvenanceView(block, documents).compact}
                    </span>
                  </div>
                  <div className="assembler-mobile-clipboard__actions">
                    <button
                      type="button"
                      className="assembler-tiny-button"
                      disabled={index === 0}
                      onClick={() => onReorderClipboard(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="assembler-tiny-button"
                      disabled={index === clipboard.length - 1}
                      onClick={() => onReorderClipboard(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="assembler-tiny-button is-danger"
                      onClick={() => onRemoveClipboardIndex(index)}
                    >
                      −
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="assembler-sheet__empty">Add blocks here to build a new document.</p>
            )}
          </div>
        </div>

        <div className="assembler-sheet__footer">
          <button
            type="button"
            className="assembler-sheet__primary"
            disabled={!clipboard.length}
            onClick={onAssemble}
          >
            Assemble
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerBar({
  workspaceMode = WORKSPACE_MODES.assemble,
  currentBlock,
  currentIndex,
  totalBlocks,
  isPlaying,
  loadingAudio,
  playbackAvailable,
  rate,
  voiceCatalog,
  voiceChoice,
  providerLabel,
  progress,
  deviceVoiceSupported,
  onTogglePlayback,
  onSeekBack,
  onSeekForward,
  onPreviousBlock,
  onNextBlock,
  onCycleRate,
  onVoiceChange,
}) {
  const immersive = workspaceMode === WORKSPACE_MODES.listen;
  const selectedVoiceValue = voiceChoice
    ? `${voiceChoice.provider}:${voiceChoice.voiceId || "default"}`
    : "";

  return (
    <div className={`assembler-player ${immersive ? "is-listen" : ""}`}>
      <div className="assembler-player__controls">
        {immersive ? (
          <>
            <button type="button" className="assembler-player__button" onClick={onPreviousBlock} disabled={!playbackAvailable} title="Previous block" aria-label="Previous block">
              <SkipBack size={16} strokeWidth={1.7} />
            </button>
            <button type="button" className={`assembler-player__button is-primary ${isPlaying ? "is-playing" : ""}`} onClick={onTogglePlayback} disabled={!playbackAvailable} title={isPlaying ? "Pause" : "Play"} aria-label={isPlaying ? "Pause" : "Play"}>
              {loadingAudio ? "…" : isPlaying ? <Pause size={16} strokeWidth={1.7} /> : <Play size={16} strokeWidth={1.7} />}
            </button>
            <button type="button" className="assembler-player__button" onClick={onNextBlock} disabled={!playbackAvailable} title="Next block" aria-label="Next block">
              <SkipForward size={16} strokeWidth={1.7} />
            </button>
          </>
        ) : (
          <>
            <button type="button" className="assembler-player__button" onClick={onSeekBack} disabled={!playbackAvailable} title="Back 10s" aria-label="Seek back 10 seconds">
              <Rewind size={16} strokeWidth={1.7} />
            </button>
            <button type="button" className={`assembler-player__button is-primary ${isPlaying ? "is-playing" : ""}`} onClick={onTogglePlayback} disabled={!playbackAvailable} title={isPlaying ? "Pause" : "Play"} aria-label={isPlaying ? "Pause" : "Play"}>
              {loadingAudio ? "…" : isPlaying ? <Pause size={16} strokeWidth={1.7} /> : <Play size={16} strokeWidth={1.7} />}
            </button>
            <button type="button" className="assembler-player__button" onClick={onSeekForward} disabled={!playbackAvailable} title="Forward 10s" aria-label="Seek forward 10 seconds">
              <FastForward size={16} strokeWidth={1.7} />
            </button>
            <button type="button" className="assembler-player__button" onClick={onPreviousBlock} disabled={!playbackAvailable} title="Previous" aria-label="Previous block">
              <SkipBack size={16} strokeWidth={1.7} />
            </button>
            <button type="button" className="assembler-player__button" onClick={onNextBlock} disabled={!playbackAvailable} title="Next" aria-label="Next block">
              <SkipForward size={16} strokeWidth={1.7} />
            </button>
          </>
        )}
      </div>

      <div className="assembler-player__progress">
        <span className="assembler-player__counter">
          {totalBlocks ? `${currentIndex + 1}/${totalBlocks}` : "0/0"}
        </span>
        <div className="assembler-player__rail">
          <div
            className="assembler-player__fill"
            style={{ width: `${Number.isFinite(progress) ? progress : 0}%` }}
          />
        </div>
      </div>

      <div className="assembler-player__meta">
        <button type="button" className="assembler-player__button" onClick={onCycleRate}>
          {rate.toFixed(2).replace(/\.00$/, "")}x
        </button>

        <select
          className="assembler-player__select"
          value={selectedVoiceValue}
          onChange={(event) => {
            const [provider, voiceId] = event.target.value.split(":");
            onVoiceChange(
              voiceCatalog.find(
                (entry) =>
                  entry.provider === provider &&
                  String(entry.voiceId || "default") === String(voiceId || "default"),
              ) || voiceCatalog[0],
            );
          }}
          disabled={!voiceCatalog.length}
        >
          {voiceCatalog.map((entry) => (
            <option key={`${entry.provider}:${entry.voiceId || "default"}`} value={`${entry.provider}:${entry.voiceId || "default"}`}>
              {entry.label}
            </option>
          ))}
        </select>

        <span className="assembler-player__status">
          {!playbackAvailable
            ? deviceVoiceSupported
              ? "Voice unavailable"
              : "Device voice unavailable in this browser"
            : `${providerLabel} · ${
                currentBlock ? `block ${currentBlock.sourcePosition + 1}` : "idle"
              }`}
        </span>
      </div>
    </div>
  );
}

function formatAudioErrorMessage(message) {
  const normalized = String(message || "").trim().toLowerCase();

  if (!normalized) {
    return "Playback could not start. Your place is preserved. Try again or switch voices.";
  }

  if (normalized.includes("disturbed or locked")) {
    return "Playback was interrupted. Your place is preserved. Try again.";
  }

  if (normalized.includes("quota")) {
    return "Voice is unavailable right now. Your place is preserved. Try again in a moment.";
  }

  if (normalized.includes("rate limit")) {
    return "Voice is busy right now. Your place is preserved. Try again in a moment.";
  }

  return "Playback could not start. Your place is preserved. Try again.";
}

export default function WorkspaceShell({
  userId,
  documents,
  projects,
  projectDrafts = [],
  getReceiptsConnectionStatus = "DISCONNECTED",
  getReceiptsConnectionLastError = "",
  initialDocument,
  initialProjectKey = DEFAULT_PROJECT_KEY,
  initialMode = "",
  voiceCatalog,
  defaultVoiceChoice,
  showLaunchpadInitially = false,
  initialLaunchpadView = LAUNCHPAD_VIEWS.boxes,
  resumeSessionSummary = null,
  initialEntryState = "returning",
  initialBoxPhase = "",
  initialWorkspaceNotice = null,
}) {
  const fileInputRef = useRef(null);
  const photoCameraInputRef = useRef(null);
  const photoLibraryInputRef = useRef(null);
  const aiInputRef = useRef(null);
  const runAiOperationRef = useRef(null);
  const blockRefs = useRef({});
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingAnimationFrameRef = useRef(null);
  const recordingAnalyserRef = useRef(null);
  const recordingAudioContextRef = useRef(null);
  const recordingProcessorRef = useRef(null);
  const recordingSilenceRef = useRef(null);
  const recordingSampleRateRef = useRef(16000);
  const recordingEnabledRef = useRef(false);
  const closeVoiceRecorderRef = useRef(() => {});
  const ensureSeedForActiveProjectRef = useRef(async () => null);
  const requestSeedSuggestionRef = useRef(async () => null);
  const speechUtteranceRef = useRef(null);
  const speechRunIdRef = useRef(0);
  const playbackStateRef = useRef({ active: false, kind: null, paused: false });
  const storageHydratedRef = useRef(false);
  const pasteIntoWorkspaceRef = useRef(null);
  const pendingFocusBlockIdRef = useRef(null);
  const seedEnsureFingerprintRef = useRef("");
  const seedSuggestFingerprintRef = useRef("");
  const receiptSealAuditRequestIdRef = useRef(0);
  const receiptSealImmediateAuditDraftRef = useRef("");
  const remoteSyncAttemptedRef = useRef({});
  const pendingSeedFocusRef = useRef(false);
  const attachDocumentToActiveProjectRef = useRef(() => {});
  const applyProjectPayloadRef = useRef(() => {});
  const upsertDocumentRef = useRef(() => {});
  const loadDocumentRef = useRef(async () => {});
  const activeDocumentRef = useRef(initialDocument);
  const blocksRef = useRef(initialDocument.blocks || []);
  const rateRef = useRef(1);
  const voiceChoiceRef = useRef(defaultVoiceChoice);
  const documentLogsRef = useRef(createInitialDocumentLogMap([initialDocument]));
  const idleCheckpointTimeoutRef = useRef(null);
  const exitCheckpointSentRef = useRef(false);

  const storageKey = `document-assembler:${userId}:workspace`;

  const [documentsState, setDocumentsState] = useState(() => sortDocuments(documents));
  const [projectsState, setProjectsState] = useState(() =>
    Array.isArray(projects) && projects.length ? projects : buildProjectsFromDocuments(documents),
  );
  const requestedWorkspaceMode = normalizeWorkspaceMode(initialMode || "", "");
  const requestedBoxPhase = Object.values(BOX_PHASES).includes(initialBoxPhase)
    ? initialBoxPhase
    : "";
  const [activeProjectKey, setActiveProjectKey] = useState(
    initialProjectKey || projects?.[0]?.projectKey || DEFAULT_PROJECT_KEY,
  );
  const [documentCache, setDocumentCache] = useState({
    [initialDocument.documentKey]: initialDocument,
  });
  const [documentLogs, setDocumentLogs] = useState(() =>
    createInitialDocumentLogMap([initialDocument]),
  );
  const [, setDocumentStates] = useState({});
  const [deviceVoiceSupported, setDeviceVoiceSupported] = useState(false);
  const [activeDocumentKey, setActiveDocumentKey] = useState(initialDocument.documentKey);
  const [workspaceMode, setWorkspaceMode] = useState(
    normalizeWorkspaceMode(requestedWorkspaceMode, WORKSPACE_MODES.assemble),
  );
  const [boxPhase, setBoxPhase] = useState(
    requestedBoxPhase ||
      (requestedWorkspaceMode === WORKSPACE_MODES.assemble ||
      initialDocument?.isAssembly ||
      initialDocument?.documentType === "assembly"
        ? BOX_PHASES.create
        : BOX_PHASES.lane),
  );
  const [, setEditMode] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [clipboard, setClipboard] = useState([]);
  const [stagedAiBlocks, setStagedAiBlocks] = useState([]);
  const [focusBlockId, setFocusBlockId] = useState(initialDocument.blocks[0]?.id || null);
  const [playheadBlockId, setPlayheadBlockId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [rate, setRate] = useState(1);
  const [voiceChoice, setVoiceChoice] = useState(defaultVoiceChoice || voiceCatalog[0] || null);
  const [providerLabel, setProviderLabel] = useState(
    defaultVoiceChoice?.label || voiceCatalog[0]?.label || "Voice",
  );
  const [loadingDocumentKey, setLoadingDocumentKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pastePendingMode, setPastePendingMode] = useState("");
  const [preferredImageDerivationMode, setPreferredImageDerivationMode] = useState(
    IMAGE_DERIVATION_OPTIONS[0].value,
  );
  const [pendingImageIntake, setPendingImageIntake] = useState(null);
  const [pendingLinkIntake, setPendingLinkIntake] = useState(null);
  const [deleteDialogDocument, setDeleteDialogDocument] = useState(null);
  const [deletePendingDocumentKey, setDeletePendingDocumentKey] = useState("");
  const [deleteDialogError, setDeleteDialogError] = useState("");
  const [dropActive, setDropActive] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiPending, setAiPending] = useState(false);
  const [sevenThreads, setSevenThreads] = useState(() => ({
    [initialDocument.documentKey]: buildEmptySevenThread(initialDocument.documentKey),
  }));
  const [sevenThreadLoadingKey, setSevenThreadLoadingKey] = useState("");
  const [sevenThreadError, setSevenThreadError] = useState("");
  const [wordLayerHypothesesByProjectKey, setWordLayerHypothesesByProjectKey] = useState({});
  const [wordLayerPendingProjectKey, setWordLayerPendingProjectKey] = useState("");
  const [wordLayerErrorByProjectKey, setWordLayerErrorByProjectKey] = useState({});
  const [operatePending, setOperatePending] = useState(false);
  const [operateError, setOperateError] = useState("");
  const [operateResult, setOperateResult] = useState(null);
  const [closeMoveOpen, setCloseMoveOpen] = useState(false);
  const [closeMoveResult, setCloseMoveResult] = useState(null);
  const [closeMoveDelta, setCloseMoveDelta] = useState("");
  const [closeMovePending, setCloseMovePending] = useState(false);
  const [closeMoveError, setCloseMoveError] = useState("");
  const [rerouteContextByProjectKey, setRerouteContextByProjectKey] = useState({});
  const [pendingOperateAudit, setPendingOperateAudit] = useState(null);
  const [seedSuggestion, setSeedSuggestion] = useState(null);
  const [seedSuggestionPending, setSeedSuggestionPending] = useState(false);
  const [seedStatusPending, setSeedStatusPending] = useState(false);
  const [receiptPending, setReceiptPending] = useState(false);
  const [polishPending, setPolishPending] = useState(false);
  const [cleanupPendingAction, setCleanupPendingAction] = useState("");
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupFind, setCleanupFind] = useState("");
  const [cleanupReplace, setCleanupReplace] = useState("");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("");
  const [globalInstrumentIssue, setGlobalInstrumentIssue] = useState(null);
  const [rootInstrumentIssue, setRootInstrumentIssue] = useState(null);
  const [dismissedInstrumentKeys, setDismissedInstrumentKeys] = useState({});
  const [lastModeByProjectKey, setLastModeByProjectKey] = useState({});
  const [blockSaveStates, setBlockSaveStates] = useState({});
  const [blockActionPendingId, setBlockActionPendingId] = useState("");
  const [projectDraftsState, setProjectDraftsState] = useState(projectDrafts);
  const [projectActionPending, setProjectActionPending] = useState("");
  const [boxManagementOpen, setBoxManagementOpen] = useState(false);
  const [selectedManagementProjectKey, setSelectedManagementProjectKey] = useState(
    initialProjectKey || DEFAULT_PROJECT_KEY,
  );
  const [createProjectTitle, setCreateProjectTitle] = useState("Untitled Box");
  const [createProjectRootText, setCreateProjectRootText] = useState("");
  const [createProjectRootGloss, setCreateProjectRootGloss] = useState("");
  const [renameProjectTitle, setRenameProjectTitle] = useState("");
  const [boxManagementError, setBoxManagementError] = useState("");
  const [rootPending, setRootPending] = useState(false);
  const [rootEditorOpen, setRootEditorOpen] = useState(false);
  const [pendingRootGate, setPendingRootGate] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationFocus, setConfirmationFocus] = useState(null);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [receiptSealDraft, setReceiptSealDraft] = useState(null);
  const [receiptSealDelta, setReceiptSealDelta] = useState("");
  const [receiptSealAudit, setReceiptSealAudit] = useState(null);
  const [receiptSealAuditPending, setReceiptSealAuditPending] = useState(false);
  const [receiptSealAuditError, setReceiptSealAuditError] = useState("");
  const [receiptSealAuditStatement, setReceiptSealAuditStatement] = useState("");
  const [launchpadOpen, setLaunchpadOpen] = useState(showLaunchpadInitially);
  const [launchpadView, setLaunchpadView] = useState(
    normalizeLaunchpadView(initialLaunchpadView, LAUNCHPAD_VIEWS.boxes),
  );
  const [listenPickerOpen, setListenPickerOpen] = useState(false);
  const [workspacePickerOpen, setWorkspacePickerOpen] = useState(false);
  const [workspacePickerIntent, setWorkspacePickerIntent] = useState("switch");
  const [mobileBoxSheetOpen, setMobileBoxSheetOpen] = useState(false);
  const [realityInstrumentOpen, setRealityInstrumentOpen] = useState(false);
  const [dropAnythingOpen, setDropAnythingOpen] = useState(false);
  const [photoIntakeOpen, setPhotoIntakeOpen] = useState(false);
  const [mobileComposeOpen, setMobileComposeOpen] = useState(false);
  const [mobileSourceToolsOpen, setMobileSourceToolsOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [desktopSidecarPanel, setDesktopSidecarPanel] = useState(() =>
    getDefaultDesktopSidecarPanel(
      requestedWorkspaceMode === WORKSPACE_MODES.assemble ||
        initialDocument?.isAssembly ||
        initialDocument?.documentType === "assembly"
        ? BOX_PHASES.create
        : BOX_PHASES.lane,
    ),
  );
  const [playbackStatus, setPlaybackStatus] = useState("idle");
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [voiceRecorderPhase, setVoiceRecorderPhase] = useState("idle");
  const [voiceRecorderElapsed, setVoiceRecorderElapsed] = useState(0);
  const [voiceRecorderLevel, setVoiceRecorderLevel] = useState(0);
  const [voiceRecorderError, setVoiceRecorderError] = useState("");
  const [voiceMemoDraft, setVoiceMemoDraft] = useState(null);
  const [resumeSessionSummaryState, setResumeSessionSummaryState] = useState(
    resumeSessionSummary,
  );
  const [entryStateOverride, setEntryStateOverride] = useState(
    initialEntryState === "first-time" ? "first-time" : "",
  );
  const openWorkspacePicker = useCallback((intent = "switch") => {
    setWorkspacePickerIntent(intent === "add" ? "add" : "switch");
    setWorkspacePickerOpen(true);
  }, []);
  const closeWorkspacePicker = useCallback(() => {
    setWorkspacePickerOpen(false);
  }, []);

  const hydratedProjects = hydrateProjectsWithDocuments(projectsState, documentsState);
  const activeProject =
    getProjectByKey(hydratedProjects, activeProjectKey) ||
    hydratedProjects[0] ||
    null;
  const activeBoxTitle = activeProject?.boxTitle || activeProject?.title || "Untitled Box";
  const projectDocuments = getProjectDocuments(documentsState, activeProject);
  const hydratedProjectDocuments = projectDocuments.map((document) =>
    applyDocumentLogState(documentCache[document.documentKey] || document, documentLogs),
  );
  const deferredHydratedProjectDocuments = useDeferredValue(hydratedProjectDocuments);
  const deferredProjectDraftsState = useDeferredValue(projectDraftsState);
  const projectDocumentsByKey = useMemo(
    () =>
      new Map(
        hydratedProjectDocuments.map((document) => [String(document?.documentKey || "").trim(), document]),
      ),
    [hydratedProjectDocuments],
  );
  const realProjectSourceDocuments = listRealSourceDocuments(hydratedProjectDocuments);
  const latestRealSourceDocument =
    [...realProjectSourceDocuments].sort((left, right) => {
      const rightTimestamp = Date.parse(right?.updatedAt || right?.createdAt || "");
      const leftTimestamp = Date.parse(left?.updatedAt || left?.createdAt || "");
      return (Number.isNaN(rightTimestamp) ? 0 : rightTimestamp) - (Number.isNaN(leftTimestamp) ? 0 : leftTimestamp);
    })[0] || null;
  const projectDocumentGroups = groupedDocuments(hydratedProjectDocuments);
  const guideSourceDocument = projectDocumentGroups.sources.find(
    (document) => document.documentType === "builtin" || document.sourceType === "builtin",
  ) || null;
  const visibleSourceDocuments = projectDocumentGroups.sources.filter(
    (document) => document.documentType !== "builtin" && document.sourceType !== "builtin",
  );
  const visibleAssemblyDocuments = projectDocumentGroups.assemblies;
  const currentAssemblyDocument =
    getSeedDocument(activeProject, hydratedProjectDocuments, activeDocumentKey) ||
    getOperateAssemblyDocument(activeProject, hydratedProjectDocuments, activeDocumentKey) ||
    null;
  const currentSeedDocument = currentAssemblyDocument;
  const operateState = listOperateIncludedDocuments(activeProject, hydratedProjectDocuments, {
    preferredDocumentKey: activeDocumentKey,
    includeAssembly: true,
    includeGuide: false,
  });
  const operateViewModel = buildOperateViewModel(operateState, activeProject);
  const receiptSummaryViewModel = buildReceiptSummaryViewModel(projectDraftsState, {
    connectionStatus: getReceiptsConnectionStatus,
    connectionLastError: getReceiptsConnectionLastError,
  });
  const latestRemoteSealStatus = String(receiptSummaryViewModel?.latestRemoteSealStatus || "").trim().toLowerCase();
  const receiptPhaseAttentionTone = receiptSummaryViewModel?.latestCanRetryRemoteSync
    && (latestRemoteSealStatus === "failed" || latestRemoteSealStatus === "pending_create" || latestRemoteSealStatus === "pending_seal")
    ? receiptSummaryViewModel.courthouseStatusTone || "warning"
    : getReceiptsConnectionStatus === "EXPIRED" || getReceiptsConnectionStatus === "ERROR"
      ? "warning"
      : "";
  const canRunOperate = operateViewModel.canRunOperate;
  const availableVoiceCatalog = voiceCatalog.filter(
    (entry) =>
      entry.provider !== VOICE_PROVIDERS.device || deviceVoiceSupported,
  );
  const resolvedVoiceChoice =
    availableVoiceCatalog.find(
      (entry) =>
        entry.provider === voiceChoice?.provider &&
        String(entry.voiceId || "") === String(voiceChoice?.voiceId || ""),
    ) ||
    availableVoiceCatalog.find(
      (entry) =>
        entry.provider === defaultVoiceChoice?.provider &&
        String(entry.voiceId || "") === String(defaultVoiceChoice?.voiceId || ""),
    ) ||
    availableVoiceCatalog[0] ||
    null;
  const playbackAvailable = availableVoiceCatalog.length > 0;
  const activeDocumentBase = documentCache[activeDocumentKey] || initialDocument;
  const activeDocument = applyDocumentLogState(activeDocumentBase, documentLogs);
  const operateAuditDocumentKey =
    currentAssemblyDocument?.documentKey || activeDocument?.documentKey || "";
  const seedSourceFingerprint = buildSeedFingerprint({
    realSourceDocuments: realProjectSourceDocuments,
    receiptCount: projectDraftsState.length,
    latestOperateAt: operateResult?.ranAt || "",
  });
  const blocks = activeDocument?.blocks ?? EMPTY_BLOCKS;
  const activeDocumentWarning = getPrimaryDiagnosticMessage({
    diagnostics: activeDocument?.intakeDiagnostics,
  });
  const activeDocumentAsset =
    getPrimarySourceAsset(activeDocument, "image") ||
    getPrimarySourceAsset(activeDocument, "link") ||
    getPrimarySourceAsset(activeDocument, "audio") ||
    getPrimarySourceAsset(activeDocument);
  const canPolishActiveDocument =
    Boolean(activeDocument?.documentKey) &&
    !activeDocument?.isAssembly &&
    activeDocument?.documentType !== "assembly";
  const canDeleteActiveDocument = canDeleteDocument(activeDocument);
  const canManageActiveSource =
    Boolean(activeDocument?.documentKey) &&
    !activeDocument?.isAssembly &&
    activeDocument?.documentType !== "assembly" &&
    Boolean(activeDocument?.isEditable);
  const showActiveDocumentTools = canManageActiveSource || canDeleteActiveDocument;
  const activeRerouteContext = activeProjectKey
    ? rerouteContextByProjectKey[activeProjectKey] || null
    : null;
  const thinkViewModel = buildThinkViewModel({
    activeProject,
    activeDocument,
    projectDocuments: hydratedProjectDocuments,
    guideDocument: guideSourceDocument,
  });
  const createViewModel = buildCreateViewModel({
    activeProject,
    currentAssemblyDocument: currentSeedDocument,
    clipboard,
    stagedAiBlocks,
    rerouteContext: activeRerouteContext,
  });
  const seedViewModel = buildSeedViewModel({
    activeProject,
    currentAssemblyDocument: currentSeedDocument,
    projectDocuments: hydratedProjectDocuments,
    projectDrafts: projectDraftsState,
    pendingSuggestion: seedSuggestion,
  });
  const entryStateViewModel = buildEntryStateViewModel({
    projects: hydratedProjects,
    activeProject,
    projectDocuments: hydratedProjectDocuments,
    allDocuments: documentsState,
    projectDrafts: projectDraftsState,
    currentAssemblyDocument: currentSeedDocument,
    resumeSessionSummary: resumeSessionSummaryState,
  });
  const resolvedEntryMode = entryStateOverride || entryStateViewModel.mode;
  const currentSeedFingerprint = String(currentSeedDocument?.seedMeta?.sourceFingerprint || "").trim();
  const desktopStageCount = clipboard.length + stagedAiBlocks.length;
  const controlSurfaceViewModel = buildControlSurfaceViewModel({
    activeProject,
    currentAssemblyDocument: currentSeedDocument,
    projectDocuments: hydratedProjectDocuments,
    projectDrafts: projectDraftsState,
    boxPhase,
    canRunOperate,
    aiOpen,
    clipboardCount: clipboard.length,
    stagedCount: stagedAiBlocks.length,
  });
  const formalBoxState = useMemo(
    () =>
      buildFormalBoxState(
        activeProject,
        deferredHydratedProjectDocuments,
        deferredProjectDraftsState,
      ),
    [activeProject, deferredHydratedProjectDocuments, deferredProjectDraftsState],
  );
  const formalSealCheck = useMemo(
    () =>
      buildFormalSealCheck(
        formalBoxState,
        receiptSealDraft || receiptSummaryViewModel?.latestDraft || null,
      ),
    [formalBoxState, receiptSealDraft, receiptSummaryViewModel?.latestDraft],
  );
  const workspaceIdeState = useMemo(() => {
    const primaryCard = formalBoxState?.primaryCard || null;
    const diagnostics = formalBoxState?.diagnostics || {
      errors: [],
      warnings: [],
      infos: [],
      shadowTypes: [],
    };
    const unresolvedCount =
      (diagnostics.errors?.length || 0) +
      (diagnostics.warnings?.length || 0) +
      (diagnostics.shadowTypes?.length || 0);
    const branchCount =
      Math.max(0, clipboard.length + stagedAiBlocks.length) +
      (formalSealCheck?.canSeal ? 0 : primaryCard?.derivedWeldAvailable ? 1 : 0);

    return {
      projectTree: {
        branchCount,
        receiptCount: receiptSummaryViewModel?.draftCount || 0,
        settlementStage: primaryCard?.hex?.settlementStage || 0,
        convergencePercent: primaryCard?.convergencePercent || 0,
        trustFloor: primaryCard?.trustFloor || "L1",
        trustCeiling: primaryCard?.trustCeiling || "L1",
        canSeal: Boolean(formalSealCheck?.canSeal),
        errorCount: diagnostics.errors?.length || 0,
      },
      editorState: {
        activeDocumentKey: activeDocument?.documentKey || "",
        activeDocumentTitle: activeDocument?.title || "Untitled document",
        activeDocumentKind: getDocumentKindLabel(activeDocument),
        blockCount: blocks.length,
        confirmationCount: controlSurfaceViewModel?.confirmationCount || 0,
      },
      diagnosticsState: {
        formalBoxState,
        formalSealCheck,
        operateResult,
        operatePending,
        operateError,
      },
      buildState: {
        latestReceipt: receiptSummaryViewModel?.latestDraft || null,
        receiptCount: receiptSummaryViewModel?.draftCount || 0,
        warningCount: unresolvedCount,
        settlementStage: primaryCard?.hex?.settlementStage || 0,
      },
    };
  }, [
    activeDocument,
    blocks.length,
    clipboard.length,
    controlSurfaceViewModel?.confirmationCount,
    formalBoxState,
    formalSealCheck,
    operateError,
    operatePending,
    operateResult,
    receiptSummaryViewModel,
    stagedAiBlocks.length,
  ]);
  const assemblyLaneViewModel = buildBoxAssemblyLaneViewModel({
    activeProject,
    projectDocuments: hydratedProjectDocuments,
    currentAssemblyDocument: currentSeedDocument,
    projectDrafts: projectDraftsState,
    resumeSessionSummary: resumeSessionSummaryState,
    connectionStatus: getReceiptsConnectionStatus,
    connectionLastError: getReceiptsConnectionLastError,
  });
  const activeWordLayerProjectKey = activeProjectKey || DEFAULT_PROJECT_KEY;
  const activeWordLayerHypotheses =
    wordLayerHypothesesByProjectKey[activeWordLayerProjectKey] || [];
  const activeWordLayerHypothesesError =
    wordLayerErrorByProjectKey[activeWordLayerProjectKey] || "";
  const activeWordLayerHypothesesPending =
    wordLayerPendingProjectKey === activeWordLayerProjectKey;
  const rootViewModel = buildRootViewModel(activeProject);
  const hasRoot = Boolean(rootViewModel?.hasRoot);
  const rootSuggestionReady =
    !hasRoot && (realProjectSourceDocuments.length >= 2 || Boolean(currentSeedDocument?.documentKey));
  const rootSuggestionContext = useMemo(
    () => ({
      boxTitle: activeBoxTitle,
      sourceCount: realProjectSourceDocuments.length,
      sourceDocuments: realProjectSourceDocuments
        .slice(0, 5)
        .map((document) => buildRootSuggestionDocumentSummary(document))
        .filter(Boolean),
      seedDocument: currentSeedDocument
        ? buildRootSuggestionDocumentSummary(currentSeedDocument)
        : null,
    }),
    [activeBoxTitle, currentSeedDocument, realProjectSourceDocuments],
  );
  const assemblySurfaceStyle = {
    "--assembly-wash": controlSurfaceViewModel?.stateColorTokens?.fill || "transparent",
  };
  const isLanePhase = boxPhase === BOX_PHASES.lane;
  const isThinkPhase = boxPhase === BOX_PHASES.think;
  const isCreatePhase = boxPhase === BOX_PHASES.create;
  const isOperatePhase = boxPhase === BOX_PHASES.operate;
  const isReceiptsPhase = boxPhase === BOX_PHASES.receipts;
  const activeDesktopSidecar = normalizeDesktopSidecarPanel(
    desktopSidecarPanel,
    getDefaultDesktopSidecarPanel(boxPhase),
  );
  const isFirstTimeSurface =
    !launchpadOpen &&
    resolvedEntryMode === "first-time" &&
    !currentSeedDocument?.documentKey &&
    realProjectSourceDocuments.length === 0;
  const showDesktopHomeToolbar =
    !isMobileLayout &&
    launchpadOpen &&
    normalizeLaunchpadView(launchpadView, LAUNCHPAD_VIEWS.boxes) === LAUNCHPAD_VIEWS.box;
  const isHomeSurface =
    launchpadOpen &&
    normalizeLaunchpadView(launchpadView, LAUNCHPAD_VIEWS.boxes) === LAUNCHPAD_VIEWS.box;
  const recordSessionCheckpoint = useCallback(async (reason = "activity", { useBeacon = false } = {}) => {
    const projectKey = String(activeProjectKey || "").trim();
    if (!projectKey) return;

    const payload = JSON.stringify({
      projectKey,
      seedDocumentKey: String(currentSeedDocument?.documentKey || "").trim(),
      reason,
    });

    if (useBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/workspace/checkpoint", blob);
      return;
    }

    await fetch("/api/workspace/checkpoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: reason === "exit",
    }).catch(() => null);
  }, [activeProjectKey, currentSeedDocument?.documentKey]);

  useEffect(() => {
    if (!activeProject?.projectKey) {
      setRootEditorOpen(false);
      setPendingRootGate(null);
    }
  }, [activeProject?.projectKey]);

  useEffect(() => {
    setCloseMoveOpen(false);
    setCloseMoveResult(null);
    setCloseMoveDelta("");
    setCloseMoveError("");
  }, [activeProjectKey]);

  useEffect(() => {
    exitCheckpointSentRef.current = false;
  }, [activeProjectKey]);

  useEffect(() => {
    if (idleCheckpointTimeoutRef.current) {
      window.clearTimeout(idleCheckpointTimeoutRef.current);
    }

    const scheduleCheckpoint = () => {
      if (idleCheckpointTimeoutRef.current) {
        window.clearTimeout(idleCheckpointTimeoutRef.current);
      }
      idleCheckpointTimeoutRef.current = window.setTimeout(() => {
        void recordSessionCheckpoint("idle");
      }, 20 * 60 * 1000);
    };

    const handleActivity = () => {
      exitCheckpointSentRef.current = false;
      scheduleCheckpoint();
    };

    const handlePageHide = () => {
      if (exitCheckpointSentRef.current) return;
      exitCheckpointSentRef.current = true;
      void recordSessionCheckpoint("exit", { useBeacon: true });
    };

    scheduleCheckpoint();
    window.addEventListener("pointerdown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("focus", handleActivity);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      if (idleCheckpointTimeoutRef.current) {
        window.clearTimeout(idleCheckpointTimeoutRef.current);
      }
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("focus", handleActivity);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [recordSessionCheckpoint]);
  const focusedBlock =
    blocks.find((block) => block.id === focusBlockId) || blocks[0] || null;
  const playbackBlockId = playheadBlockId || focusBlockId || blocks[0]?.id || null;
  const firstBlockId = blocks[0]?.id || null;
  const currentIndex = Math.max(
    0,
    blocks.findIndex((block) => block.id === playbackBlockId),
  );
  const currentBlock = blocks[currentIndex] || null;
  const nextBlock = blocks[currentIndex + 1] || null;
  const progress = blocks.length ? ((currentIndex + 1) / blocks.length) * 100 : 0;
  const isListenMode = workspaceMode === WORKSPACE_MODES.listen;
  const showDesktopIde =
    !isMobileLayout &&
    !launchpadOpen &&
    !isFirstTimeSurface &&
    !isListenMode;
  const thinkSourceSummary =
    thinkViewModel?.activeSource?.operateSummary ||
    thinkViewModel?.activeSource?.metaLine ||
    "";
  const canInterpretInstrument = Boolean(activeDocument?.documentKey || currentSeedDocument?.documentKey);
  const activeSurfaceKey = isListenMode
    ? "listen"
    : isOperatePhase
      ? "operate"
      : isReceiptsPhase
        ? "receipts"
        : isCreatePhase
          ? "seed"
          : "think";
  const defaultRealityMoveSpace = useMemo(() => {
    if (isOperatePhase) {
      return [{ key: "run-operate", label: "Run Operate", disabled: !canRunOperate || operatePending }];
    }
    if (isReceiptsPhase) {
      return [{ key: "draft-receipt", label: "Draft receipt", disabled: receiptPending }];
    }
    if (isCreatePhase) {
      return [
        {
          key: desktopStageCount > 0 ? "open-stage" : "open-add",
          label: desktopStageCount > 0 ? `Stage ${desktopStageCount}` : "Add source",
        },
      ];
    }
    return [{ key: "open-add", label: "Add source" }];
  }, [
    canRunOperate,
    desktopStageCount,
    isCreatePhase,
    isOperatePhase,
    isReceiptsPhase,
    operatePending,
    receiptPending,
  ]);
  const documentWarningInstrumentIssue = useMemo(() => {
    if (!activeDocumentWarning) return null;

    return buildRealityInstrumentIssue({
      key: `document-warning:${activeDocument.documentKey}:${activeDocumentWarning}`,
      surfaceKey: activeSurfaceKey,
      severity: "warning",
      priority: 64,
      label: "Source warning",
      headline: `${activeDocument.title} needs attention.`,
      summary: activeDocumentWarning,
      compactSummary: activeDocumentWarning,
      evidence: [
        { label: "Document", value: activeDocument.title || "Current document" },
      ],
      moveSpace: [
        {
          key: "instrument-interpret",
          label: "Infer with Seven",
          disabled: !canInterpretInstrument,
        },
        { key: "instrument-dismiss", label: "Dismiss" },
      ],
      sevenAssist: {
        intent: "warning-interpret",
        surface: activeSurfaceKey,
        context: {
          warning: activeDocumentWarning,
          documentTitle: activeDocument.title,
          documentKey: activeDocument.documentKey,
        },
      },
    });
  }, [activeDocument.documentKey, activeDocument.title, activeDocumentWarning, activeSurfaceKey, canInterpretInstrument]);
  const receiptInstrumentIssue = useMemo(() => {
    if (!receiptSealDraft?.id) return null;

    const hardFailure = (receiptSealAudit?.checks || []).find(
      (check) => check.hardBlock && check.status === "fail",
    );
    const warningCheck = (receiptSealAudit?.checks || []).find(
      (check) => check.status === "warn" || (!check.hardBlock && check.status === "fail"),
    );

    if (receiptSealAuditError) {
      return buildRealityInstrumentIssue({
        key: "receipt-audit-error",
        surfaceKey: "receipts",
        severity: "blocked",
        priority: 88,
        label: "Seal audit",
        headline: "The pre-seal audit could not complete.",
        summary: receiptSealAuditError,
        compactSummary: receiptSealAuditError,
        moveSpace: [
          { key: "receipt-refresh-audit", label: receiptSealAuditPending ? "Auditing…" : "Refresh audit", disabled: receiptSealAuditPending || receiptPending },
          {
            key: "instrument-interpret",
            label: "Infer with Seven",
            disabled: !canInterpretInstrument,
          },
        ],
        sevenAssist: {
          intent: "receipt-interpret",
          surface: "receipts",
          context: {
            auditError: receiptSealAuditError,
            draftTitle: receiptSealDraft.title || "",
            deltaStatement: receiptSealDelta,
          },
        },
      });
    }

    if (!receiptSealDelta.trim()) {
      return buildRealityInstrumentIssue({
        key: "receipt-delta-missing",
        surfaceKey: "receipts",
        severity: "constraint",
        priority: 72,
        label: "Delta",
        headline: "The seal needs one operator sentence.",
        summary: "State what changed before sealing so the receipt can carry a portable line.",
        compactSummary: "Write the delta before sealing",
        moveSpace: [
          { key: "receipt-focus-delta", label: "Write delta" },
        ],
      });
    }

    if (!receiptSealAudit) {
      return buildRealityInstrumentIssue({
        key: "receipt-audit-missing",
        surfaceKey: "receipts",
        severity: "constraint",
        priority: 68,
        label: "Seal audit",
        headline: receiptSealAuditPending
          ? "The pre-seal audit is reading the current line."
          : "The pre-seal audit will update as you write.",
        summary: receiptSealAuditPending
          ? "Root alignment, evidence contact, and Seed alignment are being read right now."
          : "The audit updates continuously once the delta statement is present.",
        compactSummary: receiptSealAuditPending ? "Auditing the current line" : "Audit updates as you write",
        moveSpace: [
          { key: "receipt-refresh-audit", label: receiptSealAuditPending ? "Auditing…" : "Refresh audit", disabled: receiptSealAuditPending || receiptPending },
        ],
      });
    }

    if (hardFailure) {
      return buildRealityInstrumentIssue({
        key: "receipt-hard-block",
        surfaceKey: "receipts",
        severity: "blocked",
        priority: 86,
        label: "Seal blocked",
        headline: "The seal is blocked by reality.",
        summary: hardFailure.message,
        compactSummary: hardFailure.message,
        evidence: [{ label: "Check", value: hardFailure.label }],
        moveSpace: [
          { key: "receipt-focus-delta", label: "Revise delta" },
          { key: "open-confirmation", label: "Inspect evidence" },
          {
            key: "instrument-interpret",
            label: "Infer with Seven",
            disabled: !canInterpretInstrument,
          },
        ],
        sevenAssist: {
          intent: "receipt-interpret",
          surface: "receipts",
          context: {
            summary: receiptSealAudit.summary,
            checks: receiptSealAudit.checks,
            draftTitle: receiptSealDraft.title || "",
            deltaStatement: receiptSealDelta,
          },
        },
      });
    }

    if (warningCheck) {
      return buildRealityInstrumentIssue({
        key: "receipt-warning",
        surfaceKey: "receipts",
        severity: "warning",
        priority: 74,
        label: "Seal warning",
        headline: "The seal can proceed, but the line still needs human interpretation.",
        summary: warningCheck.message,
        compactSummary: warningCheck.message,
        evidence: [{ label: "Check", value: warningCheck.label }],
        moveSpace: [
          { key: "receipt-focus-delta", label: "Revise delta" },
          { key: "open-confirmation", label: "Inspect evidence" },
          { key: "receipt-seal", label: "Seal anyway", disabled: receiptPending || !receiptSealAudit?.canOverride },
          {
            key: "instrument-interpret",
            label: "Infer with Seven",
            disabled: !canInterpretInstrument,
          },
        ],
        sevenAssist: {
          intent: "receipt-interpret",
          surface: "receipts",
          context: {
            summary: receiptSealAudit.summary,
            checks: receiptSealAudit.checks,
            draftTitle: receiptSealDraft.title || "",
            deltaStatement: receiptSealDelta,
          },
        },
      });
    }

    return null;
  }, [
    receiptPending,
    receiptSealAudit,
    receiptSealAuditError,
    receiptSealAuditPending,
    receiptSealDelta,
    receiptSealDraft,
    canInterpretInstrument,
  ]);
  const voiceInstrumentIssue = useMemo(() => {
    if (!voiceRecorderOpen) return null;
    const hasDraft = Boolean(voiceMemoDraft?.id || voiceMemoDraft?.blob);

    if (hasDraft && voiceRecorderError) {
      return buildRealityInstrumentIssue({
        key: "voice-recovery",
        surfaceKey: "voice",
        severity: "recovery",
        priority: 76,
        label: "Voice recovery",
        headline: "The voice memo is preserved on this device.",
        summary: voiceRecorderError,
        compactSummary: voiceRecorderError,
        evidence: [
          { label: "Draft", value: voiceMemoDraft?.filename || "Voice memo" },
        ],
        moveSpace: [
          { key: "voice-retry", label: "Retry" },
          { key: "voice-save", label: "Save recording" },
          { key: "voice-discard", label: "Discard" },
          {
            key: "instrument-interpret",
            label: "Infer with Seven",
            disabled: !canInterpretInstrument,
          },
        ],
        sevenAssist: {
          intent: "voice-recovery",
          surface: "voice",
          context: {
            errorMessage: voiceRecorderError,
            filename: voiceMemoDraft?.filename || "",
          },
        },
      });
    }

    if (voiceRecorderError) {
      return buildRealityInstrumentIssue({
        key: "voice-blocked",
        surfaceKey: "voice",
        severity: "blocked",
        priority: 80,
        label: "Speak",
        headline: "The voice path hit a hard stop.",
        summary: voiceRecorderError,
        compactSummary: voiceRecorderError,
        moveSpace: [
          { key: "voice-close", label: "Close recorder" },
          {
            key: "instrument-interpret",
            label: "Infer with Seven",
            disabled: !canInterpretInstrument,
          },
        ],
      });
    }

    return null;
  }, [
    canInterpretInstrument,
    voiceMemoDraft?.blob,
    voiceMemoDraft?.filename,
    voiceMemoDraft?.id,
    voiceRecorderError,
    voiceRecorderOpen,
  ]);
  const voiceInstrumentViewModel = useMemo(
    () =>
      voiceRecorderOpen && voiceInstrumentIssue
        ? buildRealityInstrumentViewModel({
            surfaceKey: "voice",
            boxTitle: activeBoxTitle,
            documentTitle: activeDocument.title,
            stateSummary: controlSurfaceViewModel?.stateSummary,
            issues: [voiceInstrumentIssue],
            defaultSummary:
              voiceRecorderPhase === "recording"
                ? "The recorder is listening for a voice memo source."
                : "Speak note becomes a recoverable source path.",
            defaultMoveSpace:
              voiceRecorderPhase === "idle"
                ? [{ key: "voice-start", label: "Start recording" }]
                : [],
          })
        : null,
    [
      activeBoxTitle,
      activeDocument.title,
      controlSurfaceViewModel?.stateSummary,
      voiceInstrumentIssue,
      voiceRecorderPhase,
      voiceRecorderOpen,
    ],
  );
  const courthouseInstrumentIssue = useMemo(() => {
    if (!receiptSummaryViewModel?.latestDraft?.id) return null;
    const latestRemoteSealStatus = String(receiptSummaryViewModel.latestRemoteSealStatus || "").trim().toLowerCase();

    if (
      receiptSummaryViewModel.latestCanRetryRemoteSync &&
      (latestRemoteSealStatus === "failed" ||
        latestRemoteSealStatus === "pending_create" ||
        latestRemoteSealStatus === "pending_seal")
    ) {
      return buildRealityInstrumentIssue({
        key: `courthouse-retry:${receiptSummaryViewModel.latestDraft.id}`,
        surfaceKey: "receipts",
        severity: latestRemoteSealStatus === "failed" ? "warning" : "constraint",
        priority: 66,
        label: "Courthouse",
        headline:
          latestRemoteSealStatus === "failed"
            ? "The last seal did not reach the courthouse."
            : "The latest seal is still waiting for the courthouse.",
        summary:
          receiptSummaryViewModel.courthouseStatusDetail ||
          receiptSummaryViewModel.syncLine ||
          "Retry when you want the portable courthouse record to catch up.",
        compactSummary: receiptSummaryViewModel.courthouseStatusLine || "Retry courthouse sync",
        moveSpace: [
          { key: "retry-remote-sync", label: "Retry sync" },
          {
            key: "open-getreceipts-connect",
            label: "Reconnect",
            disabled: getReceiptsConnectionStatus === "CONNECTED",
          },
        ],
      });
    }

    if (
      (getReceiptsConnectionStatus === "EXPIRED" || getReceiptsConnectionStatus === "ERROR") &&
      receiptSummaryViewModel.courthouseAction?.kind === "connect"
    ) {
      return buildRealityInstrumentIssue({
        key: "courthouse-reconnect",
        surfaceKey: "receipts",
        severity: "warning",
        priority: 62,
        label: "Courthouse",
        headline: "Reconnect GetReceipts to resume courthouse sealing.",
        summary:
          receiptSummaryViewModel.courthouseStatusDetail ||
          "Local proof is preserved. Reconnect when you want the courthouse leg back online.",
        compactSummary: receiptSummaryViewModel.courthouseStatusLine || "Reconnect GetReceipts",
        moveSpace: [
          { key: "open-getreceipts-connect", label: "Reconnect" },
        ],
      });
    }

    return null;
  }, [
    getReceiptsConnectionStatus,
    receiptSummaryViewModel,
  ]);
  const workspaceRealityIssues = useMemo(
    () =>
      buildWorkspaceRealityIssues({
        issues: [
          voiceInstrumentIssue,
          receiptInstrumentIssue,
          courthouseInstrumentIssue,
          rootInstrumentIssue,
          globalInstrumentIssue,
          documentWarningInstrumentIssue,
        ],
        dismissedIssueKeys: dismissedInstrumentKeys,
      }),
    [
      courthouseInstrumentIssue,
      dismissedInstrumentKeys,
      documentWarningInstrumentIssue,
      globalInstrumentIssue,
      receiptInstrumentIssue,
      rootInstrumentIssue,
      voiceInstrumentIssue,
    ],
  );
  const shouldHideDefaultRealityInstrument =
    !hasRoot &&
    workspaceRealityIssues.issues.length === 0 &&
    (isHomeSurface || isListenMode || isThinkPhase);
  const realityInstrumentViewModel = useMemo(
    () =>
      shouldHideDefaultRealityInstrument
        ? null
        : buildRealityInstrumentViewModel({
            surfaceKey: activeSurfaceKey,
            boxTitle: activeBoxTitle,
            documentTitle: activeDocument.title,
            stateSummary: controlSurfaceViewModel?.stateSummary,
            issues: workspaceRealityIssues.issues,
            defaultSummary:
              controlSurfaceViewModel?.stateSummary?.nextRequirement ||
              "Reality is currently legible.",
            defaultMoveSpace: defaultRealityMoveSpace,
          }),
    [
      activeBoxTitle,
      activeDocument.title,
      activeSurfaceKey,
      controlSurfaceViewModel?.stateSummary,
      defaultRealityMoveSpace,
      shouldHideDefaultRealityInstrument,
      workspaceRealityIssues.issues,
    ],
  );
  const documentInstrumentViewModel = useMemo(
    () =>
      documentWarningInstrumentIssue
        && !dismissedInstrumentKeys[documentWarningInstrumentIssue.key]
        ? buildRealityInstrumentViewModel({
            surfaceKey: activeSurfaceKey,
            boxTitle: activeBoxTitle,
            documentTitle: activeDocument.title,
            stateSummary: controlSurfaceViewModel?.stateSummary,
            issues: [documentWarningInstrumentIssue],
          })
        : null,
    [
      activeBoxTitle,
      activeDocument.title,
      activeSurfaceKey,
      controlSurfaceViewModel?.stateSummary,
      dismissedInstrumentKeys,
      documentWarningInstrumentIssue,
    ],
  );

  useEffect(() => {
    if (!realityInstrumentViewModel?.hasIssue) {
      setRealityInstrumentOpen(false);
    }
  }, [realityInstrumentViewModel?.hasIssue]);

  const desktopEditorMode =
    !isMobileLayout &&
    workspaceMode === WORKSPACE_MODES.assemble &&
    Boolean(activeDocument?.isEditable);

  const documentWorkbench = (
    <div className="assembler-document">
      <div className="assembler-document__header">
        <div>
          <h2 className="assembler-document__title">{activeDocument.title}</h2>
          {activeDocument.subtitle ? (
            <p className="assembler-document__subtitle">{activeDocument.subtitle}</p>
          ) : null}
        </div>

        <div className="assembler-document__side">
          <div className="assembler-document__meta">
            <span>{getDocumentKindLabel(activeDocument)}</span>
            <span>{getDocumentBlockCountLabel(activeDocument)}</span>
            {activeDocument.sourceFiles?.length ? (
              <span>{activeDocument.sourceFiles.join(", ")}</span>
            ) : null}
            {activeDocument.derivationModel ? (
              <span>{activeDocument.derivationModel}</span>
            ) : null}
          </div>
          <div className="assembler-document__ide-status">
            <SignalChip tone="neutral" subtle>
              {workspaceIdeState.editorState.activeDocumentKind}
            </SignalChip>
            <SignalChip tone="active" subtle>
              {workspaceIdeState.editorState.blockCount} block
              {workspaceIdeState.editorState.blockCount === 1 ? "" : "s"}
            </SignalChip>
            <SignalChip
              tone={formalSealCheck?.canSeal ? "clear" : formalBoxState?.hardErrorCount ? "alert" : "active"}
              subtle
            >
              {formalBoxState?.primaryCard?.convergencePercent || 0}% convergence
            </SignalChip>
          </div>
          {activeDocumentAsset ? (
            <div className="assembler-document__asset">
              {activeDocumentAsset.kind === "image" ? (
                <img
                  className="assembler-document__asset-thumb"
                  src={activeDocumentAsset.url}
                  alt={`Original image for ${activeDocument.title}`}
                />
              ) : (
                <div className="assembler-document__asset-thumb assembler-document__asset-thumb--icon">
                  {activeDocumentAsset.kind === "audio" ? "AUDIO" : "LINK"}
                </div>
              )}
              <div className="assembler-document__asset-copy">
                <span className="assembler-document__asset-badge">
                  {getDocumentKindLabel(activeDocument).toUpperCase()}
                </span>
                <span className="assembler-document__asset-label">
                  {getSourceAssetLabel(activeDocumentAsset)}
                </span>
                {activeDocumentAsset.kind === "audio" && activeDocumentAsset.durationMs ? (
                  <span className="assembler-document__asset-detail">
                    {formatAssetDuration(activeDocumentAsset.durationMs)}
                  </span>
                ) : null}
                <a
                  className="assembler-document__asset-link"
                  href={activeDocumentAsset.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {activeDocumentAsset.kind === "image"
                    ? "Open original image"
                    : activeDocumentAsset.kind === "audio"
                      ? "Open original audio"
                      : "Open original link"}
                </a>
              </div>
            </div>
          ) : null}
          {isMobileLayout && showActiveDocumentTools ? (
            <button
              type="button"
              className="assembler-document__tools-toggle"
              onClick={() => setMobileSourceToolsOpen((value) => !value)}
            >
              {mobileSourceToolsOpen || cleanupOpen ? "Hide tools" : "Tools"}
            </button>
          ) : null}
          {showActiveDocumentTools ? (
            <div
              className={`assembler-document__actions ${
                !isMobileLayout || mobileSourceToolsOpen || cleanupOpen ? "is-visible" : ""
              }`}
            >
              {canManageActiveSource ? (
                <>
                  <SourceActionButton
                    kind="replace"
                    label={cleanupOpen ? "Hide find and replace" : "Show find and replace"}
                    active={cleanupOpen}
                    disabled={Boolean(cleanupPendingAction) || polishPending}
                    onClick={() => setCleanupOpen((value) => !value)}
                  />
                  <SourceActionButton
                    kind="unescape"
                    label={cleanupPendingAction === "unescape" ? "Unescaping markdown…" : "Unescape markdown"}
                    disabled={Boolean(cleanupPendingAction) || polishPending}
                    onClick={() => void unescapeActiveSource()}
                  />
                  <SourceActionButton
                    kind="clean"
                    label={polishPending ? "Cleaning formatting…" : "Clean formatting"}
                    disabled={Boolean(cleanupPendingAction) || polishPending}
                    onClick={() => void polishActiveSource()}
                  />
                </>
              ) : null}
              {canDeleteActiveDocument ? (
                <SourceActionButton
                  kind="delete"
                  label={`Delete ${
                    activeDocument.isAssembly || activeDocument.documentType === "assembly"
                      ? "seed"
                      : "source"
                  }`}
                  danger
                  disabled={Boolean(cleanupPendingAction) || polishPending}
                  onClick={() => void deleteActiveDocument()}
                />
              ) : null}
            </div>
          ) : null}
          {documentInstrumentViewModel ? (
            <RealityInstrument
              viewModel={documentInstrumentViewModel}
              variant="inline"
              onMove={handleRealityInstrumentMove}
            />
          ) : null}
        </div>
      </div>

      {cleanupOpen && canManageActiveSource ? (
        <SourceCleanupTray
          findValue={cleanupFind}
          replaceValue={cleanupReplace}
          pendingAction={cleanupPendingAction}
          onFindChange={setCleanupFind}
          onReplaceChange={setCleanupReplace}
          onReplaceAll={() => void replaceAcrossSource()}
          onDeleteMatches={() => void deleteMatchingBlocks()}
          onClose={() => setCleanupOpen(false)}
        />
      ) : null}

      <div className="assembler-document__blocks">
        {blocks.map((block) => (
          <BlockRow
            key={block.id}
            block={block}
            documents={hydratedProjectDocuments}
            blockRef={(element) => {
              blockRefs.current[block.id] = element;
            }}
            isFocused={block.id === focusBlockId}
            isPlaying={block.id === currentBlock?.id && isPlaying}
            isNext={block.id === nextBlock?.id}
            isSelected={clipboard.some((item) => item.id === block.id)}
            editMode={desktopEditorMode}
            showNativeActions={showDesktopIde}
            actionPending={blockActionPendingId === block.id}
            canDelete={desktopEditorMode && canManageActiveSource && !cleanupPendingAction && !polishPending}
            saveState={blockSaveStates[block.id] || ""}
            onFocus={focusBlock}
            onAdd={addBlockToClipboard}
            onDelete={(blockId) => void deleteBlock(blockId)}
            onRemove={removeBlockFromClipboard}
            onEdit={editBlock}
            onKeepDraft={(targetBlock) => void resetBlockToDraft(targetBlock)}
            onAcceptInference={(targetBlock, sentence) => void acceptBlockInference(targetBlock, sentence)}
            onRecastTag={(targetBlock, primaryTag) => void confirmBlockWorkingTag(targetBlock, primaryTag)}
            onOpenSourceWitness={(targetBlock) => void openBlockSourceWitness(targetBlock)}
          />
        ))}
      </div>
    </div>
  );
  const lastUsedMode =
    normalizeWorkspaceMode(lastModeByProjectKey[activeProjectKey], workspaceMode) ||
    workspaceMode;
  const sevenContextDocumentKey = String(
    launchpadOpen
      ? currentSeedDocument?.documentKey ||
          resumeSessionSummaryState?.documentKey ||
          latestRealSourceDocument?.documentKey ||
          guideSourceDocument?.documentKey ||
          activeDocument?.documentKey ||
          ""
      : activeDocument?.documentKey ||
          currentSeedDocument?.documentKey ||
          latestRealSourceDocument?.documentKey ||
          ""
  ).trim();
  const sevenContextDocument =
    getDocumentByKey(sevenContextDocumentKey, documentCache, projectDocuments) ||
    activeDocument;
  const sevenContextBlocks =
    sevenContextDocument?.documentKey === activeDocument?.documentKey
      ? blocks
      : Array.isArray(sevenContextDocument?.blocks)
        ? sevenContextDocument.blocks
        : EMPTY_BLOCKS;
  const sevenContextFocusedBlock =
    sevenContextDocument?.documentKey === activeDocument?.documentKey
      ? focusedBlock
      : sevenContextBlocks[0] || null;
  const activeSevenThread =
    sevenThreads[sevenContextDocument?.documentKey || ""] ||
    buildEmptySevenThread(sevenContextDocument?.documentKey || "");
  const sevenSuggestions = buildSevenSuggestions(sevenContextFocusedBlock);
  const sevenThreadLoading =
    sevenThreadLoadingKey === (sevenContextDocument?.documentKey || "");

  activeDocumentRef.current = activeDocument;
  blocksRef.current = blocks;
  rateRef.current = rate;
  voiceChoiceRef.current = resolvedVoiceChoice;
  documentLogsRef.current = documentLogs;

  const persistListeningSession = useCallback(async (
    status = "paused",
    {
      documentKey = activeDocument.documentKey,
      block = currentBlock || focusedBlock || blocks[0] || null,
    } = {},
  ) => {
    if (!documentKey) return;

    try {
      await fetch("/api/reader/listening-session", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentKey,
          mode: "flow",
          activeNodeId: block?.id || null,
          activeSectionSlug: block?.sectionSlug || null,
          rate,
          provider: resolvedVoiceChoice?.provider || null,
          voiceId: resolvedVoiceChoice?.voiceId || null,
          status,
          preferredVoiceProvider: resolvedVoiceChoice?.provider || undefined,
          preferredVoiceId: resolvedVoiceChoice?.voiceId || undefined,
          preferredListeningRate: rate,
        }),
      });

      if (status === "active" || status === "paused") {
        setResumeSessionSummaryState({
          documentKey,
          title:
            documentsState.find((document) => document.documentKey === documentKey)?.title ||
            activeDocument.title,
          subtitle:
            documentsState.find((document) => document.documentKey === documentKey)?.subtitle ||
            activeDocument.subtitle ||
            "",
          status,
          blockId: block?.id || null,
          blockPosition:
            typeof block?.sourcePosition === "number" ? block.sourcePosition + 1 : 1,
          totalBlocks:
            documentsState.find((document) => document.documentKey === documentKey)?.sectionCount ||
            blocks.length,
          updatedAt: new Date().toISOString(),
        });
      } else if (resumeSessionSummaryState?.documentKey === documentKey) {
        setResumeSessionSummaryState(null);
      }
    } catch {
      // Session persistence is additive; do not interrupt the core workspace flow.
    }
  }, [
    activeDocument.documentKey,
    activeDocument.subtitle,
    activeDocument.title,
    blocks,
    currentBlock,
    documentsState,
    focusedBlock,
    rate,
    resolvedVoiceChoice?.provider,
    resolvedVoiceChoice?.voiceId,
    resumeSessionSummaryState?.documentKey,
  ]);

  useEffect(() => {
    if (storageHydratedRef.current) return;
    storageHydratedRef.current = true;

    const stored = readWorkspaceState(storageKey);
    if (!stored) return;

    setClipboard(
      normalizeWorkspaceBlocks(stored.clipboard, {
        documentKey: activeDocument.documentKey,
        defaultSourceDocumentKey: activeDocument.documentKey,
        defaultIsEditable: true,
      }),
    );
    if (stored.documentLogs && typeof stored.documentLogs === "object") {
      setDocumentLogs((previous) =>
        Object.entries(stored.documentLogs).reduce((next, [documentKey, entries]) => {
          return mergeDocumentLogEntries(next, documentKey, normalizeWorkspaceLogEntries(entries, documentKey));
        }, previous),
      );
    }
    setRate(clampListeningRate(stored.rate, 1));
    setPreferredImageDerivationMode(
      normalizePreferredImageDerivationMode(stored.preferredImageDerivationMode),
    );
    if (stored.lastModeByProjectKey && typeof stored.lastModeByProjectKey === "object") {
      setLastModeByProjectKey(stored.lastModeByProjectKey);
    }
    if (!requestedWorkspaceMode && stored.lastModeByProjectKey?.[activeProjectKey]) {
      setWorkspaceMode(
        normalizeWorkspaceMode(stored.lastModeByProjectKey[activeProjectKey], WORKSPACE_MODES.assemble),
      );
    }

  }, [storageKey, voiceCatalog, defaultVoiceChoice, activeDocument.documentKey, activeProjectKey, requestedWorkspaceMode]);

  useEffect(() => {
    setDeviceVoiceSupported(browserSupportsDeviceVoice());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedNotice = window.sessionStorage.getItem("loegos-workspace-notice");
    if (!storedNotice) return;

    window.sessionStorage.removeItem("loegos-workspace-notice");

    try {
      const payload = JSON.parse(storedNotice);
      if (payload?.message) {
        setFeedback(payload.message, payload.tone || "");
      }
    } catch {
      // Ignore invalid stored notices.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !initialWorkspaceNotice?.message) return;

    setStatus(initialWorkspaceNotice.message);
    setStatusTone(initialWorkspaceNotice.tone || "");
    if (initialWorkspaceNotice.tone === "error") {
      setGlobalInstrumentIssue(
        buildFeedbackInstrumentIssue(
          initialWorkspaceNotice.message,
          initialWorkspaceNotice.tone || "",
        ),
      );
    } else {
      setGlobalInstrumentIssue(null);
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("connected");
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());
  }, [initialWorkspaceNotice]);

  useEffect(() => {
    if (!boxManagementOpen) return;

    const managedProject =
      hydratedProjects.find((project) => project.projectKey === selectedManagementProjectKey) ||
      activeProject ||
      hydratedProjects[0] ||
      null;

    if (!managedProject) return;

    setSelectedManagementProjectKey(managedProject.projectKey);
    setRenameProjectTitle(managedProject.boxTitle || managedProject.title || "Untitled Box");
  }, [
    activeProject,
    boxManagementOpen,
    hydratedProjects,
    selectedManagementProjectKey,
  ]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (recordingAnimationFrameRef.current) {
        window.cancelAnimationFrame(recordingAnimationFrameRef.current);
        recordingAnimationFrameRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (recordingProcessorRef.current) {
        recordingProcessorRef.current.disconnect();
        recordingProcessorRef.current.onaudioprocess = null;
        recordingProcessorRef.current = null;
      }

      if (recordingSilenceRef.current) {
        recordingSilenceRef.current.disconnect();
        recordingSilenceRef.current = null;
      }

      if (recordingAudioContextRef.current) {
        recordingAudioContextRef.current.close().catch(() => {});
        recordingAudioContextRef.current = null;
      }

      recordingEnabledRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 820px)");
    const updateLayout = () => setIsMobileLayout(mediaQuery.matches);
    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    setResumeSessionSummaryState(resumeSessionSummary);
  }, [resumeSessionSummary]);

  useEffect(() => {
    if (!isMobileLayout && photoIntakeOpen) {
      setPhotoIntakeOpen(false);
    }
  }, [isMobileLayout, photoIntakeOpen]);

  useEffect(() => {
    if (launchpadOpen) return;
    if (currentSeedDocument?.documentKey) return;
    if (!realProjectSourceDocuments.length) return;
    if (seedStatusPending) return;

    const nextFingerprint = `${activeProjectKey}:${seedSourceFingerprint}`;
    if (!nextFingerprint.trim()) return;
    if (seedEnsureFingerprintRef.current === nextFingerprint) return;

    seedEnsureFingerprintRef.current = nextFingerprint;
    const shouldFocusSeed = resolvedEntryMode !== "first-time" || pendingSeedFocusRef.current;
    void ensureSeedForActiveProjectRef.current?.({ focus: shouldFocusSeed });
  }, [
    activeProjectKey,
    currentSeedDocument?.documentKey,
    launchpadOpen,
    realProjectSourceDocuments.length,
    resolvedEntryMode,
    seedSourceFingerprint,
    seedStatusPending,
  ]);

  useEffect(() => {
    if (launchpadOpen) return;
    if (!currentSeedDocument?.documentKey) return;
    if (!realProjectSourceDocuments.length) return;
    if (seedSuggestionPending || seedStatusPending) return;
    if (seedSuggestion?.sourceFingerprint === seedSourceFingerprint) return;
    if (currentSeedFingerprint && currentSeedFingerprint === seedSourceFingerprint) return;

    const nextFingerprint = `${activeProjectKey}:${seedSourceFingerprint}`;
    if (!nextFingerprint.trim()) return;
    if (seedSuggestFingerprintRef.current === nextFingerprint) return;

    seedSuggestFingerprintRef.current = nextFingerprint;
    void requestSeedSuggestionRef.current?.();
  }, [
    activeProjectKey,
    currentSeedDocument?.documentKey,
    currentSeedFingerprint,
    launchpadOpen,
    realProjectSourceDocuments.length,
    seedSourceFingerprint,
    seedStatusPending,
    seedSuggestion,
    seedSuggestionPending,
  ]);

  useEffect(() => {
    const documentKey = sevenContextDocument?.documentKey || "";
    if (!documentKey) return undefined;

    let cancelled = false;
    setSevenThreadError("");
    setSevenThreadLoadingKey(documentKey);

    fetch(`/api/reader/seven/thread?documentKey=${encodeURIComponent(documentKey)}`)
      .then((response) => response.json().catch(() => null).then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (cancelled) return;
        if (!response.ok) {
          throw new Error(payload?.error || "Could not load the Seven conversation.");
        }

        setSevenThreads((previous) => ({
          ...previous,
          [documentKey]: payload?.thread || buildEmptySevenThread(documentKey),
        }));
      })
      .catch((error) => {
        if (cancelled) return;
        recordProductEvent("seven_thread_load_failed", {
          project_key: activeProjectKey || undefined,
          document_key: documentKey || undefined,
          workspace_mode: workspaceMode,
          surface: "workspace",
        });
        setSevenThreadError(
          error instanceof Error ? error.message : "Could not load the Seven conversation.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setSevenThreadLoadingKey((previous) => (
          previous === documentKey ? "" : previous
        ));
      });

    return () => {
      cancelled = true;
    };
  }, [activeProjectKey, sevenContextDocument?.documentKey, workspaceMode]);

  useEffect(() => {
    if (!resolvedVoiceChoice && voiceChoice) {
      setVoiceChoice(null);
      setProviderLabel("Voice");
      return;
    }

    if (
      resolvedVoiceChoice &&
      (resolvedVoiceChoice.provider !== voiceChoice?.provider ||
        String(resolvedVoiceChoice.voiceId || "") !== String(voiceChoice?.voiceId || ""))
    ) {
      setVoiceChoice(resolvedVoiceChoice);
      setProviderLabel(resolvedVoiceChoice.label);
    }
  }, [resolvedVoiceChoice, voiceChoice]);

  useEffect(() => {
    if (!activeProject) return;
    if (activeProject.projectKey === activeProjectKey) return;
    setActiveProjectKey(activeProject.projectKey);
  }, [activeProject, activeProjectKey]);

  useEffect(() => {
    if (!activeProject) return;

    const projectDocumentKeys = new Set(activeProject.documentKeys || []);
    if (!projectDocumentKeys.size) return;

    if (!projectDocumentKeys.has(activeDocumentKey)) {
      const fallbackDocumentKey =
        workspaceMode === WORKSPACE_MODES.listen
          ? getProjectListenDocumentKey(activeProject, projectDocuments)
          : getProjectEntryDocumentKey(activeProject);
      if (fallbackDocumentKey && fallbackDocumentKey !== activeDocumentKey) {
        startTransition(() => {
          setActiveDocumentKey(fallbackDocumentKey);
        });

        if (typeof window !== "undefined") {
          window.history.replaceState(
            {},
            "",
            buildWorkspaceUrl(fallbackDocumentKey, activeProject.projectKey, {
              mode: workspaceMode,
            }),
          );
        }
      }
    }
  }, [activeProject, activeDocumentKey, projectDocuments, workspaceMode]);

  useEffect(() => {
    setLastModeByProjectKey((previous) => {
      if (previous[activeProjectKey] === workspaceMode) {
        return previous;
      }

      return {
        ...previous,
        [activeProjectKey]: workspaceMode,
      };
    });
  }, [activeProjectKey, workspaceMode]);

  useEffect(() => {
    if (
      launchpadOpen ||
      !storageHydratedRef.current ||
      !activeDocumentKey ||
      typeof window === "undefined"
    ) {
      return;
    }

    window.history.replaceState(
      {},
      "",
      buildWorkspaceUrl(activeDocumentKey, activeProjectKey, {
        mode: workspaceMode,
      }),
    );
  }, [activeDocumentKey, activeProjectKey, launchpadOpen, workspaceMode]);

  useEffect(() => {
    writeWorkspaceState(storageKey, {
      clipboard,
      documentLogs,
      rate,
      preferredImageDerivationMode,
      lastModeByProjectKey,
    });
  }, [clipboard, documentLogs, rate, storageKey, preferredImageDerivationMode, lastModeByProjectKey]);

  useEffect(() => {
    const pendingFocusBlockId = pendingFocusBlockIdRef.current;
    const availableBlocks = blocksRef.current;
    const resolvedFocusBlockId =
      availableBlocks.find((block) => block.id === pendingFocusBlockId)?.id || firstBlockId;

    setFocusBlockId(resolvedFocusBlockId);
    setPlayheadBlockId(resolvedFocusBlockId);
    setEditMode(false);
    setBlockSaveStates({});
    setCleanupOpen(false);
    setCleanupFind("");
    setCleanupReplace("");
    setCleanupPendingAction("");
    setListenPickerOpen(false);
    setWorkspacePickerOpen(false);
    setDropAnythingOpen(false);
    setPhotoIntakeOpen(false);
    setVoiceRecorderOpen(false);
    setVoiceRecorderPhase("idle");
    setVoiceRecorderElapsed(0);
    setVoiceRecorderLevel(0);
    setVoiceRecorderError("");
    setMobileComposeOpen(false);
    setMobileSourceToolsOpen(false);
    setAiInput("");
    setSevenThreadError("");
    pendingFocusBlockIdRef.current = null;
  }, [activeDocumentKey, firstBlockId]);

  useEffect(() => {
    setOperatePending(false);
    setOperateError("");
    setOperateResult(null);
    setPendingOperateAudit(null);
  }, [activeProjectKey]);

  useEffect(() => {
    runAiOperationRef.current = runAiOperation;
  });

  useEffect(() => {
    if (!pendingOperateAudit?.documentKey) return;
    if (pendingOperateAudit.documentKey !== activeDocumentKey) return;
    if (loadingDocumentKey) return;
    if (aiPending) return;

    const prompt = pendingOperateAudit.prompt;
    setPendingOperateAudit(null);
    setAiOpen(true);
    void runAiOperationRef.current?.(prompt);
  }, [activeDocumentKey, aiPending, loadingDocumentKey, pendingOperateAudit]);

  useEffect(() => {
    if (!aiOpen) return;
    aiInputRef.current?.focus();
  }, [aiOpen]);

  useEffect(() => {
    let cancelled = false;

    void loadVoiceMemoDraft(ACTIVE_VOICE_MEMO_DRAFT_KEY)
      .then((draft) => {
        if (cancelled || !draft?.file) return;
        setVoiceMemoDraft(draft);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isMobileLayout || boxPhase === BOX_PHASES.think) return;
    setAiOpen(false);
  }, [boxPhase, isMobileLayout]);

  useEffect(() => {
    if (!currentBlock?.id) return;
    const element = blockRefs.current[currentBlock.id];
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [currentBlock?.id]);

  useEffect(
    () => () => {
      playbackStateRef.current.active = false;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      if (browserSupportsDeviceVoice()) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  useEffect(() => {
    if (!status) return;

    const timeoutId = window.setTimeout(() => {
      setStatus("");
      setStatusTone("");
      setGlobalInstrumentIssue(null);
    }, STATUS_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [status, statusTone]);

  useEffect(() => {
    if (workspaceMode !== WORKSPACE_MODES.listen) return undefined;
    if (playbackStatus !== "active" && playbackStatus !== "paused") return undefined;

    const block = currentBlock || focusedBlock || blocks[0] || null;
    const timeoutId = window.setTimeout(() => {
      void persistListeningSession(playbackStatus, {
        documentKey: activeDocument.documentKey,
        block,
      });
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeDocument.documentKey,
    blocks,
    currentBlock,
    focusedBlock,
    playbackStatus,
    persistListeningSession,
    rate,
    resolvedVoiceChoice,
    workspaceMode,
  ]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (
        event.key === "/" &&
        workspaceMode === WORKSPACE_MODES.assemble &&
        !launchpadOpen &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        setBoxPhase(BOX_PHASES.think);
        setAiOpen(true);
        return;
      }

      if (event.key === "Escape" && listenPickerOpen) {
        setListenPickerOpen(false);
        return;
      }

      if (event.key === "Escape" && workspacePickerOpen) {
        setWorkspacePickerOpen(false);
        return;
      }

      if (event.key === "Escape" && mobileBoxSheetOpen) {
        setMobileBoxSheetOpen(false);
        return;
      }

      if (event.key === "Escape" && realityInstrumentOpen) {
        setRealityInstrumentOpen(false);
        return;
      }

      if (event.key === "Escape" && dropAnythingOpen) {
        setDropAnythingOpen(false);
        return;
      }

      if (event.key === "Escape" && photoIntakeOpen) {
        setPhotoIntakeOpen(false);
        return;
      }

      if (event.key === "Escape" && voiceRecorderOpen) {
        closeVoiceRecorderRef.current?.();
        return;
      }

      if (event.key === "Escape" && mobileComposeOpen) {
        setMobileComposeOpen(false);
        return;
      }

      if (event.key === "Escape" && aiOpen) {
        setAiOpen(false);
      }

      if (event.key === "Escape" && pendingImageIntake && !uploading && !pastePendingMode) {
        setPendingImageIntake(null);
      }

      if (event.key === "Escape" && pendingLinkIntake && !uploading && !pastePendingMode) {
        setPendingLinkIntake(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aiOpen, launchpadOpen, listenPickerOpen, workspacePickerOpen, mobileBoxSheetOpen, realityInstrumentOpen, dropAnythingOpen, photoIntakeOpen, voiceRecorderOpen, mobileComposeOpen, pendingImageIntake, pendingLinkIntake, pastePendingMode, uploading, workspaceMode]);

  useEffect(() => {
    async function handlePaste(event) {
      if (pastePendingMode) return;
      if (isTypingTarget(event.target)) return;

      try {
        const payload = await getClipboardPayloadFromPasteEvent(event);
        if (!payload) return;

        event.preventDefault();
        void pasteIntoWorkspaceRef.current?.("clipboard", payload);
      } catch {
        // Ignore malformed clipboard payloads here and let explicit paste actions handle errors.
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [pastePendingMode]);

  function trackWorkspaceEvent(name, properties = {}) {
    recordProductEvent(name, {
      project_key: activeProjectKey || undefined,
      document_key: activeDocumentRef.current?.documentKey || undefined,
      workspace_mode: workspaceMode,
      ...properties,
    });
  }

  function setFeedback(message, tone = "", options = {}) {
    setStatus(message);
    setStatusTone(tone);
    if (options?.issue) {
      setGlobalInstrumentIssue(buildRealityInstrumentIssue(options.issue));
      return;
    }
    if (tone !== "error") {
      setGlobalInstrumentIssue(null);
      return;
    }
    setGlobalInstrumentIssue(buildFeedbackInstrumentIssue(message, tone, options));
  }

  async function runInstrumentAssist({
    intent = "",
    context = {},
    surface = "",
    openAi = true,
  } = {}) {
    const normalizedIntent = normalizeInstrumentText(intent).toLowerCase();
    const targetDocument =
      sevenContextDocument?.documentKey
        ? sevenContextDocument
        : currentSeedDocument?.documentKey
          ? currentSeedDocument
          : normalizedIntent === "root-suggest" && realProjectSourceDocuments[0]?.documentKey
            ? realProjectSourceDocuments[0]
            : null;
    const fallbackTargetDocument = targetDocument || activeDocument;

    if (!fallbackTargetDocument?.documentKey) {
      setFeedback("Open a source or seed before asking Seven to infer from this state.", "error");
      return null;
    }

    const prompt = buildInstrumentAssistPrompt(intent, context);
    const payload = await runAiOperation(prompt, {
      surface: surface || activeSurfaceKey,
      instrumentIntent: intent,
      instrumentContext: context,
      openAi,
      documentOverride: fallbackTargetDocument,
    });

    return payload?.instrumentResult || null;
  }

  function handleRealityInstrumentMove(move) {
    if (!move) return;

    if (move.key === "instrument-dismiss") {
      const activeIssueKey = realityInstrumentViewModel?.activeIssue?.key;
      if (activeIssueKey) {
        setDismissedInstrumentKeys((previous) => ({
          ...previous,
          [activeIssueKey]: true,
        }));
      }
      setGlobalInstrumentIssue(null);
      setRealityInstrumentOpen(false);
      setStatus("");
      setStatusTone("");
      return;
    }

    if (move.key === "open-add") {
      if (isMobileLayout) {
        openWorkspacePicker("add");
        return;
      }
      setDropAnythingOpen(true);
      return;
    }

    if (move.key === "open-stage") {
      openStageSidecar();
      return;
    }

    if (move.key === "run-operate") {
      void runOperate();
      return;
    }

    if (move.key === "draft-receipt") {
      void createReceiptDraft();
      return;
    }

    if (move.key === "open-confirmation") {
      setConfirmationFocus(null);
      setConfirmationOpen(true);
      return;
    }

    if (move.key === "receipt-refresh-audit") {
      void runReceiptSealAudit();
      return;
    }

    if (move.key === "receipt-focus-delta") {
      if (typeof document !== "undefined") {
        document.querySelector(".assembler-receipt-audit__textarea")?.focus();
      }
      return;
    }

    if (move.key === "receipt-seal") {
      void sealReceiptDraft();
      return;
    }

    if (move.key === "retry-remote-sync") {
      void retryReceiptRemoteSync(receiptSummaryViewModel?.latestDraft || receiptSealDraft);
      return;
    }

    if (move.key === "open-verify") {
      const verifyUrl =
        receiptSummaryViewModel?.latestVerifyUrl ||
        realityInstrumentViewModel?.activeIssue?.sevenAssist?.context?.verifyUrl ||
        "";
      if (verifyUrl && typeof window !== "undefined") {
        window.open(verifyUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (move.key === "open-getreceipts-connect") {
      openGetReceiptsConnection();
      return;
    }

    if (move.key === "voice-retry") {
      void retryVoiceMemoDraft();
      return;
    }

    if (move.key === "voice-save") {
      saveVoiceMemoDraftToDisk();
      return;
    }

    if (move.key === "voice-discard") {
      void discardVoiceMemoDraft();
      return;
    }

    if (move.key === "voice-close") {
      closeVoiceRecorderRef.current?.();
      return;
    }

    if (move.key === "voice-start") {
      void startVoiceRecorder();
      return;
    }

    if (move.key === "root-compress" || move.key === "root-rewrite") {
      const sevenAssist = realityInstrumentViewModel?.activeIssue?.sevenAssist || null;
      void runInstrumentAssist({
        intent: move.key,
        context: sevenAssist?.context || {},
        surface: "root",
        openAi: true,
      });
      return;
    }

    if (move.key === "instrument-interpret") {
      const sevenAssist = realityInstrumentViewModel?.activeIssue?.sevenAssist || null;
      void runInstrumentAssist({
        intent: sevenAssist?.intent || "warning-interpret",
        context: sevenAssist?.context || {},
        surface: sevenAssist?.surface || activeSurfaceKey,
        openAi: true,
      });
      return;
    }

    if (move.key === "conflict-load-latest") {
      setGlobalInstrumentIssue(null);
      void loadDocument(activeDocument.documentKey, {
        mode: workspaceMode,
        phase: boxPhase,
      });
    }
  }

  function setDesktopSidecar(nextPanel) {
    const normalizedPanel = normalizeDesktopSidecarPanel(
      nextPanel,
      getDefaultDesktopSidecarPanel(boxPhase),
    );
    setDesktopSidecarPanel(normalizedPanel);
    if (!isMobileLayout) {
      setAiOpen(normalizedPanel === DESKTOP_SIDECAR_PANELS.seven);
    }
  }

  function openRootEditorFor(reason = "voluntary", payload = null) {
    setPendingRootGate(
      reason === "voluntary"
        ? null
        : {
            kind: reason,
            payload: payload && typeof payload === "object" ? payload : null,
          },
    );
    setAiOpen(false);
    setRealityInstrumentOpen(false);
    setRootEditorOpen(true);
  }

  function closeRootEditor() {
    setRootEditorOpen(false);
    setPendingRootGate(null);
  }

  function requireRootFor(kind = "", payload = null) {
    if (hasRoot) return false;
    openRootEditorFor(kind, payload);
    return true;
  }

  function openSevenSidecar() {
    if (isMobileLayout) {
      setBoxPhase(BOX_PHASES.think);
      setAiOpen((value) => !value || !isThinkPhase);
      return;
    }

    setDesktopSidecar(DESKTOP_SIDECAR_PANELS.seven);
    if (isOperatePhase || isReceiptsPhase) {
      setBoxPhase(BOX_PHASES.think);
    }
  }

  function openStageSidecar() {
    if (requireRootFor("seed")) {
      return;
    }

    if (isMobileLayout) {
      setBoxPhase(BOX_PHASES.create);
      setMobileComposeOpen(true);
      setAiOpen(false);
      return;
    }

    setDesktopSidecar(DESKTOP_SIDECAR_PANELS.stage);
    if (isOperatePhase || isReceiptsPhase) {
      void handleSelectBoxPhase(BOX_PHASES.create);
    }
  }

  function openPhotoIntake() {
    setDropAnythingOpen(false);

    if (isMobileLayout) {
      setPhotoIntakeOpen(true);
      return;
    }

    photoLibraryInputRef.current?.click();
  }

  function choosePhotoCamera() {
    setPhotoIntakeOpen(false);
    photoCameraInputRef.current?.click();
  }

  function choosePhotoLibrary() {
    setPhotoIntakeOpen(false);
    photoLibraryInputRef.current?.click();
  }

  function setDocumentState(documentKey, nextState = null) {
    if (!documentKey) return;

    setDocumentStates((previous) => {
      if (!nextState) {
        if (!(documentKey in previous)) return previous;
        const next = { ...previous };
        delete next[documentKey];
        return next;
      }

      return {
        ...previous,
        [documentKey]: nextState,
      };
    });
  }

  function updateUrl(
    documentKey,
    projectKey = activeProjectKey,
    options = {},
  ) {
    if (typeof window === "undefined") return;
    const nextUrl = buildWorkspaceUrl(documentKey, projectKey, {
      mode: workspaceMode,
      ...options,
    });
    window.history.replaceState({}, "", nextUrl);
  }

  function attachDocumentToActiveProject(document, { role = "SOURCE", setAsCurrentAssembly = false } = {}) {
    if (!document?.documentKey) return;

    setProjectsState((previous) =>
      previous.map((project) => {
        if (project.projectKey !== activeProjectKey) {
          return project;
        }

        const nextDocumentKeys = Array.from(
          new Set([...(Array.isArray(project.documentKeys) ? project.documentKeys : []), document.documentKey]),
        );
        const nextSourceDocumentKeys =
          role === "SOURCE"
            ? Array.from(
                new Set([
                  ...(Array.isArray(project.sourceDocumentKeys) ? project.sourceDocumentKeys : []),
                  document.documentKey,
                ]),
              )
            : Array.isArray(project.sourceDocumentKeys)
              ? project.sourceDocumentKeys
              : [];
        const nextAssemblyDocumentKeys =
          role === "ASSEMBLY"
            ? Array.from(
                new Set([
                  ...(Array.isArray(project.assemblyDocumentKeys) ? project.assemblyDocumentKeys : []),
                  document.documentKey,
                ]),
              )
            : Array.isArray(project.assemblyDocumentKeys)
              ? project.assemblyDocumentKeys
              : [];

        return {
          ...project,
          documentKeys: nextDocumentKeys,
          sourceDocumentKeys: nextSourceDocumentKeys,
          assemblyDocumentKeys: nextAssemblyDocumentKeys,
          currentAssemblyDocumentKey: setAsCurrentAssembly
            ? document.documentKey
            : project.currentAssemblyDocumentKey,
          seedDocumentKey: setAsCurrentAssembly
            ? document.documentKey
            : project.seedDocumentKey || project.currentAssemblyDocumentKey,
          subtitle: setAsCurrentAssembly
            ? `Seed: ${document.title}`
            : project.subtitle,
          boxSubtitle: setAsCurrentAssembly
            ? `Seed: ${document.title}`
            : project.boxSubtitle || project.subtitle,
          updatedAt: document.updatedAt || new Date().toISOString(),
        };
      }),
    );
  }

  const upsertProjectDraft = useCallback((draft) => {
    if (!draft?.id) return;

    setProjectDraftsState((previous) => {
      const remaining = previous.filter((entry) => entry.id !== draft.id);
      return [draft, ...remaining].slice(0, 6);
    });
  }, []);

  function persistWorkspaceNotice(message, tone = "success") {
    if (typeof window === "undefined" || !message) return;

    window.sessionStorage.setItem(
      "loegos-workspace-notice",
      JSON.stringify({ message, tone }),
    );
  }

  function selectProjectForManagement(projectKey) {
    const nextProject =
      hydratedProjects.find((project) => project.projectKey === projectKey) ||
      activeProject ||
      hydratedProjects[0] ||
      null;
    const nextTitle = nextProject?.boxTitle || nextProject?.title || "Untitled Box";

    setSelectedManagementProjectKey(nextProject?.projectKey || DEFAULT_PROJECT_KEY);
    setRenameProjectTitle(nextTitle);
    setBoxManagementError("");
  }

  function openProjectManagement(projectKey = activeProjectKey) {
    selectProjectForManagement(projectKey);
    setCreateProjectTitle("Untitled Box");
    setCreateProjectRootText("");
    setCreateProjectRootGloss("");
    setBoxManagementOpen(true);
  }

  function openProjectLaunchpad(projectKey, nextLaunchpadView = LAUNCHPAD_VIEWS.box) {
    if (!projectKey || typeof window === "undefined") return;

    if (projectKey === activeProjectKey) {
      if (workspaceMode === WORKSPACE_MODES.listen && currentBlock) {
        void persistListeningSession("paused", {
          documentKey: activeDocument.documentKey,
          block: currentBlock,
        });
      }
      stopPlayback();
      setAiOpen(false);
      setEditMode(false);
      setBoxPhase(
        nextLaunchpadView === LAUNCHPAD_VIEWS.box ? BOX_PHASES.lane : BOX_PHASES.think,
      );
      setListenPickerOpen(false);
      setWorkspacePickerOpen(false);
      setMobileBoxSheetOpen(false);
      setDropAnythingOpen(false);
      setPhotoIntakeOpen(false);
      closeVoiceRecorderRef.current?.();
      setMobileComposeOpen(false);
      setLaunchpadView(nextLaunchpadView);
      setLaunchpadOpen(true);
      window.history.replaceState(
        {},
        "",
        buildWorkspaceUrl("", projectKey, {
          launchpad: true,
          launchpadView: nextLaunchpadView,
        }),
      );
      return;
    }

    setProjectActionPending(projectKey);
    window.location.assign(
      buildWorkspaceUrl("", projectKey, {
        launchpad: true,
        launchpadView: nextLaunchpadView,
      }),
    );
  }

  function openProject(projectKey) {
    resumeProject(projectKey);
  }

  function resolveProjectResumeState(projectKey = activeProjectKey) {
    const targetProject = getProjectByKey(hydratedProjects, projectKey) || activeProject;
    const targetDocuments = getProjectDocuments(documentsState, targetProject);
    const targetSeedDocument =
      getSeedDocument(targetProject, targetDocuments, "") ||
      getOperateAssemblyDocument(targetProject, targetDocuments, "") ||
      null;
    const targetRealSources = listRealSourceDocuments(targetDocuments);
    const latestTargetRealSource =
      [...targetRealSources].sort((left, right) => {
        const rightTimestamp = Date.parse(right?.updatedAt || right?.createdAt || "");
        const leftTimestamp = Date.parse(left?.updatedAt || left?.createdAt || "");
        return (Number.isNaN(rightTimestamp) ? 0 : rightTimestamp) - (Number.isNaN(leftTimestamp) ? 0 : leftTimestamp);
      })[0] || null;
    const sameProject = projectKey === activeProjectKey;
    const resumedListeningKey = sameProject
      ? String(resumeSessionSummaryState?.documentKey || "").trim()
      : "";
    const resumeDocumentKey =
      resumedListeningKey ||
      String(targetSeedDocument?.documentKey || "").trim() ||
      String(latestTargetRealSource?.documentKey || "").trim() ||
      "";
    const resumeMode =
      resumedListeningKey || !targetSeedDocument?.documentKey
        ? WORKSPACE_MODES.listen
        : WORKSPACE_MODES.assemble;
    const resumePhase =
      resumeMode === WORKSPACE_MODES.assemble ? BOX_PHASES.create : BOX_PHASES.think;

    return {
      documentKey: resumeDocumentKey,
      mode: resumeMode,
      phase: resumePhase,
    };
  }

  function resumeProject(projectKey = activeProjectKey) {
    if (!projectKey || typeof window === "undefined") return;
    const resumeState = resolveProjectResumeState(projectKey);

    if (projectKey !== activeProjectKey) {
      setProjectActionPending(projectKey);
      window.location.assign(
        resumeState.documentKey
          ? buildWorkspaceUrl(resumeState.documentKey, projectKey, {
              mode: resumeState.mode,
              phase: resumeState.phase,
            })
          : buildWorkspaceUrl("", projectKey, {
              launchpad: true,
              launchpadView: LAUNCHPAD_VIEWS.box,
            }),
      );
      return;
    }

    if (resumeState.documentKey) {
      void enterWorkspace(
        resumeState.documentKey,
        resumeState.mode,
        {
          phase: resumeState.phase,
        },
      );
      return;
    }

    openCurrentBoxHome(projectKey);
  }

  function openCurrentBoxHome(projectKey = activeProjectKey) {
    openProjectLaunchpad(projectKey, LAUNCHPAD_VIEWS.box);
  }

  function openBoxesIndex() {
    if (workspaceMode === WORKSPACE_MODES.listen && currentBlock) {
      void persistListeningSession("paused", {
        documentKey: activeDocument.documentKey,
        block: currentBlock,
      });
    }
    stopPlayback();
    setAiOpen(false);
    setEditMode(false);
    setBoxPhase(BOX_PHASES.lane);
    setListenPickerOpen(false);
    setWorkspacePickerOpen(false);
    setMobileBoxSheetOpen(false);
    setDropAnythingOpen(false);
    setPhotoIntakeOpen(false);
    closeVoiceRecorderRef.current?.();
    setMobileComposeOpen(false);
    setLaunchpadView(LAUNCHPAD_VIEWS.boxes);
    setLaunchpadOpen(true);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        {},
        "",
        buildWorkspaceUrl("", activeProjectKey, {
          launchpad: true,
          launchpadView: LAUNCHPAD_VIEWS.boxes,
        }),
      );
    }
  }

  async function updateProjectSettings(projectKey, patch = {}) {
    const normalizedProjectKey = String(projectKey || "").trim();
    if (!normalizedProjectKey) return null;

    setProjectActionPending(normalizedProjectKey);
    setBoxManagementError("");

    try {
      const response = await fetch("/api/workspace/project", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: normalizedProjectKey,
          ...patch,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.project?.projectKey) {
        throw new Error(payload?.error || "Could not update the box.");
      }

      setProjectsState((previous) =>
        previous.map((project) =>
          project.projectKey === payload.project.projectKey
            ? {
                ...project,
                title: payload.project.title ?? project.title,
                boxTitle: payload.project.title ?? project.boxTitle ?? project.title,
                subtitle:
                  payload.project.subtitle === undefined ? project.subtitle : payload.project.subtitle,
                boxSubtitle:
                  payload.project.subtitle === undefined
                    ? project.boxSubtitle || project.subtitle
                    : payload.project.subtitle,
                currentAssemblyDocumentKey:
                  payload.project.currentAssemblyDocumentKey ?? project.currentAssemblyDocumentKey,
                isPinned:
                  payload.project.isPinned === undefined
                    ? Boolean(project.isPinned)
                    : Boolean(payload.project.isPinned),
                isArchived:
                  payload.project.isArchived === undefined
                    ? Boolean(project.isArchived)
                    : Boolean(payload.project.isArchived),
                metadataJson:
                  payload.project.metadataJson === undefined
                    ? project.metadataJson || null
                    : payload.project.metadataJson,
                architectureMeta:
                  payload.project.metadataJson === undefined
                    ? project.architectureMeta || project.metadataJson || null
                    : payload.project.metadataJson,
              }
            : project,
        ),
      );

      return payload.project;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update the box.";
      setBoxManagementError(message);
      setFeedback(message, "error");
      return null;
    } finally {
      setProjectActionPending("");
    }
  }

  async function runExampleAction(projectKey, exampleAction) {
    const normalizedProjectKey = String(projectKey || "").trim();
    if (!normalizedProjectKey || !exampleAction) return null;

    setProjectActionPending(normalizedProjectKey);
    setBoxManagementError("");

    try {
      const response = await fetch("/api/workspace/project", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: normalizedProjectKey,
          exampleAction,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not update the example box.");
      }

      applyProjectPayloadRef.current?.(payload?.project);

      if (payload?.exampleAction === "created-copy" && payload?.project?.projectKey) {
        setBoxManagementOpen(false);
        setFeedback("Created an updated example copy.", "success");
        window.location.assign(
          buildWorkspaceUrl("", payload.project.projectKey, {
            launchpad: true,
            launchpadView: LAUNCHPAD_VIEWS.box,
          }),
        );
        return payload;
      }

      if (payload?.exampleAction === "refreshed" && payload?.project?.projectKey) {
        setBoxManagementOpen(false);
        setFeedback("Refreshed the example box to the latest template.", "success");
        window.location.assign(
          buildWorkspaceUrl("", payload.project.projectKey, {
            launchpad: true,
            launchpadView: LAUNCHPAD_VIEWS.box,
          }),
        );
        return payload;
      }

      if (payload?.exampleAction === "dismissed") {
        setFeedback("Dismissed this example update.", "success");
        return payload;
      }

      return payload;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update the example box.";
      setBoxManagementError(message);
      setFeedback(message, "error");
      return null;
    } finally {
      setProjectActionPending("");
    }
  }

  async function resumePendingRootGate(rootGate = null) {
    const normalizedGate = rootGate && typeof rootGate === "object" ? rootGate : null;
    const gateKind = String(normalizedGate?.kind || "").trim().toLowerCase();
    const gatePayload = normalizedGate?.payload && typeof normalizedGate.payload === "object"
      ? normalizedGate.payload
      : {};

    if (gateKind === "seed") {
      await handleSelectBoxPhase(BOX_PHASES.create, { skipRootGate: true });
      return;
    }

    if (gateKind === "receipt-draft") {
      await createReceiptDraft({
        mode: gatePayload.mode || "workspace",
        operateResult: gatePayload.operateResult || null,
        skipRootGate: true,
      });
      return;
    }

    if (gateKind === "receipt-seal") {
      await sealReceiptDraft({ skipRootGate: true });
      return;
    }

    if (gateKind === "close-move-seal") {
      await handleCloseMovePrimaryAction();
    }
  }

  async function saveRootForProject(projectKey, payload) {
    const normalizedProjectKey = String(projectKey || "").trim();
    if (!normalizedProjectKey) return null;

    setRootPending(true);
    try {
      const rootGate = pendingRootGate;
      const updated = await updateProjectSettings(normalizedProjectKey, payload);
      if (updated?.metadataJson?.root?.text) {
        setFeedback(`Root declared for ${updated.title || "this box"}.`, "success");
        if (rootGate) {
          await resumePendingRootGate(rootGate);
        }
        setPendingRootGate(null);
      } else if (updated) {
        setFeedback("Saved the root gloss.", "success");
        setPendingRootGate(null);
      }
      return updated;
    } finally {
      setRootPending(false);
    }
  }

  function openFocusedConfirmation(entry = null) {
    const documentKey = String(entry?.documentKey || "").trim();
    if (!documentKey) return;
    setConfirmationFocus({
      documentKey,
      itemId: String(entry?.focusItemId || "").trim() || null,
      label: entry?.title || "Evidence",
    });
    setConfirmationOpen(true);
  }

  async function resolveConfirmationItem({
    item,
    action = "confirm",
    primaryTag = "",
    domain = "",
  } = {}) {
    if (!item?.documentKey || !item?.id || !activeProjectKey) return;

    setConfirmationPending(true);
    try {
      const response = await fetch("/api/workspace/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: activeProjectKey,
          documentKey: item.documentKey,
          blockId: item.id,
          action,
          primaryTag,
          domain,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.document?.documentKey) {
        throw new Error(payload?.error || "Could not update the confirmation queue.");
      }

      upsertDocument(payload.document, { replaceLogs: true });
      setFeedback(
        action === "discard" ? "Discarded the block from active confirmation." : "Confirmed the block.",
        "success",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Could not update the confirmation queue.",
        "error",
      );
      throw error;
    } finally {
      setConfirmationPending(false);
    }
  }

  function openReceiptSealDialog(draft) {
    if (!draft?.id) return;

    const nextDelta =
      draft?.payload?.deltaStatement ||
      draft?.payload?.decision ||
      draft?.payload?.learned ||
      draft?.implications ||
      "";
    setReceiptSealDraft(draft);
    setReceiptSealDelta(nextDelta);
    setReceiptSealAudit(null);
    setReceiptSealAuditError("");
    setReceiptSealAuditStatement("");
  }

  function openCloseMoveDialog(result) {
    if (!result) return;

    setCloseMoveResult(result);
    setCloseMoveDelta(buildCloseMoveDeltaStatement(result));
    setCloseMoveError("");
    setCloseMoveOpen(true);
  }

  function closeCloseMoveDialog() {
    if (closeMovePending || receiptPending) return;

    setCloseMoveOpen(false);
    setCloseMoveResult(null);
    setCloseMoveDelta("");
    setCloseMoveError("");
  }

  function setProjectRerouteContext(projectKey, nextContext = null) {
    const normalizedProjectKey = String(projectKey || "").trim();
    if (!normalizedProjectKey) return;

    setRerouteContextByProjectKey((previous) => {
      if (!nextContext) {
        if (!previous[normalizedProjectKey]) return previous;
        const { [normalizedProjectKey]: _removed, ...rest } = previous;
        return rest;
      }

      return {
        ...previous,
        [normalizedProjectKey]: nextContext,
      };
    });
  }

  function clearActiveRerouteContext() {
    setProjectRerouteContext(activeProjectKey, null);
  }

  async function handleCloseMovePrimaryAction() {
    if (!closeMoveResult) return;

    const closeMoveMode = getCloseMoveMode(closeMoveResult);
    setCloseMovePending(true);
    setCloseMoveError("");

    try {
      if (closeMoveMode === "seal") {
        if (
          requireRootFor("close-move-seal", {
            operateResult: closeMoveResult,
            deltaStatement: closeMoveDelta,
          })
        ) {
          return;
        }

        const draft = await createReceiptDraft({
          mode: "operate",
          operateResult: closeMoveResult,
          skipRootGate: true,
          returnDraft: true,
          silentFeedback: true,
        });
        if (!draft?.id) {
          return;
        }

        const sealedDraft = await performSealReceiptDraft({
          draft,
          deltaStatement: closeMoveDelta,
          skipRootGate: true,
          silentFeedback: true,
        });
        if (!sealedDraft?.id) {
          return;
        }

        setCloseMoveOpen(false);
        setCloseMoveResult(null);
        setCloseMoveDelta("");
        setCloseMoveError("");
        clearActiveRerouteContext();
        setBoxPhase(BOX_PHASES.receipts);
        setFeedback("Operate closed as a sealed move.", "success");
        return;
      }

      setCloseMoveOpen(false);
      setCloseMoveResult(null);
      setCloseMoveDelta("");
      setCloseMoveError("");
      setProjectRerouteContext(
        activeProjectKey,
        buildRerouteContext(closeMoveResult, closeMoveDelta),
      );
      setBoxPhase(BOX_PHASES.create);
      setFeedback("Operate preserved the turn. Reroute the seed from here.", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not close this move.";
      setCloseMoveError(message);
      setFeedback(message, "error");
    } finally {
      setCloseMovePending(false);
    }
  }

  async function handleCloseMoveSaveDraft() {
    if (!closeMoveResult) return;

    setCloseMovePending(true);
    setCloseMoveError("");
    try {
      const draft = await createReceiptDraft({
        mode: "operate",
        operateResult: closeMoveResult,
        returnDraft: true,
        silentFeedback: true,
      });
      if (!draft?.id) {
        return;
      }

      setCloseMoveOpen(false);
      setCloseMoveResult(null);
      setCloseMoveDelta("");
      setCloseMoveError("");
      clearActiveRerouteContext();
      setBoxPhase(BOX_PHASES.receipts);
      setFeedback("Operate draft saved. Seal it when the move is ready.", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save the receipt draft.";
      setCloseMoveError(message);
      setFeedback(message, "error");
    } finally {
      setCloseMovePending(false);
    }
  }

  function handleAssemblyLaneContextualAction(action) {
    if (!action?.kind) return;

    if (action.kind === "open-create") {
      handleSelectBoxPhase(BOX_PHASES.create);
      return;
    }

    if (action.kind === "run-operate") {
      void runOperate();
      return;
    }

    if (action.kind === "open-seal") {
      const targetDraft =
        projectDraftsState.find((draft) => String(draft?.id || "").trim() === String(action?.draftId || "").trim()) ||
        receiptSummaryViewModel?.latestDraft ||
        null;

      if (targetDraft?.id) {
        openReceiptSealDialog(targetDraft);
        return;
      }

      openReceiptsSurface();
    }
  }

  async function handleInterpretWordLayer(wordLayer = null) {
    const projectKey = activeProjectKey || DEFAULT_PROJECT_KEY;
    if (!wordLayer?.hypothesisReadyEvidence?.available) {
      setFeedback("The box needs more lexical evidence before Seven can suggest a hypothesis.", "error");
      return;
    }

    const fallbackTargetDocument =
      currentSeedDocument?.documentKey
        ? currentSeedDocument
        : realProjectSourceDocuments[0]?.documentKey
          ? realProjectSourceDocuments[0]
          : activeDocument;

    if (!fallbackTargetDocument?.documentKey) {
      setFeedback("Open a source or seed before asking Seven to read the word layer.", "error");
      return;
    }

    setWordLayerPendingProjectKey(projectKey);
    setWordLayerErrorByProjectKey((previous) => ({
      ...previous,
      [projectKey]: "",
    }));

    try {
      const response = await fetch("/api/seven", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "question",
          question: "",
          surface: "lane",
          instrumentIntent: "word-layer-hypothesis",
          instrumentContext: buildWordLayerInstrumentContext(
            assemblyLaneViewModel,
            wordLayer,
          ),
          documentKey: fallbackTargetDocument.documentKey,
          documentTitle: fallbackTargetDocument.title,
          documentSubtitle: fallbackTargetDocument.subtitle || "",
          ...buildSevenRequestContext(fallbackTargetDocument),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Seven couldn't read the word layer right now.");
      }

      const hypotheses = normalizeWordLayerHypotheses(payload?.instrumentResult);
      if (!hypotheses.length) {
        throw new Error("Seven did not return a usable hypothesis from the word layer.");
      }

      setWordLayerHypothesesByProjectKey((previous) => ({
        ...previous,
        [projectKey]: hypotheses,
      }));
      setFeedback("Seven read the word layer.", "success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Seven couldn't read the word layer right now.";
      setWordLayerErrorByProjectKey((previous) => ({
        ...previous,
        [projectKey]: message,
      }));
      setFeedback(message, "error");
    } finally {
      setWordLayerPendingProjectKey((current) => (current === projectKey ? "" : current));
    }
  }

  function closeReceiptSealDialog() {
    if (receiptPending || receiptSealAuditPending) return;
    receiptSealAuditRequestIdRef.current += 1;
    setReceiptSealDraft(null);
    setReceiptSealDelta("");
    setReceiptSealAudit(null);
    setReceiptSealAuditError("");
    setReceiptSealAuditStatement("");
  }

  function openGetReceiptsConnection(returnTo = "workspace-receipts") {
    if (typeof window === "undefined") return;

    const url = new URL("/connect/getreceipts", window.location.origin);
    if (activeProjectKey) {
      url.searchParams.set("project", activeProjectKey);
    }
    url.searchParams.set("returnTo", returnTo);
    window.location.assign(url.toString());
  }

  const retryReceiptRemoteSync = useCallback(async (draft, { silent = false } = {}) => {
    if (!draft?.id) return null;

    try {
      const response = await fetch("/api/workspace/receipt/remote-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draftId: draft.id,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (payload?.draft?.id) {
        upsertProjectDraft(payload.draft);
      }

      if (!response.ok || !payload?.draft?.id || payload?.remoteSync?.ok === false) {
        throw new Error(payload?.error || "Could not sync this receipt to GetReceipts.");
      }
      if (!silent) {
        const remoteSealStatus = String(payload?.draft?.payload?.remoteSeal?.status || "").trim().toLowerCase();
        setFeedback(
          remoteSealStatus === "sealed"
            ? "Courthouse sync complete."
            : "Courthouse sync updated.",
          "success",
        );
      }

      return payload.draft;
    } catch (error) {
      if (!silent) {
        setFeedback(
          error instanceof Error ? error.message : "Could not sync this receipt to GetReceipts.",
          "error",
        );
      }
      return null;
    }
  }, [upsertProjectDraft]);

  const runReceiptSealAudit = useCallback(async (
    draft = receiptSealDraft,
    nextDelta = receiptSealDelta,
  ) => {
    if (!draft?.id) return null;

    const deltaStatement = String(nextDelta || "").trim();
    if (!deltaStatement) {
      setReceiptSealAudit(null);
      setReceiptSealAuditStatement("");
      setReceiptSealAuditError("");
      return null;
    }

    const requestId = receiptSealAuditRequestIdRef.current + 1;
    receiptSealAuditRequestIdRef.current = requestId;
    setReceiptSealAuditPending(true);
    setReceiptSealAuditError("");

    try {
      const response = await fetch("/api/workspace/receipt/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draftId: draft.id,
          deltaStatement,
          projectKey: activeProjectKey,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.audit) {
        throw new Error(payload?.error || "Could not run the pre-seal audit.");
      }

      if (receiptSealAuditRequestIdRef.current === requestId) {
        setReceiptSealAudit(payload.audit);
        setReceiptSealAuditStatement(deltaStatement);
      }
      return payload.audit;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not run the pre-seal audit.";
      if (receiptSealAuditRequestIdRef.current === requestId) {
        setReceiptSealAuditError(message);
      }
      return null;
    } finally {
      if (receiptSealAuditRequestIdRef.current === requestId) {
        setReceiptSealAuditPending(false);
      }
    }
  }, [activeProjectKey, receiptSealDelta, receiptSealDraft]);

  useEffect(() => {
    const draftId = String(receiptSealDraft?.id || "").trim();
    if (!draftId) {
      receiptSealImmediateAuditDraftRef.current = "";
      return undefined;
    }
    if (receiptSealImmediateAuditDraftRef.current === draftId) {
      return undefined;
    }

    receiptSealImmediateAuditDraftRef.current = draftId;
    const normalizedDelta = String(receiptSealDelta || "").trim();
    if (!normalizedDelta) return undefined;

    void runReceiptSealAudit(receiptSealDraft, normalizedDelta);
  }, [receiptSealDelta, receiptSealDraft, runReceiptSealAudit]);

  useEffect(() => {
    if (!receiptSealDraft?.id) return undefined;

    const normalizedDelta = String(receiptSealDelta || "").trim();
    if (!normalizedDelta) {
      setReceiptSealAudit(null);
      setReceiptSealAuditStatement("");
      setReceiptSealAuditError("");
      return undefined;
    }
    if (
      normalizedDelta === receiptSealAuditStatement &&
      (receiptSealAudit || receiptSealAuditPending)
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void runReceiptSealAudit(receiptSealDraft, normalizedDelta);
    }, 320);

    return () => window.clearTimeout(timeoutId);
  }, [
    receiptSealAudit,
    receiptSealAuditPending,
    receiptSealAuditStatement,
    receiptSealDelta,
    receiptSealDraft,
    runReceiptSealAudit,
  ]);

  useEffect(() => {
    if (getReceiptsConnectionStatus !== "CONNECTED") return;

    const retryableDrafts = projectDraftsState.filter((draft) => {
      const remoteStatus = String(draft?.payload?.remoteSeal?.status || "").trim().toLowerCase();
      return (
        Boolean(draft?.id) &&
        (remoteStatus === "pending_create" || remoteStatus === "pending_seal")
      );
    });

    retryableDrafts.forEach((draft) => {
      if (remoteSyncAttemptedRef.current[draft.id]) return;
      remoteSyncAttemptedRef.current[draft.id] = true;
      void retryReceiptRemoteSync(draft, { silent: true });
    });
  }, [getReceiptsConnectionStatus, projectDraftsState, retryReceiptRemoteSync]);

  async function performSealReceiptDraft({
    draft = receiptSealDraft,
    deltaStatement: nextDeltaStatement = receiptSealDelta,
    skipRootGate = false,
    silentFeedback = false,
  } = {}) {
    if (!draft?.id) return null;
    if (!skipRootGate && requireRootFor("receipt-seal")) {
      return;
    }

    const deltaStatement = String(nextDeltaStatement || "").trim();
    if (!deltaStatement) {
      setReceiptSealAuditError("Write one operator sentence describing what changed.");
      return null;
    }

    const audit =
      receiptSealAudit &&
      receiptSealDraft?.id === draft.id &&
      receiptSealAuditStatement === deltaStatement
        ? receiptSealAudit
        : await runReceiptSealAudit(draft, deltaStatement);
    if (!audit) {
      return null;
    }

    const shouldOverride = Boolean(!audit.sealReady && audit.canOverride);
    setReceiptPending(true);
    try {
      const response = await fetch("/api/workspace/receipt", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draftId: draft.id,
          deltaStatement,
          projectKey: activeProjectKey,
          overrideAudit: shouldOverride,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.draft?.id) {
        if (payload?.audit) {
          setReceiptSealAudit(payload.audit);
          setReceiptSealAuditStatement(deltaStatement);
        }
        setReceiptSealAuditError(payload?.error || "Could not seal the receipt.");
        throw new Error(payload?.error || "Could not seal the receipt.");
      }

      if (payload?.audit) {
        setReceiptSealAudit(payload.audit);
        setReceiptSealAuditStatement(deltaStatement);
      }
      upsertProjectDraft(payload.draft);
      const remoteSealStatus = String(payload?.draft?.payload?.remoteSeal?.status || "").trim().toLowerCase();
      const sealMessage =
        remoteSealStatus === "sealed"
          ? "Receipt sealed and verified."
          : remoteSealStatus === "pending_create" || remoteSealStatus === "pending_seal"
            ? "Receipt sealed locally. Courthouse sync is still pending."
            : remoteSealStatus === "failed"
              ? "Receipt sealed locally. Courthouse sync can retry from Receipts."
              : "Receipt sealed.";
      if (!silentFeedback) {
        setFeedback(sealMessage, "success");
      }
      return payload.draft;
    } catch (error) {
      if (!silentFeedback) {
        setFeedback(error instanceof Error ? error.message : "Could not seal the receipt.", "error");
      }
      return null;
    } finally {
      setReceiptPending(false);
    }
  }

  async function sealReceiptDraft({ skipRootGate = false } = {}) {
    const sealedDraft = await performSealReceiptDraft({
      skipRootGate,
    });
    if (!sealedDraft?.id) return;

    setReceiptSealDraft(null);
    setReceiptSealDelta("");
    setReceiptSealAudit(null);
    setReceiptSealAuditError("");
    setReceiptSealAuditStatement("");
  }

  async function toggleProjectPinned(project, nextPinned) {
    if (!project?.projectKey) return;

    const payload = await updateProjectSettings(project.projectKey, {
      isPinned: Boolean(nextPinned),
    });
    if (!payload) return;

    setFeedback(
      payload.isPinned
        ? `Pinned ${project.boxTitle || project.title || "the box"}.`
        : `Unpinned ${project.boxTitle || project.title || "the box"}.`,
      "success",
    );
  }

  async function toggleProjectArchived(project, nextArchived) {
    if (!project?.projectKey) return;

    const payload = await updateProjectSettings(project.projectKey, {
      isArchived: Boolean(nextArchived),
    });
    if (!payload) return;

    setFeedback(
      payload.isArchived
        ? `Archived ${project.boxTitle || project.title || "the box"}.`
        : `Restored ${project.boxTitle || project.title || "the box"}.`,
      "success",
    );
  }

  async function createProject() {
    const title = String(createProjectTitle || "").trim() || "Untitled Box";
    const rootText = String(createProjectRootText || "").trim();
    const rootGloss = String(createProjectRootGloss || "").trim();

    setProjectActionPending("__create__");
    setBoxManagementError("");

    try {
      const response = await fetch("/api/workspace/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, rootText, rootGloss }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.project?.projectKey) {
        throw new Error(payload?.error || "Could not create the box.");
      }

      setBoxManagementOpen(false);
      window.location.assign(
        buildWorkspaceUrl("", payload.project.projectKey, {
          launchpad: true,
          launchpadView: LAUNCHPAD_VIEWS.box,
        }),
      );
    } catch (error) {
      setProjectActionPending("");
      const message = error instanceof Error ? error.message : "Could not create the box.";
      setBoxManagementError(message);
      setFeedback(message, "error");
    }
  }

  async function renameProject() {
    const targetProject =
      hydratedProjects.find((project) => project.projectKey === selectedManagementProjectKey) ||
      null;
    const title = String(renameProjectTitle || "").trim();

    if (!targetProject?.projectKey || !title) {
      setBoxManagementError("Box title is required.");
      return;
    }

    setProjectActionPending("__rename__");
    setBoxManagementError("");

    try {
      const response = await fetch("/api/workspace/project", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: targetProject.projectKey,
          title,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.project?.projectKey) {
        throw new Error(payload?.error || "Could not rename the box.");
      }

      setProjectsState((previous) =>
        previous.map((project) =>
          project.projectKey === payload.project.projectKey
            ? {
                ...project,
                title: payload.project.title,
                boxTitle: payload.project.title,
                subtitle: payload.project.subtitle || project.subtitle,
              }
            : project,
        ),
      );
      setRenameProjectTitle(payload.project.title);
      setProjectActionPending("");
      setFeedback(`Renamed the box to ${payload.project.title}.`, "success");
    } catch (error) {
      setProjectActionPending("");
      const message = error instanceof Error ? error.message : "Could not rename the box.";
      setBoxManagementError(message);
      setFeedback(message, "error");
    }
  }

  async function deleteProject() {
    const targetProject =
      hydratedProjects.find((project) => project.projectKey === selectedManagementProjectKey) ||
      null;

    if (!targetProject?.projectKey) {
      setBoxManagementError("Choose a Box to delete.");
      return;
    }

    setProjectActionPending("__delete__");
    setBoxManagementError("");

    try {
      const response = await fetch("/api/workspace/project", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: targetProject.projectKey,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.result?.fallbackProjectKey) {
        throw new Error(payload?.error || "Could not delete the box.");
      }

      const successMessage =
        payload.result.deleteMode === "purged-example"
          ? "Deleted the Lœgos example box. It will not be recreated unless reset."
          : `Deleted ${targetProject.boxTitle || targetProject.title || "the box"}. Everything moved into ${payload.result.fallbackProjectTitle || "Untitled Box"}.`;
      persistWorkspaceNotice(successMessage, "success");

      if (targetProject.projectKey === activeProjectKey) {
        window.location.assign(
          buildWorkspaceUrl("", payload.result.fallbackProjectKey, {
            launchpad: true,
            launchpadView: LAUNCHPAD_VIEWS.boxes,
          }),
        );
        return;
      }

      setProjectsState((previous) =>
        previous.filter((project) => project.projectKey !== targetProject.projectKey),
      );
      setSelectedManagementProjectKey(payload.result.fallbackProjectKey);
      setBoxManagementOpen(false);
      setProjectActionPending("");
      setFeedback(successMessage, "success");
    } catch (error) {
      setProjectActionPending("");
      const message = error instanceof Error ? error.message : "Could not delete the box.";
      setBoxManagementError(message);
      setFeedback(message, "error");
    }
  }

  function applyProjectPayload(projectPayload = null) {
    if (!projectPayload?.projectKey) return;

    setProjectsState((previous) => {
      const existing = previous.find((project) => project.projectKey === projectPayload.projectKey);
      const nextProject = existing
        ? {
            ...existing,
            title: projectPayload.title || existing.title,
            boxTitle: projectPayload.title || existing.boxTitle || existing.title,
            subtitle:
              projectPayload.subtitle === undefined ? existing.subtitle : projectPayload.subtitle,
            boxSubtitle:
              projectPayload.subtitle === undefined
                ? existing.boxSubtitle || existing.subtitle
                : projectPayload.subtitle,
            currentAssemblyDocumentKey:
              projectPayload.currentAssemblyDocumentKey ?? existing.currentAssemblyDocumentKey,
            isPinned:
              projectPayload.isPinned === undefined
                ? Boolean(existing.isPinned)
                : Boolean(projectPayload.isPinned),
            isArchived:
              projectPayload.isArchived === undefined
                ? Boolean(existing.isArchived)
                : Boolean(projectPayload.isArchived),
            metadataJson:
              projectPayload.metadataJson === undefined
                ? existing.metadataJson || null
                : projectPayload.metadataJson,
            architectureMeta:
              projectPayload.metadataJson === undefined
                ? existing.architectureMeta || existing.metadataJson || null
                : projectPayload.metadataJson,
          }
        : {
            projectKey: projectPayload.projectKey,
            title: projectPayload.title || "Untitled Box",
            boxTitle: projectPayload.title || "Untitled Box",
            subtitle: projectPayload.subtitle || "",
            boxSubtitle: projectPayload.subtitle || "",
            currentAssemblyDocumentKey: projectPayload.currentAssemblyDocumentKey || null,
            isPinned: Boolean(projectPayload.isPinned),
            isArchived: Boolean(projectPayload.isArchived),
            metadataJson: projectPayload.metadataJson || null,
            architectureMeta: projectPayload.metadataJson || null,
          };

      if (existing) {
        return previous.map((project) =>
          project.projectKey === projectPayload.projectKey ? nextProject : project,
        );
      }

      return [nextProject, ...previous];
    });
  }

  const requestSeedOperation = useCallback(async (mode = "ensure", nextSuggestion = null) => {
    const response = await fetch("/api/workspace/seed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        projectKey: activeProjectKey,
        suggestion: nextSuggestion,
        receiptCount: projectDraftsState.length,
        latestOperateAt: operateResult?.ranAt || "",
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "Seed operation failed.");
    }

    return payload;
  }, [
    activeProjectKey,
    operateResult?.ranAt,
    projectDraftsState.length,
  ]);

  const ensureSeedForActiveProject = useCallback(async ({ focus = false } = {}) => {
    if (!activeProjectKey || seedStatusPending) return null;

    setSeedStatusPending(true);
    if (focus) {
      pendingSeedFocusRef.current = true;
    }

    try {
      const payload = await requestSeedOperation("ensure");
      if (payload?.seed?.documentKey) {
        upsertDocumentRef.current?.(payload.seed, { replaceLogs: true });
        attachDocumentToActiveProjectRef.current?.(payload.seed, {
          role: "ASSEMBLY",
          setAsCurrentAssembly: true,
        });
      }
      applyProjectPayloadRef.current?.(payload?.project);
      setEntryStateOverride("");
      setSeedSuggestion(null);
      seedSuggestFingerprintRef.current = payload?.seed?.seedMeta?.sourceFingerprint || seedSourceFingerprint;

      if (payload?.seed?.documentKey && pendingSeedFocusRef.current) {
        pendingSeedFocusRef.current = false;
        setLaunchpadOpen(false);
        setAiOpen(false);
        await loadDocumentRef.current?.(payload.seed.documentKey, {
          mode: WORKSPACE_MODES.assemble,
          phase: BOX_PHASES.create,
        });
        setFeedback(
          payload.created ? `Created the first seed for ${activeBoxTitle}.` : "Opened the live seed.",
          "success",
        );
      }

      return payload?.seed || null;
    } catch (error) {
      seedEnsureFingerprintRef.current = "";
      pendingSeedFocusRef.current = false;
      setFeedback(
        error instanceof Error ? error.message : "Could not create the seed yet.",
        "error",
      );
      return null;
    } finally {
      setSeedStatusPending(false);
    }
  }, [
    activeBoxTitle,
    activeProjectKey,
    requestSeedOperation,
    seedSourceFingerprint,
    seedStatusPending,
  ]);

  const requestSeedSuggestion = useCallback(async () => {
    if (!activeProjectKey || !currentSeedDocument?.documentKey || seedSuggestionPending) return null;

    setSeedSuggestionPending(true);

    try {
      const payload = await requestSeedOperation("suggest");
      if (payload?.suggestion) {
        setSeedSuggestion(payload.suggestion);
        seedSuggestFingerprintRef.current = payload.suggestion.sourceFingerprint || seedSourceFingerprint;
      }
      return payload?.suggestion || null;
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Could not refresh the seed suggestion.",
        "error",
      );
      return null;
    } finally {
      setSeedSuggestionPending(false);
    }
  }, [
    activeProjectKey,
    currentSeedDocument?.documentKey,
    requestSeedOperation,
    seedSourceFingerprint,
    seedSuggestionPending,
  ]);

  ensureSeedForActiveProjectRef.current = ensureSeedForActiveProject;
  requestSeedSuggestionRef.current = requestSeedSuggestion;

  async function applySeedSuggestion() {
    if (!seedSuggestion || seedSuggestionPending) return;

    setSeedSuggestionPending(true);

    try {
      const payload = await requestSeedOperation("apply", seedSuggestion);
      if (payload?.seed?.documentKey) {
        upsertDocument(payload.seed, { replaceLogs: true });
        attachDocumentToActiveProject(payload.seed, {
          role: "ASSEMBLY",
          setAsCurrentAssembly: true,
        });
        await loadDocument(payload.seed.documentKey, {
          mode: WORKSPACE_MODES.assemble,
          phase: BOX_PHASES.create,
        });
      }
      applyProjectPayload(payload?.project);
      setSeedSuggestion(null);
      setEntryStateOverride("");
      clearActiveRerouteContext();
      seedSuggestFingerprintRef.current = payload?.seed?.seedMeta?.sourceFingerprint || seedSourceFingerprint;
      setFeedback("Applied the latest seed update.", "success");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Could not apply the seed update.",
        "error",
      );
    } finally {
      setSeedSuggestionPending(false);
    }
  }

  function dismissSeedSuggestion() {
    seedSuggestFingerprintRef.current =
      seedSuggestion?.sourceFingerprint || seedSourceFingerprint || seedSuggestFingerprintRef.current;
    setSeedSuggestion(null);
    setFeedback("Dismissed the current seed suggestion.");
  }

  function getMobileListenTargetKey() {
    return (
      String(resumeSessionSummaryState?.documentKey || "").trim() ||
      String(latestRealSourceDocument?.documentKey || "").trim() ||
      ""
    );
  }

  function openMobileListenSurface() {
    const targetDocumentKey = getMobileListenTargetKey();
    if (!targetDocumentKey) {
      openCurrentBoxHome(activeProjectKey);
      return;
    }

    void enterWorkspace(targetDocumentKey, WORKSPACE_MODES.listen, {
      phase: BOX_PHASES.think,
    });
  }

  function openReceiptsSurface() {
    const targetDocumentKey =
      currentSeedDocument?.documentKey ||
      activeDocument?.documentKey ||
      getProjectEntryDocumentKey(activeProject) ||
      "";

    if (!targetDocumentKey) {
      setFeedback("Open a source or seed before reviewing receipts.", "error");
      return;
    }

    void enterWorkspace(targetDocumentKey, WORKSPACE_MODES.assemble, {
      phase: BOX_PHASES.receipts,
    });
  }

  function cancelDeviceSpeech({ incrementRunId = true } = {}) {
    if (incrementRunId) {
      speechRunIdRef.current += 1;
    }

    speechUtteranceRef.current = null;

    if (browserSupportsDeviceVoice()) {
      window.speechSynthesis.cancel();
    }
  }

  function stopPlayback({ keepPlayhead = true } = {}) {
    playbackStateRef.current = {
      active: false,
      kind: null,
      paused: false,
      documentKey: playbackStateRef.current.documentKey || null,
    };
    setIsPlaying(false);
    setLoadingAudio(false);
    setPlaybackStatus("idle");

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    cancelDeviceSpeech();

    if (!keepPlayhead) {
      setPlayheadBlockId(null);
    }
  }

  function pausePlayback() {
    playbackStateRef.current = {
      ...playbackStateRef.current,
      active: false,
      paused: true,
    };
    setIsPlaying(false);
    setLoadingAudio(false);
    setPlaybackStatus("paused");

    if (audioRef.current) {
      audioRef.current.pause();
      return;
    }

    if (speechUtteranceRef.current && browserSupportsDeviceVoice()) {
      window.speechSynthesis.pause();
    }
  }

  function appendLog(action, detail, options = {}) {
    const documentKey = options.documentKey || activeDocumentRef.current?.documentKey || "";
    const entry = createWorkspaceLogEntry({
      time: new Date().toISOString(),
      action,
      detail,
      documentKey,
      blockIds: options.blockIds || [],
    });

    setDocumentLogs((previous) => mergeDocumentLogEntries(previous, documentKey, [entry]));
    return entry;
  }

  function upsertDocument(document, { replaceLogs = false } = {}) {
    const nextLogEntries = replaceLogs
      ? normalizeWorkspaceLogEntries(document.logEntries, document.documentKey)
      : mergeLogs(
          documentLogsRef.current[document.documentKey] || [],
          normalizeWorkspaceLogEntries(document.logEntries, document.documentKey),
        );
    const nextDocument = {
      ...document,
      logEntries: nextLogEntries,
    };

    setDocumentLogs((previous) => ({
      ...previous,
      [document.documentKey]: nextLogEntries,
    }));
    setDocumentCache((previous) => ({
      ...previous,
      [document.documentKey]: nextDocument,
    }));
    setDocumentsState((previous) => mergeDocumentSummary(previous, nextDocument));
  }

  async function fetchLatestDocument(documentKey) {
    const response = await fetch(
      `/api/workspace/document?documentKey=${encodeURIComponent(documentKey)}`,
      { cache: "no-store" },
    );
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.document) {
      throw new Error(payload?.error || "Could not load the latest document.");
    }

    return payload.document;
  }

  function applyWorkspaceMode(nextMode) {
    const normalizedMode = normalizeWorkspaceMode(nextMode, WORKSPACE_MODES.assemble);
    setWorkspaceMode(normalizedMode);

    if (normalizedMode === WORKSPACE_MODES.listen) {
      setAiOpen(false);
      setEditMode(false);
      setBoxPhase(BOX_PHASES.think);
      return normalizedMode;
    }

    setListenPickerOpen(false);
    return normalizedMode;
  }

  function openMode(mode, documentKey = activeDocumentKey, options = {}) {
    if (workspaceMode === WORKSPACE_MODES.listen && currentBlock) {
      void persistListeningSession("paused", {
        documentKey: activeDocument.documentKey,
        block: currentBlock,
      });
    }
    const normalizedMode = applyWorkspaceMode(mode);
    setLaunchpadOpen(false);
    setWorkspacePickerOpen(false);
    setMobileBoxSheetOpen(false);
    setDropAnythingOpen(false);
    setPhotoIntakeOpen(false);
    closeVoiceRecorderRef.current?.();
    setMobileComposeOpen(false);
    pendingFocusBlockIdRef.current = options.focusBlockId || null;
    const nextPhase = normalizeBoxPhase(
      options.phase,
      documentKey === activeDocumentKey
        ? inferBoxPhaseForDocument(activeDocument, boxPhase)
        : boxPhase,
    );
    setBoxPhase(nextPhase);
    if (!isMobileLayout && normalizedMode === WORKSPACE_MODES.assemble) {
      const nextSidecarPanel = getDefaultDesktopSidecarPanel(nextPhase);
      setDesktopSidecarPanel(nextSidecarPanel);
      setAiOpen(nextSidecarPanel === DESKTOP_SIDECAR_PANELS.seven);
    }

    if (!documentKey || documentKey === activeDocumentKey) {
      if (options.focusBlockId) {
        setFocusBlockId(options.focusBlockId);
        setPlayheadBlockId(options.focusBlockId);
      }
      updateUrl(activeDocumentKey, activeProjectKey, { mode: normalizedMode });
      return;
    }

    void loadDocument(documentKey, {
      mode: normalizedMode,
      phase: nextPhase,
      focusBlockId: options.focusBlockId || null,
    });
  }

  async function loadDocument(documentKey, options = {}) {
    if (!documentKey) return;
    const nextMode = normalizeWorkspaceMode(options.mode || workspaceMode, workspaceMode);
    const nextDocumentSummary = documentsState.find((document) => document.documentKey === documentKey);
    const nextPhase = normalizeBoxPhase(
      options.phase,
      inferBoxPhaseForDocument(nextDocumentSummary, boxPhase),
    );
    const nextFocusBlockId = options.focusBlockId || null;

    if (documentKey === activeDocumentKey) {
      setBoxPhase(nextPhase);
      if (!isMobileLayout && nextMode === WORKSPACE_MODES.assemble) {
        const nextSidecarPanel = getDefaultDesktopSidecarPanel(nextPhase);
        setDesktopSidecarPanel(nextSidecarPanel);
        setAiOpen(nextSidecarPanel === DESKTOP_SIDECAR_PANELS.seven);
      }
      if (nextFocusBlockId) {
        setFocusBlockId(nextFocusBlockId);
        setPlayheadBlockId(nextFocusBlockId);
      }
      updateUrl(documentKey, activeProjectKey, { mode: nextMode });
      return;
    }

    if (workspaceMode === WORKSPACE_MODES.listen && currentBlock) {
      void persistListeningSession("paused", {
        documentKey: activeDocument.documentKey,
        block: currentBlock,
      });
    }

    stopPlayback({ keepPlayhead: false });
    setLoadingDocumentKey(documentKey);
    pendingFocusBlockIdRef.current = nextFocusBlockId;

    try {
      if (!documentCache[documentKey]) {
        upsertDocument(await fetchLatestDocument(documentKey), { replaceLogs: true });
      }

      startTransition(() => {
        setActiveDocumentKey(documentKey);
      });
      setBoxPhase(nextPhase);
      if (!isMobileLayout && nextMode === WORKSPACE_MODES.assemble) {
        const nextSidecarPanel = getDefaultDesktopSidecarPanel(nextPhase);
        setDesktopSidecarPanel(nextSidecarPanel);
        setAiOpen(nextSidecarPanel === DESKTOP_SIDECAR_PANELS.seven);
      }
      updateUrl(documentKey, activeProjectKey, { mode: nextMode });
      setFeedback(`Opened ${documentsState.find((document) => document.documentKey === documentKey)?.title || "document"}.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not load the document.", "error");
    } finally {
      setLoadingDocumentKey("");
    }
  }

  attachDocumentToActiveProjectRef.current = attachDocumentToActiveProject;
  applyProjectPayloadRef.current = applyProjectPayload;
  upsertDocumentRef.current = upsertDocument;
  loadDocumentRef.current = loadDocument;

  async function enterWorkspace(documentKey = activeDocumentKey, mode = workspaceMode, options = {}) {
    openMode(mode, documentKey, options);
  }

  function handleSelectBoxPhase(nextPhase, options = {}) {
    const normalizedPhase = normalizeBoxPhase(nextPhase, BOX_PHASES.lane);
    const skipRootGate = Boolean(options?.skipRootGate);

    if (normalizedPhase !== BOX_PHASES.create) {
      setMobileComposeOpen(false);
    }

    if (normalizedPhase === BOX_PHASES.receipts) {
      setAiOpen(false);
      setEditMode(false);
      setBoxPhase(BOX_PHASES.receipts);
      return;
    }

    if (normalizedPhase === BOX_PHASES.operate) {
      setAiOpen(false);
      setEditMode(false);
      setBoxPhase(BOX_PHASES.operate);
      if (!operateResult) {
        void runOperate();
      }
      return;
    }

    if (normalizedPhase === BOX_PHASES.create) {
      if (!skipRootGate && requireRootFor("seed")) {
        return;
      }
      if (!isMobileLayout) {
        setDesktopSidecarPanel(DESKTOP_SIDECAR_PANELS.stage);
      }
      setAiOpen(false);
      if (!currentSeedDocument?.documentKey && realProjectSourceDocuments.length) {
        pendingSeedFocusRef.current = true;
        void ensureSeedForActiveProject({ focus: true });
        return;
      }
      if (
        currentSeedDocument?.documentKey &&
        currentSeedDocument.documentKey !== activeDocumentKey
      ) {
        void loadDocument(currentSeedDocument.documentKey, {
          mode: WORKSPACE_MODES.assemble,
          phase: BOX_PHASES.create,
        });
        return;
      }
    }

    if (normalizedPhase === BOX_PHASES.lane) {
      setAiOpen(false);
      setEditMode(false);
      if (!isMobileLayout) {
        setDesktopSidecarPanel(DESKTOP_SIDECAR_PANELS.details);
      }
      setBoxPhase(BOX_PHASES.lane);
      return;
    }

    if (normalizedPhase !== BOX_PHASES.think) {
      setAiOpen(false);
    }

    if (!isMobileLayout && normalizedPhase === BOX_PHASES.think) {
      setDesktopSidecarPanel(DESKTOP_SIDECAR_PANELS.seven);
      setAiOpen(true);
    }

    setBoxPhase(normalizedPhase);
  }

  async function saveDocument(nextDocument) {
    if (!nextDocument?.isEditable) return;

    const response = await fetch("/api/workspace/document", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentKey: nextDocument.documentKey,
        title: nextDocument.title,
        subtitle: nextDocument.subtitle || "",
        baseUpdatedAt: nextDocument.updatedAt || null,
        blocks: nextDocument.blocks,
        logEntries: getDocumentLogEntries(
          documentLogsRef.current,
          nextDocument.documentKey,
          nextDocument.logEntries,
        ),
      }),
    });
    const payload = await response.json().catch(() => null);

    if (response.status === 409) {
      const error = new Error(payload?.error || "This document changed somewhere else.");
      error.code = payload?.code || "stale_document";
      error.currentDocument = payload?.currentDocument || null;
      throw error;
    }

    if (!response.ok || !payload?.document) {
      throw new Error(payload?.error || "Could not save the document.");
    }

    upsertDocument(payload.document, { replaceLogs: true });
    if (payload.document?.isAssembly || payload.document?.documentType === "assembly") {
      setProjectRerouteContext(activeProjectKey, null);
    }
    return payload.document;
  }

  async function createLinkSource(url) {
    const normalizedUrl = extractSingleUrlText(url);
    if (!normalizedUrl) {
      throw new Error("Paste a valid public link.");
    }

    const response = await fetch("/api/workspace/link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectKey: activeProjectKey,
        url: normalizedUrl,
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.document?.documentKey) {
      throw new Error(payload?.error || "Could not create a source from that link.");
    }

    upsertDocument(payload.document, { replaceLogs: true });
    attachDocumentToActiveProject(payload.document, { role: "SOURCE" });
    setLaunchpadOpen(false);
    await loadDocument(payload.document.documentKey, { phase: BOX_PHASES.think });

    const intakeWarning = getPrimaryDiagnosticMessage(payload.intake);
    setFeedback(
      [
        `Created ${payload.document.title} from link.`,
        intakeWarning || "",
      ]
        .filter(Boolean)
        .join(" "),
      intakeWarning ? "" : "success",
    );

    return payload;
  }

  async function submitUploadedFile(file, { derivationMode = "" } = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectKey", activeProjectKey);
    if (derivationMode) {
      formData.append("derivationMode", derivationMode);
    }

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.document) {
      throw new Error(payload?.error || "The document could not be imported.");
    }

    return payload;
  }

  function stopVoiceRecorderMeter() {
    if (recordingAnimationFrameRef.current) {
      window.cancelAnimationFrame(recordingAnimationFrameRef.current);
      recordingAnimationFrameRef.current = null;
    }
    setVoiceRecorderLevel(0);
  }

  function stopVoiceRecorderTracks() {
    recordingEnabledRef.current = false;

    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (recordingProcessorRef.current) {
      recordingProcessorRef.current.disconnect();
      recordingProcessorRef.current.onaudioprocess = null;
      recordingProcessorRef.current = null;
    }

    if (recordingSilenceRef.current) {
      recordingSilenceRef.current.disconnect();
      recordingSilenceRef.current = null;
    }

    if (recordingAudioContextRef.current) {
      recordingAudioContextRef.current.close().catch(() => {});
      recordingAudioContextRef.current = null;
    }

    recordingAnalyserRef.current = null;
    stopVoiceRecorderMeter();
  }

  function startVoiceRecorderTimer() {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
    }

    recordingTimerRef.current = window.setInterval(() => {
      setVoiceRecorderElapsed((previous) => previous + 1);
    }, 1000);
  }

  function startVoiceRecorderMeter() {
    if (!recordingAnalyserRef.current) {
      setVoiceRecorderLevel(0);
      return;
    }

    try {
      const analyser = recordingAnalyserRef.current;
      const data = new Uint8Array(analyser.fftSize);

      const tick = () => {
        const activeAnalyser = recordingAnalyserRef.current;
        if (!activeAnalyser) return;

        activeAnalyser.getByteTimeDomainData(data);
        const squareSum = data.reduce((sum, value) => {
          const normalized = (value - 128) / 128;
          return sum + normalized * normalized;
        }, 0);
        const rms = Math.sqrt(squareSum / data.length);
        setVoiceRecorderLevel(Math.max(0.08, Math.min(1, rms * 4.5)));
        recordingAnimationFrameRef.current = window.requestAnimationFrame(tick);
      };

      tick();
    } catch {
      setVoiceRecorderLevel(0);
    }
  }

  function openVoiceRecorder() {
    setDropAnythingOpen(false);
    setPhotoIntakeOpen(false);
    setMobileBoxSheetOpen(false);
    setVoiceRecorderOpen(true);
    setVoiceRecorderPhase("idle");
    setVoiceRecorderElapsed(0);
    setVoiceRecorderLevel(0);
    setVoiceRecorderError(
      voiceMemoDraft?.errorMessage ||
        (voiceMemoDraft?.file
          ? "This voice memo is kept on this device until you retry or discard it."
          : ""),
    );
  }

  async function persistVoiceMemoDraft(file, errorMessage = "") {
    const draft = {
      id: ACTIVE_VOICE_MEMO_DRAFT_KEY,
      file,
      errorMessage:
        errorMessage ||
        "This voice memo is kept on this device until you retry or discard it.",
      createdAt: new Date().toISOString(),
    };

    try {
      await saveVoiceMemoDraft(draft);
      setVoiceMemoDraft(draft);
    } catch {
      setVoiceMemoDraft(draft);
    }
  }

  async function clearVoiceMemoDraftState() {
    setVoiceMemoDraft(null);
    try {
      await deleteVoiceMemoDraft(ACTIVE_VOICE_MEMO_DRAFT_KEY);
    } catch {
      // Ignore local cleanup failures.
    }
  }

  async function retryVoiceMemoDraft() {
    if (!voiceMemoDraft?.file || uploading) return;

    setVoiceRecorderOpen(true);
    setVoiceRecorderPhase("transcribing");
    setVoiceRecorderError("");

    const result = await handleUpload(voiceMemoDraft.file, { sourceKind: "voice" });
    if (result?.document?.documentKey) {
      await clearVoiceMemoDraftState();
      setVoiceRecorderOpen(false);
      setVoiceRecorderPhase("idle");
      setVoiceRecorderElapsed(0);
      setVoiceRecorderLevel(0);
      setVoiceRecorderError("");
      return;
    }

    const retryMessage =
      result?.errorMessage ||
      voiceMemoDraft.errorMessage ||
      "Could not turn that voice memo into a source. It is still kept on this device until you retry or discard it.";
    await persistVoiceMemoDraft(voiceMemoDraft.file, retryMessage);
    setVoiceRecorderPhase("idle");
    setVoiceRecorderError(retryMessage);
  }

  function saveVoiceMemoDraftToDisk() {
    if (!voiceMemoDraft?.file) return;
    downloadFile(
      voiceMemoDraft.file.name || "voice-memo.wav",
      voiceMemoDraft.file,
      voiceMemoDraft.file.type || "audio/wav",
    );
    setFeedback("Saved the voice memo to your device.", "success");
  }

  async function discardVoiceMemoDraft() {
    await clearVoiceMemoDraftState();
    setVoiceRecorderError("");
    setVoiceRecorderOpen(false);
    setVoiceRecorderPhase("idle");
    setFeedback("Discarded the preserved voice memo.");
  }

  async function startVoiceRecorder() {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setVoiceRecorderError("Voice recording is not available in this browser.");
      return;
    }

    try {
      setVoiceRecorderError("");
      setVoiceRecorderPhase("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Voice recording is not available in this browser.");
      }

      const audioContext = new AudioContextClass();
      await audioContext.resume().catch(() => {});
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const silence = audioContext.createGain();
      silence.gain.value = 0;

      processor.onaudioprocess = (event) => {
        if (!recordingEnabledRef.current) return;

        const input = event.inputBuffer.getChannelData(0);
        recordingChunksRef.current.push(new Float32Array(input));
      };

      source.connect(analyser);
      source.connect(processor);
      processor.connect(silence);
      silence.connect(audioContext.destination);

      mediaStreamRef.current = stream;
      recordingAudioContextRef.current = audioContext;
      recordingAnalyserRef.current = analyser;
      recordingProcessorRef.current = processor;
      recordingSilenceRef.current = silence;
      recordingChunksRef.current = [];
      recordingSampleRateRef.current = audioContext.sampleRate;
      recordingEnabledRef.current = true;
      setVoiceRecorderElapsed(0);
      setVoiceRecorderLevel(0.08);
      startVoiceRecorderTimer();
      startVoiceRecorderMeter();
      setVoiceRecorderPhase("recording");
    } catch (error) {
      stopVoiceRecorderTracks();
      setVoiceRecorderPhase("idle");
      setVoiceRecorderError(
        error instanceof Error && /notallowed|permission|denied/i.test(error.message)
          ? "Microphone access was denied. No recording was saved. Allow microphone access and try again."
          : error instanceof Error
            ? error.message
            : "Could not start recording. No audio was saved.",
      );
    }
  }

  function pauseVoiceRecorder() {
    if (voiceRecorderPhase !== "recording") {
      return;
    }

    recordingEnabledRef.current = false;
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    stopVoiceRecorderMeter();
    setVoiceRecorderPhase("paused");
  }

  function resumeVoiceRecorder() {
    if (voiceRecorderPhase !== "paused") {
      return;
    }

    recordingEnabledRef.current = true;
    startVoiceRecorderMeter();
    startVoiceRecorderTimer();
    setVoiceRecorderPhase("recording");
  }

  async function stopVoiceRecorder({ discard = false } = {}) {
    if (!mediaStreamRef.current && !recordingChunksRef.current.length) {
      setVoiceRecorderOpen(false);
      setVoiceRecorderPhase("idle");
      return;
    }

    setVoiceRecorderPhase(discard ? "idle" : "finishing");
    recordingEnabledRef.current = false;

    const chunks = recordingChunksRef.current;
    recordingChunksRef.current = [];
    stopVoiceRecorderTracks();

    if (discard) {
      await clearVoiceMemoDraftState();
      setVoiceRecorderOpen(false);
      setVoiceRecorderPhase("idle");
      setVoiceRecorderElapsed(0);
      setVoiceRecorderError("");
      return;
    }

    const merged = mergeRecordingChunks(chunks);
    if (!merged.length) {
      setVoiceRecorderPhase("idle");
      setVoiceRecorderError("The recording was empty. Try again.");
      return;
    }

    const normalized = downsampleRecording(
      merged,
      recordingSampleRateRef.current,
      16000,
    );
    const waveBuffer = encodeMonoWaveFile(normalized.samples, normalized.sampleRate);
    const file = new File(
      [waveBuffer],
      `voice-memo-${new Date().toISOString().replace(/[:.]/g, "-")}.wav`,
      { type: "audio/wav" },
    );

    setVoiceRecorderPhase("transcribing");
    const result = await handleUpload(file, { sourceKind: "voice" });
    if (result?.document?.documentKey) {
      await clearVoiceMemoDraftState();
      setVoiceRecorderOpen(false);
      setVoiceRecorderPhase("idle");
      setVoiceRecorderElapsed(0);
      setVoiceRecorderLevel(0);
      setVoiceRecorderError("");
      return;
    }

    const failureMessage =
      result?.errorMessage ||
      voiceRecorderError ||
      "Could not turn that voice memo into a source. It is still kept on this device until you retry or discard it.";
    await persistVoiceMemoDraft(
      file,
      failureMessage.includes("kept on this device")
        ? failureMessage
        : `${failureMessage} It is still kept on this device until you retry or discard it.`,
    );
    setVoiceRecorderPhase("idle");
    setVoiceRecorderError(
      failureMessage.includes("kept on this device")
        ? failureMessage
        : `${failureMessage} It is still kept on this device until you retry or discard it.`,
    );
  }

  const closeVoiceRecorder = useCallback(() => {
    const resetRecorderState = () => {
      recordingChunksRef.current = [];
      recordingEnabledRef.current = false;

      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (recordingAnimationFrameRef.current) {
        window.cancelAnimationFrame(recordingAnimationFrameRef.current);
        recordingAnimationFrameRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (recordingProcessorRef.current) {
        recordingProcessorRef.current.disconnect();
        recordingProcessorRef.current.onaudioprocess = null;
        recordingProcessorRef.current = null;
      }

      if (recordingSilenceRef.current) {
        recordingSilenceRef.current.disconnect();
        recordingSilenceRef.current = null;
      }

      if (recordingAudioContextRef.current) {
        recordingAudioContextRef.current.close().catch(() => {});
        recordingAudioContextRef.current = null;
      }

      recordingAnalyserRef.current = null;
      setVoiceRecorderOpen(false);
      setVoiceRecorderPhase("idle");
      setVoiceRecorderElapsed(0);
      setVoiceRecorderLevel(0);
      setVoiceRecorderError("");
    };

    resetRecorderState();
  }, []);

  closeVoiceRecorderRef.current = closeVoiceRecorder;

  async function importLinkFromIntake(url) {
    setDropAnythingOpen(false);
    setPhotoIntakeOpen(false);
    setPastePendingMode("source");
    setFeedback("Fetching page from link…");

    try {
      await createLinkSource(url);
    } catch (error) {
      trackWorkspaceEvent("source_import_failed", {
        source_kind: "link",
      });
      setFeedback(
        error instanceof Error
          ? error.message
          : "Could not create a source from that link. Nothing new was added to the box.",
        "error",
      );
    } finally {
      setPastePendingMode("");
    }
  }

  async function writeFirstSeedDraft(text) {
    const normalizedText = String(text || "").trim();
    if (!normalizedText) return;

    pendingSeedFocusRef.current = true;
    setEntryStateOverride("first-time");
    await pasteIntoWorkspace(
      "source",
      {
        html: "",
        text: normalizedText,
        imageDataUrl: "",
        imageMimeType: "",
        imageFilename: "",
      },
      { forceRawText: true },
    );
  }

  async function importFileBatch(files, { bundleName = "" } = {}) {
    const normalizedFiles = Array.from(files || []).filter(Boolean);
    if (!normalizedFiles.length) return;

    const supportedFiles = normalizedFiles.filter((file) => isLaunchSupportedUpload(file));
    const skippedFiles = normalizedFiles.filter((file) => !isLaunchSupportedUpload(file));

    if (!supportedFiles.length) {
      const message = getLaunchUploadBlockedMessage(normalizedFiles[0]);
      trackWorkspaceEvent("source_import_blocked", {
        source_kind: getSourceIntakeKind(normalizedFiles[0]),
        intake_surface: "upload_batch",
      });
      setFeedback(message, "error");
      return;
    }

    if (supportedFiles.length === 1 && !supportedFiles[0]?.webkitRelativePath) {
      await handleUpload(supportedFiles[0]);
      return;
    }

    setUploading(true);
    setFeedback(
      `Importing ${supportedFiles.length} source${supportedFiles.length === 1 ? "" : "s"}…`,
    );

    try {
      const formData = new FormData();
      supportedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("projectKey", activeProjectKey);
      if (bundleName) {
        formData.append("bundleName", bundleName);
      }

      const response = await fetch("/api/workspace/folder", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(payload?.results) || !payload.results.length) {
        throw new Error(payload?.error || "Could not import those sources.");
      }

      payload.results.forEach((result) => {
        if (!result?.document?.documentKey) return;
        upsertDocument(result.document, { replaceLogs: true });
        attachDocumentToActiveProject(result.document, { role: "SOURCE" });
      });

      setLaunchpadOpen(false);

      const firstDocument = payload.results[0]?.document;
      if (firstDocument?.documentKey) {
        await loadDocument(firstDocument.documentKey, { phase: BOX_PHASES.think });
      }

      const skippedCount = Array.isArray(payload?.skipped) ? payload.skipped.length : 0;
      const totalSkippedCount = skippedCount + skippedFiles.length;
      setFeedback(
        `Imported ${payload.results.length} source${payload.results.length === 1 ? "" : "s"}${
          totalSkippedCount
            ? `, skipped ${totalSkippedCount} outside the 1.0 upload set`
            : ""
        }.`,
        "success",
      );
    } catch (error) {
      trackWorkspaceEvent("source_import_failed", {
        source_kind: "batch",
        file_count: supportedFiles.length,
      });
      setFeedback(
        error instanceof Error
          ? error.message
          : "Could not import those sources. Existing box contents stayed unchanged.",
        "error",
      );
    } finally {
      setUploading(false);
      setDropActive(false);
    }
  }

  async function handleUpload(file, options = {}) {
    if (!file) return;

    const imageLike = isImageFileLike(file);
    const audioLike = isAudioFileLike(file);
    const normalizedImageMode = normalizeImageDerivationMode(options.derivationMode);
    const sourceKind = options.sourceKind || "";

    if (sourceKind !== "voice" && !imageLike && !isLaunchSupportedUpload(file)) {
      const message = getLaunchUploadBlockedMessage(file, sourceKind);
      trackWorkspaceEvent("source_import_blocked", {
        source_kind: getSourceIntakeKind(file, sourceKind),
        intake_surface: "upload",
      });
      setFeedback(message, "error");
      return null;
    }

    if (imageLike && !normalizedImageMode) {
      setPendingImageIntake({
        source: "upload",
        file,
        filename: file.name || "image-source",
        mimeType: file.type || "",
        selectedMode: preferredImageDerivationMode,
      });
      setFeedback("Choose how to turn this image into a source.");
      return;
    }

    setUploading(true);
    setFeedback(
      imageLike
        ? `Importing ${file.name} as ${getImageDerivationLabel(normalizedImageMode).toLowerCase()}…`
        : audioLike || sourceKind === "voice"
          ? `Transcribing ${file.name || "voice memo"}…`
          : `Importing ${file.name}…`,
    );

    try {
      const payload = await submitUploadedFile(file, {
        derivationMode: normalizedImageMode,
      });

      upsertDocument(payload.document, { replaceLogs: true });
      attachDocumentToActiveProject(payload.document, { role: "SOURCE" });
      if (!payload?.sourceAsset && !payload?.derivation?.kind) {
        appendLog(
          "UPLOADED",
          `${payload.document.title} (${formatDocumentFormat(
            payload.document.format,
            payload.document.originalFilename,
          )})`,
          {
            documentKey: payload.document.documentKey,
          },
        );
      }
      setLaunchpadOpen(false);
      setPendingImageIntake(null);
      await loadDocument(payload.document.documentKey, { phase: BOX_PHASES.think });
      const intakeWarning = getPrimaryDiagnosticMessage(payload.intake);
      setFeedback(
        intakeWarning
          ? payload?.derivation?.kind === "audio-transcript"
            ? `Created ${payload.document.title} from voice memo. ${intakeWarning}`
            : payload?.sourceAsset || payload?.derivation?.kind
              ? `Created ${payload.document.title} from image. ${intakeWarning}`
              : `Imported ${payload.document.title}. ${intakeWarning}`
          : payload?.derivation?.kind === "audio-transcript"
            ? `Created ${payload.document.title} from voice memo.`
            : payload?.sourceAsset || payload?.derivation?.kind
              ? `Created ${payload.document.title} from image.`
              : `Imported ${payload.document.title}.`,
        intakeWarning ? "" : "success",
      );
      return payload;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "The document could not be imported.";
      trackWorkspaceEvent("source_import_failed", {
        source_kind: getSourceIntakeKind(file, sourceKind),
        intake_surface: sourceKind === "voice" ? "voice" : "upload",
      });
      if (sourceKind === "voice") {
        setVoiceRecorderError(errorMessage);
      }
      setFeedback(
        errorMessage,
        "error",
      );
      return { errorMessage };
    } finally {
      setUploading(false);
    }
  }

  function handleDragEnter(event) {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
    setDropActive(true);
  }

  function handleDragOver(event) {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDropActive(true);
  }

  function handleDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setDropActive(false);
  }

  function handleDrop(event) {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    const bundleName = droppedFiles[0]?.webkitRelativePath
      ? droppedFiles[0].webkitRelativePath.split("/")[0]
      : "";
    void importFileBatch(droppedFiles, { bundleName });
  }

  function buildEditedBlock(block, nextText, updatedAt = new Date().toISOString()) {
    const normalizedText = String(nextText || "").trim();
    return {
      ...block,
      text: normalizedText,
      plainText: stripMarkdownSyntax(normalizedText),
      kind: normalizeWorkspaceBlockKind(block.kind, normalizedText),
      operation: "edited",
      updatedAt,
    };
  }

  async function saveTransformedSourceBlocks(
    nextBlocks,
    { pendingAction, successMessage, logAction, logDetail, nextFocusId = null } = {},
  ) {
    if (!canManageActiveSource) return false;

    const preparedBlocks = (Array.isArray(nextBlocks) ? nextBlocks : [])
      .filter((block) => String(block?.text || "").trim())
      .map((block, index) => ({
        ...block,
        sourcePosition: index,
      }));

    if (!preparedBlocks.length) {
      setFeedback("This would remove every block.", "error");
      return false;
    }

    const normalizedNextBlocks = normalizeWorkspaceBlocks(preparedBlocks, {
      documentKey: activeDocument.documentKey,
      defaultSourceDocumentKey: activeDocument.documentKey,
      defaultIsEditable: true,
    });

    if (currentBlock?.id) {
      stopPlayback();
    }

    const nextDocument = {
      ...activeDocument,
      blocks: normalizedNextBlocks,
      rawMarkdown: buildWorkspaceMarkdown({
        title: activeDocument.title,
        subtitle: activeDocument.subtitle || "",
        blocks: normalizedNextBlocks,
        sectionTitle: activeDocument.isAssembly ? "Seed" : "Document",
      }),
    };

    setCleanupPendingAction(pendingAction || "");
    setBlockSaveStates({});
    setDocumentState(activeDocument.documentKey, {
      status: "saving",
      message: "Saving changes…",
    });
    upsertDocument(nextDocument);
    appendLog(logAction || "EDITED", logDetail || `${activeDocument.title} updated`, {
      documentKey: activeDocument.documentKey,
    });

    try {
      await saveDocument(nextDocument);
      const resolvedFocusId =
        normalizedNextBlocks.find((block) => block.id === focusBlockId)?.id ||
        nextFocusId ||
        normalizedNextBlocks[0]?.id ||
        null;
      setFocusBlockId(resolvedFocusId);
      setPlayheadBlockId(resolvedFocusId);
      setDocumentState(activeDocument.documentKey, {
        status: "saved",
        message: "All changes saved",
      });
      setFeedback(successMessage || "Source updated.", "success");
      return true;
    } catch (error) {
      if (error?.code === "stale_document") {
        trackWorkspaceEvent("document_save_conflict", {
          surface: "cleanup",
        });
        setDocumentState(activeDocument.documentKey, {
          status: "conflict",
          message: "Newer version saved elsewhere",
          serverDocument: error.currentDocument || null,
        });
        setFeedback("A newer version exists. Your cleanup changes are still local. Load latest before saving again.", "error", {
          issue: {
            key: "cleanup-conflict",
            surfaceKey: activeSurfaceKey,
            severity: "recovery",
            priority: 84,
            label: "Revision conflict",
            headline: "A newer version exists on the source.",
            summary: "Your cleanup changes are still local. Load the latest version before saving again so the source stays factual.",
            compactSummary: "Newer version exists · cleanup preserved",
            moveSpace: [
              { key: "conflict-load-latest", label: "Load latest" },
              {
                key: "instrument-interpret",
                label: "Infer with Seven",
                disabled: !sevenContextDocument?.documentKey,
              },
              { key: "instrument-dismiss", label: "Keep local cleanup" },
            ],
            sevenAssist: {
              intent: "conflict-orient",
              surface: activeSurfaceKey,
              context: {
                conflictMessage: "A newer version exists. Your cleanup changes are still local. Load latest before saving again.",
                documentTitle: activeDocument.title,
                documentKey: activeDocument.documentKey,
              },
            },
          },
        });
        return false;
      }

      trackWorkspaceEvent("document_save_failed", {
        surface: "cleanup",
      });
      setDocumentState(activeDocument.documentKey, {
        status: "error",
        message: "Save failed",
      });
      setFeedback(error instanceof Error ? error.message : "Could not save the cleanup.", "error");
      return false;
    } finally {
      setCleanupPendingAction("");
    }
  }

  async function unescapeActiveSource() {
    if (!canManageActiveSource || cleanupPendingAction || polishPending) return;

    let replacements = 0;
    const updatedAt = new Date().toISOString();
    const nextBlocks = blocks.map((block) => {
      const result = unescapeMarkdownEscapes(block.text);
      if (!result.replacements) {
        return block;
      }

      replacements += result.replacements;
      return buildEditedBlock(block, result.text, updatedAt);
    });

    if (!replacements) {
      setFeedback("No escaped markdown found.");
      return;
    }

    await saveTransformedSourceBlocks(nextBlocks, {
      pendingAction: "unescape",
      successMessage: `Removed ${replacements} escaped markdown marker${replacements === 1 ? "" : "s"}.`,
      logAction: "CLEANED",
      logDetail: `${activeDocument.title} — unescaped ${replacements} markdown marker${replacements === 1 ? "" : "s"}`,
    });
  }

  async function replaceAcrossSource() {
    if (!canManageActiveSource || cleanupPendingAction || polishPending) return;

    const query = cleanupFind.trim();
    if (!query) {
      setFeedback("Enter text to find.", "error");
      return;
    }

    let replacements = 0;
    let removedBlocks = 0;
    let changedBlocks = 0;
    const updatedAt = new Date().toISOString();
    const nextBlocks = [];

    blocks.forEach((block) => {
      const blockReplacements = countLiteralOccurrences(block.text, query);
      if (!blockReplacements) {
        nextBlocks.push(block);
        return;
      }

      const nextText = String(block.text || "").split(query).join(cleanupReplace);
      if (nextText === block.text) {
        nextBlocks.push(block);
        return;
      }

      replacements += blockReplacements;
      changedBlocks += 1;
      if (!nextText.trim()) {
        removedBlocks += 1;
        return;
      }

      nextBlocks.push(buildEditedBlock(block, nextText, updatedAt));
    });

    if (!replacements || !changedBlocks) {
      setFeedback("No changes to apply.");
      return;
    }

    await saveTransformedSourceBlocks(nextBlocks, {
      pendingAction: "replace",
      successMessage: `Replaced ${replacements} match${replacements === 1 ? "" : "es"}${removedBlocks ? ` and removed ${removedBlocks} empty block${removedBlocks === 1 ? "" : "s"}` : ""}.`,
      logAction: "REPLACED",
      logDetail: `${activeDocument.title} — replaced ${replacements} match${replacements === 1 ? "" : "es"} for "${query}"`,
    });
  }

  async function deleteMatchingBlocks() {
    if (!canManageActiveSource || cleanupPendingAction || polishPending) return;

    const query = cleanupFind.trim();
    if (!query) {
      setFeedback("Enter text to find.", "error");
      return;
    }

    const matchingBlocks = blocks.filter((block) => String(block.text || "").includes(query));
    if (!matchingBlocks.length) {
      setFeedback("No matching blocks found.");
      return;
    }

    const matchingIds = new Set(matchingBlocks.map((block) => block.id));
    const nextBlocks = blocks.filter((block) => !matchingIds.has(block.id));
    const nextFocusId =
      nextBlocks.find((block) => block.id === focusBlockId)?.id || nextBlocks[0]?.id || null;

    await saveTransformedSourceBlocks(nextBlocks, {
      pendingAction: "deleteMatches",
      nextFocusId,
      successMessage: `Deleted ${matchingBlocks.length} matching block${matchingBlocks.length === 1 ? "" : "s"}.`,
      logAction: "DELETED",
      logDetail: `${activeDocument.title} — deleted ${matchingBlocks.length} block${matchingBlocks.length === 1 ? "" : "s"} matching "${query}"`,
    });
  }

  async function deleteBlock(blockId) {
    if (!canManageActiveSource || cleanupPendingAction || polishPending) return;

    const index = blocks.findIndex((block) => block.id === blockId);
    if (index === -1) return;

    const targetBlock = blocks[index];
    const nextBlocks = blocks.filter((block) => block.id !== blockId);
    const nextFocusId = nextBlocks[index]?.id || nextBlocks[index - 1]?.id || nextBlocks[0]?.id || null;

    await saveTransformedSourceBlocks(nextBlocks, {
      pendingAction: "deleteBlock",
      nextFocusId,
      successMessage: `Deleted block ${targetBlock.sourcePosition + 1}.`,
      logAction: "DELETED",
      logDetail: `${activeDocument.title} — deleted block ${targetBlock.sourcePosition + 1}`,
    });
  }

  function requestDeleteDocument(document) {
    if (!canDeleteDocument(document) || !document?.documentKey) return;

    setDeleteDialogError("");
    setDeleteDialogDocument(document);
  }

  async function performDeleteDocument(document) {
    if (!canDeleteDocument(document) || !document?.documentKey) return;

    const documentKey = document.documentKey;
    const documentTitle = document.title;
    const deletingActiveDocument = activeDocumentKey === documentKey;
    setDeletePendingDocumentKey(documentKey);
    setDeleteDialogError("");
    setDocumentState(documentKey, {
      status: "saving",
      message: "Deleting…",
    });

    try {
      const response = await fetch("/api/workspace/document", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentKey }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not delete the document.");
      }

      const nextDocuments = removeDocumentSummary(documentsState, documentKey);
      const nextProjects = removeDocumentFromProjects(projectsState, documentKey);
      const nextHydratedProjects = hydrateProjectsWithDocuments(nextProjects, nextDocuments);
      const nextProject =
        getProjectByKey(nextHydratedProjects, activeProjectKey) ||
        nextHydratedProjects[0] ||
        null;
      const nextProjectKey = nextProject?.projectKey || activeProjectKey || DEFAULT_PROJECT_KEY;
      const preservedActiveDocument =
        activeDocumentKey !== documentKey &&
        nextDocuments.find((entry) => entry.documentKey === activeDocumentKey)
          ? activeDocumentKey
          : "";
      const nextDocumentKey =
        preservedActiveDocument ||
        getProjectEntryDocumentKey(nextProject) ||
        PRIMARY_WORKSPACE_DOCUMENT_KEY;

      if (deletingActiveDocument) {
        stopPlayback({ keepPlayhead: false });
      }
      setDocumentsState(nextDocuments);
      setProjectsState(nextProjects);
      setDocumentCache((previous) => {
        const next = { ...previous };
        delete next[documentKey];
        return next;
      });
      setDocumentLogs((previous) => {
        const next = { ...previous };
        delete next[documentKey];
        return next;
      });
      setSevenThreads((previous) => {
        if (!(documentKey in previous)) return previous;
        const next = { ...previous };
        delete next[documentKey];
        return next;
      });
      setDocumentStates((previous) => {
        const next = { ...previous };
        delete next[documentKey];
        return next;
      });
      setClipboard((previous) =>
        previous.filter(
          (block) =>
            block.documentKey !== documentKey &&
            block.sourceDocumentKey !== documentKey,
        ),
      );
      setStagedAiBlocks((previous) =>
        previous.filter(
          (block) =>
            block.documentKey !== documentKey &&
            block.sourceDocumentKey !== documentKey,
        ),
      );
      setResumeSessionSummaryState((previous) =>
        previous?.documentKey === documentKey ? null : previous,
      );
      if (deletingActiveDocument) {
        setBlockSaveStates({});
        setCleanupOpen(false);
        setCleanupFind("");
        setCleanupReplace("");
        setCleanupPendingAction("");
        setEditMode(false);
        setAiOpen(false);
        setBoxPhase(BOX_PHASES.think);
        setListenPickerOpen(false);
        setWorkspacePickerOpen(false);
        setDropAnythingOpen(false);
        setMobileComposeOpen(false);
        setMobileSourceToolsOpen(false);
      }

      setActiveProjectKey(nextProjectKey);
      setActiveDocumentKey(nextDocumentKey);
      setLaunchpadView(LAUNCHPAD_VIEWS.box);
      setLaunchpadOpen(true);

      if (typeof window !== "undefined") {
        window.history.replaceState(
          {},
          "",
          buildWorkspaceUrl("", nextProjectKey, {
            launchpad: true,
            launchpadView: LAUNCHPAD_VIEWS.box,
          }),
        );
      }

      setFeedback(`Deleted ${documentTitle}.`, "success");
      setDeleteDialogDocument(null);
    } catch (error) {
      setDocumentState(documentKey, null);
      setDeleteDialogError(
        error instanceof Error ? error.message : "Could not delete the document.",
      );
      setFeedback(error instanceof Error ? error.message : "Could not delete the document.", "error");
    } finally {
      setDeletePendingDocumentKey("");
    }
  }

  async function confirmDeleteDocument() {
    if (!deleteDialogDocument) return;
    await performDeleteDocument(deleteDialogDocument);
  }

  async function deleteActiveDocument() {
    if (!activeDocument) return;
    requestDeleteDocument(activeDocument);
  }

  async function polishActiveSource() {
    if (!canPolishActiveDocument || polishPending) return;

    const sourceTitle = activeDocument.title;
    setPolishPending(true);
    setFeedback(`Cleaning ${sourceTitle}…`);

    try {
      const response = await fetch("/api/workspace/polish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentKey: activeDocument.documentKey,
          projectKey: activeProjectKey,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Could not polish this source.");
      }

      if (result?.unchanged) {
        const polishSummary = summarizePolishChanges(result?.changes);
        setFeedback(
          polishSummary
            ? `No new copy needed. ${polishSummary}.`
            : `No formatting artifacts found in ${sourceTitle}.`,
          "success",
        );
        return;
      }

      if (!result?.document?.documentKey) {
        throw new Error("The polished source could not be created.");
      }

      upsertDocument(result.document, { replaceLogs: true });
      attachDocumentToActiveProject(result.document, { role: "SOURCE" });
      appendLog("POLISHED", `${result.document.title} created from ${sourceTitle}`, {
        documentKey: result.document.documentKey,
      });
      setLaunchpadOpen(false);
      setAiOpen(false);
      setBoxPhase(BOX_PHASES.think);
      await loadDocument(result.document.documentKey, { phase: BOX_PHASES.think });

      const polishSummary = summarizePolishChanges(result?.changes);
      const intakeWarning = getPrimaryDiagnosticMessage(result?.intake);
      setFeedback(
        [
          `Created ${result.document.title}.`,
          polishSummary ? `Cleaned ${polishSummary}.` : "",
          intakeWarning || "",
        ]
          .filter(Boolean)
          .join(" "),
        "success",
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not polish this source.", "error");
    } finally {
      setPolishPending(false);
    }
  }

  async function pasteIntoWorkspace(mode, payload = null, options = {}) {
    if (pastePendingMode) return;

    try {
      const clipboardPayload = payload || (await readClipboardPayloadFromNavigator());
      const urlFromClipboard =
        !clipboardPayload?.imageDataUrl
          ? extractSingleUrlText(clipboardPayload?.text || "")
          : "";
      const resolvedImageMimeType =
        clipboardPayload?.imageMimeType ||
        dataUrlMimeType(clipboardPayload?.imageDataUrl || "");
      const hasImagePayload = Boolean(clipboardPayload?.imageDataUrl);
      const normalizedImageMode = normalizeImageDerivationMode(options.derivationMode);

      if (mode === "source" && urlFromClipboard && !options.forceRawText) {
        setPastePendingMode("source");
        setFeedback("Fetching page from link…");

        try {
          await createLinkSource(urlFromClipboard);
          return;
        } catch (error) {
          trackWorkspaceEvent("source_import_failed", {
            source_kind: "link",
            intake_surface: "paste",
          });
          setPendingLinkIntake({
            url: urlFromClipboard,
            payload: clipboardPayload,
          });
          setFeedback(
            error instanceof Error
              ? `${error.message} You can keep the URL as text instead.`
              : "Could not fetch this link. You can keep the URL as text instead.",
            "error",
          );
          return;
        } finally {
          setPastePendingMode("");
        }
      }

      if (hasImagePayload && !normalizedImageMode) {
        setPendingImageIntake({
          source: "paste",
          payload: clipboardPayload,
          filename: clipboardPayload?.imageFilename || "clipboard-image.png",
          mimeType: resolvedImageMimeType,
          selectedMode: preferredImageDerivationMode,
        });
        setFeedback("Choose how to turn this image into a source.");
        return;
      }

      const requestMode =
        hasImagePayload && normalizedImageMode
          ? `source-image-${normalizedImageMode}`
          : mode;

      setPastePendingMode(mode);
      setFeedback(
        hasImagePayload
          ? `Creating ${getImageDerivationLabel(normalizedImageMode).toLowerCase()} from image…`
          : mode === "source"
            ? "Pasting source…"
            : "Pasting to staging…",
      );

      const response = await fetch("/api/workspace/paste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: activeProjectKey,
          mode: requestMode,
          html: clipboardPayload?.html || "",
          text: clipboardPayload?.text || "",
          imageDataUrl: clipboardPayload?.imageDataUrl || "",
          imageMimeType: resolvedImageMimeType,
          imageFilename: clipboardPayload?.imageFilename || "",
          derivationMode: normalizedImageMode,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Could not paste into the workspace.");
      }

      if (mode === "source" || result?.sourceAsset || result?.derivation?.kind) {
        if (!result?.document?.documentKey) {
          throw new Error("The pasted source could not be created.");
        }

        upsertDocument(result.document, { replaceLogs: true });
        attachDocumentToActiveProject(result.document, { role: "SOURCE" });
        if (!result?.sourceAsset && !result?.derivation?.kind) {
          appendLog("PASTED", `${result.document.title} created from clipboard`, {
            documentKey: result.document.documentKey,
          });
        }
        setLaunchpadOpen(false);
        setAiOpen(false);
        setBoxPhase(BOX_PHASES.think);
        setPendingImageIntake(null);
        setPendingLinkIntake(null);
        await loadDocument(result.document.documentKey, { phase: BOX_PHASES.think });

        const intakeWarning = getPrimaryDiagnosticMessage(result.intake);
        setFeedback(
          intakeWarning
            ? result?.sourceAsset || result?.derivation?.kind
              ? `Created ${result.document.title} from image. ${intakeWarning}`
              : `Pasted ${result.document.title}. ${intakeWarning}`
            : result?.sourceAsset || result?.derivation?.kind
              ? `Created ${result.document.title} from image.`
              : `Pasted ${result.document.title}.`,
          intakeWarning ? "" : "success",
        );
        return;
      }

      if (!result?.sourceDocument?.documentKey || !Array.isArray(result?.blocks)) {
        throw new Error("The clipboard paste did not return readable blocks.");
      }

      const pastedBlocks = normalizeWorkspaceBlocks(result.blocks, {
        documentKey: result.sourceDocument.documentKey,
        defaultSourceDocumentKey: result.sourceDocument.documentKey,
        defaultIsEditable: true,
      });
      upsertDocument(result.sourceDocument, { replaceLogs: true });
      attachDocumentToActiveProject(result.sourceDocument, { role: "SOURCE" });
      appendLog("PASTED", `${result.sourceDocument.title} staged from clipboard`, {
        documentKey: result.sourceDocument.documentKey,
      });
      setClipboard((previous) =>
        mergeClipboard(
          previous,
          pastedBlocks.map((block) =>
            carryBlock(block, {
              carriedBy: "human",
              transferKind: "clipboard",
            }),
          ),
        ),
      );
      setLaunchpadOpen(false);
      setAiOpen(false);
      setBoxPhase(BOX_PHASES.create);
      setPendingLinkIntake(null);

      const intakeWarning = getPrimaryDiagnosticMessage(result.intake);
      const blockLabel = `${pastedBlocks.length} block${pastedBlocks.length === 1 ? "" : "s"}`;
      setFeedback(
        intakeWarning
          ? `Pasted ${blockLabel} to staging. ${intakeWarning}`
          : `Pasted ${blockLabel} to staging.`,
        intakeWarning ? "" : "success",
      );
    } catch (error) {
      trackWorkspaceEvent("source_import_failed", {
        source_kind: mode === "source" ? "paste_source" : "paste_staging",
        intake_surface: "paste",
      });
      setFeedback(
        error instanceof Error ? error.message : "Could not paste into the workspace.",
        "error",
      );
    } finally {
      setPastePendingMode("");
    }
  }

  pasteIntoWorkspaceRef.current = pasteIntoWorkspace;

  function buildNextDocumentFromBlocks(document, nextBlocks) {
    return {
      ...document,
      blocks: nextBlocks,
      rawMarkdown: buildWorkspaceMarkdown({
        title: document.title,
        subtitle: document.subtitle || "",
        blocks: nextBlocks,
        sectionTitle: document.isAssembly ? "Seed" : "Document",
      }),
    };
  }

  function carryBlock(block, { carriedBy = "human", transferKind = "" } = {}) {
    return buildWorkspaceTransferredBlock(block, {
      documents: projectDocumentsByKey,
      projectKey: activeProjectKey,
      carriedBy,
      transferKind,
    });
  }

  function addBlockToClipboard(block) {
    const carriedBlock = carryBlock(block);
    const alreadySelected = clipboard.some((item) => item.id === block.id);
    if (alreadySelected) {
      setClipboard((previous) => mergeClipboard(previous, [carriedBlock]));
      return;
    }

    setClipboard((previous) => mergeClipboard(previous, [carriedBlock]));
    appendLog("SELECTED", `${activeDocument.title} — block ${block.sourcePosition + 1} → staging`, {
      documentKey: activeDocument.documentKey,
      blockIds: [block.id],
    });
  }

  function removeBlockFromClipboard(blockId) {
    setClipboard((previous) => previous.filter((block) => block.id !== blockId));
  }

  function removeClipboardIndex(index) {
    setClipboard((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  async function resetBlockToDraft(block) {
    if (!activeDocument?.isEditable || !block?.id) return;

    const nextBlocks = activeDocument.blocks.map((entry) =>
      entry.id === block.id
        ? {
            ...entry,
            primaryTag: ASSEMBLY_PRIMARY_TAGS.unconfirmed,
            secondaryTag: "",
            domain: "",
            confirmationStatus: ASSEMBLY_CONFIRMATION_STATUSES.unconfirmed,
            resolvedAt: null,
            discardedAt: null,
            updatedAt: new Date().toISOString(),
          }
        : entry,
    );
    const nextDocument = buildNextDocumentFromBlocks(activeDocument, nextBlocks);

    setBlockActionPendingId(block.id);
    upsertDocument(nextDocument);
    appendLog("DRAFT", `${activeDocument.title} — block ${block.sourcePosition + 1} kept as draft`, {
      documentKey: activeDocument.documentKey,
      blockIds: [block.id],
    });

    try {
      await saveDocument(nextDocument);
      setFeedback(`Block ${block.sourcePosition + 1} is back in draft state.`, "success");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not keep this block as draft.", "error");
    } finally {
      setBlockActionPendingId((current) => (current === block.id ? "" : current));
    }
  }

  async function confirmBlockWorkingTag(block, primaryTag = ASSEMBLY_PRIMARY_TAGS.story) {
    if (!block?.id || !activeProjectKey || confirmationPending) return;

    const resolvedPrimaryTag = String(primaryTag || ASSEMBLY_PRIMARY_TAGS.story).trim().toLowerCase();
    const resolvedDomain =
      resolvedPrimaryTag === ASSEMBLY_PRIMARY_TAGS.story
        ? block?.suggestedDomain || block?.domain || "vision"
        : resolvedPrimaryTag === ASSEMBLY_PRIMARY_TAGS.evidence
          ? block?.suggestedDomain || block?.domain || "completion"
          : block?.suggestedDomain || block?.domain || "vision";

    setBlockActionPendingId(block.id);
    setConfirmationPending(true);

    try {
      const response = await fetch("/api/workspace/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: activeProjectKey,
          documentKey: activeDocument.documentKey,
          blockId: block.id,
          action: "confirm",
          primaryTag: resolvedPrimaryTag,
          domain: resolvedDomain,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.document) {
        throw new Error(payload?.error || "Could not confirm this block.");
      }

      upsertDocument(payload.document, { replaceLogs: true });
      setFeedback(
        `Block ${block.sourcePosition + 1} now carries ${resolvedPrimaryTag}.`,
        "success",
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not confirm this block.", "error");
    } finally {
      setConfirmationPending(false);
      setBlockActionPendingId((current) => (current === block.id ? "" : current));
    }
  }

  async function acceptBlockInference(block, sentence) {
    const shapeKey = sentence?.shapeKey || "";
    if (!shapeKey) {
      setFeedback("Seven could not infer a stable shape for this block yet.", "error");
      return;
    }

    await confirmBlockWorkingTag(block, mapFormalShapeToConfirmationTag(shapeKey));
  }

  async function openBlockSourceWitness(block) {
    const targetDocumentKey = String(
      block?.sourceDocumentKey ||
        block?.provenance?.importedFromDocumentKey ||
        block?.documentKey ||
        "",
    ).trim();

    if (!targetDocumentKey) {
      setFeedback("No witness document is attached to this block yet.", "error");
      return;
    }

    await loadDocument(targetDocumentKey, {
      mode: WORKSPACE_MODES.assemble,
      phase: BOX_PHASES.think,
    });
  }

  async function editBlock(blockId, nextText) {
    if (!activeDocument?.isEditable) return;

    const normalizedText = String(nextText || "").trim();
    if (!normalizedText) return;

    const originalBlock = activeDocument.blocks.find((block) => block.id === blockId);
    if (!originalBlock) return;
    if (normalizedText === originalBlock.text.trim()) {
      setBlockSaveStates((previous) => ({
        ...previous,
        [blockId]: "saved",
      }));
      setDocumentState(activeDocument.documentKey, {
        status: "saved",
        message: "All changes saved",
      });
      return;
    }

    if (currentBlock?.id === blockId) {
      stopPlayback();
      setFeedback("Playback stopped because the active block changed.");
    }

    const nextBlocks = activeDocument.blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            text: normalizedText,
            plainText: normalizedText.replace(/^#{1,6}\s+/, ""),
            kind: normalizeWorkspaceBlockKind("", normalizedText),
            operation: "edited",
            updatedAt: new Date().toISOString(),
          }
        : block,
    );
    const nextDocument = buildNextDocumentFromBlocks(activeDocument, nextBlocks);

    setBlockSaveStates((previous) => ({
      ...previous,
      [blockId]: "saving",
    }));
    setDocumentState(activeDocument.documentKey, {
      status: "saving",
      message: "Saving changes…",
    });
    upsertDocument(nextDocument);
    appendLog("EDITED", `${activeDocument.title} — block ${originalBlock.sourcePosition + 1} edited`, {
      documentKey: activeDocument.documentKey,
      blockIds: [blockId],
    });

    try {
      await saveDocument(nextDocument);
      setBlockSaveStates((previous) => ({
        ...previous,
        [blockId]: "saved",
      }));
      setDocumentState(activeDocument.documentKey, {
        status: "saved",
        message: "All changes saved",
      });
      setFeedback(`Saved edit to block ${originalBlock.sourcePosition + 1}.`, "success");
    } catch (error) {
      setBlockSaveStates((previous) => ({
        ...previous,
        [blockId]: error?.code === "stale_document" ? "conflict" : "error",
      }));
      if (error?.code === "stale_document") {
        trackWorkspaceEvent("document_save_conflict", {
          block_id: blockId,
        });
        setDocumentState(activeDocument.documentKey, {
          status: "conflict",
          message: "Newer version saved elsewhere",
          serverDocument: error.currentDocument || null,
        });
        setFeedback("A newer version exists. Your edit is still here locally. Load latest before saving again.", "error", {
          issue: {
            key: "edit-conflict",
            surfaceKey: activeSurfaceKey,
            severity: "recovery",
            priority: 84,
            label: "Revision conflict",
            headline: "A newer version exists on the source.",
            summary: "Your local edit is still here. Load the latest version before saving again so the line stays anchored in reality.",
            compactSummary: "Newer version exists · local edit preserved",
            moveSpace: [
              { key: "conflict-load-latest", label: "Load latest" },
              {
                key: "instrument-interpret",
                label: "Infer with Seven",
                disabled: !sevenContextDocument?.documentKey,
              },
              { key: "instrument-dismiss", label: "Keep local edit" },
            ],
            sevenAssist: {
              intent: "conflict-orient",
              surface: activeSurfaceKey,
              context: {
                conflictMessage: "A newer version exists. Your edit is still here locally. Load latest before saving again.",
                documentTitle: activeDocument.title,
                documentKey: activeDocument.documentKey,
              },
            },
          },
        });
        return;
      }

      trackWorkspaceEvent("document_save_failed", {
        block_id: blockId,
      });
      setDocumentState(activeDocument.documentKey, {
        status: "error",
        message: "Save failed",
      });
      setFeedback(error instanceof Error ? error.message : "Could not save the edit.", "error");
    }
  }

  function focusBlock(blockId) {
    setFocusBlockId(blockId);

    if (!isPlaying) {
      if (audioRef.current && playheadBlockId && playheadBlockId !== blockId) {
        stopPlayback({ keepPlayhead: false });
      }

      setPlayheadBlockId(blockId);
    }

    if (workspaceMode === WORKSPACE_MODES.listen) {
      const block = blocks.find((entry) => entry.id === blockId) || null;
      if (block && playbackStatus !== "active") {
        void persistListeningSession("paused", {
          documentKey: activeDocument.documentKey,
          block,
        });
      }
    }
  }

  async function requestAudioForBlock(block) {
    if (!resolvedVoiceChoice || !playbackAvailable) {
      throw new Error("Voice is unavailable right now. Your place is preserved. Try again in a moment.");
    }

    const response = await fetch("/api/seven/audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: block.plainText || block.text,
        preferredProvider: resolvedVoiceChoice.provider || undefined,
        voiceId:
          resolvedVoiceChoice.provider === "device"
            ? undefined
            : resolvedVoiceChoice.voiceId || undefined,
        rate: rateRef.current,
      }),
    });

    if (!response.ok) {
      let message = "";

      try {
        const payload = await response.clone().json();
        message = payload?.error || payload?.message || "";
      } catch {
        message = await response.text().catch(() => "");
      }

      throw new Error(formatAudioErrorMessage(message));
    }

    return {
      blob: await response.blob(),
      headers: parseSevenAudioHeaders(response.headers),
    };
  }

  async function playCloudSequenceFromIndex(index) {
    const documentAtStart = activeDocumentRef.current;
    const sequence = blocksRef.current;
    const block = sequence[index];

    if (!playbackStateRef.current.active || !block) {
      stopPlayback();
      return;
    }

    setPlayheadBlockId(block.id);
    setFocusBlockId(block.id);
    setLoadingAudio(true);

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      cancelDeviceSpeech({ incrementRunId: false });

      const { blob, headers } = await requestAudioForBlock(block);
      const nextAudioUrl = URL.createObjectURL(blob);
      const audio = new Audio(nextAudioUrl);

      audio.playbackRate = rateRef.current;
      audioRef.current = audio;
      audioUrlRef.current = nextAudioUrl;
      playbackStateRef.current = {
        active: true,
        kind: headers.provider || voiceChoiceRef.current?.provider || null,
        paused: false,
        documentKey: documentAtStart.documentKey,
      };

      audio.addEventListener("ended", () => {
        if (
          !playbackStateRef.current.active ||
          playbackStateRef.current.documentKey !== documentAtStart.documentKey
        ) {
          stopPlayback();
          return;
        }

        const nextIndex = index + 1;
        if (nextIndex >= blocksRef.current.length) {
          void persistListeningSession("idle", {
            documentKey: documentAtStart.documentKey,
            block,
          });
          stopPlayback();
          setFeedback(`Finished ${documentAtStart.title}.`, "success");
          return;
        }

        playSequenceFromIndex(nextIndex);
      });
      audio.addEventListener("pause", () => {
        setIsPlaying(false);
        setPlaybackStatus(playbackStateRef.current.paused ? "paused" : "idle");
      });
      audio.addEventListener("play", () => {
        setIsPlaying(true);
        setPlaybackStatus("active");
      });

      setProviderLabel(
        formatActualProviderLabel(
          headers.provider || voiceChoiceRef.current?.provider,
          headers.voiceId || voiceChoiceRef.current?.voiceId || null,
        ),
      );
      appendLog(
        "LISTENED",
        `${documentAtStart.title} — block ${block.sourcePosition + 1}`,
        {
          documentKey: documentAtStart.documentKey,
          blockIds: [block.id],
        },
      );

      await audio.play();
      setFeedback(`Playing block ${block.sourcePosition + 1}.`);
    } catch (error) {
      trackWorkspaceEvent("playback_failed", {
        provider: voiceChoiceRef.current?.provider || "cloud",
      });
      stopPlayback();
      setFeedback(
        error instanceof Error ? formatAudioErrorMessage(error.message) : "Playback could not start. Your place is preserved. Try again.",
        "error",
      );
    } finally {
      setLoadingAudio(false);
    }
  }

  async function playDeviceSequenceFromIndex(index) {
    const documentAtStart = activeDocumentRef.current;
    const sequence = blocksRef.current;
    const block = sequence[index];

    if (!playbackStateRef.current.active || !block) {
      stopPlayback();
      return;
    }

    if (!browserSupportsDeviceVoice()) {
      throw new Error("Device voice is unavailable in this browser.");
    }

    setPlayheadBlockId(block.id);
    setFocusBlockId(block.id);
    setLoadingAudio(true);

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      const runId = speechRunIdRef.current + 1;
      speechRunIdRef.current = runId;
      cancelDeviceSpeech({ incrementRunId: false });

      const utterance = new SpeechSynthesisUtterance(block.plainText || block.text);
      utterance.rate = rateRef.current;
      speechUtteranceRef.current = utterance;
      playbackStateRef.current = {
        active: true,
        kind: VOICE_PROVIDERS.device,
        paused: false,
        documentKey: documentAtStart.documentKey,
      };

      utterance.onstart = () => {
        if (runId !== speechRunIdRef.current) return;

        setIsPlaying(true);
        setLoadingAudio(false);
        setPlaybackStatus("active");
        setProviderLabel(formatActualProviderLabel(VOICE_PROVIDERS.device));
        appendLog(
          "LISTENED",
          `${documentAtStart.title} — block ${block.sourcePosition + 1}`,
          {
            documentKey: documentAtStart.documentKey,
            blockIds: [block.id],
          },
        );
        setFeedback(`Playing block ${block.sourcePosition + 1}.`);
      };

      utterance.onpause = () => {
        if (runId !== speechRunIdRef.current) return;

        playbackStateRef.current = {
          ...playbackStateRef.current,
          active: false,
          paused: true,
        };
        setIsPlaying(false);
        setPlaybackStatus("paused");
      };

      utterance.onresume = () => {
        if (runId !== speechRunIdRef.current) return;

        playbackStateRef.current = {
          ...playbackStateRef.current,
          active: true,
          paused: false,
        };
        setIsPlaying(true);
        setPlaybackStatus("active");
      };

      utterance.onerror = () => {
        if (runId !== speechRunIdRef.current) return;

        speechUtteranceRef.current = null;
        stopPlayback();
        setFeedback("Playback could not continue. Your place is preserved. Try again.", "error");
      };

      utterance.onend = () => {
        if (runId !== speechRunIdRef.current) return;

        speechUtteranceRef.current = null;

        if (
          !playbackStateRef.current.active ||
          playbackStateRef.current.documentKey !== documentAtStart.documentKey
        ) {
          stopPlayback();
          return;
        }

        const nextIndex = index + 1;
        if (nextIndex >= blocksRef.current.length) {
          void persistListeningSession("idle", {
            documentKey: documentAtStart.documentKey,
            block,
          });
          stopPlayback();
          setFeedback(`Finished ${documentAtStart.title}.`, "success");
          return;
        }

        void playDeviceSequenceFromIndex(nextIndex);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      trackWorkspaceEvent("playback_failed", {
        provider: VOICE_PROVIDERS.device,
      });
      stopPlayback();
      setFeedback(error instanceof Error ? error.message : "Could not start playback.", "error");
    } finally {
      setLoadingAudio(false);
    }
  }

  async function playSequenceFromIndex(index) {
    if (voiceChoiceRef.current?.provider === VOICE_PROVIDERS.device) {
      await playDeviceSequenceFromIndex(index);
      return;
    }

    await playCloudSequenceFromIndex(index);
  }

  async function togglePlayback() {
    if (!blocks.length || !playbackAvailable) {
      setFeedback("Playback is unavailable right now. Your place is preserved. Try another voice or browser.", "error");
      return;
    }

    if (audioRef.current && !audioRef.current.paused) {
      pausePlayback();
      setFeedback("Playback paused.");
      return;
    }

    if (
      audioRef.current &&
      audioRef.current.paused &&
      playbackStateRef.current.documentKey === activeDocument.documentKey
    ) {
      playbackStateRef.current = {
        ...playbackStateRef.current,
        active: true,
        paused: false,
      };
      await audioRef.current.play();
      setIsPlaying(true);
      setFeedback("Playback resumed.");
      return;
    }

    if (
      speechUtteranceRef.current &&
      playbackStateRef.current.kind === VOICE_PROVIDERS.device &&
      playbackStateRef.current.documentKey === activeDocument.documentKey &&
      playbackStateRef.current.paused
    ) {
      playbackStateRef.current = {
        ...playbackStateRef.current,
        active: true,
        paused: false,
      };
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setFeedback("Playback resumed.");
      return;
    }

    if (
      speechUtteranceRef.current &&
      playbackStateRef.current.kind === VOICE_PROVIDERS.device &&
      playbackStateRef.current.documentKey === activeDocument.documentKey &&
      playbackStateRef.current.active
    ) {
      pausePlayback();
      setFeedback("Playback paused.");
      return;
    }

    playbackStateRef.current = {
      active: true,
      kind: voiceChoiceRef.current?.provider || null,
      paused: false,
      documentKey: activeDocument.documentKey,
    };

    const startIndex = Math.max(
      0,
      blocks.findIndex((block) => block.id === (focusBlockId || blocks[0]?.id)),
    );
    await playSequenceFromIndex(startIndex === -1 ? 0 : startIndex);
  }

  function seekAudio(deltaSeconds) {
    if (playbackStateRef.current.kind === VOICE_PROVIDERS.device) {
      setFeedback("Seek is only available during generated audio playback.", "error");
      return;
    }

    if (!audioRef.current) {
      setFeedback("Start playback before seeking.", "error");
      return;
    }

    const nextTime = Math.max(
      0,
      Math.min(audioRef.current.duration || Infinity, audioRef.current.currentTime + deltaSeconds),
    );
    audioRef.current.currentTime = nextTime;
    setFeedback(`Jumped ${deltaSeconds > 0 ? "forward" : "back"} ${Math.abs(deltaSeconds)} seconds.`);
  }

  async function jumpToIndex(index) {
    const clampedIndex = Math.max(0, Math.min(blocks.length - 1, index));
    const block = blocks[clampedIndex];
    if (!block) return;

    setFocusBlockId(block.id);
    setPlayheadBlockId(block.id);

    if (
      isPlaying ||
      playbackStateRef.current.active ||
      playbackStateRef.current.paused ||
      audioRef.current ||
      speechUtteranceRef.current
    ) {
      stopPlayback();
      playbackStateRef.current = {
        active: true,
        kind: voiceChoiceRef.current?.provider || null,
        paused: false,
        documentKey: activeDocument.documentKey,
      };
      await playSequenceFromIndex(clampedIndex);
      return;
    }

    if (workspaceMode === WORKSPACE_MODES.listen) {
      void persistListeningSession("paused", {
        documentKey: activeDocument.documentKey,
        block,
      });
    }

    setFeedback(`Moved to block ${block.sourcePosition + 1}.`);
  }

  function cycleRate() {
    const currentRate = clampListeningRate(rate, 1);
    const rateStepIndex = RATE_STEPS.indexOf(currentRate);
    const nextRate = RATE_STEPS[(rateStepIndex + 1) % RATE_STEPS.length];
    setRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }

    if (speechUtteranceRef.current && playbackStateRef.current.kind === VOICE_PROVIDERS.device) {
      const restartIndex = currentIndex >= 0 ? currentIndex : 0;
      stopPlayback();
      playbackStateRef.current = {
        active: true,
        kind: VOICE_PROVIDERS.device,
        paused: false,
        documentKey: activeDocument.documentKey,
      };
      void playSequenceFromIndex(restartIndex);
    }

    setFeedback(`Playback rate ${nextRate.toFixed(2)}x.`);
  }

  async function runAiOperation(explicitPrompt = "", options = {}) {
    const prompt = String(explicitPrompt || aiInput || "").trim();
    const targetDocument = options?.documentOverride || sevenContextDocument || null;
    if (!prompt || !targetDocument?.documentKey) return null;

    const documentKey = targetDocument.documentKey;
    const sentAt = new Date().toISOString();
    const optimisticUserId = `seven-user-${Date.now()}`;
    const optimisticAssistantId = `seven-assistant-${Date.now()}`;
    const requestContext = buildSevenRequestContext(
      targetDocument,
      targetDocument.documentKey === sevenContextDocument?.documentKey ? sevenContextFocusedBlock : null,
    );
    const surface = String(options?.surface || "").trim() || getSevenSurface({
      boxPhase,
      workspaceMode,
    });
    const openAi = options?.openAi !== false;

    setAiPending(true);
    setAiInput("");
    if (openAi) {
      setAiOpen(true);
    }
    setSevenThreadError("");
    setSevenThreads((previous) => {
      const currentThread =
        previous[documentKey] || buildEmptySevenThread(documentKey);

      return {
        ...previous,
        [documentKey]: {
          ...currentThread,
          documentKey,
          updatedAt: sentAt,
          messages: [
            ...currentThread.messages,
            {
              id: optimisticUserId,
              role: "user",
              content: prompt,
              citations: [],
              createdAt: sentAt,
            },
            {
              id: optimisticAssistantId,
              role: "assistant",
              content: "",
              citations: [],
              createdAt: sentAt,
              pending: true,
            },
          ],
        },
      };
    });
    appendLog("SEVEN_QUESTION", `"${prompt}"`, {
      documentKey,
      blockIds: sevenContextFocusedBlock?.id ? [sevenContextFocusedBlock.id] : [],
    });

    try {
      const response = await fetch("/api/seven", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "question",
          question: prompt,
          surface,
          instrumentIntent: String(options?.instrumentIntent || "").trim(),
          instrumentContext: options?.instrumentContext || null,
          documentKey,
          documentTitle: targetDocument.title,
          documentSubtitle: targetDocument.subtitle || "",
          ...requestContext,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok || !payload?.answer) {
        throw new Error(payload?.error || "Seven couldn't answer right now.");
      }

      const repliedAt = new Date().toISOString();
      setSevenThreads((previous) => {
        const currentThread =
          previous[documentKey] || buildEmptySevenThread(documentKey);
        const nextMessages = currentThread.messages.filter(
          (message) =>
            message.id !== optimisticUserId &&
            message.id !== optimisticAssistantId,
        );

        return {
          ...previous,
          [documentKey]: {
            ...currentThread,
            id: payload.threadId || currentThread.id || "",
            documentKey,
            updatedAt: repliedAt,
            messages: [
              ...nextMessages,
              {
                id: payload.userMessageId || optimisticUserId,
                role: "user",
                content: prompt,
                citations: [],
                createdAt: sentAt,
              },
              {
                id: payload.messageId || `seven-answer-${Date.now()}`,
                role: "assistant",
                content: payload.answer,
                citations: Array.isArray(payload.citations) ? payload.citations : [],
                createdAt: repliedAt,
              },
            ],
          },
        };
      });
      appendLog("SEVEN_ANSWER", `Seven replied in ${targetDocument.title}.`, {
        documentKey,
      });
      setFeedback("Seven replied.", "success");
      return payload;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Seven couldn't answer right now.";
      const failedAt = new Date().toISOString();

      trackWorkspaceEvent("seven_answer_failed", {
        surface: "workspace",
      });
      setSevenThreadError(message);
      setSevenThreads((previous) => {
        const currentThread =
          previous[documentKey] || buildEmptySevenThread(documentKey);
        const nextMessages = currentThread.messages.filter(
          (entry) => entry.id !== optimisticAssistantId,
        );

        return {
          ...previous,
          [documentKey]: {
            ...currentThread,
            updatedAt: failedAt,
            messages: [
              ...nextMessages,
              {
                id: `seven-error-${Date.now()}`,
                role: "assistant",
                content: message,
                citations: [],
                createdAt: failedAt,
                error: true,
              },
            ],
          },
        };
      });
      setFeedback(message, "error");
      return null;
    } finally {
      setAiPending(false);
    }
  }

  function stageSevenMessage(message) {
    const nextBlocks = buildStagedBlocksFromSevenMessage(
      sevenContextDocument,
      message,
      activeProjectKey,
    );
    if (!nextBlocks.length) {
      setFeedback("Seven didn't return anything you can stage.", "error");
      return;
    }

    setStagedAiBlocks((previous) => mergeClipboard(previous, nextBlocks));
    setFeedback("Seven reply added to staging.", "success");
  }

  function acceptStagedBlock(index) {
    const block = stagedAiBlocks[index];
    if (!block) return;
    setClipboard((previous) => mergeClipboard(previous, [carryBlock(block, { carriedBy: "seven" })]));
    setStagedAiBlocks((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  function acceptAllStagedBlocks() {
    setClipboard((previous) =>
      mergeClipboard(
        previous,
        stagedAiBlocks.map((block) => carryBlock(block, { carriedBy: "seven" })),
      ),
    );
    setStagedAiBlocks([]);
  }

  async function assembleClipboard() {
    if (!clipboard.length) {
      setFeedback("Add blocks to staging before shaping the seed.", "error");
      return;
    }

    const fallbackTitle =
      activeBoxTitle || `Seed ${documentsState.filter((document) => document.isAssembly).length + 1}`;
    const title = currentSeedDocument?.title || fallbackTitle;

    try {
      const response = await fetch("/api/workspace/assemble", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          blocks: clipboard,
          createReceipt: true,
          projectKey: activeProjectKey,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.document) {
        throw new Error(payload?.error || "Could not shape the seed.");
      }

      upsertDocument(payload.document, { replaceLogs: true });
      attachDocumentToActiveProject(payload.document, {
        role: "ASSEMBLY",
        setAsCurrentAssembly: true,
      });
      setDocumentsState((previous) =>
        sortDocuments(payload.documents || mergeDocumentSummary(previous, payload.document)),
      );
      clearActiveRerouteContext();
      setClipboard([]);
      setStagedAiBlocks([]);
      setMobileComposeOpen(false);
      if (payload?.draft?.id) {
        upsertProjectDraft(payload.draft);
        appendLog(
          "RECEIPT",
          payload.remoteReceipt
            ? `Drafted receipt for "${payload.document.title}" and pushed it to GetReceipts`
            : `Drafted receipt for "${payload.document.title}" locally`,
          {
            documentKey: payload.document.documentKey,
          },
        );
      }
      await loadDocument(payload.document.documentKey, { phase: BOX_PHASES.create });
      setFeedback(
        payload?.draft?.id
          ? payload.remoteReceipt
            ? `Updated ${payload.document.title}. Receipt draft pushed to GetReceipts.`
            : `Updated ${payload.document.title}. Receipt draft saved locally.`
          : `Updated ${payload.document.title}.`,
        "success",
      );
    } catch (error) {
      trackWorkspaceEvent("assembly_failed", {
        block_count: clipboard.length,
      });
      setFeedback(error instanceof Error ? error.message : "Could not shape the seed.", "error");
    }
  }

  async function runOperate() {
    if (!canRunOperate || operatePending) return;

    setBoxPhase(BOX_PHASES.operate);
    setOperatePending(true);
    setOperateError("");
    setOperateResult((previous) => previous);

    try {
      const response = await fetch("/api/workspace/operate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: activeProjectKey,
          documentKey: activeDocument?.documentKey || "",
          includeAssembly: true,
          includeGuide: false,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.result) {
        throw new Error(payload?.error || "Operate could not read this box.");
      }

      const nextResult = {
        ...payload.result,
        auditDocumentKey: payload.auditDocumentKey || operateAuditDocumentKey,
      };

      setOperateResult(nextResult);
      openCloseMoveDialog(nextResult);
      appendLog(
        "OPERATED",
        `Operate read ${nextResult.boxTitle}: gradient ${nextResult.gradient}, floor ${nextResult.trustFloor}.`,
        {
          documentKey: nextResult.auditDocumentKey || activeDocument?.documentKey || "",
        },
      );
      setFeedback("Operate read the box.", "success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Operate could not read this box. Sources and the seed stayed unchanged.";
      trackWorkspaceEvent("operate_failed", {
        box_key: activeProjectKey,
      });
      setOperateError(message);
      setFeedback(message, "error");
    } finally {
      setOperatePending(false);
    }
  }

  async function askSevenToAuditOperate() {
    if (!operateResult) return;

    const prompt = buildOperateAuditPrompt(operateResult);
    const targetDocumentKey =
      String(
        operateResult.auditDocumentKey ||
          operateAuditDocumentKey ||
          activeDocument?.documentKey ||
          "",
      ).trim();
    if (!targetDocumentKey) {
      setFeedback("Open a source or seed before asking Seven to audit this read.", "error");
      return;
    }
    const targetDocumentSummary = projectDocuments.find(
      (document) => document.documentKey === targetDocumentKey,
    );
    const auditTargetLabel =
      targetDocumentSummary?.isAssembly || targetDocumentSummary?.documentType === "assembly"
        ? "current seed"
        : targetDocumentSummary?.title || "current document";
    const targetMode = targetDocumentSummary?.isAssembly
      ? WORKSPACE_MODES.assemble
      : targetDocumentSummary?.documentType === "assembly"
        ? WORKSPACE_MODES.assemble
        : workspaceMode;

    setFeedback(`Seven is auditing the ${auditTargetLabel}. The Operate read stays unchanged.`);

    if (targetDocumentKey && targetDocumentKey !== activeDocumentKey) {
      setPendingOperateAudit({
        documentKey: targetDocumentKey,
        prompt,
      });
      await loadDocument(targetDocumentKey, {
        mode: targetMode,
        phase: BOX_PHASES.think,
      });
      return;
    }

    setBoxPhase(BOX_PHASES.think);
    setAiOpen(true);
    void runAiOperation(prompt, { surface: "operate" });
  }

  async function createReceiptDraft({
    mode = "workspace",
    operateResult: nextOperateResult = null,
    skipRootGate = false,
    returnDraft = false,
    silentFeedback = false,
  } = {}) {
    if (!skipRootGate && requireRootFor("receipt-draft", { mode, operateResult: nextOperateResult })) {
      return null;
    }

    setReceiptPending(true);

    try {
      const isOperateMode = mode === "operate" && nextOperateResult;
      let receiptDocument = activeDocument || null;

      if (isOperateMode) {
        const targetDocumentKey = String(
          nextOperateResult.auditDocumentKey ||
            operateAuditDocumentKey ||
            activeDocument?.documentKey ||
            "",
        ).trim();

        if (targetDocumentKey && targetDocumentKey !== activeDocument?.documentKey) {
          const cachedDocument = documentCache[targetDocumentKey];
          if (cachedDocument?.documentKey && Array.isArray(cachedDocument.blocks)) {
            receiptDocument = applyDocumentLogState(cachedDocument, documentLogsRef.current);
          } else {
            receiptDocument = await fetchLatestDocument(targetDocumentKey);
            upsertDocument(receiptDocument, { replaceLogs: true });
          }
        }
      }

      if (!receiptDocument?.documentKey) {
        throw new Error("Open a source or seed before drafting a receipt.");
      }

      const receiptLogEntries = receiptDocument.logEntries || [];
      const response = await fetch("/api/workspace/receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document: receiptDocument,
          blocks: receiptDocument.blocks,
          logEntries: receiptLogEntries,
          projectKey: activeProjectKey,
          ...(isOperateMode
            ? {
                mode: "operate",
                operateResult: nextOperateResult,
              }
            : {}),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.draft?.id) {
        throw new Error(payload?.error || "Could not draft the receipt.");
      }

      upsertProjectDraft(payload.draft);
      const receiptLabel = isOperateMode
        ? nextOperateResult.boxTitle || "this box"
        : receiptDocument.title;
      appendLog(
        "RECEIPT",
        payload.remoteReceipt
          ? `Drafted receipt for "${receiptLabel}" and pushed it to GetReceipts`
          : `Drafted receipt for "${receiptLabel}" locally`,
        {
          documentKey: receiptDocument.documentKey,
        },
      );
      if (!silentFeedback) {
        setFeedback(
          payload.remoteReceipt
            ? isOperateMode
              ? "Drafted Operate receipt and pushed it to GetReceipts."
              : "Drafted receipt and pushed it to GetReceipts."
            : isOperateMode
              ? "Drafted Operate receipt locally. It has not been pushed to GetReceipts."
              : "Drafted receipt locally. It has not been pushed to GetReceipts.",
          "success",
        );
      }
      return returnDraft ? payload.draft : payload;
    } catch (error) {
      trackWorkspaceEvent("receipt_draft_failed", {
        draft_scope: mode === "operate" ? "operate" : activeDocument?.documentKey ? "document" : "unknown",
      });
      if (!silentFeedback) {
        setFeedback(error instanceof Error ? error.message : "Could not draft the receipt.", "error");
      }
      return null;
    } finally {
      setReceiptPending(false);
    }
  }

  function exportDocument() {
    const markdown = buildWorkspaceMarkdown({
      title: activeDocument.title,
      subtitle: activeDocument.subtitle || "",
      blocks: activeDocument.blocks,
      sectionTitle: activeDocument.isAssembly ? "Seed" : "Document",
    });
    downloadFile(`${activeDocument.documentKey}.md`, markdown, "text/markdown;charset=utf-8");
    setFeedback(`Exported ${activeDocument.title}.`, "success");
  }

  function exportReceipt() {
    const receiptLogEntries = activeDocument.logEntries || [];
    downloadFile(
      `${activeDocument.documentKey}-receipt.json`,
      JSON.stringify(
        {
          documentKey: activeDocument.documentKey,
          title: activeDocument.title,
          logEntries: receiptLogEntries,
        },
        null,
        2,
      ),
      "application/json;charset=utf-8",
    );
    setFeedback(`Exported receipts for ${activeDocument.title}.`, "success");
  }

  const mobileSourceDocument =
    !launchpadOpen && (isCreatePhase || isOperatePhase || isReceiptsPhase)
      ? currentSeedDocument || activeDocument
      : !launchpadOpen
        ? activeDocument
        : null;
  const showMobileBottomNav =
    isMobileLayout &&
    !isFirstTimeSurface &&
    !(launchpadOpen && launchpadView === LAUNCHPAD_VIEWS.boxes);
  const { shapeKey: activeMobileShape, verb: activeMobileVerb } = launchpadOpen
    ? { shapeKey: "aim", verb: "declare" }
    : getWorkspaceShapeAndVerb({
        boxPhase: isListenMode ? BOX_PHASES.think : boxPhase,
        workspaceMode,
      });
  const desktopIdeCenterContent = isReceiptsPhase ? (
    <ReceiptsScreen>
      <ReceiptSurface
        logEntries={activeDocument.logEntries || []}
        drafts={projectDraftsState}
        receiptSummary={receiptSummaryViewModel}
        receiptPending={receiptPending}
        activeDocumentTitle={currentSeedDocument?.title || activeDocument.title}
        onCreateReceipt={createReceiptDraft}
        onRunOperate={() => void runOperate()}
        onExportReceipt={exportReceipt}
        onExportDocument={exportDocument}
        onOpenGetReceipts={() => openGetReceiptsConnection()}
        onRetryRemoteSync={(draft) => void retryReceiptRemoteSync(draft)}
        onOpenVerifyUrl={(url) => {
          if (url && typeof window !== "undefined") {
            window.open(url, "_blank", "noopener,noreferrer");
          }
        }}
        onSealReceipt={openReceiptSealDialog}
        isMobileLayout={false}
      />
    </ReceiptsScreen>
  ) : (
    <section className="loegos-ide-editor-shell">
      <div className="loegos-ide-editor-shell__intro">
        <div className="loegos-ide-editor-shell__copy">
          <span className="loegos-ide-editor-shell__eyebrow">Editor</span>
          <h2 className="loegos-ide-editor-shell__title">Write the current block stack.</h2>
          <p className="loegos-ide-editor-shell__detail">
            The center stays for authored blocks. Diagnostics, compile state, and seal readiness stay beside it.
          </p>
        </div>
        <div className="loegos-ide-editor-shell__meta">
          <SignalChip tone="neutral" subtle>
            {workspaceIdeState.editorState.activeDocumentTitle}
          </SignalChip>
          {isOperatePhase ? (
            <SignalChip tone="active" subtle>
              Operate diagnostics live on the right
            </SignalChip>
          ) : null}
        </div>
      </div>
      {documentWorkbench}
      {isCreatePhase || clipboard.length || stagedAiBlocks.length ? (
        <ClipboardTray
          embedded
          stagedBlocks={stagedAiBlocks}
          clipboard={clipboard}
          documents={hydratedProjectDocuments}
          onAcceptStagedBlock={acceptStagedBlock}
          onAcceptAllStagedBlocks={acceptAllStagedBlocks}
          onClearStagedBlocks={() => setStagedAiBlocks([])}
          onRemoveClipboardIndex={removeClipboardIndex}
          onReorderClipboard={(index, delta) =>
            setClipboard((previous) => moveListItem(previous, index, delta))
          }
          onClearClipboard={() => setClipboard([])}
          onAssemble={assembleClipboard}
        />
      ) : null}
    </section>
  );
  const desktopIdeDiagnostics = (
    <WorkspaceDiagnosticsRail
      formalState={workspaceIdeState.diagnosticsState.formalBoxState}
      blocks={blocks}
      documents={hydratedProjectDocuments}
      sealCheck={workspaceIdeState.diagnosticsState.formalSealCheck}
      operateResult={workspaceIdeState.diagnosticsState.operateResult}
      operatePending={workspaceIdeState.diagnosticsState.operatePending}
      operateError={workspaceIdeState.diagnosticsState.operateError}
      receiptSummary={receiptSummaryViewModel}
      receiptPending={receiptPending}
      confirmationCount={workspaceIdeState.editorState.confirmationCount}
      clipboardCount={clipboard.length}
      stagedCount={stagedAiBlocks.length}
      thread={activeSevenThread}
      documentTitle={sevenContextDocument?.title || activeDocument.title}
      inputValue={aiInput}
      pendingInput={aiPending}
      inputError={sevenThreadError}
      suggestions={sevenSuggestions}
      onInputChange={(nextValue) => {
        setAiInput(nextValue);
        if (sevenThreadError) {
          setSevenThreadError("");
        }
      }}
      onSubmit={runAiOperation}
      onSuggestion={(prompt) => void runAiOperation(prompt)}
      onStageMessage={stageSevenMessage}
      onRunOperate={() => void runOperate()}
      onOpenReceipts={openReceiptsSurface}
      onDraftReceipt={() =>
        void createReceiptDraft({
          mode: "operate",
          operateResult,
        })
      }
      onSealLatestDraft={openReceiptSealDialog}
    />
  );

  return (
    <main
      className={`assembler-page ${dropActive ? "is-dropping" : ""} ${showMobileBottomNav ? "has-mobile-nav" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        className="terminal-file-input"
        type="file"
        accept={SOURCE_ACCEPT_VALUE}
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          if (!files.length) return;
          void importFileBatch(files, {
            bundleName: files[0]?.webkitRelativePath
              ? files[0].webkitRelativePath.split("/")[0]
              : "",
          });
          event.target.value = "";
        }}
      />
      <input
        ref={photoCameraInputRef}
        className="terminal-file-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleUpload(file);
          }
          event.target.value = "";
        }}
      />
      <input
        ref={photoLibraryInputRef}
        className="terminal-file-input"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleUpload(file);
          }
          event.target.value = "";
        }}
      />

      <div className="assembler-shell">
        <header className="assembler-header assembler-header--minimal">
          <div className="assembler-header__actions">
            {isMobileLayout ? (
              <>
                <button
                  type="button"
                  className={`assembler-header__start ${aiOpen ? "is-active" : ""}`}
                  onClick={() => setAiOpen((value) => !value)}
                  disabled={!sevenContextDocument?.documentKey}
                >
                  Seven
                </button>
                <Link href="/account" className="assembler-header__account" aria-label="Account">
                  <WorkspaceActionIcon kind="account" />
                </Link>
              </>
            ) : (
              <Link href="/account" className="assembler-header__account" aria-label="Account">
                <WorkspaceActionIcon kind="account" />
              </Link>
            )}
          </div>
        </header>

        {launchpadOpen ? (
          <LaunchpadScreen
            toolbar={showDesktopHomeToolbar ? (
              <WorkspaceToolbar
                viewModel={controlSurfaceViewModel}
                instrument={realityInstrumentViewModel}
                activeSidecar={activeDesktopSidecar}
                onSetBoxPhase={handleSelectBoxPhase}
                onOpenBoxes={openBoxesIndex}
                onOpenBoxHome={() => openCurrentBoxHome(activeProjectKey)}
                onOpenIntake={() => setDropAnythingOpen(true)}
                onOpenSpeak={openVoiceRecorder}
                onOpenSeven={openSevenSidecar}
                onOpenStage={openStageSidecar}
                onRunOperate={() => void runOperate()}
                onOpenReceipts={openReceiptsSurface}
                onManageBox={() => openProjectManagement(activeProjectKey)}
                onOpenConfirmation={() => {
                  setConfirmationFocus(null);
                  setConfirmationOpen(true);
                }}
                onOpenRoot={() => openRootEditorFor("voluntary")}
                onInstrumentMove={handleRealityInstrumentMove}
                isMobileLayout={false}
                receiptAttentionTone={receiptPhaseAttentionTone}
              />
            ) : null}
            style={assemblySurfaceStyle}
          >
            <WorkspaceLaunchpad
              launchpadView={launchpadView}
              activeProject={activeProject}
              activeProjectKey={activeProjectKey}
              projects={hydratedProjects}
              documents={hydratedProjectDocuments}
              projectDrafts={projectDraftsState}
              getReceiptsConnectionStatus={getReceiptsConnectionStatus}
              getReceiptsConnectionLastError={getReceiptsConnectionLastError}
              projectActionPending={projectActionPending}
              loadingDocumentKey={loadingDocumentKey}
              getDocumentBlockCountLabel={getDocumentBlockCountLabel}
              getDocumentKindLabel={getDocumentKindLabel}
              onManageProjects={() => openProjectManagement(activeProjectKey)}
              onToggleProjectPinned={toggleProjectPinned}
              onToggleProjectArchived={toggleProjectArchived}
              onOpenReceipts={openReceiptsSurface}
              onOpenDocument={enterWorkspace}
              onOpenProject={openProject}
              onBrowseBoxes={openBoxesIndex}
              onOpenRoot={() => openRootEditorFor("voluntary")}
              onRunContextualAction={handleAssemblyLaneContextualAction}
              onInterpretWordLayer={handleInterpretWordLayer}
              onResumeProject={resumeProject}
              onInspectEvidence={openFocusedConfirmation}
              wordLayerHypotheses={activeWordLayerHypotheses}
              wordLayerHypothesesPending={activeWordLayerHypothesesPending}
              wordLayerHypothesesError={activeWordLayerHypothesesError}
              onOpenIntake={() => {
                if (isMobileLayout) {
                  openWorkspacePicker("add");
                  return;
                }
                setDropAnythingOpen(true);
              }}
              resumeSessionSummary={resumeSessionSummaryState}
            />
          </LaunchpadScreen>
        ) : isFirstTimeSurface ? (
          <section className="assembler-surface assembler-surface--launchpad assembler-surface--first-box">
            <FirstBoxComposer
              boxTitle={activeBoxTitle}
              capturePending={uploading || Boolean(pastePendingMode)}
              writePending={Boolean(pastePendingMode) || uploading || seedStatusPending}
              isMobileLayout={isMobileLayout}
              onUpload={() => {
                pendingSeedFocusRef.current = true;
                fileInputRef.current?.click();
              }}
              onPhoto={() => {
                pendingSeedFocusRef.current = true;
                openPhotoIntake();
              }}
              onPaste={() => {
                pendingSeedFocusRef.current = true;
                void pasteIntoWorkspace("source", null, { forceRawText: true });
              }}
              onLink={() => {
                pendingSeedFocusRef.current = true;
                setDropAnythingOpen(true);
              }}
              onSpeak={() => {
                pendingSeedFocusRef.current = true;
                openVoiceRecorder();
              }}
              onWrite={(text) => void writeFirstSeedDraft(text)}
              onBrowseBoxes={openBoxesIndex}
            />
          </section>
        ) : isListenMode ? (
          <>
            <ListenSurface
              activeDocument={activeDocument}
              activeDocumentWarning={activeDocumentWarning}
              blocks={blocks}
              currentBlockId={currentBlock?.id || null}
              focusedBlockId={focusBlockId}
              nextBlockId={nextBlock?.id || null}
              onFocusBlock={focusBlock}
              onSwitchToAssemble={() =>
                openMode(WORKSPACE_MODES.assemble, activeDocument.documentKey, {
                  phase: BOX_PHASES.create,
                })
              }
              pickerOpen={listenPickerOpen}
              onTogglePicker={() => setListenPickerOpen((value) => !value)}
              onOpenProjectHome={() => openCurrentBoxHome(activeProjectKey)}
              onOpenSeven={() => setAiOpen((value) => !value)}
              onOpenDocument={(documentKey, mode, options = {}) => {
                setListenPickerOpen(false);
                void enterWorkspace(documentKey, mode, options);
              }}
              projectDocuments={projectDocuments}
              loadingDocumentKey={loadingDocumentKey}
              onOpenLog={() => {
                setBoxPhase(BOX_PHASES.receipts);
                openMode(WORKSPACE_MODES.assemble, activeDocument.documentKey, {
                  phase: BOX_PHASES.receipts,
                });
              }}
              instrumentViewModel={documentInstrumentViewModel}
              onExportDocument={exportDocument}
              lastUsedMode={lastUsedMode}
              aiOpen={aiOpen}
              isMobileLayout={isMobileLayout}
              onInstrumentMove={handleRealityInstrumentMove}
            />

            <PlayerBar
              workspaceMode={workspaceMode}
              currentBlock={currentBlock}
              currentIndex={currentIndex}
              totalBlocks={blocks.length}
              isPlaying={isPlaying}
              loadingAudio={loadingAudio}
              playbackAvailable={playbackAvailable}
              rate={rate}
              voiceCatalog={availableVoiceCatalog}
              voiceChoice={resolvedVoiceChoice || availableVoiceCatalog[0] || null}
              providerLabel={providerLabel}
              progress={progress}
              deviceVoiceSupported={deviceVoiceSupported}
              onTogglePlayback={togglePlayback}
              onSeekBack={() => seekAudio(-10)}
              onSeekForward={() => seekAudio(10)}
              onPreviousBlock={() => jumpToIndex(currentIndex - 1)}
              onNextBlock={() => jumpToIndex(currentIndex + 1)}
              onCycleRate={cycleRate}
              onVoiceChange={(choice) => {
                const changed =
                  choice?.provider !== voiceChoiceRef.current?.provider ||
                  String(choice?.voiceId || "") !== String(voiceChoiceRef.current?.voiceId || "");
                if (
                  changed &&
                  (audioRef.current ||
                    speechUtteranceRef.current ||
                    playbackStateRef.current.active ||
                    playbackStateRef.current.paused)
                ) {
                  stopPlayback();
                  setFeedback("Playback stopped so the new voice can take over.");
                }
                setVoiceChoice(choice);
                setProviderLabel(choice?.label || "Voice");
              }}
            />
          </>
        ) : (
          <AssemblyWorkspaceScreen>
            {!isMobileLayout ? (
              <WorkspaceShelf
                open={workspacePickerOpen}
                activeProject={activeProject}
                documents={projectDocuments}
                activeDocumentKey={activeDocumentKey}
                loadingDocumentKey={loadingDocumentKey}
                onOpenProjectHome={() => {
                  setWorkspacePickerOpen(false);
                  openCurrentBoxHome(activeProjectKey);
                }}
                uploading={uploading}
                onOpenDocument={(documentKey, mode, options = {}) => {
                  void enterWorkspace(documentKey, mode, options);
                }}
                onUpload={() => fileInputRef.current?.click()}
                onPasteSource={() => void pasteIntoWorkspace("source")}
                onClose={() => setWorkspacePickerOpen(false)}
                lastUsedMode={lastUsedMode}
              />
            ) : null}

            <div
              className={`assembler-workbench assembler-workbench--next ${isMobileLayout ? "is-mobile" : ""} ${
                (isOperatePhase || isReceiptsPhase) && !showDesktopIde ? "is-takeover" : ""
              }`}
            >
              {!isMobileLayout ? (
                <SourceRail
                  activeProject={activeProject}
                  activeDocumentKey={activeDocumentKey}
                  loadingDocumentKey={loadingDocumentKey}
                  guideDocument={guideSourceDocument}
                  sourceDocuments={visibleSourceDocuments}
                  assemblyDocuments={visibleAssemblyDocuments}
                  buildState={workspaceIdeState.projectTree}
                  onOpenProjectHome={() => openCurrentBoxHome(activeProjectKey)}
                  onOpenReceipts={openReceiptsSurface}
                  onUpload={() => fileInputRef.current?.click()}
                  onOpenPhoto={openPhotoIntake}
                  onPasteSource={() => void pasteIntoWorkspace("source")}
                  onOpenDocument={(documentKey, mode, options = {}) => {
                    void enterWorkspace(documentKey, mode, options);
                  }}
                  uploading={uploading}
                  sourceOpenMode={showDesktopIde ? WORKSPACE_MODES.assemble : WORKSPACE_MODES.listen}
                  ActionIcon={WorkspaceActionIcon}
                  getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                  getDocumentKindLabel={getDocumentKindLabel}
                />
              ) : null}

              <div className="assembler-workbench__main">
                {!isMobileLayout ? (
                  <WorkspaceToolbar
                    viewModel={controlSurfaceViewModel}
                    instrument={realityInstrumentViewModel}
                    activeSidecar={activeDesktopSidecar}
                    onSetBoxPhase={handleSelectBoxPhase}
                    onOpenBoxes={openBoxesIndex}
                    onOpenBoxHome={() => openCurrentBoxHome(activeProjectKey)}
                    onOpenIntake={() => setDropAnythingOpen(true)}
                    onOpenSpeak={openVoiceRecorder}
                    onOpenSeven={openSevenSidecar}
                    onOpenStage={openStageSidecar}
                    onRunOperate={() => void runOperate()}
                    onOpenReceipts={openReceiptsSurface}
                    onManageBox={() => openProjectManagement(activeProjectKey)}
                    onOpenConfirmation={() => {
                      setConfirmationFocus(null);
                      setConfirmationOpen(true);
                    }}
                    onOpenRoot={() => openRootEditorFor("voluntary")}
                    onInstrumentMove={handleRealityInstrumentMove}
                    isMobileLayout={false}
                    receiptAttentionTone={receiptPhaseAttentionTone}
                  />
                ) : null}

                <section
                  className={`assembler-surface assembler-surface--workbench ${
                    (isOperatePhase || isReceiptsPhase) && !showDesktopIde ? "is-takeover" : ""
                  }`}
                  style={assemblySurfaceStyle}
                >
                  {showDesktopIde ? (
                    desktopIdeCenterContent
                  ) : isReceiptsPhase ? (
                    <ReceiptsScreen>
                      <LogView
                        logEntries={activeDocument.logEntries || []}
                        drafts={projectDraftsState}
                        receiptSummary={receiptSummaryViewModel}
                        receiptPending={receiptPending}
                        activeDocumentTitle={currentSeedDocument?.title || activeDocument.title}
                        onCreateReceipt={createReceiptDraft}
                        onRunOperate={() => void runOperate()}
                        onExportReceipt={exportReceipt}
                        onExportDocument={exportDocument}
                        onOpenGetReceipts={() => openGetReceiptsConnection()}
                        onRetryRemoteSync={(draft) => void retryReceiptRemoteSync(draft)}
                        onOpenVerifyUrl={(url) => {
                          if (url && typeof window !== "undefined") {
                            window.open(url, "_blank", "noopener,noreferrer");
                          }
                        }}
                        onSealReceipt={openReceiptSealDialog}
                        isMobileLayout={isMobileLayout}
                      />
                    </ReceiptsScreen>
                  ) : isOperatePhase ? (
                    <OperateScreen>
                      <OperateSurface
                        viewModel={operateViewModel}
                        pending={operatePending}
                        errorMessage={operateError}
                        result={operateResult}
                        receiptPending={receiptPending}
                        onRunOperate={() => void runOperate()}
                        onDraftReceipt={() =>
                          void createReceiptDraft({
                            mode: "operate",
                            operateResult,
                          })
                        }
                        onAskSeven={() => void askSevenToAuditOperate()}
                      />
                    </OperateScreen>
                  ) : isCreatePhase ? (
                    <SeedSurface
                      viewModel={createViewModel}
                      seedViewModel={seedViewModel}
                      activeDocument={activeDocument}
                      currentSeedDocument={currentSeedDocument}
                      suggestion={seedSuggestion}
                      suggestionPending={seedSuggestionPending}
                      onOpenSeed={() => {
                        if (!currentSeedDocument?.documentKey) return;
                        void loadDocument(currentSeedDocument.documentKey, {
                          mode: WORKSPACE_MODES.assemble,
                          phase: BOX_PHASES.create,
                        });
                      }}
                      onOpenStage={openStageSidecar}
                      onRunOperate={() => void runOperate()}
                      onAssemble={() => void assembleClipboard()}
                      onApplySuggestion={() => void applySeedSuggestion()}
                      onEditSuggestion={() => {
                        if (!currentSeedDocument?.documentKey) return;
                        void loadDocument(currentSeedDocument.documentKey, {
                          mode: WORKSPACE_MODES.assemble,
                          phase: BOX_PHASES.create,
                        });
                      }}
                      onDismissSuggestion={dismissSeedSuggestion}
                      onDismissRerouteContext={clearActiveRerouteContext}
                      isMobileLayout={isMobileLayout}
                    >
                      {documentWorkbench}
                    </SeedSurface>
                  ) : isLanePhase ? (
                    <AssemblyLane
                      viewModel={assemblyLaneViewModel}
                      onRunContextualAction={handleAssemblyLaneContextualAction}
                      onInterpretWordLayer={handleInterpretWordLayer}
                      wordLayerHypotheses={activeWordLayerHypotheses}
                      wordLayerHypothesesPending={activeWordLayerHypothesesPending}
                      wordLayerHypothesesError={activeWordLayerHypothesesError}
                      onOpenEntry={(entry) => {
                        if (entry?.actionKind === "root") {
                          openRootEditorFor("voluntary");
                          return;
                        }

                        if (entry?.actionKind === "receipt") {
                          openReceiptsSurface();
                          return;
                        }

                        if (!entry?.documentKey) return;

                        void enterWorkspace(
                          entry.documentKey,
                          WORKSPACE_MODES.assemble,
                          {
                            phase:
                              entry.actionKind === "seed" ? BOX_PHASES.create : BOX_PHASES.think,
                          },
                        );
                      }}
                      onInspectEvidence={(entry) => {
                        openFocusedConfirmation(entry);
                      }}
                    />
                  ) : (
                    <ThinkSurface
                      boxTitle={thinkViewModel.boxTitle}
                      sourceSummary={thinkSourceSummary}
                    >
                      {documentWorkbench}
                    </ThinkSurface>
                  )}
                </section>

              </div>

              {showDesktopIde ? (
                desktopIdeDiagnostics
              ) : !isMobileLayout && (isLanePhase || isThinkPhase || isCreatePhase) ? (
                <DesktopAssemblySidecar
                  activePanel={activeDesktopSidecar}
                  stageCount={desktopStageCount}
                  onSelectPanel={setDesktopSidecar}
                  activeProject={activeProject}
                  activeDocument={activeDocument}
                  currentSeedDocument={currentSeedDocument}
                  activeDocumentAsset={activeDocumentAsset}
                  activeDocumentWarning={activeDocumentWarning}
                  receiptSummary={receiptSummaryViewModel}
                  clipboardCount={clipboard.length}
                  stagedCount={stagedAiBlocks.length}
                  sourceCount={visibleSourceDocuments.length}
                  seedCount={visibleAssemblyDocuments.length}
                  getDocumentKindLabel={getDocumentKindLabel}
                  getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                  sevenContent={
                    <AiUtilityRail
                      open
                      embedded
                      documentTitle={activeDocument.title}
                      thread={activeSevenThread}
                      inputRef={aiInputRef}
                      value={aiInput}
                      pending={aiPending}
                      loading={sevenThreadLoading}
                      errorMessage={sevenThreadError}
                      suggestions={sevenSuggestions}
                      onToggleOpen={() => setDesktopSidecar(DESKTOP_SIDECAR_PANELS.details)}
                      onChange={(nextValue) => {
                        setAiInput(nextValue);
                        if (sevenThreadError) {
                          setSevenThreadError("");
                        }
                      }}
                      onSubmit={runAiOperation}
                      onSuggestion={(prompt) => void runAiOperation(prompt)}
                      onStageMessage={stageSevenMessage}
                    />
                  }
                  stageContent={
                    <ClipboardTray
                      embedded
                      stagedBlocks={stagedAiBlocks}
                      clipboard={clipboard}
                      documents={hydratedProjectDocuments}
                      onAcceptStagedBlock={acceptStagedBlock}
                      onAcceptAllStagedBlocks={acceptAllStagedBlocks}
                      onClearStagedBlocks={() => setStagedAiBlocks([])}
                      onRemoveClipboardIndex={removeClipboardIndex}
                      onReorderClipboard={(index, delta) =>
                        setClipboard((previous) => moveListItem(previous, index, delta))
                      }
                      onClearClipboard={() => setClipboard([])}
                      onAssemble={assembleClipboard}
                    />
                  }
                />
              ) : null}
            </div>

            {isMobileLayout ? (
              <MobileComposeSheet
                open={mobileComposeOpen}
                clipboard={clipboard}
                stagedBlocks={stagedAiBlocks}
                documents={hydratedProjectDocuments}
                onClose={() => setMobileComposeOpen(false)}
                onAcceptStagedBlock={acceptStagedBlock}
                onAcceptAllStagedBlocks={acceptAllStagedBlocks}
                onClearStagedBlocks={() => setStagedAiBlocks([])}
                onRemoveClipboardIndex={removeClipboardIndex}
                onReorderClipboard={(index, delta) =>
                  setClipboard((previous) => moveListItem(previous, index, delta))
                }
                onClearClipboard={() => setClipboard([])}
                onAssemble={assembleClipboard}
              />
            ) : null}

            <PlayerBar
              workspaceMode={workspaceMode}
              currentBlock={currentBlock}
              currentIndex={currentIndex}
              totalBlocks={blocks.length}
              isPlaying={isPlaying}
              loadingAudio={loadingAudio}
              playbackAvailable={playbackAvailable}
              rate={rate}
              voiceCatalog={availableVoiceCatalog}
              voiceChoice={resolvedVoiceChoice || availableVoiceCatalog[0] || null}
              providerLabel={providerLabel}
              progress={progress}
              deviceVoiceSupported={deviceVoiceSupported}
              onTogglePlayback={togglePlayback}
              onSeekBack={() => seekAudio(-10)}
              onSeekForward={() => seekAudio(10)}
              onPreviousBlock={() => jumpToIndex(currentIndex - 1)}
              onNextBlock={() => jumpToIndex(currentIndex + 1)}
              onCycleRate={cycleRate}
              onVoiceChange={(choice) => {
                const changed =
                  choice?.provider !== voiceChoiceRef.current?.provider ||
                  String(choice?.voiceId || "") !== String(voiceChoiceRef.current?.voiceId || "");
                if (
                  changed &&
                  (audioRef.current ||
                    speechUtteranceRef.current ||
                    playbackStateRef.current.active ||
                    playbackStateRef.current.paused)
                ) {
                  stopPlayback();
                  setFeedback("Playback stopped so the new voice can take over.");
                }
                setVoiceChoice(choice);
                setProviderLabel(choice?.label || "Voice");
              }}
            />
          </AssemblyWorkspaceScreen>
        )}

        {showMobileBottomNav ? (
          <MobileBottomNav
            activeShape={activeMobileShape}
            activeVerb={activeMobileVerb}
            onSelectShape={(shapeKey) => {
              const nextPhase = getPrimaryBoxPhaseForShape(shapeKey);
              if (shapeKey === "aim") {
                openCurrentBoxHome(activeProjectKey);
                return;
              }
              if (shapeKey === "reality") {
                openMobileListenSurface();
                return;
              }
              if (shapeKey === "seal") {
                openReceiptsSurface();
                return;
              }
              void handleSelectBoxPhase(nextPhase);
            }}
            onOpenAdd={() => openWorkspacePicker("add")}
          />
        ) : null}

        {isMobileLayout ? (
          <div className={`assembler-sheet assembler-sheet--workspace ${realityInstrumentOpen ? "is-open" : ""}`}>
            {realityInstrumentOpen ? (
              <>
                <div className="assembler-sheet__backdrop" onClick={() => setRealityInstrumentOpen(false)} aria-hidden="true" />
                <div className="assembler-sheet__panel assembler-sheet__panel--workspace assembler-sheet__panel--reality">
                  <RealityInstrument
                    viewModel={realityInstrumentViewModel}
                    variant="panel"
                    onMove={handleRealityInstrumentMove}
                    onClose={() => setRealityInstrumentOpen(false)}
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {isMobileLayout ? (
          <MobileSourceSheet
            open={workspacePickerOpen}
            intent={workspacePickerIntent}
            boxTitle={activeBoxTitle}
            activeDocument={mobileSourceDocument || sevenContextDocument}
            currentSeedDocument={currentSeedDocument}
            documents={hydratedProjectDocuments}
            activeDocumentKey={activeDocumentKey}
            loadingDocumentKey={loadingDocumentKey}
            onOpenDocument={(documentKey, mode, options = {}) => {
              void enterWorkspace(documentKey, mode, options);
            }}
            onUpload={() => fileInputRef.current?.click()}
            onOpenPhoto={openPhotoIntake}
            onPasteSource={() => void pasteIntoWorkspace("source")}
            onOpenSpeak={openVoiceRecorder}
            onImportLink={(url) => {
              void importLinkFromIntake(url);
            }}
            onClose={closeWorkspacePicker}
            uploading={uploading}
            linkPending={Boolean(pastePendingMode)}
          />
        ) : null}

        {isMobileLayout ? (
          <MobileBoxSheet
            open={mobileBoxSheetOpen}
            activeProject={activeProject}
            sourceCount={realProjectSourceDocuments.length}
            hasSeed={Boolean(currentSeedDocument?.documentKey)}
            receiptCount={receiptSummaryViewModel.draftCount}
            onClose={() => setMobileBoxSheetOpen(false)}
            onGoHome={() => openCurrentBoxHome(activeProjectKey)}
            onOpenBoxes={openBoxesIndex}
            onManageBox={() => openProjectManagement(activeProjectKey)}
          />
        ) : null}

        {isMobileLayout && aiOpen ? (
          <AiBar
            inputRef={aiInputRef}
            value={aiInput}
            pending={aiPending}
            loading={sevenThreadLoading}
            errorMessage={sevenThreadError}
            documentTitle={sevenContextDocument?.title || activeDocument.title}
            thread={activeSevenThread}
            suggestions={sevenSuggestions}
            onChange={(nextValue) => {
              setAiInput(nextValue);
              if (sevenThreadError) {
                setSevenThreadError("");
              }
            }}
            onSubmit={runAiOperation}
            onSuggestion={(prompt) => void runAiOperation(prompt)}
            onStageMessage={stageSevenMessage}
            onClose={() => setAiOpen(false)}
          />
        ) : null}

        <ReceiptSealDialog
          open={Boolean(receiptSealDraft?.id)}
          draft={receiptSealDraft}
          deltaStatement={receiptSealDelta}
          onChangeDelta={setReceiptSealDelta}
          audit={receiptSealAudit}
          auditPending={receiptSealAuditPending}
          auditError={receiptSealAuditError}
          pending={receiptPending}
          onRefreshAudit={() => void runReceiptSealAudit()}
          onClose={closeReceiptSealDialog}
          onSeal={() => void sealReceiptDraft()}
        />

        <CloseMoveDialog
          open={closeMoveOpen}
          result={closeMoveResult}
          mode={getCloseMoveMode(closeMoveResult)}
          deltaStatement={closeMoveDelta}
          pending={closeMovePending || receiptPending}
          errorMessage={closeMoveError}
          onChangeDelta={setCloseMoveDelta}
          onClose={closeCloseMoveDialog}
          onPrimaryAction={() => void handleCloseMovePrimaryAction()}
          onSaveDraft={() => void handleCloseMoveSaveDraft()}
        />

        <RootEditor
          open={rootEditorOpen}
          root={rootViewModel}
          stateSummary={controlSurfaceViewModel?.stateSummary}
          confirmationCount={controlSurfaceViewModel?.confirmationCount || 0}
          pending={rootPending}
          entryReason={pendingRootGate?.kind || "voluntary"}
          canAutoSuggest={rootSuggestionReady}
          suggestionContext={rootSuggestionContext}
          onClose={closeRootEditor}
          onSaveRoot={(payload) => void saveRootForProject(activeProjectKey, payload)}
          onInstrumentChange={setRootInstrumentIssue}
          onRunSevenAssist={(payload) =>
            runInstrumentAssist({
              intent: payload?.intent || "root-compress",
              context: payload || {},
              surface: "root",
              openAi: false,
            })
          }
        />

        <ConfirmationQueueDialog
          open={confirmationOpen}
          queue={assemblyLaneViewModel?.confirmationQueue || seedViewModel?.confirmationQueue || []}
          root={seedViewModel?.root}
          focus={confirmationFocus}
          pending={confirmationPending}
          onClose={() => {
            setConfirmationOpen(false);
            setConfirmationFocus(null);
          }}
          onResolve={(payload) => void resolveConfirmationItem(payload)}
        />

        <BoxManagementDialog
          open={boxManagementOpen}
          projects={hydratedProjects}
          selectedProjectKey={selectedManagementProjectKey}
          createTitle={createProjectTitle}
          createRootText={createProjectRootText}
          createRootGloss={createProjectRootGloss}
          renameTitle={renameProjectTitle}
          pendingAction={projectActionPending}
          errorMessage={boxManagementError}
          onClose={() => {
            if (projectActionPending) return;
            setBoxManagementOpen(false);
            setBoxManagementError("");
          }}
          onSelectProject={selectProjectForManagement}
          onCreateTitleChange={setCreateProjectTitle}
          onCreateRootTextChange={setCreateProjectRootText}
          onCreateRootGlossChange={setCreateProjectRootGloss}
          onRenameTitleChange={setRenameProjectTitle}
          onCreate={() => void createProject()}
          onRename={() => void renameProject()}
          onDelete={() => void deleteProject()}
          onOpenProject={() => {
            setBoxManagementOpen(false);
            openProject(selectedManagementProjectKey);
          }}
          onTogglePin={() => {
            const selectedProject =
              hydratedProjects.find((project) => project.projectKey === selectedManagementProjectKey) ||
              null;
            if (!selectedProject) return;
            void toggleProjectPinned(selectedProject, !selectedProject.isPinned);
          }}
          onToggleArchive={() => {
            const selectedProject =
              hydratedProjects.find((project) => project.projectKey === selectedManagementProjectKey) ||
              null;
            if (!selectedProject || selectedProject.isDefaultBox) return;
            void toggleProjectArchived(selectedProject, !selectedProject.isArchived);
          }}
          onCreateUpdatedExampleCopy={() =>
            void runExampleAction(selectedManagementProjectKey, "create-updated-copy")
          }
          onRefreshExample={() =>
            void runExampleAction(selectedManagementProjectKey, "refresh")
          }
          onDismissExampleUpdate={() =>
            void runExampleAction(selectedManagementProjectKey, "dismiss-update")
          }
        />

        <ImageIntakeChooser
          open={Boolean(pendingImageIntake)}
          draft={pendingImageIntake}
          pending={uploading || Boolean(pastePendingMode)}
          preferredMode={preferredImageDerivationMode}
          onClose={() => setPendingImageIntake(null)}
          onChoose={(nextMode) => {
            const normalizedMode = normalizePreferredImageDerivationMode(nextMode);
            setPreferredImageDerivationMode(normalizedMode);

            if (pendingImageIntake?.source === "upload" && pendingImageIntake.file) {
              void handleUpload(pendingImageIntake.file, { derivationMode: normalizedMode });
              return;
            }

            if (pendingImageIntake?.source === "paste" && pendingImageIntake.payload) {
              void pasteIntoWorkspace("source", pendingImageIntake.payload, {
                derivationMode: normalizedMode,
              });
            }
          }}
        />
        <DropAnythingSheet
          open={dropAnythingOpen}
          pending={uploading || Boolean(pastePendingMode)}
          onClose={() => setDropAnythingOpen(false)}
          onUpload={() => {
            setDropAnythingOpen(false);
            fileInputRef.current?.click();
          }}
          onPhoto={() => {
            openPhotoIntake();
          }}
          onPaste={() => {
            setDropAnythingOpen(false);
            void pasteIntoWorkspace("source");
          }}
          onSpeak={() => {
            setDropAnythingOpen(false);
            openVoiceRecorder();
          }}
          onImportLink={(url) => {
            void importLinkFromIntake(url);
          }}
        />
        <PhotoSourceSheet
          open={photoIntakeOpen}
          pending={uploading || Boolean(pastePendingMode)}
          onClose={() => setPhotoIntakeOpen(false)}
          onTakePhoto={choosePhotoCamera}
          onChooseLibrary={choosePhotoLibrary}
        />
        <LinkIntakeChooser
          open={Boolean(pendingLinkIntake)}
          draft={pendingLinkIntake}
          pending={Boolean(pastePendingMode) || uploading}
          onFetchLink={() => {
            const pendingUrl = pendingLinkIntake?.url || "";
            setPendingLinkIntake(null);
            setPastePendingMode("source");
            setFeedback("Fetching page from link…");
            void createLinkSource(pendingUrl)
              .catch((error) => {
                setFeedback(
                  error instanceof Error ? error.message : "Could not create a source from that link.",
                  "error",
                );
              })
              .finally(() => {
                setPastePendingMode("");
              });
          }}
          onPasteRaw={() => {
            const nextPayload = pendingLinkIntake?.payload || null;
            setPendingLinkIntake(null);
            if (nextPayload) {
              void pasteIntoWorkspace("source", nextPayload, { forceRawText: true });
            }
          }}
          onClose={() => setPendingLinkIntake(null)}
        />
        <DeleteDocumentDialog
          open={Boolean(deleteDialogDocument)}
          document={deleteDialogDocument}
          pending={
            Boolean(deletePendingDocumentKey) &&
            deletePendingDocumentKey === deleteDialogDocument?.documentKey
          }
          errorMessage={deleteDialogError}
          onConfirm={() => void confirmDeleteDocument()}
          onClose={() => {
            if (deletePendingDocumentKey) return;
            setDeleteDialogError("");
            setDeleteDialogDocument(null);
          }}
        />
        <VoiceRecorderDialog
          open={voiceRecorderOpen}
          phase={voiceRecorderPhase}
          elapsedSeconds={voiceRecorderElapsed}
          level={voiceRecorderLevel}
          errorMessage={voiceRecorderError}
          hasSavedDraft={Boolean(voiceMemoDraft?.file || voiceMemoDraft?.blob || voiceMemoDraft?.id)}
          draftFilename={voiceMemoDraft?.file?.name || voiceMemoDraft?.filename || ""}
          instrumentViewModel={voiceInstrumentViewModel}
          onClose={closeVoiceRecorder}
          onStart={() => void startVoiceRecorder()}
          onPause={pauseVoiceRecorder}
          onResume={resumeVoiceRecorder}
          onStop={() => void stopVoiceRecorder()}
          onRetryDraft={() => void retryVoiceMemoDraft()}
          onSaveDraft={saveVoiceMemoDraftToDisk}
          onDiscardDraft={() => void discardVoiceMemoDraft()}
          onInstrumentMove={handleRealityInstrumentMove}
        />
      </div>
      {dropActive ? (
        <div className="assembler-drop-overlay" aria-hidden="true">
          <div className="assembler-drop-overlay__panel">
            <strong>Drop supported source</strong>
          </div>
        </div>
      ) : null}
    </main>
  );
}
