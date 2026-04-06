"use client";

import { useMemo } from "react";
import { ShapeGlyph } from "@/components/LoegosSystem";
import { buildLoegosBlockView } from "@/lib/founder-renderer";

function renderBlockContent(block = null, blockView = null, learnerMode = false) {
  if (!block) return null;

  const text = String(block?.text || "").replace(/^#{1,6}\s+/, "");
  const shapePrefix = learnerMode ? (
    <span className="loegos-block__shape-label">{blockView?.shapeFallbackLabel || "Aim·"}</span>
  ) : (
    <ShapeGlyph shapeKey={blockView?.shapeKey || "aim"} size={18} className="loegos-block__shape-glyph" />
  );

  if (block?.kind === "heading") {
    return (
      <h2 className="loegos-block__heading">
        {shapePrefix}
        <span>{text}</span>
      </h2>
    );
  }

  if (block?.kind === "list") {
    return (
      <div className="loegos-block__list">
        {String(block?.text || "")
          .split("\n")
          .map((line) => line.replace(/^[-+*]\s+/, "").trim())
          .filter(Boolean)
          .map((line, index) => (
            <div key={`${block?.id || "block"}-line-${index}`} className="loegos-block__list-line">
              {index === 0 ? shapePrefix : <span className="loegos-block__shape-spacer" aria-hidden="true" />}
              <span>{line}</span>
            </div>
          ))}
      </div>
    );
  }

  return (
    <p className="loegos-block__text">
      {shapePrefix}
      <span>{text}</span>
    </p>
  );
}

function LoegosBlock({
  block = null,
  findingMap = null,
  selected = false,
  playing = false,
  next = false,
  learnerMode = false,
  onSelect,
}) {
  const finding = findingMap?.get?.(block?.id) || null;
  const blockView = useMemo(
    () => buildLoegosBlockView(block, finding),
    [block, finding],
  );

  if (!block) return null;

  return (
    <button
      type="button"
      className={`loegos-block loegos-block--${blockView.signalKey} ${selected ? "is-selected" : ""} ${
        playing ? "is-playing" : ""
      } ${next ? "is-next" : ""}`}
      onClick={() => onSelect?.(block?.id)}
      data-testid="founder-block"
      aria-pressed={selected}
      aria-label={`${blockView.shapeLabel}. ${blockView.signalLabel}. Line ${String(
        (block?.sourcePosition || 0) + 1,
      )}.`}
      title={`${blockView.shapeLabel} · ${blockView.signalLabel}`}
    >
      <span className="loegos-block__line">
        {String((block?.sourcePosition || 0) + 1).padStart(3, "0")}
      </span>
      <div className="loegos-block__body">
        <span className="loegos-block__status-label">{blockView.signalLabel}</span>
        <div className="loegos-block__content">
          {renderBlockContent(block, blockView, learnerMode)}
          {blockView.annotation ? (
            <p className={`loegos-block__annotation loegos-block__annotation--${blockView.annotationTone}`}>
              <span className="loegos-block__annotation-icon" aria-hidden="true">
                {blockView.annotationTone === "clear" ? "✓" : blockView.annotationTone === "warning" ? "⚠" : "•"}
              </span>
              <span>{blockView.annotation}</span>
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function LoegosRenderer({
  blocks = [],
  findingMap = null,
  selectedBlockId = "",
  currentBlockId = "",
  nextBlockId = "",
  learnerMode = false,
  onToggleLearnerMode,
  onSelectBlock,
  seedState = [],
}) {
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;

  return (
    <div className="loegos-renderer" data-testid="loegos-renderer">
      <div className="loegos-renderer__toolbar">
        <div className="loegos-renderer__toolbar-copy">
          <span className="loegos-renderer__eyebrow">Lœgos Rendering</span>
          <p className="loegos-renderer__lede">
            The text is the analysis. Shape and signal stay on the line itself.
          </p>
        </div>
        <button
          type="button"
          className="founder-shell__quiet-action loegos-renderer__toggle"
          onClick={onToggleLearnerMode}
          data-testid="loegos-learner-toggle"
        >
          {learnerMode ? "Show glyphs" : "Learner mode"}
        </button>
      </div>

      {hasBlocks ? (
        <div className="loegos-renderer__blocks">
          {blocks.map((block) => (
            <LoegosBlock
              key={block.id}
              block={block}
              findingMap={findingMap}
              selected={block.id === selectedBlockId}
              playing={block.id === currentBlockId}
              next={block.id === nextBlockId}
              learnerMode={learnerMode}
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

      {seedState.length ? (
        <footer className="loegos-renderer__seed-state" data-testid="founder-seed-state">
          {seedState.map((entry) => (
            <article key={entry.key} className="loegos-renderer__seed-card">
              <span className="loegos-renderer__seed-label">{entry.label}</span>
              <p className="loegos-renderer__seed-copy">{entry.value}</p>
            </article>
          ))}
        </footer>
      ) : null}
    </div>
  );
}
