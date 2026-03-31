"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildExcerpt } from "../lib/text";
import {
  getNarrationText,
  getReaderSection,
  getSectionPreview,
  getSectionOutline,
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

const INITIAL_MESSAGE =
  "I’m Seven.";

function buildWelcomeMessage({ textEnabled, voiceAvailable, usingDeviceVoice }) {
  if (voiceAvailable && textEnabled && !usingDeviceVoice) {
    return `${INITIAL_MESSAGE} I can read the current section aloud, explain it in plainer language, or answer a question about what you’re reading.`;
  }

  if (usingDeviceVoice && textEnabled) {
    return `${INITIAL_MESSAGE} I can read the current section aloud with your device voice, explain it in plainer language, or answer a question about what you’re reading.`;
  }

  if (voiceAvailable && !usingDeviceVoice) {
    return `${INITIAL_MESSAGE} I can read the current section aloud right now, but chat is unavailable.`;
  }

  if (usingDeviceVoice) {
    return `${INITIAL_MESSAGE} I can read the current section aloud with your device voice right now, but chat is unavailable.`;
  }

  if (textEnabled) {
    return `${INITIAL_MESSAGE} I can explain this section and answer questions right now, but voice is unavailable.`;
  }

  return `${INITIAL_MESSAGE} Voice and chat are unavailable right now.`;
}

export default function SevenPanel({
  open,
  textEnabled,
  voiceEnabled,
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
  const sectionPreview = useMemo(
    () => buildExcerpt(getSectionPreview(documentData, activeSlug), 180),
    [activeSlug, documentData],
  );

  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [browserSpeechEnabled, setBrowserSpeechEnabled] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: "seven-welcome",
      role: "assistant",
      content: buildWelcomeMessage({
        textEnabled,
        voiceAvailable: voiceEnabled,
        usingDeviceVoice: false,
      }),
    },
  ]);
  const [audioState, setAudioState] = useState({
    status: "idle",
    label: "",
    index: 0,
    total: 0,
    mode: "provider",
  });
  const [audioError, setAudioError] = useState("");

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

  const effectiveVoiceEnabled = voiceEnabled || browserSpeechEnabled;
  const usingDeviceVoice = !voiceEnabled && browserSpeechEnabled;
  const welcomeMessage = useMemo(
    () =>
      buildWelcomeMessage({
        textEnabled,
        voiceAvailable: effectiveVoiceEnabled,
        usingDeviceVoice,
      }),
    [effectiveVoiceEnabled, textEnabled, usingDeviceVoice],
  );
  const textDisabledReason = textEnabled
    ? ""
    : "Seven’s chat is unavailable right now.";
  const voiceDisabledReason = effectiveVoiceEnabled
    ? ""
    : "Seven’s voice is unavailable right now.";

  const canListen = effectiveVoiceEnabled && speechChunks.length > 0;
  const audioActive = audioState.status !== "idle";
  const hasCapabilities = effectiveVoiceEnabled || textEnabled;
  const capabilityNotice = !hasCapabilities
    ? "Seven is offline right now."
    : usingDeviceVoice && textEnabled
      ? "Listening is using your device voice right now."
      : usingDeviceVoice
        ? "Listening is using your device voice right now. Chat is offline."
      : !effectiveVoiceEnabled
        ? "Voice is offline right now. Text guidance is still available."
      : !textEnabled
        ? "Text guidance is offline right now. Voice is still available."
        : "";
  const panelMeta = !hasCapabilities
    ? "Seven is temporarily offline for this section."
    : effectiveVoiceEnabled && textEnabled
      ? "Listen now or ask about the section in view."
      : effectiveVoiceEnabled
        ? usingDeviceVoice
          ? "Read the section aloud with your device voice."
          : "Read the section aloud."
        : "Ask about the section in view.";
  const actions = [
    effectiveVoiceEnabled
      ? {
          id: "listen",
          className: "reader-seven__action is-primary",
          disabled: !canListen && !audioActive,
          label: audioActive ? "Stop" : "Listen",
          icon: <SpeakerIcon />,
          onClick: () => {
            if (audioActive) {
              stopAudio();
              return;
            }

            playText(narrationText, `Reading ${currentLabel}`);
          },
        }
      : null,
    textEnabled
      ? {
          id: "explain",
          className: "reader-seven__action",
          disabled: pending,
          label: "Explain",
          icon: <ExplainIcon />,
          onClick: () =>
            requestSeven({
              mode: "explain",
              question: "",
              userLine: `Explain ${currentLabel} in plainer language.`,
            }),
        }
      : null,
  ].filter(Boolean);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.id !== "seven-welcome") {
        return current;
      }

      return [{ id: "seven-welcome", role: "assistant", content: welcomeMessage }];
    });
  }, [welcomeMessage]);

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
      mode: "provider",
    });
  }, [clearAudioUrl]);

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
        throw new Error(payload?.error || "Seven could not generate audio.");
      }

      throw new Error("Seven could not generate audio.");
    }

    return response.blob();
  }

  async function playWithDeviceVoice(chunks, label, sessionId) {
    if (
      typeof window === "undefined" ||
      typeof window.speechSynthesis === "undefined" ||
      typeof window.SpeechSynthesisUtterance === "undefined"
    ) {
      throw new Error("Seven’s voice is unavailable right now.");
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

  async function playText(text, label) {
    if (!effectiveVoiceEnabled) {
      setAudioError(voiceDisabledReason);
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
      mode: usingDeviceVoice ? "device" : "provider",
    });

    if (usingDeviceVoice) {
      try {
        await playWithDeviceVoice(chunks, label, sessionId);
      } catch (error) {
        setAudioError(error instanceof Error ? error.message : "Seven could not start speaking.");
        setAudioState({
          status: "idle",
          label: "",
          index: 0,
          total: 0,
          mode: "device",
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
      });

      const blob = await fetchAudioChunk(chunks[chunkIndex]);
      if (audioSessionRef.current !== sessionId) return;

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
      });
    };

    try {
      await playChunk(0);
    } catch (error) {
      if (browserSpeechEnabled && audioSessionRef.current === sessionId) {
        try {
          setAudioError("");
          await playWithDeviceVoice(chunks, label, sessionId);
          return;
        } catch (fallbackError) {
          setAudioError(
            fallbackError instanceof Error
              ? fallbackError.message
              : "Seven could not start speaking.",
          );
        }
      } else {
        setAudioError(error instanceof Error ? error.message : "Seven could not start speaking.");
      }

      setAudioState({
        status: "idle",
        label: "",
        index: 0,
        total: 0,
        mode: browserSpeechEnabled ? "device" : "provider",
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
          content: textDisabledReason,
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
          documentTitle: documentData.title,
          documentSubtitle: documentData.subtitle,
          introMarkdown: documentData.introMarkdown,
          sectionOutline,
          currentLabel,
          currentSectionTitle: currentSection.title,
          currentSectionMarkdown: currentSection.markdown,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Seven could not respond.");
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: payload.answer,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error ? error.message : "Seven could not respond.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className={`reader-seven ${open ? "is-open" : ""}`}>
      <div className="reader-seven__header">
        <div>
          <p className="reader-seven__eyebrow">Seven</p>
          <h2 className="reader-seven__title">{currentLabel}</h2>
          <p className="reader-seven__meta">{panelMeta}</p>
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
        <div className="reader-seven__intro">
          <div className="reader-seven__context">
            <p className="reader-seven__context-label">In This Section</p>
            <p className="reader-seven__context-text">{sectionPreview || "No section text yet."}</p>
          </div>

          {actions.length ? (
            <div className="reader-seven__actions">
              {actions.map((action) => (
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
          ) : null}

          <div className="reader-seven__status" aria-live="polite">
            {audioState.status === "loading"
              ? audioState.mode === "device"
                ? `${audioState.label}… starting your device voice.`
                : `${audioState.label}… preparing part ${audioState.index} of ${audioState.total}.`
              : null}
            {audioState.status === "playing"
              ? audioState.mode === "device"
                ? `${audioState.label}… speaking through your device voice, part ${audioState.index} of ${audioState.total}.`
                : `${audioState.label}… playing part ${audioState.index} of ${audioState.total}.`
              : null}
            {audioState.status === "idle" && audioError ? audioError : null}
            {audioState.status === "idle" && !audioError && effectiveVoiceEnabled
              ? usingDeviceVoice
                ? "Seven is ready to read with your device voice."
                : "Seven is ready to read this section aloud."
              : null}
          </div>

          {capabilityNotice ? (
            <p className="reader-seven__notice">{capabilityNotice}</p>
          ) : null}
        </div>

        <div ref={messageListRef} className="reader-seven__messages">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`reader-seven__message is-${message.role}`}
            >
              <div className="reader-seven__message-meta">
                <span>{message.role === "assistant" ? "Seven" : "You"}</span>
                {message.role === "assistant" ? (
                  <button
                    type="button"
                    className="reader-seven__speak"
                    disabled={!effectiveVoiceEnabled}
                    onClick={() => playText(message.content, "Speaking Seven")}
                  >
                    <SpeakerIcon />
                    <span>Listen</span>
                  </button>
                ) : null}
              </div>
              <p className="reader-seven__message-text">{message.content}</p>
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
            <label className="reader-seven__composer-label" htmlFor="seven-question">
              Ask Seven About This Section
            </label>
            <textarea
              id="seven-question"
              ref={composerInputRef}
              className="reader-seven__composer-input"
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What does this mean in practice…"
              disabled={!textEnabled}
            />
            <div className="reader-seven__composer-actions">
            <p className="reader-seven__composer-note">
                Ask a specific question when you want more than the quick explanation.
            </p>
              <button
                type="submit"
                className="reader-seven__send"
                disabled={!draft.trim() || pending || !textEnabled}
              >
                {pending ? "Thinking…" : "Ask Seven"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </aside>
  );
}
