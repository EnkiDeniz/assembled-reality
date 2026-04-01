"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildSevenFallbackMessage,
  getNarrationText,
  getReaderSection,
  getSectionPreview,
  getSectionOutline,
  getSevenProviderLabel,
  parseSevenAudioHeaders,
  splitTextForSpeech,
} from "../lib/seven";

const RECEIPT_STANCE_OPTIONS = [
  { value: "tentative", label: "Tentative" },
  { value: "working", label: "Working" },
  { value: "confident", label: "Confident" },
];

function SpeakerIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M9 5.15 6.55 7.2H4.75A1.25 1.25 0 0 0 3.5 8.45v3.1c0 .69.56 1.25 1.25 1.25h1.8L9 14.85V5.15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12.4 7.25c1.06.72 1.6 1.64 1.6 2.75 0 1.11-.54 2.03-1.6 2.75M14.65 5.35c1.72 1.08 2.6 2.64 2.6 4.65 0 2-.88 3.56-2.6 4.65"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SkipPreviousIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M6.35 5.25v9.5M14.6 5.95 8.55 10l6.05 4.05V5.95Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M7.1 5.6 14.6 10l-7.5 4.4V5.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M7.15 5.4v9.2M12.85 5.4v9.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SkipNextIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M13.65 5.25v9.5M5.4 5.95 11.45 10 5.4 14.05V5.95Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function createTempId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function initialChatStatus({ textEnabled, textProvider }) {
  if (!textEnabled) {
    return {
      state: "offline",
      provider: textProvider,
      reasonCode: "provider_unavailable",
      retryAfterSeconds: null,
      message: "Seven's chat is unavailable right now.",
    };
  }

  return {
    state: "ready",
    provider: textProvider,
    reasonCode: "",
    retryAfterSeconds: null,
    message: `Chat is ready through ${getSevenProviderLabel(textProvider)}.`,
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

function createIdleAudioState(preferredVoiceProvider) {
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

function buildReceiptTitle(items, currentLabel) {
  const titles = [...new Set(items.map((item) => item.sectionTitle).filter(Boolean))];
  if (titles.length === 1) {
    return `Interpretation receipt · ${titles[0]}`;
  }

  if (titles.length > 1) {
    return `Interpretation receipt · ${titles[0]} + ${titles.length - 1}`;
  }

  return `Interpretation receipt · ${currentLabel}`;
}

function GuideTabs({ view, onChangeView }) {
  return (
    <div className="reader-seven__guide-tabs" role="tablist" aria-label="Seven workspace">
      {[
        { value: "listen", label: "Listen" },
        { value: "chat", label: "Chat" },
        { value: "evidence", label: "Evidence" },
      ].map((tab) => {
        const active = view === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`reader-seven__guide-tab ${active ? "is-active" : ""} ${
              tab.value === "listen" ? "is-mobile-only" : ""
            }`}
            onClick={() => onChangeView(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function CitationCard({ citation, included, onAdd }) {
  return (
    <article className={`reader-seven__citation ${included ? "is-included" : ""}`}>
      <div className="reader-seven__citation-copy">
        <p className="reader-seven__citation-label">{citation.sectionLabel || citation.sectionTitle}</p>
        <p className="reader-seven__citation-excerpt">“{citation.excerpt}”</p>
      </div>
      <button
        type="button"
        className={`reader-mark-card__receipt-toggle ${included ? "is-selected" : ""}`}
        onClick={onAdd}
        disabled={included}
      >
        {included ? "In Evidence" : "Add to Evidence"}
      </button>
    </article>
  );
}

function EvidenceItemCard({ item, onRemove }) {
  return (
    <article className="reader-seven__evidence-item">
      <div className="reader-seven__evidence-copy">
        <p className="reader-seven__evidence-meta">
          <span>{item.sectionTitle}</span>
          <span>{item.origin === "seven" ? "Seven" : "Reader"}</span>
          <span>{item.sourceType}</span>
        </p>
        <p className="reader-seven__evidence-excerpt">“{item.excerpt}”</p>
        {item.noteText ? <p className="reader-seven__evidence-note">{item.noteText}</p> : null}
      </div>
      <button
        type="button"
        className="reader-mark-card__secondary reader-mark-card__danger"
        onClick={() => onRemove(item.id)}
      >
        Remove
      </button>
    </article>
  );
}

function ReceiptComposer({
  currentLabel,
  evidenceItems,
  creating,
  error,
  title,
  interpretation,
  implications,
  stance,
  onChangeTitle,
  onChangeInterpretation,
  onChangeImplications,
  onChangeStance,
  onClose,
  onSubmit,
}) {
  return (
    <div className="reader-seven__receipt-composer" role="dialog" aria-label="Create interpretation receipt">
      <div className="reader-seven__receipt-header">
        <div>
          <p className="reader-seven__eyebrow">Receipt</p>
          <h3 className="reader-seven__receipt-title">{currentLabel}</h3>
        </div>
        <button
          type="button"
          className="reader-chrome-button reader-chrome-button--icon"
          onClick={onClose}
          aria-label="Close receipt composer"
        >
          ×
        </button>
      </div>

      <div className="reader-seven__receipt-body">
        <label className="reader-seven__receipt-field" htmlFor="receipt-title">
          <span className="reader-seven__receipt-label">Title</span>
          <input
            id="receipt-title"
            className="reader-seven__receipt-input"
            type="text"
            value={title}
            onChange={(event) => onChangeTitle(event.target.value)}
            required
          />
        </label>

        <label className="reader-seven__receipt-field" htmlFor="receipt-interpretation">
          <span className="reader-seven__receipt-label">Interpretation</span>
          <textarea
            id="receipt-interpretation"
            className="reader-seven__receipt-textarea"
            rows={5}
            value={interpretation}
            onChange={(event) => onChangeInterpretation(event.target.value)}
            placeholder="What do you take this reviewed evidence to mean?"
            required
          />
        </label>

        <div className="reader-seven__receipt-grid">
          <label className="reader-seven__receipt-field" htmlFor="receipt-implications">
            <span className="reader-seven__receipt-label">Implications</span>
            <textarea
              id="receipt-implications"
              className="reader-seven__receipt-textarea"
              rows={4}
              value={implications}
              onChange={(event) => onChangeImplications(event.target.value)}
              placeholder="Optional next consequences or decisions."
            />
          </label>

          <label className="reader-seven__receipt-field" htmlFor="receipt-stance">
            <span className="reader-seven__receipt-label">Stance</span>
            <select
              id="receipt-stance"
              className="reader-seven__receipt-select"
              value={stance}
              onChange={(event) => onChangeStance(event.target.value)}
            >
              {RECEIPT_STANCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="reader-seven__receipt-evidence">
          <div className="reader-seven__receipt-evidence-header">
            <p className="reader-seven__receipt-label">Locked evidence set</p>
            <span>{evidenceItems.length} item{evidenceItems.length === 1 ? "" : "s"}</span>
          </div>
          <div className="reader-seven__receipt-list">
            {evidenceItems.map((item) => (
              <article key={item.id} className="reader-seven__receipt-item">
                <p className="reader-seven__citation-label">{item.sectionTitle}</p>
                <p className="reader-seven__citation-excerpt">“{item.excerpt}”</p>
                {item.noteText ? <p className="reader-seven__evidence-note">{item.noteText}</p> : null}
              </article>
            ))}
          </div>
        </div>

        {error ? <p className="reader-seven__receipt-error">{error}</p> : null}
      </div>

      <div className="reader-seven__receipt-actions">
        <button type="button" className="reader-mark-card__secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="reader-seven__send"
          onClick={onSubmit}
          disabled={!title.trim() || !interpretation.trim() || evidenceItems.length === 0 || creating}
        >
          {creating ? "Creating..." : "Create Receipt"}
        </button>
      </div>
    </div>
  );
}

export default function SevenPanel({
  open,
  textEnabled,
  voiceEnabled,
  textProvider = null,
  preferredVoiceProvider = null,
  documentData,
  activeSlug,
  currentLabel,
  view = "chat",
  onChangeView,
  initialThread = null,
  evidenceItems = [],
  onAddEvidenceItem,
  onRemoveEvidenceItem,
  onShowNotice,
  onNavigateSection,
  onClose,
}) {
  const currentSection = useMemo(
    () => getReaderSection(documentData, activeSlug),
    [activeSlug, documentData],
  );
  const sectionOutline = useMemo(() => getSectionOutline(documentData), [documentData]);
  const sectionPreview = useMemo(
    () => getSectionPreview(documentData, activeSlug),
    [activeSlug, documentData],
  );
  const sectionEntries = useMemo(
    () => [
      {
        slug: "beginning",
        title: "Beginning",
        label: "Beginning",
        narrationText: getNarrationText(documentData, "beginning"),
      },
      ...((documentData?.sections || []).map((section) => ({
        slug: section.slug,
        title: section.title,
        label: `${section.number} · ${section.title}`,
        narrationText: getNarrationText(documentData, section.slug),
      })) || []),
    ],
    [documentData],
  );

  const [threadId, setThreadId] = useState(() => initialThread?.id || null);
  const [messages, setMessages] = useState(() => initialThread?.messages || []);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [browserSpeechEnabled, setBrowserSpeechEnabled] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [audioState, setAudioState] = useState(() => createIdleAudioState(preferredVoiceProvider));
  const [chatStatus, setChatStatus] = useState(() =>
    initialChatStatus({ textEnabled, textProvider }),
  );
  const [voiceStatus, setVoiceStatus] = useState(() =>
    initialVoiceStatus({ voiceEnabled, browserSpeechEnabled: false, preferredVoiceProvider }),
  );
  const [composerActive, setComposerActive] = useState(false);
  const [receiptComposerOpen, setReceiptComposerOpen] = useState(false);
  const [lockedEvidenceItems, setLockedEvidenceItems] = useState([]);
  const [creatingReceipt, setCreatingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [receiptTitle, setReceiptTitle] = useState("");
  const [receiptInterpretation, setReceiptInterpretation] = useState("");
  const [receiptImplications, setReceiptImplications] = useState("");
  const [receiptStance, setReceiptStance] = useState("tentative");

  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const audioSessionRef = useRef(0);
  const messageListRef = useRef(null);

  useEffect(() => {
    setThreadId(initialThread?.id || null);
    setMessages(initialThread?.messages || []);
  }, [initialThread?.id, initialThread?.messages]);

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
    return () => window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
  }, []);

  useEffect(() => {
    setChatStatus((current) =>
      current.state === "error" ? current : initialChatStatus({ textEnabled, textProvider }),
    );
  }, [textEnabled, textProvider]);

  useEffect(() => {
    setVoiceStatus((current) =>
      current.state === "error" || current.state === "device_fallback"
        ? current
        : initialVoiceStatus({
            voiceEnabled,
            browserSpeechEnabled,
            preferredVoiceProvider,
          }),
    );
  }, [browserSpeechEnabled, preferredVoiceProvider, voiceEnabled]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, view]);

  const effectiveVoiceEnabled = voiceEnabled || browserSpeechEnabled;
  const audioActive = audioState.status !== "idle";
  const playerSectionIndex = Math.max(
    0,
    sectionEntries.findIndex((entry) => entry.slug === activeSlug),
  );
  const playerSection = sectionEntries[playerSectionIndex] || sectionEntries[0];
  const previousSection = playerSectionIndex > 0 ? sectionEntries[playerSectionIndex - 1] : null;
  const nextSection =
    playerSectionIndex < sectionEntries.length - 1 ? sectionEntries[playerSectionIndex + 1] : null;
  const sectionTransportActive = audioActive && audioState.sourceType === "section";
  const sectionAudioActive = sectionTransportActive && audioState.sourceId === activeSlug;
  const sectionAudioPlaying = sectionAudioActive && audioState.status === "playing";
  const sectionAudioPaused = sectionAudioActive && audioState.status === "paused";
  const composerExpanded = composerActive || draft.trim().length > 0;
  const canPlaySection = effectiveVoiceEnabled && Boolean(playerSection?.narrationText);
  const includedCitationKeys = useMemo(
    () =>
      new Set(
        evidenceItems
          .filter((item) => item.sourceMessageId && item.sourceCitationId)
          .map((item) => `${item.sourceMessageId}:${item.sourceCitationId}`),
      ),
    [evidenceItems],
  );
  const currentSectionEvidence = useMemo(
    () =>
      evidenceItems.find(
        (item) =>
          item.origin === "reader" &&
          item.sourceType === "passage" &&
          item.sectionSlug === currentSection.slug &&
          item.blockId == null &&
          item.excerpt === sectionPreview,
      ) || null,
    [currentSection.slug, evidenceItems, sectionPreview],
  );

  const liveStatus =
    buildAudioProgressText(audioState) ||
    audioError ||
    (voiceStatus.state === "device_fallback" || voiceStatus.fallbackFrom
      ? voiceStatus.message
      : chatStatus.state === "error"
        ? chatStatus.message
        : voiceStatus.state === "device"
          ? voiceStatus.message
          : textEnabled && effectiveVoiceEnabled
            ? "Ask, listen, and review evidence from here."
            : textEnabled
              ? "Ask about the section from here."
              : effectiveVoiceEnabled
                ? "Read the section aloud."
                : "Seven is offline right now.");

  const showStatus =
    audioState.status !== "idle" ||
    Boolean(audioError) ||
    chatStatus.state === "error" ||
    voiceStatus.state === "error" ||
    voiceStatus.state === "device_fallback" ||
    !textEnabled ||
    !effectiveVoiceEnabled;

  const clearAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
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
    setAudioState(createIdleAudioState(preferredVoiceProvider));
  }, [clearAudioUrl, preferredVoiceProvider]);

  const pauseAudio = useCallback(() => {
    setAudioError("");

    if (audioRef.current) {
      audioRef.current.pause();
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }

    setAudioState((current) =>
      current.status === "playing" ? { ...current, status: "paused" } : current,
    );
  }, []);

  const resumeAudio = useCallback(async () => {
    if (audioState.status !== "paused") return;

    try {
      if (audioRef.current) {
        await audioRef.current.play();
      } else if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.resume();
      }

      setAudioError("");
      setAudioState((current) =>
        current.status === "paused" ? { ...current, status: "playing" } : current,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Seven could not resume speaking.";
      setAudioError(message);
      audioSessionRef.current += 1;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      clearAudioUrl();
      setAudioState(createIdleAudioState(preferredVoiceProvider));
    }
  }, [audioState.status, clearAudioUrl, preferredVoiceProvider]);

  useEffect(() => {
    if (open) return undefined;
    stopAudio();
    setReceiptComposerOpen(false);
    return undefined;
  }, [open, stopAudio]);

  useEffect(() => () => stopAudio(), [stopAudio]);

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
        throw createSevenApiError(payload, "Seven could not generate audio.");
      }

      throw new Error("Seven could not generate audio.");
    }

    const blob = await response.blob();
    return {
      blob,
      meta: parseSevenAudioHeaders(response.headers),
    };
  }, []);

  const playWithDeviceVoice = useCallback(async (chunks, label, sessionId, source = null) => {
    if (
      typeof window === "undefined" ||
      typeof window.speechSynthesis === "undefined" ||
      typeof window.SpeechSynthesisUtterance === "undefined"
    ) {
      throw new Error("Seven's voice is unavailable right now.");
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const speakChunk = async (chunkIndex) => {
      if (audioSessionRef.current !== sessionId) return;

      setAudioState({
        status: "playing",
        label,
        index: chunkIndex + 1,
        total: chunks.length,
        mode: "device",
        sourceType: source?.type || null,
        sourceId: source?.id || null,
      });

      await new Promise((resolve, reject) => {
        const utterance = new window.SpeechSynthesisUtterance(chunks[chunkIndex]);
        utterance.rate = 0.96;
        utterance.pitch = 1;
        utterance.onend = () => resolve();
        utterance.onerror = () =>
          reject(new Error("Seven could not play through your device voice."));
        synth.speak(utterance);
      });

      if (audioSessionRef.current !== sessionId) return;

      if (chunkIndex + 1 >= chunks.length) {
        setAudioState(createIdleAudioState(preferredVoiceProvider));
        return;
      }

      await speakChunk(chunkIndex + 1);
    };

    await speakChunk(0);
  }, [preferredVoiceProvider]);

  const playText = useCallback(async (text, label, source = null) => {
    if (!effectiveVoiceEnabled) {
      setAudioError("Seven's voice is unavailable right now.");
      return;
    }

    const chunks = splitTextForSpeech(text);
    if (chunks.length === 0) {
      setAudioError("There is nothing here for Seven to read yet.");
      return;
    }

    stopAudio();
    const sessionId = audioSessionRef.current;
    setAudioState({
      status: "loading",
      label,
      index: 0,
      total: chunks.length,
      mode: voiceEnabled ? "provider" : "device",
      sourceType: source?.type || null,
      sourceId: source?.id || null,
    });

    if (!voiceEnabled && browserSpeechEnabled) {
      try {
        await playWithDeviceVoice(chunks, label, sessionId, source);
        setVoiceStatus({
          state: "device",
          provider: "device",
          fallbackFrom: null,
          reasonCode: "",
          message: "Listening is available through your device voice.",
        });
      } catch (error) {
        if (audioSessionRef.current !== sessionId) return;
        setAudioError(error instanceof Error ? error.message : "Seven could not start speaking.");
        setVoiceStatus({
          state: "error",
          provider: "device",
          fallbackFrom: null,
          reasonCode: "unknown_error",
          message: error instanceof Error ? error.message : "Seven could not start speaking.",
        });
        setAudioState(createIdleAudioState(preferredVoiceProvider));
      }
      return;
    }

    const playChunk = async (chunkIndex) => {
      if (audioSessionRef.current !== sessionId) return;

      setAudioState({
        status: "loading",
        label,
        index: chunkIndex + 1,
        total: chunks.length,
        mode: "provider",
        sourceType: source?.type || null,
        sourceId: source?.id || null,
      });

      const { blob, meta } = await fetchAudioChunk(chunks[chunkIndex]);
      if (audioSessionRef.current !== sessionId) return;

      setVoiceStatus({
        state: "ready",
        provider: meta.provider || preferredVoiceProvider,
        fallbackFrom: meta.fallbackFrom,
        reasonCode: meta.fallbackReasonCode,
        message: meta.fallbackFrom
          ? buildSevenFallbackMessage({
              fallbackTo: meta.provider || "openai",
              fallbackFrom: meta.fallbackFrom,
              reasonCode: meta.fallbackReasonCode || "unknown_error",
            })
          : `Voice is ready through ${getSevenProviderLabel(meta.provider || preferredVoiceProvider)}.`,
      });

      clearAudioUrl();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("ended", async () => {
        clearAudioUrl();
        audioRef.current = null;

        if (audioSessionRef.current !== sessionId) return;

        if (chunkIndex + 1 >= chunks.length) {
          setAudioState(createIdleAudioState(preferredVoiceProvider));
          return;
        }

        try {
          await playChunk(chunkIndex + 1);
        } catch (error) {
          setAudioError(
            error instanceof Error ? error.message : "Seven stopped speaking unexpectedly.",
          );
          setAudioState(createIdleAudioState(preferredVoiceProvider));
        }
      });

      audio.addEventListener("error", () => {
        clearAudioUrl();
        audioRef.current = null;
        if (audioSessionRef.current !== sessionId) return;
        setAudioError("Seven could not play this audio chunk.");
        setAudioState(createIdleAudioState(preferredVoiceProvider));
      });

      await audio.play();
      if (audioSessionRef.current !== sessionId) return;

      setAudioState({
        status: "playing",
        label,
        index: chunkIndex + 1,
        total: chunks.length,
        mode: "provider",
        sourceType: source?.type || null,
        sourceId: source?.id || null,
      });
    };

    try {
      await playChunk(0);
    } catch (error) {
      if (audioSessionRef.current !== sessionId) return;
      const sourceProvider =
        error?.fallbackFrom || error?.provider || preferredVoiceProvider || "openai";
      const sourceReason = error?.reasonCode || error?.fallbackReasonCode || "unknown_error";

      if (browserSpeechEnabled && audioSessionRef.current === sessionId) {
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
          await playWithDeviceVoice(chunks, label, sessionId, source);
          return;
        } catch (fallbackError) {
          const message =
            fallbackError instanceof Error
              ? fallbackError.message
              : "Seven could not start speaking.";
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
          error instanceof Error ? error.message : "Seven could not start speaking.";
        setAudioError(message);
        setVoiceStatus({
          state: "error",
          provider: sourceProvider,
          fallbackFrom: null,
          reasonCode: sourceReason,
          message,
        });
      }

      setAudioState(createIdleAudioState(browserSpeechEnabled ? null : preferredVoiceProvider));
    }
  }, [
    browserSpeechEnabled,
    clearAudioUrl,
    effectiveVoiceEnabled,
    fetchAudioChunk,
    playWithDeviceVoice,
    preferredVoiceProvider,
    stopAudio,
    voiceEnabled,
  ]);

  const playSectionBySlug = useCallback(
    (slug) => {
      const targetSection = sectionEntries.find((entry) => entry.slug === slug);
      if (!targetSection) return;

      playText(targetSection.narrationText, `Reading ${targetSection.title}`, {
        type: "section",
        id: targetSection.slug,
      });
    },
    [playText, sectionEntries],
  );

  useEffect(() => {
    if (!sectionTransportActive || audioState.sourceId === activeSlug) {
      return;
    }

    playSectionBySlug(activeSlug);
  }, [activeSlug, audioState.sourceId, playSectionBySlug, sectionTransportActive]);

  const handleToggleSectionPlayback = useCallback(() => {
    if (sectionAudioPlaying) {
      pauseAudio();
      return;
    }

    if (sectionAudioPaused) {
      resumeAudio();
      return;
    }

    playSectionBySlug(playerSection.slug);
  }, [pauseAudio, playSectionBySlug, playerSection.slug, resumeAudio, sectionAudioPaused, sectionAudioPlaying]);

  const handleMoveSection = useCallback(
    (offset) => {
      const targetSection = sectionEntries[playerSectionIndex + offset];
      if (!targetSection) return;

      onNavigateSection?.(targetSection.slug);
      if (sectionAudioActive) {
        playSectionBySlug(targetSection.slug);
      }
    },
    [onNavigateSection, playSectionBySlug, playerSectionIndex, sectionAudioActive, sectionEntries],
  );

  const handleAddCurrentSectionEvidence = useCallback(async () => {
    if (!sectionPreview) return;

    if (currentSectionEvidence) {
      await onRemoveEvidenceItem?.(currentSectionEvidence.id, "Removed current section from evidence.");
      return;
    }

    await onAddEvidenceItem?.(
      {
        origin: "reader",
        sourceType: "passage",
        sectionSlug: currentSection.slug,
        sectionTitle: currentSection.title,
        quote: sectionPreview,
        excerpt: sectionPreview,
      },
      "Added current section to evidence.",
    );
  }, [currentSection.slug, currentSection.title, currentSectionEvidence, onAddEvidenceItem, onRemoveEvidenceItem, sectionPreview]);

  const requestSeven = useCallback(
    async ({ mode, question, userLine }) => {
      if (!textEnabled) {
        setMessages((current) => [
          ...current,
          {
            id: createTempId("assistant-disabled"),
            role: "assistant",
            content: "Seven's chat is unavailable right now.",
            citations: [],
          },
        ]);
        return;
      }

      setPending(true);
      setAudioError("");

      const temporaryUserId = createTempId("user");
      setMessages((current) => [
        ...current,
        {
          id: temporaryUserId,
          role: "user",
          content: userLine,
          citations: [],
        },
      ]);

      try {
        const response = await fetch("/api/seven", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode,
            question,
            documentKey: documentData.documentKey,
            activeSlug,
            documentTitle: documentData.title,
            documentSubtitle: documentData.subtitle,
            introMarkdown: documentData.introMarkdown,
            sectionOutline,
            currentLabel,
            currentSectionTitle: currentSection.title,
            currentSectionMarkdown: currentSection.markdown,
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          throw createSevenApiError(payload, "Seven could not respond.");
        }

        setThreadId(payload.threadId || threadId);
        setChatStatus({
          state: "ready",
          provider: payload.provider || textProvider,
          reasonCode: "",
          retryAfterSeconds: null,
          message: `Chat is ready through ${getSevenProviderLabel(payload.provider || textProvider)}.`,
        });

        setMessages((current) => {
          const synced = current.map((message) =>
            message.id === temporaryUserId && payload.userMessageId
              ? {
                  ...message,
                  id: payload.userMessageId,
                }
              : message,
          );

          return [
            ...synced,
            {
              id: payload.messageId || createTempId("assistant"),
              role: "assistant",
              content: payload.answer,
              citations: Array.isArray(payload.citations) ? payload.citations : [],
            },
          ];
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Seven could not respond.";
        setChatStatus({
          state: "error",
          provider: error?.provider || textProvider,
          reasonCode: error?.reasonCode || "unknown_error",
          retryAfterSeconds: error?.retryAfterSeconds || null,
          message,
        });

        setMessages((current) => [
          ...current,
          {
            id: createTempId("assistant-error"),
            role: "assistant",
            content: message,
            citations: [],
          },
        ]);
      } finally {
        setPending(false);
      }
    },
    [
      activeSlug,
      currentLabel,
      currentSection.markdown,
      currentSection.title,
      documentData.documentKey,
      documentData.introMarkdown,
      documentData.subtitle,
      documentData.title,
      sectionOutline,
      textEnabled,
      textProvider,
      threadId,
    ],
  );

  const handleAddCitation = useCallback(
    async (message, citation) => {
      await onAddEvidenceItem?.(
        {
          origin: "seven",
          sourceType: "citation",
          sectionSlug: citation.sectionSlug,
          sectionTitle: citation.sectionTitle,
          quote: citation.excerpt,
          excerpt: citation.excerpt,
          sourceMessageId: message.id,
          sourceCitationId: citation.id,
        },
        "Added citation to evidence.",
      );
      onChangeView?.("evidence");
    },
    [onAddEvidenceItem, onChangeView],
  );

  const openReceiptComposer = useCallback(() => {
    if (evidenceItems.length === 0) {
      onShowNotice?.("Add reviewed evidence before creating a receipt.");
      return;
    }

    setLockedEvidenceItems(evidenceItems);
    setReceiptTitle(buildReceiptTitle(evidenceItems, currentLabel));
    setReceiptInterpretation("");
    setReceiptImplications("");
    setReceiptStance("tentative");
    setReceiptError("");
    setReceiptComposerOpen(true);
  }, [currentLabel, evidenceItems, onShowNotice]);

  const handleCreateReceipt = useCallback(async () => {
    if (!receiptTitle.trim() || !receiptInterpretation.trim() || lockedEvidenceItems.length === 0) {
      setReceiptError("Title, interpretation, and reviewed evidence are required.");
      return;
    }

    setCreatingReceipt(true);
    setReceiptError("");

    try {
      const response = await fetch("/api/reader/receipts/from-reading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentKey: documentData.documentKey,
          threadId,
          title: receiptTitle.trim(),
          interpretation: receiptInterpretation.trim(),
          implications: receiptImplications.trim() || undefined,
          stance: receiptStance,
          evidenceItemIds: lockedEvidenceItems.map((item) => item.id),
          linkedMessageIds: [
            ...new Set(lockedEvidenceItems.map((item) => item.sourceMessageId).filter(Boolean)),
          ],
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not create receipt.");
      }

      if (payload?.remoteReceipt?.id) {
        onShowNotice?.("Receipt draft created in GetReceipts.");
      } else if (payload?.remoteError) {
        onShowNotice?.("Saved local receipt. GetReceipts handoff needs attention.");
      } else {
        onShowNotice?.("Saved local interpretation receipt.");
      }

      setReceiptComposerOpen(false);
    } catch (error) {
      setReceiptError(error instanceof Error ? error.message : "Could not create receipt.");
    } finally {
      setCreatingReceipt(false);
    }
  }, [
    documentData.documentKey,
    lockedEvidenceItems,
    onShowNotice,
    receiptImplications,
    receiptInterpretation,
    receiptStance,
    receiptTitle,
    threadId,
  ]);

  return (
    <aside className={`reader-seven ${open ? "is-open" : ""} is-view-${view}`}>
      <div className="reader-seven__header">
        <div className="reader-seven__heading">
          <p className="reader-seven__eyebrow">Seven</p>
          <p className="reader-seven__meta">{currentLabel}</p>
        </div>
        <button
          type="button"
          className="reader-chrome-button reader-chrome-button--icon"
          onClick={onClose}
          aria-label="Close Seven"
        >
          ×
        </button>
      </div>

      <div className="reader-seven__body">
        <div className="reader-seven__listen-pane">
          <div className="reader-seven__overview">
            <div className="reader-seven__identity">
              <p className="reader-seven__identity-eyebrow">Guide + player</p>
              <p className="reader-seven__identity-preview">{sectionPreview || currentLabel}</p>
            </div>

            {showStatus ? (
              <p className="reader-seven__status" aria-live="polite">
                {liveStatus}
              </p>
            ) : null}

            <div className="reader-seven__player">
              <div className="reader-seven__player-track">
                <p className="reader-seven__player-kicker">
                  Section {playerSectionIndex + 1} of {sectionEntries.length}
                </p>
                <p className="reader-seven__player-title">{playerSection.title}</p>
              </div>

              <div className="reader-seven__player-controls">
                <button
                  type="button"
                  className="reader-seven__transport"
                  onClick={() => handleMoveSection(-1)}
                  disabled={!previousSection}
                  aria-label={
                    previousSection
                      ? `Go to previous section, ${previousSection.title}`
                      : "No previous section"
                  }
                  title={previousSection ? previousSection.title : "No previous section"}
                >
                  <SkipPreviousIcon />
                  <span className="sr-only">Previous section</span>
                </button>

                <button
                  type="button"
                  className="reader-seven__transport reader-seven__transport--primary"
                  onClick={handleToggleSectionPlayback}
                  disabled={!canPlaySection}
                  aria-label={
                    sectionAudioPlaying
                      ? `Pause ${playerSection.title}`
                      : sectionAudioPaused
                        ? `Resume ${playerSection.title}`
                        : `Play ${playerSection.title}`
                  }
                >
                  {sectionAudioPlaying ? <PauseIcon /> : <PlayIcon />}
                  <span>{sectionAudioPlaying ? "Pause" : sectionAudioPaused ? "Resume" : "Play"}</span>
                </button>

                <button
                  type="button"
                  className="reader-seven__transport"
                  onClick={() => handleMoveSection(1)}
                  disabled={!nextSection}
                  aria-label={
                    nextSection ? `Go to next section, ${nextSection.title}` : "No next section"
                  }
                  title={nextSection ? nextSection.title : "No next section"}
                >
                  <SkipNextIcon />
                  <span className="sr-only">Next section</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="reader-seven__guide">
          <GuideTabs view={view} onChangeView={onChangeView} />

          {view === "listen" ? (
            <div className="reader-seven__guide-pane reader-seven__guide-pane--listen">
              <div className="reader-seven__empty">
                <p className="reader-seven__empty-title">Listen from the current section</p>
                <p className="reader-seven__empty-copy">
                  The transport above stays tied to the manuscript. Move section by section, keep the text central, and let chat or evidence work happen alongside it.
                </p>
              </div>
            </div>
          ) : null}

          {view === "chat" ? (
            <div className="reader-seven__guide-pane reader-seven__guide-pane--chat">
              <div ref={messageListRef} className="reader-seven__messages">
                {messages.length === 0 ? (
                  <div className="reader-seven__empty">
                    <p className="reader-seven__empty-title">Ask from the text you are in</p>
                    <p className="reader-seven__empty-copy">
                      Seven can explain this section, compare nearby passages, and surface citations you can review before turning them into evidence.
                    </p>
                    <p className="reader-seven__empty-note">
                      Assistant replies are guidance. Evidence only enters your reviewed set when you explicitly accept source passages.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <article key={message.id} className={`reader-seven__message is-${message.role}`}>
                      <div className="reader-seven__message-meta">
                        <span>{message.role === "assistant" ? "Seven" : "You"}</span>
                      </div>
                      <p className="reader-seven__message-text">{message.content}</p>
                      {message.role === "assistant" ? (
                        <>
                          <div className="reader-seven__message-actions">
                            <button
                              type="button"
                              className={`reader-seven__reply-listen ${
                                audioActive &&
                                audioState.sourceType === "message" &&
                                audioState.sourceId === message.id
                                  ? "is-active"
                                  : ""
                              }`}
                              disabled={!effectiveVoiceEnabled}
                              aria-label={
                                audioActive &&
                                audioState.sourceType === "message" &&
                                audioState.sourceId === message.id
                                  ? "Stop this reply"
                                  : "Play this reply"
                              }
                              onClick={() => {
                                const playingThisReply =
                                  audioActive &&
                                  audioState.sourceType === "message" &&
                                  audioState.sourceId === message.id;

                                if (playingThisReply) {
                                  stopAudio();
                                  return;
                                }

                                playText(message.content, "Playing Seven's reply", {
                                  type: "message",
                                  id: message.id,
                                });
                              }}
                            >
                              <SpeakerIcon />
                              <span>
                                {audioActive &&
                                audioState.sourceType === "message" &&
                                audioState.sourceId === message.id
                                  ? "Stop reply"
                                  : "Play reply"}
                              </span>
                            </button>
                          </div>

                          {Array.isArray(message.citations) && message.citations.length > 0 ? (
                            <div className="reader-seven__citations">
                              {message.citations.map((citation) => (
                                <CitationCard
                                  key={`${message.id}-${citation.id}`}
                                  citation={citation}
                                  included={includedCitationKeys.has(`${message.id}:${citation.id}`)}
                                  onAdd={() => handleAddCitation(message, citation)}
                                />
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </article>
                  ))
                )}
              </div>

              {textEnabled ? (
                <form
                  className={`reader-seven__composer ${
                    composerExpanded ? "is-expanded" : "is-collapsed"
                  }`}
                  onFocus={() => setComposerActive(true)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setComposerActive(false);
                    }
                  }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const question = draft.trim();
                    if (!question || pending) return;

                    requestSeven({
                      mode: "question",
                      question,
                      userLine: question,
                    });
                    setDraft("");
                  }}
                >
                  <textarea
                    id="seven-question"
                    className="reader-seven__composer-input"
                    aria-label="Ask Seven about this section"
                    rows={composerExpanded ? 3 : 1}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") {
                        return;
                      }

                      event.preventDefault();
                      const question = draft.trim();
                      if (!question || pending) return;

                      requestSeven({
                        mode: "question",
                        question,
                        userLine: question,
                      });
                      setDraft("");
                    }}
                    placeholder="Ask Seven..."
                    disabled={!textEnabled}
                  />
                  <div className="reader-seven__composer-actions">
                    <button
                      type="submit"
                      className="reader-seven__send"
                      disabled={!draft.trim() || pending || !textEnabled}
                    >
                      {pending ? "Thinking..." : "Send"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="reader-seven__disabled">Chat unavailable.</div>
              )}
            </div>
          ) : null}

          {view === "evidence" ? (
            <div className="reader-seven__guide-pane reader-seven__guide-pane--evidence">
              <div className="reader-seven__evidence-header">
                <div>
                  <p className="reader-seven__eyebrow">Reviewed evidence</p>
                  <h3 className="reader-seven__evidence-title">Evidence Set</h3>
                </div>
                <button
                  type="button"
                  className={`reader-mark-card__receipt-toggle ${
                    currentSectionEvidence ? "is-selected" : ""
                  }`}
                  onClick={handleAddCurrentSectionEvidence}
                >
                  {currentSectionEvidence ? "In Evidence" : "Add Current Section"}
                </button>
              </div>

              <p className="reader-seven__evidence-note">
                Reader-selected passages and notes can enter directly. Seven can suggest citations, but you decide what becomes evidence.
              </p>

              {evidenceItems.length === 0 ? (
                <div className="reader-seven__empty">
                  <p className="reader-seven__empty-title">No reviewed evidence yet</p>
                  <p className="reader-seven__empty-copy">
                    Add a selected passage, a note, a highlight, or an accepted Seven citation to begin building a receipt.
                  </p>
                </div>
              ) : (
                <div className="reader-seven__evidence-list">
                  {evidenceItems.map((item) => (
                    <EvidenceItemCard
                      key={item.id}
                      item={item}
                      onRemove={(itemId) => onRemoveEvidenceItem?.(itemId)}
                    />
                  ))}
                </div>
              )}

              <div className="reader-seven__evidence-actions">
                <button
                  type="button"
                  className="reader-seven__send reader-seven__send--wide"
                  onClick={openReceiptComposer}
                  disabled={evidenceItems.length === 0}
                >
                  Create Receipt
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {receiptComposerOpen ? (
          <ReceiptComposer
            currentLabel={currentLabel}
            evidenceItems={lockedEvidenceItems}
            creating={creatingReceipt}
            error={receiptError}
            title={receiptTitle}
            interpretation={receiptInterpretation}
            implications={receiptImplications}
            stance={receiptStance}
            onChangeTitle={setReceiptTitle}
            onChangeInterpretation={setReceiptInterpretation}
            onChangeImplications={setReceiptImplications}
            onChangeStance={setReceiptStance}
            onClose={() => setReceiptComposerOpen(false)}
            onSubmit={handleCreateReceipt}
          />
        ) : null}
      </div>
    </aside>
  );
}
