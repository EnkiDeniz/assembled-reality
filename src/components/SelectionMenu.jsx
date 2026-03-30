"use client";

export default function SelectionMenu({
  selection,
  noteDraft,
  onHighlight,
  onStartNote,
  onChangeNoteDraft,
  onSaveNote,
  onCancel,
}) {
  if (!selection) return null;

  const menuStyle = {
    left: `${selection.point.x}px`,
    top: `${Math.max(selection.point.y, 16)}px`,
  };

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
            Add note
          </button>
        </div>
      ) : (
        <div className="selection-menu__composer">
          <div className="selection-menu__quote">“{selection.anchor.quote}”</div>
          <label className="sr-only" htmlFor="selection-note">
            Note text
          </label>
          <textarea
            id="selection-note"
            className="selection-menu__textarea"
            value={noteDraft}
            onChange={(event) => onChangeNoteDraft(event.target.value)}
            placeholder="Add your note"
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
              Save note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
