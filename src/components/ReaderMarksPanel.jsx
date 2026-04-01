"use client";

import { useMemo, useState } from "react";

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

function SectionScopeToggle({ scope, onChange }) {
  return (
    <div className="reader-marks__scope-toggle" role="tablist" aria-label="Notebook scope">
      {[
        { value: "section", label: "This Section" },
        { value: "all", label: "All Saved" },
      ].map((option) => {
        const active = scope === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`reader-marks__scope-button ${active ? "is-active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function EvidenceToggle({ selected, onClick }) {
  return (
    <button
      type="button"
      className={`reader-mark-card__receipt-toggle ${selected ? "is-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {selected ? "In Evidence" : "Add to Evidence"}
    </button>
  );
}

function BookmarkItem({ bookmark, onJump, onDelete, allowMutations }) {
  return (
    <article className="reader-mark-card reader-mark-card--bookmark">
      <button type="button" className="reader-mark-card__jump" onClick={() => onJump(bookmark)}>
        <span className="reader-mark-card__eyebrow">Bookmark</span>
        <span className="reader-mark-card__title">{bookmark.label}</span>
        {bookmark.excerpt ? (
          <span className="reader-mark-card__excerpt">{bookmark.excerpt}</span>
        ) : null}
      </button>
      <div className="reader-mark-card__actions reader-mark-card__actions--end">
        {allowMutations ? (
          <button
            type="button"
            className="reader-mark-card__secondary reader-mark-card__danger"
            onClick={() => onDelete(bookmark.id)}
          >
            Remove
          </button>
        ) : null}
      </div>
    </article>
  );
}

function HighlightItem({
  highlight,
  selected,
  onJump,
  onDelete,
  onToggleEvidence,
  allowMutations,
}) {
  return (
    <article className={`reader-mark-card ${selected ? "is-selected" : ""}`}>
      <button type="button" className="reader-mark-card__jump" onClick={() => onJump(highlight)}>
        <span className="reader-mark-card__eyebrow">{highlight.sectionTitle}</span>
        <span className="reader-mark-card__excerpt">“{highlight.excerpt}”</span>
      </button>
      <div className="reader-mark-card__actions">
        <EvidenceToggle selected={selected} onClick={() => onToggleEvidence(highlight)} />
        {allowMutations ? (
          <button
            type="button"
            className="reader-mark-card__secondary reader-mark-card__danger"
            onClick={() => onDelete(highlight.id)}
          >
            Remove
          </button>
        ) : null}
      </div>
    </article>
  );
}

function NoteItem({
  note,
  selected,
  onJump,
  onDelete,
  onSave,
  onToggleEvidence,
  allowMutations,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.noteText);

  return (
    <article className={`reader-mark-card ${selected ? "is-selected" : ""}`}>
      <button type="button" className="reader-mark-card__jump" onClick={() => onJump(note)}>
        <span className="reader-mark-card__eyebrow">{note.sectionTitle}</span>
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
            <button
              type="button"
              className="reader-mark-card__secondary"
              onClick={() => {
                setDraft(note.noteText);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="reader-mark-card__receipt-toggle is-selected"
              disabled={!draft.trim()}
              onClick={() => {
                onSave(note.id, draft);
                setIsEditing(false);
              }}
            >
              Save Note
            </button>
          </div>
        </div>
      ) : (
        <p className="reader-mark-card__note">{note.noteText}</p>
      )}

      <div className="reader-mark-card__actions">
        <div className="reader-mark-card__actions-group">
          <EvidenceToggle selected={selected} onClick={() => onToggleEvidence(note)} />
          {!isEditing && allowMutations ? (
            <button
              type="button"
              className="reader-mark-card__secondary"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          ) : null}
        </div>
        {allowMutations ? (
          <button
            type="button"
            className="reader-mark-card__secondary reader-mark-card__danger"
            onClick={() => onDelete(note.id)}
          >
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
  scope,
  onScopeChange,
  currentBookmarked,
  onToggleBookmark,
  bookmarks,
  highlights,
  notes,
  evidenceMarkIds,
  onToggleMarkEvidence,
  onOpenSeven,
  onClose,
  onJumpToBookmark,
  onJumpToMark,
  onDeleteBookmark,
  onDeleteHighlight,
  onDeleteNote,
  onUpdateNote,
}) {
  const allowMutations = true;
  const subtitle = `${progressPercent}% read`;
  const evidenceMarkIdSet = useMemo(() => new Set(evidenceMarkIds), [evidenceMarkIds]);

  return (
    <aside className={`reader-marks ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="reader-marks__header">
        <div className="reader-marks__header-copy">
          <p className="reader-marks__eyebrow">Notebook</p>
          <h2 className="reader-marks__title">{currentLabel}</h2>
          <p className="reader-marks__meta">{subtitle}</p>
        </div>
        <div className="reader-marks__header-actions">
          <button
            type="button"
            className={`reader-mark-card__receipt-toggle reader-marks__bookmark-toggle ${
              currentBookmarked ? "is-selected" : ""
            }`}
            onClick={onToggleBookmark}
            aria-pressed={currentBookmarked}
          >
            {currentBookmarked ? "Bookmarked" : "Save This Section"}
          </button>
          <button
            type="button"
            className="reader-chrome-button reader-chrome-button--icon"
            onClick={onClose}
            aria-label="Close notebook"
          >
            ×
          </button>
        </div>
      </div>

      <div className="reader-marks__body">
        <SectionScopeToggle scope={scope} onChange={onScopeChange} />

        <MarkSection title="Notes" count={notes.length} empty="No notes.">
          <div className="reader-marks__list">
            {notes.map((note) => (
              <NoteItem
                key={`${note.id}-${note.updatedAt}`}
                note={note}
                selected={evidenceMarkIdSet.has(note.id)}
                onJump={onJumpToMark}
                onDelete={onDeleteNote}
                onSave={onUpdateNote}
                onToggleEvidence={onToggleMarkEvidence}
                allowMutations={allowMutations}
              />
            ))}
          </div>
        </MarkSection>

        <MarkSection title="Highlights" count={highlights.length} empty="No highlights.">
          <div className="reader-marks__list">
            {highlights.map((highlight) => (
              <HighlightItem
                key={highlight.id}
                highlight={highlight}
                selected={evidenceMarkIdSet.has(highlight.id)}
                onJump={onJumpToMark}
                onDelete={onDeleteHighlight}
                onToggleEvidence={onToggleMarkEvidence}
                allowMutations={allowMutations}
              />
            ))}
          </div>
        </MarkSection>

        <MarkSection title="Bookmarks" count={bookmarks.length} empty="No bookmarks.">
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
      </div>

      <div className="reader-marks__footer">
        <div className="reader-marks__footer-copy">
          <p className="reader-marks__footer-title">Review Evidence in Seven</p>
          <p className="reader-marks__footer-note">
            Build receipts from reviewed evidence inside the guide workspace.
          </p>
        </div>
        <button
          type="button"
          className="reader-seven__send reader-seven__send--wide"
          onClick={onOpenSeven}
        >
          Open Seven
        </button>
      </div>
    </aside>
  );
}
