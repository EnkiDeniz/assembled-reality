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
  FolderOpen,
  Headphones,
  Library,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import LoegosShell, {
  Kicker,
  SignalChip,
  Surface as ShellSurface,
} from "@/components/shell/LoegosShell";
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
  deleteDreamDocument,
  listDreamDocuments,
  loadActiveDreamDocument,
  loadDreamSession,
  replaceActiveDreamDocument,
  saveDreamDocument,
  saveDreamSession,
  setActiveDreamDocument,
} from "@/lib/dream-storage";
import { saveDreamBridgePayload } from "@/lib/dream-bridge";
import { clampListeningRate, formatVoiceLabel } from "@/lib/listening";
import { buildEchoPulseState } from "@/lib/loegos-shell";

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

export default function SectionDreamScreen({
  initialVoiceChoice = null,
  voiceCatalog = [],
  initialRate = DREAM_DEFAULT_RATE,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestVoiceChoice = initialVoiceChoice || {
    provider: null,
    voiceId: null,
    label: "Voice",
  };
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const chunkCacheRef = useRef(new Map());
  const durationMapRef = useRef({});
  const generationRef = useRef(0);
  const lastPersistedAtRef = useRef(0);
  const pendingSeekMsRef = useRef(null);
  const suppressPauseRef = useRef(false);
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
  const [pasteValue, setPasteValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
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
  const currentVoiceLabel =
    resolvedProvider || requestVoiceChoice.provider
      ? formatVoiceLabel(
          resolvedProvider || requestVoiceChoice.provider,
          resolvedVoiceId || requestVoiceChoice.voiceId,
        )
      : requestVoiceChoice.label || "Voice";
  const hasRemoteVoice = voiceCatalog.length > 0;
  const currentChunk = chunks[activeChunkIndex] || null;
  const requestedDocumentId = String(searchParams?.get("document") || "").trim();
  const requestedAnchor = String(searchParams?.get("anchor") || "").trim();

  const cleanupChunkCache = useCallback(() => {
    for (const entry of chunkCacheRef.current.values()) {
      if (entry?.url) {
        URL.revokeObjectURL(entry.url);
      }
    }

    chunkCacheRef.current.clear();
  }, []);

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
    setNotice(nextNotice);
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

    const persistedDocument = {
      ...documentRecord,
      progressMs: snapshot.globalOffsetMs,
      lastOpenedAt: snapshot.lastOpenedAt,
      totalDurationMs:
        Number(documentRecord.totalDurationMs) ||
        getDreamQueueDurationMs(documentRecord.chunkMap, durationMapRef.current),
    };

    updateDocumentInState(persistedDocument);
    void saveDreamDocument(persistedDocument).catch(() => {});
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
          payload?.error || "Dream Library could not fetch voice audio for this markdown chunk.",
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
      setNotice("");

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
          error instanceof Error ? error.message : "Dream Library could not continue playback.",
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
      const initialDocument =
        queryDocument ||
        (storedDocument?.id ? storedDocument : nextLibrary[0] || null);
      if (!initialDocument?.id) {
        return;
      }

      const storedSession = loadDreamSession(initialDocument.id);
      resetAudioRuntime();
      startTransition(() => {
        applyDocumentState(
          initialDocument,
          storedSession,
          storedSession?.globalOffsetMs
            ? `Resume ready from ${formatDreamTime(storedSession.globalOffsetMs)}.`
            : "Dream Library restored.",
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
          : "Dream Library could not restore the last listening state.",
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
      setErrorMessage("Dream Library needs markdown before it can start listening.");
      return;
    }

    try {
      setErrorMessage("");
      setNotice("Preparing markdown for listening.");
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
      await replaceActiveDreamDocument(documentRecord);
      saveDreamSession(nextSession);
      setDreamLibrary((current) => upsertDocument(current, documentRecord));

      startTransition(() => {
        applyDocumentState(
          documentRecord,
          nextSession,
          autoPlay ? "Loading voice." : "Ready to play.",
        );
        setShowLibrarySheet(false);
      });

      if (autoPlay && hasRemoteVoice) {
        await loadChunkIntoAudio(documentRecord, 0, 0, { autoPlay: true });
      } else if (!hasRemoteVoice) {
        setStatus(DREAM_PLAYBACK_STATUSES.paused);
        setNotice("Markdown is ready. Add a remote voice provider to listen.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Dream Library could not prepare that markdown file.",
      );
      setNotice("");
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isDreamMarkdownFilename(file.name)) {
      setErrorMessage("Dream Library accepts only .md or .markdown files right now.");
      return;
    }

    const rawMarkdown = await file.text();
    startTransition(() => {
      setNotice("Preparing markdown for listening.");
    });
    await ingestMarkdown({
      rawMarkdown,
      filename: file.name,
      sourceKind: DREAM_SOURCE_KINDS.upload,
      autoPlay: true,
    });
  }

  async function handlePasteSubmit() {
    await ingestMarkdown({
      rawMarkdown: pasteValue,
      filename: "dream-library-paste.md",
      sourceKind: DREAM_SOURCE_KINDS.paste,
      autoPlay: true,
    });
  }

  async function handleSelectDocument(documentId) {
    const normalizedDocumentId = String(documentId || "").trim();
    if (!normalizedDocumentId || normalizedDocumentId === selectedDocumentId) {
      setShowLibrarySheet(false);
      return;
    }

    try {
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
        applyDocumentState(resolvedDocument, storedSession, "");
        setShowLibrarySheet(false);
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Dream Library could not open that document.",
      );
    }
  }

  async function handleClear() {
    if (!dreamDocument?.id) {
      return;
    }

    const currentId = dreamDocument.id;
    resetAudioRuntime();
    await deleteDreamDocument(currentId);
    const nextLibrary = removeDocument(dreamLibrary, currentId);
    const fallbackDocument = nextLibrary[0] || null;

    startTransition(() => {
      setDreamLibrary(nextLibrary);
    });

    if (!fallbackDocument?.id) {
      startTransition(() => {
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
        setNotice("Dream Library cleared.");
        setErrorMessage("");
      });
      return;
    }

    setActiveDreamDocument(fallbackDocument);
    const fallbackSession = loadDreamSession(fallbackDocument.id);
    startTransition(() => {
      applyDocumentState(fallbackDocument, fallbackSession, "Opened the next document.");
    });
  }

  function handleTogglePlayback() {
    if (!dreamDocument?.chunkMap?.length) {
      return;
    }

    if (!hasRemoteVoice) {
      setErrorMessage("Dream Library needs ElevenLabs or OpenAI voice configured to listen.");
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
      documentId: dreamDocument.id,
      anchor: currentChunk?.id || "",
      excerpt: currentChunk?.text || dreamDocument.normalizedText.slice(0, 220),
      action: "witness",
    });
    router.push("/workspace");
  }

  const dreamEcho = buildEchoPulseState({
    change: notice,
    tension: errorMessage,
    survives: globalOffsetMs > 0 ? `Resume ${formatDreamTime(globalOffsetMs)}` : "",
  });

  const libraryControl = (
    <button
      type="button"
      className={styles.libraryToggle}
      onClick={() => setShowLibrarySheet(true)}
      aria-label="Open Dream Library"
      title="Open Dream Library"
      data-testid="dream-library-toggle"
    >
      <Library size={16} aria-hidden="true" />
      <span>{dreamLibrary.length}</span>
    </button>
  );

  const libraryPanel = (
    <div className={styles.libraryPanel}>
      <div className={styles.libraryPanelHead}>
        <div className={styles.libraryPanelIdentity}>
          <Kicker tone="brand">Dream Library</Kicker>
          <strong>{dreamLibrary.length ? `${dreamLibrary.length} documents` : "Empty"}</strong>
        </div>
        <div className={styles.libraryPanelActions}>
          <button
            type="button"
            className={styles.iconAction}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload markdown"
            title="Upload markdown"
            data-testid="dream-upload-button"
          >
            <Upload size={16} />
          </button>
          <button
            type="button"
            className={`${styles.iconAction} ${showPaste ? styles.iconActionActive : ""}`}
            onClick={() => setShowPaste((current) => !current)}
            aria-label={showPaste ? "Hide paste input" : "Paste markdown"}
            title={showPaste ? "Hide paste input" : "Paste markdown"}
            data-testid="dream-paste-toggle"
          >
            <FileText size={16} />
          </button>
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
                  <span>{documentSummary.wordCount} words</span>
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
          <FolderOpen size={20} />
          <p>No documents yet.</p>
        </div>
      )}
    </div>
  );

  const main = (
    <div className={styles.readerMain} data-testid="dream-screen">
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
        <div className={styles.readerBanner} data-testid="dream-error">
          <CircleAlert size={16} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className={styles.layout}>
        <aside className={styles.libraryRail}>{libraryPanel}</aside>

        <div data-testid="dream-player" className={styles.stageWrap}>
          <ShellSurface className={styles.stage} roomy>
            <div className={styles.stageHead}>
              <div className={styles.stageIdentity}>
                <Kicker tone={dreamDocument ? "brand" : "neutral"}>Dream Library</Kicker>
                <strong>{dreamDocument?.filename || "Dream Library"}</strong>
              </div>

              <div className={styles.stageActions}>
                <button
                  type="button"
                  className={styles.iconAction}
                  onClick={() => setShowLibrarySheet(true)}
                  aria-label="Browse library"
                  title="Browse library"
                >
                  <Library size={16} />
                </button>
                {dreamDocument ? (
                  <>
                    <button
                      type="button"
                      className={styles.iconAction}
                      onClick={handleSendToRoom}
                      aria-label="Send to Room"
                      title="Send to Room"
                      data-testid="dream-send-to-room"
                    >
                      <Send size={16} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconAction}
                      onClick={handleClear}
                      aria-label="Remove document"
                      title="Remove document"
                      data-testid="dream-clear"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {showPaste ? (
              <div className={styles.pastePanel}>
                <textarea
                  id="dream-paste-input"
                  className={styles.textarea}
                  value={pasteValue}
                  onChange={(event) => setPasteValue(event.target.value)}
                  placeholder="Paste markdown…"
                  data-testid="dream-paste-input"
                />
                <button
                  type="button"
                  className={styles.pasteSubmit}
                  onClick={handlePasteSubmit}
                  disabled={!pasteValue.trim()}
                  data-testid="dream-paste-submit"
                >
                  <Headphones size={15} />
                </button>
              </div>
            ) : null}

            {dreamDocument ? (
              <>
                <div className={styles.stageMeta}>
                  <SignalChip tone={hasRemoteVoice ? "brand" : "neutral"} data-testid="dream-voice-badge">
                    {currentVoiceLabel}
                  </SignalChip>
                  <SignalChip tone="neutral">
                    {summary?.wordCount || 0} words
                  </SignalChip>
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

                {!hasRemoteVoice ? (
                  <p className={styles.stageHint}>Voice unavailable</p>
                ) : isRestoring ? (
                  <p className={styles.stageHint}>Restoring…</p>
                ) : isPending ? (
                  <p className={styles.stageHint}>Updating…</p>
                ) : null}
              </>
            ) : (
              <div className={styles.emptyStage}>
                <Headphones size={30} />
                <div className={styles.emptyStageActions}>
                  <button
                    type="button"
                    className={styles.primaryControl}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload markdown"
                    title="Upload markdown"
                    data-testid="dream-empty-upload"
                  >
                    <Upload size={20} />
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryControl}
                    onClick={() => setShowPaste(true)}
                    aria-label="Paste markdown"
                    title="Paste markdown"
                    data-testid="dream-empty-paste"
                  >
                    <FileText size={18} />
                  </button>
                </div>
              </div>
            )}
          </ShellSurface>
        </div>
      </div>
    </div>
  );

  return (
    <LoegosShell
      route="dream"
      title={dreamDocument?.filename || "Dream Library"}
      contextControl={libraryControl}
      pulse={dreamEcho.pulse}
      main={main}
      sheet={{
        open: showLibrarySheet,
        label: "Dream Library",
        title: dreamDocument?.filename || "Documents",
        onClose: () => setShowLibrarySheet(false),
        children: libraryPanel,
      }}
    />
  );
}
