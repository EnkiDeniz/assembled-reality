function getDocumentTitle(documents = [], documentKey = "") {
  return (
    documents.find((document) => document.documentKey === documentKey)?.title ||
    documentKey ||
    "document"
  );
}

export default function StagingPanel({
  stagedBlocks = [],
  clipboard = [],
  documents = [],
  onAcceptStagedBlock,
  onAcceptAllStagedBlocks,
  onClearStagedBlocks,
  onRemoveClipboardIndex,
  onReorderClipboard,
  onClearClipboard,
  onAssemble,
}) {
  const sourceCount = new Set(
    clipboard.map((block) => block.sourceDocumentKey || block.documentKey).filter(Boolean),
  ).size;

  return (
    <section className="assembler-staging-panel">
      <div className="assembler-staging-panel__header">
        <div>
          <span className="assembler-staging-panel__eyebrow">Staging</span>
          <h2 className="assembler-staging-panel__title">Current assembly</h2>
        </div>
        <span className="assembler-staging-panel__count">
          {clipboard.length} block{clipboard.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="assembler-staging-panel__body">
        {stagedBlocks.length ? (
          <div className="assembler-staging-panel__section">
            <div className="assembler-staging-panel__section-head">
              <span>AI staging</span>
              <div className="assembler-staging-panel__section-actions">
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={onAcceptAllStagedBlocks}
                >
                  Add all
                </button>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={onClearStagedBlocks}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="assembler-staging-panel__list">
              {stagedBlocks.map((block, index) => (
                <div key={block.id} className="assembler-staging-panel__row is-staged">
                  <span className="assembler-staging-panel__index">AI</span>
                  <span className="assembler-staging-panel__text">
                    {block.plainText || block.text}
                  </span>
                  <button
                    type="button"
                    className="assembler-tiny-button"
                    onClick={() => onAcceptStagedBlock(index)}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="assembler-staging-panel__section">
          <div className="assembler-staging-panel__section-head">
            <span>
              Selected blocks
              {sourceCount ? ` · ${sourceCount} source${sourceCount === 1 ? "" : "s"}` : ""}
            </span>
            <div className="assembler-staging-panel__section-actions">
              <button
                type="button"
                className="assembler-tiny-button"
                onClick={onAssemble}
                disabled={!clipboard.length}
              >
                Assemble
              </button>
              <button
                type="button"
                className="assembler-tiny-button"
                onClick={onClearClipboard}
                disabled={!clipboard.length}
              >
                Clear
              </button>
            </div>
          </div>

          {clipboard.length ? (
            <div className="assembler-staging-panel__list">
              {clipboard.map((block, index) => (
                <div key={`${block.id}-${index}`} className="assembler-staging-panel__row">
                  <span className="assembler-staging-panel__index">{index + 1}</span>
                  <div className="assembler-staging-panel__main">
                    <span className="assembler-staging-panel__source">
                      {getDocumentTitle(documents, block.sourceDocumentKey || block.documentKey)}
                    </span>
                    <span className="assembler-staging-panel__text">
                      {block.plainText || block.text}
                    </span>
                  </div>
                  <div className="assembler-staging-panel__row-actions">
                    <button
                      type="button"
                      className="assembler-tiny-button"
                      disabled={index === 0}
                      onClick={() => onReorderClipboard(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="assembler-tiny-button"
                      disabled={index === clipboard.length - 1}
                      onClick={() => onReorderClipboard(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="assembler-tiny-button is-danger"
                      onClick={() => onRemoveClipboardIndex(index)}
                    >
                      −
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="assembler-staging-panel__empty">
              Add blocks from a source to build the current assembly.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
