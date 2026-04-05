import { useMemo, useState } from "react";
import { cleanDisplayTitle } from "@/lib/document-blocks";
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
  focus = null,
  onClose,
  onResolve,
}) {
  const [index, setIndex] = useState(0);
  const [primaryTag, setPrimaryTag] = useState("");
  const [domain, setDomain] = useState("");

  const filteredQueue = useMemo(() => {
    const items = Array.isArray(queue) ? queue : [];
    if (!focus?.documentKey && !focus?.itemId) {
      return items;
    }

    return items.filter((item) => {
      if (focus?.itemId && item?.id === focus.itemId) return true;
      if (focus?.documentKey && item?.documentKey === focus.documentKey) return true;
      return false;
    });
  }, [focus, queue]);

  const currentItem = filteredQueue[index] || null;
  const preferredDomains = root?.applicableDomains?.length
    ? root.applicableDomains
    : root?.suggestedDomains || [];
  const domainOptions = (preferredDomains.length ? preferredDomains : ASSEMBLY_DOMAINS.map((entry) => entry.key))
    .map((domainKey) => ({
      key: domainKey,
      label: ASSEMBLY_DOMAINS.find((entry) => entry.key === domainKey)?.label || domainKey,
    }));

  if (!open) return null;

  const remaining = filteredQueue.length - index;
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
    if (index >= filteredQueue.length - 1) {
      handleClose();
      return;
    }
    setIndex((value) => Math.min(value + 1, Math.max(0, filteredQueue.length - 1)));
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
              {currentItem ? `${index + 1} of ${filteredQueue.length}` : "Queue"}
            </span>
          </div>

          <button type="button" className="assembler-sheet__close" onClick={pending ? undefined : handleClose}>
            Done
          </button>
        </div>

        {currentItem ? (
          <div className="assembler-confirmation">
            <div className="assembler-confirmation__meta">
              <span>{focus?.label || cleanDisplayTitle(currentItem.sourceTitle) || currentItem.documentKey}</span>
              <span>{remaining} left</span>
            </div>

            <div
              className={`assembler-confirmation__card ${
                currentItem?.relevance === "noise" ? "is-noise" : ""
              }`}
            >
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
              <div className="assembler-confirmation__relevance-row">
                <span
                  className={`assembler-confirmation__relevance ${
                    currentItem?.relevance === "noise" ? "is-noise" : "is-relevant"
                  }`}
                >
                  {currentItem?.relevanceLabel || "Relevant"}
                </span>
                <p className="assembler-confirmation__relevance-reason">
                  {currentItem?.relevanceReason || "Keep what helps the Root and release what does not."}
                </p>
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

              <div className="assembler-confirmation__domains" role="radiogroup" aria-label="Confirmation domain">
                {domainOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    role="radio"
                    aria-checked={resolvedDomain === option.key}
                    className={`assembler-confirmation__domain ${
                      resolvedDomain === option.key ? "is-active" : ""
                    }`}
                    onClick={() => setDomain(option.key)}
                    disabled={pending}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
                {currentItem?.relevance === "noise" ? "Not mine" : "Discard"}
              </button>
            </div>
          </div>
        ) : (
          <div className="assembler-confirmation assembler-confirmation--empty">
            <p>
              {focus?.documentKey
                ? "Nothing in this evidence slice is waiting for confirmation right now."
                : "Nothing is waiting for confirmation right now."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
