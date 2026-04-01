"use client";

export default function SelectionMenu({
  selection,
  noteDraft,
  onHighlight,
  onAddToEvidence,
  onStartNote,
  onChangeNoteDraft,
  onSaveNote,
  onCancel,
}) {
  if (!selection) return null;

  const menuStyle =
    selection.mode === "actions"
      ? {
          left: `${selection.point.x}px`,
          top: `${Math.max(selection.point.y, 16)}px`,
        }
      : undefined;

  return (
    <div className={`selection-menu ${selection.mode === "note" ? "is-note" : ""}`} style={menuStyle}>
      {selection.mode === "actions" ? (
        <div className="selection-menu__actions">
          <button
            type="button"
            className="selection-menu__button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onHighlight}
          >
            Highlight
          </button>
          <button
            type="button"
            className="selection-menu__button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onStartNote}
          >
            Add Note
          </button>
          <button
            type="button"
            className="selection-menu__button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onAddToEvidence}
          >
            Add to Evidence
          </button>
        </div>
      ) : (
        <div className="selection-menu__composer">
          <div className="selection-menu__sheet-header">
            <div>
              <h3 className="selection-menu__title">Add Note</h3>
            </div>
            <button
              type="button"
              className="reader-chrome-button reader-chrome-button--icon"
              onClick={onCancel}
              aria-label="Close note composer"
            >
              ×
            </button>
          </div>
          <div className="selection-menu__quote">“{selection.anchor.quote}”</div>
          <label className="sr-only" htmlFor="selection-note">
            Note text
          </label>
          <textarea
            id="selection-note"
            className="selection-menu__textarea"
            value={noteDraft}
            onChange={(event) => onChangeNoteDraft(event.target.value)}
            placeholder="Add a note..."
            rows={4}
          />
          <div className="selection-menu__composer-actions">
            <button type="button" className="selection-menu__secondary" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="selection-menu__primary"
              onClick={onSaveNote}
              disabled={!noteDraft.trim()}
            >
              Save Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
