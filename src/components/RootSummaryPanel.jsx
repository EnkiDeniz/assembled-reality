import { useEffect, useMemo, useRef, useState } from "react";
import RealityInstrument from "@/components/RealityInstrument";
import {
  getAssemblyColorTokens,
  suggestApplicableDomains,
  validateRootText,
} from "@/lib/assembly-architecture";
import { buildRealityInstrumentIssue, buildRealityInstrumentViewModel } from "@/lib/reality-instrument";

export default function RootSummaryPanel({
  root = null,
  stateSummary = null,
  confirmationCount = 0,
  pending = false,
  compact = false,
  onSaveRoot,
  onOpenConfirmation,
  onInstrumentChange,
  onRunSevenAssist,
}) {
  const hasRoot = Boolean(root?.hasRoot || root?.text);
  const rootInputRef = useRef(null);
  const glossInputRef = useRef(null);
  const rationaleInputRef = useRef(null);
  const [rootText, setRootText] = useState(() => root?.text || "");
  const [rootGloss, setRootGloss] = useState(() => root?.gloss || "");
  const [editing, setEditing] = useState(() => !hasRoot);
  const [selectedDomains, setSelectedDomains] = useState(
    () => root?.applicableDomains || root?.suggestedDomains || [],
  );
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");
  const [assistPending, setAssistPending] = useState(false);
  const [assistResult, setAssistResult] = useState(null);

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
  const glossValidationMessage = !rootGloss.trim() ? "Add a gloss so the root can breathe." : "";
  const rationaleValidationMessage =
    removedSuggested.length > 0 && !rationale.trim()
      ? "Explain why you are removing one of Seven's suggested domains."
      : "";

  const rootInstrumentIssue = useMemo(() => {
    if (!editing) return null;

    if (rootValidationMessage) {
      return buildRealityInstrumentIssue({
        key: "root-word-count",
        surfaceKey: "root",
        severity: "constraint",
        priority: 85,
        label: "Root constraint",
        headline: "The Root is outside the declared frame.",
        summary: "A Root stays within seven words so the line can remain portable, testable, and easy to carry.",
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
        headline: "The Root needs one line of breathable intent.",
        summary: "The gloss expands the Root just enough to keep the declared line interpretable without changing it.",
        compactSummary: "Add one line of gloss",
        evidence: [{ label: "Gloss", value: "Missing" }],
        moveSpace: [
          { key: "focus-gloss", label: "Write gloss" },
          {
            key: "root-rewrite",
            label: "Ask Seven to help",
            disabled: !onRunSevenAssist || assistPending || pending || !rootText.trim(),
          },
        ],
        sevenAssist: {
          intent: "root-rewrite",
          context: {
            rootText,
            rootGloss,
            suggestedDomains,
            applicableDomains: activeDomains,
          },
        },
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
        summary: "If a suggested domain does not apply, say why so the box keeps an auditable boundary.",
        compactSummary: `${removedSuggested.length} suggested domain${removedSuggested.length === 1 ? "" : "s"} need rationale`,
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
        headline: "The Root could not be declared yet.",
        summary: error,
        compactSummary: error,
        moveSpace: [{ key: "focus-root", label: "Review Root" }],
      });
    }

    return null;
  }, [
    activeDomains,
    assistPending,
    editing,
    error,
    glossValidationMessage,
    onRunSevenAssist,
    pending,
    rationaleValidationMessage,
    removedSuggested,
    rootGloss,
    rootText,
    rootValidationMessage,
    rootWordCount,
    suggestedDomains,
  ]);

  const rootInstrumentViewModel = useMemo(
    () =>
      rootInstrumentIssue
        ? buildRealityInstrumentViewModel({
            surfaceKey: "root",
            boxTitle: root?.text || "Declare the Root",
            stateSummary,
            issues: [rootInstrumentIssue],
          })
        : null,
    [root?.text, rootInstrumentIssue, stateSummary],
  );

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

  function handleRootInstrumentMove(move) {
    if (!move) return;

    if (move.key === "focus-root") {
      rootInputRef.current?.focus();
      return;
    }
    if (move.key === "focus-gloss") {
      glossInputRef.current?.focus();
      return;
    }
    if (move.key === "focus-rationale") {
      rationaleInputRef.current?.focus();
      return;
    }
    if (move.key === "restore-domains") {
      setSelectedDomains((current) => [...new Set([...current, ...removedSuggested])]);
      return;
    }
    if (move.key === "root-compress") {
      void handleRunSevenAssist("root-compress");
      return;
    }
    if (move.key === "root-rewrite") {
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
            {stateSummary?.chipLabel || stateSummary?.label || "Declare Root"}
          </span>
          {confirmationCount > 0 ? (
            <button
              type="button"
              className={`assembler-root-panel__queue ${stateSummary?.isLooping ? "is-looping" : ""}`}
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
              ref={rootInputRef}
              className="assembler-root-panel__input"
              value={rootText}
              onChange={(event) => setRootText(event.target.value)}
              placeholder="Seven words or fewer"
              maxLength={90}
              disabled={pending}
            />
          ) : null}
          <textarea
            ref={glossInputRef}
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
              ref={rationaleInputRef}
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

      {rootInstrumentViewModel ? (
        <RealityInstrument
          viewModel={rootInstrumentViewModel}
          variant="inline"
          onMove={handleRootInstrumentMove}
        >
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
        </RealityInstrument>
      ) : null}
    </section>
  );
}
