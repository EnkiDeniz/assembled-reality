"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildSevenFallbackMessage,
  getNarrationText,
  getReaderSection,
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

function ExplainIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5.35 4.75h9.3A1.35 1.35 0 0 1 16 6.1v5.4a1.35 1.35 0 0 1-1.35 1.35H10.6l-2.5 2v-2H5.35A1.35 1.35 0 0 1 4 11.5V6.1a1.35 1.35 0 0 1 1.35-1.35Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path
        d="M7.1 8h5.8M7.1 10.2h4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SummaryIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5 5.5h10M5 9.25h10M5 13h6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
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
  onClose,
}) {
  const currentSection = useMemo(
    () => getReaderSection(documentData, activeSlug),
    [activeSlug, documentData],
  );
  const sectionOutline = useMemo(() => getSectionOutline(documentData), [documentData]);
  const narrationText = useMemo(
    () => getNarrationText(documentData, activeSlug),
    [activeSlug, documentData],
  );
  const speechChunks = useMemo(() => splitTextForSpeech(narrationText), [narrationText]);

  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [browserSpeechEnabled, setBrowserSpeechEnabled] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [audioState, setAudioState] = useState({
    status: "idle",
    label: "",
    index: 0,
    total: 0,
    mode: preferredVoiceProvider ? "provider" : "device",
    sourceType: null,
    sourceId: null,
  });
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
  const canListen = effectiveVoiceEnabled && speechChunks.length > 0;
  const audioActive = audioState.status !== "idle";
  const hasConversation = messages.length > 0;
  const sectionAudioActive = audioActive && audioState.sourceType === "section";

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!open || !textEnabled || !composerInputRef.current) {
      return;
    }

    window.setTimeout(() => {
      composerInputRef.current?.focus();
    }, 60);
  }, [open, textEnabled]);

  const starterPrompts = useMemo(() => {
    if (!textEnabled) return [];

    return [
      {
        id: "plain-language",
        label: "Plain language",
        helper: "What is this section saying in plain language?",
        mode: "explain",
        question: "",
        userLine: `Explain ${currentLabel} in plain language.`,
      },
      {
        id: "practice",
        label: "In practice",
        helper: "What matters here in practice?",
        mode: "question",
        question: "What matters here in practice?",
        userLine: "What matters here in practice?",
      },
      {
        id: "attention",
        label: "Pay attention",
        helper: "What should I pay attention to here?",
        mode: "question",
        question: "What should I pay attention to here?",
        userLine: "What should I pay attention to here?",
      },
      {
        id: "connection",
        label: "Connection",
        helper:
          activeSlug === "beginning"
            ? "What is this opening trying to set up?"
            : "How does this connect to what came before?",
        mode: "question",
        question:
          activeSlug === "beginning"
            ? "What is this opening trying to set up?"
            : "How does this connect to what came before?",
        userLine:
          activeSlug === "beginning"
            ? "What is this opening trying to set up?"
            : "How does this connect to what came before?",
      },
    ];
  }, [activeSlug, currentLabel, textEnabled]);

  const actionButtons = [
    effectiveVoiceEnabled
      ? {
          id: "listen",
          label: sectionAudioActive ? "Stop" : "Read section",
          className: "reader-seven__action is-primary",
          icon: <SpeakerIcon />,
          disabled: !canListen && !audioActive,
          onClick: () => {
            if (sectionAudioActive) {
              stopAudio();
              return;
            }

            playText(narrationText, `Reading ${currentLabel}`, {
              type: "section",
              id: activeSlug,
            });
          },
        }
      : null,
    textEnabled
      ? {
          id: "explain",
          label: "Explain",
          className: "reader-seven__action",
          icon: <ExplainIcon />,
          disabled: pending,
          onClick: () =>
            requestSeven({
              mode: "explain",
              question: "",
              userLine: `Explain ${currentLabel} in plain language.`,
            }),
        }
      : null,
    textEnabled
      ? {
          id: "summary",
          label: "Summarize",
          className: "reader-seven__action",
          icon: <SummaryIcon />,
          disabled: pending,
          onClick: () =>
            requestSeven({
              mode: "summary",
              question: "",
              userLine: `Summarize ${currentLabel}.`,
            }),
        }
      : null,
  ].filter(Boolean);

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
            ? "Ask, summarize, or listen from here."
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
    setAudioState({
      status: "idle",
      label: "",
      index: 0,
      total: 0,
      mode: preferredVoiceProvider ? "provider" : "device",
      sourceType: null,
      sourceId: null,
    });
  }, [clearAudioUrl, preferredVoiceProvider]);

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

  async function playWithDeviceVoice(chunks, label, sessionId) {
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
        setAudioState({
          status: "idle",
          label: "",
          index: 0,
          total: 0,
          mode: "device",
        });
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
        await playWithDeviceVoice(chunks, label, sessionId);
        setVoiceStatus({
          state: "device",
          provider: "device",
          fallbackFrom: null,
          reasonCode: "",
          message: "Listening is available through your device voice.",
        });
      } catch (error) {
        setAudioError(error instanceof Error ? error.message : "Seven could not start speaking.");
        setVoiceStatus({
          state: "error",
          provider: "device",
          fallbackFrom: null,
          reasonCode: "unknown_error",
          message: error instanceof Error ? error.message : "Seven could not start speaking.",
        });
        setAudioState({
          status: "idle",
          label: "",
          index: 0,
          total: 0,
          mode: "device",
          sourceType: null,
          sourceId: null,
        });
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
          setAudioState({
            status: "idle",
            label: "",
            index: 0,
            total: 0,
            mode: "provider",
            sourceType: null,
            sourceId: null,
          });
          return;
        }

        try {
          await playChunk(chunkIndex + 1);
        } catch (error) {
          setAudioError(
            error instanceof Error ? error.message : "Seven stopped speaking unexpectedly.",
          );
          setAudioState({
            status: "idle",
            label: "",
            index: 0,
            total: 0,
            mode: "provider",
            sourceType: null,
            sourceId: null,
          });
        }
      });

      audio.addEventListener("error", () => {
        clearAudioUrl();
        audioRef.current = null;
        setAudioError("Seven could not play this audio chunk.");
        setAudioState({
          status: "idle",
          label: "",
          index: 0,
          total: 0,
          mode: "provider",
          sourceType: null,
          sourceId: null,
        });
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
          await playWithDeviceVoice(chunks, label, sessionId);
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

      setAudioState({
        status: "idle",
        label: "",
        index: 0,
        total: 0,
        mode: browserSpeechEnabled ? "device" : "provider",
        sourceType: null,
        sourceId: null,
      });
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
          {showStatus ? (
            <p className="reader-seven__status" aria-live="polite">
              {liveStatus}
            </p>
          ) : null}

          {actionButtons.length ? (
            <div className="reader-seven__section-tools">
              <p className="reader-seven__section-tools-label">Section tools</p>
              <div className="reader-seven__actions">
                {actionButtons.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className={action.className}
                    disabled={action.disabled}
                    onClick={action.onClick}
                  >
                    <span className="reader-seven__action-inner">
                      <span className="reader-seven__action-icon">{action.icon}</span>
                      <span>{action.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

        </div>

        <div ref={messageListRef} className="reader-seven__messages">
          {!hasConversation && starterPrompts.length ? (
            <div className="reader-seven__empty">
              <div>
                <p className="reader-seven__empty-title">Ask about this section.</p>
                <p className="reader-seven__empty-copy">
                  Start with a direct question or tap one of these.
                </p>
                <p className="reader-seven__empty-note">
                  The top row works on the section. Reply audio appears under each Seven answer.
                </p>
              </div>
              <div className="reader-seven__starter-list" aria-label="Starter prompts">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    className="reader-seven__starter"
                    disabled={pending}
                    onClick={() =>
                      requestSeven({
                        mode: prompt.mode,
                        question: prompt.question,
                        userLine: prompt.helper,
                      })
                    }
                  >
                    <span className="reader-seven__starter-helper">{prompt.helper}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <article key={message.id} className={`reader-seven__message is-${message.role}`}>
              <div className="reader-seven__message-meta">
                <span>{message.role === "assistant" ? "Seven" : "You"}</span>
              </div>
              <p className="reader-seven__message-text">{message.content}</p>
              {message.role === "assistant" ? (
                <div className="reader-seven__message-actions">
                  <p className="reader-seven__message-audio-label">Reply audio</p>
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
            className="reader-seven__composer"
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
              rows={2}
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
              placeholder="Ask what this section means, what matters, or what to pay attention to..."
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
            Seven's chat is unavailable right now. Voice guidance can still work when the provider or device voice is available.
          </div>
        )}
      </div>
    </aside>
  );
}
