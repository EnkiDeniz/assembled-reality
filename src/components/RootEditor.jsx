import { useEffect, useMemo, useRef, useState } from "react";
import InlineAssist from "@/components/InlineAssist";
import {
  getAssemblyColorTokens,
  suggestApplicableDomains,
  validateRootText,
} from "@/lib/assembly-architecture";

function joinDomainDependency(domains = []) {
  return (Array.isArray(domains) ? domains : []).join("|");
}

export default function RootEditor({
  open = false,
  root = null,
  stateSummary = null,
  confirmationCount = 0,
  entryReason = "voluntary",
  canAutoSuggest = false,
  suggestionContext = null,
  pending = false,
  onClose,
  onSaveRoot,
  onRunSevenAssist,
}) {
  const hasRoot = Boolean(root?.hasRoot || root?.text);
  const autoSuggestAttemptedRef = useRef(false);
  const rootInputRef = useRef(null);
  const glossInputRef = useRef(null);
  const rationaleInputRef = useRef(null);
  const [rootText, setRootText] = useState(() => root?.text || "");
  const [rootGloss, setRootGloss] = useState(() => root?.gloss || "");
  const [selectedDomains, setSelectedDomains] = useState(
    () => root?.applicableDomains || root?.suggestedDomains || [],
  );
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");
  const [assistPending, setAssistPending] = useState(false);
  const [assistResult, setAssistResult] = useState(null);
  const rootApplicableDomains = useMemo(() => root?.applicableDomains || [], [root?.applicableDomains]);
  const rootSuggestedDomains = useMemo(() => root?.suggestedDomains || [], [root?.suggestedDomains]);
  const rootApplicableDomainsKey = joinDomainDependency(root?.applicableDomains);
  const rootSuggestedDomainsKey = joinDomainDependency(root?.suggestedDomains);

  useEffect(() => {
    if (!open) return;
    autoSuggestAttemptedRef.current = false;
    setRootText(root?.text || "");
    setRootGloss(root?.gloss || "");
    setSelectedDomains(rootApplicableDomains.length ? rootApplicableDomains : rootSuggestedDomains);
    setRationale("");
    setError("");
    setAssistResult(null);
  }, [
    open,
    root?.text,
    root?.gloss,
    root?.hasRoot,
    rootApplicableDomains,
    rootApplicableDomainsKey,
    rootSuggestedDomains,
    rootSuggestedDomainsKey,
  ]);

  useEffect(() => {
    if (!open) return;
    const target = hasRoot ? glossInputRef.current : rootInputRef.current;
    target?.focus();
  }, [hasRoot, open]);

  useEffect(() => {
    if (!open) {
      autoSuggestAttemptedRef.current = false;
    }
  }, [open]);

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
  const rootWordCount = useMemo(
    () => rootText.trim().split(/\s+/).filter(Boolean).length,
    [rootText],
  );
  const rootValidationMessage = !hasRoot ? validateRootText(rootText) : "";
  const glossValidationMessage = !rootGloss.trim() ? "Add a gloss so the Root can travel." : "";
  const rationaleValidationMessage =
    removedSuggested.length > 0 && !rationale.trim()
      ? "Explain why the removed domain does not apply."
      : "";

  const assistSuggestions = useMemo(
    () =>
      (assistResult?.candidates || []).map((candidate, index) => ({
        key: `${candidate.rootText || "suggestion"}-${index}`,
        heading: candidate.rootText || "",
        detail: candidate.gloss || "",
        rationale: candidate.rationale || "",
      })),
    [assistResult?.candidates],
  );

  useEffect(() => {
    if (error) {
      setError("");
    }
    setAssistResult(null);
  }, [error, rootText, rootGloss, rationale, selectedDomains]);

  function toggleDomain(domainKey) {
    setSelectedDomains((current) =>
      current.includes(domainKey)
        ? current.filter((entry) => entry !== domainKey)
        : [...current, domainKey],
    );
  }

  async function handleRunSevenAssist(intent = "root-compress") {
    if (!onRunSevenAssist) return;

    setAssistPending(true);
    try {
      const result = await onRunSevenAssist({
        intent,
        rootText,
        rootGloss,
        suggestedDomains,
        applicableDomains: activeDomains,
        suggestionContext,
      });
      setAssistResult(result || null);
    } finally {
      setAssistPending(false);
    }
  }

  function applyAssistCandidate(candidate) {
    if (!candidate) return;
    if (!hasRoot && candidate.rootText) {
      setRootText(candidate.rootText);
    }
    if (candidate.gloss) {
      setRootGloss(candidate.gloss);
    }
    setError("");
    setAssistResult(null);
  }

  async function handleSave() {
    const rootError = validateRootText(rootText);
    if (rootError) {
      setError(rootError);
      return;
    }
    if (!rootGloss.trim()) {
      setError("Add a gloss so the Root can travel.");
      return;
    }
    if (removedSuggested.length > 0 && !rationale.trim()) {
      setError("Explain why the removed domain does not apply.");
      return;
    }

    setError("");
    const saved = await onSaveRoot?.({
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

    if (saved) {
      onClose?.();
    }
  }

  useEffect(() => {
    if (
      !open ||
      hasRoot ||
      !canAutoSuggest ||
      !onRunSevenAssist ||
      assistPending ||
      assistResult?.candidates?.length ||
      rootText.trim() ||
      autoSuggestAttemptedRef.current
    ) {
      return;
    }

    autoSuggestAttemptedRef.current = true;
    setAssistPending(true);
    void onRunSevenAssist({
      intent: "root-suggest",
      rootText,
      rootGloss,
      suggestedDomains,
      applicableDomains: activeDomains,
      suggestionContext,
    })
      .then((result) => {
        setAssistResult(result || null);
      })
      .finally(() => {
        setAssistPending(false);
      });
  }, [
    activeDomains,
    assistPending,
    assistResult?.candidates?.length,
    canAutoSuggest,
    hasRoot,
    onRunSevenAssist,
    open,
    rootGloss,
    rootText,
    suggestionContext,
    suggestedDomains,
  ]);

  const editorTitle = hasRoot
    ? root.text
    : entryReason === "voluntary"
      ? "Name box"
      : "Declare Root";
  const panelTitle = hasRoot
    ? "Keep the Root clean."
    : entryReason === "seed"
      ? "Declare Root to shape the seed."
      : entryReason === "receipt-draft" || entryReason === "receipt-seal"
        ? "Declare Root to seal proof."
        : "Name the box when you're ready.";

  if (!open) return null;

  return (
    <div className="assembler-sheet assembler-sheet--workspace is-open">
      <div className="assembler-sheet__backdrop" onClick={pending ? undefined : onClose} aria-hidden="true" />
      <div className="assembler-sheet__panel assembler-sheet__panel--workspace assembler-sheet__panel--root-editor">
        <div className="assembler-sheet__header">
          <div className="assembler-home__copy">
            <span className="assembler-sheet__eyebrow">{hasRoot ? "Root" : "Box"}</span>
            <span className="assembler-sheet__title">{editorTitle}</span>
          </div>

          <button type="button" className="assembler-sheet__close" onClick={pending ? undefined : onClose}>
            Done
          </button>
        </div>

        <div className="assembler-sheet__content">
          <section className="assembler-root-panel assembler-root-panel--editor">
            <div className="assembler-root-panel__head">
              <div>
                <span className="assembler-root-panel__eyebrow">State</span>
                <h3 className="assembler-root-panel__title">{panelTitle}</h3>
              </div>
              <div className="assembler-root-panel__meta">
                {hasRoot ? (
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
                    {stateSummary?.chipLabel || stateSummary?.label || "Name box"}
                  </span>
                ) : null}
                {confirmationCount > 0 ? (
                  <span
                    className={`assembler-root-panel__queue ${stateSummary?.isLooping ? "is-looping" : ""}`}
                  >
                    ⊘ {confirmationCount}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="assembler-root-panel__form">
              {!hasRoot ? (
                <input
                  ref={rootInputRef}
                  className="assembler-root-panel__input"
                  value={rootText}
                  onChange={(event) => setRootText(event.target.value)}
                  placeholder="Seven words or fewer"
                  maxLength={90}
                  disabled={pending}
                />
              ) : (
                <div className="assembler-root-editor__locked">
                  <span className="assembler-root-editor__locked-label">Declared Root</span>
                  <strong className="assembler-root-editor__locked-text">{root.text}</strong>
                </div>
              )}

              <InlineAssist
                error={rootValidationMessage}
                visible={Boolean(rootValidationMessage)}
                assemblyStep={stateSummary?.colorStep || 0}
                assistPending={assistPending}
                suggestions={assistSuggestions}
                assistSummary={assistResult?.summary || ""}
                onRequestAssist={onRunSevenAssist ? () => handleRunSevenAssist("root-compress") : undefined}
                onApply={applyAssistCandidate}
              />

              <textarea
                ref={glossInputRef}
                className="assembler-root-panel__textarea"
                value={rootGloss}
                onChange={(event) => setRootGloss(event.target.value)}
                placeholder="One sentence expanding the intent."
                rows={4}
                disabled={pending}
              />

              <InlineAssist
                error={glossValidationMessage}
                visible={Boolean(glossValidationMessage && rootText.trim())}
                assemblyStep={stateSummary?.colorStep || 0}
                assistPending={assistPending}
                suggestions={assistSuggestions}
                assistSummary={assistResult?.summary || ""}
                onRequestAssist={onRunSevenAssist ? () => handleRunSevenAssist("root-rewrite") : undefined}
                onApply={applyAssistCandidate}
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
                  ref={rationaleInputRef}
                  className="assembler-root-panel__textarea assembler-root-panel__textarea--rationale"
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  placeholder="Why does this domain not apply?"
                  rows={2}
                  disabled={pending}
                />
              ) : null}

              <InlineAssist
                error={rationaleValidationMessage}
                visible={Boolean(rationaleValidationMessage)}
                assemblyStep={stateSummary?.colorStep || 0}
              />
            </div>
          </section>
        </div>

        <div className="assembler-sheet__footer">
          <button
            type="button"
            className="assembler-sheet__primary"
            onClick={() => void handleSave()}
            disabled={pending}
          >
            {pending ? "Saving…" : hasRoot ? "Save gloss" : "Declare Root"}
          </button>
        </div>
      </div>
    </div>
  );
}
