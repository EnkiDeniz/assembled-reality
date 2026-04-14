"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Kicker, SignalChip } from "@/components/shell/LoegosShell";
import styles from "@/components/dream/SectionDreamScreen.module.css";

const PACKET_ORDER = ["present_day_packet", "historical_replay_packet"];
const PACKET_LABELS = {
  present_day_packet: "Packet A",
  historical_replay_packet: "Packet B",
};

const PACKET_TITLES = {
  present_day_packet: "Frozen present-day benchmark",
  historical_replay_packet: "Replay Pilot 0",
};

const OVERALL_DECISION_OPTIONS = [
  {
    value: "widen_replay_lane",
    label: "Widen replay lane",
  },
  {
    value: "hold_replay_lane_fix_diagnostics_first",
    label: "Hold, fix diagnostics first",
  },
  {
    value: "hold_replay_lane_fix_grounding_first",
    label: "Hold, fix grounding first",
  },
  {
    value: "pilot_not_useful_yet",
    label: "Pilot not useful yet",
  },
];

const LATER_HISTORY_OPTIONS = [
  { value: "supported", label: "Supported later" },
  { value: "weakened", label: "Weakened later" },
  { value: "mixed", label: "Mixed later" },
  { value: "unclear", label: "Still unclear" },
];

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sentenceCase(value = "") {
  const normalized = normalizeText(value).replace(/_/g, " ");
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function buildEntryKey(packetKind = "", entryId = "") {
  return `${packetKind}:${entryId}`;
}

function indexEntries(entries = []) {
  return Object.fromEntries(
    entries.map((entry) => [buildEntryKey(entry.packetKind, entry.entryId), entry]),
  );
}

function packetCompletion(entries = [], drafts = {}) {
  const reviewed = entries.filter((entry) => isEntryReviewed(entry, drafts[buildEntryKey(entry.packetKind, entry.entryId)])).length;
  return {
    reviewed,
    total: entries.length,
  };
}

function isPacketA(entry) {
  return normalizeText(entry?.packetKind) === "present_day_packet";
}

function isEntryReviewed(entry, draft = {}) {
  const sharedRequired =
    draft?.honestyScore !== null &&
    draft?.honestyScore !== undefined &&
    draft?.understandabilityScore !== null &&
    draft?.understandabilityScore !== undefined &&
    draft?.actionabilityScore !== null &&
    draft?.actionabilityScore !== undefined &&
    draft?.convergenceValueScore !== null &&
    draft?.convergenceValueScore !== undefined;

  if (!sharedRequired) {
    return false;
  }

  if (isPacketA(entry)) {
    return (
      draft?.specificityScore !== null &&
      draft?.specificityScore !== undefined &&
      draft?.wouldUseAgainScore !== null &&
      draft?.wouldUseAgainScore !== undefined &&
      Boolean(normalizeText(draft?.moveWouldTakeNow))
    );
  }

  return Boolean(normalizeText(draft?.laterHistoryJudgment));
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function formatRunSummary(run = null) {
  if (!run) return "No repeat details recorded.";
  if (!run.ok) {
    return `Run ${Number(run.runIndex) + 1}: error ${sentenceCase(run.errorKind || "unknown")}`;
  }

  return `Run ${Number(run.runIndex) + 1}: ${sentenceCase(
    run.compilerRead?.outcomeClass || "unknown",
  )} / ${sentenceCase(run.compilerRead?.verdict?.readDisposition || "unknown")}`;
}

function ScoreField({ label, value, onChange }) {
  return (
    <div className={styles.replayReviewScoreField}>
      <span>{label}</span>
      <div className={styles.replayReviewScoreScale}>
        {[0, 1, 2, 3].map((score) => (
          <button
            key={score}
            type="button"
            className={`${styles.replayReviewScoreButton} ${value === score ? styles.replayReviewScoreButtonActive : ""}`}
            onClick={() => onChange(score)}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

function EntryStatusBadge({ complete = false }) {
  return (
    <SignalChip tone={complete ? "brand" : "neutral"}>
      {complete ? "Reviewed" : "Open"}
    </SignalChip>
  );
}

function ReviewField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 4,
}) {
  return (
    <label className={styles.replayReviewField}>
      <span>{label}</span>
      {multiline ? (
        <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} />
      ) : (
        <input value={value} onChange={onChange} placeholder={placeholder} />
      )}
    </label>
  );
}

function PacketMetricList({ packet = null }) {
  const metrics = packet?.summaryMetrics || {};
  const items = [
    packet.packetKind === "present_day_packet"
      ? { label: "Heuristic next-move signal", value: formatPercent(metrics.meaningfulNextMoveSignalRate) }
      : { label: "Stable useful rate", value: formatPercent(metrics.stableUsefulRate) },
    { label: "Repeat stability", value: formatPercent(metrics.repeatStabilityRate) },
    { label: "Classification stability", value: formatPercent(metrics.classificationStabilityRate) },
    packet.packetKind === "historical_replay_packet"
      ? { label: "Grounding pass rate", value: formatPercent(metrics.groundingPassRate) }
      : { label: "No-fake-compile rate", value: formatPercent(metrics.noFakeCompileRate) },
  ].filter(Boolean);

  return (
    <ul className={styles.replayReviewMetricList}>
      {items.map((item) => (
        <li key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </li>
      ))}
    </ul>
  );
}

export default function ReplayReviewPanel({
  active = false,
  refreshToken = 0,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewState, setReviewState] = useState(null);
  const [activePacketKind, setActivePacketKind] = useState("present_day_packet");
  const [packetIndices, setPacketIndices] = useState({
    present_day_packet: 0,
    historical_replay_packet: 0,
  });
  const [entryDrafts, setEntryDrafts] = useState({});
  const [overallDraft, setOverallDraft] = useState({
    overallDecision: "",
    overallSummary: "",
    status: "in_progress",
  });
  const [contextOpen, setContextOpen] = useState(false);
  const [saveState, setSaveState] = useState({ kind: "idle", message: "" });

  const entrySaveTimerRef = useRef(null);
  const sessionSaveTimerRef = useRef(null);
  const loadRequestIdRef = useRef(0);
  const saveRequestIdRef = useRef(0);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let cancelled = false;
    const requestId = ++loadRequestIdRef.current;

    async function loadReview() {
      setLoading(true);
      setError("");
      setSaveState({ kind: "idle", message: "" });

      try {
        const currentResponse = await fetch("/api/replay-review/current", {
          method: "GET",
          cache: "no-store",
        });
        const currentPayload = await currentResponse.json().catch(() => null);
        if (!currentResponse.ok || !currentPayload?.packetA || !currentPayload?.packetB) {
          throw new Error(currentPayload?.error || "Replay review is unavailable right now.");
        }

        if (cancelled || loadRequestIdRef.current !== requestId) {
          return;
        }

        const bootstrapResponse = await fetch("/api/replay-review/session", {
          method: "POST",
          cache: "no-store",
        });
        const bootstrapPayload = await bootstrapResponse.json().catch(() => null);
        if (!bootstrapResponse.ok || !bootstrapPayload?.packetA || !bootstrapPayload?.packetB) {
          throw new Error(bootstrapPayload?.error || "Replay review session could not be created.");
        }

        if (cancelled || loadRequestIdRef.current !== requestId) {
          return;
        }

        const nextState = {
          packetA: bootstrapPayload.packetA,
          packetB: bootstrapPayload.packetB,
          reviewKey: bootstrapPayload.reviewKey,
          session: bootstrapPayload.session,
        };

        setReviewState(nextState);
        setEntryDrafts(indexEntries(bootstrapPayload.session?.entries || []));
        setOverallDraft({
          overallDecision: bootstrapPayload.session?.overallDecision || "",
          overallSummary: bootstrapPayload.session?.overallSummary || "",
          status: bootstrapPayload.session?.status || "in_progress",
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Replay review is unavailable right now.",
          );
        }
      } finally {
        if (!cancelled && loadRequestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    }

    void loadReview();

    return () => {
      cancelled = true;
    };
  }, [active, refreshToken]);

  useEffect(() => {
    return () => {
      if (entrySaveTimerRef.current) {
        clearTimeout(entrySaveTimerRef.current);
      }
      if (sessionSaveTimerRef.current) {
        clearTimeout(sessionSaveTimerRef.current);
      }
    };
  }, []);

  const packets = useMemo(() => {
    if (!reviewState) return [];
    return [reviewState.packetA, reviewState.packetB].filter(Boolean);
  }, [reviewState]);

  const activePacket =
    packets.find((packet) => packet.packetKind === activePacketKind) || packets[0] || null;
  const activeEntries = activePacket?.entries || [];
  const activeIndex = Math.min(
    packetIndices[activePacket?.packetKind || "present_day_packet"] || 0,
    Math.max(activeEntries.length - 1, 0),
  );
  const activeEntry = activeEntries[activeIndex] || null;
  const activeEntryKey = activeEntry
    ? buildEntryKey(activeEntry.packetKind, activeEntry.entryId)
    : "";
  const activeEntryDraft = activeEntry ? entryDrafts[activeEntryKey] || {} : {};
  const packetCompletionMap = Object.fromEntries(
    packets.map((packet) => [packet.packetKind, packetCompletion(packet.entries, entryDrafts)]),
  );
  const allEntriesReviewed =
    packets.length > 0 &&
    packets.every((packet) => packetCompletionMap[packet.packetKind]?.reviewed === packet.entries.length);

  function setPacketIndex(packetKind, nextIndex) {
    setPacketIndices((current) => ({
      ...current,
      [packetKind]: nextIndex,
    }));
  }

  function scheduleEntrySave(packetKind, entryId, nextDraft) {
    if (entrySaveTimerRef.current) {
      clearTimeout(entrySaveTimerRef.current);
    }

    entrySaveTimerRef.current = setTimeout(async () => {
      const requestId = ++saveRequestIdRef.current;
      setSaveState({ kind: "saving", message: "Saving entry review…" });

      try {
        const response = await fetch("/api/replay-review/entry", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entryId,
            packetKind,
            ...nextDraft,
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.entry) {
          throw new Error(payload?.error || "Replay review entry could not be saved.");
        }

        if (saveRequestIdRef.current === requestId) {
          setSaveState({ kind: "saved", message: "Entry review saved." });
        }
      } catch (saveError) {
        setSaveState({
          kind: "error",
          message: saveError instanceof Error ? saveError.message : "Replay review entry could not be saved.",
        });
      }
    }, 280);
  }

  function scheduleSessionSave(nextDraft, options = {}) {
    if (sessionSaveTimerRef.current) {
      clearTimeout(sessionSaveTimerRef.current);
    }

    sessionSaveTimerRef.current = setTimeout(async () => {
      setSaveState({
        kind: "saving",
        message: options.complete ? "Saving founder decision…" : "Saving review summary…",
      });

      try {
        const response = await fetch("/api/replay-review/session", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            overallDecision: nextDraft.overallDecision,
            overallSummary: nextDraft.overallSummary,
            status: options.complete ? "completed" : nextDraft.status,
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.session) {
          throw new Error(payload?.error || "Replay review summary could not be saved.");
        }

        setReviewState((current) =>
          current
            ? {
                ...current,
                session: payload.session,
              }
            : current,
        );
        setOverallDraft({
          overallDecision: payload.session.overallDecision || "",
          overallSummary: payload.session.overallSummary || "",
          status: payload.session.status || "in_progress",
        });
        setSaveState({
          kind: "saved",
          message: options.complete ? "Founder review completed." : "Review summary saved.",
        });
      } catch (saveError) {
        setSaveState({
          kind: "error",
          message: saveError instanceof Error ? saveError.message : "Replay review summary could not be saved.",
        });
      }
    }, options.complete ? 0 : 320);
  }

  function updateEntryDraft(patch) {
    if (!activeEntry) return;

    setEntryDrafts((current) => {
      const key = buildEntryKey(activeEntry.packetKind, activeEntry.entryId);
      const nextDraft = {
        ...current[key],
        ...patch,
      };
      scheduleEntrySave(activeEntry.packetKind, activeEntry.entryId, nextDraft);
      return {
        ...current,
        [key]: nextDraft,
      };
    });
  }

  function updateOverallDraft(patch, options = {}) {
    setOverallDraft((current) => {
      const nextDraft = {
        ...current,
        ...patch,
      };
      scheduleSessionSave(nextDraft, options);
      return nextDraft;
    });
  }

  if (!active && !loading && !reviewState && !error) {
    return null;
  }

  return (
    <section
      className={styles.replayReviewPanel}
      data-testid="dream-replay-review-panel"
      aria-live="polite"
    >
      <div className={styles.replayReviewHead}>
        <div className={styles.replayReviewIdentity}>
          <Kicker tone={error ? "flagged" : "brand"}>Replay Review</Kicker>
          <strong>Founder review for the live replay lane.</strong>
        </div>
        {reviewState?.session?.status ? (
          <SignalChip tone={reviewState.session.status === "completed" ? "brand" : "neutral"}>
            {sentenceCase(reviewState.session.status)}
          </SignalChip>
        ) : null}
      </div>

      {loading ? <p className={styles.compilerReadStatus}>Loading replay review…</p> : null}
      {error ? (
        <div className={styles.compilerReadError} role="alert" data-testid="dream-replay-review-error">
          <strong>Replay review could not load.</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {reviewState && activePacket ? (
        <div className={styles.replayReviewLayout}>
          <aside className={styles.replayReviewRail}>
            <div className={styles.replayReviewPacketSwitch}>
              {PACKET_ORDER.map((packetKind) => {
                const packet = packets.find((candidate) => candidate.packetKind === packetKind);
                if (!packet) return null;
                const completion = packetCompletionMap[packetKind];
                return (
                  <button
                    key={packetKind}
                    type="button"
                    className={`${styles.replayReviewPacketButton} ${activePacketKind === packetKind ? styles.replayReviewPacketButtonActive : ""}`}
                    onClick={() => {
                      setActivePacketKind(packetKind);
                      setContextOpen(false);
                    }}
                    data-testid={`dream-replay-review-packet-${packetKind}`}
                  >
                    <div>
                      <strong>{PACKET_LABELS[packetKind]}</strong>
                      <span>{PACKET_TITLES[packetKind]}</span>
                    </div>
                    <SignalChip tone="neutral">
                      {completion.reviewed}/{completion.total}
                    </SignalChip>
                  </button>
                );
              })}
            </div>

            <div className={styles.replayReviewRailCard}>
              <Kicker tone="neutral">Packet status</Kicker>
              <strong>{activePacket.title}</strong>
              <PacketMetricList packet={activePacket} />
              {activePacket.recommendation ? (
                <p className={styles.replayReviewRailNote}>{activePacket.recommendation}</p>
              ) : null}
            </div>

            <div className={styles.replayReviewEntryList}>
              {activeEntries.map((entry, index) => {
                const completion = isEntryReviewed(
                  entry,
                  entryDrafts[buildEntryKey(entry.packetKind, entry.entryId)],
                );
                return (
                  <button
                    key={entry.entryId}
                    type="button"
                    className={`${styles.replayReviewEntryButton} ${index === activeIndex ? styles.replayReviewEntryButtonActive : ""}`}
                    onClick={() => setPacketIndex(activePacket.packetKind, index)}
                  >
                    <div className={styles.replayReviewEntryButtonCopy}>
                      <strong>{entry.label}</strong>
                      <span>{sentenceCase(entry.category)}</span>
                    </div>
                    <EntryStatusBadge complete={completion} />
                  </button>
                );
              })}
            </div>
          </aside>

          <div className={styles.replayReviewMain}>
            {activeEntry ? (
              <>
                <div className={styles.replayReviewEntryHead}>
                  <div className={styles.replayReviewEntryIdentity}>
                    <Kicker tone="neutral">{PACKET_LABELS[activePacket.packetKind]}</Kicker>
                    <strong data-testid="dream-replay-review-entry-title">{activeEntry.label}</strong>
                    <p>{activeEntry.sourcePath}</p>
                  </div>
                  <div className={styles.replayReviewChips}>
                    <SignalChip tone="neutral">{sentenceCase(activeEntry.category)}</SignalChip>
                    {activeEntry.outcomeClass ? (
                      <SignalChip tone="neutral">{sentenceCase(activeEntry.outcomeClass)}</SignalChip>
                    ) : null}
                    {activeEntry.readDisposition ? (
                      <SignalChip tone="neutral">{sentenceCase(activeEntry.readDisposition)}</SignalChip>
                    ) : null}
                  </div>
                </div>

                {activeEntry.category === "honest_limit" ? (
                  <div className={styles.replayReviewCallout} data-testid="dream-replay-review-honest-limit">
                    <strong>Honest limit</strong>
                    <span>This entry is being surfaced as restraint, not failure.</span>
                  </div>
                ) : null}

                {activeEntry.currentSnapshotException ? (
                  <div className={styles.replayReviewCallout} data-testid="dream-replay-review-snapshot-exception">
                    <strong>Current-snapshot exception</strong>
                    <span>{activeEntry.currentSnapshotException.reason}</span>
                  </div>
                ) : null}

                <div className={styles.replayReviewSection}>
                  <div className={styles.replayReviewSectionHead}>
                    <Kicker tone="neutral">Finding</Kicker>
                    <span>Primary finding and proposed next moves.</span>
                  </div>
                  <strong>{activeEntry.primaryFinding || "No primary finding recorded."}</strong>
                  {activeEntry.groundingRejectedClaimCount > 0 ? (
                    <p className={styles.replayReviewMetaCopy}>
                      Grounding rejected {activeEntry.groundingRejectedClaimCount} claim
                      {activeEntry.groundingRejectedClaimCount === 1 ? "" : "s"} before interpretation.
                    </p>
                  ) : null}
                  <ul className={styles.compilerReadList}>
                    {(activeEntry.nextMoves || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.replayReviewSection}>
                  <div className={styles.replayReviewSectionHead}>
                    <Kicker tone="neutral">Founder scoring</Kicker>
                    <span>
                      {isPacketA(activeEntry)
                        ? "Score the present-day usefulness of this read."
                        : "Score the historical honesty and convergence value of this replay."}
                    </span>
                  </div>
                  <div className={styles.replayReviewScoreGrid}>
                    <ScoreField
                      label="Honesty"
                      value={activeEntryDraft.honestyScore}
                      onChange={(score) => updateEntryDraft({ honestyScore: score })}
                    />
                    <ScoreField
                      label="Understandable"
                      value={activeEntryDraft.understandabilityScore}
                      onChange={(score) => updateEntryDraft({ understandabilityScore: score })}
                    />
                    {isPacketA(activeEntry) ? (
                      <ScoreField
                        label="Specific"
                        value={activeEntryDraft.specificityScore}
                        onChange={(score) => updateEntryDraft({ specificityScore: score })}
                      />
                    ) : null}
                    <ScoreField
                      label="Actionable"
                      value={activeEntryDraft.actionabilityScore}
                      onChange={(score) => updateEntryDraft({ actionabilityScore: score })}
                    />
                    <ScoreField
                      label="Convergence value"
                      value={activeEntryDraft.convergenceValueScore}
                      onChange={(score) => updateEntryDraft({ convergenceValueScore: score })}
                    />
                    {isPacketA(activeEntry) ? (
                      <ScoreField
                        label="Would use again"
                        value={activeEntryDraft.wouldUseAgainScore}
                        onChange={(score) => updateEntryDraft({ wouldUseAgainScore: score })}
                      />
                    ) : null}
                  </div>

                  {isPacketA(activeEntry) ? (
                    <ReviewField
                      label="What move would you take now because of this read?"
                      value={activeEntryDraft.moveWouldTakeNow || ""}
                      onChange={(event) => updateEntryDraft({ moveWouldTakeNow: event.target.value })}
                      placeholder="Name the move this read would cause you to take."
                      multiline
                      rows={4}
                    />
                  ) : (
                    <>
                      <label className={styles.replayReviewField}>
                        <span>Did later history support or weaken the read?</span>
                        <select
                          value={activeEntryDraft.laterHistoryJudgment || ""}
                          onChange={(event) =>
                            updateEntryDraft({ laterHistoryJudgment: event.target.value })
                          }
                        >
                          <option value="">Choose one…</option>
                          {LATER_HISTORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {activeEntry.repeatDrift?.isDrifting ? (
                        <ReviewField
                          label="What changed across runs, and does that feel like honest uncertainty?"
                          value={activeEntryDraft.driftAssessment || ""}
                          onChange={(event) => updateEntryDraft({ driftAssessment: event.target.value })}
                          placeholder="Explain whether the drift feels diagnostic or sloppy."
                          multiline
                          rows={4}
                        />
                      ) : null}
                    </>
                  )}

                  <ReviewField
                    label="Reviewer notes"
                    value={activeEntryDraft.notes || ""}
                    onChange={(event) => updateEntryDraft({ notes: event.target.value })}
                    placeholder="Capture the judgment you want to preserve."
                    multiline
                    rows={4}
                  />
                </div>

                <div className={styles.replayReviewSection}>
                  <div className={styles.replayReviewSectionHead}>
                    <Kicker tone="neutral">Repeat stability</Kicker>
                    <span>
                      {activeEntry.repeatStability?.summary || "No repeat summary recorded."}
                    </span>
                  </div>
                  {activeEntry.repeatDrift?.isDrifting ? (
                    <div className={styles.replayReviewDrift}>
                      <p>
                        Changed fields:{" "}
                        {activeEntry.repeatDrift.changedFields.length
                          ? activeEntry.repeatDrift.changedFields
                              .map((field) => sentenceCase(field))
                              .join(", ")
                          : "repeat signature drift"}
                      </p>
                      <ul className={styles.compilerReadList}>
                        <li>{formatRunSummary(activeEntry.repeatDrift.runA)}</li>
                        <li>{formatRunSummary(activeEntry.repeatDrift.runB)}</li>
                      </ul>
                    </div>
                  ) : (
                    <p className={styles.replayReviewMetaCopy}>This entry stayed stable across repeats.</p>
                  )}
                </div>

                <div className={styles.replayReviewActions}>
                  <button
                    type="button"
                    className={styles.secondaryControl}
                    onClick={() => setPacketIndex(activePacket.packetKind, Math.max(activeIndex - 1, 0))}
                    disabled={activeIndex === 0}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryControl}
                    onClick={() =>
                      setPacketIndex(
                        activePacket.packetKind,
                        Math.min(activeIndex + 1, activeEntries.length - 1),
                      )
                    }
                    disabled={activeIndex >= activeEntries.length - 1}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => setContextOpen((current) => !current)}
                    data-testid="dream-replay-review-context-toggle"
                  >
                    {contextOpen ? "Hide context" : "Show context"}
                  </button>
                </div>

                {contextOpen ? (
                  <div className={styles.replayReviewContext} data-testid="dream-replay-review-context">
                    <div className={styles.replayReviewSectionHead}>
                      <Kicker tone="neutral">Context</Kicker>
                      <span>Dossier/context stays secondary to the packet review.</span>
                    </div>
                    {activeEntry.lookAheadSummary ? (
                      <div className={styles.replayReviewContextBlock}>
                        <strong>Look-ahead</strong>
                        <ul className={styles.compilerReadList}>
                          <li>Mode: {sentenceCase(activeEntry.lookAheadSummary.mode || "unknown")}</li>
                          <li>Exists at HEAD: {activeEntry.lookAheadSummary.currentHeadExists ? "yes" : "no"}</li>
                          {activeEntry.lookAheadSummary.currentHeadPath ? (
                            <li>Current path: {activeEntry.lookAheadSummary.currentHeadPath}</li>
                          ) : null}
                          {activeEntry.lookAheadSummary.renamedAtHead ? (
                            <li>Renamed at HEAD: {activeEntry.lookAheadSummary.renamedAtHead}</li>
                          ) : null}
                          {activeEntry.lookAheadSummary.pinExceptionReason ? (
                            <li>Pin exception: {activeEntry.lookAheadSummary.pinExceptionReason}</li>
                          ) : null}
                          {Array.isArray(activeEntry.lookAheadSummary.nextCommits) &&
                          activeEntry.lookAheadSummary.nextCommits.length ? (
                            <li>
                              Next commits:{" "}
                              {activeEntry.lookAheadSummary.nextCommits
                                .map((item) => `${item.commitHash.slice(0, 7)} ${item.subject}`)
                                .join("; ")}
                            </li>
                          ) : (
                            <li>Next commits: none recorded in this replay summary.</li>
                          )}
                        </ul>
                        {!Array.isArray(activeEntry.lookAheadSummary.nextCommits) ||
                        !activeEntry.lookAheadSummary.nextCommits.length ? (
                          <p className={styles.replayReviewMetaCopy}>
                            Look-ahead is still thin here; treat it as limited evidence, not a full historical answer.
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className={styles.replayReviewContextBlock}>
                      <strong>Artifact refs</strong>
                      <ul className={styles.compilerReadList}>
                        <li>{activeEntry.detailArtifactRefs.packetJsonPath}</li>
                        <li>{activeEntry.detailArtifactRefs.packetMarkdownPath}</li>
                        <li>{activeEntry.detailArtifactRefs.reviewPacketPath}</li>
                        <li>{activeEntry.detailArtifactRefs.manifestPath}</li>
                      </ul>
                    </div>

                    {(activeEntry.trustCaveats?.length || activeEntry.promotionReasons?.length || activeEntry.sourceTags?.length) ? (
                      <div className={styles.replayReviewContextBlock}>
                        <strong>Review notes</strong>
                        <ul className={styles.compilerReadList}>
                          {(activeEntry.trustCaveats || []).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                          {(activeEntry.sourceTags || []).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                          {(activeEntry.promotionReasons || []).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className={styles.stageHint}>No replay review entries are available.</p>
            )}

            <div className={styles.replayReviewFooter}>
              <span data-testid="dream-replay-review-save-status">
                {saveState.message || "Autosave ready."}
              </span>
            </div>

            {allEntriesReviewed ? (
              <div className={styles.replayReviewCompletion} data-testid="dream-replay-review-completion">
                <div className={styles.replayReviewSectionHead}>
                  <Kicker tone="brand">Founder decision</Kicker>
                  <span>Finish the packet sequence with one durable judgment.</span>
                </div>

                <label className={styles.replayReviewField}>
                  <span>Overall decision</span>
                  <select
                    value={overallDraft.overallDecision}
                    onChange={(event) => updateOverallDraft({ overallDecision: event.target.value })}
                  >
                    <option value="">Choose one…</option>
                    {OVERALL_DECISION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <ReviewField
                  label="Overall summary"
                  value={overallDraft.overallSummary}
                  onChange={(event) => updateOverallDraft({ overallSummary: event.target.value })}
                  placeholder="Summarize what the founder should remember from this round."
                  multiline
                  rows={5}
                />

                <button
                  type="button"
                  className={styles.actionButton}
                  disabled={!normalizeText(overallDraft.overallDecision) || !normalizeText(overallDraft.overallSummary)}
                  onClick={() => updateOverallDraft({}, { complete: true })}
                >
                  Mark founder review complete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
