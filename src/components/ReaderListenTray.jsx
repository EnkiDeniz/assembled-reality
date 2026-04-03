"use client";

import * as Slider from "@radix-ui/react-slider";
// eslint-disable-next-line no-unused-vars -- motion elements used in JSX
import { motion } from "motion/react";

const SPEED_OPTIONS = [1, 1.25, 1.5, 2, 0.75];

function formatTime(seconds) {
  if (!seconds || !Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M7.1 5.6 14.6 10l-7.5 4.4V5.6Z"
        fill="currentColor"
        stroke="none"
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
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
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

function SparkIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="m10 2.7 1.25 4.05 4.05 1.25-4.05 1.25L10 13.3l-1.25-4.05L4.7 8l4.05-1.25L10 2.7Zm5.15 9.55.58 1.9 1.9.58-1.9.58-.58 1.9-.58-1.9-1.9-.58 1.9-.58.58-1.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function VoiceIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M9.3 4.25 6.55 6.6H4.75A1.25 1.25 0 0 0 3.5 7.85v4.3c0 .69.56 1.25 1.25 1.25h1.8l2.75 2.35V4.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path
        d="M12.15 7.2c1.03.67 1.55 1.6 1.55 2.8 0 1.19-.52 2.12-1.55 2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4.75 6.1h10.5M4.75 10h10.5M4.75 13.9h6.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <circle cx="14.75" cy="13.9" r="1.1" fill="currentColor" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="m5.75 11.7 4.25-4.25 4.25 4.25"
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

function ScopePill({ scope }) {
  const label =
    scope === "section" ? "Section" : scope === "selection" ? "Selection" : scope === "message" ? "Reply" : "Flow";
  return <span className="reader-listen-v2__scope">{label}</span>;
}

function Sheet({ title, children, onClose }) {
  return (
    <motion.div
      className="reader-listen-v2__sheet"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="reader-listen-v2__sheet-header">
        <h3 className="reader-listen-v2__sheet-title">{title}</h3>
        <button
          type="button"
          className="reader-listen-v2__sheet-close"
          onClick={onClose}
          aria-label={`Close ${title.toLowerCase()}`}
        >
          <CloseIcon />
        </button>
      </div>
      <div className="reader-listen-v2__sheet-body">{children}</div>
    </motion.div>
  );
}

export default function ReaderListenTray({
  scene = "hidden",
  sheet = null,
  guideOpen = false,
  currentLabel = "",
  sectionLabel = "",
  heroText = "",
  progress = 0,
  elapsed = 0,
  duration = 0,
  speed = 1,
  scope = "flow",
  voiceLabel = "",
  providerBadge = "",
  queuePosition = 0,
  queueLength = 0,
  isPlaying = false,
  isLoading = false,
  canGoPrevious = false,
  canGoNext = false,
  canSeek = true,
  queueItems = [],
  voiceOptions = [],
  onOpenFocus,
  onCollapse,
  onClose,
  onPlayPause,
  onPrevious,
  onNext,
  onSkipBack,
  onSkipForward,
  onSeek,
  onSpeedChange,
  onOpenQueue,
  onOpenVoice,
  onCloseSheet,
  onSelectQueueItem,
  onSelectVoice,
  onToggleGuide,
}) {
  if (scene === "hidden") {
    return null;
  }

  const elapsedDisplay = formatTime(elapsed);
  const remainingDisplay = `-${formatTime(Math.max(0, duration - elapsed))}`;
  const normalizedProgress = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const sliderValue = [Math.round(normalizedProgress * 1000)];
  const showFocus = scene === "focus";
  const nextSpeedIndex = SPEED_OPTIONS.indexOf(speed);
  const handleCycleSpeed = () => {
    const next = SPEED_OPTIONS[(nextSpeedIndex + 1) % SPEED_OPTIONS.length];
    onSpeedChange?.(next);
  };

  return (
    <div className={`reader-listen-v2 reader-listen-v2--${scene} ${guideOpen ? "is-guide-open" : ""}`}>
      {scene === "dock" ? (
        <motion.div
          className="reader-listen-v2__dock"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <button
            type="button"
            className="reader-listen-v2__dock-track"
            onClick={onOpenFocus}
            aria-label={`Open listening view for ${currentLabel}`}
          >
            <span className="reader-listen-v2__dock-copy">
              <span className="reader-listen-v2__dock-title">{currentLabel}</span>
              <span className="reader-listen-v2__dock-meta">
                <ScopePill scope={scope} />
                <span>{queuePosition > 0 && queueLength > 0 ? `${queuePosition}/${queueLength}` : sectionLabel}</span>
              </span>
            </span>
            <span className="reader-listen-v2__dock-progress" aria-hidden="true">
              <span style={{ width: `${normalizedProgress * 100}%` }} />
            </span>
          </button>
          <button
            type="button"
            className="reader-listen-v2__dock-action"
            onClick={onPlayPause}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
        </motion.div>
      ) : null}

      {showFocus ? (
        <motion.section
          className="reader-listen-v2__focus"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
        >
          <div className="reader-listen-v2__focus-header">
            <button
              type="button"
              className="reader-listen-v2__focus-button"
              onClick={onCollapse}
              aria-label="Collapse player"
            >
              <CollapseIcon />
            </button>
            <div className="reader-listen-v2__focus-copy">
              <p className="reader-listen-v2__focus-title">{currentLabel}</p>
              <div className="reader-listen-v2__focus-meta">
                <ScopePill scope={scope} />
                <span>{queuePosition > 0 && queueLength > 0 ? `${queuePosition}/${queueLength}` : sectionLabel}</span>
              </div>
            </div>
            <button
              type="button"
              className="reader-listen-v2__focus-button"
              onClick={onClose}
              aria-label="Close player"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="reader-listen-v2__hero-wrap">
            <div className="reader-listen-v2__hero-glow" aria-hidden="true" />
            <p className="reader-listen-v2__hero-text">{heroText || currentLabel}</p>
          </div>

          <div className="reader-listen-v2__timeline">
            <span>{elapsedDisplay}</span>
            <Slider.Root
              className="reader-listen-v2__slider"
              value={sliderValue}
              max={1000}
              step={1}
              onValueChange={(values) => {
                if (!canSeek) return;
                onSeek?.((values[0] || 0) / 1000);
              }}
              aria-label="Playback position"
            >
              <Slider.Track className="reader-listen-v2__slider-track">
                <Slider.Range className="reader-listen-v2__slider-range" />
              </Slider.Track>
              <Slider.Thumb className="reader-listen-v2__slider-thumb" />
            </Slider.Root>
            <span>{remainingDisplay}</span>
          </div>

          <div className="reader-listen-v2__transport">
            <button
              type="button"
              className="reader-listen-v2__transport-button"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              aria-label="Previous"
            >
              <SkipPreviousIcon />
            </button>
            <button
              type="button"
              className="reader-listen-v2__transport-button"
              onClick={onSkipBack}
              aria-label="Back 15 seconds"
            >
              <SkipBackIcon />
            </button>
            <button
              type="button"
              className="reader-listen-v2__transport-button reader-listen-v2__transport-button--primary"
              onClick={onPlayPause}
              disabled={isLoading}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              className="reader-listen-v2__transport-button"
              onClick={onSkipForward}
              aria-label="Forward 30 seconds"
            >
              <SkipForwardIcon />
            </button>
            <button
              type="button"
              className="reader-listen-v2__transport-button"
              onClick={onNext}
              disabled={!canGoNext}
              aria-label="Next"
            >
              <SkipNextIcon />
            </button>
          </div>

          <div className="reader-listen-v2__rail">
            <button
              type="button"
              className="reader-listen-v2__chip"
              onClick={onOpenVoice}
              aria-label="Choose voice"
            >
              <VoiceIcon />
              <span>{voiceLabel}</span>
              {providerBadge ? <em>{providerBadge}</em> : null}
            </button>
            <button
              type="button"
              className="reader-listen-v2__chip"
              onClick={onOpenQueue}
              aria-label="Open queue"
            >
              <QueueIcon />
              <span>{queueLength > 0 ? `${queuePosition}/${queueLength}` : "Queue"}</span>
            </button>
            <button
              type="button"
              className="reader-listen-v2__chip reader-listen-v2__chip--spark"
              onClick={onToggleGuide}
              aria-label="Open Seven"
            >
              <SparkIcon />
            </button>
            <button
              type="button"
              className="reader-listen-v2__speed"
              onClick={handleCycleSpeed}
              aria-label={`Playback speed ${speed}x`}
            >
              {speed}x
            </button>
          </div>
        </motion.section>
      ) : null}

      {showFocus && sheet === "queue" ? (
        <Sheet title="Queue" onClose={onCloseSheet}>
          <div className="reader-listen-v2__list">
            {queueItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`reader-listen-v2__list-item ${item.active ? "is-active" : ""}`}
                onClick={() => onSelectQueueItem?.(item.id)}
              >
                <span className="reader-listen-v2__list-title">{item.label}</span>
                {item.detail ? <span className="reader-listen-v2__list-detail">{item.detail}</span> : null}
              </button>
            ))}
          </div>
        </Sheet>
      ) : null}

      {showFocus && sheet === "voice" ? (
        <Sheet title="Voice" onClose={onCloseSheet}>
          <div className="reader-listen-v2__list">
            {voiceOptions.map((item) => (
              <button
                key={`${item.provider}-${item.voiceId || "default"}`}
                type="button"
                className={`reader-listen-v2__list-item ${item.active ? "is-active" : ""}`}
                onClick={() => onSelectVoice?.(item)}
              >
                <span className="reader-listen-v2__list-title">{item.label}</span>
                <span className="reader-listen-v2__list-detail">{item.providerLabel || item.provider}</span>
              </button>
            ))}
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}
