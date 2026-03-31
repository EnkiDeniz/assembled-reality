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

export default function SevenPanel({
  open,
  textEnabled,
  voiceEnabled,
  textProvider = null,
  preferredVoiceProvider = null,
  documentData,
  activeSlug,
  currentLabel,
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
  const [messages, setMessages] = useState([]);

  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const audioSessionRef = useRef(0);
  const messageListRef = useRef(null);
  const composerInputRef = useRef(null);
  const [composerActive, setComposerActive] = useState(false);

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

  const effectiveVoiceEnabled = voiceEnabled || browserSpeechEnabled;
  const audioActive = audioState.status !== "idle";
  const playerSectionSlug =
    audioState.sourceType === "section" && audioState.sourceId ? audioState.sourceId : activeSlug;
  const playerSectionIndex = Math.max(
    0,
    sectionEntries.findIndex((entry) => entry.slug === playerSectionSlug),
  );
  const playerSection = sectionEntries[playerSectionIndex] || sectionEntries[0];
  const previousSection = playerSectionIndex > 0 ? sectionEntries[playerSectionIndex - 1] : null;
  const nextSection =
    playerSectionIndex < sectionEntries.length - 1 ? sectionEntries[playerSectionIndex + 1] : null;
  const sectionAudioActive = audioActive && audioState.sourceType === "section";
  const sectionAudioPlaying = sectionAudioActive && audioState.status === "playing";
  const sectionAudioPaused = sectionAudioActive && audioState.status === "paused";
  const hasMessages = messages.length > 0;
  const composerExpanded = composerActive || draft.trim().length > 0;
  const canPlaySection = effectiveVoiceEnabled && Boolean(playerSection?.narrationText);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages]);

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
              ? "Ask or listen from here."
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
    return undefined;
  }, [open, stopAudio]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  async function fetchAudioChunk(text) {
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
  }

  async function playWithDeviceVoice(chunks, label, sessionId, source = null) {
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
  }

  async function playText(text, label, source = null) {
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
            provider: sourceProvider,
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
  }

  function playSectionBySlug(slug) {
    const targetSection = sectionEntries.find((entry) => entry.slug === slug);
    if (!targetSection) return;

    playText(targetSection.narrationText, `Reading ${targetSection.title}`, {
      type: "section",
      id: targetSection.slug,
    });
  }

  function handleToggleSectionPlayback() {
    if (sectionAudioPlaying) {
      pauseAudio();
      return;
    }

    if (sectionAudioPaused) {
      resumeAudio();
      return;
    }

    playSectionBySlug(playerSection.slug);
  }

  function handleMoveSection(offset) {
    const targetSection = sectionEntries[playerSectionIndex + offset];
    if (!targetSection) return;

    const continuePlayback = sectionAudioActive;
    onNavigateSection?.(targetSection.slug);

    if (continuePlayback) {
      playSectionBySlug(targetSection.slug);
    }
  }

  async function requestSeven({ mode, question, userLine }) {
    if (!textEnabled) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-disabled-${Date.now()}`,
          role: "assistant",
          content: "Seven's chat is unavailable right now.",
        },
      ]);
      return;
    }

    setPending(true);
    setAudioError("");

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: userLine,
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

      setChatStatus({
        state: "ready",
        provider: payload.provider || textProvider,
        reasonCode: "",
        retryAfterSeconds: null,
        message: `Chat is ready through ${getSevenProviderLabel(payload.provider || textProvider)}.`,
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: payload.answer,
        },
      ]);
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
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className={`reader-seven ${open ? "is-open" : ""}`}>
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
        <div className="reader-seven__overview">
          {!hasMessages ? (
            <div className="reader-seven__identity">
              <p className="reader-seven__identity-preview">{sectionPreview || currentLabel}</p>
            </div>
          ) : null}

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

        <div ref={messageListRef} className="reader-seven__messages">
          {messages.map((message) => (
            <article key={message.id} className={`reader-seven__message is-${message.role}`}>
              <div className="reader-seven__message-meta">
                <span>{message.role === "assistant" ? "Seven" : "You"}</span>
              </div>
              <p className="reader-seven__message-text">{message.content}</p>
              {message.role === "assistant" ? (
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
              ) : null}
            </article>
          ))}
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
              ref={composerInputRef}
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
          <div className="reader-seven__disabled">
            Chat unavailable.
          </div>
        )}
      </div>
    </aside>
  );
}
