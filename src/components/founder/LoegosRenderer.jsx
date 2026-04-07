"use client";

import { useMemo } from "react";
import { ShapeGlyph } from "@/components/LoegosSystem";
import { buildLoegosBlockView } from "@/lib/founder-renderer";

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
  onStageBlock,
  onUnstageBlock,
  onSelect,
}) {
  const finding = findingMap?.get?.(block?.id) || null;
  const blockView = useMemo(
    () => buildLoegosBlockView(block, finding, { artifactKind, isStaged: staged }),
    [artifactKind, block, finding, staged],
  );

  if (!block) return null;

  return (
    <article
      className={`loegos-block loegos-block--${blockView.signalKey} ${selected ? "is-selected" : ""} ${
        playing ? "is-playing" : ""
      } ${next ? "is-next" : ""}`}
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
          </div>
        </div>
      </button>

      {onStageBlock || onUnstageBlock ? (
        <div className="loegos-block__actions">
          {staged ? (
            <button
              type="button"
              className="assembler-tiny-button"
              onClick={(event) => {
                event.stopPropagation();
                onUnstageBlock?.(block?.id);
              }}
            >
              Unstage
            </button>
          ) : (
            <button
              type="button"
              className="assembler-tiny-button"
              onClick={(event) => {
                event.stopPropagation();
                onStageBlock?.(block);
              }}
            >
              Stage
            </button>
          )}
        </div>
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
  onToggleLearnerMode,
  onStageBlock,
  onUnstageBlock,
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
          {blocks.map((block) => (
            <LoegosBlock
              key={block.id}
              artifactKind={artifactKind}
              block={block}
              findingMap={findingMap}
              selected={block.id === selectedBlockId}
              playing={block.id === currentBlockId}
              next={block.id === nextBlockId}
              learnerMode={learnerMode}
              staged={stagedSet.has(String(block.id || "").trim())}
              onStageBlock={onStageBlock}
              onUnstageBlock={onUnstageBlock}
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
