"use client";

import { useMemo, useState } from "react";
import { ShapeGlyph } from "@/components/LoegosSystem";
import {
  ASSEMBLY_PRIMARY_TAGS,
} from "@/lib/assembly-architecture";
import { buildLoegosBlockView } from "@/lib/founder-renderer";

const RECAST_OPTIONS = [
  { label: "Aim", value: ASSEMBLY_PRIMARY_TAGS.aim },
  { label: "Reality", value: ASSEMBLY_PRIMARY_TAGS.evidence },
  { label: "Weld", value: ASSEMBLY_PRIMARY_TAGS.story },
];

function buildCompressionDraft(block = null) {
  return String(block?.plainText || block?.text || "")
    .replace(/^#{1,6}\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSplitPreviewCount(block = null) {
  const text = String(block?.plainText || block?.text || "")
    .replace(/\n+/g, " ")
    .trim();

  if (!text) return 0;

  return text
    .split(/(?<=[.!?])\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean).length;
}

function getSaveStateLabel(saveState = "") {
  if (saveState === "saving") return "Saving…";
  if (saveState === "saved") return "Saved";
  if (saveState === "conflict") return "Reload latest before saving again";
  if (saveState === "error") return "Not saved";
  return "";
}

function renderBlockContent(block = null, blockView = null, learnerMode = false) {
  if (!block) return null;

  const text = String(block?.text || "").replace(/^#{1,6}\s+/, "");
  const shapePrefix = learnerMode ? (
    <span className="loegos-block__shape-label">{blockView?.shapeFallbackLabel || "Aim·"}</span>
  ) : null;

  if (block?.kind === "heading") {
    return (
      <h2 className="loegos-block__heading">
        {shapePrefix ? shapePrefix : null}
        <span>{text}</span>
      </h2>
    );
  }

  if (block?.kind === "list") {
    const showInlinePrefix = Boolean(shapePrefix);
    return (
      <div className="loegos-block__list">
        {String(block?.text || "")
          .split("\n")
          .map((line) => line.replace(/^[-+*]\s+/, "").trim())
          .filter(Boolean)
          .map((line, index) => (
            <div
              key={`${block?.id || "block"}-line-${index}`}
              className={`loegos-block__list-line ${showInlinePrefix ? "" : "is-plain"}`}
            >
              {showInlinePrefix ? (
                index === 0 ? (
                  shapePrefix
                ) : (
                  <span className="loegos-block__shape-spacer" aria-hidden="true" />
                )
              ) : null}
              <span>{line}</span>
            </div>
          ))}
      </div>
    );
  }

  return (
    <p className="loegos-block__text">
      {shapePrefix ? shapePrefix : null}
      <span>{text}</span>
    </p>
  );
}

function LoegosBlock({
  artifactKind = "Source",
  block = null,
  findingMap = null,
  selected = false,
  playing = false,
  next = false,
  learnerMode = false,
  staged = false,
  editable = false,
  actionPending = false,
  saveState = "",
  canMerge = false,
  onStageBlock,
  onUnstageBlock,
  onRewriteBlock,
  onKeepDraftBlock,
  onAcceptBlockInference,
  onRecastBlockTag,
  onOpenSourceWitness,
  onSplitBlock,
  onMergeBlock,
  onSelect,
}) {
  const [editing, setEditing] = useState(false);
  const [recastOpen, setRecastOpen] = useState(false);
  const [draftText, setDraftText] = useState(block?.text || "");
  const finding = findingMap?.get?.(block?.id) || null;
  const blockView = useMemo(
    () => buildLoegosBlockView(block, finding, { artifactKind, isStaged: staged }),
    [artifactKind, block, finding, staged],
  );
  const splitPreviewCount = useMemo(() => buildSplitPreviewCount(block), [block]);
  const canSplit = splitPreviewCount > 1;
  const controlsDisabled = actionPending || saveState === "saving";
  const canMutate = Boolean(editable && block?.isEditable);
  const saveStateLabel = getSaveStateLabel(saveState);
  const currentPrimaryTag = String(block?.primaryTag || "").trim().toLowerCase();

  if (!block) return null;

  return (
    <article
      className={`loegos-block loegos-block--${blockView.signalKey} ${selected ? "is-selected" : ""} ${
        playing ? "is-playing" : ""
      } ${next ? "is-next" : ""} ${editing ? "is-editing" : ""}`}
      data-testid="founder-block"
    >
      <button
        type="button"
        className="loegos-block__hitbox"
        onClick={() => onSelect?.(block?.id)}
        aria-pressed={selected}
        aria-label={`${blockView.shapeLabel}. ${blockView.signalLabel}. ${blockView.stageLabel}. Line ${String(
          (block?.sourcePosition || 0) + 1,
        )}.`}
        title={`${blockView.shapeLabel} · ${blockView.signalLabel}`}
      >
        <span className="loegos-block__line">
          {String((block?.sourcePosition || 0) + 1).padStart(3, "0")}
        </span>
        <span className="loegos-block__type" aria-hidden="true">
          <ShapeGlyph
            shapeKey={blockView?.shapeKey || "aim"}
            size={16}
            className="loegos-block__shape-glyph"
          />
          {learnerMode ? (
            <span className="loegos-block__type-label">{blockView?.shapeFallbackLabel || "Aim·"}</span>
          ) : null}
        </span>
        <span className={`loegos-block__stage loegos-block__stage--${blockView.stageKey}`}>
          {blockView.stageLabel}
        </span>
        <span
          className={`loegos-block__exception loegos-block__exception--${blockView.exceptionKey}`}
          aria-label={blockView.exceptionLabel}
        >
          {blockView.exceptionMarker || " "}
        </span>

        <div className="loegos-block__body">
          <div className="loegos-block__content">
            {renderBlockContent(block, blockView, learnerMode)}
            {blockView.annotation ? (
              <p className={`loegos-block__annotation loegos-block__annotation--${blockView.annotationTone}`}>
                <span>{blockView.annotation}</span>
              </p>
            ) : null}
            {blockView.compilerChecks?.length ? (
              <div className="loegos-block__checks">
                {blockView.compilerChecks.map((check) => (
                  <div
                    key={check.key}
                    className={`loegos-block__check loegos-block__check--${check.tone || "neutral"}`}
                  >
                    <strong>{check.label}</strong>
                    <span>{check.detail}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </button>

      {editing ? (
        <div className="loegos-block__editor-wrap">
          <textarea
            className="loegos-block__editor"
            value={draftText}
            rows={4}
            onChange={(event) => setDraftText(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                onRewriteBlock?.(block, draftText);
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setEditing(false);
                setDraftText(block?.text || "");
              }
            }}
          />
          <div className="loegos-block__editor-actions">
            <button
              type="button"
              className="assembler-tiny-button"
              onClick={() => onRewriteBlock?.(block, draftText)}
              disabled={controlsDisabled || !String(draftText || "").trim()}
            >
              Save
            </button>
            <button
              type="button"
              className="assembler-tiny-button"
              onClick={() => {
                setEditing(false);
                setDraftText(block?.text || "");
              }}
              disabled={controlsDisabled}
            >
              Cancel
            </button>
            {saveStateLabel ? (
              <span className={`loegos-block__editor-status is-${saveState || "idle"}`}>
                {saveStateLabel}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {canMutate || onStageBlock || onUnstageBlock || onOpenSourceWitness ? (
        <>
          <div className="loegos-block__actions">
            {canMutate ? (
              <>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={() => {
                    setDraftText(block?.text || "");
                    setEditing(true);
                  }}
                  disabled={controlsDisabled}
                >
                  Rewrite
                </button>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={() => {
                    setDraftText(buildCompressionDraft(block));
                    setEditing(true);
                  }}
                  disabled={controlsDisabled}
                >
                  Compress
                </button>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={() => onSplitBlock?.(block)}
                  disabled={controlsDisabled || !canSplit}
                >
                  Split
                </button>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={() => onMergeBlock?.(block)}
                  disabled={controlsDisabled || !canMerge}
                >
                  Merge
                </button>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={() => onKeepDraftBlock?.(block)}
                  disabled={controlsDisabled}
                >
                  Draft
                </button>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={() => onAcceptBlockInference?.(block, { shapeKey: blockView.shapeKey })}
                  disabled={controlsDisabled}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className={`assembler-tiny-button ${recastOpen ? "is-active" : ""}`}
                  onClick={() => setRecastOpen((value) => !value)}
                  disabled={controlsDisabled}
                >
                  Recast
                </button>
              </>
            ) : null}

            {staged ? (
              <button
                type="button"
                className="assembler-tiny-button"
                onClick={() => onUnstageBlock?.(block?.id)}
                disabled={controlsDisabled}
              >
                Unstage
              </button>
            ) : (
              <button
                type="button"
                className="assembler-tiny-button"
                onClick={() => onStageBlock?.(block)}
                disabled={controlsDisabled}
              >
                Stage
              </button>
            )}

            <button
              type="button"
              className="assembler-tiny-button"
              onClick={() => onOpenSourceWitness?.(block)}
              disabled={controlsDisabled}
            >
              Witness
            </button>
          </div>

          {canMutate && recastOpen ? (
            <div className="loegos-block__recast">
              {RECAST_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`assembler-tiny-button ${currentPrimaryTag === option.value ? "is-active" : ""}`}
                  onClick={() => {
                    setRecastOpen(false);
                    onRecastBlockTag?.(block, option.value);
                  }}
                  disabled={controlsDisabled}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </article>
  );
}

function buildTitle(blocks = [], artifactKind = "Source") {
  const count = Array.isArray(blocks) ? blocks.length : 0;
  if (!count) return `${artifactKind} file`;
  return `${artifactKind} file · ${count} ${count === 1 ? "line" : "lines"}`;
}

export default function LoegosRenderer({
  artifactKind = "Source",
  blocks = [],
  findingMap = null,
  selectedBlockId = "",
  currentBlockId = "",
  nextBlockId = "",
  learnerMode = false,
  stagedBlockIds = [],
  editable = false,
  blockActionPendingId = "",
  blockSaveStates = {},
  onToggleLearnerMode,
  onStageBlock,
  onUnstageBlock,
  onRewriteBlock,
  onKeepDraftBlock,
  onAcceptBlockInference,
  onRecastBlockTag,
  onOpenSourceWitness,
  onSplitBlock,
  onMergeBlock,
  onSelectBlock,
}) {
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;
  const stagedSet = useMemo(
    () => new Set((Array.isArray(stagedBlockIds) ? stagedBlockIds : []).map((value) => String(value || "").trim())),
    [stagedBlockIds],
  );

  return (
    <div className="loegos-renderer" data-testid="loegos-renderer">
      <div className="loegos-renderer__toolbar">
        <div className="loegos-renderer__toolbar-copy">
          <span className="loegos-renderer__eyebrow">Workbench</span>
          <strong className="loegos-renderer__title">{buildTitle(blocks, artifactKind)}</strong>
        </div>
        <div className="loegos-renderer__toolbar-actions">
          <span className="loegos-renderer__hint">Inspect by selecting a line.</span>
          <button
            type="button"
            className="founder-shell__quiet-action loegos-renderer__toggle"
            onClick={onToggleLearnerMode}
            data-testid="loegos-learner-toggle"
          >
            {learnerMode ? "Show glyphs" : "Learner mode"}
          </button>
        </div>
      </div>

      {hasBlocks ? (
        <div className="loegos-renderer__blocks">
          {blocks.map((block, index) => (
            <LoegosBlock
              key={`${block.id}:${block.updatedAt || block.text || ""}`}
              artifactKind={artifactKind}
              block={block}
              findingMap={findingMap}
              selected={block.id === selectedBlockId}
              playing={block.id === currentBlockId}
              next={block.id === nextBlockId}
              learnerMode={learnerMode}
              staged={stagedSet.has(String(block.id || "").trim())}
              editable={editable}
              actionPending={blockActionPendingId === block.id}
              saveState={blockSaveStates[block.id] || ""}
              canMerge={index < blocks.length - 1}
              onStageBlock={onStageBlock}
              onUnstageBlock={onUnstageBlock}
              onRewriteBlock={onRewriteBlock}
              onKeepDraftBlock={onKeepDraftBlock}
              onAcceptBlockInference={onAcceptBlockInference}
              onRecastBlockTag={onRecastBlockTag}
              onOpenSourceWitness={onOpenSourceWitness}
              onSplitBlock={onSplitBlock}
              onMergeBlock={onMergeBlock}
              onSelect={onSelectBlock}
            />
          ))}
        </div>
      ) : (
        <div className="founder-shell__empty">
          <span className="founder-shell__empty-label">Artifact</span>
          <strong className="founder-shell__empty-title">No content yet.</strong>
          <p className="founder-shell__empty-copy">
            Add one real source, keep it raw, and the next step will shape the first seed.
          </p>
        </div>
      )}
    </div>
  );
}
