"use client";

function SkipPreviousIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M6.35 5.25v9.5M14.6 5.95 8.55 10l6.05 4.05V5.95Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M7.1 5.6 14.6 10l-7.5 4.4V5.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M7.15 5.4v9.2M12.85 5.4v9.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SkipNextIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M13.65 5.25v9.5M5.4 5.95 11.45 10 5.4 14.05V5.95Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="m5.75 8 4.25 4.25L14.25 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="m6 6 8 8M14 6l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ReaderListenTray({
  state = "closed",
  currentLabel,
  progress = 0,
  canListenCurrentSection = false,
  canContinueDocument = false,
  canGoPrevious = false,
  canGoNext = false,
  isPlaying = false,
  isLoading = false,
  continueDocumentActive = false,
  liveStatus = "",
  showStatus = false,
  onExpand,
  onCollapse,
  onClose,
  onPlayPause,
  onContinue,
  onPrevious,
  onNext,
}) {
  const visibleState = state === "closed" ? null : state;

  if (!visibleState) {
    return null;
  }

  const isCollapsed = visibleState === "collapsed";
  const eyebrow = continueDocumentActive ? "Listening through book" : "Listen";
  const primaryDisabled = (!canListenCurrentSection && !continueDocumentActive) || isLoading;
  const primaryLabel = continueDocumentActive
    ? isPlaying
      ? "Pause book"
      : "Resume book"
    : isPlaying
      ? "Pause section"
      : "Play this section";
  const helperText = showStatus
    ? liveStatus
    : continueDocumentActive
      ? "Moving forward through the manuscript."
      : "Start with this section, then continue through the book if you want.";

  if (isCollapsed) {
    return (
      <div className="reader-listen-tray is-collapsed" aria-live="polite">
        <button
          type="button"
          className="reader-listen-tray__capsule"
          onClick={onExpand}
          aria-label={`Expand listening controls for ${currentLabel}`}
        >
          <span className="reader-listen-tray__capsule-copy">
            <span className="reader-listen-tray__capsule-eyebrow">{eyebrow}</span>
            <span className="reader-listen-tray__capsule-title">{currentLabel}</span>
          </span>
        </button>
        <button
          type="button"
          className="reader-listen-tray__capsule-action"
          onClick={onPlayPause}
          disabled={primaryDisabled}
          aria-label={primaryLabel}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    );
  }

  return (
    <div className="reader-listen-tray is-open" aria-live="polite">
      <div className="reader-listen-tray__surface">
        <div className="reader-listen-tray__progress" aria-hidden="true">
          <div
            className="reader-listen-tray__progress-fill"
            style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
          />
        </div>

        <div className="reader-listen-tray__header">
          <div className="reader-listen-tray__copy">
            <p className="reader-listen-tray__eyebrow">{eyebrow}</p>
            <h2 className="reader-listen-tray__title">{currentLabel}</h2>
            <p className="reader-listen-tray__status">{helperText}</p>
          </div>

          <div className="reader-listen-tray__window">
            <button
              type="button"
              className="reader-listen-tray__window-button"
              onClick={onCollapse}
              aria-label="Collapse listening controls"
            >
              <ChevronDownIcon />
            </button>
            <button
              type="button"
              className="reader-listen-tray__window-button"
              onClick={onClose}
              aria-label="Close listening controls"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="reader-listen-tray__transport">
        <button
          type="button"
          className="reader-listen-tray__transport-button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          aria-label="Play previous section"
        >
          <SkipPreviousIcon />
          </button>

          <button
            type="button"
            className="reader-listen-tray__transport-button reader-listen-tray__transport-button--primary"
            onClick={onPlayPause}
            disabled={primaryDisabled}
            aria-label={isPlaying ? `Pause listening to ${currentLabel}` : `Play ${currentLabel}`}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
            <span>{isLoading ? "Starting..." : primaryLabel}</span>
          </button>

        <button
          type="button"
          className="reader-listen-tray__transport-button"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Play next section"
        >
          <SkipNextIcon />
          </button>
        </div>

        <div className="reader-listen-tray__secondary">
          <button
            type="button"
            className="reader-listen-tray__secondary-button"
            onClick={onContinue}
            disabled={!canContinueDocument || isLoading}
          >
            {continueDocumentActive ? "Continue book is live" : "Continue through book"}
          </button>
        </div>
      </div>
    </div>
  );
}
