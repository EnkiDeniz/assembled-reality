"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FastForward,
  Pause,
  Play,
  Rewind,
  SkipBack,
  SkipForward,
} from "lucide-react";
import FounderInfoPanel from "@/components/founder/FounderInfoPanel";
import FounderWitnessPane from "@/components/founder/FounderWitnessPane";
import LoegosRenderer from "@/components/founder/LoegosRenderer";
import { ShapeGlyph, SignalChip } from "@/components/LoegosSystem";
import RealityAssemblyAddSourceDialog from "@/components/reality-assembly/RealityAssemblyAddSourceDialog";
import WorkspaceDocumentWorkbench from "@/components/workspace/WorkspaceDocumentWorkbench";
import {
  clampListeningRate,
  formatVoiceLabel,
  resolvePreferredVoiceChoice,
  VOICE_PROVIDERS,
} from "@/lib/listening";
import {
  getProjectByKey,
  getProjectDocuments,
  hydrateProjectWithDocuments,
} from "@/lib/project-model";
import {
  getSeedDocument,
  listRealSourceDocuments,
  normalizeSeedMeta,
} from "@/lib/seed-model";

const VIEW_KEYS = Object.freeze({
  box: "box",
  witness: "witness",
  compare: "compare",
  language: "language",
  receipt: "receipt",
});

const NAV_ITEMS = [
  {
    key: "aim",
    label: "Aim",
    verb: "declare",
    description: "Direction, declaration, next move.",
    selection: VIEW_KEYS.box,
  },
  {
    key: "reality",
    label: "Reality",
    verb: "capture",
    description: "Capture, listen, inspect what is here.",
    selection: VIEW_KEYS.witness,
  },
  {
    key: "weld",
    label: "Weld",
    verb: "rewrite",
    description: "Compile, compare, shape the structure.",
    selection: VIEW_KEYS.compare,
  },
  {
    key: "seal",
    label: "Seal",
    verb: "review",
    description: "Review, receipt, carry the return.",
    selection: VIEW_KEYS.receipt,
  },
];

function browserSupportsDeviceVoice() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function normalizeView(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return VIEW_KEYS[normalized] || VIEW_KEYS.box;
}

function getDocumentTimestamp(document = null) {
  const parsed = Date.parse(document?.updatedAt || document?.createdAt || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function replaceDocument(documents = [], nextDocument = null) {
  if (!nextDocument?.documentKey) return documents;
  const nextDocuments = Array.isArray(documents) ? [...documents] : [];
  const existingIndex = nextDocuments.findIndex(
    (document) => document.documentKey === nextDocument.documentKey,
  );

  if (existingIndex === -1) {
    nextDocuments.push(nextDocument);
    return nextDocuments;
  }

  nextDocuments[existingIndex] = nextDocument;
  return nextDocuments;
}

function isAdvanceMarked(block = null) {
  return block?.advancementMark?.kind === "advance";
}

function countMarkedBlocks(document = null) {
  return (Array.isArray(document?.blocks) ? document.blocks : []).filter(isAdvanceMarked).length;
}

function listWitnessDocuments(projectDocuments = []) {
  return listRealSourceDocuments(projectDocuments).sort(
    (left, right) => getDocumentTimestamp(right) - getDocumentTimestamp(left),
  );
}

function buildQueryString(pathname, nextParams = {}) {
  const search = new URLSearchParams();

  Object.entries(nextParams).forEach(([key, value]) => {
    const normalized = String(value || "").trim();
    if (normalized) {
      search.set(key, normalized);
    }
  });

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildPlaybackBlocks(document = null) {
  return (Array.isArray(document?.blocks) ? document.blocks : []).filter(
    (block) => block?.isPlayable !== false,
  );
}

function buildBoxHomeSections({
  activeProject,
  latestWitness,
  markedBlockCount = 0,
  activeLanguageDocument = null,
  latestReceipt = null,
  onAddSource,
  onResumeWitness,
  onOpenCompare,
}) {
  const seedMeta = normalizeSeedMeta(activeLanguageDocument?.seedMeta);
  const languageStatus = !activeLanguageDocument
    ? "No active Lœgos yet"
    : seedMeta.compiledFromDocumentKey
      ? `Compiled from ${seedMeta.compiledFromTitle || "witness"}`
      : "Language object is present";

  const receiptStatus = latestReceipt
    ? latestReceipt.courthouseStatusLine || latestReceipt.statusLabel || "Draft"
    : "No receipt yet";

  return [
    {
      key: "aim",
      label: "Aim",
      title: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
      copy: activeProject?.boxSubtitle || activeProject?.subtitle || "State what this box is trying to make real.",
      items: [
        {
          key: "witnesses",
          label: "Witnesses",
          value: String(listWitnessDocuments(getProjectDocuments([], activeProject)).length || activeProject?.sourceCount || 0),
        },
        {
          key: "advanced",
          label: "Advanced blocks",
          value: String(markedBlockCount),
        },
      ],
      action: {
        label: "Add source",
        primary: true,
        testId: "ra-box-add-source",
        onClick: onAddSource,
      },
    },
    {
      key: "reality",
      label: "Reality",
      title: latestWitness?.title || "No witness yet",
      copy: latestWitness
        ? "Resume reading and listening from the latest witness object."
        : "Bring one source into the box to start the assembly trace.",
      items: latestWitness
        ? [
            {
              key: "blocks",
              label: "Blocks",
              value: String((latestWitness.blocks || []).length),
            },
            {
              key: "marked",
              label: "Marked",
              value: String(countMarkedBlocks(latestWitness)),
            },
          ]
        : [],
      action: latestWitness
        ? {
            label: "Resume listening",
            primary: true,
            testId: "ra-box-resume-witness",
            onClick: onResumeWitness,
          }
        : null,
    },
    {
      key: "weld",
      label: "Weld",
      title: languageStatus,
      copy: activeLanguageDocument
        ? "Witness and Lœgos remain separate. Recompile only when the witness has truly changed."
        : "Compile witness into Lœgos only when you are ready to inspect what became more operable.",
      action: activeLanguageDocument
        ? {
            label: "Open compare",
            primary: false,
            testId: "ra-box-open-compare",
            onClick: onOpenCompare,
          }
        : null,
    },
    {
      key: "seal",
      label: "Seal",
      title: receiptStatus,
      copy: latestReceipt
        ? "Receipts remain in the box as the trace of what the world actually returned."
        : "No receipt-bearing cycle has been completed in this preview shell yet.",
    },
  ];
}

function parseSevenAudioHeaders(headers) {
  return {
    provider: String(headers.get("X-Seven-Provider") || "").trim() || null,
    voiceId: String(headers.get("X-Seven-Voice-Id") || "").trim() || null,
  };
}

function formatPlaybackError(error) {
  const message = String(error?.message || "").trim();
  if (!message) {
    return "Playback could not start. Your place is preserved.";
  }

  return message;
}

function RealityAssemblyPlayerBar({
  collapsed = false,
  playbackAvailable = false,
  isPlaying = false,
  loadingAudio = false,
  currentIndex = 0,
  totalBlocks = 0,
  rate = 1,
  voiceCatalog = [],
  voiceChoice = null,
  providerLabel = "Voice",
  sourceOptions = [],
  selectedSourceKey = "",
  onSelectSource,
  onTogglePlayback,
  onPreviousBlock,
  onNextBlock,
  onSeekBack,
  onSeekForward,
  onCycleRate,
  onVoiceChange,
}) {
  const selectedVoiceValue = voiceChoice
    ? `${voiceChoice.provider}:${voiceChoice.voiceId || "default"}`
    : "";

  return (
    <div className={`assembler-player ${collapsed ? "assembler-player--collapsed" : ""} is-docked`}>
      <div className="assembler-player__controls">
        <button
          type="button"
          className="assembler-player__button"
          onClick={onPreviousBlock}
          disabled={!playbackAvailable}
          title="Previous block"
          aria-label="Previous block"
        >
          <SkipBack size={16} strokeWidth={1.7} />
        </button>
        <button
          type="button"
          className={`assembler-player__button is-primary ${isPlaying ? "is-playing" : ""}`}
          onClick={onTogglePlayback}
          disabled={!playbackAvailable}
          title={isPlaying ? "Pause" : "Play"}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {loadingAudio ? "…" : isPlaying ? <Pause size={16} strokeWidth={1.7} /> : <Play size={16} strokeWidth={1.7} />}
        </button>
        <button
          type="button"
          className="assembler-player__button"
          onClick={onNextBlock}
          disabled={!playbackAvailable}
          title="Next block"
          aria-label="Next block"
        >
          <SkipForward size={16} strokeWidth={1.7} />
        </button>
        <button
          type="button"
          className="assembler-player__button"
          onClick={onSeekBack}
          disabled={!playbackAvailable}
          title="Back 10 seconds"
          aria-label="Back 10 seconds"
        >
          <Rewind size={16} strokeWidth={1.7} />
        </button>
        <button
          type="button"
          className="assembler-player__button"
          onClick={onSeekForward}
          disabled={!playbackAvailable}
          title="Forward 10 seconds"
          aria-label="Forward 10 seconds"
        >
          <FastForward size={16} strokeWidth={1.7} />
        </button>
      </div>

      <div className="assembler-player__progress">
        <span className="assembler-player__counter">
          {totalBlocks ? `${currentIndex + 1}/${totalBlocks}` : "0/0"}
        </span>
        <div className="assembler-player__rail">
          <div
            className="assembler-player__fill"
            style={{
              width: `${totalBlocks ? Math.max(0, Math.min(100, ((currentIndex + 1) / totalBlocks) * 100)) : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="assembler-player__meta">
        {sourceOptions.length > 1 ? (
          <div className="assembler-player__sources" role="group" aria-label="Playback source">
            {sourceOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`assembler-player__source ${selectedSourceKey === option.key ? "is-active" : ""}`}
                onClick={() => onSelectSource?.(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <button type="button" className="assembler-player__button" onClick={onCycleRate}>
          {rate.toFixed(2).replace(/\.00$/, "")}x
        </button>

        <select
          className="assembler-player__select"
          value={selectedVoiceValue}
          onChange={(event) => {
            const [provider, voiceId] = event.target.value.split(":");
            onVoiceChange?.(
              voiceCatalog.find(
                (entry) =>
                  entry.provider === provider &&
                  String(entry.voiceId || "default") === String(voiceId || "default"),
              ) || voiceCatalog[0] || null,
            );
          }}
          disabled={!voiceCatalog.length}
        >
          {voiceCatalog.map((entry) => (
            <option
              key={`${entry.provider}:${entry.voiceId || "default"}`}
              value={`${entry.provider}:${entry.voiceId || "default"}`}
            >
              {entry.label}
            </option>
          ))}
        </select>

        <span className="assembler-player__status">
          {playbackAvailable ? providerLabel : "Voice unavailable"}
        </span>
      </div>
    </div>
  );
}

export default function RealityAssemblyShell({
  userId,
  documents,
  projects,
  projectDrafts = [],
  initialDocument,
  initialProjectKey = "",
  voiceCatalog = [],
  defaultVoiceChoice = null,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [documentsState, setDocumentsState] = useState(
    Array.isArray(documents) ? documents : [],
  );
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [focusBlockId, setFocusBlockId] = useState("");
  const [selectedWitnessBlockId, setSelectedWitnessBlockId] = useState("");
  const [selectedLanguageBlockId, setSelectedLanguageBlockId] = useState("");
  const [learnerMode, setLearnerMode] = useState(false);
  const [actionPendingId, setActionPendingId] = useState("");
  const [blockSaveStates, setBlockSaveStates] = useState({});
  const [compilePending, setCompilePending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [playerSource, setPlayerSource] = useState("witness");
  const [voiceChoice, setVoiceChoice] = useState(
    resolvePreferredVoiceChoice(voiceCatalog, defaultVoiceChoice?.provider, defaultVoiceChoice?.voiceId),
  );
  const [rate, setRate] = useState(1);
  const [providerLabel, setProviderLabel] = useState(
    formatVoiceLabel(defaultVoiceChoice?.provider, defaultVoiceChoice?.voiceId),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [currentBlockId, setCurrentBlockId] = useState("");
  const [nextBlockId, setNextBlockId] = useState("");

  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const speechUtteranceRef = useRef(null);
  const speechRunIdRef = useRef(0);
  const playbackStateRef = useRef({
    active: false,
    paused: false,
    kind: null,
    documentKey: "",
  });

  const requestedProjectKey =
    String(searchParams.get("project") || "").trim() || initialProjectKey || "";
  const requestedView = normalizeView(searchParams.get("view") || VIEW_KEYS.box);
  const requestedDocumentKey = String(searchParams.get("document") || "").trim();
  const requestedSourceKey = String(searchParams.get("source") || "").trim();

  const activeProject = useMemo(
    () =>
      hydrateProjectWithDocuments(
        getProjectByKey(projects, requestedProjectKey || initialProjectKey || ""),
        documentsState,
      ),
    [documentsState, initialProjectKey, projects, requestedProjectKey],
  );
  const projectDocuments = useMemo(
    () => getProjectDocuments(documentsState, activeProject),
    [activeProject, documentsState],
  );
  const witnessDocuments = useMemo(
    () => listWitnessDocuments(projectDocuments),
    [projectDocuments],
  );
  const latestWitnessDocument = witnessDocuments[0] || null;
  const activeWitnessDocument = useMemo(() => {
    const requested = witnessDocuments.find(
      (document) => document.documentKey === requestedDocumentKey,
    );
    if (requested) return requested;
    if (requestedView === VIEW_KEYS.compare && requestedSourceKey) {
      return (
        witnessDocuments.find((document) => document.documentKey === requestedSourceKey) ||
        latestWitnessDocument
      );
    }
    if (requestedView === VIEW_KEYS.witness) {
      return latestWitnessDocument;
    }
    return latestWitnessDocument || initialDocument || null;
  }, [
    initialDocument,
    latestWitnessDocument,
    requestedDocumentKey,
    requestedSourceKey,
    requestedView,
    witnessDocuments,
  ]);
  const activeLanguageDocument = useMemo(
    () =>
      projectDocuments.find((document) => document.documentKey === requestedDocumentKey) ||
      getSeedDocument(activeProject, projectDocuments),
    [activeProject, projectDocuments, requestedDocumentKey],
  );
  const latestReceipt =
    activeProject?.projectKey === initialProjectKey ? projectDrafts[0] || null : null;

  const markedBlockCount = useMemo(
    () =>
      witnessDocuments.reduce((count, document) => count + countMarkedBlocks(document), 0),
    [witnessDocuments],
  );

  const playbackDocument =
    requestedView === VIEW_KEYS.compare && playerSource === "language"
      ? activeLanguageDocument
      : activeWitnessDocument;
  const playbackBlocks = useMemo(
    () => buildPlaybackBlocks(playbackDocument),
    [playbackDocument],
  );
  const currentPlaybackIndex = Math.max(
    0,
    playbackBlocks.findIndex((block) => block.id === currentBlockId),
  );
  const playbackAvailable =
    playbackBlocks.length > 0 &&
    Boolean(voiceChoice?.provider) &&
    (voiceChoice?.provider !== VOICE_PROVIDERS.device || browserSupportsDeviceVoice());

  const selectedAdvanceIds = useMemo(
    () =>
      new Set(
        (Array.isArray(activeWitnessDocument?.blocks) ? activeWitnessDocument.blocks : [])
          .filter(isAdvanceMarked)
          .map((block) => block.id),
      ),
    [activeWitnessDocument],
  );

  const compareSourceDocument =
    requestedSourceKey && requestedView === VIEW_KEYS.compare
      ? witnessDocuments.find((document) => document.documentKey === requestedSourceKey) ||
        activeWitnessDocument
      : activeWitnessDocument;

  const languageSeedMeta = normalizeSeedMeta(activeLanguageDocument?.seedMeta);
  const witnessIsStale =
    Boolean(compareSourceDocument?.documentKey) &&
    compareSourceDocument?.documentKey === languageSeedMeta.compiledFromDocumentKey &&
    Boolean(compareSourceDocument?.updatedAt) &&
    String(compareSourceDocument.updatedAt) !== String(languageSeedMeta.compiledFromUpdatedAt || "");

  const boxHomeSections = useMemo(
    () =>
      buildBoxHomeSections({
        activeProject,
        latestWitness: latestWitnessDocument,
        markedBlockCount,
        activeLanguageDocument,
        latestReceipt,
        onAddSource: () => setAddSourceOpen(true),
        onResumeWitness: () => {
          if (!latestWitnessDocument?.documentKey) return;
          router.push(
            buildQueryString(pathname, {
              project: activeProject?.projectKey || requestedProjectKey || initialProjectKey,
              view: VIEW_KEYS.witness,
              document: latestWitnessDocument.documentKey,
            }),
          );
        },
        onOpenCompare: () => {
          if (!activeLanguageDocument?.documentKey) return;
          router.push(
            buildQueryString(pathname, {
              project: activeProject?.projectKey || requestedProjectKey || initialProjectKey,
              view: VIEW_KEYS.compare,
              source:
                languageSeedMeta.compiledFromDocumentKey || compareSourceDocument?.documentKey || "",
              document: activeLanguageDocument.documentKey,
            }),
          );
        },
      }),
    [
      activeLanguageDocument,
      activeProject,
      compareSourceDocument?.documentKey,
      initialProjectKey,
      languageSeedMeta.compiledFromDocumentKey,
      latestReceipt,
      latestWitnessDocument,
      markedBlockCount,
      pathname,
      requestedProjectKey,
      router,
    ],
  );

  const playerSourceOptions = useMemo(() => {
    if (requestedView !== VIEW_KEYS.compare) {
      return [];
    }

    return [
      compareSourceDocument?.documentKey
        ? { key: "witness", label: "Witness" }
        : null,
      activeLanguageDocument?.documentKey
        ? { key: "language", label: "Language" }
        : null,
    ].filter(Boolean);
  }, [activeLanguageDocument?.documentKey, compareSourceDocument?.documentKey, requestedView]);

  useEffect(() => {
    setDocumentsState(Array.isArray(documents) ? documents : []);
  }, [documents]);

  useEffect(() => {
    if (requestedView !== VIEW_KEYS.compare) {
      setPlayerSource("witness");
    } else if (playerSource === "language" && !activeLanguageDocument?.documentKey) {
      setPlayerSource("witness");
    }
  }, [activeLanguageDocument?.documentKey, playerSource, requestedView]);

  const persistListeningSession = useCallback(
    async (status = "paused", block = null, document = playbackDocument) => {
      if (!document?.documentKey) return;

      await fetch("/api/reader/listening-session", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentKey: document.documentKey,
          mode: "flow",
          activeNodeId: block?.id || null,
          activeSectionSlug: block?.sectionSlug || null,
          rate,
          provider: voiceChoice?.provider || null,
          voiceId: voiceChoice?.voiceId || null,
          status,
          preferredVoiceProvider: voiceChoice?.provider || undefined,
          preferredVoiceId: voiceChoice?.voiceId || undefined,
          preferredListeningRate: rate,
        }),
      }).catch(() => {});
    },
    [playbackDocument, rate, voiceChoice?.provider, voiceChoice?.voiceId],
  );

  const stopPlayback = useCallback(
    ({ keepPosition = true } = {}) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (speechUtteranceRef.current && browserSupportsDeviceVoice()) {
        window.speechSynthesis.cancel();
        speechUtteranceRef.current = null;
      }
      speechRunIdRef.current += 1;
      playbackStateRef.current = {
        active: false,
        paused: false,
        kind: null,
        documentKey: playbackDocument?.documentKey || "",
      };
      setIsPlaying(false);
      setLoadingAudio(false);
      if (!keepPosition) {
        setCurrentBlockId("");
        setNextBlockId("");
      }
    },
    [playbackDocument?.documentKey],
  );

  useEffect(() => () => stopPlayback({ keepPosition: false }), [stopPlayback]);

  useEffect(() => {
    stopPlayback({ keepPosition: false });

    if (!playbackDocument?.documentKey) return undefined;

    let cancelled = false;
    const fallbackChoice = resolvePreferredVoiceChoice(
      voiceCatalog,
      defaultVoiceChoice?.provider,
      defaultVoiceChoice?.voiceId,
    );

    async function hydrateListeningState() {
      try {
        const response = await fetch(
          `/api/reader/listening-session?documentKey=${encodeURIComponent(playbackDocument.documentKey)}`,
        );
        const payload = await response.json().catch(() => null);
        if (cancelled) return;

        const preferred = resolvePreferredVoiceChoice(
          voiceCatalog,
          payload?.voicePreferences?.preferredVoiceProvider ||
            payload?.listeningSession?.provider ||
            fallbackChoice?.provider,
          payload?.voicePreferences?.preferredVoiceId ||
            payload?.listeningSession?.voiceId ||
            fallbackChoice?.voiceId,
        );
        const nextRate = clampListeningRate(
          payload?.voicePreferences?.preferredListeningRate ||
            payload?.listeningSession?.rate ||
            1,
          1,
        );
        const activeNodeId = String(payload?.listeningSession?.activeNodeId || "").trim();
        const initialBlock =
          playbackBlocks.find((block) => block.id === activeNodeId) || playbackBlocks[0] || null;
        const initialIndex = initialBlock
          ? playbackBlocks.findIndex((block) => block.id === initialBlock.id)
          : -1;

        setVoiceChoice(preferred);
        setRate(nextRate);
        setProviderLabel(formatVoiceLabel(preferred?.provider, preferred?.voiceId));
        setCurrentBlockId(initialBlock?.id || "");
        setNextBlockId(
          initialIndex >= 0 ? playbackBlocks[initialIndex + 1]?.id || "" : playbackBlocks[1]?.id || "",
        );
      } catch {
        if (cancelled) return;
        setVoiceChoice(fallbackChoice);
        setProviderLabel(formatVoiceLabel(fallbackChoice?.provider, fallbackChoice?.voiceId));
        setRate(1);
        setCurrentBlockId(playbackBlocks[0]?.id || "");
        setNextBlockId(playbackBlocks[1]?.id || "");
      }
    }

    void hydrateListeningState();

    return () => {
      cancelled = true;
    };
  }, [
    defaultVoiceChoice?.provider,
    defaultVoiceChoice?.voiceId,
    playbackBlocks,
    playbackDocument?.documentKey,
    stopPlayback,
    voiceCatalog,
  ]);

  useEffect(() => {
    if (!currentBlockId) return;

    if (requestedView === VIEW_KEYS.witness && playbackDocument?.documentKey === activeWitnessDocument?.documentKey) {
      setFocusBlockId(currentBlockId);
    }

    if (requestedView === VIEW_KEYS.compare) {
      if (playerSource === "witness" && playbackDocument?.documentKey === compareSourceDocument?.documentKey) {
        setSelectedWitnessBlockId(currentBlockId);
      }
      if (playerSource === "language" && playbackDocument?.documentKey === activeLanguageDocument?.documentKey) {
        setSelectedLanguageBlockId(currentBlockId);
      }
    }
  }, [
    activeLanguageDocument?.documentKey,
    activeWitnessDocument?.documentKey,
    compareSourceDocument?.documentKey,
    currentBlockId,
    playbackDocument?.documentKey,
    playerSource,
    requestedView,
  ]);

  const saveDocument = useCallback(
    async ({
      document,
      title = document?.title || "",
      subtitle = document?.subtitle || "",
      blocks,
      markBlockId = "",
    }) => {
      if (!document?.documentKey) return null;

      if (markBlockId) {
        setBlockSaveStates((current) => ({
          ...current,
          [markBlockId]: "saving",
        }));
      }

      const response = await fetch("/api/workspace/document", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentKey: document.documentKey,
          title,
          subtitle,
          baseUpdatedAt: document.updatedAt,
          blocks,
          logEntries: document.logEntries || [],
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(String(payload?.error || "Could not save this document.").trim());
      }

      const nextDocument = payload?.document || null;
      if (nextDocument?.documentKey) {
        setDocumentsState((current) => replaceDocument(current, nextDocument));
      }

      if (markBlockId) {
        setBlockSaveStates((current) => ({
          ...current,
          [markBlockId]: "saved",
        }));
        window.setTimeout(() => {
          setBlockSaveStates((current) => ({
            ...current,
            [markBlockId]: "",
          }));
        }, 1200);
      }

      return nextDocument;
    },
    [],
  );

  const handleEditWitnessBlock = useCallback(
    async (blockId, draftText) => {
      const document = activeWitnessDocument;
      if (!document?.documentKey) return;

      const nextBlocks = (document.blocks || []).map((block) =>
        block.id === blockId
          ? {
              ...block,
              text: draftText,
              plainText: String(draftText || "").replace(/\s+/g, " ").trim(),
            }
          : block,
      );

      try {
        await saveDocument({
          document,
          blocks: nextBlocks,
          markBlockId: blockId,
        });
      } catch (error) {
        setBlockSaveStates((current) => ({
          ...current,
          [blockId]: "error",
        }));
        setFeedback(error instanceof Error ? error.message : "Could not save the witness.");
      }
    },
    [activeWitnessDocument, saveDocument],
  );

  const handleToggleAdvance = useCallback(
    async (blockOrId, marked) => {
      const document = activeWitnessDocument;
      if (!document?.documentKey) return;

      const blockId =
        typeof blockOrId === "string"
          ? blockOrId
          : String(blockOrId?.id || "").trim();
      if (!blockId) return;

      setActionPendingId(blockId);

      const nextBlocks = (document.blocks || []).map((block) => {
        if (block.id !== blockId) return block;
        if (!marked) {
          return {
            ...block,
            advancementMark: {
              kind: "advance",
              markedAt: new Date().toISOString(),
              markedBy: userId || "human",
            },
          };
        }

        return {
          ...block,
          advancementMark: null,
        };
      });

      try {
        await saveDocument({
          document,
          blocks: nextBlocks,
          markBlockId: blockId,
        });
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Could not update this mark.");
      } finally {
        setActionPendingId("");
      }
    },
    [activeWitnessDocument, saveDocument, userId],
  );

  const handleCompileWitness = useCallback(async () => {
    if (!activeProject?.projectKey || !activeWitnessDocument?.documentKey) return;
    setCompilePending(true);
    setFeedback("");

    try {
      const response = await fetch("/api/workspace/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: activeProject.projectKey,
          sourceDocumentKey: activeWitnessDocument.documentKey,
          mode: "compile",
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.seed?.documentKey) {
        throw new Error(String(payload?.error || "Could not compile this witness into Lœgos.").trim());
      }

      router.push(
        buildQueryString(pathname, {
          project: activeProject.projectKey,
          view: VIEW_KEYS.compare,
          source: activeWitnessDocument.documentKey,
          document: payload.seed.documentKey,
        }),
      );
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not compile this witness.");
    } finally {
      setCompilePending(false);
    }
  }, [activeProject?.projectKey, activeWitnessDocument?.documentKey, pathname, router]);

  const requestAudioForBlock = useCallback(
    async (block) => {
      const response = await fetch("/api/seven/audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: block.plainText || block.text,
          preferredProvider: voiceChoice?.provider || undefined,
          voiceId:
            voiceChoice?.provider === VOICE_PROVIDERS.device
              ? undefined
              : voiceChoice?.voiceId || undefined,
          rate,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(String(payload?.error || "Voice is unavailable right now.").trim());
      }

      return {
        blob: await response.blob(),
        headers: parseSevenAudioHeaders(response.headers),
      };
    },
    [rate, voiceChoice?.provider, voiceChoice?.voiceId],
  );

  const playCloudSequenceFromIndex = useCallback(
    async (index) => {
      const block = playbackBlocks[index];
      if (!block || !playbackDocument?.documentKey) {
        stopPlayback({ keepPosition: true });
        return;
      }

      setCurrentBlockId(block.id);
      setNextBlockId(playbackBlocks[index + 1]?.id || "");
      setLoadingAudio(true);

      try {
        const { blob, headers } = await requestAudioForBlock(block);
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.playbackRate = rate;
        audioRef.current = audio;
        audioUrlRef.current = audioUrl;
        playbackStateRef.current = {
          active: true,
          paused: false,
          kind: headers.provider || voiceChoice?.provider || null,
          documentKey: playbackDocument.documentKey,
        };
        setProviderLabel(formatVoiceLabel(headers.provider || voiceChoice?.provider, headers.voiceId || voiceChoice?.voiceId));

        audio.addEventListener("ended", () => {
          if (!playbackStateRef.current.active) {
            stopPlayback({ keepPosition: true });
            return;
          }

          const nextIndex = index + 1;
          if (nextIndex >= playbackBlocks.length) {
            void persistListeningSession("idle", block, playbackDocument);
            stopPlayback({ keepPosition: true });
            return;
          }

          void playCloudSequenceFromIndex(nextIndex);
        });
        audio.addEventListener("play", () => {
          setIsPlaying(true);
          setLoadingAudio(false);
        });
        audio.addEventListener("pause", () => {
          setIsPlaying(false);
        });

        await audio.play();
        void persistListeningSession("active", block, playbackDocument);
      } catch (error) {
        stopPlayback({ keepPosition: true });
        setFeedback(formatPlaybackError(error));
      } finally {
        setLoadingAudio(false);
      }
    },
    [
      persistListeningSession,
      playbackBlocks,
      playbackDocument,
      rate,
      requestAudioForBlock,
      stopPlayback,
      voiceChoice?.provider,
      voiceChoice?.voiceId,
    ],
  );

  const playDeviceSequenceFromIndex = useCallback(
    async (index) => {
      const block = playbackBlocks[index];
      if (!block || !playbackDocument?.documentKey || !browserSupportsDeviceVoice()) {
        stopPlayback({ keepPosition: true });
        return;
      }

      const runId = speechRunIdRef.current + 1;
      speechRunIdRef.current = runId;
      const utterance = new SpeechSynthesisUtterance(block.plainText || block.text);
      utterance.rate = rate;
      speechUtteranceRef.current = utterance;
      playbackStateRef.current = {
        active: true,
        paused: false,
        kind: VOICE_PROVIDERS.device,
        documentKey: playbackDocument.documentKey,
      };
      setCurrentBlockId(block.id);
      setNextBlockId(playbackBlocks[index + 1]?.id || "");

      utterance.onstart = () => {
        if (runId !== speechRunIdRef.current) return;
        setIsPlaying(true);
        setLoadingAudio(false);
        setProviderLabel(formatVoiceLabel(VOICE_PROVIDERS.device));
        void persistListeningSession("active", block, playbackDocument);
      };
      utterance.onpause = () => {
        if (runId !== speechRunIdRef.current) return;
        setIsPlaying(false);
      };
      utterance.onerror = () => {
        if (runId !== speechRunIdRef.current) return;
        stopPlayback({ keepPosition: true });
        setFeedback("Playback could not continue. Your place is preserved.");
      };
      utterance.onend = () => {
        if (runId !== speechRunIdRef.current) return;
        speechUtteranceRef.current = null;

        const nextIndex = index + 1;
        if (nextIndex >= playbackBlocks.length) {
          void persistListeningSession("idle", block, playbackDocument);
          stopPlayback({ keepPosition: true });
          return;
        }

        void playDeviceSequenceFromIndex(nextIndex);
      };

      setLoadingAudio(true);
      window.speechSynthesis.speak(utterance);
    },
    [
      persistListeningSession,
      playbackBlocks,
      playbackDocument,
      rate,
      stopPlayback,
    ],
  );

  const playFromCurrentPosition = useCallback(async () => {
    if (!playbackBlocks.length) return;

    const startIndex = Math.max(
      0,
      playbackBlocks.findIndex((block) => block.id === (currentBlockId || playbackBlocks[0]?.id)),
    );

    if (voiceChoice?.provider === VOICE_PROVIDERS.device) {
      await playDeviceSequenceFromIndex(startIndex);
      return;
    }

    await playCloudSequenceFromIndex(startIndex);
  }, [
    currentBlockId,
    playbackBlocks,
    playCloudSequenceFromIndex,
    playDeviceSequenceFromIndex,
    voiceChoice?.provider,
  ]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      playbackStateRef.current = {
        ...playbackStateRef.current,
        active: false,
        paused: true,
      };
      audioRef.current.pause();
      const currentBlock =
        playbackBlocks.find((block) => block.id === currentBlockId) || playbackBlocks[0] || null;
      void persistListeningSession("paused", currentBlock, playbackDocument);
      return;
    }

    if (
      speechUtteranceRef.current &&
      playbackStateRef.current.kind === VOICE_PROVIDERS.device &&
      browserSupportsDeviceVoice()
    ) {
      playbackStateRef.current = {
        ...playbackStateRef.current,
        active: false,
        paused: true,
      };
      window.speechSynthesis.pause();
      const currentBlock =
        playbackBlocks.find((block) => block.id === currentBlockId) || playbackBlocks[0] || null;
      void persistListeningSession("paused", currentBlock, playbackDocument);
    }
  }, [
    currentBlockId,
    persistListeningSession,
    playbackBlocks,
    playbackDocument,
  ]);

  const handleTogglePlayback = useCallback(async () => {
    if (!playbackAvailable) return;

    if (isPlaying) {
      pausePlayback();
      return;
    }

    if (
      audioRef.current &&
      audioRef.current.paused &&
      playbackStateRef.current.documentKey === playbackDocument?.documentKey
    ) {
      playbackStateRef.current = {
        ...playbackStateRef.current,
        active: true,
        paused: false,
      };
      await audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    if (
      speechUtteranceRef.current &&
      playbackStateRef.current.kind === VOICE_PROVIDERS.device &&
      playbackStateRef.current.documentKey === playbackDocument?.documentKey &&
      playbackStateRef.current.paused &&
      browserSupportsDeviceVoice()
    ) {
      playbackStateRef.current = {
        ...playbackStateRef.current,
        active: true,
        paused: false,
      };
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }

    await playFromCurrentPosition();
  }, [
    isPlaying,
    pausePlayback,
    playbackAvailable,
    playbackDocument?.documentKey,
    playFromCurrentPosition,
  ]);

  const handleSkipToIndex = useCallback(
    async (nextIndex) => {
      if (!playbackBlocks.length) return;
      const safeIndex = Math.max(0, Math.min(playbackBlocks.length - 1, nextIndex));
      const block = playbackBlocks[safeIndex] || null;
      setCurrentBlockId(block?.id || "");
      setNextBlockId(playbackBlocks[safeIndex + 1]?.id || "");
      if (block) {
        void persistListeningSession("paused", block, playbackDocument);
      }
      if (isPlaying) {
        stopPlayback({ keepPosition: true });
        if (voiceChoice?.provider === VOICE_PROVIDERS.device) {
          await playDeviceSequenceFromIndex(safeIndex);
        } else {
          await playCloudSequenceFromIndex(safeIndex);
        }
      }
    },
    [
      isPlaying,
      persistListeningSession,
      playbackBlocks,
      playbackDocument,
      playCloudSequenceFromIndex,
      playDeviceSequenceFromIndex,
      stopPlayback,
      voiceChoice?.provider,
    ],
  );

  function handleSelectWitness(documentKey) {
    router.push(
      buildQueryString(pathname, {
        project: activeProject?.projectKey || requestedProjectKey || initialProjectKey,
        view: VIEW_KEYS.witness,
        document: documentKey,
      }),
    );
  }

  function handleSelectCompare(documentKey, sourceKey = "") {
    router.push(
      buildQueryString(pathname, {
        project: activeProject?.projectKey || requestedProjectKey || initialProjectKey,
        view: VIEW_KEYS.compare,
        document: documentKey,
        source: sourceKey,
      }),
    );
  }

  const witnessSections = useMemo(
    () => [
      {
        key: "witness",
        label: "Witness",
        title: activeWitnessDocument?.title || "No witness selected",
        copy: activeWitnessDocument
          ? "Witness is the source-facing truth object. Edit and listen here, then compile explicitly when ready."
          : "Bring one source into the box to create the first witness object.",
        items: activeWitnessDocument
          ? [
              {
                key: "blocks",
                label: "Blocks",
                value: String((activeWitnessDocument.blocks || []).length),
              },
              {
                key: "advanced",
                label: "Advanced",
                value: String(countMarkedBlocks(activeWitnessDocument)),
              },
            ]
          : [],
      },
      {
        key: "compile",
        label: "Compile",
        title: activeLanguageDocument?.documentKey ? "Active language exists" : "No active language yet",
        copy: witnessIsStale
          ? "The witness changed after compile. Recompile explicitly before trusting the current Lœgos state."
          : "Witness edits never mutate Lœgos silently. Compile is the commitment boundary.",
        action: {
          label: witnessIsStale ? "Recompile to Lœgos" : "Compile to Lœgos",
          primary: true,
          disabled: !activeWitnessDocument?.documentKey || compilePending,
          testId: "ra-compile-witness",
          onClick: handleCompileWitness,
        },
      },
    ],
    [
      activeLanguageDocument?.documentKey,
      activeWitnessDocument,
      compilePending,
      handleCompileWitness,
      witnessIsStale,
    ],
  );

  const compareSections = useMemo(() => {
    const sourceTitle = compareSourceDocument?.title || languageSeedMeta.compiledFromTitle || "Witness";

    return [
      {
        key: "boundary",
        label: "Commitment boundary",
        title: sourceTitle,
        copy: "Witness stays immutable in compare. The compiled Lœgos object is separate, inspectable, and recompiled only on purpose.",
        items: [
          {
            key: "source",
            label: "Compiled from",
            value: languageSeedMeta.compiledFromTitle || "Current witness",
          },
          {
            key: "status",
            label: "Status",
            value: witnessIsStale ? "Stale" : "Current",
          },
        ],
        action: {
          label: witnessIsStale ? "Recompile" : "Open language",
          primary: true,
          disabled: compilePending || !compareSourceDocument?.documentKey,
          testId: "ra-compare-primary-action",
          onClick: witnessIsStale
            ? handleCompileWitness
            : () =>
                router.push(
                  buildQueryString(pathname, {
                    project: activeProject?.projectKey || requestedProjectKey || initialProjectKey,
                    view: VIEW_KEYS.language,
                    document: activeLanguageDocument?.documentKey || "",
                    source: compareSourceDocument?.documentKey || "",
                  }),
                ),
        },
      },
      {
        key: "rationale",
        label: "Compare",
        title: "What changed",
        copy: "Compare exists so the user can learn what the witness said, what the Lœgos form now says, and why the transformation became more operable.",
      },
    ];
  }, [
    activeLanguageDocument?.documentKey,
    activeProject?.projectKey,
    compareSourceDocument?.documentKey,
    compareSourceDocument?.title,
    compilePending,
    handleCompileWitness,
    initialProjectKey,
    languageSeedMeta.compiledFromTitle,
    pathname,
    requestedProjectKey,
    router,
    witnessIsStale,
  ]);

  const receiptSections = useMemo(
    () => [
      {
        key: "receipt",
        label: "Receipt",
        title: latestReceipt?.title || "No receipt drafted yet",
        copy: latestReceipt
          ? latestReceipt.summary || "The latest receipt remains in the box."
          : "Receipt-bearing cycles stay downstream of compare and language work in this preview route.",
      },
    ],
    [latestReceipt],
  );

  function renderTreeSection(label, items = [], count = 0) {
    return (
      <section className="ra-tree__section">
        <div className="ra-tree__section-head">
          <span className="ra-tree__section-label">{label}</span>
          <span className="ra-tree__section-count">{count}</span>
        </div>
        <div className="ra-tree__items">
          {items.length ? (
            items
          ) : (
            <p className="ra-tree__empty">Nothing here yet.</p>
          )}
        </div>
      </section>
    );
  }

  const witnessRows = witnessDocuments.map((document) => (
    <button
      key={document.documentKey}
      type="button"
      className={`ra-tree__item ra-tree__item-button ${
        document.documentKey === activeWitnessDocument?.documentKey &&
        (requestedView === VIEW_KEYS.witness || requestedView === VIEW_KEYS.compare)
          ? "is-active"
          : ""
      }`}
      onClick={() => handleSelectWitness(document.documentKey)}
      data-testid="ra-tree-open-witness"
    >
      <span className="ra-tree__item-copy">
        <strong className="ra-tree__item-title">{document.title}</strong>
        <span className="ra-tree__item-detail">
          {(document.blocks || []).length} block{(document.blocks || []).length === 1 ? "" : "s"}
        </span>
      </span>
      {countMarkedBlocks(document) ? (
        <span className="ra-tree__item-badge">{countMarkedBlocks(document)} advanced</span>
      ) : null}
    </button>
  ));

  const languageRows = activeLanguageDocument?.documentKey ? [
    <button
      key={activeLanguageDocument.documentKey}
      type="button"
      className={`ra-tree__item ra-tree__item-button ${
        requestedView === VIEW_KEYS.language || requestedView === VIEW_KEYS.compare ? "is-active" : ""
      }`}
      onClick={() =>
        handleSelectCompare(
          activeLanguageDocument.documentKey,
          compareSourceDocument?.documentKey ||
            languageSeedMeta.compiledFromDocumentKey ||
            activeWitnessDocument?.documentKey ||
            "",
        )
      }
      data-testid="ra-tree-open-language"
    >
      <span className="ra-tree__item-copy">
        <strong className="ra-tree__item-title">{activeLanguageDocument.title}</strong>
        <span className="ra-tree__item-detail">Current active structure</span>
      </span>
      <span className="ra-tree__item-badge">{witnessIsStale ? "stale" : "current"}</span>
    </button>,
  ] : [];

  const receiptRows = latestReceipt ? [
    <button
      key={latestReceipt.id || latestReceipt.title}
      type="button"
      className={`ra-tree__item ra-tree__item-button ${requestedView === VIEW_KEYS.receipt ? "is-active" : ""}`}
      onClick={() =>
        router.push(
          buildQueryString(pathname, {
            project: activeProject?.projectKey || requestedProjectKey || initialProjectKey,
            view: VIEW_KEYS.receipt,
          }),
        )
      }
      data-testid="ra-tree-open-receipt"
    >
      <span className="ra-tree__item-copy">
        <strong className="ra-tree__item-title">{latestReceipt.title || "Receipt draft"}</strong>
        <span className="ra-tree__item-detail">{latestReceipt.statusLabel || "Draft"}</span>
      </span>
    </button>,
  ] : [];

  return (
    <div className="ra-shell" data-testid="reality-assembly-shell">
      <div className="ra-shell__frame">
        <header className="ra-shell__header">
          <div className="ra-shell__copy">
            <span className="founder-shell__panel-eyebrow">Reality assembly preview</span>
            <h1 className="ra-shell__title">
              {activeProject?.boxTitle || activeProject?.title || "Untitled Box"}
            </h1>
            <p className="ra-shell__lede">
              Source object → witness → block → marked block → compiled Lœgos structure.
            </p>
          </div>

          <div className="ra-shell__header-side">
            <div className="ra-shell__nav">
              {NAV_ITEMS.map((item) => {
                const active =
                  (item.selection === VIEW_KEYS.box &&
                    requestedView === VIEW_KEYS.box) ||
                  (item.selection === VIEW_KEYS.witness &&
                    requestedView === VIEW_KEYS.witness) ||
                  (item.selection === VIEW_KEYS.compare &&
                    (requestedView === VIEW_KEYS.compare || requestedView === VIEW_KEYS.language)) ||
                  (item.selection === VIEW_KEYS.receipt &&
                    requestedView === VIEW_KEYS.receipt);

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`ra-shell__nav-item ${active ? "is-active" : ""}`}
                    onClick={() => {
                      const nextView =
                        item.selection === VIEW_KEYS.compare && activeLanguageDocument?.documentKey
                          ? VIEW_KEYS.compare
                          : item.selection;
                      router.push(
                        buildQueryString(pathname, {
                          project:
                            activeProject?.projectKey || requestedProjectKey || initialProjectKey,
                          view: nextView,
                          document:
                            nextView === VIEW_KEYS.witness
                              ? activeWitnessDocument?.documentKey || ""
                              : nextView === VIEW_KEYS.compare || nextView === VIEW_KEYS.language
                                ? activeLanguageDocument?.documentKey || ""
                                : "",
                          source:
                            nextView === VIEW_KEYS.compare || nextView === VIEW_KEYS.language
                              ? compareSourceDocument?.documentKey ||
                                languageSeedMeta.compiledFromDocumentKey ||
                                ""
                              : "",
                        }),
                      );
                    }}
                  >
                    <span className="ra-shell__nav-head">
                      <ShapeGlyph shapeKey={item.key} size={16} />
                      <span className="ra-shell__nav-label">{item.label}</span>
                    </span>
                    <span className="ra-shell__nav-verb">{item.verb}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div className="ra-shell__body">
          <aside className="ra-tree" data-testid="ra-tree">
            <button
              type="button"
              className={`ra-tree__root ${requestedView === VIEW_KEYS.box ? "is-active" : ""}`}
              onClick={() =>
                router.push(
                  buildQueryString(pathname, {
                    project: activeProject?.projectKey || requestedProjectKey || initialProjectKey,
                    view: VIEW_KEYS.box,
                  }),
                )
              }
              data-testid="ra-tree-open-box"
            >
              <span className="ra-tree__root-label">Box</span>
              <strong className="ra-tree__root-title">
                {activeProject?.boxTitle || activeProject?.title || "Untitled Box"}
              </strong>
              <span className="ra-tree__root-copy">
                {activeProject?.boxSubtitle || activeProject?.subtitle || "Start with a source."}
              </span>
            </button>

            <div className="ra-tree__sections">
              {renderTreeSection("Witnesses", witnessRows, witnessDocuments.length)}
              {renderTreeSection("Language", languageRows, languageRows.length)}
              {renderTreeSection("Receipts", receiptRows, receiptRows.length)}
            </div>

            <div className="ra-tree__footer">
              <button
                type="button"
                className="terminal-button is-primary"
                onClick={() => setAddSourceOpen(true)}
                data-testid="ra-open-add-source"
              >
                Add source
              </button>
              <button
                type="button"
                className="terminal-button"
                onClick={() =>
                  router.push(
                    buildQueryString(pathname, {
                      project: activeProject?.projectKey || requestedProjectKey || initialProjectKey,
                      view: VIEW_KEYS.box,
                    }),
                  )
                }
              >
                Box home
              </button>
            </div>
          </aside>

          <div className={`ra-shell__workspace ${requestedView === VIEW_KEYS.compare ? "is-compare" : ""}`}>
            {requestedView === VIEW_KEYS.box ? (
              <section className="ra-shell__panel ra-box-view" data-testid="ra-box-view">
                <div className="ra-box-view__grid">
                  {boxHomeSections.map((section) => (
                    <article key={section.key} className="ra-box-card">
                      <span className="ra-box-card__eyebrow">
                        <ShapeGlyph
                          shapeKey={section.key === "weld" ? "weld" : section.key === "seal" ? "seal" : section.key}
                          size={16}
                        />{" "}
                        {section.label}
                      </span>
                      <strong className="ra-box-card__title">{section.title}</strong>
                      <p className="ra-box-card__copy">{section.copy}</p>
                      {section.items?.length ? (
                        <div className="ra-box-card__list">
                          {section.items.map((item) => (
                            <div key={item.key} className="ra-box-card__list-item">
                              <span>{item.label}</span>
                              <strong>{item.value}</strong>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {section.action?.onClick ? (
                        <div className="ra-box-card__actions">
                          <button
                            type="button"
                            className={section.action.primary ? "terminal-button is-primary" : "terminal-button"}
                            onClick={section.action.onClick}
                            data-testid={section.action.testId || undefined}
                            disabled={section.action.disabled}
                          >
                            {section.action.label}
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {requestedView === VIEW_KEYS.witness ? (
              <section className="ra-shell__panel ra-witness-view" data-testid="ra-witness-view">
                <div className="ra-view-header">
                  <div className="ra-view-header__copy">
                    <span className="founder-shell__panel-eyebrow">Witness</span>
                    <strong className="founder-shell__panel-title">
                      {activeWitnessDocument?.title || "No witness selected"}
                    </strong>
                    <p className="founder-shell__panel-copy">
                      Read, listen, edit, and mark the blocks that matter to the aim.
                    </p>
                  </div>
                  <div className="ra-view-header__actions">
                    <button
                      type="button"
                      className="terminal-button"
                      onClick={() =>
                        router.push(
                          buildQueryString(pathname, {
                            project: activeProject?.projectKey || requestedProjectKey || initialProjectKey,
                            view: VIEW_KEYS.box,
                          }),
                        )
                      }
                    >
                      Box
                    </button>
                    <button
                      type="button"
                      className="terminal-button"
                      onClick={() => setAddSourceOpen(true)}
                    >
                      Add source
                    </button>
                    <button
                      type="button"
                      className="terminal-button is-primary"
                      onClick={handleCompileWitness}
                      disabled={!activeWitnessDocument?.documentKey || compilePending}
                      data-testid="ra-witness-compile"
                    >
                      {compilePending
                        ? "Compiling…"
                        : witnessIsStale
                          ? "Recompile to Lœgos"
                          : "Compile to Lœgos"}
                    </button>
                  </div>
                </div>

                <WorkspaceDocumentWorkbench
                  className="ra-workbench"
                  streamClassName="ra-workbench__stream"
                  blocksClassName="assembler-document__blocks"
                  blocks={activeWitnessDocument?.blocks || []}
                  documents={documentsState}
                  focusBlockId={focusBlockId}
                  currentBlockId={
                    playbackDocument?.documentKey === activeWitnessDocument?.documentKey
                      ? currentBlockId
                      : ""
                  }
                  nextBlockId={
                    playbackDocument?.documentKey === activeWitnessDocument?.documentKey
                      ? nextBlockId
                      : ""
                  }
                  isPlaying={isPlaying && playbackDocument?.documentKey === activeWitnessDocument?.documentKey}
                  editMode
                  showSelectionActions
                  selectionActionAddLabel="Advance"
                  selectionActionRemoveLabel="Unmark"
                  selectedBlockIds={selectedAdvanceIds}
                  blockActionPendingId={actionPendingId}
                  blockSaveStates={blockSaveStates}
                  emptyTitle="No witness yet."
                  emptyDetail="Bring one source into the box and it will appear here as a markdown-backed witness."
                  testId="ra-witness-workbench"
                  onFocusBlock={(blockId) => setFocusBlockId(blockId)}
                  onAddBlock={(block) => handleToggleAdvance(block, false)}
                  onRemoveBlock={(blockId) => handleToggleAdvance(blockId, true)}
                  onEditBlock={handleEditWitnessBlock}
                />
              </section>
            ) : null}

            {requestedView === VIEW_KEYS.compare ? (
              <>
                <FounderWitnessPane
                  title={compareSourceDocument?.title || "Source witness"}
                  subtitle={compareSourceDocument?.subtitle || ""}
                  blocks={compareSourceDocument?.blocks || []}
                  selectedBlockId={selectedWitnessBlockId}
                  onSelectBlock={(blockId) => {
                    setSelectedWitnessBlockId(blockId);
                    const sourceBlock = (compareSourceDocument?.blocks || []).find(
                      (block) => block.id === blockId,
                    );
                    const matchingLanguageBlock = (activeLanguageDocument?.blocks || []).find(
                      (block) =>
                        String(block?.sourceDocumentKey || "").trim() ===
                          String(compareSourceDocument?.documentKey || "").trim() &&
                        Number(block?.sourcePosition) === Number(sourceBlock?.sourcePosition),
                    );
                    if (matchingLanguageBlock?.id) {
                      setSelectedLanguageBlockId(matchingLanguageBlock.id);
                    }
                  }}
                />
                <section className="ra-shell__panel ra-compare-view" data-testid="ra-compare-view">
                  <LoegosRenderer
                    artifactKind="Language"
                    blocks={activeLanguageDocument?.blocks || []}
                    selectedBlockId={selectedLanguageBlockId}
                    currentBlockId={
                      playbackDocument?.documentKey === activeLanguageDocument?.documentKey
                        ? currentBlockId
                        : ""
                    }
                    nextBlockId={
                      playbackDocument?.documentKey === activeLanguageDocument?.documentKey
                        ? nextBlockId
                        : ""
                    }
                    learnerMode={learnerMode}
                    onToggleLearnerMode={() => setLearnerMode((value) => !value)}
                    onSelectBlock={(blockId) => {
                      setSelectedLanguageBlockId(blockId);
                      const sourceBlock = (activeLanguageDocument?.blocks || []).find(
                        (block) => block.id === blockId,
                      );
                      const matchingWitnessBlock = (compareSourceDocument?.blocks || []).find(
                        (block) =>
                          Number(block?.sourcePosition) === Number(sourceBlock?.sourcePosition),
                      );
                      if (matchingWitnessBlock?.id) {
                        setSelectedWitnessBlockId(matchingWitnessBlock.id);
                      }
                    }}
                  />
                </section>
              </>
            ) : null}

            {requestedView === VIEW_KEYS.language ? (
              <section className="ra-shell__panel ra-language-view" data-testid="ra-language-view">
                <LoegosRenderer
                  artifactKind="Language"
                  blocks={activeLanguageDocument?.blocks || []}
                  selectedBlockId={selectedLanguageBlockId}
                  currentBlockId={
                    playbackDocument?.documentKey === activeLanguageDocument?.documentKey
                      ? currentBlockId
                      : ""
                  }
                  nextBlockId={
                    playbackDocument?.documentKey === activeLanguageDocument?.documentKey
                      ? nextBlockId
                      : ""
                  }
                  learnerMode={learnerMode}
                  onToggleLearnerMode={() => setLearnerMode((value) => !value)}
                  onSelectBlock={setSelectedLanguageBlockId}
                />
              </section>
            ) : null}

            {requestedView === VIEW_KEYS.receipt ? (
              <section className="ra-shell__panel ra-receipt-view" data-testid="ra-receipt-view">
                <div className="ra-view-header">
                  <div className="ra-view-header__copy">
                    <span className="founder-shell__panel-eyebrow">Receipt</span>
                    <strong className="founder-shell__panel-title">
                      {latestReceipt?.title || "No receipt yet"}
                    </strong>
                    <p className="founder-shell__panel-copy">
                      Receipt-bearing cycles will live here once the preview route carries the full move → test → receipt loop.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="ra-shell__side">
            <FounderInfoPanel
              testId="ra-info-panel"
              eyebrow={requestedView === VIEW_KEYS.compare ? "Compare" : requestedView === VIEW_KEYS.witness ? "Witness" : requestedView === VIEW_KEYS.receipt ? "Seal" : "Box"}
              title={
                requestedView === VIEW_KEYS.compare
                  ? "Commitment boundary"
                  : requestedView === VIEW_KEYS.witness
                    ? "Witness state"
                    : requestedView === VIEW_KEYS.receipt
                      ? "Receipt state"
                      : "Box state"
              }
              copy={
                requestedView === VIEW_KEYS.compare
                  ? "Witness and Lœgos remain distinct. This panel explains the current relationship."
                  : requestedView === VIEW_KEYS.witness
                    ? "Witness is readable, editable, and listenable before it becomes active structure."
                    : requestedView === VIEW_KEYS.receipt
                      ? "Receipts preserve what reality actually returned."
                      : "The box gathers source, current language, and returned proof around one aim."
              }
              sections={
                requestedView === VIEW_KEYS.compare
                  ? compareSections
                  : requestedView === VIEW_KEYS.witness
                    ? witnessSections
                    : requestedView === VIEW_KEYS.receipt
                      ? receiptSections
                      : boxHomeSections
              }
            />
          </aside>
        </div>

        <div className="ra-shell__player">
          <RealityAssemblyPlayerBar
            playbackAvailable={playbackAvailable}
            isPlaying={isPlaying}
            loadingAudio={loadingAudio}
            currentIndex={currentPlaybackIndex}
            totalBlocks={playbackBlocks.length}
            rate={rate}
            voiceCatalog={voiceCatalog}
            voiceChoice={voiceChoice}
            providerLabel={providerLabel}
            sourceOptions={playerSourceOptions}
            selectedSourceKey={playerSource}
            onSelectSource={(nextSource) => setPlayerSource(nextSource)}
            onTogglePlayback={handleTogglePlayback}
            onPreviousBlock={() => handleSkipToIndex(currentPlaybackIndex - 1)}
            onNextBlock={() => handleSkipToIndex(currentPlaybackIndex + 1)}
            onSeekBack={() => handleSkipToIndex(currentPlaybackIndex - 1)}
            onSeekForward={() => handleSkipToIndex(currentPlaybackIndex + 1)}
            onCycleRate={() => {
              const nextRate =
                rate >= 1.5 ? 0.9 : rate >= 1.2 ? 1.5 : rate >= 1 ? 1.2 : 1;
              setRate(nextRate);
            }}
            onVoiceChange={(choice) => {
              if (!choice) return;
              setVoiceChoice(choice);
              setProviderLabel(formatVoiceLabel(choice.provider, choice.voiceId));
            }}
          />
        </div>

        {feedback ? <p className="ra-shell__feedback">{feedback}</p> : null}
      </div>

      <RealityAssemblyAddSourceDialog
        open={addSourceOpen}
        projectKey={activeProject?.projectKey || requestedProjectKey || initialProjectKey}
        onClose={() => setAddSourceOpen(false)}
        onImported={({ projectKey, documentKey }) => {
          router.push(
            buildQueryString(pathname, {
              project: projectKey,
              view: VIEW_KEYS.witness,
              document: documentKey,
            }),
          );
          router.refresh();
        }}
      />
    </div>
  );
}
