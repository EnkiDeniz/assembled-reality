"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CircleAlert,
  FileText,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import LoegosShell from "@/components/shell/LoegosShell";
import CompilerReadPanel from "@/components/dream/CompilerReadPanel";
import styles from "@/components/dream/SectionDreamScreen.module.css";
import {
  buildDreamDocumentRecord,
  DREAM_DEFAULT_RATE,
  DREAM_PLAYBACK_STATUSES,
  DREAM_SOURCE_KINDS,
  findDreamPositionByElapsedMs,
  formatDreamTime,
  getDreamDocumentSummary,
  getDreamElapsedMs,
  getDreamQueueDurationMs,
  isDreamMarkdownFilename,
  normalizeDreamSession,
} from "@/lib/dream";
import {
  createNextDreamDocumentVersion,
  attachCompilerReadToDreamDocument,
  deleteDreamDocument,
  getDreamDocumentCurrentVersionLabel,
  getDreamDocumentCurrentVersion,
  listDreamDocuments,
  loadActiveDreamDocument,
  loadDreamDocument,
  loadDreamSession,
  replaceActiveDreamDocument,
  restorePreviousDreamDocumentVersion,
  saveDreamSession,
  setActiveDreamDocument,
  updateDreamDocumentProgress,
} from "@/lib/dream-storage";
import { saveDreamBridgePayload } from "@/lib/dream-bridge";
import { clearCompilerReadSelfCheck } from "@/lib/compiler-read-self-check";
import { clampListeningRate } from "@/lib/listening";
import { buildCompilerReadDelta } from "@/lib/compiler-read-delta";
import { formatCompilerReadAsMarkdown } from "@/lib/compiler-read-markdown";
import {
  clearRuntimeSurfaceResumeLibrary,
  saveRuntimeSurfaceResumeState,
} from "@/lib/runtime-surface-resume";

const SKIP_BACK_MS = 15_000;
const SKIP_FORWARD_MS = 30_000;
const PREFETCH_AHEAD = 2;
const PERSIST_THROTTLE_MS = 1_500;
const SPEED_OPTIONS = [0.85, 1, 1.15, 1.3, 1.5, 1.75];

function buildDurationMap(document) {
  return Object.fromEntries(
    (Array.isArray(document?.chunkMap) ? document.chunkMap : []).map((chunk) => [
      chunk.id,
      chunk.estimatedDurationMs || 0,
    ]),
  );
}

function getChunkDurationMs(chunk, durationMap) {
  if (!chunk) return 0;
  return durationMap?.[chunk.id] || chunk.estimatedDurationMs || 0;
}

function sortDreamDocuments(documents = []) {
  return [...documents].sort((left, right) => {
    const leftDate = Date.parse(left?.lastOpenedAt || left?.updatedAt || left?.createdAt || "") || 0;
    const rightDate = Date.parse(right?.lastOpenedAt || right?.updatedAt || right?.createdAt || "") || 0;
    return rightDate - leftDate;
  });
}

function upsertDocument(documents = [], nextDocument) {
  const filtered = documents.filter((document) => document.id !== nextDocument.id);
  return sortDreamDocuments([nextDocument, ...filtered]);
}

function removeDocument(documents = [], documentId = "") {
  return documents.filter((document) => document.id !== documentId);
}

function normalizeLongForm(value = "") {
  return String(value || "").trim();
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function shouldUseLibraryRail() {
  return Boolean(
    typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(min-width: 960px)").matches,
  );
}

export default function SectionDreamScreen({
  initialVoiceChoice = null,
  voiceCatalog = [],
  initialRate = DREAM_DEFAULT_RATE,
  workspaceLabel = "Personal",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestVoiceChoice = initialVoiceChoice || {
    provider: null,
    voiceId: null,
    label: "Voice",
  };
  const fileInputRef = useRef(null);
  const pasteTextareaRef = useRef(null);
  const audioRef = useRef(null);
  const compilerReadSummaryRef = useRef(null);
  const chunkCacheRef = useRef(new Map());
  const durationMapRef = useRef({});
  const generationRef = useRef(0);
  const lastPersistedAtRef = useRef(0);
  const pendingSeekMsRef = useRef(null);
  const suppressPauseRef = useRef(false);
  const compilerReadAbortRef = useRef(null);
  const compilerReadRequestIdRef = useRef(0);
  const currentStateRef = useRef({
    dreamDocument: null,
    status: DREAM_PLAYBACK_STATUSES.idle,
    activeChunkIndex: 0,
    chunkOffsetMs: 0,
    globalOffsetMs: 0,
    rate: clampListeningRate(initialRate, DREAM_DEFAULT_RATE),
    resolvedProvider: requestVoiceChoice.provider || null,
    resolvedVoiceId: requestVoiceChoice.voiceId || null,
  });
  const [dreamLibrary, setDreamLibrary] = useState([]);
  const [dreamDocument, setDreamDocument] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [status, setStatus] = useState(DREAM_PLAYBACK_STATUSES.idle);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [chunkOffsetMs, setChunkOffsetMs] = useState(0);
  const [globalOffsetMs, setGlobalOffsetMs] = useState(0);
  const [rate, setRate] = useState(clampListeningRate(initialRate, DREAM_DEFAULT_RATE));
  const [resolvedProvider, setResolvedProvider] = useState(requestVoiceChoice.provider || null);
  const [resolvedVoiceId, setResolvedVoiceId] = useState(requestVoiceChoice.voiceId || null);
  const [showPaste, setShowPaste] = useState(false);
  const [showLibrarySheet, setShowLibrarySheet] = useState(false);
  const [showCompilerReadSheet, setShowCompilerReadSheet] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [compilerReadError, setCompilerReadError] = useState("");
  const [compilerReadPending, setCompilerReadPending] = useState(false);
  const [showCompilerReadSelfCheck, setShowCompilerReadSelfCheck] = useState(false);
  const [copiedRead, setCopiedRead] = useState(false);
  const [isLibraryDropActive, setIsLibraryDropActive] = useState(false);
  const [canvasMode, setCanvasMode] = useState("document");
  const [showLibraryInstrumentMenu, setShowLibraryInstrumentMenu] = useState(false);
  const [, setDurationVersion] = useState(0);
  const [isPending, startTransition] = useTransition();

  currentStateRef.current = {
    dreamDocument,
    status,
    activeChunkIndex,
    chunkOffsetMs,
    globalOffsetMs,
    rate,
    resolvedProvider,
    resolvedVoiceId,
  };

  const chunks = Array.isArray(dreamDocument?.chunkMap) ? dreamDocument.chunkMap : [];
  const summary = dreamDocument ? getDreamDocumentSummary(dreamDocument) : null;
  const totalDurationMs = dreamDocument
    ? getDreamQueueDurationMs(chunks, durationMapRef.current)
    : 0;
  const hasRemoteVoice = voiceCatalog.length > 0;
  const currentChunk = chunks[activeChunkIndex] || null;
  const requestedDocumentId = String(searchParams?.get("document") || "").trim();
  const requestedAnchor = String(searchParams?.get("anchor") || "").trim();
  const hasUnsavedPasteChanges = showPaste
    ? normalizeLongForm(pasteValue) !== normalizeLongForm(dreamDocument?.rawMarkdown || "")
    : false;
  const compilerReadDisabledReason = hasUnsavedPasteChanges
    ? "Draft changed. Save a new version before running a current Compiler Read."
    : "";
  const visibleCompilerRead = dreamDocument?.compilerRead || null;
  const visibleCompilerReadError = compilerReadError;
  const visibleCompilerReadPending = compilerReadPending;
  const compilerReadSheetOpen = showCompilerReadSheet;
  const currentVersion = dreamDocument?.currentVersion || getDreamDocumentCurrentVersion(dreamDocument);
  const currentVersionLabel =
    dreamDocument?.currentVersionLabel || getDreamDocumentCurrentVersionLabel(dreamDocument);
  const previousVersion =
    dreamDocument?.versions?.find((version) => version.versionId === currentVersion?.parentVersionId) || null;
  const previousCompilerRead = previousVersion?.compilerRead || null;
  const compilerReadDelta =
    visibleCompilerRead && previousCompilerRead
      ? buildCompilerReadDelta(visibleCompilerRead, previousCompilerRead)
      : null;
  const isCompilerReadStale = Boolean(hasUnsavedPasteChanges && visibleCompilerRead);
  const isReadCanvasActive =
    canvasMode === "read" &&
    Boolean(visibleCompilerRead || visibleCompilerReadPending || visibleCompilerReadError);

  useEffect(() => {
    if (!showLibraryInstrumentMenu) return;
    if (showLibrarySheet || showCompilerReadSheet || isReadCanvasActive || showPaste) {
      setShowLibraryInstrumentMenu(false);
    }
  }, [isReadCanvasActive, showCompilerReadSheet, showLibraryInstrumentMenu, showLibrarySheet, showPaste]);

  const cleanupChunkCache = useCallback(() => {
    for (const entry of chunkCacheRef.current.values()) {
      if (entry?.url) {
        URL.revokeObjectURL(entry.url);
      }
    }

    chunkCacheRef.current.clear();
  }, []);

  const cancelCompilerReadRequest = useCallback(() => {
    compilerReadRequestIdRef.current += 1;
    if (compilerReadAbortRef.current) {
      compilerReadAbortRef.current.abort();
      compilerReadAbortRef.current = null;
    }
  }, []);

  const clearCompilerReadState = useCallback(() => {
    cancelCompilerReadRequest();
    setCompilerReadError("");
    setCompilerReadPending(false);
    setShowCompilerReadSelfCheck(false);
    setCopiedRead(false);
  }, [cancelCompilerReadRequest]);

  useEffect(() => () => {
    cancelCompilerReadRequest();
  }, [cancelCompilerReadRequest]);

  useEffect(() => {
    if (
      hasUnsavedPasteChanges &&
      (visibleCompilerRead || compilerReadPending || compilerReadError)
    ) {
      cancelCompilerReadRequest();
      setCompilerReadPending(false);
      setCompilerReadError("");
    }
  }, [
    cancelCompilerReadRequest,
    compilerReadError,
    compilerReadPending,
    hasUnsavedPasteChanges,
    visibleCompilerRead,
  ]);

  useEffect(() => {
    if (!visibleCompilerRead) {
      setShowCompilerReadSelfCheck(false);
    }
  }, [visibleCompilerRead]);

  useEffect(() => {
    if (!showPaste) return;
    setCanvasMode("document");
  }, [showPaste]);

  useEffect(() => {
    if (!visibleCompilerRead && canvasMode === "read") {
      setCanvasMode("document");
    }
  }, [canvasMode, visibleCompilerRead]);

  useEffect(() => {
    setCopiedRead(false);
  }, [dreamDocument?.id, currentVersion?.versionId]);

  const setPlaybackPosition = useCallback((documentRecord, nextIndex = 0, nextOffsetMs = 0) => {
    const queue = Array.isArray(documentRecord?.chunkMap) ? documentRecord.chunkMap : [];
    if (!queue.length) {
      setActiveChunkIndex(0);
      setChunkOffsetMs(0);
      setGlobalOffsetMs(0);
      return;
    }

    const safeIndex = Math.max(0, Math.min(nextIndex, queue.length - 1));
    const activeChunk = queue[safeIndex];
    const durationMs = getChunkDurationMs(activeChunk, durationMapRef.current);
    const rawOffsetMs = Math.max(0, Math.floor(Number(nextOffsetMs) || 0));
    const clampedOffsetMs = durationMs > 0 ? Math.min(rawOffsetMs, durationMs) : rawOffsetMs;

    setActiveChunkIndex(safeIndex);
    setChunkOffsetMs(clampedOffsetMs);
    setGlobalOffsetMs(
      getDreamElapsedMs(queue, safeIndex, clampedOffsetMs, durationMapRef.current),
    );
  }, []);

  const updateDocumentInState = useCallback((documentRecord, overrides = {}) => {
    const nextDocument = {
      ...documentRecord,
      ...overrides,
    };
    setDreamLibrary((current) => upsertDocument(current, nextDocument));
    if (dreamDocument?.id === nextDocument.id) {
      setDreamDocument(nextDocument);
    }
    return nextDocument;
  }, [dreamDocument?.id]);

  function applyDocumentState(documentRecord, sessionOverride = null, nextNotice = "") {
    const baseSession = normalizeDreamSession(sessionOverride, {
      documentId: documentRecord.id,
      provider: requestVoiceChoice.provider,
      voiceId: requestVoiceChoice.voiceId,
      rate: clampListeningRate(initialRate, DREAM_DEFAULT_RATE),
      chunkCount: documentRecord.chunkMap.length,
    });
    const restoredPosition =
      baseSession.globalOffsetMs > 0
        ? findDreamPositionByElapsedMs(
            documentRecord.chunkMap,
            baseSession.globalOffsetMs,
            durationMapRef.current,
          )
        : {
            index: baseSession.activeChunkIndex,
            chunkOffsetMs: baseSession.chunkOffsetMs,
          };
    const nextStatus =
      baseSession.globalOffsetMs > 0 || baseSession.status === DREAM_PLAYBACK_STATUSES.paused
        ? DREAM_PLAYBACK_STATUSES.paused
        : DREAM_PLAYBACK_STATUSES.idle;

    durationMapRef.current = buildDurationMap(documentRecord);
    setDurationVersion((version) => version + 1);
    setSelectedDocumentId(documentRecord.id);
    setDreamDocument(documentRecord);
    setStatus(nextStatus);
    setRate(clampListeningRate(baseSession.rate, DREAM_DEFAULT_RATE));
    setResolvedProvider(baseSession.provider || requestVoiceChoice.provider || null);
    setResolvedVoiceId(baseSession.voiceId || requestVoiceChoice.voiceId || null);
    setShowPaste(documentRecord.sourceKind === DREAM_SOURCE_KINDS.paste);
    if (documentRecord.sourceKind === DREAM_SOURCE_KINDS.paste) {
      setPasteValue(documentRecord.rawMarkdown || "");
    } else {
      setPasteValue("");
    }
    setErrorMessage("");
    setNoticeMessage(nextNotice);
    setPlaybackPosition(
      documentRecord,
      restoredPosition.index,
      restoredPosition.chunkOffsetMs,
    );
  }

  const persistLatestSession = useCallback((overrides = {}) => {
    const current = currentStateRef.current;
    const documentRecord = current.dreamDocument;
    if (!documentRecord?.id) return;

    const snapshot = normalizeDreamSession(
      {
        documentId: documentRecord.id,
        provider:
          overrides.provider ??
          current.resolvedProvider ??
          requestVoiceChoice.provider,
        voiceId:
          overrides.voiceId ??
          current.resolvedVoiceId ??
          requestVoiceChoice.voiceId,
        rate: overrides.rate ?? current.rate,
        status: overrides.status ?? current.status,
        activeChunkIndex: overrides.activeChunkIndex ?? current.activeChunkIndex,
        chunkOffsetMs: overrides.chunkOffsetMs ?? current.chunkOffsetMs,
        globalOffsetMs: overrides.globalOffsetMs ?? current.globalOffsetMs,
        lastOpenedAt: new Date().toISOString(),
      },
      {
        documentId: documentRecord.id,
        provider: requestVoiceChoice.provider,
        voiceId: requestVoiceChoice.voiceId,
        rate: current.rate,
        chunkCount: documentRecord.chunkMap.length,
      },
    );

    saveDreamSession(snapshot);
    const persistedDocument = updateDocumentInState(documentRecord, {
      progressMs: snapshot.globalOffsetMs,
      lastOpenedAt: snapshot.lastOpenedAt,
      totalDurationMs:
        Number(documentRecord.totalDurationMs) ||
        getDreamQueueDurationMs(documentRecord.chunkMap, durationMapRef.current),
    });
    void updateDreamDocumentProgress(persistedDocument, {
      progressMs: snapshot.globalOffsetMs,
      lastOpenedAt: snapshot.lastOpenedAt,
    }).catch(() => {});
  }, [requestVoiceChoice.provider, requestVoiceChoice.voiceId, updateDocumentInState]);

  const resetAudioRuntime = useCallback(() => {
    generationRef.current += 1;
    lastPersistedAtRef.current = 0;
    pendingSeekMsRef.current = null;
    cleanupChunkCache();
    durationMapRef.current = {};
    setDurationVersion((version) => version + 1);

    const audio = audioRef.current;
    if (!audio) return;

    suppressPauseRef.current = true;
    try {
      audio.pause();
    } catch {
      // Ignore reset-time media pause failures; the element is being torn down anyway.
    }
    audio.removeAttribute("src");
    audio.load();
    suppressPauseRef.current = false;
  }, [cleanupChunkCache]);

  const ensureChunkAudio = useCallback(async (documentRecord, chunkIndex) => {
    const queue = Array.isArray(documentRecord?.chunkMap) ? documentRecord.chunkMap : [];
    const chunk = queue[chunkIndex];
    if (!chunk) return null;

    const existing = chunkCacheRef.current.get(chunk.id);
    if (existing?.url) {
      return existing;
    }
    if (existing?.promise) {
      return existing.promise;
    }

    const generation = generationRef.current;
    const promise = (async () => {
      const response = await fetch("/api/seven/audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: chunk.text,
          preferredProvider: requestVoiceChoice.provider,
          voiceId: requestVoiceChoice.voiceId,
          rate: currentStateRef.current.rate,
        }),
      });
      const payload = response.headers.get("content-type")?.includes("application/json")
        ? await response.json().catch(() => null)
        : null;

      if (!response.ok) {
        throw new Error(
          payload?.error || "Library could not fetch voice audio for this markdown chunk.",
        );
      }

      const blob = await response.blob();
      const entry = {
        url: URL.createObjectURL(blob),
        provider: response.headers.get("x-seven-provider") || requestVoiceChoice.provider || null,
        voiceId: response.headers.get("x-seven-voice-id") || requestVoiceChoice.voiceId || null,
      };

      if (generation !== generationRef.current) {
        URL.revokeObjectURL(entry.url);
        return null;
      }

      chunkCacheRef.current.set(chunk.id, entry);
      return entry;
    })()
      .catch((error) => {
        chunkCacheRef.current.delete(chunk.id);
        throw error;
      });

    chunkCacheRef.current.set(chunk.id, { promise });
    return promise;
  }, [requestVoiceChoice.provider, requestVoiceChoice.voiceId]);

  const loadChunkIntoAudio = useCallback(
    async (documentRecord, nextIndex, nextOffsetMs = 0, { autoPlay = false } = {}) => {
      const queue = Array.isArray(documentRecord?.chunkMap) ? documentRecord.chunkMap : [];
      if (!queue.length) {
        return;
      }

      const safeIndex = Math.max(0, Math.min(nextIndex, queue.length - 1));
      const generation = generationRef.current;
      const audio = audioRef.current;
      if (!audio) return;

      setPlaybackPosition(documentRecord, safeIndex, nextOffsetMs);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        setIsFetchingAudio(true);
        const entry = await ensureChunkAudio(documentRecord, safeIndex);
        if (!entry || generation !== generationRef.current) {
          return;
        }

        const nextOffset = Math.max(0, Math.floor(Number(nextOffsetMs) || 0));
        suppressPauseRef.current = true;
        audio.playbackRate = currentStateRef.current.rate;

        if (audio.src !== entry.url) {
          pendingSeekMsRef.current = nextOffset;
          audio.src = entry.url;
          audio.load();
        } else {
          try {
            audio.currentTime = nextOffset / 1000;
            pendingSeekMsRef.current = null;
          } catch {
            pendingSeekMsRef.current = nextOffset;
          }
        }

        suppressPauseRef.current = false;
        setResolvedProvider(entry.provider || requestVoiceChoice.provider || null);
        setResolvedVoiceId(entry.voiceId || requestVoiceChoice.voiceId || null);

        if (autoPlay) {
          await audio.play();
          setStatus(DREAM_PLAYBACK_STATUSES.active);
          persistLatestSession({
            provider: entry.provider || requestVoiceChoice.provider || null,
            voiceId: entry.voiceId || requestVoiceChoice.voiceId || null,
            status: DREAM_PLAYBACK_STATUSES.active,
            activeChunkIndex: safeIndex,
            chunkOffsetMs: nextOffset,
            globalOffsetMs: getDreamElapsedMs(
              queue,
              safeIndex,
              nextOffset,
              durationMapRef.current,
            ),
          });
        } else {
          setStatus(
            nextOffset > 0 || currentStateRef.current.globalOffsetMs > 0
              ? DREAM_PLAYBACK_STATUSES.paused
              : DREAM_PLAYBACK_STATUSES.idle,
          );
        }
      } catch (error) {
        setStatus(DREAM_PLAYBACK_STATUSES.paused);
        setErrorMessage(
          error instanceof Error ? error.message : "Library could not continue playback.",
        );
      } finally {
        setIsFetchingAudio(false);
      }
    },
    [
      ensureChunkAudio,
      persistLatestSession,
      requestVoiceChoice.provider,
      requestVoiceChoice.voiceId,
      setPlaybackPosition,
    ],
  );

  const restorePersistedDocument = useEffectEvent(async () => {
    try {
      const [documents, storedDocument] = await Promise.all([
        listDreamDocuments(),
        loadActiveDreamDocument(),
      ]);
      const nextLibrary = sortDreamDocuments(documents);

      startTransition(() => {
        setDreamLibrary(nextLibrary);
      });

      const queryDocument =
        requestedDocumentId
          ? nextLibrary.find((document) => document.id === requestedDocumentId) || null
          : null;
      const resolvedStoredDocument =
        storedDocument?.id
          ? nextLibrary.find((document) => document.id === storedDocument.id) || null
          : null;
      const initialDocument =
        queryDocument ||
        resolvedStoredDocument ||
        nextLibrary[0] ||
        null;
      if (!initialDocument?.id) {
        clearRuntimeSurfaceResumeLibrary();
        return;
      }

      const storedSession = loadDreamSession(initialDocument.id);
      resetAudioRuntime();
      startTransition(() => {
        setCanvasMode("document");
        applyDocumentState(
          initialDocument,
          storedSession,
          storedSession?.globalOffsetMs
            ? `Resume ready from ${formatDreamTime(storedSession.globalOffsetMs)}.`
            : "Library restored.",
        );
      });

      if (requestedAnchor) {
        const anchorIndex = initialDocument.chunkMap.findIndex((chunk) => chunk.id === requestedAnchor);
        if (anchorIndex >= 0) {
          startTransition(() => {
            setPlaybackPosition(initialDocument, anchorIndex, 0);
          });
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Library could not restore the last listening state.",
      );
    } finally {
      setIsRestoring(false);
    }
  });

  useEffect(() => {
    void restorePersistedDocument();
    return () => {
      resetAudioRuntime();
    };
  }, [requestedAnchor, requestedDocumentId, resetAudioRuntime, setPlaybackPosition]);

  useEffect(() => {
    if (!dreamDocument?.chunkMap?.length) {
      return;
    }

    for (
      let index = activeChunkIndex;
      index <= Math.min(activeChunkIndex + PREFETCH_AHEAD, dreamDocument.chunkMap.length - 1);
      index += 1
    ) {
      void ensureChunkAudio(dreamDocument, index).catch(() => {});
    }
  }, [activeChunkIndex, dreamDocument, ensureChunkAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    if (dreamDocument?.id) {
      persistLatestSession({ rate });
    }
  }, [dreamDocument?.id, persistLatestSession, rate]);

  useEffect(() => {
    const handlePageHide = () => {
      persistLatestSession();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [persistLatestSession]);

  useEffect(() => {
    if (!visibleCompilerRead || showCompilerReadSelfCheck) {
      return undefined;
    }

    const element = compilerReadSummaryRef.current;
    if (!element || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setShowCompilerReadSelfCheck(true);
        }
      },
      {
        threshold: 0.05,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [showCompilerReadSelfCheck, visibleCompilerRead]);

  useEffect(() => {
    if (!dreamDocument?.id) return;
    saveRuntimeSurfaceResumeState({
      surface: "dream",
      library: {
        documentId: dreamDocument.id,
        title: dreamDocument.filename,
        anchor: currentChunk?.id || "",
        updatedAt: dreamDocument.updatedAt || new Date().toISOString(),
      },
    });
  }, [currentChunk?.id, dreamDocument?.filename, dreamDocument?.id, dreamDocument?.updatedAt]);

  const handleLoadedMetadata = useEffectEvent(() => {
    const current = currentStateRef.current;
    const audio = audioRef.current;
    const chunk = current.dreamDocument?.chunkMap?.[current.activeChunkIndex];
    if (!audio || !chunk) return;

    if (pendingSeekMsRef.current != null) {
      try {
        audio.currentTime = pendingSeekMsRef.current / 1000;
        pendingSeekMsRef.current = null;
      } catch {
        // Some browsers block seeks until metadata settles; keep the pending target for the next tick.
      }
    }

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      const nextDurationMs = Math.round(audio.duration * 1000);
      if (nextDurationMs > 0 && durationMapRef.current[chunk.id] !== nextDurationMs) {
        durationMapRef.current = {
          ...durationMapRef.current,
          [chunk.id]: nextDurationMs,
        };
        setDurationVersion((version) => version + 1);
      }
    }
  });

  const handleTimeUpdate = useEffectEvent(() => {
    const current = currentStateRef.current;
    const audio = audioRef.current;
    if (!audio || !current.dreamDocument?.chunkMap?.length) {
      return;
    }

    const nextOffsetMs = Math.max(0, Math.round((audio.currentTime || 0) * 1000));
    const nextGlobalOffsetMs = getDreamElapsedMs(
      current.dreamDocument.chunkMap,
      current.activeChunkIndex,
      nextOffsetMs,
      durationMapRef.current,
    );

    setChunkOffsetMs(nextOffsetMs);
    setGlobalOffsetMs(nextGlobalOffsetMs);

    if (Date.now() - lastPersistedAtRef.current >= PERSIST_THROTTLE_MS) {
      persistLatestSession({
        status: current.status,
        chunkOffsetMs: nextOffsetMs,
        globalOffsetMs: nextGlobalOffsetMs,
      });
      lastPersistedAtRef.current = Date.now();
    }
  });

  const handlePlay = useEffectEvent(() => {
    setStatus(DREAM_PLAYBACK_STATUSES.active);
  });

  const handlePause = useEffectEvent(() => {
    if (suppressPauseRef.current || isFetchingAudio) {
      return;
    }

    const current = currentStateRef.current;
    setStatus(DREAM_PLAYBACK_STATUSES.paused);
    persistLatestSession({
      status: DREAM_PLAYBACK_STATUSES.paused,
      chunkOffsetMs: current.chunkOffsetMs,
      globalOffsetMs: current.globalOffsetMs,
    });
  });

  const handleEnded = useEffectEvent(async () => {
    const current = currentStateRef.current;
    const documentRecord = current.dreamDocument;
    if (!documentRecord?.chunkMap?.length) {
      return;
    }

    const nextIndex = current.activeChunkIndex + 1;
    if (nextIndex < documentRecord.chunkMap.length) {
      await loadChunkIntoAudio(documentRecord, nextIndex, 0, { autoPlay: true });
      return;
    }

    const lastChunk = documentRecord.chunkMap[documentRecord.chunkMap.length - 1];
    const lastChunkDurationMs = getChunkDurationMs(lastChunk, durationMapRef.current);
    const totalDuration = getDreamQueueDurationMs(
      documentRecord.chunkMap,
      durationMapRef.current,
    );

    setStatus(DREAM_PLAYBACK_STATUSES.paused);
    setChunkOffsetMs(lastChunkDurationMs);
    setGlobalOffsetMs(totalDuration);
    persistLatestSession({
      status: DREAM_PLAYBACK_STATUSES.paused,
      activeChunkIndex: documentRecord.chunkMap.length - 1,
      chunkOffsetMs: lastChunkDurationMs,
      globalOffsetMs: totalDuration,
    });
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => handleLoadedMetadata();
    const onTimeUpdate = () => handleTimeUpdate();
    const onPlay = () => handlePlay();
    const onPause = () => handlePause();
    const onEnded = () => {
      void handleEnded();
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  async function ingestMarkdown({
    rawMarkdown,
    filename,
    sourceKind,
    autoPlay = true,
  }) {
    if (!String(rawMarkdown || "").trim()) {
      setErrorMessage("Library needs markdown before it can start listening.");
      return;
    }

    try {
      clearCompilerReadState();
      setErrorMessage("");
      setNoticeMessage("Preparing markdown.");
      const documentRecord = await buildDreamDocumentRecord({
        filename,
        rawMarkdown,
        sourceKind,
      });
      const nextSession = normalizeDreamSession(
        {
          documentId: documentRecord.id,
          provider: requestVoiceChoice.provider,
          voiceId: requestVoiceChoice.voiceId,
          rate,
          status: autoPlay ? DREAM_PLAYBACK_STATUSES.active : DREAM_PLAYBACK_STATUSES.idle,
          activeChunkIndex: 0,
          chunkOffsetMs: 0,
          globalOffsetMs: 0,
        },
        {
          documentId: documentRecord.id,
          provider: requestVoiceChoice.provider,
          voiceId: requestVoiceChoice.voiceId,
          rate,
          chunkCount: documentRecord.chunkMap.length,
        },
      );

      resetAudioRuntime();
      const savedDocument = await replaceActiveDreamDocument(documentRecord);
      saveDreamSession(nextSession);
      setDreamLibrary((current) => upsertDocument(current, savedDocument));

      startTransition(() => {
        setCanvasMode("document");
        applyDocumentState(
          savedDocument,
          nextSession,
          autoPlay ? "Loading voice." : "Document saved.",
        );
        setShowLibrarySheet(false);
        setShowPaste(false);
      });

      if (autoPlay && hasRemoteVoice) {
        await loadChunkIntoAudio(savedDocument, 0, 0, { autoPlay: true });
      } else if (!hasRemoteVoice) {
        setStatus(DREAM_PLAYBACK_STATUSES.paused);
        setNoticeMessage("Document is ready. Add a remote voice provider to listen.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Library could not prepare that markdown file.",
      );
      setNoticeMessage("");
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isDreamMarkdownFilename(file.name)) {
      setErrorMessage("Library accepts only .md or .markdown files right now.");
      return;
    }

    const rawMarkdown = await file.text();
    startTransition(() => {
      setNoticeMessage("Preparing markdown.");
    });
    await ingestMarkdown({
      rawMarkdown,
      filename: file.name,
      sourceKind: DREAM_SOURCE_KINDS.upload,
      autoPlay: false,
    });
  }

  async function handleDroppedFile(file = null) {
    if (!file) return;

    if (!isDreamMarkdownFilename(file.name)) {
      setErrorMessage("Library accepts only .md or .markdown files right now.");
      return;
    }

    const rawMarkdown = await file.text();
    startTransition(() => {
      setNoticeMessage("Preparing markdown.");
    });
    await ingestMarkdown({
      rawMarkdown,
      filename: file.name,
      sourceKind: DREAM_SOURCE_KINDS.upload,
      autoPlay: false,
    });
  }

  function handleDragOver(event) {
    if (!event.dataTransfer?.types?.includes("Files")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsLibraryDropActive(true);
  }

  function handleDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    setIsLibraryDropActive(false);
  }

  async function handleDrop(event) {
    if (!event.dataTransfer?.files?.length) {
      return;
    }

    event.preventDefault();
    setIsLibraryDropActive(false);
    await handleDroppedFile(event.dataTransfer.files[0]);
  }

  async function handlePasteSubmit() {
    if (dreamDocument?.id && showPaste) {
      await handleSaveVersionOnly();
      return;
    }

    await ingestMarkdown({
      rawMarkdown: pasteValue,
      filename: "dream-library-paste.md",
      sourceKind: DREAM_SOURCE_KINDS.paste,
      autoPlay: false,
    });
  }

  async function handleSelectDocument(documentId) {
    const normalizedDocumentId = String(documentId || "").trim();
    if (!normalizedDocumentId || normalizedDocumentId === selectedDocumentId) {
      setShowLibrarySheet(false);
      return;
    }

    try {
      clearCompilerReadState();
      persistLatestSession();
      resetAudioRuntime();

      const nextDocument =
        dreamLibrary.find((document) => document.id === normalizedDocumentId) ||
        (await loadActiveDreamDocument()) ||
        null;
      const resolvedDocument =
        nextDocument?.id === normalizedDocumentId
          ? nextDocument
          : await listDreamDocuments().then((documents) =>
              documents.find((document) => document.id === normalizedDocumentId) || null,
            );

      if (!resolvedDocument?.id) {
        return;
      }

      setActiveDreamDocument(resolvedDocument);
      const storedSession = loadDreamSession(resolvedDocument.id);
      startTransition(() => {
        setCanvasMode("document");
        applyDocumentState(resolvedDocument, storedSession, "");
        setShowLibrarySheet(false);
        setShowCompilerReadSheet(false);
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Library could not open that document.",
      );
    }
  }

  async function handleClear() {
    if (!dreamDocument?.id) {
      return;
    }

    const currentId = dreamDocument.id;
    clearCompilerReadState();
    resetAudioRuntime();
    await deleteDreamDocument(currentId);
    const nextLibrary = removeDocument(dreamLibrary, currentId);
    const fallbackDocument = nextLibrary[0] || null;

    startTransition(() => {
      setDreamLibrary(nextLibrary);
    });

    if (!fallbackDocument?.id) {
      clearRuntimeSurfaceResumeLibrary();
      startTransition(() => {
        setCanvasMode("document");
        setDreamDocument(null);
        setSelectedDocumentId("");
        setStatus(DREAM_PLAYBACK_STATUSES.idle);
        setActiveChunkIndex(0);
        setChunkOffsetMs(0);
        setGlobalOffsetMs(0);
        setResolvedProvider(requestVoiceChoice.provider || null);
        setResolvedVoiceId(requestVoiceChoice.voiceId || null);
        setPasteValue("");
        setShowPaste(false);
        setShowCompilerReadSheet(false);
        setNoticeMessage("Deleted current document from Library. Library is empty.");
        setErrorMessage("");
      });
      return;
    }

    setActiveDreamDocument(fallbackDocument);
    const fallbackSession = loadDreamSession(fallbackDocument.id);
    startTransition(() => {
      setCanvasMode("document");
      applyDocumentState(
        fallbackDocument,
        fallbackSession,
        "Deleted current document from Library. Opened the next saved document.",
      );
    });
  }

  async function persistNextVersion({ runCompilerRead = false } = {}) {
    if (!dreamDocument?.id || !showPaste || !normalizeLongForm(pasteValue)) {
      return;
    }

    try {
      clearCompilerReadSelfCheck(
        dreamDocument.id,
        currentVersion?.versionId || dreamDocument?.contentHash || "",
      );
      clearCompilerReadState();
      setErrorMessage("");
      setNoticeMessage("Saving new version.");
      const replacement = await createNextDreamDocumentVersion(dreamDocument, {
        filename: dreamDocument.filename,
        rawMarkdown: pasteValue,
        sourceKind: dreamDocument.sourceKind,
      });

      resetAudioRuntime();
      saveDreamSession(
        normalizeDreamSession(
          {
            documentId: replacement.id,
            provider: resolvedProvider || requestVoiceChoice.provider,
            voiceId: resolvedVoiceId || requestVoiceChoice.voiceId,
            rate,
            status: DREAM_PLAYBACK_STATUSES.idle,
            activeChunkIndex: 0,
            chunkOffsetMs: 0,
            globalOffsetMs: 0,
            lastOpenedAt: replacement.lastOpenedAt,
          },
          {
            documentId: replacement.id,
            provider: requestVoiceChoice.provider,
            voiceId: requestVoiceChoice.voiceId,
            rate,
            chunkCount: replacement.chunkMap.length,
          },
        ),
      );

      startTransition(() => {
        setDreamLibrary((current) => upsertDocument(current, replacement));
        applyDocumentState(replacement, loadDreamSession(replacement.id), "Saved new version.");
        setShowPaste(false);
      });

      if (runCompilerRead) {
        await runCompilerReadForDocument(replacement);
      }
    } catch (error) {
      setCompilerReadError(
        error instanceof Error ? error.message : "Library could not save the new version.",
      );
    }
  }

  async function handleSaveVersionOnly() {
    await persistNextVersion({ runCompilerRead: false });
  }

  async function handleSaveVersionAndRunCompilerRead() {
    await persistNextVersion({ runCompilerRead: true });
  }

  function handleDiscardPasteEdits() {
    if (!dreamDocument) return;
    setPasteValue(dreamDocument.rawMarkdown || "");
    setNoticeMessage("Unsaved edits discarded.");
  }

  function handleKeepEditing() {
    pasteTextareaRef.current?.focus();
  }

  function handleReturnToDocument() {
    setCompilerReadError("");
    setShowCompilerReadSheet(false);
  }

  async function handleRestorePreviousVersion() {
    if (!dreamDocument?.id || !dreamDocument?.hasPreviousVersion) {
      return;
    }

    try {
      clearCompilerReadState();
      setErrorMessage("");
      const restoredDocument = await restorePreviousDreamDocumentVersion(dreamDocument);
      saveDreamSession(
        normalizeDreamSession(
          {
            documentId: restoredDocument.id,
            provider: resolvedProvider || requestVoiceChoice.provider,
            voiceId: resolvedVoiceId || requestVoiceChoice.voiceId,
            rate,
            status: DREAM_PLAYBACK_STATUSES.idle,
            activeChunkIndex: 0,
            chunkOffsetMs: 0,
            globalOffsetMs: 0,
            lastOpenedAt: restoredDocument.lastOpenedAt,
          },
          {
            documentId: restoredDocument.id,
            provider: requestVoiceChoice.provider,
            voiceId: requestVoiceChoice.voiceId,
            rate,
            chunkCount: restoredDocument.chunkMap.length,
          },
        ),
      );
      startTransition(() => {
        setDreamLibrary((current) => upsertDocument(current, restoredDocument));
        setCanvasMode("document");
        applyDocumentState(restoredDocument, loadDreamSession(restoredDocument.id), "Previous version restored.");
        setShowPaste(false);
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Library could not restore the previous version.",
      );
    }
  }

  function handleTogglePlayback() {
    if (!dreamDocument?.chunkMap?.length) {
      return;
    }

    if (!hasRemoteVoice) {
      setErrorMessage("Library needs ElevenLabs or OpenAI voice configured to listen.");
      return;
    }

    if (status === DREAM_PLAYBACK_STATUSES.active) {
      audioRef.current?.pause();
      return;
    }

    const atEnd = totalDurationMs > 0 && globalOffsetMs >= totalDurationMs - 250;
    const nextPosition = atEnd
      ? {
          index: 0,
          chunkOffsetMs: 0,
        }
      : {
          index: activeChunkIndex,
          chunkOffsetMs,
        };

    void loadChunkIntoAudio(dreamDocument, nextPosition.index, nextPosition.chunkOffsetMs, {
      autoPlay: true,
    });
  }

  async function runCompilerReadForDocument(targetDocument = null) {
    const activeDocument = targetDocument || currentStateRef.current.dreamDocument || null;
    if (!activeDocument?.id || compilerReadPending) {
      return;
    }

    cancelCompilerReadRequest();
    const requestId = compilerReadRequestIdRef.current;
    const requestDocumentId = activeDocument.id;
    const requestVersionId =
      activeDocument.currentVersionId ||
      activeDocument.currentVersion?.versionId ||
      "";
    const controller = new AbortController();
    compilerReadAbortRef.current = controller;
    setCompilerReadError("");
    setCompilerReadPending(true);
    setCopiedRead(false);

    try {
      const response = await fetch("/api/compiler-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: activeDocument.id,
          title: activeDocument.filename,
          text: activeDocument.rawMarkdown || activeDocument.normalizedText || "",
          focus: null,
          strictness: "soft",
          question: null,
        }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.compilerRead) {
        throw new Error(payload?.error || "Compiler Read is unavailable right now.");
      }

      if (
        compilerReadRequestIdRef.current !== requestId ||
        currentStateRef.current.dreamDocument?.id !== requestDocumentId
      ) {
        return;
      }

      const latestDocument = await loadDreamDocument(requestDocumentId);
      if (!latestDocument?.id || latestDocument.currentVersionId !== requestVersionId) {
        return;
      }

      const persistedDocument = await attachCompilerReadToDreamDocument(
        requestDocumentId,
        payload.compilerRead,
      );
      startTransition(() => {
        setDreamLibrary((current) => upsertDocument(current, persistedDocument));
        if (currentStateRef.current.dreamDocument?.id === persistedDocument.id) {
          applyDocumentState(persistedDocument, loadDreamSession(persistedDocument.id), "Compiler Read ready.");
        }
        if (shouldUseLibraryRail()) {
          setCanvasMode("read");
          setShowCompilerReadSheet(false);
        } else {
          setShowCompilerReadSheet(true);
        }
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
      if (
        compilerReadRequestIdRef.current !== requestId ||
        currentStateRef.current.dreamDocument?.id !== requestDocumentId
      ) {
        return;
      }
      setCompilerReadError(
        error instanceof Error ? error.message : "Compiler Read is unavailable right now.",
      );
    } finally {
      if (compilerReadAbortRef.current === controller) {
        compilerReadAbortRef.current = null;
      }
      if (
        compilerReadRequestIdRef.current === requestId &&
        currentStateRef.current.dreamDocument?.id === requestDocumentId
      ) {
        setCompilerReadPending(false);
      }
    }
  }

  async function handleRunCompilerRead() {
    if (!dreamDocument?.id || compilerReadDisabledReason) {
      return;
    }

    if (compilerReadError) {
      clearCompilerReadSelfCheck(
        dreamDocument.id,
        currentVersion?.versionId || dreamDocument?.contentHash || "",
      );
    }

    setCanvasMode("read");
    await runCompilerReadForDocument(dreamDocument);
  }

  function handleOpenCompilerReadInspect() {
    if (!dreamDocument || (!visibleCompilerRead && !compilerReadError && !compilerReadPending)) {
      return;
    }
    setShowCompilerReadSelfCheck(true);
    setShowLibrarySheet(false);
    setShowCompilerReadSheet(true);
  }

  function seekToGlobalOffset(nextGlobalMs) {
    if (!dreamDocument?.chunkMap?.length) {
      return;
    }

    const totalDuration = getDreamQueueDurationMs(
      dreamDocument.chunkMap,
      durationMapRef.current,
    );
    const safeGlobalOffset = Math.max(0, Math.min(nextGlobalMs, totalDuration));
    const nextPosition = findDreamPositionByElapsedMs(
      dreamDocument.chunkMap,
      safeGlobalOffset,
      durationMapRef.current,
    );

    void loadChunkIntoAudio(dreamDocument, nextPosition.index, nextPosition.chunkOffsetMs, {
      autoPlay: status === DREAM_PLAYBACK_STATUSES.active,
    });

    if (status !== DREAM_PLAYBACK_STATUSES.active) {
      setStatus(DREAM_PLAYBACK_STATUSES.paused);
      persistLatestSession({
        activeChunkIndex: nextPosition.index,
        chunkOffsetMs: nextPosition.chunkOffsetMs,
        globalOffsetMs: safeGlobalOffset,
        status: DREAM_PLAYBACK_STATUSES.paused,
      });
    }
  }

  function handleScrubberChange(event) {
    seekToGlobalOffset(Number(event.target.value) || 0);
  }

  function handleRateChange(event) {
    const nextRate = clampListeningRate(event.target.value, rate);
    setRate(nextRate);
  }

  function handleSendToRoom() {
    if (!dreamDocument?.id) {
      return;
    }

    saveDreamBridgePayload({
      kind: "passage",
      state: "pending",
      documentId: dreamDocument.id,
      versionId: currentVersion?.versionId || null,
      versionLabel: currentVersionLabel || null,
      documentTitle: dreamDocument.filename,
      sourceLabel: dreamDocument.filename,
      provenanceLabel: "From Library",
      anchor: currentChunk?.id || "",
      excerpt: currentChunk?.text || dreamDocument.normalizedText.slice(0, 220),
      savedAt: new Date().toISOString(),
    });
    router.push("/workspace");
  }

  function handleDiscussThisRead() {
    if (!dreamDocument?.id || !visibleCompilerRead) {
      return;
    }

    const primaryFinding = normalizeText(visibleCompilerRead?.verdict?.primaryFinding);
    const nextMove = normalizeText(Array.isArray(visibleCompilerRead?.nextMoves) ? visibleCompilerRead.nextMoves[0] : "");
    const readDisposition = normalizeText(visibleCompilerRead?.verdict?.readDisposition);

    saveDreamBridgePayload({
      kind: "read_summary",
      state: "pending",
      documentId: dreamDocument.id,
      versionId: currentVersion?.versionId || null,
      versionLabel: currentVersionLabel || null,
      documentTitle: dreamDocument.filename,
      sourceLabel: dreamDocument.filename,
      provenanceLabel: "From Library",
      anchor: currentChunk?.id || "",
      excerpt: primaryFinding || nextMove || "Discuss this read in Room.",
      savedAt: new Date().toISOString(),
      readSummary: {
        primaryFinding,
        nextMove,
        readDisposition,
      },
      receiptStatus: "",
    });
    router.push("/workspace");
  }

  function handleChooseAnotherDocument() {
    setShowLibraryInstrumentMenu(false);
    setCanvasMode("document");
    setShowCompilerReadSheet(false);
    if (shouldUseLibraryRail()) {
      setShowPaste(false);
      return;
    }
    setShowLibrarySheet(true);
  }

  function handleOpenLibraryManager() {
    setShowLibraryInstrumentMenu(false);
    setCanvasMode("document");
    setShowCompilerReadSheet(false);
    if (shouldUseLibraryRail()) {
      setPasteValue(dreamDocument?.rawMarkdown || "");
      setShowPaste((current) => !current);
      return;
    }
    setShowLibrarySheet(true);
  }

  function handleReplaceDocumentAction() {
    setShowLibraryInstrumentMenu(false);
    setCanvasMode("document");
    setShowCompilerReadSheet(false);
    setPasteValue(dreamDocument?.rawMarkdown || "");
    setShowPaste(true);
    setShowLibrarySheet(!shouldUseLibraryRail());
  }

  function handleOpenCurrentRead() {
    setShowLibraryInstrumentMenu(false);
    if (!visibleCompilerRead && !visibleCompilerReadPending && !visibleCompilerReadError) {
      return;
    }

    if (shouldUseLibraryRail()) {
      setCanvasMode("read");
      setShowCompilerReadSheet(false);
      return;
    }

    setShowCompilerReadSheet(true);
  }

  async function handleCopyCompilerRead() {
    setShowLibraryInstrumentMenu(false);
    if (!visibleCompilerRead || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        formatCompilerReadAsMarkdown({
          title: dreamDocument?.filename || "",
          versionLabel: currentVersionLabel,
          versionCreatedAt: currentVersion?.createdAt || "",
          compilerRead: visibleCompilerRead,
        }),
      );
      setCopiedRead(true);
      setNoticeMessage("Compiler Read copied as markdown.");
    } catch {
      setErrorMessage("Library could not copy this Compiler Read yet.");
    }
  }

  const compilerRepairRow = hasUnsavedPasteChanges ? (
    <div className={styles.compilerRepairRow} data-testid="dream-compiler-read-repair-row">
      <button
        type="button"
        className={styles.actionButton}
        onClick={() => void handleSaveVersionOnly()}
        data-testid="dream-compiler-read-save-version"
      >
        Save as new version
      </button>
      <button
        type="button"
        className={styles.iconTextButton}
        onClick={() => void handleSaveVersionAndRunCompilerRead()}
        data-testid="dream-compiler-read-update-rerun"
      >
        Save and run Compiler Read
      </button>
      <button
        type="button"
        className={styles.iconTextButton}
        onClick={handleDiscardPasteEdits}
        data-testid="dream-compiler-read-discard-edits"
      >
        Discard edits
      </button>
      <button
        type="button"
        className={styles.textButton}
        onClick={handleKeepEditing}
        data-testid="dream-compiler-read-keep-editing"
      >
        Keep editing
      </button>
    </div>
  ) : compilerReadError && !compilerReadPending ? (
    <div className={styles.compilerRepairRow} data-testid="dream-compiler-read-repair-row">
      <button
        type="button"
        className={styles.actionButton}
        onClick={() => void handleRunCompilerRead()}
        data-testid="dream-compiler-read-rerun"
      >
        Run Compiler Read again
      </button>
      <button
        type="button"
        className={styles.iconTextButton}
        onClick={handleReturnToDocument}
        data-testid="dream-compiler-read-return-document"
      >
        Return to document
      </button>
    </div>
  ) : null;

  const versionActionRow =
    dreamDocument?.hasPreviousVersion && !hasUnsavedPasteChanges ? (
      <div className={styles.compilerRepairRow} data-testid="dream-version-actions">
        <button
          type="button"
          className={styles.iconTextButton}
          onClick={() => void handleRestorePreviousVersion()}
          data-testid="dream-restore-previous-version"
        >
          Restore previous version
        </button>
      </div>
    ) : null;

  const compilerReadActions = visibleCompilerRead
    ? [
        {
          label: "Discuss this read",
          onClick: handleDiscussThisRead,
          testId: "dream-discuss-read",
          primary: true,
        },
      ]
    : [];

  const libraryBottomActions = hasUnsavedPasteChanges
    ? [
        {
          label: "Save as new version",
          onClick: () => void handleSaveVersionOnly(),
          testId: "dream-bottom-save-version",
          primary: true,
        },
        {
          label: "Save and run Compiler Read",
          onClick: () => void handleSaveVersionAndRunCompilerRead(),
          testId: "dream-bottom-save-run-read",
        },
      ]
    : visibleCompilerRead
      ? compilerReadActions
      : dreamDocument?.id
        ? [
            {
              label:
                visibleCompilerReadPending
                  ? "Running Compiler Read"
                  : visibleCompilerRead || visibleCompilerReadError
                    ? "Open current read"
                    : "Compiler Read",
              onClick:
                visibleCompilerRead || visibleCompilerReadError
                  ? handleOpenCurrentRead
                  : () => void handleRunCompilerRead(),
              testId: "dream-compiler-read",
              primary: true,
              disabled: Boolean(visibleCompilerReadPending || compilerReadDisabledReason),
            },
          ]
        : [];

  const libraryPanel = (
    <div className={styles.libraryPanel}>
      <div className={styles.libraryPanelHead}>
        <div className={styles.libraryPanelIdentity}>
          <strong>Documents</strong>
          <span>{dreamLibrary.length ? `${dreamLibrary.length} saved` : "No saved documents yet"}</span>
        </div>
      </div>

      {dreamLibrary.length ? (
        <div className={styles.libraryList}>
          {dreamLibrary.map((document) => {
            const documentSummary = getDreamDocumentSummary(document);
            const isActive = document.id === selectedDocumentId;
            return (
              <button
                key={document.id}
                type="button"
                className={`${styles.libraryItem} ${isActive ? styles.libraryItemActive : ""}`}
                onClick={() => void handleSelectDocument(document.id)}
                data-testid="dream-library-item"
              >
                <div className={styles.libraryItemCopy}>
                  <strong>{document.filename}</strong>
                  <span>
                    {documentSummary.wordCount} words
                    {document.libraryStatusLabel ? ` · ${document.libraryStatusLabel}` : ""}
                  </span>
                </div>
                <span className={styles.libraryItemMeta}>
                  {formatDreamTime(document.progressMs || 0)}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={styles.libraryEmpty}>
          <p>No documents yet.</p>
        </div>
      )}
    </div>
  );

  const scopeControl = (
    <button
      type="button"
      className={styles.scopeButton}
      onClick={() => {
        if (dreamDocument?.id) {
          handleOpenLibraryManager();
          return;
        }
        setShowLibrarySheet(true);
      }}
      data-testid="dream-scope-control"
    >
      <strong>
        {dreamDocument
          ? [currentVersionLabel, dreamDocument.libraryStatusLabel || "Library only"].filter(Boolean).join(" · ")
          : "Library only"}
      </strong>
      {!dreamDocument ? <small>No artifact selected</small> : null}
    </button>
  );

  const libraryBottomEdge = (
    <div className={styles.bottomActionBar} data-testid="dream-bottom-edge">
        {showLibraryInstrumentMenu ? (
          <div className={styles.bottomActionMenu} data-testid="dream-bottom-menu">
            <button
              type="button"
              className={styles.bottomActionMenuItem}
              onClick={() => {
                setShowLibraryInstrumentMenu(false);
                setShowPaste(true);
              }}
              data-testid="dream-bottom-menu-paste"
            >
              Paste document
            </button>
            <button
              type="button"
              className={styles.bottomActionMenuItem}
              onClick={() => {
                setShowLibraryInstrumentMenu(false);
                fileInputRef.current?.click();
              }}
              data-testid="dream-bottom-menu-upload"
            >
              Upload markdown
            </button>
            {dreamLibrary.length ? (
              <button
                type="button"
                className={styles.bottomActionMenuItem}
                onClick={handleChooseAnotherDocument}
                data-testid="dream-bottom-menu-choose"
              >
                Choose document
              </button>
            ) : null}
            {dreamDocument?.id ? (
              <button
                type="button"
                className={styles.bottomActionMenuItem}
                onClick={handleOpenLibraryManager}
                data-testid="dream-open-library-manager"
              >
                New / Replace document
              </button>
            ) : null}
            {hasUnsavedPasteChanges ? (
              <button
                type="button"
                className={styles.bottomActionMenuItem}
                onClick={handleDiscardPasteEdits}
                data-testid="dream-bottom-discard-edits"
              >
                Discard edits
              </button>
            ) : null}
            {dreamDocument?.id && !visibleCompilerRead ? (
              <button
                type="button"
                className={styles.bottomActionMenuItem}
                onClick={handleTogglePlayback}
                data-testid="dream-bottom-listen"
              >
                Listen
              </button>
            ) : null}
            {visibleCompilerRead ? (
              <button
                type="button"
                className={styles.bottomActionMenuItem}
                onClick={handleCopyCompilerRead}
                data-testid="dream-copy-read"
              >
                {copiedRead ? "Read copied" : "Copy read as markdown"}
              </button>
            ) : null}
            {visibleCompilerRead ? (
              <button
                type="button"
                className={styles.bottomActionMenuItem}
                onClick={handleChooseAnotherDocument}
                data-testid="dream-choose-document"
              >
                Choose another document
              </button>
            ) : null}
            {dreamDocument?.id ? (
              <button
                type="button"
                className={styles.bottomActionMenuItem}
                onClick={handleReplaceDocumentAction}
                data-testid="dream-replace-document"
              >
                Replace document
              </button>
            ) : null}
            {dreamDocument?.id ? (
              <button
                type="button"
                className={styles.bottomActionMenuItem}
                onClick={handleSendToRoom}
                data-testid="dream-send-to-room"
              >
                Send to Room
              </button>
            ) : null}
            {dreamDocument?.id ? (
              <button
                type="button"
                className={styles.bottomActionMenuItem}
                onClick={handleClear}
                data-testid="dream-clear"
              >
                Delete from Library
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={styles.bottomActionMeta}>
          <strong>{dreamDocument?.filename || "Library"}</strong>
          <span>
            {dreamDocument
              ? [currentVersionLabel, dreamDocument.libraryStatusLabel || "Library only"].filter(Boolean).join(" · ")
              : "No artifact selected"}
          </span>
        </div>

        <div className={styles.bottomActionRow}>
          <button
            type="button"
            className={styles.bottomActionPlus}
            onClick={() => setShowLibraryInstrumentMenu((current) => !current)}
            aria-label="Open Library actions"
            data-testid="dream-bottom-plus"
          >
            <Plus size={16} />
          </button>
          {libraryBottomActions.map((action) => (
            <button
              key={action.testId}
              type="button"
              className={action.primary ? styles.bottomActionPrimary : styles.bottomActionSecondary}
              onClick={() => {
                setShowLibraryInstrumentMenu(false);
                action.onClick?.();
              }}
              disabled={Boolean(action.disabled)}
              data-testid={action.testId}
            >
              {action.label}
            </button>
          ))}
        </div>
    </div>
  );

  const main = (
    <div
      className={`${styles.readerMain} ${isLibraryDropActive ? styles.readerMainDropActive : ""}`}
      data-testid="dream-screen"
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(event) => void handleDrop(event)}
    >
      <audio ref={audioRef} preload="auto" className={styles.hiddenAudio} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        className={styles.hiddenInput}
        onChange={handleFileChange}
        data-testid="dream-upload-input"
      />

      {errorMessage ? (
        <div className={styles.readerBanner} role="alert" aria-live="polite" data-testid="dream-error">
          <CircleAlert size={16} />
          <span>{errorMessage}</span>
        </div>
      ) : null}
      {noticeMessage ? (
        <div className={styles.readerNotice} aria-live="polite" data-testid="dream-notice">
          <span>{noticeMessage}</span>
        </div>
      ) : null}

      <div className={styles.layout}>
        <div data-testid="dream-player" className={styles.stageWrap}>
          <div className={styles.stage}>
            {showPaste ? (
              <div className={styles.pastePanel}>
                <textarea
                  id="dream-paste-input"
                  ref={pasteTextareaRef}
                  className={styles.textarea}
                  value={pasteValue}
                  onChange={(event) => setPasteValue(event.target.value)}
                  placeholder="Paste markdown…"
                  data-testid="dream-paste-input"
                />
                <div className={styles.pasteActions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={handlePasteSubmit}
                    disabled={dreamDocument?.id ? !hasUnsavedPasteChanges : !pasteValue.trim()}
                    data-testid="dream-paste-submit"
                  >
                    <FileText size={15} />
                    <span>{dreamDocument?.id ? "Save as new version" : "Save document"}</span>
                  </button>
                  {dreamDocument?.id ? (
                    <button
                      type="button"
                      className={styles.iconTextButton}
                      onClick={() => void handleSaveVersionAndRunCompilerRead()}
                      disabled={!hasUnsavedPasteChanges}
                      data-testid="dream-paste-submit-run-read"
                    >
                      Save and run Compiler Read
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {compilerReadDisabledReason ? (
              <p
                className={styles.compilerReadDisabledReason}
                data-testid="dream-compiler-read-disabled-reason"
              >
                {compilerReadDisabledReason}
              </p>
            ) : null}
            {compilerRepairRow}
            {versionActionRow}

            {dreamDocument ? (
              <>
                <div className={styles.stageMetaLine}>
                  <span>{summary?.wordCount || 0} words</span>
                  <span>{dreamDocument.libraryStatusLabel || "Library only"}</span>
                  {dreamDocument.versionCount > 1 ? <span>{currentVersionLabel}</span> : null}
                </div>

                {isReadCanvasActive ? (
                  <div className={styles.readCanvas}>
                    <div className={styles.readCanvasHeader}>
                      <button
                        type="button"
                        className={styles.iconTextButton}
                        onClick={() => setCanvasMode("document")}
                        data-testid="dream-open-document"
                      >
                        Open document
                      </button>
                    </div>
                    <CompilerReadPanel
                      documentId={dreamDocument.id}
                      compilerReadKey={currentVersion?.versionId || dreamDocument?.contentHash || ""}
                      documentTitle={dreamDocument.filename}
                      versionLabel={currentVersionLabel}
                      versionCreatedAt={currentVersion?.createdAt || ""}
                      compilerRead={visibleCompilerRead}
                      pending={visibleCompilerReadPending}
                      error={visibleCompilerReadError}
                      stale={isCompilerReadStale}
                      delta={compilerReadDelta}
                      onOpenInspect={handleOpenCompilerReadInspect}
                      actions={[]}
                      showSelfCheck={showCompilerReadSelfCheck}
                      summaryRef={compilerReadSummaryRef}
                    />
                  </div>
                ) : (
                  <>
                    <div className={styles.documentStage}>
                      {chunks.map((chunk, index) => (
                        <p
                          key={chunk.id}
                          className={`${styles.chunk} ${index === activeChunkIndex ? styles.chunkActive : ""}`}
                        >
                          {chunk.text}
                        </p>
                      ))}
                    </div>

                    <div className={styles.scrubRow}>
                      <span data-testid="dream-current-time">{formatDreamTime(globalOffsetMs)}</span>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(totalDurationMs, 1)}
                        step="250"
                        value={Math.min(globalOffsetMs, Math.max(totalDurationMs, 1))}
                        onChange={handleScrubberChange}
                        className={styles.scrubber}
                        data-testid="dream-scrubber"
                      />
                      <span data-testid="dream-total-time">{formatDreamTime(totalDurationMs)}</span>
                    </div>

                    <div className={styles.transportRow}>
                      <button
                        type="button"
                        className={styles.secondaryControl}
                        onClick={() => seekToGlobalOffset(globalOffsetMs - SKIP_BACK_MS)}
                        disabled={!dreamDocument}
                        aria-label="Rewind 15 seconds"
                        title="Rewind 15 seconds"
                        data-testid="dream-rewind"
                      >
                        <RotateCcw size={16} />
                      </button>

                      <button
                        type="button"
                        className={styles.primaryControl}
                        onClick={handleTogglePlayback}
                        disabled={!dreamDocument || isFetchingAudio || !hasRemoteVoice}
                        aria-label={
                          status === DREAM_PLAYBACK_STATUSES.active
                            ? "Pause playback"
                            : globalOffsetMs > 0
                              ? "Continue playback"
                              : "Play markdown"
                        }
                        title={
                          status === DREAM_PLAYBACK_STATUSES.active
                            ? "Pause playback"
                            : globalOffsetMs > 0
                              ? "Continue playback"
                              : "Play markdown"
                        }
                        data-testid="dream-play-toggle"
                      >
                        {isFetchingAudio ? (
                          <LoaderCircle size={22} className={styles.spin} />
                        ) : status === DREAM_PLAYBACK_STATUSES.active ? (
                          <Pause size={24} />
                        ) : (
                          <Play size={24} />
                        )}
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryControl}
                        onClick={() => seekToGlobalOffset(globalOffsetMs + SKIP_FORWARD_MS)}
                        disabled={!dreamDocument}
                        aria-label="Forward 30 seconds"
                        title="Forward 30 seconds"
                        data-testid="dream-forward"
                      >
                        <RotateCw size={16} />
                      </button>

                      <label className={styles.speedControl}>
                        <span>Speed</span>
                        <select value={String(rate)} onChange={handleRateChange} data-testid="dream-speed">
                          {SPEED_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}x
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </>
                )}

                {!hasRemoteVoice ? (
                  <p className={styles.stageHint}>Voice unavailable</p>
                ) : isRestoring ? (
                  <p className={styles.stageHint}>Restoring…</p>
                ) : isPending ? (
                  <p className={styles.stageHint}>Updating…</p>
                ) : visibleCompilerRead && !isReadCanvasActive ? (
                  <p className={styles.stageHint}>Current Compiler Read is ready when you want it.</p>
                ) : null}
              </>
            ) : (
              <div className={styles.emptyStage}>
                <p className={styles.emptyStageCopy}>Choose a document, paste markdown, or upload a file.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <LoegosShell
      route="dream"
      lensLabel="Library"
      title={dreamDocument?.filename || "Library"}
      workspaceLabel={workspaceLabel}
      scopeControl={scopeControl}
      rail={libraryPanel}
      composer={libraryBottomEdge}
      focusMode={isReadCanvasActive}
      main={main}
      sheet={{
        open: showLibrarySheet || compilerReadSheetOpen,
        label: compilerReadSheetOpen ? "Compiler Read" : "Library",
        title: compilerReadSheetOpen ? dreamDocument?.filename || "Compiler Read" : dreamDocument?.filename || "Documents",
        variant: compilerReadSheetOpen ? "takeover" : "sheet",
        onClose: () => {
          setShowLibrarySheet(false);
          setShowCompilerReadSheet(false);
        },
        children: compilerReadSheetOpen ? (
          <CompilerReadPanel
            documentId={dreamDocument?.id || ""}
            compilerReadKey={currentVersion?.versionId || dreamDocument?.contentHash || ""}
            documentTitle={dreamDocument?.filename || ""}
            versionLabel={currentVersionLabel}
            versionCreatedAt={currentVersion?.createdAt || ""}
            compilerRead={visibleCompilerRead}
            pending={visibleCompilerReadPending}
            error={visibleCompilerReadError}
            stale={isCompilerReadStale}
            delta={compilerReadDelta}
            mode="detail"
            showSelfCheck={showCompilerReadSelfCheck}
          />
        ) : (
          libraryPanel
        ),
      }}
    />
  );
}
