"use client";

function normalizeWitnessLine(block = null) {
  return String(block?.text || "")
    .replace(/^#{1,6}\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function FounderWitnessPane({
  title = "",
  subtitle = "",
  blocks = [],
  selectedBlockId = "",
  onSelectBlock,
}) {
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;

  return (
    <section className="founder-witness" data-testid="founder-witness-pane" aria-label="Witness compare">
      <div className="founder-witness__head">
        <div className="founder-witness__copy">
          <span className="founder-witness__eyebrow">Witness</span>
          <strong className="founder-witness__title">{title || "Source witness"}</strong>
          <p className="founder-witness__lede">
            This side stays immutable. It anchors what the original document actually said before Lœgos shaped it into active structure.
          </p>
          {subtitle ? <p className="founder-witness__subtitle">{subtitle}</p> : null}
        </div>
      </div>

      {hasBlocks ? (
        <div className="founder-witness__blocks">
          {blocks.map((block) => (
            <button
              key={block.id}
              type="button"
              className={`founder-witness__line ${block.id === selectedBlockId ? "is-selected" : ""}`}
              data-testid="founder-witness-line"
              onClick={() => onSelectBlock?.(block.id)}
            >
              <span className="founder-witness__index">
                {String((block?.sourcePosition || 0) + 1).padStart(3, "0")}
              </span>
              <span className="founder-witness__text">{normalizeWitnessLine(block)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="founder-witness__empty">
          <span className="founder-shell__empty-label">Witness</span>
          <strong className="founder-shell__empty-title">No source selected.</strong>
          <p className="founder-shell__empty-copy">
            Bring one source into the box, then the compare surface can anchor active structure against it.
          </p>
        </div>
      )}
    </section>
  );
}
