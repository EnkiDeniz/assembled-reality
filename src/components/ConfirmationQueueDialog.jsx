import { useState } from "react";
import {
  ASSEMBLY_DOMAINS,
  getAssemblyColorTokens,
  getSevenStageColorStep,
  getSevenStageLabel,
} from "@/lib/assembly-architecture";

export default function ConfirmationQueueDialog({
  open = false,
  queue = [],
  root = null,
  pending = false,
  onClose,
  onResolve,
}) {
  const [index, setIndex] = useState(0);
  const [primaryTag, setPrimaryTag] = useState("");
  const [domain, setDomain] = useState("");

  const currentItem = queue[index] || null;
  const preferredDomains = root?.applicableDomains?.length
    ? root.applicableDomains
    : root?.suggestedDomains || [];
  const orderedDomains = [
    ...preferredDomains,
    ...ASSEMBLY_DOMAINS.map((entry) => entry.key).filter((key) => !preferredDomains.includes(key)),
  ];
  const domainOptions = orderedDomains.map((domainKey) => ({
    key: domainKey,
    label: ASSEMBLY_DOMAINS.find((entry) => entry.key === domainKey)?.label || domainKey,
  }));

  if (!open) return null;

  const remaining = queue.length - index;
  const stageTone =
    currentItem?.confirmationColorTokens ||
    getAssemblyColorTokens(getSevenStageColorStep(currentItem?.sevenStage));
  const stageLabel =
    currentItem?.confirmationColorLabel || getSevenStageLabel(currentItem?.sevenStage) || "Unconfirmed";
  const resolvedPrimaryTag = primaryTag || currentItem?.suggestedPrimaryTag || "story";
  const resolvedDomain = domainOptions.some((option) => option.key === domain)
    ? domain
    : currentItem?.suggestedDomain || domainOptions[0]?.key || "vision";

  function handleClose() {
    setIndex(0);
    setPrimaryTag("");
    setDomain("");
    onClose?.();
  }

  function advanceQueue() {
    if (index >= queue.length - 1) {
      handleClose();
      return;
    }
    setIndex((value) => Math.min(value + 1, Math.max(0, queue.length - 1)));
    setPrimaryTag("");
    setDomain("");
  }

  async function handleConfirm() {
    if (!currentItem) return;
    await onResolve?.({
      item: currentItem,
      action: "confirm",
      primaryTag: resolvedPrimaryTag,
      domain: resolvedDomain,
    });
    advanceQueue();
  }

  async function handleDiscard() {
    if (!currentItem) return;
    await onResolve?.({
      item: currentItem,
        action: "discard",
      });
    advanceQueue();
  }

  function handleSkip() {
    advanceQueue();
  }

  return (
    <div className="assembler-sheet assembler-sheet--workspace is-open">
      <div className="assembler-sheet__backdrop" onClick={pending ? undefined : handleClose} aria-hidden="true" />
      <div className="assembler-sheet__panel assembler-sheet__panel--workspace assembler-sheet__panel--confirmation">
        <div className="assembler-sheet__header">
          <div className="assembler-home__copy">
            <span className="assembler-sheet__eyebrow">Confirmation</span>
            <span className="assembler-sheet__title">
              {currentItem ? `${index + 1} of ${queue.length}` : "Queue"}
            </span>
          </div>

          <button type="button" className="assembler-sheet__close" onClick={pending ? undefined : handleClose}>
            Done
          </button>
        </div>

        {currentItem ? (
          <div className="assembler-confirmation">
            <div className="assembler-confirmation__meta">
              <span>{currentItem.sourceTitle || currentItem.documentKey}</span>
              <span>{remaining} left</span>
            </div>

            <div className="assembler-confirmation__card">
              <p className="assembler-confirmation__text">{currentItem.plainText || currentItem.text}</p>
              <div className="assembler-confirmation__suggestion-row">
                <div className="assembler-confirmation__suggestion">
                  Seven suggests {currentItem.suggestedPrimaryTagLabel} in {currentItem.suggestedDomainLabel}.
                </div>
                <span
                  className="assembler-assembly-chip assembler-confirmation__stage-pill"
                  style={{
                    "--assembly-tone": stageTone.fill,
                    "--assembly-tone-soft": stageTone.soft,
                    "--assembly-tone-border": stageTone.border,
                    "--assembly-tone-glow": stageTone.glow,
                    "--assembly-tone-text": stageTone.text,
                  }}
                >
                  {currentItem?.confirmationColorUnknown ? "⊘ Unstaged" : `${currentItem.sevenStage} · ${stageLabel}`}
                </span>
              </div>
            </div>

            <div className="assembler-confirmation__controls">
              <div className="assembler-confirmation__tags">
                {[
                  { key: "aim", label: "△ Aim" },
                  { key: "evidence", label: "◻ Evidence" },
                  { key: "story", label: "○ Story" },
                ].map((tag) => (
                  <button
                    key={tag.key}
                    type="button"
                    className={`assembler-confirmation__tag ${resolvedPrimaryTag === tag.key ? "is-active" : ""}`}
                    onClick={() => setPrimaryTag(tag.key)}
                    disabled={pending}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              <select
                className="assembler-confirmation__select"
                value={resolvedDomain}
                onChange={(event) => setDomain(event.target.value)}
                disabled={pending}
              >
                {domainOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="assembler-confirmation__actions">
              <button
                type="button"
                className="terminal-button is-primary"
                onClick={() => void handleConfirm()}
                disabled={pending}
              >
                {pending ? "Saving…" : "Confirm"}
              </button>
              <button type="button" className="terminal-button" onClick={handleSkip} disabled={pending}>
                Skip
              </button>
              <button type="button" className="terminal-button" onClick={() => void handleDiscard()} disabled={pending}>
                Discard
              </button>
            </div>
          </div>
        ) : (
          <div className="assembler-confirmation assembler-confirmation--empty">
            <p>Nothing is waiting for confirmation right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
