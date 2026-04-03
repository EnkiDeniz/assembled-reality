"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownRenderer from "./MarkdownRenderer";
import ReaderListenTray from "./ReaderListenTray";
import ReaderMarksPanel from "./ReaderMarksPanel";
import SelectionMenu from "./SelectionMenu";
import SevenPanel from "./SevenPanel";
import {
  addHighlight,
  addNote,
  deleteBookmark,
  deleteHighlight,
  deleteNote,
  getRenderableMarksByBlock,
  hasSectionBookmark,
  toggleSectionBookmark,
  updateNote,
} from "../lib/annotations";
import {
  buildSevenFallbackMessage,
  getSevenProviderLabel,
  parseSevenAudioHeaders,
  splitTextForSpeech,
} from "../lib/seven";
import {
  getBlockIndex,
  getFirstSectionBlock,
  getNextBlock,
  getSectionBlocks,
  sortReaderBlocks,
} from "../lib/reader-player";
import { EMPTY_READER_ANNOTATIONS } from "../lib/reader-store";
import { clearBrowserSelection, getSelectionAnchor } from "../lib/selection";
import {
  buildPlaybackNodes,
  buildScopedPlaybackQueue,
  clampListeningRate,
  createEphemeralPlaybackNode,
  estimateListeningDurationMs,
  findQueuePositionByElapsedMs,
  formatVoiceLabel,
  getPlaybackNode,
  getPlaybackNodeIndex,
  getQueueDurationMs,
  getQueueElapsedMs,
  getSectionHeadingNodeId,
  getVoiceCatalog,
  LISTENING_STATUSES,
  normalizePlaybackScope,
  resolvePreferredVoiceChoice,
  VOICE_PROVIDERS,
} from "../lib/listening";

const TEXT_SIZE_LABELS = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const PAGE_WIDTH_LABELS = {
  standard: "Standard",
  wide: "Wide",
};

const THEME_LABELS = {
  dark: "Dark",
  light: "Light",
};

const URL_SYNC_OVERLAYS = new Set([
  "contents",
  "notebook",
  "seven",
  "more",
  "listen",
]);

function getSyncedOverlayFromUrl() {
  if (typeof window === "undefined") return null;

  const panel = new URLSearchParams(window.location.search).get("panel");
  if (panel === "appearance") return "more";
  return URL_SYNC_OVERLAYS.has(panel) ? panel : null;
}

function syncReaderUrl({ panel = null, hash = undefined, historyMode = "replace" } = {}) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (panel && URL_SYNC_OVERLAYS.has(panel)) {
    url.searchParams.set("panel", panel);
  } else {
    url.searchParams.delete("panel");
  }

  if (typeof hash === "string") {
    url.hash = hash ? `#${hash}` : "";
  }

  const method = historyMode === "push" ? "pushState" : "replaceState";
  window.history[method](window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function createIdleRuntimeAudioState(preferredVoiceProvider, voiceId = null) {
  return {
    status: "idle",
    label: "",
    index: 0,
    total: 0,
    mode: preferredVoiceProvider ? "provider" : "device",
    sourceType: null,
    sourceId: null,
    provider: preferredVoiceProvider || "device",
    voiceId: voiceId || null,
  };
}

function initialVoiceStatus({ voiceEnabled, browserSpeechEnabled, preferredVoiceProvider }) {
  if (voiceEnabled) {
    return {
      state: "ready",
      provider: preferredVoiceProvider,
      fallbackFrom: null,
      reasonCode: "",
      message: "Voice is ready.",
    };
  }

  if (browserSpeechEnabled) {
    return {
      state: "device",
      provider: "device",
      fallbackFrom: null,
      reasonCode: "",
      message: "Voice is ready.",
    };
  }

  return {
    state: "offline",
    provider: preferredVoiceProvider,
    fallbackFrom: null,
    reasonCode: "provider_unavailable",
    message: "Voice is unavailable right now.",
  };
}

function buildAudioProgressText(audioState) {
  if (audioState.status === "loading") {
    return audioState.mode === "device"
      ? `${audioState.label}... starting your device voice.`
      : `${audioState.label}... preparing part ${audioState.index} of ${audioState.total}.`;
  }

  if (audioState.status === "playing") {
    return audioState.mode === "device"
      ? `${audioState.label}... speaking through your device voice, part ${audioState.index} of ${audioState.total}.`
      : `${audioState.label}... playing part ${audioState.index} of ${audioState.total}.`;
  }

  if (audioState.status === "paused") {
    return `${audioState.label} paused.`;
  }

  return "";
}

function createSevenApiError(payload, fallbackMessage) {
  const error = new Error(payload?.error || fallbackMessage);
  error.provider = payload?.provider || null;
  error.reasonCode = payload?.reasonCode || "";
  error.retryAfterSeconds = payload?.retryAfterSeconds || null;
  error.fallbackFrom = payload?.fallbackFrom || null;
  error.fallbackReasonCode = payload?.fallbackReasonCode || "";
  return error;
}

function getSectionEntry(entries, slug) {
  return entries.find((entry) => entry.slug === slug) || entries[0];
}

function getScrollBehavior() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return prefersReducedMotion ? "auto" : "smooth";
}

function scrollReaderTarget(target, { behavior = "smooth", block = "start" } = {}) {
  if (typeof window === "undefined" || !target) return;

  if (block === "center") {
    target.scrollIntoView({ behavior, block: "center" });
    return;
  }

  const topbar = document.querySelector(".reader-player-topbar");
  const topbarHeight = topbar instanceof HTMLElement ? topbar.getBoundingClientRect().height : 0;
  const top =
    target.getBoundingClientRect().top +
    window.scrollY -
    topbarHeight -
    28;

  window.scrollTo({
    top: Math.max(0, top),
    behavior,
  });
}

function BookmarkIcon({ filled }) {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M6 3.75h8a1.25 1.25 0 0 1 1.25 1.25v11.4l-5.25-3.2-5.25 3.2V5A1.25 1.25 0 0 1 6 3.75Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NotebookIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4.75 4.25h9.5A1.75 1.75 0 0 1 16 6v8a1.75 1.75 0 0 1-1.75 1.75h-9.5A1.75 1.75 0 0 1 3 14V6a1.75 1.75 0 0 1 1.75-1.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.8 7.25h5.9M6.8 10h5.9M6.8 12.75h3.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ContentsIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4.75 5.75h10.5M4.75 10h10.5M4.75 14.25h10.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SevenIcon() {
  return (
    <span className="reader-seven-icon" aria-hidden="true">
      7
    </span>
  );
}

function MoreIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="5" cy="10" r="1.3" fill="currentColor" />
      <circle cx="10" cy="10" r="1.3" fill="currentColor" />
      <circle cx="15" cy="10" r="1.3" fill="currentColor" />
    </svg>
  );
}

function ListenIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M6.1 13.7c1.05-1.02 1.58-2.25 1.58-3.7 0-1.45-.53-2.68-1.58-3.7M9.35 15.7c1.63-1.54 2.45-3.44 2.45-5.7 0-2.26-.82-4.16-2.45-5.7M12.7 17.45c2.1-2.05 3.15-4.53 3.15-7.45s-1.05-5.4-3.15-7.45"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

function normalizeSevenView(view) {
  if (view === "evidence" || view === "receipt") return view;
  return "guide";
}

export default function ReaderShell({
  documentData,
  preferences,
  setPreferences,
  initialReaderAnnotations = EMPTY_READER_ANNOTATIONS,
  initialReadingProgress = null,
  initialConversationThread = null,
  initialEvidenceSet = null,
  initialListeningSession = null,
  initialVoicePreferences = null,
  voiceCatalog = [],
  getReceiptsConnection: _getReceiptsConnection = null,
  sevenTextEnabled = false,
  sevenVoiceEnabled = false,
  sevenTextProvider = null,
  sevenVoiceProvider = null,
}) {
  const router = useRouter();
  const initialVoiceChoice = resolvePreferredVoiceChoice(
    Array.isArray(voiceCatalog) && voiceCatalog.length
      ? voiceCatalog
      : getVoiceCatalog({ includeDevice: true }),
    initialVoicePreferences?.preferredVoiceProvider ||
      initialListeningSession?.provider ||
      sevenVoiceProvider,
    initialVoicePreferences?.preferredVoiceId || initialListeningSession?.voiceId,
  );
  const initialHash =
    typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
  const initialSectionSlug = initialHash || initialReadingProgress?.sectionSlug || "beginning";

  const [activeOverlay, setActiveOverlay] = useState(() => getSyncedOverlayFromUrl());
  const [viewportSectionSlug, setViewportSectionSlug] = useState(initialSectionSlug);
  const [viewportBlockId, setViewportBlockId] = useState(null);
  const [playerCursor, setPlayerCursor] = useState({
    sectionSlug: initialSectionSlug,
    blockId: null,
    blockIndex: -1,
  });
  const [playerState, setPlayerState] = useState(() => ({
    status: initialListeningSession ? "paused" : "idle",
    sourceType: normalizePlaybackScope(initialListeningSession?.mode || "flow"),
    providerMode: initialVoiceChoice.provider === VOICE_PROVIDERS.device ? "device" : "provider",
    queue: [],
    currentIndex: -1,
  }));
  const [runtimeAudioState, setRuntimeAudioState] = useState(() =>
    createIdleRuntimeAudioState(
      initialVoiceChoice.provider === VOICE_PROVIDERS.device ? null : initialVoiceChoice.provider,
      initialVoiceChoice.voiceId,
    ),
  );
  const [browserSpeechEnabled, setBrowserSpeechEnabled] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(() =>
    initialVoiceStatus({
      voiceEnabled: sevenVoiceEnabled || initialVoiceChoice.provider !== VOICE_PROVIDERS.device,
      browserSpeechEnabled: false,
      preferredVoiceProvider: initialVoiceChoice.provider || sevenVoiceProvider,
    }),
  );
  const [audioError, setAudioError] = useState("");
  const [audioTimeState, setAudioTimeState] = useState({
    elapsed: 0,
    duration: 0,
    chunkElapsed: 0,
    chunkDuration: 0,
  });
  const [playbackSpeed, setPlaybackSpeed] = useState(() =>
    clampListeningRate(
      initialVoicePreferences?.preferredListeningRate || initialListeningSession?.rate || 1,
      1,
    ),
  );
  const playbackSpeedRef = useRef(1);
  const [progress, setProgress] = useState(
    typeof initialReadingProgress?.progressPercent === "number"
      ? initialReadingProgress.progressPercent / 100
      : 0,
  );
  const [readerAnnotations, setReaderAnnotations] = useState(
    () => initialReaderAnnotations || EMPTY_READER_ANNOTATIONS,
  );
  const [selectionState, setSelectionState] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [selectionNotice, setSelectionNotice] = useState("");
  const [receiptNotice, setReceiptNotice] = useState("");
  const [evidenceItems, setEvidenceItems] = useState(() => initialEvidenceSet?.items || []);
  const [sevenView, setSevenView] = useState("guide");
  const [listenTrayCollapsed, setListenTrayCollapsed] = useState(() =>
    Boolean(initialListeningSession),
  );
  const [listenSheet, setListenSheet] = useState(null);
  const [savedListeningSession, setSavedListeningSession] = useState(
    () => initialListeningSession,
  );
  const [selectedVoice, setSelectedVoice] = useState(() => initialVoiceChoice);
  const [activeMarkId, setActiveMarkId] = useState(null);
  const [focusedSectionSlug, setFocusedSectionSlug] = useState(null);
  const [notebookScope, setNotebookScope] = useState("section");
  const [registeredBlocks, setRegisteredBlocks] = useState([]);

  const scrollIntentRef = useRef(false);
  const noticeTimeoutRef = useRef(null);
  const focusTimeoutRef = useRef(null);
  const hasHydratedMarksRef = useRef(false);
  const hasHydratedProgressRef = useRef(false);
  const surfaceTriggerRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const audioSessionRef = useRef(0);
  const documentRunRef = useRef(0);
  const lastAutoscrollBlockRef = useRef(null);
  const chunkDurationsRef = useRef([]);
  const currentNodeOffsetMsRef = useRef(initialListeningSession?.nodeOffsetMs || 0);
  const nodeDurationsRef = useRef({});
  const deviceTickerRef = useRef(null);
  const currentNodeStartedAtRef = useRef(0);
  const initialListeningHydratedRef = useRef(false);
  const canonicalSessionRef = useRef(null);
  const prefetchedAudioRef = useRef(new Map());

  const entries = useMemo(
    () => [
      { slug: "beginning", label: "Beginning", title: "Beginning", number: null },
      ...documentData.sections.map((section) => ({
        slug: section.slug,
        label:
          documentData.sourceType === "upload" || !section.number
            ? section.title
            : `${section.number} · ${section.title}`,
        title: section.title,
        number: documentData.sourceType === "upload" ? null : section.number,
      })),
    ],
    [documentData.sections, documentData.sourceType],
  );

  const blocks = useMemo(() => sortReaderBlocks(registeredBlocks), [registeredBlocks]);
  const blocksBySection = useMemo(
    () =>
      entries.reduce((accumulator, entry) => {
        accumulator[entry.slug] = getSectionBlocks(blocks, entry.slug);
        return accumulator;
      }, {}),
    [blocks, entries],
  );
  const playbackNodes = useMemo(
    () => buildPlaybackNodes({ documentData, entries, blocks }),
    [blocks, documentData, entries],
  );
  const availableVoiceOptions = useMemo(
    () =>
      (Array.isArray(voiceCatalog) ? voiceCatalog : [])
        .filter((option) => option.provider !== VOICE_PROVIDERS.device || browserSpeechEnabled)
        .map((option) => ({
          ...option,
          active:
            option.provider === selectedVoice.provider &&
            (option.voiceId || null) === (selectedVoice.voiceId || null),
          providerLabel: getSevenProviderLabel(option.provider),
        })),
    [browserSpeechEnabled, selectedVoice.provider, selectedVoice.voiceId, voiceCatalog],
  );

  const currentEntry = getSectionEntry(entries, viewportSectionSlug);
  const currentIndex = Math.max(
    0,
    entries.findIndex((entry) => entry.slug === viewportSectionSlug),
  );
  const previousEntry = currentIndex > 0 ? entries[currentIndex - 1] : null;
  const nextEntry = currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null;
  const progressPercent = Math.round(progress * 100);
  const currentLabel = currentEntry.number
    ? `${currentEntry.number} · ${currentEntry.title}`
    : currentEntry.title;
  const currentBookmarked = hasSectionBookmark(readerAnnotations, currentEntry.slug);
  const contentsOpen = activeOverlay === "contents";
  const notebookOpen = activeOverlay === "notebook";
  const sevenOpen = activeOverlay === "seven";
  const toolsOpen = activeOverlay === "more";
  const listenOpen = activeOverlay === "listen";
  const hasOpenOverlay = Boolean(activeOverlay);
  const hasTrailingPanel = notebookOpen || sevenOpen;
  const effectiveVoiceEnabled =
    selectedVoice.provider === VOICE_PROVIDERS.device
      ? browserSpeechEnabled
      : sevenVoiceEnabled || browserSpeechEnabled;

  const sortedBookmarks = useMemo(
    () =>
      readerAnnotations.bookmarks.toSorted(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
      ),
    [readerAnnotations.bookmarks],
  );
  const sortedHighlights = useMemo(
    () =>
      readerAnnotations.highlights.toSorted(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
      ),
    [readerAnnotations.highlights],
  );
  const sortedNotes = useMemo(
    () =>
      readerAnnotations.notes.toSorted(
        (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
      ),
    [readerAnnotations.notes],
  );
  const marksByBlock = useMemo(
    () => getRenderableMarksByBlock(readerAnnotations),
    [readerAnnotations],
  );
  const evidenceMarkIds = useMemo(
    () => evidenceItems.map((item) => item.sourceMarkId).filter(Boolean),
    [evidenceItems],
  );

  const matchesNotebookScope = useCallback(
    (mark) => notebookScope === "all" || mark.sectionSlug === viewportSectionSlug,
    [notebookScope, viewportSectionSlug],
  );

  const visibleBookmarks = useMemo(
    () => sortedBookmarks.filter(matchesNotebookScope),
    [matchesNotebookScope, sortedBookmarks],
  );
  const visibleHighlights = useMemo(
    () => sortedHighlights.filter(matchesNotebookScope),
    [matchesNotebookScope, sortedHighlights],
  );
  const visibleNotes = useMemo(
    () => sortedNotes.filter(matchesNotebookScope),
    [matchesNotebookScope, sortedNotes],
  );

  const flowTransportActive =
    runtimeAudioState.sourceType === "flow" &&
    (playerState.status === "loading" ||
      playerState.status === "playing" ||
      playerState.status === "paused");
  const sectionTransportActive =
    runtimeAudioState.sourceType === "section" &&
    (playerState.status === "loading" ||
      playerState.status === "playing" ||
      playerState.status === "paused");
  const selectionTransportActive =
    runtimeAudioState.sourceType === "selection" &&
    (playerState.status === "loading" ||
      playerState.status === "playing" ||
      playerState.status === "paused");
  const listeningTransportActive =
    flowTransportActive || sectionTransportActive || selectionTransportActive;
  const listeningPlaying =
    listeningTransportActive &&
    (playerState.status === "loading" || playerState.status === "playing");
  const hasDockSession = Boolean(
    listeningTransportActive || playerState.queue.length || savedListeningSession?.activeNodeId,
  );
  const listenScene = listenOpen ? "focus" : listenTrayCollapsed && hasDockSession ? "dock" : "hidden";
  const showSevenLauncher = !hasOpenOverlay && listenScene === "hidden";

  const lyricFocusBlockId =
    listeningTransportActive && playerCursor.blockId
      ? playerCursor.blockId
      : viewportBlockId || getFirstSectionBlock(blocks, viewportSectionSlug)?.blockId || blocks[0]?.blockId || null;

  const lyricFocusBlock = lyricFocusBlockId
    ? blocks.find((block) => block.blockId === lyricFocusBlockId) || null
    : null;
  const lyricNextBlock = lyricFocusBlockId ? getNextBlock(blocks, lyricFocusBlockId) : blocks[1] || null;
  const lyricSectionSlug = lyricFocusBlock?.sectionSlug || viewportSectionSlug;
  const displaySectionSlug =
    listeningTransportActive && playerCursor.sectionSlug ? playerCursor.sectionSlug : viewportSectionSlug;
  const displayEntry = getSectionEntry(entries, displaySectionSlug);
  const displayLabel = displayEntry.number
    ? `${displayEntry.number} · ${displayEntry.title}`
    : displayEntry.title;
  const displayIndex = Math.max(
    1,
    entries.findIndex((entry) => entry.slug === displaySectionSlug) + 1,
  );

  const sectionBlocks = useMemo(
    () => blocksBySection[displaySectionSlug] || [],
    [blocksBySection, displaySectionSlug],
  );
  const sectionProgress = useMemo(() => {
    if (sectionTransportActive || selectionTransportActive) {
      if (runtimeAudioState.total <= 0) return 0;
      return Math.min(1, runtimeAudioState.index / runtimeAudioState.total);
    }

    if (sectionBlocks.length === 0) return 0;

    const referenceBlockId =
      flowTransportActive && playerCursor.blockId ? playerCursor.blockId : lyricFocusBlockId;
    const currentSectionIndex = Math.max(
      0,
      sectionBlocks.findIndex((block) => block.blockId === referenceBlockId),
    );
    const chunkProgress =
      flowTransportActive && runtimeAudioState.total > 0
        ? runtimeAudioState.index / runtimeAudioState.total
        : 0;

    return Math.min(1, (currentSectionIndex + chunkProgress) / sectionBlocks.length);
  }, [
    flowTransportActive,
    lyricFocusBlockId,
    playerCursor.blockId,
    runtimeAudioState,
    sectionBlocks,
    sectionTransportActive,
    selectionTransportActive,
  ]);
  const currentPlaybackNode =
    playerState.currentIndex >= 0 ? playerState.queue[playerState.currentIndex] || null : null;
  const heroPlaybackText = (currentPlaybackNode?.text || lyricFocusBlock?.text || currentEntry.title || "")
    .replace(/\s+/g, " ")
    .trim();
  const queueDurationSeconds =
    playerState.queue.length > 0
      ? getQueueDurationMs(playerState.queue, nodeDurationsRef.current, playbackSpeed) / 1000
      : audioTimeState.duration;
  const queueElapsedSeconds =
    playerState.queue.length > 0 && playerState.currentIndex >= 0
      ? getQueueElapsedMs(
          playerState.queue,
          playerState.currentIndex,
          currentNodeOffsetMsRef.current,
          nodeDurationsRef.current,
          playbackSpeed,
        ) / 1000
      : audioTimeState.elapsed;
  const queueProgress =
    queueDurationSeconds > 0 ? Math.min(1, queueElapsedSeconds / queueDurationSeconds) : sectionProgress;
  const queueItems = playerState.queue.map((node, index) => ({
    id: node.nodeId,
    label: node.kind === "heading" ? node.text : node.label,
    detail: node.kind === "heading" ? node.sectionSlug : node.text.slice(0, 88),
    active: index === playerState.currentIndex,
  }));
  const voiceSurfaceLabel = formatVoiceLabel(
    runtimeAudioState.provider || selectedVoice.provider,
    runtimeAudioState.voiceId || selectedVoice.voiceId,
  );
  const voiceProviderBadge = voiceStatus.fallbackFrom
    ? `${getSevenProviderLabel(runtimeAudioState.provider || selectedVoice.provider)} fallback`
    : getSevenProviderLabel(runtimeAudioState.provider || selectedVoice.provider);

  const liveStatus =
    buildAudioProgressText(runtimeAudioState) ||
    audioError ||
    (voiceStatus.state === "device_fallback" || voiceStatus.fallbackFrom
      ? voiceStatus.message
      : voiceStatus.state === "error"
        ? voiceStatus.message
        : voiceStatus.state === "device"
          ? voiceStatus.message
          : effectiveVoiceEnabled
            ? "Ready."
            : "Listening unavailable.");

  const showStatus =
    runtimeAudioState.status !== "idle" ||
    Boolean(audioError) ||
    voiceStatus.state === "error" ||
    voiceStatus.state === "device_fallback" ||
    !effectiveVoiceEnabled;

  const registerBlock = useCallback((nextBlock) => {
    setRegisteredBlocks((current) => {
      const existingIndex = current.findIndex((block) => block.blockId === nextBlock.blockId);
      if (existingIndex === -1) {
        return sortReaderBlocks([...current, nextBlock]);
      }

      const existing = current[existingIndex];
      if (
        existing.element === nextBlock.element &&
        existing.text === nextBlock.text &&
        existing.sectionSlug === nextBlock.sectionSlug
      ) {
        return current;
      }

      const updated = [...current];
      updated[existingIndex] = nextBlock;
      return sortReaderBlocks(updated);
    });
  }, []);

  const unregisterBlock = useCallback((blockId) => {
    setRegisteredBlocks((current) => {
      if (!current.some((block) => block.blockId === blockId)) return current;
      return current.filter((block) => block.blockId !== blockId);
    });
  }, []);

  const updatePlayerCursorForNode = useCallback(
    (node) => {
      if (!node) return;

      const fallbackBlockId =
        node.blockId ||
        getFirstSectionBlock(blocks, node.sectionSlug)?.blockId ||
        null;
      const nextSectionSlug = node.sectionSlug || viewportSectionSlug;
      const nextBlockIndex = fallbackBlockId ? getBlockIndex(blocks, fallbackBlockId) : -1;

      setPlayerCursor((current) => {
        if (
          current.sectionSlug === nextSectionSlug &&
          current.blockId === fallbackBlockId &&
          current.blockIndex === nextBlockIndex
        ) {
          return current;
        }

        return {
          sectionSlug: nextSectionSlug,
          blockId: fallbackBlockId,
          blockIndex: nextBlockIndex,
        };
      });
    },
    [blocks, viewportSectionSlug],
  );

  const buildQueueForScope = useCallback(
    ({ scope = "flow", sectionSlug = viewportSectionSlug, startNodeId = null, endNodeId = null, nodes = null } = {}) => {
      if (Array.isArray(nodes) && nodes.length > 0) {
        return nodes;
      }

      return buildScopedPlaybackQueue(playbackNodes, {
        scope,
        sectionSlug,
        startNodeId,
        endNodeId,
      });
    },
    [playbackNodes, viewportSectionSlug],
  );

  const getViewportNodeId = useCallback(
    ({ includeHeading = false } = {}) => {
      if (viewportBlockId && getPlaybackNode(playbackNodes, viewportBlockId)) {
        return viewportBlockId;
      }

      if (includeHeading) {
        return getSectionHeadingNodeId(viewportSectionSlug);
      }

      const firstSectionBlock = getFirstSectionBlock(blocks, viewportSectionSlug);
      return firstSectionBlock?.blockId || getSectionHeadingNodeId(viewportSectionSlug);
    },
    [blocks, playbackNodes, viewportBlockId, viewportSectionSlug],
  );

  const updateSavedListeningSession = useCallback(
    ({
      mode = playerState.sourceType,
      queue = playerState.queue,
      currentIndex = playerState.currentIndex,
      nodeOffsetMs = currentNodeOffsetMsRef.current,
      rate = playbackSpeedRef.current,
      provider = selectedVoice.provider,
      voiceId = selectedVoice.voiceId,
      status = playerState.status === "playing" ? LISTENING_STATUSES.active : LISTENING_STATUSES.paused,
    } = {}) => {
      if (!Array.isArray(queue) || queue.length === 0 || currentIndex < 0) {
        return;
      }

      const currentNode = queue[currentIndex] || queue[0];
      setSavedListeningSession({
        documentKey: documentData.documentKey,
        mode: normalizePlaybackScope(mode),
        scopeStartNodeId: queue[0]?.nodeId || null,
        scopeEndNodeId: queue[queue.length - 1]?.nodeId || null,
        activeNodeId: currentNode?.nodeId || null,
        activeSectionSlug: currentNode?.sectionSlug || viewportSectionSlug,
        nodeOffsetMs: Math.max(0, Math.round(Number(nodeOffsetMs) || 0)),
        rate: clampListeningRate(rate, playbackSpeedRef.current),
        provider,
        voiceId,
        status,
      });
    },
    [
      documentData.documentKey,
      playerState.currentIndex,
      playerState.queue,
      playerState.sourceType,
      playerState.status,
      selectedVoice.provider,
      selectedVoice.voiceId,
      viewportSectionSlug,
    ],
  );

  const clearFocusState = useCallback(() => {
    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }

    setActiveMarkId(null);
    setFocusedSectionSlug(null);
  }, []);

  const restoreSurfaceFocus = useCallback(() => {
    window.setTimeout(() => {
      surfaceTriggerRef.current?.focus();
    }, 0);
  }, []);

  const closeOverlay = useCallback(
    ({ restoreFocus = true, historyMode = "replace" } = {}) => {
      if (activeOverlay && URL_SYNC_OVERLAYS.has(activeOverlay)) {
        syncReaderUrl({ panel: null, historyMode });
      }

      if (activeOverlay === "listen" && (listeningTransportActive || savedListeningSession?.activeNodeId)) {
        setListenTrayCollapsed(true);
      }

      setActiveOverlay(null);

      if (restoreFocus) {
        restoreSurfaceFocus();
      }
    },
    [activeOverlay, listeningTransportActive, restoreSurfaceFocus, savedListeningSession?.activeNodeId],
  );

  const openOverlay = useCallback(
    (overlay, trigger = null) => {
      if (trigger?.currentTarget instanceof HTMLElement) {
        surfaceTriggerRef.current = trigger.currentTarget;
      }

      if (activeOverlay === overlay) {
        closeOverlay();
        return;
      }

      setSelectionState(null);
      setNoteDraft("");
      clearBrowserSelection();

      if (
        activeOverlay === "listen" &&
        (listeningTransportActive || savedListeningSession?.activeNodeId) &&
        overlay !== "listen"
      ) {
        setListenTrayCollapsed(true);
      } else if (overlay === "listen") {
        setListenTrayCollapsed(false);
      }

      if (URL_SYNC_OVERLAYS.has(overlay)) {
        syncReaderUrl({
          panel: overlay,
          historyMode:
            activeOverlay && URL_SYNC_OVERLAYS.has(activeOverlay) ? "replace" : "push",
        });
      } else if (activeOverlay && URL_SYNC_OVERLAYS.has(activeOverlay)) {
        syncReaderUrl({ panel: null, historyMode: "replace" });
      }

      setActiveOverlay(overlay);
    },
    [activeOverlay, closeOverlay, listeningTransportActive, savedListeningSession?.activeNodeId],
  );

  const dismissSurfacesWithoutFocus = useCallback(() => {
    if (!activeOverlay) return;
    closeOverlay({ restoreFocus: false });
  }, [activeOverlay, closeOverlay]);

  const openSevenView = useCallback(
    (view, trigger = null) => {
      setSevenView(normalizeSevenView(view));
      if (trigger?.currentTarget instanceof HTMLElement) {
        surfaceTriggerRef.current = trigger.currentTarget;
      }

      if (activeOverlay === "seven") {
        return;
      }

      openOverlay("seven", trigger);
    },
    [activeOverlay, openOverlay],
  );

  const openListenTray = useCallback((trigger = null) => {
    openOverlay("listen", trigger);
  }, [openOverlay]);

  const collapseListenTray = useCallback(() => {
    if (listenOpen) {
      closeOverlay({ restoreFocus: false });
      return;
    }

    setListenTrayCollapsed(listeningTransportActive || Boolean(savedListeningSession?.activeNodeId));
  }, [closeOverlay, listenOpen, listeningTransportActive, savedListeningSession?.activeNodeId]);

  const closeListenTray = useCallback(() => {
    if (listenOpen) {
      closeOverlay({ restoreFocus: false });
      return;
    }

    setListenTrayCollapsed(listeningTransportActive || Boolean(savedListeningSession?.activeNodeId));
  }, [closeOverlay, listenOpen, listeningTransportActive, savedListeningSession?.activeNodeId]);

  const showSelectionNotice = useCallback((message) => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }

    setSelectionNotice(message);
    noticeTimeoutRef.current = window.setTimeout(() => {
      setSelectionNotice("");
      noticeTimeoutRef.current = null;
    }, 1800);
  }, []);

  const showReceiptNotice = useCallback((message) => {
    setReceiptNotice(message);
    window.setTimeout(() => {
      setReceiptNotice("");
    }, 2600);
  }, []);

  const openAccountPage = useCallback(() => {
    closeOverlay({ restoreFocus: false });
    router.push("/account");
  }, [closeOverlay, router]);

  const openLibraryPage = useCallback(() => {
    closeOverlay({ restoreFocus: false });
    router.push("/library");
  }, [closeOverlay, router]);

  const clearAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const clearDeviceTicker = useCallback(() => {
    if (deviceTickerRef.current) {
      window.clearInterval(deviceTickerRef.current);
      deviceTickerRef.current = null;
    }
  }, []);

  const stopRuntimeAudio = useCallback(
    ({ resetState = true } = {}) => {
      audioSessionRef.current += 1;
      setAudioError("");
      clearDeviceTicker();
      currentNodeStartedAtRef.current = 0;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      clearAudioUrl();
      if (resetState) {
        setRuntimeAudioState(
          createIdleRuntimeAudioState(
            selectedVoice.provider === VOICE_PROVIDERS.device ? null : selectedVoice.provider,
            selectedVoice.voiceId,
          ),
        );
      }
    },
    [clearAudioUrl, clearDeviceTicker, selectedVoice.provider, selectedVoice.voiceId],
  );

  const pauseRuntimeAudio = useCallback(() => {
    setAudioError("");
    clearDeviceTicker();

    if (audioRef.current) {
      audioRef.current.pause();
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }

    setRuntimeAudioState((current) =>
      current.status === "playing" ? { ...current, status: "paused" } : current,
    );
  }, [clearDeviceTicker]);

  const resumeRuntimeAudio = useCallback(async () => {
    if (runtimeAudioState.status !== "paused") return;

    try {
      if (audioRef.current) {
        await audioRef.current.play();
      } else if (typeof window !== "undefined" && window.speechSynthesis) {
        currentNodeStartedAtRef.current = Date.now() - currentNodeOffsetMsRef.current;
        clearDeviceTicker();
        deviceTickerRef.current = window.setInterval(() => {
          if (playerState.queue.length === 0 || playerState.currentIndex < 0) return;
          const progressedMs = Date.now() - currentNodeStartedAtRef.current;
          const elapsedSeconds =
            getQueueElapsedMs(
              playerState.queue,
              playerState.currentIndex,
              progressedMs,
              nodeDurationsRef.current,
              playbackSpeedRef.current,
            ) / 1000;
          const durationSeconds =
            getQueueDurationMs(
              playerState.queue,
              nodeDurationsRef.current,
              playbackSpeedRef.current,
            ) / 1000;
          setAudioTimeState((current) => ({
            ...current,
            elapsed: elapsedSeconds,
            duration: durationSeconds,
          }));
        }, 240);
        window.speechSynthesis.resume();
      }

      setAudioError("");
      setRuntimeAudioState((current) =>
        current.status === "paused" ? { ...current, status: "playing" } : current,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The player could not resume speaking.";
      setAudioError(message);
      stopRuntimeAudio();
    }
  }, [
    clearDeviceTicker,
    playerState.currentIndex,
    playerState.queue,
    runtimeAudioState.status,
    stopRuntimeAudio,
  ]);

  const handleSpeedChange = useCallback(
    (rate) => {
      const nextRate = clampListeningRate(rate, 1);
      playbackSpeedRef.current = nextRate;
      setPlaybackSpeed(nextRate);
      if (audioRef.current) {
        audioRef.current.playbackRate = nextRate;
      }
      updateSavedListeningSession({ rate: nextRate });
    },
    [updateSavedListeningSession],
  );

  const syncQueueTiming = useCallback(
    (queue, currentIndex, nodeOffsetMs) => {
      const elapsedSeconds =
        getQueueElapsedMs(
          queue,
          currentIndex,
          nodeOffsetMs,
          nodeDurationsRef.current,
          playbackSpeedRef.current,
        ) / 1000;
      const durationSeconds =
        getQueueDurationMs(queue, nodeDurationsRef.current, playbackSpeedRef.current) / 1000;

      setAudioTimeState((current) => ({
        ...current,
        elapsed: elapsedSeconds,
        duration: durationSeconds,
      }));
    },
    [],
  );

  const fetchAudioChunk = useCallback(
    async (text, metadata = {}) => {
      const response = await fetch("/api/seven/audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, ...metadata }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const payload = await response.json();
          throw createSevenApiError(payload, "The player could not generate audio.");
        }

        throw new Error("The player could not generate audio.");
      }

      return {
        blob: await response.blob(),
        meta: parseSevenAudioHeaders(response.headers),
      };
    },
    [],
  );

  const getAudioCacheKey = useCallback(
    (nodeId) =>
      [
        documentData.documentKey,
        selectedVoice.provider,
        selectedVoice.voiceId || "default",
        playbackSpeedRef.current,
        nodeId,
      ].join(":"),
    [documentData.documentKey, selectedVoice.provider, selectedVoice.voiceId],
  );

  const prefetchNodeAudio = useCallback(
    async (node) => {
      if (!node || selectedVoice.provider === VOICE_PROVIDERS.device) return null;

      const cacheKey = getAudioCacheKey(node.nodeId);
      if (prefetchedAudioRef.current.has(cacheKey)) {
        return prefetchedAudioRef.current.get(cacheKey);
      }

      const request = Promise.all(
        splitTextForSpeech(node.text).map((chunk) =>
          fetchAudioChunk(chunk, {
            preferredProvider: selectedVoice.provider,
            voiceId: selectedVoice.voiceId,
            rate: playbackSpeedRef.current,
            nodeId: node.nodeId,
            documentKey: documentData.documentKey,
            cacheKey,
          }),
        ),
      );

      prefetchedAudioRef.current.set(cacheKey, request);
      return request;
    },
    [
      documentData.documentKey,
      fetchAudioChunk,
      getAudioCacheKey,
      selectedVoice.provider,
      selectedVoice.voiceId,
    ],
  );

  const warmUpcomingNodes = useCallback(
    (queue, currentIndex) => {
      if (selectedVoice.provider === VOICE_PROVIDERS.device) return;

      queue
        .slice(currentIndex + 1, currentIndex + 3)
        .filter(Boolean)
        .forEach((node) => {
          void prefetchNodeAudio(node);
        });
    },
    [prefetchNodeAudio, selectedVoice.provider],
  );

  const sliceTextForProgress = useCallback((text, progress) => {
    const normalized = String(text || "").trim();
    if (!normalized) return normalized;

    const clamped = Math.max(0, Math.min(0.95, progress));
    if (clamped <= 0) return normalized;

    const rawIndex = Math.floor(normalized.length * clamped);
    const boundary = normalized.indexOf(" ", rawIndex);
    return normalized.slice(boundary > -1 ? boundary + 1 : rawIndex).trim() || normalized;
  }, []);

  const playWithDeviceVoice = useCallback(
    async ({
      chunks,
      label,
      sessionId,
      sourceType,
      sourceId,
      queue,
      currentIndex,
      startOffsetMs = 0,
    }) => {
      if (
        typeof window === "undefined" ||
        typeof window.speechSynthesis === "undefined" ||
        typeof window.SpeechSynthesisUtterance === "undefined"
      ) {
        throw new Error("Voice playback is unavailable right now.");
      }

      const synth = window.speechSynthesis;
      synth.cancel();

      const estimatedChunkDurations = chunks.map((chunk) =>
        estimateListeningDurationMs(chunk, playbackSpeedRef.current),
      );

      let remainingOffset = Math.max(0, startOffsetMs);
      let startChunkIndex = 0;
      let startChunkOffsetMs = 0;
      for (let index = 0; index < estimatedChunkDurations.length; index += 1) {
        if (remainingOffset <= estimatedChunkDurations[index]) {
          startChunkIndex = index;
          startChunkOffsetMs = remainingOffset;
          break;
        }
        remainingOffset -= estimatedChunkDurations[index];
        startChunkIndex = index + 1;
      }

      const speakChunk = async (chunkIndex) => {
        if (audioSessionRef.current !== sessionId || !chunks[chunkIndex]) return false;

        const priorChunksMs = estimatedChunkDurations
          .slice(0, chunkIndex)
          .reduce((sum, value) => sum + value, 0);
        const chunkOffsetMs = chunkIndex === startChunkIndex ? startChunkOffsetMs : 0;
        const chunkText =
          chunkIndex === startChunkIndex && chunkOffsetMs > 0
            ? sliceTextForProgress(
                chunks[chunkIndex],
                chunkOffsetMs / Math.max(1, estimatedChunkDurations[chunkIndex]),
              )
            : chunks[chunkIndex];

        currentNodeStartedAtRef.current = Date.now() - chunkOffsetMs;
        clearDeviceTicker();
        deviceTickerRef.current = window.setInterval(() => {
          const progressedMs = priorChunksMs + (Date.now() - currentNodeStartedAtRef.current);
          currentNodeOffsetMsRef.current = Math.max(0, progressedMs);
          syncQueueTiming(queue, currentIndex, currentNodeOffsetMsRef.current);
        }, 240);

        setRuntimeAudioState({
          status: "playing",
          label,
          index: chunkIndex + 1,
          total: chunks.length,
          mode: "device",
          sourceType,
          sourceId,
          provider: VOICE_PROVIDERS.device,
          voiceId: "device",
        });

        await new Promise((resolve, reject) => {
          const utterance = new window.SpeechSynthesisUtterance(chunkText);
          utterance.rate = playbackSpeedRef.current;
          utterance.pitch = 1;
          utterance.onend = () => resolve();
          utterance.onerror = () => reject(new Error("Device voice playback failed."));
          synth.speak(utterance);
        });

        clearDeviceTicker();
        currentNodeOffsetMsRef.current = priorChunksMs + estimatedChunkDurations[chunkIndex];
        syncQueueTiming(queue, currentIndex, currentNodeOffsetMsRef.current);

        if (audioSessionRef.current !== sessionId) return false;
        if (chunkIndex + 1 >= chunks.length) {
          return true;
        }

        return speakChunk(chunkIndex + 1);
      };

      return speakChunk(startChunkIndex);
    },
    [clearDeviceTicker, sliceTextForProgress, syncQueueTiming],
  );

  const playAudioText = useCallback(
    async (
      text,
      { label, sourceType, sourceId, queue = [], currentIndex = 0, startOffsetMs = 0 } = {},
    ) => {
      if (!effectiveVoiceEnabled) {
        setAudioError("Voice playback is unavailable right now.");
        return false;
      }

      const chunks = splitTextForSpeech(text);
      if (chunks.length === 0) {
        setAudioError("There is nothing here for the player to read yet.");
        return false;
      }

      stopRuntimeAudio();
      chunkDurationsRef.current = new Array(chunks.length).fill(0);
      currentNodeOffsetMsRef.current = startOffsetMs;
      syncQueueTiming(queue, currentIndex, startOffsetMs);
      const sessionId = audioSessionRef.current;
      const providerMode =
        selectedVoice.provider === VOICE_PROVIDERS.device ? "device" : "provider";

      setRuntimeAudioState({
        status: "loading",
        label,
        index: 0,
        total: chunks.length,
        mode: providerMode,
        sourceType,
        sourceId,
        provider: selectedVoice.provider,
        voiceId: selectedVoice.voiceId,
      });

      if (selectedVoice.provider === VOICE_PROVIDERS.device && browserSpeechEnabled) {
        try {
          const completed = await playWithDeviceVoice({
            chunks,
            label,
            sessionId,
            sourceType,
            sourceId,
            queue,
            currentIndex,
            startOffsetMs,
          });

          setVoiceStatus({
            state: "device",
            provider: VOICE_PROVIDERS.device,
            fallbackFrom: null,
            reasonCode: "",
            message: "Listening is available through your device voice.",
          });
          return completed;
        } catch (error) {
          if (audioSessionRef.current !== sessionId) return false;
          const message =
            error instanceof Error ? error.message : "The player could not start speaking.";
          setAudioError(message);
          setVoiceStatus({
            state: "error",
            provider: VOICE_PROVIDERS.device,
            fallbackFrom: null,
            reasonCode: "unknown_error",
            message,
          });
          setRuntimeAudioState(
            createIdleRuntimeAudioState(
              selectedVoice.provider === VOICE_PROVIDERS.device ? null : selectedVoice.provider,
              selectedVoice.voiceId,
            ),
          );
          return false;
        }
      }

      const cacheKey = getAudioCacheKey(sourceId || label);
      const prefetched =
        prefetchedAudioRef.current.get(cacheKey) ||
        Promise.all(
          chunks.map((chunk) =>
            fetchAudioChunk(chunk, {
              preferredProvider: selectedVoice.provider,
              voiceId: selectedVoice.voiceId,
              rate: playbackSpeedRef.current,
              nodeId: sourceId,
              documentKey: documentData.documentKey,
              cacheKey,
            }),
          ),
        );
      prefetchedAudioRef.current.set(cacheKey, prefetched);

      const estimatedChunkDurations = chunks.map((chunk) =>
        estimateListeningDurationMs(chunk, playbackSpeedRef.current),
      );

      let remainingOffset = Math.max(0, startOffsetMs);
      let startChunkIndex = 0;
      let startChunkOffsetMs = 0;
      for (let index = 0; index < estimatedChunkDurations.length; index += 1) {
        if (remainingOffset <= estimatedChunkDurations[index]) {
          startChunkIndex = index;
          startChunkOffsetMs = remainingOffset;
          break;
        }
        remainingOffset -= estimatedChunkDurations[index];
        startChunkIndex = index + 1;
      }

      const playChunk = async (chunkIndex) => {
        if (audioSessionRef.current !== sessionId) return false;
        const chunkPayloads = await prefetched;
        const payload = chunkPayloads[chunkIndex];
        if (!payload) return false;

        setRuntimeAudioState({
          status: "loading",
          label,
          index: chunkIndex + 1,
          total: chunks.length,
          mode: "provider",
          sourceType,
          sourceId,
          provider: selectedVoice.provider,
          voiceId: selectedVoice.voiceId,
        });

        const { blob, meta } = payload;

        setVoiceStatus({
          state: "ready",
          provider: meta.provider || selectedVoice.provider,
          fallbackFrom: meta.fallbackFrom,
          reasonCode: meta.fallbackReasonCode,
          message: meta.fallbackFrom
            ? buildSevenFallbackMessage({
                fallbackTo: meta.provider || selectedVoice.provider || "openai",
                fallbackFrom: meta.fallbackFrom,
                reasonCode: meta.fallbackReasonCode || "unknown_error",
              })
            : "Voice is ready.",
        });

        clearAudioUrl();
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.playbackRate = playbackSpeedRef.current;

        const priorChunksMs =
          chunkDurationsRef.current
            .slice(0, chunkIndex)
            .reduce((sum, duration) => sum + duration, 0) * 1000;

        await new Promise((resolve, reject) => {
          audio.addEventListener(
            "loadedmetadata",
            () => {
              chunkDurationsRef.current[chunkIndex] = audio.duration;
              nodeDurationsRef.current[sourceId] = chunkDurationsRef.current.reduce(
                (sum, durationSeconds, index) =>
                  sum +
                  (durationSeconds > 0
                    ? durationSeconds * 1000
                    : estimatedChunkDurations[index]),
                0,
              );
              if (chunkIndex === startChunkIndex && startChunkOffsetMs > 0 && audio.duration > 0) {
                audio.currentTime = Math.min(audio.duration, startChunkOffsetMs / 1000);
              }
              currentNodeOffsetMsRef.current = priorChunksMs + audio.currentTime * 1000;
              syncQueueTiming(queue, currentIndex, currentNodeOffsetMsRef.current);
              resolve();
            },
            { once: true },
          );
          audio.addEventListener(
            "error",
            () => reject(new Error("The player could not load audio.")),
            { once: true },
          );
        });

        let lastTimeUpdate = 0;
        audio.addEventListener("timeupdate", () => {
          const now = Date.now();
          if (now - lastTimeUpdate < 500) return;
          lastTimeUpdate = now;
          currentNodeOffsetMsRef.current = priorChunksMs + audio.currentTime * 1000;
          syncQueueTiming(queue, currentIndex, currentNodeOffsetMsRef.current);
        });

        await new Promise((resolve, reject) => {
          audio.addEventListener("ended", resolve, { once: true });
          audio.addEventListener("error", reject, { once: true });
          audio
            .play()
            .then(() => {
              if (audioSessionRef.current !== sessionId) {
                resolve();
                return;
              }

              setRuntimeAudioState({
                status: "playing",
                label,
                index: chunkIndex + 1,
                total: chunks.length,
                mode: "provider",
                sourceType,
                sourceId,
                provider: meta.provider || selectedVoice.provider,
                voiceId: meta.voiceId || selectedVoice.voiceId,
              });
            })
            .catch(reject);
        }).catch(() => {
          throw new Error("The player could not play this audio chunk.");
        });

        currentNodeOffsetMsRef.current =
          priorChunksMs +
          (chunkDurationsRef.current[chunkIndex] > 0
            ? chunkDurationsRef.current[chunkIndex] * 1000
            : estimatedChunkDurations[chunkIndex]);
        clearAudioUrl();
        audioRef.current = null;

        if (audioSessionRef.current !== sessionId) return false;
        if (chunkIndex + 1 >= chunks.length) {
          return true;
        }

        return playChunk(chunkIndex + 1);
      };

      try {
        return await playChunk(startChunkIndex);
      } catch (error) {
        if (audioSessionRef.current !== sessionId) return false;

        const sourceProvider =
          error?.fallbackFrom || error?.provider || selectedVoice.provider || "openai";
        const sourceReason = error?.reasonCode || error?.fallbackReasonCode || "unknown_error";

        if (browserSpeechEnabled) {
          try {
            setAudioError("");
            setVoiceStatus({
              state: "device_fallback",
              provider: VOICE_PROVIDERS.device,
              fallbackFrom: sourceProvider,
              reasonCode: sourceReason,
              message: buildSevenFallbackMessage({
                fallbackTo: "device",
                fallbackFrom: sourceProvider,
                reasonCode: sourceReason,
              }),
            });

            return await playWithDeviceVoice({
              chunks,
              label,
              sessionId,
              sourceType,
              sourceId,
              queue,
              currentIndex,
              startOffsetMs,
            });
          } catch (fallbackError) {
            const message =
              fallbackError instanceof Error
                ? fallbackError.message
                : "The player could not start speaking.";
            setAudioError(message);
            setVoiceStatus({
              state: "error",
              provider: VOICE_PROVIDERS.device,
              fallbackFrom: null,
              reasonCode: sourceReason,
              message,
            });
          }
        } else {
          const message =
            error instanceof Error ? error.message : "The player could not start speaking.";
          setAudioError(message);
          setVoiceStatus({
            state: "error",
            provider: sourceProvider,
            fallbackFrom: null,
            reasonCode: sourceReason,
            message,
          });
        }

        setRuntimeAudioState(
          createIdleRuntimeAudioState(
            selectedVoice.provider === VOICE_PROVIDERS.device ? null : selectedVoice.provider,
            selectedVoice.voiceId,
          ),
        );
        return false;
      }
    },
    [
      browserSpeechEnabled,
      clearAudioUrl,
      documentData.documentKey,
      effectiveVoiceEnabled,
      fetchAudioChunk,
      getAudioCacheKey,
      playWithDeviceVoice,
      selectedVoice.provider,
      selectedVoice.voiceId,
      stopRuntimeAudio,
      syncQueueTiming,
    ],
  );

  const playPlaybackQueue = useCallback(
    async ({ queue, startIndex = 0, startOffsetMs = 0, sourceType = "flow" } = {}) => {
      if (!Array.isArray(queue) || queue.length === 0 || startIndex < 0) {
        return false;
      }

      documentRunRef.current += 1;
      const runId = documentRunRef.current;
      const providerMode =
        selectedVoice.provider === VOICE_PROVIDERS.device ? "device" : "provider";

      setListenTrayCollapsed(true);
      setPlayerState((current) => ({
        ...current,
        status: "loading",
        sourceType,
        queue,
        currentIndex: startIndex,
        providerMode,
      }));

      for (let index = startIndex; index < queue.length; index += 1) {
        if (documentRunRef.current !== runId) return false;

        const node = queue[index];
        updatePlayerCursorForNode(node);
        currentNodeOffsetMsRef.current = index === startIndex ? startOffsetMs : 0;
        syncQueueTiming(queue, index, currentNodeOffsetMsRef.current);

        if (sourceType !== "message") {
          updateSavedListeningSession({
            mode: sourceType,
            queue,
            currentIndex: index,
            nodeOffsetMs: currentNodeOffsetMsRef.current,
            status: LISTENING_STATUSES.active,
          });
        }

        setPlayerState((current) => ({
          ...current,
          status: "loading",
          sourceType,
          queue,
          currentIndex: index,
          providerMode,
        }));

        warmUpcomingNodes(queue, index);
        const completed = await playAudioText(node.text, {
          label:
            sourceType === "message"
              ? "Seven"
              : sourceType === "selection"
                ? "Selection"
                : node.label || currentLabel,
          sourceType,
          sourceId: node.nodeId,
          queue,
          currentIndex: index,
          startOffsetMs: currentNodeOffsetMsRef.current,
        });

        if (documentRunRef.current !== runId) return false;
        if (!completed) {
          if (sourceType !== "message") {
            updateSavedListeningSession({
              mode: sourceType,
              queue,
              currentIndex: index,
              nodeOffsetMs: currentNodeOffsetMsRef.current,
              status: LISTENING_STATUSES.paused,
            });
          }
          setPlayerState((current) => ({ ...current, status: "paused" }));
          return false;
        }
      }

      if (documentRunRef.current !== runId) return false;

      setRuntimeAudioState(
        createIdleRuntimeAudioState(
          selectedVoice.provider === VOICE_PROVIDERS.device ? null : selectedVoice.provider,
          selectedVoice.voiceId,
        ),
      );
      setPlayerState((current) => ({
        ...current,
        status: "paused",
        sourceType,
        queue,
        currentIndex: queue.length - 1,
      }));

      if (sourceType !== "message") {
        updateSavedListeningSession({
          mode: sourceType,
          queue,
          currentIndex: queue.length - 1,
          nodeOffsetMs: 0,
          status: LISTENING_STATUSES.paused,
        });
      }

      return true;
    },
    [
      currentLabel,
      playAudioText,
      selectedVoice.provider,
      selectedVoice.voiceId,
      syncQueueTiming,
      updatePlayerCursorForNode,
      updateSavedListeningSession,
      warmUpcomingNodes,
    ],
  );

  const pauseDocumentPlayback = useCallback(() => {
    if (
      runtimeAudioState.sourceType !== "flow" &&
      runtimeAudioState.sourceType !== "section" &&
      runtimeAudioState.sourceType !== "selection"
    ) {
      return;
    }

    pauseRuntimeAudio();
    setPlayerState((current) => ({
      ...current,
      status: "paused",
    }));
    updateSavedListeningSession({ status: LISTENING_STATUSES.paused });
  }, [pauseRuntimeAudio, runtimeAudioState.sourceType, updateSavedListeningSession]);

  const resumeCurrentPlayback = useCallback(async () => {
    if (
      runtimeAudioState.status === "paused" &&
      (runtimeAudioState.sourceType === "flow" ||
        runtimeAudioState.sourceType === "section" ||
        runtimeAudioState.sourceType === "selection")
    ) {
      await resumeRuntimeAudio();
      setPlayerState((current) => ({ ...current, status: "playing" }));
      updateSavedListeningSession({ status: LISTENING_STATUSES.active });
      return;
    }

    if (playerState.queue.length > 0 && playerState.currentIndex >= 0) {
      await playPlaybackQueue({
        queue: playerState.queue,
        startIndex: playerState.currentIndex,
        startOffsetMs: currentNodeOffsetMsRef.current,
        sourceType: playerState.sourceType,
      });
    }
  }, [
    playPlaybackQueue,
    playerState.currentIndex,
    playerState.queue,
    playerState.sourceType,
    resumeRuntimeAudio,
    runtimeAudioState.sourceType,
    runtimeAudioState.status,
    updateSavedListeningSession,
  ]);

  const handleContinueDocument = useCallback(async () => {
    if (runtimeAudioState.sourceType === "message") {
      stopRuntimeAudio({ resetState: false });
    }

    if (playerState.status === "playing" && playerState.sourceType === "flow") {
      return;
    }

    if (playerState.status === "paused" && playerState.queue.length > 0) {
      await resumeCurrentPlayback();
      return;
    }

    const startNodeId = getViewportNodeId();
    const queue = buildQueueForScope({
      scope: "flow",
      sectionSlug: viewportSectionSlug,
      startNodeId,
    });

    await playPlaybackQueue({
      queue,
      startIndex: 0,
      sourceType: "flow",
    });
  }, [
    buildQueueForScope,
    getViewportNodeId,
    playPlaybackQueue,
    playerState.queue.length,
    playerState.sourceType,
    playerState.status,
    resumeCurrentPlayback,
    runtimeAudioState.sourceType,
    stopRuntimeAudio,
    viewportSectionSlug,
  ]);

  const startSectionPlayback = useCallback(
    async (slug = displaySectionSlug) => {
      const queue = buildQueueForScope({
        scope: "section",
        sectionSlug: slug,
        startNodeId: getSectionHeadingNodeId(slug),
      });
      if (!queue.length) return;

      await playPlaybackQueue({
        queue,
        startIndex: 0,
        sourceType: "section",
      });
    },
    [buildQueueForScope, displaySectionSlug, playPlaybackQueue],
  );

  const handlePrimaryPlayPause = useCallback(async () => {
    if (playerState.status === "loading") return;

    if (runtimeAudioState.sourceType === "message") {
      stopRuntimeAudio({ resetState: false });
      if (canonicalSessionRef.current?.queue?.length) {
        const snapshot = canonicalSessionRef.current;
        canonicalSessionRef.current = null;
        await playPlaybackQueue(snapshot);
      }
      return;
    }

    if (playerState.status === "playing") {
      pauseDocumentPlayback();
      return;
    }

    if (playerState.status === "paused" && playerState.queue.length > 0) {
      await resumeCurrentPlayback();
      return;
    }

    await handleContinueDocument();
  }, [
    handleContinueDocument,
    pauseDocumentPlayback,
    playPlaybackQueue,
    playerState.queue.length,
    playerState.status,
    resumeCurrentPlayback,
    runtimeAudioState.sourceType,
    stopRuntimeAudio,
  ]);

  const handlePlaybackSectionStep = useCallback(
    async (offset) => {
      const originSlug = playerCursor.sectionSlug || displaySectionSlug || viewportSectionSlug;
      const originIndex = Math.max(
        0,
        entries.findIndex((entry) => entry.slug === originSlug),
      );
      const targetEntry = entries[originIndex + offset];
      if (!targetEntry) return;

      const firstBlock = getFirstSectionBlock(blocks, targetEntry.slug);
      const target = firstBlock?.element || document.getElementById(targetEntry.slug);
      if (target) {
        scrollIntentRef.current = true;
        scrollReaderTarget(target, {
          behavior: getScrollBehavior(),
          block: "start",
        });
        window.setTimeout(() => {
          scrollIntentRef.current = false;
        }, 320);
      }

      await startSectionPlayback(targetEntry.slug);
    },
    [
      blocks,
      displaySectionSlug,
      entries,
      playerCursor.sectionSlug,
      startSectionPlayback,
      viewportSectionSlug,
    ],
  );

  const handleAudioSkip = useCallback(
    async (offsetSeconds) => {
      if (playerState.queue.length === 0 || playerState.currentIndex < 0) return;

      const nextElapsedMs =
        getQueueElapsedMs(
          playerState.queue,
          playerState.currentIndex,
          currentNodeOffsetMsRef.current,
          nodeDurationsRef.current,
          playbackSpeedRef.current,
        ) +
        offsetSeconds * 1000;
      const nextPosition = findQueuePositionByElapsedMs(
        playerState.queue,
        nextElapsedMs,
        nodeDurationsRef.current,
        playbackSpeedRef.current,
      );

      stopRuntimeAudio({ resetState: false });
      await playPlaybackQueue({
        queue: playerState.queue,
        startIndex: nextPosition.index,
        startOffsetMs: nextPosition.nodeOffsetMs,
        sourceType: playerState.sourceType,
      });
    },
    [playPlaybackQueue, playerState.currentIndex, playerState.queue, playerState.sourceType, stopRuntimeAudio],
  );

  const playMessageAudio = useCallback(
    async (messageId, text) => {
      if (playerState.queue.length > 0 && playerState.currentIndex >= 0) {
        canonicalSessionRef.current = {
          queue: playerState.queue,
          startIndex: playerState.currentIndex,
          startOffsetMs: currentNodeOffsetMsRef.current,
          sourceType: playerState.sourceType,
        };
      }

      stopRuntimeAudio({ resetState: false });
      setPlayerState((current) => ({ ...current, status: "paused" }));

      const queue = [
        createEphemeralPlaybackNode({
          nodeId: `message:${messageId}`,
          kind: "message",
          sectionSlug: displaySectionSlug,
          label: "Seven",
          text,
        }),
      ];

      await playPlaybackQueue({
        queue,
        startIndex: 0,
        startOffsetMs: 0,
        sourceType: "message",
      });

      if (canonicalSessionRef.current) {
        const snapshot = canonicalSessionRef.current;
        canonicalSessionRef.current = null;
        await playPlaybackQueue(snapshot);
      }
    },
    [
      displaySectionSlug,
      playPlaybackQueue,
      playerState.currentIndex,
      playerState.queue,
      playerState.sourceType,
      stopRuntimeAudio,
    ],
  );

  const stopMessageAudio = useCallback(async () => {
    if (runtimeAudioState.sourceType !== "message") return;
    stopRuntimeAudio({ resetState: false });

    if (canonicalSessionRef.current) {
      const snapshot = canonicalSessionRef.current;
      canonicalSessionRef.current = null;
      await playPlaybackQueue(snapshot);
    }
  }, [playPlaybackQueue, runtimeAudioState.sourceType, stopRuntimeAudio]);

  const handleSeek = useCallback(
    async (nextProgress) => {
      if (playerState.queue.length === 0 || playerState.currentIndex < 0) return;

      const queueDurationMs = getQueueDurationMs(
        playerState.queue,
        nodeDurationsRef.current,
        playbackSpeedRef.current,
      );
      const targetElapsedMs = Math.max(0, Math.min(queueDurationMs, queueDurationMs * nextProgress));
      const nextPosition = findQueuePositionByElapsedMs(
        playerState.queue,
        targetElapsedMs,
        nodeDurationsRef.current,
        playbackSpeedRef.current,
      );

      stopRuntimeAudio({ resetState: false });
      await playPlaybackQueue({
        queue: playerState.queue,
        startIndex: nextPosition.index,
        startOffsetMs: nextPosition.nodeOffsetMs,
        sourceType: playerState.sourceType,
      });
    },
    [playPlaybackQueue, playerState.currentIndex, playerState.queue, playerState.sourceType, stopRuntimeAudio],
  );

  const handleJumpToQueueItem = useCallback(
    async (nodeId) => {
      const index = getPlaybackNodeIndex(playerState.queue, nodeId);
      if (index < 0) return;
      setListenSheet(null);
      stopRuntimeAudio({ resetState: false });
      await playPlaybackQueue({
        queue: playerState.queue,
        startIndex: index,
        startOffsetMs: 0,
        sourceType: playerState.sourceType,
      });
    },
    [playPlaybackQueue, playerState.queue, playerState.sourceType, stopRuntimeAudio],
  );

  const handleSelectVoice = useCallback(
    (voiceOption) => {
      if (!voiceOption) return;
      setSelectedVoice(voiceOption);
      setListenSheet(null);
      setSavedListeningSession((current) =>
        current
          ? {
              ...current,
              provider: voiceOption.provider,
              voiceId: voiceOption.voiceId || null,
              rate: playbackSpeedRef.current,
            }
          : current,
      );
      void fetch("/api/reader/listening-session", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentKey: documentData.documentKey,
          ...(savedListeningSession || {}),
          preferredVoiceProvider: voiceOption.provider,
          preferredVoiceId: voiceOption.voiceId || null,
          preferredListeningRate: playbackSpeedRef.current,
        }),
      }).catch(() => {});
    },
    [documentData.documentKey, savedListeningSession],
  );

  const handlePlaySelection = useCallback(async () => {
    if (!selectionState?.anchor?.quote) return;
    const queue = [
      createEphemeralPlaybackNode({
        nodeId: `selection:${selectionState.anchor.blockId}:${selectionState.anchor.startOffset}:${selectionState.anchor.endOffset}`,
        kind: "selection",
        sectionSlug: selectionState.anchor.sectionSlug,
        blockId: selectionState.anchor.blockId,
        label: selectionState.anchor.sectionTitle || currentLabel,
        text: selectionState.anchor.quote,
      }),
    ];
    setSelectionState(null);
    clearBrowserSelection();
    await playPlaybackQueue({
      queue,
      startIndex: 0,
      sourceType: "selection",
    });
  }, [currentLabel, playPlaybackQueue, selectionState]);

  const handleStartFromSelection = useCallback(async () => {
    if (!selectionState?.anchor?.blockId) return;
    const queue = buildQueueForScope({
      scope: "flow",
      sectionSlug: selectionState.anchor.sectionSlug,
      startNodeId: selectionState.anchor.blockId,
    });
    setSelectionState(null);
    clearBrowserSelection();
    await playPlaybackQueue({
      queue,
      startIndex: 0,
      sourceType: "flow",
    });
  }, [buildQueueForScope, playPlaybackQueue, selectionState]);

  const handleQueueSelectionNext = useCallback(() => {
    if (!selectionState?.anchor?.quote || playerState.queue.length === 0 || playerState.currentIndex < 0) {
      return;
    }

    const selectionNode = createEphemeralPlaybackNode({
      nodeId: `queued-selection:${Date.now()}`,
      kind: "selection",
      sectionSlug: selectionState.anchor.sectionSlug,
      blockId: selectionState.anchor.blockId,
      label: selectionState.anchor.sectionTitle || currentLabel,
      text: selectionState.anchor.quote,
    });
    const nextQueue = [...playerState.queue];
    nextQueue.splice(playerState.currentIndex + 1, 0, selectionNode);
    setPlayerState((current) => ({
      ...current,
      queue: nextQueue,
    }));
    setSelectionState(null);
    clearBrowserSelection();
  }, [currentLabel, playerState.currentIndex, playerState.queue, selectionState]);

  const jumpTo = useCallback(
    (slug) => {
      const target = document.getElementById(slug);
      if (!target) return;

      scrollIntentRef.current = true;
      dismissSurfacesWithoutFocus();
      setSelectionState(null);
      setNoteDraft("");
      clearBrowserSelection();
      clearFocusState();
      scrollReaderTarget(target, {
        behavior: getScrollBehavior(),
        block: "start",
      });
      window.setTimeout(() => {
        scrollIntentRef.current = false;
      }, 320);
    },
    [clearFocusState, dismissSurfacesWithoutFocus],
  );

  const jumpToMark = useCallback(
    (mark) => {
      const selector =
        mark.blockId && typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? `[data-block-id="${CSS.escape(mark.blockId)}"]`
          : null;
      const target =
        (selector ? document.querySelector(selector) : null) ||
        document.getElementById(mark.sectionSlug);

      if (!target) return;

      scrollIntentRef.current = true;
      dismissSurfacesWithoutFocus();
      setSelectionState(null);
      setNoteDraft("");
      clearBrowserSelection();
      clearFocusState();
      target.scrollIntoView({
        behavior: getScrollBehavior(),
        block: "center",
      });
      setActiveMarkId(mark.id);
      setFocusedSectionSlug(mark.sectionSlug);
      focusTimeoutRef.current = window.setTimeout(() => {
        setActiveMarkId(null);
        setFocusedSectionSlug(null);
        focusTimeoutRef.current = null;
      }, 1800);

      window.setTimeout(() => {
        scrollIntentRef.current = false;
      }, 320);
    },
    [clearFocusState, dismissSurfacesWithoutFocus],
  );

  useEffect(() => {
    if (blocks.length === 0) return;

    setViewportBlockId((current) => {
      if (current && blocks.some((block) => block.blockId === current)) return current;
      return getFirstSectionBlock(blocks, viewportSectionSlug)?.blockId || blocks[0].blockId;
    });

    setPlayerCursor((current) => {
      if (current.blockId && blocks.some((block) => block.blockId === current.blockId)) {
        const nextBlockIndex = getBlockIndex(blocks, current.blockId);
        return current.blockIndex === nextBlockIndex
          ? current
          : {
              ...current,
              blockIndex: nextBlockIndex,
            };
      }

      const fallback = getFirstSectionBlock(blocks, viewportSectionSlug) || blocks[0];
      const nextBlockIndex = getBlockIndex(blocks, fallback.blockId);
      if (
        current.sectionSlug === fallback.sectionSlug &&
        current.blockId === fallback.blockId &&
        current.blockIndex === nextBlockIndex
      ) {
        return current;
      }

      return {
        sectionSlug: fallback.sectionSlug,
        blockId: fallback.blockId,
        blockIndex: nextBlockIndex,
      };
    });
  }, [blocks, viewportSectionSlug]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const supported =
      typeof window.speechSynthesis !== "undefined" &&
      typeof window.SpeechSynthesisUtterance !== "undefined";
    setBrowserSpeechEnabled(supported);

    if (!supported || typeof window.speechSynthesis.addEventListener !== "function") {
      return undefined;
    }

    const handleVoicesChanged = () => setBrowserSpeechEnabled(true);
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
  }, []);

  useEffect(() => {
    setVoiceStatus((current) =>
      current.state === "error" || current.state === "device_fallback"
        ? current
        : initialVoiceStatus({
            voiceEnabled: selectedVoice.provider !== VOICE_PROVIDERS.device,
            browserSpeechEnabled,
            preferredVoiceProvider: selectedVoice.provider || sevenVoiceProvider,
          }),
    );
  }, [browserSpeechEnabled, selectedVoice.provider, sevenVoiceProvider]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    if (selectedVoice.provider !== VOICE_PROVIDERS.device || browserSpeechEnabled) return;
    const fallback = availableVoiceOptions.find((option) => option.provider !== VOICE_PROVIDERS.device);
    if (!fallback) return;
    setSelectedVoice(fallback);
  }, [availableVoiceOptions, browserSpeechEnabled, selectedVoice.provider]);

  useEffect(() => {
    prefetchedAudioRef.current.clear();
  }, [playbackSpeed, selectedVoice.provider, selectedVoice.voiceId]);

  useEffect(() => {
    if (activeOverlay === "listen") return;
    setListenTrayCollapsed(listeningTransportActive || Boolean(savedListeningSession?.activeNodeId));
  }, [activeOverlay, listeningTransportActive, savedListeningSession?.activeNodeId]);

  useEffect(() => {
    if (initialListeningHydratedRef.current) return;
    if (!initialListeningSession || playbackNodes.length === 0) return;

    const queue = buildQueueForScope({
      scope: initialListeningSession.mode || "flow",
      sectionSlug: initialListeningSession.activeSectionSlug || initialSectionSlug,
      startNodeId:
        initialListeningSession.scopeStartNodeId || initialListeningSession.activeNodeId,
      endNodeId: initialListeningSession.scopeEndNodeId,
    });
    if (queue.length === 0) return;

    const currentIndex = Math.max(
      0,
      getPlaybackNodeIndex(queue, initialListeningSession.activeNodeId || queue[0].nodeId),
    );
    const currentNode = queue[currentIndex] || queue[0];

    updatePlayerCursorForNode(currentNode);
    currentNodeOffsetMsRef.current = initialListeningSession.nodeOffsetMs || 0;
    syncQueueTiming(queue, currentIndex, currentNodeOffsetMsRef.current);
    setPlayerState((current) => ({
      ...current,
      status: "paused",
      sourceType: normalizePlaybackScope(initialListeningSession.mode),
      queue,
      currentIndex,
      providerMode: selectedVoice.provider === VOICE_PROVIDERS.device ? "device" : "provider",
    }));
    setRuntimeAudioState({
      status: "paused",
      label: currentNode.label || currentLabel,
      index: currentIndex + 1,
      total: queue.length,
      mode: selectedVoice.provider === VOICE_PROVIDERS.device ? "device" : "provider",
      sourceType: normalizePlaybackScope(initialListeningSession.mode),
      sourceId: currentNode.nodeId,
      provider: selectedVoice.provider,
      voiceId: selectedVoice.voiceId,
    });
    initialListeningHydratedRef.current = true;
  }, [
    buildQueueForScope,
    currentLabel,
    initialListeningSession,
    initialSectionSlug,
    playbackNodes,
    selectedVoice.provider,
    selectedVoice.voiceId,
    syncQueueTiming,
    updatePlayerCursorForNode,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!savedListeningSession?.activeNodeId) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/reader/listening-session", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentKey: documentData.documentKey,
            ...savedListeningSession,
            preferredVoiceProvider: selectedVoice.provider,
            preferredVoiceId: selectedVoice.voiceId,
            preferredListeningRate: playbackSpeedRef.current,
          }),
          signal: controller.signal,
        });
      } catch {
        // Listening sync is best effort; the next state change will retry.
      }
    }, 320);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [documentData.documentKey, savedListeningSession, selectedVoice.provider, selectedVoice.voiceId]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return undefined;
    }

    const activeNode =
      currentPlaybackNode ||
      (savedListeningSession?.activeNodeId
        ? getPlaybackNode(playbackNodes, savedListeningSession.activeNodeId)
        : null);
    const metadataTitle = activeNode?.label || documentData.title;
    const metadataArtist =
      activeNode?.kind === "selection"
        ? "Selection"
        : activeNode?.kind === "message"
          ? "Seven"
          : displayLabel;

    if (typeof MediaMetadata !== "undefined") {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadataTitle,
        artist: metadataArtist,
        album: documentData.title,
      });
    }

    navigator.mediaSession.playbackState = listeningPlaying ? "playing" : "paused";

    navigator.mediaSession.setActionHandler("play", () => {
      void handlePrimaryPlayPause();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      void handlePrimaryPlayPause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      void handlePlaybackSectionStep(-1);
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      void handlePlaybackSectionStep(1);
    });
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      void handleAudioSkip(-15);
    });
    navigator.mediaSession.setActionHandler("seekforward", () => {
      void handleAudioSkip(30);
    });

    return () => {
      const actions = [
        "play",
        "pause",
        "previoustrack",
        "nexttrack",
        "seekbackward",
        "seekforward",
      ];
      actions.forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore unsupported actions.
        }
      });
    };
  }, [
    currentPlaybackNode,
    displayLabel,
    documentData.title,
    handleAudioSkip,
    handlePlaybackSectionStep,
    handlePrimaryPlayPause,
    listeningPlaying,
    playbackNodes,
    savedListeningSession?.activeNodeId,
  ]);

  useEffect(() => {
    if (
      (runtimeAudioState.sourceType !== "flow" &&
        runtimeAudioState.sourceType !== "section" &&
        runtimeAudioState.sourceType !== "selection") ||
      runtimeAudioState.status === "idle"
    ) {
      return;
    }

    setPlayerState((current) => {
      if (
        current.sourceType === runtimeAudioState.sourceType &&
        current.status === runtimeAudioState.status &&
        current.providerMode === runtimeAudioState.mode
      ) {
        return current;
      }

      return {
        ...current,
        sourceType: runtimeAudioState.sourceType,
        status: runtimeAudioState.status,
        providerMode: runtimeAudioState.mode,
      };
    });
  }, [runtimeAudioState.mode, runtimeAudioState.sourceType, runtimeAudioState.status]);

  useEffect(() => {
    document.body.classList.remove("is-lock-screen");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const scrollToHash = () => {
      const targetSlug =
        window.location.hash.replace("#", "") ||
        initialReadingProgress?.sectionSlug ||
        "beginning";
      const target = document.getElementById(targetSlug);
      if (!target) return;

      scrollIntentRef.current = true;
      window.requestAnimationFrame(() => {
        scrollReaderTarget(target, { block: "start", behavior: "auto" });
        window.setTimeout(() => {
          scrollIntentRef.current = false;
        }, 120);
      });
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [initialReadingProgress?.sectionSlug]);

  useEffect(() => {
    const handleProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollable <= 0 ? 0 : Math.min(window.scrollY / scrollable, 1);
      setProgress(nextProgress);
    };

    handleProgress();
    window.addEventListener("scroll", handleProgress, { passive: true });
    window.addEventListener("resize", handleProgress);
    return () => {
      window.removeEventListener("scroll", handleProgress);
      window.removeEventListener("resize", handleProgress);
    };
  }, []);

  useEffect(() => {
    const observed = blocks.map((block) => block.element).filter(Boolean);
    if (observed.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (items) => {
        const center = window.innerHeight * 0.42;
        const visible = items
          .filter((item) => item.isIntersecting)
          .sort((left, right) => {
            const leftDistance = Math.abs(left.boundingClientRect.top - center);
            const rightDistance = Math.abs(right.boundingClientRect.top - center);
            return leftDistance - rightDistance;
          });

        if (!visible[0]) return;

        const blockId = visible[0].target.getAttribute("data-block-id");
        if (!blockId) return;

        const nextBlock = blocks.find((block) => block.blockId === blockId);
        if (!nextBlock) return;

        setViewportBlockId(blockId);
        setViewportSectionSlug(nextBlock.sectionSlug);
      },
      {
        rootMargin: "-28% 0px -42% 0px",
        threshold: [0, 0.2, 0.45, 0.7, 0.9],
      },
    );

    observed.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [blocks]);

  useEffect(() => {
    if (!listeningTransportActive || !playerCursor.blockId) return;
    if (lastAutoscrollBlockRef.current === playerCursor.blockId) return;

    const target = blocks.find((block) => block.blockId === playerCursor.blockId)?.element;
    if (!target) return;

    lastAutoscrollBlockRef.current = playerCursor.blockId;
    scrollIntentRef.current = true;
    target.scrollIntoView({
      behavior: getScrollBehavior(),
      block: "center",
    });
    window.setTimeout(() => {
      scrollIntentRef.current = false;
    }, 320);
  }, [blocks, listeningTransportActive, playerCursor.blockId]);

  useEffect(() => {
    if (scrollIntentRef.current) return;
    syncReaderUrl({
      panel: URL_SYNC_OVERLAYS.has(activeOverlay) ? activeOverlay : null,
      hash: viewportSectionSlug === "beginning" ? "" : viewportSectionSlug,
      historyMode: "replace",
    });
  }, [activeOverlay, viewportSectionSlug]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (selectionState?.mode === "note") {
        setSelectionState(null);
        setNoteDraft("");
        clearBrowserSelection();
        return;
      }

      if (activeOverlay) {
        closeOverlay({ restoreFocus: false });
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeOverlay, closeOverlay, selectionState?.mode]);

  useEffect(() => {
    document.title = `${documentData.title} · ${displayEntry.title}`;
  }, [displayEntry.title, documentData.title]);

  useEffect(() => {
    const handleReaderKeys = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName));

      if (isEditable) return;

      if ((event.key === "ArrowRight" || event.key === "j") && nextEntry) {
        event.preventDefault();
        jumpTo(nextEntry.slug);
      }

      if ((event.key === "ArrowLeft" || event.key === "k") && previousEntry) {
        event.preventDefault();
        jumpTo(previousEntry.slug);
      }

      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        openOverlay("contents");
      }

      if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        openListenTray();
      }

      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        openOverlay("notebook");
      }

      if (event.key.toLowerCase() === "7") {
        event.preventDefault();
        openSevenView("guide");
      }

      if (event.key.toLowerCase() === "d") {
        event.preventDefault();
        openOverlay("more");
      }

      if (event.key === " ") {
        event.preventDefault();
        void handlePrimaryPlayPause();
      }
    };

    window.addEventListener("keydown", handleReaderKeys);
    return () => window.removeEventListener("keydown", handleReaderKeys);
  }, [
    handlePrimaryPlayPause,
    jumpTo,
    nextEntry,
    openListenTray,
    openOverlay,
    openSevenView,
    previousEntry,
  ]);

  useEffect(() => {
    const syncSelection = () => {
      const anchor = getSelectionAnchor();

      if (!anchor) {
        setSelectionState((current) => (current?.mode === "note" ? current : null));
        return;
      }

      if (anchor.reason === "multi-block") {
        setSelectionState(null);
        showSelectionNotice("Select within one paragraph or list item.");
        return;
      }

      dismissSurfacesWithoutFocus();
      setSelectionState({
        mode: "actions",
        anchor,
        point: anchor.point,
      });
    };

    const handleSelectionChange = () => {
      window.requestAnimationFrame(syncSelection);
    };

    const dismissSelectionUi = () => {
      setSelectionState((current) => (current?.mode === "note" ? current : null));
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("scroll", dismissSelectionUi, { passive: true });
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("scroll", dismissSelectionUi);
    };
  }, [dismissSurfacesWithoutFocus, showSelectionNotice]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
      if (focusTimeoutRef.current) window.clearTimeout(focusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedMarksRef.current) {
      hasHydratedMarksRef.current = true;
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/reader/marks", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentKey: documentData.documentKey,
            ...readerAnnotations,
          }),
          signal: controller.signal,
        });
      } catch {
        // Keep local state responsive; retry on the next mutation.
      }
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [documentData.documentKey, readerAnnotations]);

  useEffect(() => {
    if (!hasHydratedProgressRef.current) {
      hasHydratedProgressRef.current = true;
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/reader/progress", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentKey: documentData.documentKey,
            sectionSlug: viewportSectionSlug,
            progressPercent,
          }),
          signal: controller.signal,
        });
      } catch {
        // Progress saves are best effort.
      }
    }, 320);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [documentData.documentKey, progressPercent, viewportSectionSlug]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePopState = () => {
      setActiveOverlay(getSyncedOverlayFromUrl());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    if (!activeOverlay || activeOverlay === "listen" || activeOverlay === "seven") {
      document.body.style.removeProperty("overflow");
      return undefined;
    }

    document.body.style.setProperty("overflow", "hidden");
    return () => document.body.style.removeProperty("overflow");
  }, [activeOverlay]);

  useEffect(() => () => stopRuntimeAudio(), [stopRuntimeAudio]);

  const handleToggleBookmark = useCallback(() => {
    setReaderAnnotations((current) =>
      toggleSectionBookmark(current, {
        sectionSlug: currentEntry.slug,
        label: currentLabel,
        excerpt: currentEntry.title,
      }),
    );
  }, [currentEntry.slug, currentEntry.title, currentLabel]);

  const handleCreateHighlight = useCallback(() => {
    if (!selectionState?.anchor) return;

    setReaderAnnotations((current) => addHighlight(current, selectionState.anchor));
    setSelectionState(null);
    setNoteDraft("");
    clearBrowserSelection();
  }, [selectionState?.anchor]);

  const handleStartNote = useCallback(() => {
    if (!selectionState?.anchor) return;

    setSelectionState((current) =>
      current
        ? {
            ...current,
            mode: "note",
          }
        : current,
    );
  }, [selectionState?.anchor]);

  const handleSaveNote = useCallback(() => {
    if (!selectionState?.anchor || !noteDraft.trim()) return;

    setReaderAnnotations((current) => addNote(current, selectionState.anchor, noteDraft));
    setSelectionState(null);
    setNoteDraft("");
    clearBrowserSelection();
  }, [noteDraft, selectionState?.anchor]);

  const addEvidenceItem = useCallback(
    async (input, successMessage = "Added to evidence.") => {
      try {
        const response = await fetch("/api/reader/evidence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentKey: documentData.documentKey,
            ...input,
          }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.ok || !payload?.item) {
          throw new Error(payload?.error || "Could not add to evidence.");
        }

        setEvidenceItems((current) => {
          const existingIndex = current.findIndex((item) => item.id === payload.item.id);
          if (existingIndex === -1) {
            return [...current, payload.item];
          }

          const next = [...current];
          next[existingIndex] = payload.item;
          return next;
        });
        showReceiptNotice(successMessage);
        return payload.item;
      } catch (error) {
        showReceiptNotice(error instanceof Error ? error.message : "Could not add to evidence.");
        return null;
      }
    },
    [documentData.documentKey, showReceiptNotice],
  );

  const removeEvidenceItem = useCallback(
    async (itemId, successMessage = "Removed from evidence.") => {
      try {
        const response = await fetch("/api/reader/evidence", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Could not remove from evidence.");
        }

        setEvidenceItems((current) => current.filter((item) => item.id !== itemId));
        showReceiptNotice(successMessage);
        return true;
      } catch (error) {
        showReceiptNotice(
          error instanceof Error ? error.message : "Could not remove from evidence.",
        );
        return false;
      }
    },
    [showReceiptNotice],
  );

  const handleAddSelectionToEvidence = useCallback(() => {
    if (!selectionState?.anchor) return;

    void addEvidenceItem(
      {
        origin: "reader",
        sourceType: "passage",
        sectionSlug: selectionState.anchor.sectionSlug,
        sectionTitle: selectionState.anchor.sectionTitle,
        blockId: selectionState.anchor.blockId,
        startOffset: selectionState.anchor.startOffset,
        endOffset: selectionState.anchor.endOffset,
        quote: selectionState.anchor.quote,
        excerpt: selectionState.anchor.quote,
      },
      "Added passage to evidence.",
    );
    openSevenView("evidence");
    setSelectionState(null);
    setNoteDraft("");
    clearBrowserSelection();
  }, [addEvidenceItem, openSevenView, selectionState?.anchor]);

  const handleToggleMarkEvidence = useCallback(
    (mark) => {
      const existing = evidenceItems.find((item) => item.sourceMarkId === mark.id);
      if (existing) {
        void removeEvidenceItem(existing.id, "Removed mark from evidence.");
        return;
      }

      void addEvidenceItem(
        {
          origin: "reader",
          sourceType: mark.type === "note" ? "note" : "highlight",
          sectionSlug: mark.sectionSlug,
          sectionTitle: mark.sectionTitle,
          blockId: mark.blockId || null,
          startOffset: mark.startOffset,
          endOffset: mark.endOffset,
          quote: mark.quote || mark.excerpt,
          excerpt: mark.excerpt || mark.quote,
          noteText: mark.noteText || "",
          sourceMarkId: mark.id,
        },
        mark.type === "note" ? "Added note to evidence." : "Added highlight to evidence.",
      );
      openSevenView("evidence");
    },
    [addEvidenceItem, evidenceItems, openSevenView, removeEvidenceItem],
  );

  const handleDeleteHighlight = useCallback(
    (highlightId) => {
      setReaderAnnotations((current) => deleteHighlight(current, highlightId));
      const existing = evidenceItems.find((item) => item.sourceMarkId === highlightId);
      if (existing) {
        void removeEvidenceItem(existing.id, "Removed highlight from evidence.");
      }
    },
    [evidenceItems, removeEvidenceItem],
  );

  const handleDeleteNote = useCallback(
    (noteId) => {
      setReaderAnnotations((current) => deleteNote(current, noteId));
      const existing = evidenceItems.find((item) => item.sourceMarkId === noteId);
      if (existing) {
        void removeEvidenceItem(existing.id, "Removed note from evidence.");
      }
    },
    [evidenceItems, removeEvidenceItem],
  );

  const handleUpdateNote = useCallback(
    (noteId, nextText) => {
      let nextNote = null;
      setReaderAnnotations((current) => {
        const updated = updateNote(current, noteId, nextText);
        nextNote = updated.notes.find((note) => note.id === noteId) || null;
        return updated;
      });

      const existing = evidenceItems.find((item) => item.sourceMarkId === noteId);
      if (existing && nextNote) {
        void addEvidenceItem(
          {
            origin: "reader",
            sourceType: "note",
            sectionSlug: nextNote.sectionSlug,
            sectionTitle: nextNote.sectionTitle,
            blockId: nextNote.blockId || null,
            startOffset: nextNote.startOffset,
            endOffset: nextNote.endOffset,
            quote: nextNote.quote || nextNote.excerpt,
            excerpt: nextNote.excerpt || nextNote.quote,
            noteText: nextNote.noteText || "",
            sourceMarkId: nextNote.id,
          },
          "Updated note in evidence.",
        );
      }
    },
    [addEvidenceItem, evidenceItems],
  );

  return (
    <div
      className={`reader-shell reader-shell--authenticated-reset text-size-${preferences.textSize} page-width-${preferences.pageWidth} ${
        hasOpenOverlay ? "has-floating-panel" : ""
      } ${lyricFocusBlockId ? "has-lyric-focus" : ""} ${
        hasTrailingPanel ? "has-trailing-panel" : ""
      }`}
      data-theme={preferences.theme}
    >
      <div
        className="reader-progress-bar"
        aria-hidden="true"
        style={{ transform: `scaleX(${progress})` }}
      />
      <div className="reader-player-ambient" aria-hidden="true" />

      <header className="reader-player-topbar">
        <button
          type="button"
          className="reader-player-topbar__library"
          onClick={openLibraryPage}
          aria-label="Return to library"
          title="Library"
        >
          <span>Library</span>
        </button>

        <div className="reader-player-topbar__identity">
          <p className="reader-player-topbar__book">{documentData.title}</p>
          <div className="reader-player-topbar__details">
            <p className="reader-player-topbar__section">{displayLabel}</p>
            <p className="reader-player-topbar__meta">
              <span>{displayIndex}</span>
              <span>/</span>
              <span>{entries.length}</span>
            </p>
          </div>
        </div>

        <div className="reader-player-topbar__actions">
          <button
            type="button"
            className={`reader-player-topbar__listen ${listenScene !== "hidden" ? "is-active" : ""}`}
            onClick={(event) => openListenTray(event)}
            aria-pressed={listenScene !== "hidden"}
            aria-label={listenScene === "hidden" ? "Open player" : "Open listening focus"}
          >
            <ListenIcon />
          </button>
          <button
            type="button"
            className={`reader-player-topbar__utility reader-player-topbar__tools ${toolsOpen ? "is-active" : ""}`}
            onClick={(event) => openOverlay("more", event)}
            aria-expanded={toolsOpen}
            aria-label="Open document actions"
          >
            <MoreIcon />
            <span className="reader-player-topbar__tools-label">More</span>
          </button>
        </div>
      </header>

      {showSevenLauncher ? (
        <button
          type="button"
          className="reader-seven-launcher"
          onClick={(event) => openSevenView("guide", event)}
          aria-label="Open Seven"
        >
          <SevenIcon />
          <span>Seven</span>
        </button>
      ) : null}

      {toolsOpen ? (
        <div className="reader-more-sheet" role="dialog" aria-label="Document actions">
          <div className="reader-more-sheet__header">
            <div className="reader-more-sheet__heading">
              <p className="reader-more-sheet__eyebrow">Current document</p>
              <h2 className="reader-more-sheet__title">{documentData.title}</h2>
              <p className="reader-more-sheet__current">{currentLabel}</p>
            </div>
            <button
              type="button"
              className="reader-more-sheet__close"
              onClick={() => closeOverlay()}
              aria-label="Close document actions"
            >
              ×
            </button>
          </div>

          <div className="reader-more-sheet__quick-actions">
            <button
              type="button"
              className={`reader-more-sheet__quick-button ${contentsOpen ? "is-active" : ""}`}
              onClick={(event) => openOverlay("contents", event)}
            >
              <ContentsIcon />
              <span>Contents</span>
            </button>
            <button
              type="button"
              className={`reader-more-sheet__quick-button ${notebookOpen ? "is-active" : ""}`}
              onClick={(event) => openOverlay("notebook", event)}
            >
              <NotebookIcon />
              <span>Notebook</span>
            </button>
            <button
              type="button"
              className={`reader-more-sheet__quick-button ${sevenOpen ? "is-active" : ""}`}
              onClick={(event) => openSevenView("guide", event)}
            >
              <SevenIcon />
              <span>Seven</span>
            </button>
          </div>

          <div className="reader-more-sheet__actions">
            <button
              type="button"
              className="reader-more-sheet__link"
              onClick={handleToggleBookmark}
              aria-pressed={currentBookmarked}
            >
              {currentBookmarked ? "Remove bookmark" : "Bookmark this section"}
            </button>
          </div>

          <div className="reader-more-sheet__section">
            <p className="reader-more-sheet__section-title">Display</p>
            <PreferenceGroup
              title="Text size"
              value={preferences.textSize}
              options={TEXT_SIZE_LABELS}
              onChange={(value) => setPreferences((current) => ({ ...current, textSize: value }))}
            />
            <PreferenceGroup
              title="Reading width"
              value={preferences.pageWidth}
              options={PAGE_WIDTH_LABELS}
              onChange={(value) => setPreferences((current) => ({ ...current, pageWidth: value }))}
            />
            <PreferenceGroup
              title="Theme"
              value={preferences.theme}
              options={THEME_LABELS}
              onChange={(value) => setPreferences((current) => ({ ...current, theme: value }))}
            />
          </div>

          <div className="reader-more-sheet__actions">
            <button
              type="button"
              className="reader-more-sheet__link"
              onClick={openAccountPage}
            >
              Open account
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={`reader-overlay ${
          hasOpenOverlay && activeOverlay !== "listen" && activeOverlay !== "seven"
            ? "is-visible"
            : ""
        }`}
        onClick={() => closeOverlay({ restoreFocus: false })}
      />

      <aside className={`reader-toc ${contentsOpen ? "is-open" : ""}`} aria-hidden={!contentsOpen}>
        <div className="reader-toc__header">
          <div className="reader-toc__header-copy">
            <p className="reader-toc__eyebrow">Contents</p>
            <h2 className="reader-toc__title">{documentData.title}</h2>
            <p className="reader-toc__status">
              <span>{currentLabel}</span>
              <span>{progressPercent}% read</span>
            </p>
          </div>

          <div className="reader-toc__header-actions">
            <button
              type="button"
              className="reader-toc__back"
              onClick={() => jumpTo(viewportSectionSlug)}
            >
              Back to current
            </button>
            <button
              type="button"
              className="reader-player-topbar__utility"
              onClick={() => closeOverlay()}
              aria-label="Close contents"
            >
              ×
            </button>
          </div>
        </div>

        <nav className="reader-toc__nav" aria-label="Table of contents">
          {entries.map((entry) => (
            <button
              key={entry.slug}
              type="button"
              className={`reader-toc__item ${entry.slug === viewportSectionSlug ? "is-active" : ""}`}
              onClick={() => jumpTo(entry.slug)}
            >
              <span className="reader-toc__item-label">{entry.title}</span>
              {entry.number ? (
                <span className="reader-toc__item-meta">{entry.number}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <ReaderMarksPanel
        open={notebookOpen}
        currentLabel={currentLabel}
        progressPercent={progressPercent}
        scope={notebookScope}
        onScopeChange={setNotebookScope}
        currentBookmarked={currentBookmarked}
        onToggleBookmark={handleToggleBookmark}
        bookmarks={visibleBookmarks}
        highlights={visibleHighlights}
        notes={visibleNotes}
        evidenceMarkIds={evidenceMarkIds}
        onToggleMarkEvidence={handleToggleMarkEvidence}
        onOpenSeven={(trigger) => openSevenView("evidence", trigger)}
        onClose={() => closeOverlay()}
        onJumpToBookmark={jumpToMark}
        onJumpToMark={jumpToMark}
        onDeleteBookmark={(bookmarkId) =>
          setReaderAnnotations((current) => deleteBookmark(current, bookmarkId))
        }
        onDeleteHighlight={handleDeleteHighlight}
        onDeleteNote={handleDeleteNote}
        onUpdateNote={handleUpdateNote}
      />

      <ReaderListenTray
        scene={listenScene}
        sheet={listenSheet}
        guideOpen={sevenOpen}
        currentLabel={displayLabel}
        sectionLabel={displayLabel}
        heroText={heroPlaybackText}
        progress={queueProgress}
        elapsed={queueElapsedSeconds}
        duration={queueDurationSeconds}
        speed={playbackSpeed}
        scope={playerState.sourceType}
        voiceLabel={voiceSurfaceLabel}
        providerBadge={voiceProviderBadge}
        queuePosition={playerState.currentIndex >= 0 ? playerState.currentIndex + 1 : 0}
        queueLength={playerState.queue.length}
        canGoPrevious={Boolean(previousEntry)}
        canGoNext={Boolean(nextEntry)}
        canSeek={playerState.queue.length > 0}
        queueItems={queueItems}
        voiceOptions={availableVoiceOptions}
        isPlaying={listeningPlaying}
        isLoading={playerState.status === "loading"}
        onOpenFocus={() => openListenTray()}
        onCollapse={collapseListenTray}
        onClose={closeListenTray}
        onPlayPause={() => void handlePrimaryPlayPause()}
        onPrevious={() => void handlePlaybackSectionStep(-1)}
        onNext={() => void handlePlaybackSectionStep(1)}
        onSkipBack={() => void handleAudioSkip(-15)}
        onSkipForward={() => void handleAudioSkip(30)}
        onSeek={(nextProgress) => void handleSeek(nextProgress)}
        onSpeedChange={handleSpeedChange}
        onOpenQueue={() => setListenSheet("queue")}
        onOpenVoice={() => setListenSheet("voice")}
        onCloseSheet={() => setListenSheet(null)}
        onSelectQueueItem={(nodeId) => void handleJumpToQueueItem(nodeId)}
        onSelectVoice={handleSelectVoice}
        onToggleGuide={() => openSevenView("guide")}
      />

      <SevenPanel
        open={sevenOpen}
        view={sevenView}
        onChangeView={setSevenView}
        textEnabled={sevenTextEnabled}
        textProvider={sevenTextProvider}
        effectiveVoiceEnabled={effectiveVoiceEnabled}
        liveStatus={liveStatus}
        showStatus={showStatus}
        documentData={documentData}
        activeSlug={displaySectionSlug}
        currentLabel={displayLabel}
        initialThread={initialConversationThread}
        evidenceItems={evidenceItems}
        onAddEvidenceItem={addEvidenceItem}
        onRemoveEvidenceItem={removeEvidenceItem}
        onShowNotice={showReceiptNotice}
        onClose={() => closeOverlay()}
        onOpenListen={() => openListenTray()}
        messageAudioState={runtimeAudioState}
        onPlayMessage={playMessageAudio}
        onStopMessage={stopMessageAudio}
      />

      <main className="reader-main">
        <div className="reader-column">
          <article className="reader-book">
            <section
              id="beginning"
              data-section-slug="beginning"
              data-section-title="Beginning"
              className={`reader-beginning ${
                focusedSectionSlug === "beginning" ? "is-focused-source" : ""
              } ${lyricSectionSlug === "beginning" ? "is-lyric-section" : ""}`}
            >
              <p className="reader-beginning__eyebrow">Reading Instrument</p>
              <h1 className="reader-beginning__title">{documentData.title}</h1>
              <p className="reader-beginning__subtitle">{documentData.subtitle}</p>
              <MarkdownRenderer
                markdown={documentData.introMarkdown}
                sectionSlug="beginning"
                className="reader-front-matter"
                marksByBlock={marksByBlock}
                activeMarkId={activeMarkId}
                activeBlockId={lyricFocusBlockId}
                nextBlockId={lyricNextBlock?.blockId || null}
                onRegisterBlock={registerBlock}
                onUnregisterBlock={unregisterBlock}
              />
            </section>

            {documentData.sections.map((section) => (
              <section
                id={section.slug}
                key={section.slug}
                data-section-slug={section.slug}
                data-section-title={section.title}
                className={`reader-section ${
                  focusedSectionSlug === section.slug ? "is-focused-source" : ""
                } ${lyricSectionSlug === section.slug ? "is-lyric-section" : ""}`}
              >
                {!(
                  documentData.sourceType === "upload" &&
                  documentData.sections.length === 1 &&
                  String(section.title || "").trim().toLowerCase() ===
                    String(documentData.title || "").trim().toLowerCase()
                ) ? (
                  <>
                    <div className="reader-section__divider" />
                    <div className="reader-section__meta">
                      {documentData.sourceType !== "upload" && section.number ? (
                        <span className="reader-section__number">{section.number}</span>
                      ) : null}
                      <span className="reader-section__label">{section.title}</span>
                    </div>
                    <h2 className="reader-section__title">{section.title}</h2>
                  </>
                ) : null}
                <MarkdownRenderer
                  markdown={section.markdown}
                  sectionSlug={section.slug}
                  marksByBlock={marksByBlock}
                  activeMarkId={activeMarkId}
                  activeBlockId={lyricFocusBlockId}
                  nextBlockId={lyricNextBlock?.blockId || null}
                  onRegisterBlock={registerBlock}
                  onUnregisterBlock={unregisterBlock}
                />
              </section>
            ))}
          </article>
        </div>
      </main>

      <SelectionMenu
        selection={selectionState}
        noteDraft={noteDraft}
        onPlaySelection={() => void handlePlaySelection()}
        onStartFromSelection={() => void handleStartFromSelection()}
        onQueueSelection={() => handleQueueSelectionNext()}
        onHighlight={handleCreateHighlight}
        onAddToEvidence={handleAddSelectionToEvidence}
        onStartNote={handleStartNote}
        onChangeNoteDraft={setNoteDraft}
        onSaveNote={handleSaveNote}
        onCancel={() => {
          setSelectionState(null);
          setNoteDraft("");
          clearBrowserSelection();
        }}
      />

      {selectionNotice ? <div className="reader-toast">{selectionNotice}</div> : null}
      {receiptNotice ? <div className="reader-toast is-receipt">{receiptNotice}</div> : null}
    </div>
  );
}

function PreferenceGroup({ title, value, options, onChange }) {
  return (
    <div className="reader-pref-group">
      <div className="reader-pref-group__title">{title}</div>
      <div className="reader-pref-group__options">
        {Object.entries(options).map(([optionValue, label]) => (
          <button
            key={optionValue}
            type="button"
            className={`reader-pref-option ${value === optionValue ? "is-active" : ""}`}
            onClick={() => onChange(optionValue)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
