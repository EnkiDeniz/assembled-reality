"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getReaderSection,
  getSectionOutline,
  getSectionPreview,
  getSevenProviderLabel,
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

function createSevenApiError(payload, fallbackMessage) {
  const error = new Error(payload?.error || fallbackMessage);
  error.provider = payload?.provider || null;
  error.reasonCode = payload?.reasonCode || "";
  error.retryAfterSeconds = payload?.retryAfterSeconds || null;
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

function CitationCard({ citation, included, onAdd }) {
  return (
    <article className={`reader-seven__citation ${included ? "is-included" : ""}`}>
      <div className="reader-seven__citation-copy">
        <p className="reader-seven__citation-label">
          {citation.sectionLabel || citation.sectionTitle}
        </p>
        <p className="reader-seven__citation-excerpt">“{citation.excerpt}”</p>
      </div>
      <button
        type="button"
        className={`reader-mark-card__receipt-toggle ${included ? "is-selected" : ""}`}
        onClick={onAdd}
        disabled={included}
      >
        {included ? "In Evidence" : "+ Evidence"}
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
          className="reader-seven__close"
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
  view = "guide",
  textEnabled,
  textProvider = null,
  effectiveVoiceEnabled = false,
  liveStatus = "",
  showStatus = false,
  documentData,
  activeSlug,
  currentLabel,
  initialThread = null,
  evidenceItems = [],
  onAddEvidenceItem,
  onRemoveEvidenceItem,
  onShowNotice,
  onClose,
  onSelectSection,
  sectionEntries = [],
  playingSectionSlug = null,
  messageAudioState = null,
  onPlayMessage,
  onStopMessage,
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
  const [threadId, setThreadId] = useState(() => initialThread?.id || null);
  const [messages, setMessages] = useState(() => initialThread?.messages || []);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [chatStatus, setChatStatus] = useState(() =>
    initialChatStatus({ textEnabled, textProvider }),
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
  const messageListRef = useRef(null);

  useEffect(() => {
    setThreadId(initialThread?.id || null);
    setMessages(initialThread?.messages || []);
  }, [initialThread?.id, initialThread?.messages]);

  useEffect(() => {
    setChatStatus((current) =>
      current.state === "error" ? current : initialChatStatus({ textEnabled, textProvider }),
    );
  }, [textEnabled, textProvider]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open) return;
    setReceiptComposerOpen(false);
  }, [open]);

  const composerExpanded = composerActive || draft.trim().length > 0;
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
    },
    [onAddEvidenceItem],
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
  }, [
    currentSection.slug,
    currentSection.title,
    currentSectionEvidence,
    onAddEvidenceItem,
    onRemoveEvidenceItem,
    sectionPreview,
  ]);

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

  const overlayTitle =
    view === "evidence" ? "Evidence" : view === "sections" ? "Sections" : "Guide";

  return (
    <aside className={`reader-seven ${open ? "is-open" : ""} is-view-${view}`}>
      <div className="reader-seven__header">
        <div className="reader-seven__heading">
          <p className="reader-seven__eyebrow">{overlayTitle}</p>
          <p className="reader-seven__meta">{currentLabel}</p>
        </div>
        <button
          type="button"
          className="reader-seven__close"
          onClick={onClose}
          aria-label={`Close ${overlayTitle}`}
        >
          ×
        </button>
      </div>

      <div className="reader-seven__body">
        {showStatus ? (
          <p className="reader-seven__status" aria-live="polite">
            {liveStatus}
          </p>
        ) : null}

        {view === "guide" ? (
          <div className="reader-seven__guide-pane reader-seven__guide-pane--chat">
            <div className="reader-seven__guide-intro">
              <p className="reader-seven__identity-eyebrow">Section scope</p>
              <p className="reader-seven__identity-preview">{sectionPreview || currentLabel}</p>
            </div>

            <div ref={messageListRef} className="reader-seven__messages">
              {messages.length === 0 ? (
                <div className="reader-seven__empty">
                  <p className="reader-seven__empty-title">Start with a question.</p>
                </div>
              ) : (
                messages.map((message) => {
                  const playingThisReply =
                    messageAudioState?.sourceType === "message" &&
                    messageAudioState?.sourceId === message.id &&
                    messageAudioState?.status !== "idle";

                  return (
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
                                playingThisReply ? "is-active" : ""
                              }`}
                              disabled={!effectiveVoiceEnabled}
                              onClick={() => {
                                if (playingThisReply) {
                                  onStopMessage?.();
                                  return;
                                }

                                onPlayMessage?.(message.id, message.content);
                              }}
                            >
                              <SpeakerIcon />
                              <span>{playingThisReply ? "Stop reply" : "Play reply"}</span>
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
                  );
                })
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
                  placeholder="Ask about this section"
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
                {chatStatus.state === "error" ? chatStatus.message : "Chat unavailable."}
              </div>
            )}
          </div>
        ) : null}

        {view === "evidence" ? (
          <div className="reader-seven__guide-pane reader-seven__guide-pane--evidence">
            <div className="reader-seven__evidence-header">
              <div>
                <p className="reader-seven__eyebrow">Reviewed evidence</p>
                <h3 className="reader-seven__evidence-title">Evidence</h3>
              </div>
              <button
                type="button"
                className={`reader-mark-card__receipt-toggle ${
                  currentSectionEvidence ? "is-selected" : ""
                }`}
                onClick={handleAddCurrentSectionEvidence}
              >
                {currentSectionEvidence ? "In Evidence" : "Add Section"}
              </button>
            </div>

            {evidenceItems.length === 0 ? (
              <div className="reader-seven__empty">
                <p className="reader-seven__empty-title">No evidence yet.</p>
                <p className="reader-seven__empty-copy">
                  Add a passage, note, or citation.
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

        {view === "sections" ? (
          <div className="reader-seven__guide-pane reader-seven__guide-pane--sections">
            <div className="reader-seven__sections-list" role="list">
              {sectionEntries.map((section, index) => {
                const isActive = section.slug === activeSlug;
                const isPlaying = playingSectionSlug === section.slug;

                return (
                  <button
                    key={section.slug}
                    type="button"
                    className={`reader-seven__section-row ${
                      isActive ? "is-active" : ""
                    } ${isPlaying ? "is-playing" : ""}`}
                    onClick={() => onSelectSection?.(section.slug)}
                  >
                    <span className="reader-seven__section-index">
                      {isPlaying ? "♪" : section.number ?? index + 1}
                    </span>
                    <span className="reader-seven__section-copy">
                      <span className="reader-seven__section-title">{section.title}</span>
                      {typeof section.blockCount === "number" && section.blockCount > 0 ? (
                        <span className="reader-seven__section-meta">
                          {section.blockCount} passage{section.blockCount === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

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
