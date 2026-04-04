import { useState } from "react";

function SegmentedButton({ active = false, label, onClick }) {
  return (
    <button
      type="button"
      className={`assembler-first-box__segment ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function FirstBoxComposer({
  boxTitle = "Untitled Box",
  capturePending = false,
  writePending = false,
  onUpload,
  onPaste,
  onLink,
  onSpeak,
  onWrite,
  onBrowseBoxes,
}) {
  const [mode, setMode] = useState("capture");
  const [draft, setDraft] = useState("");

  const pending = capturePending || writePending;

  return (
    <section className="assembler-first-box">
      <div className="assembler-first-box__halo" aria-hidden="true" />
      <div className="assembler-first-box__panel">
        <header className="assembler-first-box__header">
          <span className="assembler-first-box__eyebrow">First Box</span>
          <h1 className="assembler-first-box__title">{boxTitle}</h1>
          <p className="assembler-first-box__subtitle">
            Start with one real signal. Seven will turn it into the first seed.
          </p>
          <div className="assembler-first-box__segments" role="tablist" aria-label="First input mode">
            <SegmentedButton active={mode === "capture"} label="Capture" onClick={() => setMode("capture")} />
            <SegmentedButton active={mode === "write"} label="Write" onClick={() => setMode("write")} />
          </div>
        </header>

        {mode === "capture" ? (
          <div className="assembler-first-box__capture">
            <button
              type="button"
              className="assembler-first-box__action is-primary"
              onClick={onUpload}
              disabled={pending}
            >
              <span>Upload file</span>
              <small>PDF, DOCX, Markdown, or TXT</small>
            </button>
            <button type="button" className="assembler-first-box__action" onClick={onPaste} disabled={pending}>
              <span>Paste text</span>
              <small>Drop raw text or notes straight into the box</small>
            </button>
            <button type="button" className="assembler-first-box__action" onClick={onLink} disabled={pending}>
              <span>Add link</span>
              <small>Fetch a page and turn it into a source</small>
            </button>
            <button type="button" className="assembler-first-box__action" onClick={onSpeak} disabled={pending}>
              <span>Speak note</span>
              <small>Record the first signal in your own voice</small>
            </button>
          </div>
        ) : (
          <div className="assembler-first-box__write">
            <label className="assembler-first-box__write-label" htmlFor="first-box-write">
              What are you trying to make real?
            </label>
            <textarea
              id="first-box-write"
              className="assembler-first-box__write-field"
              placeholder="Type the first intention, context, or signal. Seven will use this to create the first seed."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={7}
            />
            <div className="assembler-first-box__write-actions">
              <button
                type="button"
                className="terminal-button is-primary"
                onClick={() => onWrite(draft)}
                disabled={pending || !draft.trim()}
              >
                {writePending ? "Creating seed…" : "Create first seed"}
              </button>
              <button type="button" className="terminal-button" onClick={() => setDraft("")} disabled={pending || !draft}>
                Clear
              </button>
            </div>
          </div>
        )}

        <footer className="assembler-first-box__footer">
          <p>
            Capture brings in outside material. Write starts from your own language. Both become
            sources first.
          </p>
          <button type="button" className="assembler-first-box__browse" onClick={onBrowseBoxes}>
            Browse boxes instead
          </button>
        </footer>
      </div>
    </section>
  );
}
