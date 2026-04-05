import { useMemo, useState } from "react";
import {
  getAssemblyColorTokens,
  suggestApplicableDomains,
  validateRootText,
} from "@/lib/assembly-architecture";

export default function RootSummaryPanel({
  root = null,
  stateSummary = null,
  confirmationCount = 0,
  pending = false,
  compact = false,
  onSaveRoot,
  onOpenConfirmation,
}) {
  const hasRoot = Boolean(root?.hasRoot || root?.text);
  const [rootText, setRootText] = useState(() => root?.text || "");
  const [rootGloss, setRootGloss] = useState(() => root?.gloss || "");
  const [editing, setEditing] = useState(() => !hasRoot);
  const [selectedDomains, setSelectedDomains] = useState(
    () => root?.applicableDomains || root?.suggestedDomains || [],
  );
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");

  const suggestedDomains = useMemo(
    () =>
      rootText.trim() || rootGloss.trim()
        ? suggestApplicableDomains(rootText, rootGloss)
        : root?.suggestedDomains || [],
    [root?.suggestedDomains, rootGloss, rootText],
  );
  const activeDomains = selectedDomains.length ? selectedDomains : suggestedDomains;
  const removedSuggested = suggestedDomains.filter((domain) => !activeDomains.includes(domain));
  const stateTone = stateSummary?.colorTokens || getAssemblyColorTokens(stateSummary?.colorStep);

  function toggleDomain(domainKey) {
    setSelectedDomains((current) =>
      current.includes(domainKey)
        ? current.filter((entry) => entry !== domainKey)
        : [...current, domainKey],
    );
  }

  async function handleSave() {
    const rootError = validateRootText(rootText);
    if (rootError) {
      setError(rootError);
      return;
    }
    if (!rootGloss.trim()) {
      setError("Add a gloss so the root can breathe.");
      return;
    }
    if (removedSuggested.length > 0 && !rationale.trim()) {
      setError("Explain why you are removing one of Seven's suggested domains.");
      return;
    }

    setError("");
    await onSaveRoot?.({
      rootText: rootText.trim(),
      rootGloss: rootGloss.trim(),
      applicableDomains: activeDomains,
      domainRationales:
        removedSuggested.length > 0
          ? removedSuggested.reduce((accumulator, domainKey) => {
              accumulator[domainKey] = rationale.trim();
              return accumulator;
            }, {})
          : {},
    });
    if (hasRoot) {
      setEditing(false);
    }
  }

  return (
    <section
      className={`assembler-root-panel ${compact ? "is-compact" : ""} ${editing ? "is-editing" : ""}`}
    >
      <div className="assembler-root-panel__head">
        <div>
          <span className="assembler-root-panel__eyebrow">Root</span>
          <h3 className="assembler-root-panel__title">
            {hasRoot ? root.text : "Declare the root"}
          </h3>
        </div>
        <div className="assembler-root-panel__meta">
          <span
            className="assembler-assembly-chip"
            style={{
              "--assembly-tone": stateTone.fill,
              "--assembly-tone-soft": stateTone.soft,
              "--assembly-tone-border": stateTone.border,
              "--assembly-tone-glow": stateTone.glow,
              "--assembly-tone-text": stateTone.text,
            }}
          >
            {stateSummary?.label || "Declare Root"}
          </span>
          {confirmationCount > 0 ? (
            <button
              type="button"
              className="assembler-root-panel__queue"
              onClick={onOpenConfirmation}
            >
              ⊘ {confirmationCount}
            </button>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="assembler-root-panel__form">
          {!hasRoot ? (
            <input
              className="assembler-root-panel__input"
              value={rootText}
              onChange={(event) => setRootText(event.target.value)}
              placeholder="Seven words or fewer"
              maxLength={90}
              disabled={pending}
            />
          ) : null}
          <textarea
            className="assembler-root-panel__textarea"
            value={rootGloss}
            onChange={(event) => setRootGloss(event.target.value)}
            placeholder="One sentence expanding the intent."
            rows={compact ? 3 : 4}
            disabled={pending}
          />
          <div className="assembler-root-panel__domains">
            {(suggestedDomains.length ? suggestedDomains : root?.applicableDomains || []).map((domainKey) => (
              <button
                key={domainKey}
                type="button"
                className={`assembler-root-panel__domain ${
                  activeDomains.includes(domainKey) ? "is-active" : ""
                }`}
                onClick={() => toggleDomain(domainKey)}
                disabled={pending}
              >
                {domainKey}
              </button>
            ))}
          </div>
          {removedSuggested.length > 0 ? (
            <textarea
              className="assembler-root-panel__textarea assembler-root-panel__textarea--rationale"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              placeholder="Why is this suggested domain not applicable?"
              rows={2}
              disabled={pending}
            />
          ) : null}
          <div className="assembler-root-panel__actions">
            <button
              type="button"
              className="terminal-button is-primary"
              onClick={() => void handleSave()}
              disabled={pending}
            >
              {pending ? "Saving…" : hasRoot ? "Save gloss" : "Declare Root"}
            </button>
            {hasRoot ? (
              <button
                type="button"
                className="terminal-button"
                onClick={() => {
                  setEditing(false);
                  setRootGloss(root?.gloss || "");
                  setSelectedDomains(root?.applicableDomains || root?.suggestedDomains || []);
                }}
                disabled={pending}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="assembler-root-panel__body assembler-root-panel__body--summary">
          <p className="assembler-root-panel__gloss">{root?.gloss || "No gloss yet."}</p>
          <div className="assembler-root-panel__status-line">
            <span className="assembler-root-panel__status-label">Next</span>
            <p className="assembler-root-panel__requirement">
              {stateSummary?.nextRequirement || "The root is the fixed origin for this box."}
            </p>
          </div>
          <div className="assembler-root-panel__domains">
            {(root?.applicableDomainLabels || root?.applicableDomains || []).map((domainLabel) => (
              <span key={domainLabel} className="assembler-root-panel__domain is-active">
                {domainLabel}
              </span>
            ))}
          </div>
          <div className="assembler-root-panel__actions">
            <button
              type="button"
              className="terminal-button"
              onClick={() => setEditing(true)}
            >
              Edit gloss
            </button>
          </div>
        </div>
      )}

      {error ? <p className="assembler-root-panel__error">{error}</p> : null}
    </section>
  );
}
