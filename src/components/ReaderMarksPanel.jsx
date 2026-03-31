"use client";

import { useState } from "react";

function MarkSection({ title, count, children, empty }) {
  return (
    <section className="reader-marks__section">
      <div className="reader-marks__section-header">
        <h3 className="reader-marks__section-title">{title}</h3>
        <span className="reader-marks__section-count">{count}</span>
      </div>
      {count === 0 ? <p className="reader-marks__empty">{empty}</p> : children}
    </section>
  );
}

function BookmarkItem({ bookmark, onJump, onDelete, allowMutations }) {
  return (
    <article className="reader-mark-card">
      <button type="button" className="reader-mark-card__jump" onClick={() => onJump(bookmark)}>
        <span className="reader-mark-card__eyebrow">
          {bookmark.ownerName ? `${bookmark.ownerName} · ` : ""}
          Bookmark
        </span>
        <span className="reader-mark-card__title">{bookmark.label}</span>
        {bookmark.excerpt ? <span className="reader-mark-card__excerpt">{bookmark.excerpt}</span> : null}
      </button>
      {allowMutations ? (
        <button type="button" className="reader-mark-card__delete" onClick={() => onDelete(bookmark.id)}>
          Remove
        </button>
      ) : null}
    </article>
  );
}

function HighlightItem({ highlight, onJump, onDelete, allowMutations }) {
  return (
    <article className="reader-mark-card">
      <button type="button" className="reader-mark-card__jump" onClick={() => onJump(highlight)}>
        <span className="reader-mark-card__eyebrow">
          {highlight.ownerName ? `${highlight.ownerName} · ` : ""}
          {highlight.sectionTitle}
        </span>
        <span className="reader-mark-card__excerpt">“{highlight.excerpt}”</span>
      </button>
      {allowMutations ? (
        <button type="button" className="reader-mark-card__delete" onClick={() => onDelete(highlight.id)}>
          Remove
        </button>
      ) : null}
    </article>
  );
}

function NoteItem({ note, onJump, onDelete, onSave, allowMutations }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.noteText);

  return (
    <article className="reader-mark-card">
      <button type="button" className="reader-mark-card__jump" onClick={() => onJump(note)}>
        <span className="reader-mark-card__eyebrow">
          {note.ownerName ? `${note.ownerName} · ` : ""}
          {note.sectionTitle}
        </span>
        <span className="reader-mark-card__excerpt">“{note.excerpt}”</span>
      </button>

      {isEditing ? (
        <div className="reader-note-editor">
          <textarea
            className="reader-note-editor__textarea"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
          />
          <div className="reader-note-editor__actions">
            <button type="button" className="reader-note-editor__button" onClick={() => { setDraft(note.noteText); setIsEditing(false); }}>
              Cancel
            </button>
            <button
              type="button"
              className="reader-note-editor__button is-primary"
              disabled={!draft.trim()}
              onClick={() => {
                onSave(note.id, draft);
                setIsEditing(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="reader-mark-card__note">{note.noteText}</p>
      )}

      <div className="reader-mark-card__actions">
        {!isEditing && allowMutations ? (
          <button type="button" className="reader-mark-card__secondary" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        ) : null}
        {allowMutations ? (
          <button type="button" className="reader-mark-card__delete" onClick={() => onDelete(note.id)}>
            Remove
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function ReaderMarksPanel({
  open,
  currentLabel,
  progressPercent,
  mode,
  canViewSeven,
  isLoadingSharedMarks = false,
  sharedMarksError = "",
  bookmarks,
  highlights,
  notes,
  onChangeMode,
  onClose,
  onJumpToBookmark,
  onJumpToMark,
  onDeleteBookmark,
  onDeleteHighlight,
  onDeleteNote,
  onUpdateNote,
}) {
  const allowMutations = mode !== "seven";
  const subtitle =
    mode === "seven"
      ? isLoadingSharedMarks
        ? "Loading collected marks from the founding readers."
        : sharedMarksError || "Collected marks from the founding readers."
      : `${progressPercent}% read`;
  const bookmarkEmpty =
    mode === "seven" && (isLoadingSharedMarks || sharedMarksError)
      ? subtitle
      : "No bookmarks yet.";
  const highlightEmpty =
    mode === "seven" && (isLoadingSharedMarks || sharedMarksError)
      ? subtitle
      : "No highlights yet.";
  const noteEmpty =
    mode === "seven" && (isLoadingSharedMarks || sharedMarksError)
      ? subtitle
      : "No notes yet.";

  return (
    <aside className={`reader-marks ${open ? "is-open" : ""}`}>
      <div className="reader-marks__header">
        <div>
          <p className="reader-marks__eyebrow">Reading marks</p>
          <h2 className="reader-marks__title">{currentLabel}</h2>
          <p className="reader-marks__meta">{subtitle}</p>
        </div>
        <button type="button" className="reader-chrome-button reader-chrome-button--icon" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="reader-marks__body">
        {canViewSeven ? (
          <div className="reader-marks__mode-toggle" role="tablist" aria-label="Marks view">
            <button
              type="button"
              className={`reader-marks__mode-button ${mode === "mine" ? "is-active" : ""}`}
              onClick={() => onChangeMode("mine")}
            >
              Mine
            </button>
            <button
              type="button"
              className={`reader-marks__mode-button ${mode === "seven" ? "is-active" : ""}`}
              onClick={() => onChangeMode("seven")}
            >
              Seven
            </button>
          </div>
        ) : null}

        <MarkSection title="Bookmarks" count={bookmarks.length} empty={bookmarkEmpty}>
          <div className="reader-marks__list">
            {bookmarks.map((bookmark) => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                onJump={onJumpToBookmark}
                onDelete={onDeleteBookmark}
                allowMutations={allowMutations}
              />
            ))}
          </div>
        </MarkSection>

        <MarkSection title="Highlights" count={highlights.length} empty={highlightEmpty}>
          <div className="reader-marks__list">
            {highlights.map((highlight) => (
              <HighlightItem
                key={highlight.id}
                highlight={highlight}
                onJump={onJumpToMark}
                onDelete={onDeleteHighlight}
                allowMutations={allowMutations}
              />
            ))}
          </div>
        </MarkSection>

        <MarkSection title="Notes" count={notes.length} empty={noteEmpty}>
          <div className="reader-marks__list">
            {notes.map((note) => (
              <NoteItem
                key={`${note.id}-${note.updatedAt}`}
                note={note}
                onJump={onJumpToMark}
                onDelete={onDeleteNote}
                onSave={onUpdateNote}
                allowMutations={allowMutations}
              />
            ))}
          </div>
        </MarkSection>
      </div>
    </aside>
  );
}
