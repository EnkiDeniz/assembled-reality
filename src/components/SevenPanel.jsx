"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildExcerpt } from "../lib/text";
import {
  getNarrationText,
  getReaderSection,
  getSectionOutline,
  splitTextForSpeech,
  stripMarkdownForSpeech,
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

const INITIAL_MESSAGE =
  "I’m Seven.";

function buildWelcomeMessage({ textEnabled, voiceEnabled }) {
  if (voiceEnabled && textEnabled) {
    return `${INITIAL_MESSAGE} I can read the current section aloud, explain it in plainer language, or answer a question about what you’re reading.`;
  }

  if (voiceEnabled) {
    return `${INITIAL_MESSAGE} I can read the current section aloud right now, but chat is unavailable.`;
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
  const currentSectionPlainText = useMemo(
    () => stripMarkdownForSpeech(currentSection.markdown),
    [currentSection.markdown],
  );
  const welcomeMessage = useMemo(
    () => buildWelcomeMessage({ textEnabled, voiceEnabled }),
    [textEnabled, voiceEnabled],
  );

  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState(() => [
    { id: "seven-welcome", role: "assistant", content: welcomeMessage },
  ]);
  const [audioState, setAudioState] = useState({
    status: "idle",
    label: "",
    index: 0,
    total: 0,
  });
  const [audioError, setAudioError] = useState("");

  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const audioSessionRef = useRef(0);
  const messageListRef = useRef(null);
  const composerRef = useRef(null);
  const composerInputRef = useRef(null);

  const textDisabledReason = textEnabled
    ? ""
    : "Seven’s chat is unavailable right now.";
  const voiceDisabledReason = voiceEnabled
    ? ""
    : "Seven’s voice is unavailable right now.";

  const canListen = voiceEnabled && speechChunks.length > 0;
  const audioActive = audioState.status !== "idle";

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

    clearAudioUrl();
    setAudioState({
      status: "idle",
      label: "",
      index: 0,
      total: 0,
    });
  }, [clearAudioUrl]);

  const focusComposer = useCallback(() => {
    composerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    composerInputRef.current?.focus();
  }, []);

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

  async function playText(text, label) {
    if (!voiceEnabled) {
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
    });

    const playChunk = async (chunkIndex) => {
      if (audioSessionRef.current !== sessionId) return;

      setAudioState({
        status: "loading",
        label,
        index: chunkIndex + 1,
        total: chunks.length,
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
      });
    };

    try {
      await playChunk(0);
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : "Seven could not start speaking.");
      setAudioState({
        status: "idle",
        label: "",
        index: 0,
        total: 0,
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

  const sectionPreview = buildExcerpt(currentSectionPlainText, 180);

  return (
    <aside className={`reader-seven ${open ? "is-open" : ""}`}>
      <div className="reader-seven__header">
        <div>
          <p className="reader-seven__eyebrow">Seven</p>
          <h2 className="reader-seven__title">{currentLabel}</h2>
          <p className="reader-seven__meta">
            Interactive audio guide for the section in view.
          </p>
        </div>
        <button
          type="button"
          className="reader-chrome-button reader-chrome-button--icon"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="reader-seven__body">
        <div className="reader-seven__intro">
          <div className="reader-seven__context">
            <p className="reader-seven__context-label">Current focus</p>
            <p className="reader-seven__context-text">{sectionPreview || "No section text yet."}</p>
          </div>

          <div className="reader-seven__actions">
            <button
              type="button"
              className="reader-seven__action is-primary"
              disabled={!canListen && !audioActive}
              onClick={() => {
                if (audioActive) {
                  stopAudio();
                  return;
                }

                playText(narrationText, `Reading ${currentLabel}`);
              }}
            >
              {audioActive ? "Stop listening" : "Listen to section"}
            </button>
            <button
              type="button"
              className="reader-seven__action"
              disabled={!textEnabled || pending}
              onClick={() =>
                requestSeven({
                  mode: "explain",
                  question: "",
                  userLine: `Explain ${currentLabel} in plainer language.`,
                })
              }
            >
              Explain
            </button>
            <button
              type="button"
              className="reader-seven__action"
              disabled={!textEnabled || pending}
              onClick={() =>
                requestSeven({
                  mode: "summary",
                  question: "",
                  userLine: `Summarize ${currentLabel}.`,
                })
              }
            >
              Summarize
            </button>
            <button
              type="button"
              className="reader-seven__action"
              disabled={!textEnabled}
              onClick={focusComposer}
            >
              Ask a question
            </button>
          </div>

          <div className="reader-seven__status" aria-live="polite">
            {audioState.status === "loading"
              ? `${audioState.label}… preparing part ${audioState.index} of ${audioState.total}.`
              : null}
            {audioState.status === "playing"
              ? `${audioState.label}… playing part ${audioState.index} of ${audioState.total}.`
              : null}
            {audioState.status === "idle" && audioError ? audioError : null}
            {audioState.status === "idle" && !audioError && voiceEnabled
              ? "Seven is ready to read this section aloud."
              : null}
          </div>

          {!textEnabled ? <p className="reader-seven__disabled">{textDisabledReason}</p> : null}
          {!voiceEnabled ? <p className="reader-seven__disabled">{voiceDisabledReason}</p> : null}
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
                    disabled={!voiceEnabled}
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

        <form
          ref={composerRef}
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
            Ask Seven about this section
          </label>
          <textarea
            id="seven-question"
            ref={composerInputRef}
            className="reader-seven__composer-input"
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              textEnabled
                ? "What does this mean in practice?"
                : "Seven’s chat is unavailable right now."
            }
            disabled={!textEnabled}
          />
          <div className="reader-seven__composer-actions">
            <p className="reader-seven__composer-note">
              Seven stays close to the section in view and explains in spoken language.
            </p>
            <button
              type="submit"
              className="reader-seven__send"
              disabled={!draft.trim() || pending || !textEnabled}
            >
              {pending ? "Thinking" : "Ask Seven"}
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
