import { useEffect, useRef } from "react";

function SevenMessage({
  message,
  onStageMessage,
}) {
  const citations = Array.isArray(message?.citations) ? message.citations : [];
  const isAssistant = message?.role === "assistant";
  const isPending = Boolean(message?.pending);
  const isError = Boolean(message?.error);

  return (
    <article
      className={`assembler-utility-rail__message ${
        isAssistant ? "is-assistant" : "is-user"
      } ${isError ? "is-error" : ""}`}
    >
      <div className="assembler-utility-rail__message-meta">
        <span className="assembler-utility-rail__message-role">
          {isAssistant ? "7" : "You"}
        </span>
      </div>

      <div className="assembler-utility-rail__message-bubble">
        <p className="assembler-utility-rail__message-text">
          {isPending ? "Thinking…" : message?.content || ""}
        </p>

        {citations.length ? (
          <div className="assembler-utility-rail__citations">
            {citations.map((citation) => (
              <div key={citation.id || `${citation.sectionSlug}-${citation.sectionLabel}`} className="assembler-utility-rail__citation">
                <span className="assembler-utility-rail__citation-label">
                  {citation.sectionLabel || citation.sectionTitle || "Context"}
                </span>
                {citation.excerpt ? (
                  <span className="assembler-utility-rail__citation-excerpt">
                    {citation.excerpt}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {isAssistant && !isPending && !isError && onStageMessage ? (
        <div className="assembler-utility-rail__message-actions">
          <button
            type="button"
            className="assembler-utility-rail__message-action"
            onClick={() => onStageMessage(message)}
          >
            Add to staging
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function AiUtilityRail({
  open = false,
  embedded = false,
  documentTitle = "",
  thread = null,
  inputRef,
  value,
  pending = false,
  loading = false,
  errorMessage = "",
  suggestions = [],
  onToggleOpen,
  onChange,
  onSubmit,
  onSuggestion,
  onStageMessage,
}) {
  const messages = Array.isArray(thread?.messages) ? thread.messages : [];
  const scrollRef = useRef(null);
  const lastMessageContent = messages[messages.length - 1]?.content;
  const isExpanded = embedded || open;

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !isExpanded) return;
    node.scrollTop = node.scrollHeight;
  }, [isExpanded, lastMessageContent, messages.length]);

  return (
    <section className={`assembler-utility-rail ${open ? "is-open" : ""} ${embedded ? "is-embedded" : ""}`}>
      {!embedded ? (
        <>
          <div className="assembler-utility-rail__header">
            <div className="assembler-utility-rail__copy">
              <span className="assembler-utility-rail__eyebrow">7</span>
              <span className="assembler-utility-rail__title">Seven</span>
              <span className="assembler-utility-rail__document">{documentTitle || "Current document"}</span>
            </div>

            <button
              type="button"
              className={`assembler-utility-rail__toggle ${open ? "is-active" : ""}`}
              onClick={onToggleOpen}
              aria-label={open ? "Close Seven conversation" : "Open Seven conversation"}
            >
              {open ? "Close" : "Open"}
            </button>
          </div>

          <p className="assembler-utility-rail__hint">
            Think with the current document. Seven stays tied to this box, and useful answers can move into the seed.
          </p>
        </>
      ) : null}

      {isExpanded ? (
        <div className="assembler-utility-rail__body">
          <div className="assembler-utility-rail__presets">
            {suggestions.map((label) => (
              <button
                key={label}
                type="button"
                className="assembler-utility-rail__preset"
                onClick={() => onSuggestion(label)}
                disabled={pending}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="assembler-utility-rail__conversation" ref={scrollRef}>
            {loading && messages.length === 0 ? (
              <p className="assembler-utility-rail__empty">Loading conversation…</p>
            ) : messages.length ? (
              <div className="assembler-utility-rail__messages">
                {messages.map((message) => (
                  <SevenMessage
                    key={message.id}
                    message={message}
                    onStageMessage={onStageMessage}
                  />
                ))}
              </div>
            ) : (
              <p className="assembler-utility-rail__empty">
                Ask Seven about this document.
              </p>
            )}
          </div>

          {errorMessage ? (
            <p className="assembler-utility-rail__error" aria-live="polite">
              {errorMessage}
            </p>
          ) : null}

          <div className="assembler-utility-rail__field">
            <span className="assembler-utility-rail__prompt">7</span>
            <textarea
              ref={inputRef}
              className="assembler-utility-rail__input"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              placeholder={pending ? "Seven is thinking…" : "Ask about this document…"}
              disabled={pending}
              rows={3}
            />
            <button
              type="button"
              className="assembler-utility-rail__run"
              disabled={!value.trim() || pending}
              onClick={onSubmit}
            >
              {pending ? "Thinking…" : "Ask"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
