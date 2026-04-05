import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAssemblyColorTokens,
  suggestApplicableDomains,
  validateRootText,
} from "@/lib/assembly-architecture";
import { buildRealityInstrumentIssue } from "@/lib/reality-instrument";

function joinDomainDependency(domains = []) {
  return (Array.isArray(domains) ? domains : []).join("|");
}

export default function RootEditor({
  open = false,
  root = null,
  stateSummary = null,
  confirmationCount = 0,
  pending = false,
  onClose,
  onSaveRoot,
  onInstrumentChange,
  onRunSevenAssist,
}) {
  const hasRoot = Boolean(root?.hasRoot || root?.text);
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

  const rootInstrumentIssue = useMemo(() => {
    if (!open) return null;

    if (rootValidationMessage) {
      return buildRealityInstrumentIssue({
        key: "root-word-count",
        surfaceKey: "root",
        severity: "constraint",
        priority: 85,
        label: "Root constraint",
        headline: "The Root is outside the declared frame.",
        summary: "A Root stays within seven words so the line stays portable and testable.",
        compactSummary: `${rootWordCount} words · Root must stay within seven`,
        evidence: [
          { label: "Words", value: String(rootWordCount) },
          { label: "Limit", value: "7 words" },
        ],
        moveSpace: [
          {
            key: "root-compress",
            label: assistPending ? "Compressing…" : "Compress with Seven",
            disabled: !onRunSevenAssist || assistPending || pending || !rootText.trim(),
          },
          { key: "focus-root", label: "Keep editing" },
          {
            key: "root-rewrite",
            label: "Use operator form",
            disabled: !onRunSevenAssist || assistPending || pending || !rootText.trim(),
          },
        ],
        sevenAssist: {
          intent: "root-compress",
          context: {
            rootText,
            rootGloss,
            suggestedDomains,
            applicableDomains: activeDomains,
          },
        },
      });
    }

    if (glossValidationMessage) {
      return buildRealityInstrumentIssue({
        key: "root-gloss-missing",
        surfaceKey: "root",
        severity: "constraint",
        priority: 70,
        label: "Gloss",
        headline: "The Root needs one line of intent.",
        summary: "The gloss expands the Root just enough to keep the line readable without changing it.",
        compactSummary: "Add one line of gloss",
        evidence: [{ label: "Gloss", value: "Missing" }],
        moveSpace: [
          { key: "focus-gloss", label: "Write gloss" },
          {
            key: "root-rewrite",
            label: "Ask Seven",
            disabled: !onRunSevenAssist || assistPending || pending || !rootText.trim(),
          },
        ],
      });
    }

    if (rationaleValidationMessage) {
      return buildRealityInstrumentIssue({
        key: "root-domain-rationale",
        surfaceKey: "root",
        severity: "warning",
        priority: 75,
        label: "Domain rationale",
        headline: "Removing a suggested domain needs a reason.",
        summary: "A removed domain needs one sentence so the boundary stays auditable.",
        compactSummary: `${removedSuggested.length} domain${removedSuggested.length === 1 ? "" : "s"} need rationale`,
        evidence: removedSuggested.map((domainKey) => ({
          label: "Removed",
          value: domainKey,
        })),
        moveSpace: [
          { key: "focus-rationale", label: "Explain why" },
          { key: "restore-domains", label: "Restore domains" },
        ],
      });
    }

    if (error) {
      return buildRealityInstrumentIssue({
        key: "root-save",
        surfaceKey: "root",
        severity: "blocked",
        priority: 90,
        label: "Root save",
        headline: "The Root could not be saved.",
        summary: error,
        compactSummary: error,
        moveSpace: [{ key: "focus-root", label: "Review Root" }],
      });
    }

    return null;
  }, [
    activeDomains,
    assistPending,
    error,
    glossValidationMessage,
    onRunSevenAssist,
    open,
    pending,
    rationaleValidationMessage,
    removedSuggested,
    rootGloss,
    rootText,
    rootValidationMessage,
    rootWordCount,
    suggestedDomains,
  ]);

  useEffect(() => {
    onInstrumentChange?.(rootInstrumentIssue);
  }, [onInstrumentChange, rootInstrumentIssue]);

  useEffect(
    () => () => {
      onInstrumentChange?.(null);
    },
    [onInstrumentChange],
  );

  useEffect(() => {
    if (!open) {
      onInstrumentChange?.(null);
    }
  }, [onInstrumentChange, open]);

  useEffect(() => {
    if (error) {
      setError("");
    }
    setAssistResult(null);
  }, [error, rootText, rootGloss, rationale, selectedDomains]);

  if (!open) return null;

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

  function handleInlineMove(moveKey) {
    if (moveKey === "focus-root") {
      rootInputRef.current?.focus();
      return;
    }
    if (moveKey === "focus-gloss") {
      glossInputRef.current?.focus();
      return;
    }
    if (moveKey === "focus-rationale") {
      rationaleInputRef.current?.focus();
      return;
    }
    if (moveKey === "restore-domains") {
      setSelectedDomains((current) => [...new Set([...current, ...removedSuggested])]);
      return;
    }
    if (moveKey === "root-compress") {
      void handleRunSevenAssist("root-compress");
      return;
    }
    if (moveKey === "root-rewrite") {
      void handleRunSevenAssist("root-rewrite");
    }
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

  const inlineTone = error
    ? "blocked"
    : rationaleValidationMessage
      ? "warning"
      : rootValidationMessage || glossValidationMessage
        ? "constraint"
        : "clear";
  const inlineLabel = error
    ? "Blocked"
    : rationaleValidationMessage
      ? "Rationale"
      : rootValidationMessage
        ? "Constraint"
        : glossValidationMessage
          ? "Gloss"
          : "Next";
  const inlineMessage =
    error ||
    rationaleValidationMessage ||
    rootValidationMessage ||
    glossValidationMessage ||
    stateSummary?.nextRequirement ||
    "The Root holds the line.";
  const showAssistButtons = Boolean(rootText.trim()) && Boolean(onRunSevenAssist);

  return (
    <div className="assembler-sheet assembler-sheet--workspace is-open">
      <div className="assembler-sheet__backdrop" onClick={pending ? undefined : onClose} aria-hidden="true" />
      <div className="assembler-sheet__panel assembler-sheet__panel--workspace assembler-sheet__panel--root-editor">
        <div className="assembler-sheet__header">
          <div className="assembler-home__copy">
            <span className="assembler-sheet__eyebrow">Root</span>
            <span className="assembler-sheet__title">{hasRoot ? root.text : "Declare Root"}</span>
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
                <h3 className="assembler-root-panel__title">
                  {hasRoot ? "Keep the Root clean." : "Declare the line."}
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
                  {stateSummary?.chipLabel || stateSummary?.label || "Declare Root"}
                </span>
                {confirmationCount > 0 ? (
                  <span
                    className={`assembler-root-panel__queue ${stateSummary?.isLooping ? "is-looping" : ""}`}
                  >
                    ⊘ {confirmationCount}
                  </span>
                ) : null}
              </div>
            </div>

            <div className={`assembler-root-editor__status is-${inlineTone}`}>
              <div className="assembler-root-editor__status-head">
                <span className="assembler-root-editor__status-label">{inlineLabel}</span>
                {!hasRoot ? (
                  <span className="assembler-root-editor__word-count">
                    {rootWordCount} / 7 words
                  </span>
                ) : null}
              </div>
              <p className="assembler-root-editor__status-text">{inlineMessage}</p>
              {showAssistButtons ? (
                <div className="assembler-root-editor__status-actions">
                  <button
                    type="button"
                    className="terminal-button"
                    onClick={() => handleInlineMove("root-compress")}
                    disabled={assistPending || pending}
                  >
                    {assistPending ? "Compressing…" : "Compress with Seven"}
                  </button>
                  <button
                    type="button"
                    className="terminal-button"
                    onClick={() => handleInlineMove("root-rewrite")}
                    disabled={assistPending || pending}
                  >
                    Use operator form
                  </button>
                </div>
              ) : null}
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

              <textarea
                ref={glossInputRef}
                className="assembler-root-panel__textarea"
                value={rootGloss}
                onChange={(event) => setRootGloss(event.target.value)}
                placeholder="One sentence expanding the intent."
                rows={4}
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
                  ref={rationaleInputRef}
                  className="assembler-root-panel__textarea assembler-root-panel__textarea--rationale"
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  placeholder="Why does this domain not apply?"
                  rows={2}
                  disabled={pending}
                />
              ) : null}
            </div>

            {assistResult?.candidates?.length ? (
              <div className="assembler-root-panel__assist">
                <div className="assembler-root-panel__assist-head">
                  <span className="assembler-root-panel__assist-label">Seven suggestions</span>
                  {assistResult?.summary ? (
                    <p className="assembler-root-panel__assist-summary">{assistResult.summary}</p>
                  ) : null}
                </div>
                <div className="assembler-root-panel__assist-list">
                  {assistResult.candidates.map((candidate, index) => (
                    <button
                      key={`${candidate.rootText}-${index}`}
                      type="button"
                      className="assembler-root-panel__assist-card"
                      onClick={() => applyAssistCandidate(candidate)}
                      disabled={pending || assistPending}
                    >
                      <strong>{candidate.rootText}</strong>
                      {candidate.gloss ? <span>{candidate.gloss}</span> : null}
                      {candidate.rationale ? <em>{candidate.rationale}</em> : null}
                      <span className="assembler-root-panel__assist-apply">Use this</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
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
