"use client";

// eslint-disable-next-line no-unused-vars -- motion.div used in JSX
import { AnimatePresence, motion } from "motion/react";
import * as Slider from "@radix-ui/react-slider";

const SPEED_OPTIONS = [1, 1.25, 1.5, 2, 0.75];

function formatTime(seconds) {
  if (!seconds || !Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

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

function SkipBackIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10.5 4v2.5l-5.25 3.5 5.25 3.5V16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text x="13.5" y="11.2" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="700">
        15
      </text>
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M9.5 4v2.5l5.25 3.5-5.25 3.5V16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text x="6.5" y="11.2" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="700">
        30
      </text>
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

function SpeakerSmallIcon() {
  return (
    <svg className="reader-icon reader-icon--small" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M7.2 4.1 5.24 5.75H3.8a1 1 0 0 0-1 1v2.5a1 1 0 0 0 1 1h1.44L7.2 11.9V4.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M9.92 5.8c.85.58 1.28 1.31 1.28 2.2 0 .89-.43 1.62-1.28 2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ReaderListenTray({
  state = "closed",
  currentLabel,
  progress = 0,
  elapsed = 0,
  duration = 0,
  speed = 1,
  voiceLabel = "",
  isDeviceMode = false,
  canListenCurrentSection = false,
  canContinueDocument = false,
  canGoPrevious = false,
  canGoNext = false,
  isPlaying = false,
  isLoading = false,
  continueDocumentActive = false,
  liveStatus: _liveStatus = "",
  showStatus: _showStatus = false,
  onExpand,
  onCollapse,
  onClose,
  onPlayPause,
  onContinue,
  onPrevious,
  onNext,
  onSpeedChange,
  onSkip,
}) {
  const visibleState = state === "closed" ? null : state;
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

  const hasTime = duration > 0;
  const remaining = Math.max(0, duration - elapsed);
  const progressNormalized = hasTime ? Math.min(1, elapsed / duration) : progress;
  const elapsedDisplay = hasTime ? formatTime(elapsed) : "";
  const remainingDisplay = hasTime ? `-${formatTime(remaining)}` : "";

  const nextSpeedIndex = SPEED_OPTIONS.indexOf(speed);
  const handleCycleSpeed = () => {
    const next = SPEED_OPTIONS[(nextSpeedIndex + 1) % SPEED_OPTIONS.length];
    onSpeedChange?.(next);
  };

  const springTransition = { type: "spring", damping: 30, stiffness: 300 };

  return (
    <AnimatePresence mode="wait">
      {isCollapsed ? (
        <motion.div
          key="collapsed"
          className="reader-listen-tray is-collapsed"
          aria-live="polite"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={springTransition}
        >
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
            <span
              className="reader-listen-tray__capsule-progress"
              style={{ width: `${progressNormalized * 100}%` }}
              aria-hidden="true"
            />
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
        </motion.div>
      ) : visibleState === "open" ? (
        <motion.div
          key="open"
          className="reader-listen-tray is-open"
          aria-live="polite"
          initial={{ y: "105%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "105%", opacity: 0 }}
          transition={springTransition}
        >
          <div className="reader-listen-tray__surface">
        <div className="reader-listen-tray__header">
          <div className="reader-listen-tray__copy">
            <p className="reader-listen-tray__eyebrow">{eyebrow}</p>
            <h2 className="reader-listen-tray__title">{currentLabel}</h2>
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

        <div className="reader-listen-tray__scrubber">
          <span className="reader-listen-tray__time">{elapsedDisplay}</span>
          <Slider.Root
            className="reader-listen-tray__slider"
            value={[progressNormalized * 100]}
            max={100}
            step={0.1}
            disabled={isDeviceMode || !hasTime}
            aria-label="Audio progress"
          >
            <Slider.Track className="reader-listen-tray__slider-track">
              <Slider.Range className="reader-listen-tray__slider-range" />
            </Slider.Track>
            {!isDeviceMode && hasTime ? (
              <Slider.Thumb className="reader-listen-tray__slider-thumb" />
            ) : null}
          </Slider.Root>
          <span className="reader-listen-tray__time">{remainingDisplay}</span>
        </div>

        <div className="reader-listen-tray__transport">
          {!isDeviceMode ? (
            <button
              type="button"
              className="reader-listen-tray__transport-button reader-listen-tray__transport-button--skip"
              onClick={() => onSkip?.(-15)}
              disabled={!isPlaying && !isLoading}
              aria-label="Skip back 15 seconds"
            >
              <SkipBackIcon />
            </button>
          ) : null}

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

          {!isDeviceMode ? (
            <button
              type="button"
              className="reader-listen-tray__transport-button reader-listen-tray__transport-button--skip"
              onClick={() => onSkip?.(30)}
              disabled={!isPlaying && !isLoading}
              aria-label="Skip forward 30 seconds"
            >
              <SkipForwardIcon />
            </button>
          ) : null}

          <button
            type="button"
            className="reader-listen-tray__transport-button reader-listen-tray__transport-button--speed"
            onClick={handleCycleSpeed}
            aria-label={`Playback speed: ${speed}x`}
          >
            {speed}x
          </button>
        </div>

        <div className="reader-listen-tray__footer">
          <div className="reader-listen-tray__voice">
            <SpeakerSmallIcon />
            <span className="reader-listen-tray__voice-label">{voiceLabel}</span>
          </div>
          <button
            type="button"
            className="reader-listen-tray__secondary-button"
            onClick={onContinue}
            disabled={!canContinueDocument || isLoading}
          >
            {continueDocumentActive ? "Continuing book" : "Continue through book"}
          </button>
        </div>
      </div>
    </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
