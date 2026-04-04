export default function BoxPhaseBar({
  phase = "think",
  onSelectPhase,
  editMode = false,
  onToggleEditMode,
  canEdit = false,
  aiOpen = false,
  onToggleAi,
  status = "",
  statusTone = "",
  documentState = null,
  onReloadLatest,
  isMobileLayout = false,
  onOpenClipboard,
  isClipboardOpen = false,
  stagedCount = 0,
  clipboardCount = 0,
}) {
  const totalClipboardCount = clipboardCount + stagedCount;

  function renderPhaseButton(nextPhase, label) {
    return (
      <button
        type="button"
        className={`assembler-tab ${phase === nextPhase ? "is-active" : ""}`}
        onClick={() => onSelectPhase(nextPhase)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={`assembler-toolbar ${isMobileLayout ? "is-mobile" : ""}`}>
      <div className="assembler-toolbar__left">
        {renderPhaseButton("think", "Think")}
        {renderPhaseButton("create", "Create")}
        {isMobileLayout ? (
          <button
            type="button"
            className={`assembler-tab ${isClipboardOpen ? "is-active" : ""}`}
            onClick={onOpenClipboard}
          >
            {totalClipboardCount ? `Stage ${totalClipboardCount}` : "Stage"}
          </button>
        ) : null}
      </div>

      <div className="assembler-toolbar__right">
        <button
          type="button"
          className={`assembler-tab ${phase === "receipts" ? "is-active" : ""}`}
          onClick={() => onSelectPhase("receipts")}
        >
          Receipts
        </button>

        {documentState ? (
          <div className={`assembler-toolbar__document-state is-${documentState.status}`}>
            <span>{documentState.message}</span>
            {documentState.status === "conflict" && onReloadLatest ? (
              <button type="button" className="assembler-tiny-button" onClick={onReloadLatest}>
                Load latest
              </button>
            ) : null}
          </div>
        ) : null}

        {phase !== "receipts" ? (
          <button
            type="button"
            className={`assembler-tab ${editMode ? "is-active is-edit" : ""}`}
            onClick={onToggleEditMode}
            disabled={!canEdit}
          >
            {editMode ? "Editing" : "Edit"}
          </button>
        ) : null}

        <button
          type="button"
          className={`assembler-ai-toggle ${aiOpen ? "is-active" : ""}`}
          onClick={onToggleAi}
          aria-label={aiOpen ? "Close Seven conversation" : "Open Seven conversation"}
        >
          7
        </button>
      </div>

      {status ? (
        <div className={`assembler-toolbar__status ${statusTone ? `is-${statusTone}` : ""}`}>
          {status}
        </div>
      ) : null}
    </div>
  );
}
