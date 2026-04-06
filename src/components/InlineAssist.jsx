import { useState } from "react";

export default function InlineAssist({
  error = "",
  visible = false,
  assemblyStep = 0,
  assistPending = false,
  suggestions = [],
  assistSummary = "",
  onRequestAssist,
  onApply,
  onDismiss,
}) {
  const [panelOpenKey, setPanelOpenKey] = useState("");

  if (!visible || !error) return null;

  const assistAvailable = Boolean(onRequestAssist);
  const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;
  const stepToken = `var(--assembly-step-${assemblyStep}-text)`;
  const panelKey = `${assemblyStep}:${error}`;
  const panelOpen = panelOpenKey === panelKey;

  function handleOpen() {
    if (assistPending) return;
    setPanelOpenKey(panelKey);
    onRequestAssist?.();
  }

  function handleApply(suggestion) {
    onApply?.(suggestion);
    setPanelOpenKey("");
  }

  function handleClose() {
    setPanelOpenKey("");
    onDismiss?.();
  }

  return (
    <div className="assembler-inline-assist">
      <div className="assembler-inline-assist__whisper">
        <span className="assembler-inline-assist__error">{error}</span>
        {assistAvailable ? (
          <button
            type="button"
            className="assembler-inline-assist__trigger"
            onClick={handleOpen}
            disabled={assistPending}
            aria-label="Open Seven assist"
            style={{ "--assist-tone": stepToken }}
          >
            {assistPending ? "…" : "+7"}
          </button>
        ) : null}
      </div>

      {panelOpen ? (
        <div
          className="assembler-inline-assist__panel"
          style={{
            "--assist-panel-soft": `var(--assembly-step-${assemblyStep}-soft)`,
            "--assist-panel-border": `var(--assembly-step-${assemblyStep}-border)`,
          }}
        >
          {assistSummary ? (
            <p className="assembler-inline-assist__summary">{assistSummary}</p>
          ) : null}

          {hasSuggestions ? (
            <div className="assembler-inline-assist__suggestions">
              {suggestions.map((suggestion) => (
                <div key={suggestion.key} className="assembler-inline-assist__card">
                  <strong className="assembler-inline-assist__heading">
                    {suggestion.heading}
                  </strong>
                  {suggestion.detail ? (
                    <span className="assembler-inline-assist__detail">
                      {suggestion.detail}
                    </span>
                  ) : null}
                  {suggestion.rationale ? (
                    <em className="assembler-inline-assist__rationale">
                      {suggestion.rationale}
                    </em>
                  ) : null}
                  <button
                    type="button"
                    className="assembler-inline-assist__apply"
                    onClick={() => handleApply(suggestion)}
                    style={{ color: stepToken }}
                  >
                    Use this
                  </button>
                </div>
              ))}
            </div>
          ) : assistPending ? (
            <p className="assembler-inline-assist__summary">Seven is reading…</p>
          ) : null}

          <button
            type="button"
            className="assembler-inline-assist__close"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
