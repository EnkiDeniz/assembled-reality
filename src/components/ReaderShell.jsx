"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars -- motion.button used in JSX
import { AnimatePresence, motion } from "motion/react";
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
  getNarrationText,
  getSevenProviderLabel,
  parseSevenAudioHeaders,
  splitTextForSpeech,
} from "../lib/seven";
import {
  buildPlaybackQueue,
  getBlockIndex,
  getFirstSectionBlock,
  getNextBlock,
  getSectionBlocks,
  sortReaderBlocks,
} from "../lib/reader-player";
import { EMPTY_READER_ANNOTATIONS } from "../lib/reader-store";
import { clearBrowserSelection, getSelectionAnchor } from "../lib/selection";
import { saveReaderPreferences } from "../lib/storage";

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
  paper: "Paper",
  dark: "Dark",
};

const URL_SYNC_SURFACES = new Set(["contents", "notebook", "seven"]);

function getSyncedSurfaceFromUrl() {
  if (typeof window === "undefined") return null;

  const panel = new URLSearchParams(window.location.search).get("panel");
  return URL_SYNC_SURFACES.has(panel) ? panel : null;
}

function syncReaderUrl({ panel = null, hash = undefined, historyMode = "replace" } = {}) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (panel && URL_SYNC_SURFACES.has(panel)) {
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

function createIdleRuntimeAudioState(preferredVoiceProvider) {
  return {
    status: "idle",
    label: "",
    index: 0,
    total: 0,
    mode: preferredVoiceProvider ? "provider" : "device",
    sourceType: null,
    sourceId: null,
  };
}

function initialVoiceStatus({ voiceEnabled, browserSpeechEnabled, preferredVoiceProvider }) {
  if (voiceEnabled) {
    return {
      state: "ready",
      provider: preferredVoiceProvider,
      fallbackFrom: null,
      reasonCode: "",
      message: `Voice is ready through ${getSevenProviderLabel(preferredVoiceProvider)}.`,
    };
  }

  if (browserSpeechEnabled) {
    return {
      state: "device",
      provider: "device",
      fallbackFrom: null,
      reasonCode: "",
      message: "Listening is available through your device voice.",
    };
  }

  return {
    state: "offline",
    provider: preferredVoiceProvider,
    fallbackFrom: null,
    reasonCode: "provider_unavailable",
    message: "Seven's voice is unavailable right now.",
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
  const top = target.getBoundingClientRect().top + window.scrollY - topbarHeight - 20;

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

export default function ReaderShell({
  documentData,
  preferences,
  setPreferences,
  initialReaderAnnotations = EMPTY_READER_ANNOTATIONS,
  initialReadingProgress = null,
  initialConversationThread = null,
  initialEvidenceSet = null,
  profile = null,
  sessionUser = null,
  getReceiptsConnection: _getReceiptsConnection = null,
  sevenTextEnabled = false,
  sevenVoiceEnabled = false,
  sevenTextProvider = null,
  sevenVoiceProvider = null,
}) {
  const initialHash =
    typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
  const initialSectionSlug = initialHash || initialReadingProgress?.sectionSlug || "beginning";

  const [activeSurface, setActiveSurface] = useState(() => getSyncedSurfaceFromUrl());
  const [viewportSectionSlug, setViewportSectionSlug] = useState(initialSectionSlug);
  const [viewportBlockId, setViewportBlockId] = useState(null);
  const [playerCursor, setPlayerCursor] = useState({
    sectionSlug: initialSectionSlug,
    blockId: null,
    blockIndex: -1,
  });
  const [playerState, setPlayerState] = useState(() => ({
    status: "idle",
    sourceType: "document",
    providerMode: sevenVoiceEnabled ? "provider" : "device",
    queue: [],
    currentIndex: -1,
    overlay: null,
  }));
  const [runtimeAudioState, setRuntimeAudioState] = useState(() =>
    createIdleRuntimeAudioState(sevenVoiceProvider),
  );
  const [browserSpeechEnabled, setBrowserSpeechEnabled] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(() =>
    initialVoiceStatus({
      voiceEnabled: sevenVoiceEnabled,
      browserSpeechEnabled: false,
      preferredVoiceProvider: sevenVoiceProvider,
    }),
  );
  const [audioError, setAudioError] = useState("");
  const [audioTimeState, setAudioTimeState] = useState({
    elapsed: 0,
    duration: 0,
    chunkElapsed: 0,
    chunkDuration: 0,
  });
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
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
  const [listenTrayState, setListenTrayState] = useState("closed");
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

  const entries = useMemo(
    () => [
      { slug: "beginning", label: "Beginning", title: "Beginning", number: null },
      ...documentData.sections.map((section) => ({
        slug: section.slug,
        label: `${section.number} · ${section.title}`,
        title: section.title,
        number: section.number,
      })),
    ],
    [documentData.sections],
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
  const memberName =
    profile?.displayName ||
    sessionUser?.readerName ||
    sessionUser?.name ||
    sessionUser?.email ||
    "Reader";
  const memberInitial = memberName.trim().charAt(0).toUpperCase() || "R";
  const currentBookmarked = hasSectionBookmark(readerAnnotations, currentEntry.slug);
  const contentsOpen = activeSurface === "contents";
  const notebookOpen = activeSurface === "notebook";
  const sevenOpen = activeSurface === "seven";
  const appearanceOpen = activeSurface === "appearance";
  const hasFloatingPanel = contentsOpen || notebookOpen || sevenOpen;
  const effectiveVoiceEnabled = sevenVoiceEnabled || browserSpeechEnabled;

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

  const documentTransportActive =
    runtimeAudioState.sourceType === "document" &&
    (playerState.status === "loading" ||
      playerState.status === "playing" ||
      playerState.status === "paused");
  const sectionTransportActive =
    runtimeAudioState.sourceType === "section" &&
    (playerState.status === "loading" ||
      playerState.status === "playing" ||
      playerState.status === "paused");
  const listeningTransportActive = documentTransportActive || sectionTransportActive;
  const listeningPlaying =
    listeningTransportActive &&
    (playerState.status === "loading" || playerState.status === "playing");
  const continueDocumentActive =
    runtimeAudioState.sourceType === "document" && runtimeAudioState.status !== "idle";

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

  const canContinueDocument = blocks.length > 0 && Boolean(lyricFocusBlockId);
  const canListenCurrentSection = Boolean(getNarrationText(documentData, displaySectionSlug));

  const sectionBlocks = useMemo(
    () => blocksBySection[displaySectionSlug] || [],
    [blocksBySection, displaySectionSlug],
  );
  const sectionProgress = useMemo(() => {
    if (sectionTransportActive) {
      if (runtimeAudioState.total <= 0) return 0;
      return Math.min(1, runtimeAudioState.index / runtimeAudioState.total);
    }

    if (sectionBlocks.length === 0) return 0;

    const referenceBlockId =
      documentTransportActive && playerCursor.blockId ? playerCursor.blockId : lyricFocusBlockId;
    const currentSectionIndex = Math.max(
      0,
      sectionBlocks.findIndex((block) => block.blockId === referenceBlockId),
    );
    const chunkProgress =
      documentTransportActive && runtimeAudioState.total > 0
        ? runtimeAudioState.index / runtimeAudioState.total
        : 0;

    return Math.min(1, (currentSectionIndex + chunkProgress) / sectionBlocks.length);
  }, [
    documentTransportActive,
    lyricFocusBlockId,
    playerCursor.blockId,
    runtimeAudioState,
    sectionBlocks,
    sectionTransportActive,
  ]);

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

  const closeSurface = useCallback(
    ({ restoreFocus = true, historyMode = "replace" } = {}) => {
      if (activeSurface && URL_SYNC_SURFACES.has(activeSurface)) {
        syncReaderUrl({ panel: null, historyMode });
      }

      setActiveSurface(null);

      if (restoreFocus) {
        restoreSurfaceFocus();
      }
    },
    [activeSurface, restoreSurfaceFocus],
  );

  const toggleSurface = useCallback(
    (surface, trigger = null) => {
      if (trigger?.currentTarget instanceof HTMLElement) {
        surfaceTriggerRef.current = trigger.currentTarget;
      }

      if (activeSurface === surface) {
        closeSurface();
        return;
      }

      setSelectionState(null);
      setNoteDraft("");
      clearBrowserSelection();

      if (URL_SYNC_SURFACES.has(surface)) {
        syncReaderUrl({
          panel: surface,
          historyMode:
            activeSurface && URL_SYNC_SURFACES.has(activeSurface) ? "replace" : "push",
        });
      } else if (activeSurface && URL_SYNC_SURFACES.has(activeSurface)) {
        syncReaderUrl({ panel: null, historyMode: "replace" });
      }

      setActiveSurface(surface);
    },
    [activeSurface, closeSurface],
  );

  const dismissSurfacesWithoutFocus = useCallback(() => {
    if (!activeSurface) return;
    closeSurface({ restoreFocus: false });
  }, [activeSurface, closeSurface]);

  const openSevenView = useCallback(
    (view, trigger = null) => {
      setSevenView(view === "evidence" ? "evidence" : "guide");
      if (trigger?.currentTarget instanceof HTMLElement) {
        surfaceTriggerRef.current = trigger.currentTarget;
      }

      setListenTrayState((current) => {
        if (listeningTransportActive) {
          return "collapsed";
        }

        return current === "open" ? "closed" : current;
      });

      if (activeSurface === "seven") {
        return;
      }

      toggleSurface("seven", trigger);
    },
    [activeSurface, listeningTransportActive, toggleSurface],
  );

  const openListenTray = useCallback(() => {
    if (activeSurface) {
      closeSurface({ restoreFocus: false });
    }

    setListenTrayState("open");
  }, [activeSurface, closeSurface]);

  const collapseListenTray = useCallback(() => {
    setListenTrayState((current) => {
      if (current === "closed") return current;
      return listeningTransportActive ? "collapsed" : "closed";
    });
  }, [listeningTransportActive]);

  const closeListenTray = useCallback(() => {
    setListenTrayState(listeningTransportActive ? "collapsed" : "closed");
  }, [listeningTransportActive]);

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
    if (typeof window === "undefined") return;
    window.location.assign("/account");
  }, []);

  const clearAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const stopRuntimeAudio = useCallback(
    ({ resetState = true } = {}) => {
      audioSessionRef.current += 1;
      setAudioError("");

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
        setRuntimeAudioState(createIdleRuntimeAudioState(sevenVoiceProvider));
      }
    },
    [clearAudioUrl, sevenVoiceProvider],
  );

  const pauseRuntimeAudio = useCallback(() => {
    setAudioError("");

    if (audioRef.current) {
      audioRef.current.pause();
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }

    setRuntimeAudioState((current) =>
      current.status === "playing" ? { ...current, status: "paused" } : current,
    );
  }, []);

  const resumeRuntimeAudio = useCallback(async () => {
    if (runtimeAudioState.status !== "paused") return;

    try {
      if (audioRef.current) {
        await audioRef.current.play();
      } else if (typeof window !== "undefined" && window.speechSynthesis) {
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
  }, [runtimeAudioState.status, stopRuntimeAudio]);

  const handleSpeedChange = useCallback(
    (rate) => {
      setPlaybackSpeed(rate);
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
    },
    [],
  );

  const handleAudioSkip = useCallback(
    (offsetSeconds) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + offsetSeconds),
      );
    },
    [],
  );

  const fetchAudioChunk = useCallback(async (text) => {
    const response = await fetch("/api/seven/audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const payload = await response.json();
        throw createSevenApiError(payload, "The player could not generate audio.");
      }

      throw new Error("The player could not generate audio.");
    }

    const blob = await response.blob();
    return {
      blob,
      meta: parseSevenAudioHeaders(response.headers),
    };
  }, []);

  const playWithDeviceVoice = useCallback(
    async (chunks, label, sessionId, sourceType, sourceId) => {
      if (
        typeof window === "undefined" ||
        typeof window.speechSynthesis === "undefined" ||
        typeof window.SpeechSynthesisUtterance === "undefined"
      ) {
        throw new Error("Voice playback is unavailable right now.");
      }

      const synth = window.speechSynthesis;
      synth.cancel();

      const speakChunk = async (chunkIndex) => {
        if (audioSessionRef.current !== sessionId) return false;

        setRuntimeAudioState({
          status: "playing",
          label,
          index: chunkIndex + 1,
          total: chunks.length,
          mode: "device",
          sourceType,
          sourceId,
        });

        await new Promise((resolve, reject) => {
          const utterance = new window.SpeechSynthesisUtterance(chunks[chunkIndex]);
          utterance.rate = 0.96;
          utterance.pitch = 1;
          utterance.onend = () => resolve();
          utterance.onerror = () => reject(new Error("Device voice playback failed."));
          synth.speak(utterance);
        });

        if (audioSessionRef.current !== sessionId) return false;

        if (chunkIndex + 1 >= chunks.length) {
          setRuntimeAudioState(createIdleRuntimeAudioState(sevenVoiceProvider));
          return true;
        }

        return speakChunk(chunkIndex + 1);
      };

      return speakChunk(0);
    },
    [sevenVoiceProvider],
  );

  const playAudioText = useCallback(
    async (text, { label, sourceType, sourceId } = {}) => {
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
      setAudioTimeState({ elapsed: 0, duration: 0, chunkElapsed: 0, chunkDuration: 0 });
      const sessionId = audioSessionRef.current;
      setRuntimeAudioState({
        status: "loading",
        label,
        index: 0,
        total: chunks.length,
        mode: sevenVoiceEnabled ? "provider" : "device",
        sourceType,
        sourceId,
      });

      if (!sevenVoiceEnabled && browserSpeechEnabled) {
        try {
          const completed = await playWithDeviceVoice(
            chunks,
            label,
            sessionId,
            sourceType,
            sourceId,
          );
          setVoiceStatus({
            state: "device",
            provider: "device",
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
            provider: "device",
            fallbackFrom: null,
            reasonCode: "unknown_error",
            message,
          });
          setRuntimeAudioState(createIdleRuntimeAudioState(sevenVoiceProvider));
          return false;
        }
      }

      const playChunk = async (chunkIndex) => {
        if (audioSessionRef.current !== sessionId) return false;

        setRuntimeAudioState({
          status: "loading",
          label,
          index: chunkIndex + 1,
          total: chunks.length,
          mode: "provider",
          sourceType,
          sourceId,
        });

        const { blob, meta } = await fetchAudioChunk(chunks[chunkIndex]);
        if (audioSessionRef.current !== sessionId) return false;

        setVoiceStatus({
          state: "ready",
          provider: meta.provider || sevenVoiceProvider,
          fallbackFrom: meta.fallbackFrom,
          reasonCode: meta.fallbackReasonCode,
          message: meta.fallbackFrom
            ? buildSevenFallbackMessage({
                fallbackTo: meta.provider || "openai",
                fallbackFrom: meta.fallbackFrom,
                reasonCode: meta.fallbackReasonCode || "unknown_error",
              })
            : `Voice is ready through ${getSevenProviderLabel(meta.provider || sevenVoiceProvider)}.`,
        });

        clearAudioUrl();
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.playbackRate = playbackSpeed;

        const priorChunksDuration = chunkDurationsRef.current
          .slice(0, chunkIndex)
          .reduce((sum, d) => sum + d, 0);

        audio.addEventListener("loadedmetadata", () => {
          chunkDurationsRef.current[chunkIndex] = audio.duration;
          const known = chunkDurationsRef.current.filter((d) => d > 0);
          const avgDuration = known.reduce((s, d) => s + d, 0) / known.length;
          const knownSum = known.reduce((s, d) => s + d, 0);
          const unknownCount = chunks.length - known.length;
          setAudioTimeState((prev) => ({
            ...prev,
            chunkDuration: audio.duration,
            duration: knownSum + avgDuration * unknownCount,
          }));
        });

        audio.addEventListener("timeupdate", () => {
          setAudioTimeState((prev) => ({
            ...prev,
            chunkElapsed: audio.currentTime,
            elapsed: priorChunksDuration + audio.currentTime,
          }));
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
              });
            })
            .catch(reject);
        }).catch(() => {
          throw new Error("The player could not play this audio chunk.");
        });

        clearAudioUrl();
        audioRef.current = null;

        if (audioSessionRef.current !== sessionId) return false;

        if (chunkIndex + 1 >= chunks.length) {
          setRuntimeAudioState(createIdleRuntimeAudioState(sevenVoiceProvider));
          return true;
        }

        return playChunk(chunkIndex + 1);
      };

      try {
        return await playChunk(0);
      } catch (error) {
        if (audioSessionRef.current !== sessionId) return false;

        const sourceProvider =
          error?.fallbackFrom || error?.provider || sevenVoiceProvider || "openai";
        const sourceReason = error?.reasonCode || error?.fallbackReasonCode || "unknown_error";

        if (browserSpeechEnabled) {
          try {
            setAudioError("");
            setVoiceStatus({
              state: "device_fallback",
              provider: "device",
              fallbackFrom: sourceProvider,
              reasonCode: sourceReason,
              message: buildSevenFallbackMessage({
                fallbackTo: "device",
                fallbackFrom: sourceProvider,
                reasonCode: sourceReason,
              }),
            });

            return await playWithDeviceVoice(
              chunks,
              label,
              sessionId,
              sourceType,
              sourceId,
            );
          } catch (fallbackError) {
            const message =
              fallbackError instanceof Error
                ? fallbackError.message
                : "The player could not start speaking.";
            setAudioError(message);
            setVoiceStatus({
              state: "error",
              provider: "device",
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

        setRuntimeAudioState(createIdleRuntimeAudioState(sevenVoiceProvider));
        return false;
      }
    },
    [
      browserSpeechEnabled,
      clearAudioUrl,
      effectiveVoiceEnabled,
      fetchAudioChunk,
      playbackSpeed,
      playWithDeviceVoice,
      sevenVoiceEnabled,
      sevenVoiceProvider,
      stopRuntimeAudio,
    ],
  );

  const playDocumentQueue = useCallback(
    async ({ queue, startIndex = 0, startBlockId = null } = {}) => {
      const nextQueue =
        queue ||
        buildPlaybackQueue(
          blocks,
          startBlockId || playerCursor.blockId || lyricFocusBlockId || blocks[0]?.blockId,
        );

      if (!nextQueue.length) return;

      documentRunRef.current += 1;
      const runId = documentRunRef.current;

      setPlayerState((current) => ({
        ...current,
        status: "loading",
        queue: nextQueue,
        currentIndex: startIndex,
        providerMode: sevenVoiceEnabled ? "provider" : "device",
      }));

      for (let index = startIndex; index < nextQueue.length; index += 1) {
        if (documentRunRef.current !== runId) return;

        const block = nextQueue[index];
        const blockIndex = getBlockIndex(blocks, block.blockId);

        setPlayerCursor({
          sectionSlug: block.sectionSlug,
          blockId: block.blockId,
          blockIndex,
        });
        setPlayerState((current) => ({
          ...current,
          status: "loading",
          currentIndex: index,
          queue: nextQueue,
        }));

        const sectionEntry = getSectionEntry(entries, block.sectionSlug);
        const completed = await playAudioText(block.text, {
          label: `Reading ${sectionEntry.title}`,
          sourceType: "document",
          sourceId: block.blockId,
        });

        if (documentRunRef.current !== runId) return;
        if (!completed) {
          setPlayerState((current) => ({ ...current, status: "idle" }));
          return;
        }
      }

      if (documentRunRef.current !== runId) return;

      setPlayerState((current) => ({
        ...current,
        status: "idle",
        queue: [],
        currentIndex: -1,
      }));
    },
    [blocks, entries, lyricFocusBlockId, playAudioText, playerCursor.blockId, sevenVoiceEnabled],
  );

  const playSectionNarration = useCallback(
    async (slug = displaySectionSlug) => {
      const narrationText = getNarrationText(documentData, slug);
      if (!narrationText) {
        setAudioError("There is nothing here for Seven to read yet.");
        return false;
      }

      documentRunRef.current += 1;
      const firstBlock = getFirstSectionBlock(blocks, slug) || null;
      const blockIndex = firstBlock ? getBlockIndex(blocks, firstBlock.blockId) : -1;
      setPlayerCursor({
        sectionSlug: slug,
        blockId: firstBlock?.blockId || null,
        blockIndex,
      });
      setPlayerState((current) => ({
        ...current,
        sourceType: "section",
        status: "loading",
        queue: [],
        currentIndex: -1,
        providerMode: sevenVoiceEnabled ? "provider" : "device",
      }));

      const sectionEntry = getSectionEntry(entries, slug);
      const completed = await playAudioText(narrationText, {
        label: `Listening to ${sectionEntry.title}`,
        sourceType: "section",
        sourceId: slug,
      });

      setPlayerState((current) => ({
        ...current,
        sourceType: "section",
        status: completed ? "idle" : current.status === "paused" ? "paused" : "idle",
        queue: [],
        currentIndex: -1,
      }));

      return completed;
    },
    [
      blocks,
      displaySectionSlug,
      documentData,
      entries,
      playAudioText,
      sevenVoiceEnabled,
    ],
  );

  const pauseDocumentPlayback = useCallback(() => {
    if (
      runtimeAudioState.sourceType !== "document" &&
      runtimeAudioState.sourceType !== "section"
    ) {
      return;
    }

    pauseRuntimeAudio();
    setPlayerState((current) => ({
      ...current,
      sourceType: runtimeAudioState.sourceType || current.sourceType,
      status: "paused",
    }));
  }, [pauseRuntimeAudio, runtimeAudioState.sourceType]);

  const resumeDocumentPlayback = useCallback(async () => {
    if (runtimeAudioState.sourceType === "document" && runtimeAudioState.status === "paused") {
      await resumeRuntimeAudio();
      setPlayerState((current) => ({ ...current, status: "playing" }));
      return;
    }

    if (playerState.queue.length > 0 && playerState.currentIndex >= 0) {
      await playDocumentQueue({
        queue: playerState.queue,
        startIndex: playerState.currentIndex,
      });
      return;
    }

    await playDocumentQueue({ startBlockId: lyricFocusBlockId });
  }, [
    lyricFocusBlockId,
    playDocumentQueue,
    playerState.currentIndex,
    playerState.queue,
    resumeRuntimeAudio,
    runtimeAudioState.sourceType,
    runtimeAudioState.status,
  ]);

  const resumeSectionPlayback = useCallback(async () => {
    if (runtimeAudioState.sourceType === "section" && runtimeAudioState.status === "paused") {
      await resumeRuntimeAudio();
      setPlayerState((current) => ({ ...current, sourceType: "section", status: "playing" }));
      return;
    }

    await playSectionNarration(playerCursor.sectionSlug || displaySectionSlug);
  }, [
    displaySectionSlug,
    playSectionNarration,
    playerCursor.sectionSlug,
    resumeRuntimeAudio,
    runtimeAudioState.sourceType,
    runtimeAudioState.status,
  ]);

  const handleContinueDocument = useCallback(async () => {
    if (runtimeAudioState.sourceType === "message") {
      stopRuntimeAudio();
    }

    if (playerState.sourceType === "document" && playerState.status === "playing") {
      return;
    }

    if (playerState.sourceType === "document" && playerState.status === "paused") {
      await resumeDocumentPlayback();
      return;
    }

    if (!canContinueDocument) {
      await playSectionNarration(displaySectionSlug);
      return;
    }

    await playDocumentQueue({ startBlockId: lyricFocusBlockId });
  }, [
    canContinueDocument,
    displaySectionSlug,
    lyricFocusBlockId,
    playDocumentQueue,
    playSectionNarration,
    playerState.sourceType,
    playerState.status,
    resumeDocumentPlayback,
    runtimeAudioState.sourceType,
    stopRuntimeAudio,
  ]);

  const handlePrimaryPlayPause = useCallback(async () => {
    if (runtimeAudioState.sourceType === "message") {
      stopRuntimeAudio();
      await playSectionNarration(displaySectionSlug);
      return;
    }

    if (playerState.status === "loading") {
      return;
    }

    if (playerState.status === "playing") {
      pauseDocumentPlayback();
      return;
    }

    if (playerState.status === "paused") {
      if (playerState.sourceType === "document") {
        await resumeDocumentPlayback();
        return;
      }

      await resumeSectionPlayback();
      return;
    }

    if (playerState.sourceType === "document" && runtimeAudioState.status === "paused") {
      await resumeDocumentPlayback();
      return;
    }

    await playSectionNarration(displaySectionSlug);
  }, [
    displaySectionSlug,
    pauseDocumentPlayback,
    playerState.status,
    playerState.sourceType,
    playSectionNarration,
    resumeDocumentPlayback,
    resumeSectionPlayback,
    runtimeAudioState.sourceType,
    runtimeAudioState.status,
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

      if (runtimeAudioState.sourceType === "message") {
        stopRuntimeAudio();
      }

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

      await playSectionNarration(targetEntry.slug);
    },
    [
      blocks,
      displaySectionSlug,
      entries,
      playSectionNarration,
      playerCursor.sectionSlug,
      runtimeAudioState.sourceType,
      stopRuntimeAudio,
      viewportSectionSlug,
    ],
  );

  const playMessageAudio = useCallback(
    async (messageId, text) => {
      documentRunRef.current += 1;
      stopRuntimeAudio();
      setPlayerState((current) => {
        if (current.sourceType !== "document" && current.sourceType !== "section") {
          return current;
        }

        if (current.status === "idle" && current.queue.length === 0) {
          return current;
        }

        return { ...current, status: "paused" };
      });
      await playAudioText(text, {
        label: "Playing Seven's reply",
        sourceType: "message",
        sourceId: messageId,
      });
    },
    [playAudioText, stopRuntimeAudio],
  );

  const stopMessageAudio = useCallback(() => {
    if (runtimeAudioState.sourceType !== "message") return;
    stopRuntimeAudio();
  }, [runtimeAudioState.sourceType, stopRuntimeAudio]);

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
        return {
          ...current,
          blockIndex: getBlockIndex(blocks, current.blockId),
        };
      }

      const fallback = getFirstSectionBlock(blocks, viewportSectionSlug) || blocks[0];
      return {
        sectionSlug: fallback.sectionSlug,
        blockId: fallback.blockId,
        blockIndex: getBlockIndex(blocks, fallback.blockId),
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
            voiceEnabled: sevenVoiceEnabled,
            browserSpeechEnabled,
            preferredVoiceProvider: sevenVoiceProvider,
          }),
    );
  }, [browserSpeechEnabled, sevenVoiceEnabled, sevenVoiceProvider]);

  useEffect(() => {
    setPlayerState((current) => ({
      ...current,
      overlay: activeSurface === "seven" ? sevenView : listenTrayState === "open" ? "listen" : null,
    }));
  }, [activeSurface, listenTrayState, sevenView]);

  useEffect(() => {
    if (listeningTransportActive) {
      setListenTrayState((current) => (current === "closed" ? "collapsed" : current));
      return;
    }

    setListenTrayState((current) => (current === "collapsed" ? "closed" : current));
  }, [listeningTransportActive]);

  useEffect(() => {
    if (
      (runtimeAudioState.sourceType !== "document" &&
        runtimeAudioState.sourceType !== "section") ||
      runtimeAudioState.status === "idle"
    ) {
      return;
    }

    setPlayerState((current) => {
      if (
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
    saveReaderPreferences(preferences);
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
    if (!documentTransportActive || !playerCursor.blockId) return;
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
  }, [blocks, documentTransportActive, playerCursor.blockId]);

  useEffect(() => {
    if (scrollIntentRef.current) return;
    syncReaderUrl({
      panel: URL_SYNC_SURFACES.has(activeSurface) ? activeSurface : null,
      hash: viewportSectionSlug === "beginning" ? "" : viewportSectionSlug,
      historyMode: "replace",
    });
  }, [activeSurface, viewportSectionSlug]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (selectionState?.mode === "note") {
        setSelectionState(null);
        setNoteDraft("");
        clearBrowserSelection();
        return;
      }

      if (activeSurface) {
        closeSurface({ restoreFocus: false });
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeSurface, closeSurface, selectionState?.mode]);

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
        toggleSurface("contents");
      }

      if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        openListenTray();
      }

      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleSurface("notebook");
      }

      if (event.key.toLowerCase() === "7") {
        event.preventDefault();
        openSevenView("guide");
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
    openSevenView,
    previousEntry,
    toggleSurface,
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
          body: JSON.stringify(readerAnnotations),
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
  }, [readerAnnotations]);

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
  }, [progressPercent, viewportSectionSlug]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePopState = () => {
      const panel = getSyncedSurfaceFromUrl();
      setActiveSurface((current) => {
        if (current && !URL_SYNC_SURFACES.has(current)) {
          return current;
        }

        return panel;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    if (!activeSurface) {
      document.body.style.removeProperty("overflow");
      return undefined;
    }

    document.body.style.setProperty("overflow", "hidden");
    return () => document.body.style.removeProperty("overflow");
  }, [activeSurface]);

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
      className={`reader-shell text-size-${preferences.textSize} page-width-${preferences.pageWidth} ${
        hasFloatingPanel ? "has-floating-panel" : ""
      } ${lyricFocusBlockId ? "has-lyric-focus" : ""}`}
      data-theme={preferences.theme}
    >
      <div
        className="reader-progress-bar"
        aria-hidden="true"
        style={{ transform: `scaleX(${progress})` }}
      />
      <div className="reader-player-ambient" aria-hidden="true" />

      <header className="reader-player-topbar">
        <div className="reader-player-topbar__identity">
          <p className="reader-player-topbar__book">{documentData.title}</p>
          <p className="reader-player-topbar__section">{displayLabel}</p>
          <p className="reader-player-topbar__meta">
            <span>{entries.findIndex((entry) => entry.slug === displaySectionSlug) + 1}</span>
            <span>/</span>
            <span>{entries.length}</span>
          </p>
        </div>

        <div className="reader-player-topbar__actions">
          <button
            type="button"
            className={`reader-player-topbar__utility ${contentsOpen ? "is-active" : ""}`}
            onClick={(event) => toggleSurface("contents", event)}
            aria-label={contentsOpen ? "Close contents" : "Open contents"}
            title={contentsOpen ? "Close contents" : "Open contents"}
          >
            <ContentsIcon />
          </button>

          <button
            type="button"
            className={`reader-player-topbar__listen ${
              listenTrayState !== "closed" ? "is-active" : ""
            }`}
            onClick={() => openListenTray()}
            aria-label="Open listening"
            title="Listen"
          >
            <span>Listen</span>
          </button>

          <button
            type="button"
            className={`reader-player-topbar__utility reader-player-topbar__utility--desktop ${
              currentBookmarked ? "is-active" : ""
            }`}
            onClick={handleToggleBookmark}
            aria-label={currentBookmarked ? "Remove bookmark" : "Add bookmark"}
            title={currentBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <BookmarkIcon filled={currentBookmarked} />
          </button>

          <button
            type="button"
            className={`reader-player-topbar__utility reader-player-topbar__utility--desktop ${
              notebookOpen ? "is-active" : ""
            }`}
            onClick={(event) => toggleSurface("notebook", event)}
            aria-label={notebookOpen ? "Close notebook" : "Open notebook"}
            title={notebookOpen ? "Close notebook" : "Open notebook"}
          >
            <NotebookIcon />
          </button>

          <button
            type="button"
            className={`reader-player-topbar__utility ${sevenOpen ? "is-active" : ""}`}
            onClick={(event) => {
              if (sevenOpen) {
                closeSurface();
                return;
              }

              openSevenView("guide", event);
            }}
            aria-label={sevenOpen ? "Close Seven" : "Open Seven"}
            title="Seven"
          >
            <SevenIcon />
          </button>

          <button
            type="button"
            className={`reader-player-topbar__utility reader-player-topbar__utility--desktop ${
              appearanceOpen ? "is-active" : ""
            }`}
            onClick={(event) => toggleSurface("appearance", event)}
            aria-label="Reader appearance"
            title="Reader appearance"
          >
            <span>Aa</span>
          </button>

          <button
            type="button"
            className="reader-player-topbar__utility reader-account-link"
            onClick={openAccountPage}
            aria-label="Account"
            title="Account"
          >
            <span className="reader-member-chip" aria-hidden="true">
              {memberInitial}
            </span>
          </button>
        </div>
      </header>

      {appearanceOpen ? (
        <div className="reader-appearance-menu" role="dialog" aria-label="Reader appearance">
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
      ) : null}

      <div
        className={`reader-overlay ${hasFloatingPanel ? "is-visible" : ""}`}
        onClick={() => closeSurface({ restoreFocus: false })}
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
              className="reader-player-topbar__utility"
              onClick={() => closeSurface()}
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
              <span className="reader-toc__item-meta">{entry.number ?? "0"}</span>
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
        onClose={() => closeSurface()}
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
        state={listenTrayState}
        currentLabel={displayLabel}
        progress={sectionProgress}
        elapsed={audioTimeState.elapsed}
        duration={audioTimeState.duration}
        speed={playbackSpeed}
        voiceLabel={
          runtimeAudioState.mode === "device"
            ? "Seven · Device voice"
            : `Seven · ${getSevenProviderLabel(voiceStatus.provider || sevenVoiceProvider)}`
        }
        isDeviceMode={runtimeAudioState.mode === "device"}
        canListenCurrentSection={canListenCurrentSection}
        canContinueDocument={canContinueDocument}
        canGoPrevious={Boolean(previousEntry)}
        canGoNext={Boolean(nextEntry)}
        isPlaying={listeningPlaying}
        isLoading={playerState.status === "loading"}
        continueDocumentActive={continueDocumentActive}
        liveStatus={liveStatus}
        showStatus={showStatus}
        onExpand={() => openListenTray()}
        onCollapse={collapseListenTray}
        onClose={closeListenTray}
        onPlayPause={() => void handlePrimaryPlayPause()}
        onContinue={() => void handleContinueDocument()}
        onPrevious={() => void handlePlaybackSectionStep(-1)}
        onNext={() => void handlePlaybackSectionStep(1)}
        onSpeedChange={handleSpeedChange}
        onSkip={handleAudioSkip}
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
        onClose={() => closeSurface()}
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
                <div className="reader-section__divider" />
                <div className="reader-section__meta">
                  <span className="reader-section__number">{section.number}</span>
                  <span className="reader-section__label">{section.title}</span>
                </div>
                <h2 className="reader-section__title">{section.title}</h2>
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

      <AnimatePresence>
        {!sevenOpen && !hasFloatingPanel && listenTrayState !== "open" ? (
          <motion.button
            key="reader-fab"
            type="button"
            className="reader-fab"
            onClick={(event) => openSevenView("guide", event)}
            aria-label="Ask Seven"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 400 }}
          >
            <span className="reader-fab__glyph">7</span>
          </motion.button>
        ) : null}
      </AnimatePresence>
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
