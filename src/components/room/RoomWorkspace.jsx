"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Headphones,
  Plus,
  SendHorizontal,
  Upload,
} from "lucide-react";
import styles from "@/components/room/RoomWorkspace.module.css";
import LoegosShell, {
  PulseStrip,
  Surface as ShellSurface,
} from "@/components/shell/LoegosShell";
import {
  deriveRoomTerrainPresentation,
  getMirrorRegionRole,
  getRoomShapeRole,
  getSegmentShapeRole,
} from "@/components/room/roomDesignSystem";
import { buildOperateAuditPrompt } from "@/lib/operate";
import {
  clearDreamBridgePayload,
  loadDreamBridgePayload,
  normalizeDreamBridgePayload,
  saveDreamBridgePayload,
} from "@/lib/dream-bridge";
import { buildDreamDocumentRecord } from "@/lib/dream";
import {
  listDreamDocuments,
  saveDreamDocument,
  setActiveDreamDocument,
} from "@/lib/dream-storage";
import {
  buildWorkingEchoStripStateFromRoomView,
  normalizeSectionId,
} from "@/lib/loegos-shell";
import {
  clearRuntimeSurfaceResumeLibrary,
  loadRuntimeSurfaceResumeState,
  saveRuntimeSurfaceResumeState,
} from "@/lib/runtime-surface-resume";

const DEFAULT_PROJECT_KEY = "default-project";
const ROOM_DRAFT_PREFIX = "assembled-reality:room-draft:v1";
const ROOM_IDLE_RESUME_MS = 15 * 60 * 1000;
const BRIDGE_DISMISS_RECOVERY_MS = 8_000;

const RECEIPT_RESULT_OPTIONS = [
  { value: "matched", label: "Matched" },
  { value: "surprised", label: "Surprised" },
  { value: "contradicted", label: "Contradicted" },
];

function normalizeText(value = "") {
  return String(value || "")
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLongForm(value = "") {
  return String(value || "").trim();
}

function loadSessionDraft(key = "") {
  if (typeof window === "undefined" || !normalizeText(key)) return "";
  try {
    return normalizeLongForm(window.sessionStorage.getItem(key));
  } catch {
    return "";
  }
}

function saveSessionDraft(key = "", value = "") {
  if (typeof window === "undefined" || !normalizeText(key)) return;
  try {
    if (!normalizeLongForm(value)) {
      window.sessionStorage.removeItem(key);
      return;
    }
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore draft persistence failures and keep the room usable.
  }
}

function getRoomDraftKey(projectKey = "", sessionId = "") {
  const normalizedProjectKey = normalizeText(projectKey) || DEFAULT_PROJECT_KEY;
  const normalizedSessionId = normalizeText(sessionId);
  if (!normalizedSessionId) return "";
  return `${ROOM_DRAFT_PREFIX}:${normalizedProjectKey}:${normalizedSessionId}`;
}

function hasMeaningfulConversation(view = null) {
  const messages = Array.isArray(view?.messages) ? view.messages : [];
  const hasAssistantReply = messages.some(
    (message) =>
      normalizeText(message?.role).toLowerCase() === "assistant" &&
      normalizeText(message?.content),
  );
  const workingEchoStripState = buildWorkingEchoStripStateFromRoomView(view);
  return Boolean(hasAssistantReply || !workingEchoStripState?.dormant);
}

function buildDreamFilenameFromRoomSource(document = null) {
  const originalFilename = normalizeText(document?.originalFilename);
  if (originalFilename) return originalFilename;
  const title = normalizeText(document?.title);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${slug || "room-source"}.md`;
}

function buildWorkspaceHref(
  projectKey = "",
  { sessionId = "", documentKey = "", adjacent = "" } = {},
) {
  const params = new URLSearchParams();
  const normalizedProjectKey = normalizeText(projectKey);
  const normalizedSessionId = normalizeText(sessionId);
  const normalizedDocumentKey = normalizeText(documentKey);
  const normalizedAdjacent = normalizeText(adjacent).toLowerCase();
  if (normalizedProjectKey && normalizedProjectKey !== DEFAULT_PROJECT_KEY) {
    params.set("project", normalizedProjectKey);
  }
  if (normalizedSessionId) params.set("sessionId", normalizedSessionId);
  if (normalizedDocumentKey) params.set("document", normalizedDocumentKey);
  if (normalizedAdjacent) params.set("adjacent", normalizedAdjacent);
  const query = params.toString();
  return query ? `/workspace?${query}` : "/workspace";
}

function buildWitnessHref(projectKey = "", sessionId = "", documentKey = "", adjacent = "witness") {
  return buildWorkspaceHref(projectKey, {
    sessionId,
    documentKey,
    adjacent,
  });
}

function extractDocumentKeyFromWorkspaceHref(href = "") {
  const normalized = normalizeText(href);
  if (!normalized) return "";
  const queryIndex = normalized.indexOf("?");
  if (queryIndex === -1) return "";
  const params = new URLSearchParams(normalized.slice(queryIndex + 1));
  return normalizeText(params.get("document") || params.get("documentKey") || "");
}

function splitParagraphs(text = "") {
  return String(text || "")
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatRelativeSessionLabel(value = "") {
  const raw = normalizeText(value);
  if (!raw) return "";
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw;

  const deltaMinutes = Math.max(0, Math.round((Date.now() - parsed) / 60000));
  if (deltaMinutes < 1) return "just now";
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;
  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays}d ago`;
}

function formatOperateTimestamp(value = "") {
  const raw = normalizeText(value);
  if (!raw) return "";
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function hasProposalContent(roomPayload = null) {
  const turnMode = normalizeText(roomPayload?.turnMode).toLowerCase();
  const segments = Array.isArray(roomPayload?.segments) ? roomPayload.segments : [];
  const isProposalTurn = turnMode ? turnMode === "proposal" : segments.length > 0 || Boolean(roomPayload?.receiptKit);
  return Boolean(
    isProposalTurn && (segments.length > 0 || roomPayload?.receiptKit),
  );
}

function getArtifactLabel(type = "") {
  const normalized = normalizeText(type).toLowerCase();
  if (normalized === "upload") return "Upload";
  if (normalized === "paste") return "Paste";
  if (normalized === "link") return "Link";
  if (normalized === "draft_message") return "Draft Message";
  if (normalized === "checklist") return "Checklist";
  if (normalized === "compare") return "Compare";
  return "Receipt Kit";
}

function findReturnForReceipt(view = null, receiptKitId = "") {
  const normalizedReceiptKitId = normalizeText(receiptKitId);
  const items = Array.isArray(view?.recentReturns) ? view.recentReturns : [];
  return items.find((item) => normalizeText(item?.receiptKitId) === normalizedReceiptKitId) || null;
}

function getToneClass(tone = "neutral") {
  return (
    styles[`tone${String(tone || "neutral").replace(/^\w/, (char) => char.toUpperCase())}`] || styles.toneNeutral
  );
}

function getSegmentTone(domain = "") {
  const shapeRole = getSegmentShapeRole(domain);
  return {
    shapeRole,
    toneClass: getToneClass(shapeRole.tone),
  };
}

function normalizePreviewStatus(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  if (["blocked", "superseded", "active", "applied"].includes(normalized)) {
    return normalized;
  }
  return "none";
}

function getPreviewStatusCopy(status = "none") {
  const normalized = normalizePreviewStatus(status);
  if (normalized === "active") {
    return {
      label: "Preview",
      detail: "Visible now. Not canonical until applied.",
      tone: "brand",
    };
  }
  if (normalized === "blocked") {
    return {
      label: "Blocked",
      detail: "Visible, but not lawful to apply.",
      tone: "flagged",
    };
  }
  if (normalized === "superseded") {
    return {
      label: "Earlier Preview",
      detail: "Kept in history. No longer the active preview.",
      tone: "neutral",
    };
  }
  if (normalized === "applied") {
    return {
      label: "Applied",
      detail: "This preview already changed the box canon.",
      tone: "grounded",
    };
  }
  return {
    label: "Conversation",
    detail: "",
    tone: "neutral",
  };
}

function getPreviewStatusClass(status = "none") {
  const normalized = normalizePreviewStatus(status);
  if (normalized === "active") return styles.previewStatusActive;
  if (normalized === "blocked") return styles.previewStatusBlocked;
  if (normalized === "superseded") return styles.previewStatusSuperseded;
  if (normalized === "applied") return styles.previewStatusApplied;
  return "";
}

function isActivePreviewMessage(view = null, message = null) {
  const activeMessageId = normalizeText(view?.activePreview?.assistantMessageId);
  return Boolean(activeMessageId && activeMessageId === normalizeText(message?.id));
}

function Kicker({ children, tone = "neutral", className = "" }) {
  return <span className={`${styles.kicker} ${getToneClass(tone)} ${className}`}>{children}</span>;
}

function ShapeGlyph({ role = "other", className = "" }) {
  const shapeRole = getRoomShapeRole(role);
  if (!shapeRole.glyph) return null;
  return (
    <span className={`${styles.shapeGlyph} ${getToneClass(shapeRole.tone)} ${className}`} aria-hidden="true">
      {shapeRole.glyph}
    </span>
  );
}

function SignalDot({ tone = "neutral", pulse = false, className = "" }) {
  return (
    <span
      className={`${styles.signalDot} ${styles[`dotTone${String(tone || "neutral").replace(/^\w/, (char) => char.toUpperCase())}`] || styles.dotToneNeutral} ${pulse ? styles.signalDotPulse : ""} ${className}`}
      aria-hidden="true"
    />
  );
}

function RatioBar({ ratio = 0.5, className = "" }) {
  const boundedRatio = Math.max(0, Math.min(1, Number.isFinite(Number(ratio)) ? Number(ratio) : 0.5));
  return (
    <div className={`${styles.mirrorRatio} ${className}`}>
      <ShapeGlyph role="evidence" className={styles.mirrorRatioGlyph} />
      <div className={styles.mirrorRatioTrack}>
        <div
          className={styles.mirrorRatioFill}
          style={{ width: `${Math.round(boundedRatio * 100)}%` }}
        />
      </div>
      <ShapeGlyph role="story" className={`${styles.mirrorRatioGlyph} ${styles.mirrorRatioGlyphStory}`} />
    </div>
  );
}

function StatusChip({ view, floating = false }) {
  const terrain = deriveRoomTerrainPresentation({
    fieldState: view?.fieldState,
    loopState: view?.workingEcho?.loopState,
  });
  const terrainClassMap = {
    open: styles.terrainFog,
    contested: styles.terrainFractured,
    awaiting_return: styles.terrainAwaiting,
  };
  const terrainClass =
    terrainClassMap[terrain.key] ||
    styles[`terrain${String(terrain.key || "fog").replace(/^\w/, (char) => char.toUpperCase())}`] ||
    styles.terrainFog;

  return (
    <span
      data-testid="room-field-chip"
      className={`${styles.fieldChip} ${terrainClass} ${floating ? styles.fieldChipFloating : ""}`}
      aria-label={`${terrain.canonicalLabel}. ${terrain.description}`}
      title={terrain.description}
    >
      <SignalDot
        tone={terrain.tone}
        pulse={terrain.key === "awaiting" || terrain.key === "awaiting_return"}
        className={styles.fieldDot}
      />
      <span className={styles.fieldChipLabel}>{terrain.canonicalLabel || "Open"}</span>
    </span>
  );
}

function ThreadIdentityBar({
  view,
  onOpenThreads,
  onNewConversation,
  canStartFresh = false,
  contextActionClassName = "",
}) {
  const roomTitle = normalizeText(view?.session?.title) || "Conversation";
  const roomLabel = normalizeText(view?.project?.title) || "Current room";
  const sessionCount = Array.isArray(view?.sessions) ? view.sessions.length : 0;
  const sessionLabel =
    sessionCount > 0 ? `${sessionCount} conversation${sessionCount === 1 ? "" : "s"}` : "Start fresh";

  return (
    <div className={styles.threadIdentityBar} data-testid="room-thread-identity">
      <div className={styles.threadIdentityCopy}>
        <Kicker tone="neutral">Room</Kicker>
        <strong>{roomTitle}</strong>
        <span>{roomLabel}</span>
      </div>

      <div className={styles.threadIdentityActions}>
        {view?.fieldState ? <StatusChip view={view} /> : null}
        {canStartFresh ? (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onNewConversation}
            data-testid="room-new-conversation"
          >
            <Plus size={14} />
            New Conversation
          </button>
        ) : null}
        <button
          type="button"
          className={`${styles.contextButton} ${contextActionClassName}`.trim()}
          onClick={onOpenThreads}
          data-testid="room-open-context"
        >
          <span>Conversations</span>
          <small>{sessionLabel}</small>
        </button>
      </div>
    </div>
  );
}

function DreamBridgeNotice({ payload, onUse, onDismiss }) {
  if (!payload?.documentId) return null;

  const kind = normalizeText(payload?.kind).toLowerCase();
  const state = normalizeText(payload?.state).toLowerCase() || "pending";
  const sourceLabel =
    normalizeText(payload?.sourceLabel) ||
    normalizeText(payload?.documentTitle) ||
    "Library document";
  const readSummary = payload?.readSummary || null;
  const excerpt =
    normalizeText(readSummary?.primaryFinding) ||
    normalizeText(payload?.excerpt) ||
    "Passage carried from Library.";
  const kindLabel =
    kind === "witness"
      ? "Witness"
      : kind === "note"
        ? "Note"
        : kind === "read_summary"
          ? "Read summary"
          : "Passage";
  const anchorLabel = normalizeText(payload?.anchor);
  const versionLabel = normalizeText(payload?.versionLabel);
  const stateLabel =
    state === "armed"
      ? "Armed"
      : state === "sent"
        ? "Used in Room"
        : "Pending";
  const stateCopy =
    state === "armed"
      ? "Armed: travels with your next turn."
      : "Pending: available but not active.";
  const provenanceLine =
    kind === "read_summary"
      ? "Read summary from Library"
      : anchorLabel
        ? "Traveling with source anchor"
        : "Traveling from Library source";
  const receiptLine = normalizeText(payload?.receiptStatus) || "Not yet receipted";
  const showUseAction = state === "pending" || state === "armed";
  const showDismissAction = state === "pending" || state === "armed";

  return (
    <div className={styles.dreamBridgeNotice} data-testid="room-dream-bridge">
      <div className={styles.dreamBridgeCopy}>
        <Kicker tone="brand">{normalizeText(payload?.provenanceLabel) || "From Library"}</Kicker>
        <strong>{sourceLabel}</strong>
        <p>{excerpt}</p>
        {readSummary?.nextMove ? (
          <p className={styles.dreamBridgeSummary}>Next move: {readSummary.nextMove}</p>
        ) : null}
        <p className={styles.dreamBridgeStateLine}>{stateCopy}</p>
        <p className={styles.dreamBridgeStateLine}>
          {provenanceLine}. {receiptLine}.
        </p>
        <div className={styles.dreamBridgeMeta}>
          <span>{kindLabel}</span>
          <span>Library</span>
          {versionLabel ? <span>{versionLabel}</span> : null}
          <span>{stateLabel}</span>
          {anchorLabel ? <span>{anchorLabel}</span> : null}
          {normalizeText(payload?.savedAt) ? <span>{formatOperateTimestamp(payload.savedAt)}</span> : null}
        </div>
      </div>

      <div className={styles.dreamBridgeActions}>
        {showUseAction ? (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onUse}
            data-testid="dream-bridge-use"
          >
            {state === "armed" ? "Armed for next turn" : "Use in Room"}
          </button>
        ) : null}
        {showDismissAction ? (
          <button
            type="button"
            className={styles.inlineLinkButton}
            onClick={onDismiss}
            data-testid="dream-bridge-dismiss"
          >
            Dismiss
          </button>
        ) : null}
        <Link
          href={buildDreamHref(payload.documentId, payload.anchor)}
          className={styles.inlineLinkButton}
          data-testid="dream-bridge-return"
        >
          Open Library
        </Link>
      </div>
    </div>
  );
}

function DreamBridgeRecoveryNotice({ payload, onRestore }) {
  if (!payload?.documentId) return null;

  const kind = normalizeText(payload?.kind).toLowerCase();
  const sourceLabel =
    normalizeText(payload?.sourceLabel) ||
    normalizeText(payload?.documentTitle) ||
    "Library document";
  const kindLabel =
    kind === "witness"
      ? "Witness"
      : kind === "note"
        ? "Note"
        : kind === "read_summary"
          ? "Read summary"
          : "Passage";

  return (
    <div className={styles.dreamBridgeRecoveryNotice} data-testid="room-dream-bridge-recovery">
      <div className={styles.dreamBridgeCopy}>
        <Kicker tone="neutral">Bridge</Kicker>
        <strong>Bridge dismissed</strong>
        <p>
          {kindLabel} from {sourceLabel} is no longer staged.
        </p>
      </div>

      <div className={styles.dreamBridgeActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onRestore}
          data-testid="dream-bridge-restore"
        >
          Restore
        </button>
      </div>
    </div>
  );
}

function FogPlaceholder({ children = "Not enough signal yet." }) {
  return (
    <div className={styles.fog}>
      <div className={styles.fogLine} />
      <div className={styles.fogLineShort} />
      <p>{children}</p>
    </div>
  );
}

function MirrorRegion({
  region = "other",
  title = "",
  caption = "",
  children = null,
  highlighted = false,
  delay = 0,
  fullWidth = false,
}) {
  if (!children) return null;

  const shapeRole = getMirrorRegionRole(region);
  const toneClass =
    styles[`mirrorTone${String(shapeRole.key || "other").replace(/^\w/, (char) => char.toUpperCase())}`] || "";
  const regionLabel = title || shapeRole.regionLabel;

  return (
    <section
      className={`${styles.mirrorRegion} ${toneClass} ${highlighted ? styles.mirrorRegionActive : ""} ${fullWidth ? styles.mirrorRegionFull : ""}`}
      style={{ "--mirror-delay": `${delay}ms` }}
    >
      <div className={styles.mirrorRegionHead}>
        <div className={styles.mirrorRegionLabel}>
          <ShapeGlyph role={shapeRole.key} className={styles.mirrorRegionGlyph} />
          <Kicker tone={shapeRole.tone} className={styles.mirrorRegionTitle}>
            {regionLabel}
          </Kicker>
        </div>
        {caption ? <span className={styles.mirrorRegionCount}>{caption}</span> : null}
      </div>
      {children}
    </section>
  );
}

function MirrorPanel({ view, highlightedRegion, collapsed, onToggle, onOpenWitness }) {
  const mirror = view?.mirror || {};
  const evidenceItems = Array.isArray(mirror?.evidence) ? mirror.evidence : [];
  const storyItems = Array.isArray(mirror?.story) ? mirror.story : [];
  const moveItems = Array.isArray(mirror?.moves) ? mirror.moves : [];
  const returnItems = Array.isArray(mirror?.returns) ? mirror.returns : [];
  const summary =
    normalizeText(mirror?.aim?.text) ||
    normalizeText(evidenceItems[0]?.title) ||
    normalizeText(storyItems[0]?.text) ||
    normalizeText(moveItems[0]?.text) ||
    normalizeText(returnItems[0]?.label || returnItems[0]?.actual) ||
    "structure forming...";
  const showEvidenceStory = evidenceItems.length > 0 || storyItems.length > 0;
  const evidenceRatio = evidenceItems.length / Math.max(1, evidenceItems.length + storyItems.length);

  if (!view?.hasStructure) return null;

  return (
    <section className={styles.mirrorStrip} data-testid="room-mirror">
      <button
        type="button"
        className={styles.mirrorToggle}
        onClick={onToggle}
        data-testid="room-mirror-toggle"
      >
        <span className={styles.mirrorToggleGlyph}>{collapsed ? "▸" : "▾"}</span>
        <ShapeGlyph role="aim" className={styles.mirrorToggleShape} />
        <span className={styles.mirrorToggleSummary}>{summary}</span>
      </button>

      <div className={`${styles.mirrorBody} ${collapsed ? styles.mirrorBodyCollapsed : ""}`}>
        <div className={styles.mirrorBodyInner}>
          {normalizeText(mirror?.aim?.text) ? (
            <MirrorRegion
              region="aim"
              highlighted={highlightedRegion === "aim"}
              delay={0}
              fullWidth
            >
              <div className={styles.mirrorPrimary} data-testid="room-mirror-aim">
                <p>{mirror.aim.text}</p>
                {normalizeText(mirror?.aim?.gloss) ? <span>{mirror.aim.gloss}</span> : null}
              </div>
            </MirrorRegion>
          ) : null}

          {showEvidenceStory ? (
            <RatioBar ratio={evidenceRatio} />
          ) : null}

          {showEvidenceStory ? (
            <div className={styles.mirrorSplit}>
              {evidenceItems.length ? (
                <MirrorRegion
                  region="evidence"
                  caption={String(evidenceItems.length)}
                  highlighted={highlightedRegion === "evidence"}
                  delay={400}
                >
                  <div className={styles.mirrorList}>
                    {evidenceItems.map((item) => (
                      <div key={item.id} className={styles.mirrorItem}>
                        <div>
                          <strong>{item.title}</strong>
                          {item.detail ? <span>{item.detail}</span> : null}
                        </div>
                        {item.documentKey ? (
                          <button
                            type="button"
                            className={styles.inlineLinkButton}
                            data-testid={`room-mirror-witness-${item.documentKey}`}
                            onClick={() => onOpenWitness?.(item.documentKey)}
                          >
                            Witness
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </MirrorRegion>
              ) : null}

              {storyItems.length ? (
                <MirrorRegion
                  region="story"
                  caption={String(storyItems.length)}
                  highlighted={highlightedRegion === "story"}
                  delay={500}
                >
                  <div className={styles.mirrorList}>
                    {storyItems.map((item) => (
                      <div key={item.id} className={styles.mirrorItem}>
                        <div>
                          <strong>{item.text}</strong>
                          {item.detail ? <span>{item.detail}</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </MirrorRegion>
              ) : null}
            </div>
          ) : null}

          {moveItems.length ? (
            <MirrorRegion
              region="moves"
              caption={String(moveItems.length)}
              highlighted={highlightedRegion === "moves"}
              delay={700}
              fullWidth
            >
              <div className={styles.mirrorList}>
                {moveItems.map((item) => (
                  <div key={item.id} className={styles.mirrorItem}>
                    <div>
                      <strong>{item.text}</strong>
                      {item.detail ? <span>{item.detail}</span> : null}
                    </div>
                    <span className={styles.moveStatus}>{item.status || "suggested"}</span>
                  </div>
                ))}
              </div>
            </MirrorRegion>
          ) : null}

          {returnItems.length ? (
            <MirrorRegion
              region="returns"
              caption={String(returnItems.length)}
              highlighted={highlightedRegion === "returns"}
              delay={800}
              fullWidth
            >
              <div className={styles.mirrorList}>
                {returnItems.map((item) => (
                  <div key={item.id} className={styles.mirrorItem}>
                    <div>
                      <strong>{item.label || item.actual || "Return"}</strong>
                      {item.actual ? <span>{item.actual}</span> : null}
                      {item.provenanceLabel ? <span>{item.provenanceLabel}</span> : null}
                    </div>
                    <span className={styles.returnResult}>{item.result || "draft"}</span>
                  </div>
                ))}
              </div>
            </MirrorRegion>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function getWorkingEchoTone(status = "") {
  const normalized = normalizeText(status).toLowerCase();
  if (normalized === "move_ready") return "brand";
  if (normalized === "awaiting_return") return "grounded";
  if (normalized === "contested") return "flagged";
  if (normalized === "open") return "neutral";
  return "neutral";
}

function formatWorkingEchoStatus(status = "") {
  const normalized = normalizeText(status).toLowerCase();
  if (normalized === "move_ready") return "Move ready";
  if (normalized === "awaiting_return") return "Awaiting return";
  if (normalized === "contested") return "Contested";
  if (normalized === "open") return "Open";
  if (normalized === "grounded") return "Grounded";
  return "Forming";
}

function WorkingEchoRefs({ refs = [] }) {
  const items = (Array.isArray(refs) ? refs : []).map((item) => normalizeText(item)).filter(Boolean);
  if (!items.length) return null;

  return (
    <div className={styles.workingEchoRefs}>
      {items.slice(0, 3).map((item) => (
        <span key={item} className={styles.workingEchoRef}>
          {item}
        </span>
      ))}
    </div>
  );
}

function WorkingEchoEvidenceGroup({ title = "", items = [], empty = "" }) {
  const visibleItems = (Array.isArray(items) ? items : []).filter(
    (item) => normalizeText(item?.title) || normalizeText(item?.detail),
  );
  if (!visibleItems.length && !empty) return null;

  return (
    <div className={styles.workingEchoGroup}>
      {title ? <span className={styles.workingEchoGroupTitle}>{title}</span> : null}
      {visibleItems.length ? (
        <div className={styles.workingEchoList}>
          {visibleItems.map((item) => (
            <div key={item.id || `${item.title}:${item.detail}`} className={styles.workingEchoItem}>
              <strong>{item.title || "Evidence"}</strong>
              {normalizeText(item?.detail) ? <span>{item.detail}</span> : null}
              <WorkingEchoRefs refs={item.sourceRefs} />
            </div>
          ))}
        </div>
      ) : (
        <p>{empty}</p>
      )}
    </div>
  );
}

function WorkingEchoReturnStrip({ returnDelta = null }) {
  if (!returnDelta) return null;

  const changedRead = Array.isArray(returnDelta?.changedRead) ? returnDelta.changedRead : [];
  const weakenedRead = Array.isArray(returnDelta?.weakenedRead) ? returnDelta.weakenedRead : [];
  if (!normalizeText(returnDelta?.summary) && !changedRead.length && !weakenedRead.length) return null;

  return (
    <div className={styles.workingEchoReturnStrip} data-testid="room-working-echo-return">
      <div className={styles.workingEchoReturnCard}>
        <Kicker tone="grounded">What Changed After Return</Kicker>
        {normalizeText(returnDelta?.summary) ? <p>{returnDelta.summary}</p> : <p>A return changed the read.</p>}
        {changedRead.length ? (
          <div className={styles.workingEchoList}>
            {changedRead.map((item, index) => (
              <div
                key={`${normalizeText(item?.text) || "changed"}:${index + 1}`}
                className={styles.workingEchoItem}
              >
                <strong>{item.text}</strong>
                <WorkingEchoRefs refs={item.sourceRefs} />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.workingEchoReturnCard}>
        <Kicker tone="flagged">What Earlier Read Weakened</Kicker>
        {weakenedRead.length ? (
          <div className={styles.workingEchoList}>
            {weakenedRead.map((item, index) => (
              <div
                key={`${normalizeText(item?.text) || "weakened"}:${index + 1}`}
                className={styles.workingEchoItem}
              >
                <strong>{item.text}</strong>
                <WorkingEchoRefs refs={item.sourceRefs} />
              </div>
            ))}
          </div>
        ) : (
          <p>No earlier read has been weakened on the surface yet.</p>
        )}
      </div>
    </div>
  );
}

function WorkingEchoPanel({ workingEcho, collapsed = false, onToggle = null }) {
  if (!workingEcho) return null;

  const evidenceItems = Array.isArray(workingEcho?.evidenceCarried) ? workingEcho.evidenceCarried : [];
  const supports = Array.isArray(workingEcho?.evidenceBuckets?.supports)
    ? workingEcho.evidenceBuckets.supports
    : evidenceItems;
  const weakens = Array.isArray(workingEcho?.evidenceBuckets?.weakens)
    ? workingEcho.evidenceBuckets.weakens
    : [];
  const missing = Array.isArray(workingEcho?.evidenceBuckets?.missing)
    ? workingEcho.evidenceBuckets.missing
    : [];
  const tensionItems = Array.isArray(workingEcho?.openTension) ? workingEcho.openTension : [];
  const candidateMove = workingEcho?.candidateMove || null;
  const previewLink = workingEcho?.previewLink || null;
  const returnDelta = workingEcho?.returnDelta || null;
  const uncertaintyDetail = normalizeText(workingEcho?.uncertainty?.detail);
  const loopState = normalizeText(workingEcho?.loopState || workingEcho?.status).toLowerCase();
  const reasonForOpen = normalizeText(workingEcho?.reasonForOpen);
  const aimText =
    normalizeText(workingEcho?.whatSeemsReal?.text || workingEcho?.aim?.text) ||
    (uncertaintyDetail ? `Current aim is still forming. ${uncertaintyDetail}` : "");

  return (
    <section className={styles.workingEchoPanel} data-testid="room-working-echo">
      <div className={styles.workingEchoHead}>
        <div>
          <Kicker tone={getWorkingEchoTone(loopState)}>Working Echo</Kicker>
          <strong>Session-scoped. Not canon.</strong>
        </div>
        <div className={styles.workingEchoMeta}>
          <span className={styles.workingEchoStatus}>{formatWorkingEchoStatus(loopState)}</span>
          {reasonForOpen ? <span className={styles.workingEchoMetaDetail}>{reasonForOpen}</span> : null}
          {previewLink?.assistantMessageId ? (
            <span className={styles.workingEchoMetaText}>Linked preview</span>
          ) : null}
          <button
            type="button"
            className={styles.inlineLinkButton}
            onClick={onToggle}
            data-testid="room-working-echo-toggle"
          >
            {collapsed ? "Show" : "Hide"}
          </button>
        </div>
      </div>

      <WorkingEchoReturnStrip returnDelta={returnDelta} />

      <div className={`${styles.workingEchoGrid} ${collapsed ? styles.workingEchoGridCollapsed : ""}`}>
        <section className={styles.workingEchoCard} data-testid="room-working-echo-real">
          <Kicker tone="grounded">What Seems Real</Kicker>
          {aimText ? <p>{aimText}</p> : <p>Signal is forming, but not settled.</p>}
          <WorkingEchoRefs refs={workingEcho?.aim?.sourceRefs} />
          <WorkingEchoEvidenceGroup
            title="Supports"
            items={supports}
            empty={evidenceItems.length ? "" : "No grounded supporting evidence is surfaced yet."}
          />
        </section>

        <section className={styles.workingEchoCard} data-testid="room-working-echo-conflicts">
          <Kicker tone="flagged">What Conflicts</Kicker>
          {tensionItems.length ? (
            <div className={styles.workingEchoList}>
              {tensionItems.map((item) => (
                <div key={item.id} className={styles.workingEchoItem}>
                  <strong>{item.text}</strong>
                  <span>{item.kind.replace(/_/g, " ")}</span>
                  <WorkingEchoRefs refs={item.sourceRefs} />
                </div>
              ))}
            </div>
          ) : (
            <p>No live contradiction is surfaced yet.</p>
          )}
          <WorkingEchoEvidenceGroup title="Weakens The Popular Read" items={weakens} />
          {missing.length ? <WorkingEchoEvidenceGroup title="Still Missing" items={missing} /> : null}
        </section>

        <section className={styles.workingEchoCard} data-testid="room-working-echo-deciding-split">
          <Kicker tone="brand">What Would Decide It</Kicker>
          <p>{workingEcho?.whatWouldDecideIt?.text || "No deciding split is visible yet."}</p>
          <WorkingEchoRefs refs={workingEcho?.whatWouldDecideIt?.sourceRefs} />
          {reasonForOpen && loopState !== "awaiting_return" ? (
            <div className={styles.workingEchoItem}>
              <strong>Why it stays open</strong>
              <span>{reasonForOpen}</span>
            </div>
          ) : null}
          {returnDelta?.nextMoveShift?.text ? (
            <div className={styles.workingEchoItem}>
              <strong>Return reroute</strong>
              <span>{returnDelta.nextMoveShift.text}</span>
              <WorkingEchoRefs refs={returnDelta.nextMoveShift.sourceRefs} />
            </div>
          ) : null}
        </section>

        {candidateMove ? (
          <section className={styles.workingEchoCard} data-testid="room-working-echo-move">
            <Kicker tone="neutral">Candidate Move</Kicker>
            <p>{candidateMove.text}</p>
            <WorkingEchoRefs refs={candidateMove.sourceRefs} />
          </section>
        ) : null}
      </div>
    </section>
  );
}

function WorkingEchoStrip({ view, onOpenDetail }) {
  const stripState = useMemo(() => buildWorkingEchoStripStateFromRoomView(view), [view]);
  if (stripState?.dormant) return null;

  return (
    <div className={styles.roomEchoStripWrap}>
      <PulseStrip
        state={stripState}
        onOpenCards={onOpenDetail}
        className={styles.roomEchoStrip}
      />
    </div>
  );
}

function StarterView({
  starter = null,
  onStartAction = null,
  onTeachLiveIssue = null,
  onTeachSourceDocument = null,
}) {
  return (
    <section className={styles.starter} data-testid="room-starter">
      <Kicker tone="neutral" className={styles.starterKicker}>
        Room
      </Kicker>
      <h1>{starter?.firstLine || "Bring one live thing into focus."}</h1>
      <p>
        {starter?.secondLine ||
          "Paste a document, upload a file, or start talking. Open Library when you want to re-enter source first."}
      </p>
      <div className={styles.starterFork} data-testid="room-starter-fork">
        <button
          type="button"
          className={styles.starterTextAction}
          onClick={onTeachLiveIssue}
          data-testid="room-starter-live-issue"
        >
          Start with a live issue
        </button>
        <button
          type="button"
          className={styles.starterTextAction}
          onClick={onTeachSourceDocument}
          data-testid="room-starter-source-document"
        >
          Start with a source document
        </button>
        <button
          type="button"
          className={styles.starterTextAction}
          onClick={() => onStartAction?.("paste")}
          data-testid="room-starter-paste"
        >
          Paste document
        </button>
        <button
          type="button"
          className={styles.starterTextAction}
          onClick={() => onStartAction?.("upload")}
          data-testid="room-starter-upload"
        >
          Upload file
        </button>
      </div>
      <p className={styles.starterHint}>
        Or open <Link href="/dream">Library</Link> to re-enter a document first.
      </p>
    </section>
  );
}

function PostAddGuidanceCard({
  guidance = null,
  onOpenLibrary = null,
  onAskHere = null,
  onDismiss = null,
}) {
  if (!guidance) return null;

  return (
    <div className={styles.postAddCard} data-testid="room-post-add-card">
      <div className={styles.postAddCopy}>
        <Kicker tone="grounded">Document added</Kicker>
        <strong>{guidance.headline || "Your source is now in the room."}</strong>
        <p>{guidance.body}</p>
      </div>
      <div className={styles.postAddActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={guidance.primaryAction === "library" ? onOpenLibrary : onAskHere}
          data-testid="room-post-add-primary"
        >
          {guidance.primaryLabel}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={guidance.primaryAction === "library" ? onAskHere : onOpenLibrary}
          data-testid="room-post-add-secondary"
        >
          {guidance.secondaryLabel}
        </button>
        <button
          type="button"
          className={styles.inlineLinkButton}
          onClick={onDismiss}
          data-testid="room-post-add-dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function RoomResumeBanner({ resume = null, onContinue = null, onReturnToLibrary = null, onDismiss = null }) {
  if (!resume) return null;

  return (
    <div className={styles.resumeBanner} data-testid="room-resume-banner">
      <div className={styles.postAddCopy}>
        <Kicker tone="brand">Resume</Kicker>
        <strong>Pick up where you left off.</strong>
        <p>
          Continue this Room, or return to Library
          {resume.libraryTitle ? ` for ${resume.libraryTitle}` : ""}.
        </p>
      </div>
      <div className={styles.postAddActions}>
        <button type="button" className={styles.primaryButton} onClick={onContinue} data-testid="room-resume-continue">
          Continue in Room
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onReturnToLibrary}
          data-testid="room-resume-library"
        >
          Return to Library
        </button>
        <button type="button" className={styles.inlineLinkButton} onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

function ProjectPicker({ projects, activeProjectKey, onSelect, onCreate }) {
  return (
    <div className={styles.railSection}>
      <div className={styles.railSectionHead}>
        <div>
          <Kicker tone="neutral">Assemblies</Kicker>
          <strong>Assemblies</strong>
        </div>
        <button type="button" className={styles.railTextAction} onClick={onCreate}>
          New Box
        </button>
      </div>

      <div className={styles.railList}>
        {(Array.isArray(projects) ? projects : []).map((project) => (
          <button
            key={project.projectKey}
            type="button"
            data-testid={`room-project-${project.projectKey}`}
            className={`${styles.railRow} ${project.projectKey === activeProjectKey ? styles.railRowActive : ""}`}
            onClick={() => onSelect(project.projectKey)}
          >
            <div className={styles.railRowCopy}>
              <strong>{project.title}</strong>
              <span>
                {project.sourceCount || 0} source{project.sourceCount === 1 ? "" : "s"}
                {project.receiptDraftCount ? ` • ${project.receiptDraftCount} receipt drafts` : ""}
              </span>
            </div>
            {project.projectKey === activeProjectKey ? <span className={styles.railRowState}>Open</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function RoomArtifactList({ sources, onOpenWitness }) {
  const items = Array.isArray(sources) ? sources.filter(Boolean) : [];

  return (
    <div className={styles.railSection}>
      <div className={styles.railSectionHead}>
        <div>
          <Kicker tone="neutral">Artifacts</Kicker>
          <strong>Artifacts</strong>
        </div>
        <Link href="/dream" className={styles.railTextAction}>
          Open Library
        </Link>
      </div>

      {!items.length ? (
        <p className={styles.railEmptyText}>No source is attached to this assembly yet.</p>
      ) : (
        <div className={styles.railList}>
          {items.map((source) => (
            <button
              key={source.documentKey || source.title}
              type="button"
              className={styles.railRow}
              onClick={() => onOpenWitness?.(source.documentKey)}
              disabled={!normalizeText(source.documentKey)}
              data-testid={`room-artifact-${source.documentKey || source.title}`}
            >
              <div className={styles.railRowCopy}>
                <strong>{source.title || "Source"}</strong>
                <span>{source.metaLine || source.badge || "Attached source"}</span>
              </div>
              {normalizeText(source.badge) ? (
                <span className={styles.railRowState}>{source.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateBoxForm({ onCreate, busy }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!normalizeText(title)) {
      setError("Give the box a name.");
      return;
    }
    setError("");
    try {
      await onCreate({ title: normalizeText(title), subtitle: normalizeText(subtitle) });
      setTitle("");
      setSubtitle("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not create the box.");
    }
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <div className={styles.panelHead}>
        <div>
          <Kicker tone="brand">Start Room</Kicker>
          <strong>Create the internal room container</strong>
        </div>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Name</span>
          <input
            data-testid="room-create-box-name"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Room title"
          />
        </label>
        <label className={styles.field}>
          <span>Note</span>
          <input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="Optional subtitle"
          />
        </label>
      </div>
      {error ? <p className={styles.errorText}>{error}</p> : null}
      <div className={styles.inlineActions}>
        <button type="submit" className={styles.primaryButton} disabled={busy} data-testid="room-create-box-submit">
          {busy ? "Starting..." : "Start Room"}
        </button>
      </div>
    </form>
  );
}

function SourceTray({ projectKey, onComplete, initialMode = "upload" }) {
  const [mode, setMode] = useState(initialMode === "paste" ? "paste" : initialMode === "link" ? "link" : "upload");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!normalizeText(initialMode)) return;
    setMode(initialMode === "paste" ? "paste" : initialMode === "link" ? "link" : "upload");
  }, [initialMode]);

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) {
      setError("Choose a file to bring into the room.");
      return;
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("projectKey", projectKey);
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not upload that source.");
      }
      setNotice("Source added to the room.");
      setFile(null);
      await onComplete(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not upload that source.");
    } finally {
      setPending(false);
    }
  }

  async function handlePaste(event) {
    event.preventDefault();
    if (!normalizeLongForm(text)) {
      setError("Paste something the room can work with.");
      return;
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/workspace/paste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          mode: "source",
          text,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not add the pasted source.");
      }
      setNotice("Pasted source added.");
      setText("");
      await onComplete(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not add the pasted source.");
    } finally {
      setPending(false);
    }
  }

  async function handleLink(event) {
    event.preventDefault();
    if (!normalizeText(url)) {
      setError("Paste a link the room can fetch.");
      return;
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/workspace/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          url: normalizeText(url),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not import that link.");
      }
      setNotice("Linked source captured.");
      setUrl("");
      await onComplete(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not import that link.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <Kicker tone="grounded">Source</Kicker>
          <strong>Attach source</strong>
        </div>
      </div>

      <div className={styles.tabRow}>
        {[
          { key: "upload", label: "Upload" },
          { key: "paste", label: "Paste" },
          { key: "link", label: "Link" },
        ].map((entry) => (
          <button
            key={entry.key}
            type="button"
            className={`${styles.tabButton} ${mode === entry.key ? styles.tabButtonActive : ""}`}
            onClick={() => {
              setMode(entry.key);
              setError("");
              setNotice("");
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <form className={styles.stack} onSubmit={handleUpload}>
          <label className={styles.field}>
            <span>File</span>
            <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={pending}>
            {pending ? "Uploading..." : "Add Source"}
          </button>
        </form>
      ) : null}

      {mode === "paste" ? (
        <form className={styles.stack} onSubmit={handlePaste}>
          <label className={styles.field}>
            <span>Source text</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste text, notes, or source."
              rows={6}
            />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={pending}>
            {pending ? "Adding..." : "Add Source"}
          </button>
        </form>
      ) : null}

      {mode === "link" ? (
        <form className={styles.stack} onSubmit={handleLink}>
          <label className={styles.field}>
            <span>URL</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://"
              type="url"
            />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={pending}>
            {pending ? "Capturing..." : "Capture Link"}
          </button>
        </form>
      ) : null}

      {error ? <p className={styles.errorText}>{error}</p> : null}
      {notice ? <p className={styles.noticeText}>{notice}</p> : null}
    </div>
  );
}

function ReturnCard({ item }) {
  if (!item) return null;

  const resultTone =
    normalizeText(item?.result).toLowerCase() === "contradicted"
      ? "flagged"
      : normalizeText(item?.result).toLowerCase() === "surprised"
        ? "story"
        : "grounded";

  return (
    <div className={styles.returnCard}>
      <div className={styles.returnHead}>
        <strong>{item.label || "Return"}</strong>
        <span className={`${styles.returnBadge} ${getToneClass(resultTone)}`}>
          <SignalDot tone={resultTone} />
          {item.result || "matched"}
        </span>
      </div>
      <div className={styles.compareGrid}>
        <div>
          <span>Predicted</span>
          <p>{item.predicted || "No prediction recorded."}</p>
        </div>
        <div>
          <span>Actual</span>
          <p>{item.actual || "No actual recorded."}</p>
        </div>
      </div>
      {item.provenanceLabel ? <p className={styles.noticeText}>{item.provenanceLabel}</p> : null}
    </div>
  );
}

function ReceiptKitCard({ receiptKit, view, onComplete, busy }) {
  const artifactType = normalizeText(receiptKit?.artifact?.type).toLowerCase();
  const config =
    receiptKit?.artifact?.config && typeof receiptKit.artifact.config === "object"
      ? receiptKit.artifact.config
      : {};
  const checklistItems =
    Array.isArray(config.items) && config.items.length
      ? config.items.map((item) => normalizeText(item)).filter(Boolean)
      : normalizeText(receiptKit?.need)
        ? [normalizeText(receiptKit.need)]
        : [];
  const [expanded, setExpanded] = useState(false);
  const [actual, setActual] = useState("");
  const [result, setResult] = useState("matched");
  const [messageDraft, setMessageDraft] = useState(
    normalizeLongForm(config.draft || config.message || receiptKit?.fastestPath || ""),
  );
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [checkedMap, setCheckedMap] = useState(() =>
    Object.fromEntries(checklistItems.map((item) => [item, false])),
  );
  const [error, setError] = useState("");

  const checkedItems = useMemo(
    () => Object.entries(checkedMap).filter(([, value]) => value).map(([key]) => key),
    [checkedMap],
  );
  const returnItem = receiptKit ? findReturnForReceipt(view, receiptKit.id) : null;
  const waiting = view?.fieldState?.key === "awaiting" && !returnItem;

  useEffect(() => {
    if (!returnItem) return undefined;
    const frame = window.requestAnimationFrame(() => {
      setExpanded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [returnItem]);

  function validateReturnInput() {
    if (artifactType === "upload" && !uploadFile && !normalizeText(actual)) {
      return "Attach the return or describe what came back.";
    }
    if (artifactType === "link" && !normalizeText(linkUrl) && !normalizeText(actual)) {
      return "Paste the return link or note what came back.";
    }
    if (artifactType === "checklist" && checkedItems.length === 0 && !normalizeText(actual)) {
      return "Check what landed or note what changed.";
    }
    if (
      artifactType !== "upload" &&
      artifactType !== "link" &&
      artifactType !== "checklist" &&
      !normalizeText(actual)
    ) {
      return "Record what came back.";
    }
    return "";
  }

  async function handleMarkSent() {
    setError("");
    try {
      await onComplete({
        receiptKit,
        completion: {
          mode: "move",
          moveText:
            normalizeText(messageDraft) ||
            normalizeText(receiptKit?.fastestPath) ||
            normalizeText(receiptKit?.need),
          messageDraft: normalizeLongForm(messageDraft),
        },
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not mark the ping sent.");
    }
  }

  async function handleRecordReturn() {
    const nextError = validateReturnInput();
    if (nextError) {
      setError(nextError);
      setExpanded(true);
      return;
    }
    setError("");
    try {
      await onComplete({
        receiptKit,
        completion: {
          mode: "return",
          actual: normalizeLongForm(actual),
          result,
          messageDraft: normalizeLongForm(messageDraft),
          linkUrl: normalizeText(linkUrl),
          checkedItems,
          uploadFile,
        },
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not record the return.");
    }
  }

  return (
    <div className={styles.receiptKit}>
      <div className={styles.receiptHead}>
        <div>
          <Kicker tone="brand">Receipt Kit</Kicker>
          <strong>{receiptKit?.need || "Capture the return"}</strong>
        </div>
        <div className={styles.inlineActions}>
          <span className={styles.receiptType}>{getArtifactLabel(artifactType)}</span>
          <button
            type="button"
            className={styles.inlineLinkButton}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "Hide kit" : "Open kit"}
          </button>
        </div>
      </div>

      {receiptKit?.why ? <p className={styles.receiptCopy}>{receiptKit.why}</p> : null}

      <div className={styles.compareGrid}>
        <div>
          <span>Predicted</span>
          <p>{receiptKit?.prediction?.expected || "No prediction recorded."}</p>
        </div>
        <div>
          <span>Enough</span>
          <p>{receiptKit?.enough || "One return is enough to change the next move."}</p>
        </div>
      </div>

      {!expanded ? (
        <div className={styles.receiptSummary}>
          {normalizeText(receiptKit?.fastestPath) ? <p>{receiptKit.fastestPath}</p> : null}
          <div className={styles.inlineActions}>
            {!returnItem ? (
              <button type="button" className={styles.secondaryButton} onClick={handleMarkSent} disabled={busy}>
                {busy ? "Holding..." : "Mark Ping Sent"}
              </button>
            ) : null}
            <button type="button" className={styles.primaryButton} onClick={() => setExpanded(true)}>
              {returnItem ? "Review Return" : "Record Return"}
            </button>
          </div>
          {waiting ? <p className={styles.awaitingText}>The room is listening for the return.</p> : null}
          {returnItem ? <ReturnCard item={returnItem} /> : null}
          {error ? <p className={styles.errorText}>{error}</p> : null}
        </div>
      ) : (
        <>
          {artifactType === "draft_message" ? (
            <label className={styles.field}>
              <span>Draft</span>
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                rows={4}
                placeholder="Write the smallest clear ping."
              />
            </label>
          ) : null}

          {artifactType === "link" ? (
            <label className={styles.field}>
              <span>Return link</span>
              <input
                type="url"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://"
              />
            </label>
          ) : null}

          {artifactType === "upload" ? (
            <label className={styles.field}>
              <span>Attach return</span>
              <input type="file" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
            </label>
          ) : null}

          {artifactType === "checklist" ? (
            <div className={styles.checklist}>
              {checklistItems.map((item) => (
                <label key={item} className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={Boolean(checkedMap[item])}
                    onChange={(event) =>
                      setCheckedMap((current) => ({
                        ...current,
                        [item]: event.target.checked,
                      }))
                    }
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          ) : null}

          <label className={styles.field}>
            <span>{artifactType === "compare" ? "Actual" : "What came back"}</span>
            <textarea
              value={actual}
              onChange={(event) => setActual(event.target.value)}
              rows={artifactType === "compare" ? 4 : 3}
              placeholder={
                artifactType === "compare"
                  ? "Write the actual outcome."
                  : "Paste the return, note the reaction, or describe what changed."
              }
            />
          </label>

          <div className={styles.inlineActions}>
            <label className={styles.selectField}>
              <span>Result</span>
              <select value={result} onChange={(event) => setResult(event.target.value)}>
                {RECEIPT_RESULT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {!returnItem ? (
              <button type="button" className={styles.secondaryButton} onClick={handleMarkSent} disabled={busy}>
                {busy ? "Holding..." : "Mark Ping Sent"}
              </button>
            ) : null}
            <button type="button" className={styles.primaryButton} onClick={handleRecordReturn} disabled={busy}>
              {busy ? "Saving..." : "Record Return"}
            </button>
          </div>

          {waiting ? <p className={styles.awaitingText}>The room is listening for the return.</p> : null}
          {error ? <p className={styles.errorText}>{error}</p> : null}
          {returnItem ? <ReturnCard item={returnItem} /> : null}
        </>
      )}
    </div>
  );
}

function ProposalSegments({ segments, onHighlight }) {
  const [openId, setOpenId] = useState("");

  return (
    <div className={styles.segmentFlow}>
      {segments.map((segment) => {
        const tone = getSegmentTone(segment?.domain);
        const isOpen = openId === segment.id;
        const hasClause = normalizeText(segment?.suggestedClause);

        return (
          <span key={segment.id} className={styles.segmentInline}>
            <button
              type="button"
              className={`${styles.segmentButton} ${tone.toneClass} ${isOpen ? styles.segmentButtonOpen : ""}`}
              onClick={() => {
                setOpenId((current) => (current === segment.id ? "" : segment.id));
                if (segment?.mirrorRegion) {
                  onHighlight?.(segment.mirrorRegion);
                }
              }}
            >
              {segment.text}
            </button>
            {isOpen && hasClause ? (
              <span className={`${styles.segmentClause} ${tone.toneClass}`}>
                <ShapeGlyph role={tone.shapeRole.key} className={styles.segmentGlyph} />
                {segment.suggestedClause}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function ProposalFooter({ roomPayload, previewStatus, onApply, busy }) {
  const gatePreview = roomPayload?.gatePreview || null;
  const diagnostics = Array.isArray(gatePreview?.diagnostics) ? gatePreview.diagnostics : [];
  const status = normalizePreviewStatus(previewStatus);
  const accepted = gatePreview?.accepted !== false;

  if (!gatePreview) return null;

  let statusTitle = "Ready";
  let body =
    gatePreview?.nextBestAction || "Apply this preview to make it canonical.";

  if (status === "active" && accepted) {
    body = "";
  } else if (status === "blocked" || !accepted) {
    statusTitle = "Blocked";
    body = gatePreview?.reason || "This preview is not lawful yet.";
  } else if (status === "applied") {
    statusTitle = "Applied";
    body = "This preview already changed the box canon.";
  } else if (status === "superseded") {
    statusTitle = "Superseded";
    body = "A newer preview is now active in this conversation.";
  }

  return (
    <div className={styles.proposalFooter}>
      <div
        data-testid={`room-proposal-status-${status}`}
        className={`${styles.proposalStatus} ${accepted ? styles.proposalStatusAccepted : styles.proposalStatusRejected}`}
      >
        <span>{statusTitle}</span>
        {body ? <p>{body}</p> : null}
        {diagnostics.length ? (
          <small>{diagnostics.map((item) => item.message).join(" • ")}</small>
        ) : null}
      </div>

      {accepted && status === "active" && Array.isArray(roomPayload?.segments) && roomPayload.segments.length ? (
        <button
          type="button"
          className={styles.applyButton}
          onClick={onApply}
          disabled={busy}
          data-testid="room-apply-preview"
        >
          {busy ? "Applying..." : "Apply to Room"}
        </button>
      ) : null}
    </div>
  );
}

function ThreadMessage({
  message,
  view,
  onApplyProposal,
  onCompleteReceiptKit,
  applying,
  busyReceiptKitId,
  onHighlight,
}) {
  const roomPayload = message?.roomPayload || null;
  const receiptKit = roomPayload?.receiptKit || null;
  const segments = Array.isArray(roomPayload?.segments) ? roomPayload.segments : [];
  const paragraphs = splitParagraphs(message?.content || "");
  const isAssistant = message?.role === "assistant";
  const previewStatus = normalizePreviewStatus(message?.previewStatus);
  const previewCopy = getPreviewStatusCopy(previewStatus);
  const activeAcceptedProposal = isAssistant && isActivePreviewMessage(view, message);
  const proposalMessage = isAssistant && hasProposalContent(roomPayload);
  const showReceiptKit = Boolean(receiptKit && ["active", "applied"].includes(previewStatus));

  return (
    <article className={`${styles.messageRow} ${isAssistant ? styles.messageRowAssistant : styles.messageRowUser}`}>
      <div
        className={`${styles.messageCard} ${isAssistant ? styles.messageAssistant : styles.messageUser} ${activeAcceptedProposal ? styles.messageCardPreview : ""} ${getPreviewStatusClass(previewStatus)}`}
      >
        <div className={styles.messageMeta}>
          <span>{isAssistant ? "Seven" : "You"}</span>
          {message?.createdAt ? <small>{String(message.createdAt).slice(0, 16).replace("T", " ")}</small> : null}
        </div>

        <div className={styles.messageBody}>
          {paragraphs.length ? (
            paragraphs.map((paragraph, index) => <p key={`${message.id}-${index}`}>{paragraph}</p>)
          ) : (
            <p>{message?.content}</p>
          )}
        </div>

        {proposalMessage ? (
          <div className={styles.previewBlock}>
            <div className={styles.messagePreviewMeta}>
              <span>{previewCopy.label}</span>
              {previewStatus !== "active" ? (
                <small>{previewCopy.detail || "Visible in this turn."}</small>
              ) : null}
            </div>
            {segments.length ? <ProposalSegments segments={segments} onHighlight={onHighlight} /> : null}
            <ProposalFooter
              roomPayload={roomPayload}
              previewStatus={previewStatus}
              onApply={() => onApplyProposal(message)}
              busy={applying}
            />
            {showReceiptKit ? (
              <ReceiptKitCard
                receiptKit={receiptKit}
                view={view}
                onComplete={onCompleteReceiptKit}
                busy={busyReceiptKitId === receiptKit.id}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function RoomSessionList({
  sessions,
  activeSessionId,
  onCreate,
  onActivate,
  onArchive,
  busy = false,
}) {
  const items = Array.isArray(sessions) ? sessions : [];

  return (
    <div className={styles.railSection}>
      <div className={styles.railSectionHead}>
        <div>
          <Kicker tone="neutral">Conversations</Kicker>
          <strong>Conversations</strong>
        </div>
        <button type="button" className={styles.railTextAction} onClick={onCreate} disabled={busy} data-testid="room-create-session">
          New
        </button>
      </div>

      {!items.length ? (
        <p className={styles.railEmptyText}>No conversations yet.</p>
      ) : (
        <div className={styles.railList}>
          {items.map((session) => {
            const isActive = session?.id === activeSessionId;
            return (
              <div
                key={session?.id || session?.sessionKey}
                className={`${styles.railRow} ${isActive ? styles.railRowActive : ""}`}
              >
                <button
                  type="button"
                  data-testid={`room-session-${session?.id || session?.sessionKey}`}
                  className={styles.railRowButton}
                  onClick={() => onActivate?.(session?.id)}
                  disabled={busy || isActive}
                >
                  <div className={styles.railRowCopy}>
                    <strong>{session?.title || "Conversation"}</strong>
                    <span>
                      {Number(session?.messageCount) || 0} message
                      {Number(session?.messageCount) === 1 ? "" : "s"}
                      {session?.updatedAt ? ` • ${formatRelativeSessionLabel(session.updatedAt)}` : ""}
                    </span>
                    {normalizeText(session?.handoffSummary) ? (
                      <span>{session.handoffSummary}</span>
                    ) : null}
                  </div>
                </button>
                <div className={styles.railRowActions}>
                  {isActive ? <span className={styles.railRowState}>Open</span> : null}
                  {!isActive && session?.isArchived ? (
                    <span className={styles.railRowState}>Archived</span>
                  ) : null}
                  {!session?.isArchived ? (
                    <button
                      type="button"
                      className={styles.railInlineAction}
                      onClick={() => onArchive?.(session?.id)}
                      disabled={busy}
                    >
                      Archive
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActivePreviewBanner({ activePreview }) {
  if (!activePreview) return null;

  const summary =
    normalizeText(activePreview?.assistantText) ||
    normalizeText(activePreview?.segments?.[0]?.text) ||
    "A preview is live in this conversation.";

  return (
    <section className={styles.previewBanner} data-testid="room-active-preview">
      <div className={styles.previewBannerCopy}>
        <Kicker tone="brand">Preview</Kicker>
        <strong>{summary}</strong>
        <p>Visible in this conversation. Canon unchanged until applied.</p>
      </div>
      <div className={styles.previewBannerMeta}>
        <span>Preview only</span>
        <span>Box canon unchanged</span>
      </div>
    </section>
  );
}

function FocusedWitnessPanel({ focusedWitness, onBack }) {
  if (!focusedWitness) return null;

  const blocks = Array.isArray(focusedWitness?.excerptBlocks) ? focusedWitness.excerptBlocks : [];

  return (
    <div className={styles.panel} data-testid="room-focused-witness">
      <div className={styles.panelHead}>
        <div>
          <Kicker tone="grounded">Witness</Kicker>
          <strong>{focusedWitness.title || "Focused witness"}</strong>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={onBack} data-testid="room-close-witness">
          Back to Room
        </button>
      </div>

      {normalizeText(focusedWitness?.sourceSummary) ? (
        <p className={styles.noticeText}>{focusedWitness.sourceSummary}</p>
      ) : null}
      {normalizeText(focusedWitness?.provenanceLabel) ? (
        <p className={styles.noticeText}>{focusedWitness.provenanceLabel}</p>
      ) : null}

      <div className={styles.witnessStack}>
        {blocks.length ? (
          blocks.map((block) => (
            <article key={block.id} className={styles.witnessBlock} data-testid="room-focused-witness-block">
              <span>{block.kind || "paragraph"}</span>
              <p>{block.text}</p>
            </article>
          ))
        ) : (
          <FogPlaceholder>No readable witness is in view yet.</FogPlaceholder>
        )}
      </div>
    </div>
  );
}

function OperatePanel({
  operateSummary,
  pending = false,
  error = "",
  result = null,
  onRun,
  onAskSeven,
  onBack,
}) {
  const summaryResult = result && typeof result === "object" ? result : null;
  const activeResult =
    summaryResult ||
    (operateSummary?.hasRun
      ? {
          nextMove: operateSummary?.nextMove,
        }
      : null);

  return (
    <div className={styles.panel} data-testid="room-operate-panel">
      <div className={styles.panelHead}>
        <div>
          <Kicker tone="neutral">Operate</Kicker>
          <strong>Box-level advisory read</strong>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={onBack} data-testid="room-close-operate">
          Back to Room
        </button>
      </div>

      <div className={styles.operateSummaryGrid}>
        <div className={styles.operateSummaryCard} data-testid="room-operate-source-count">
          <span>Included sources</span>
          <strong>{Number(operateSummary?.includedSourceCount) || 0}</strong>
        </div>
        <div className={styles.operateSummaryCard} data-testid="room-operate-last-run">
          <span>Last run</span>
          <strong>{formatOperateTimestamp(operateSummary?.lastRunAt) || "Not run yet"}</strong>
        </div>
      </div>

      {activeResult?.nextMove ? (
        <div className={styles.operateCallout} data-testid="room-operate-next-move">
          <span>Next move</span>
          <p>{activeResult.nextMove}</p>
        </div>
      ) : null}

      {!operateSummary?.available ? (
        <p className={styles.noticeText}>Add witness to this box before running Operate.</p>
      ) : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.inlineActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onRun}
          disabled={pending || !operateSummary?.available}
          data-testid="room-run-operate"
        >
          {pending ? "Operating..." : operateSummary?.hasRun ? "Refresh Operate" : "Run Operate"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onAskSeven}
          disabled={!summaryResult}
          data-testid="room-ask-seven-operate-audit"
        >
          Ask Seven to audit
        </button>
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  pending,
  disabled = false,
  placeholder = "Your word",
  onOpenAttach,
  listenHref,
  focusSignal = 0,
  scopeLabel = "",
  scopeDetail = "",
  attachActions = [],
}) {
  const textareaRef = useRef(null);
  const isComposingRef = useRef(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const hasValue = Boolean(normalizeText(value));
  const canListen = Boolean(normalizeText(listenHref));
  const canSubmit = hasValue && !pending && !disabled;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 128);
    textarea.style.height = `${Math.max(54, nextHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 128 ? "auto" : "hidden";
  }, [value]);

  useEffect(() => {
    if (!focusSignal || disabled) return;
    textareaRef.current?.focus();
  }, [disabled, focusSignal]);

  useEffect(() => {
    if (!disabled) return;
    const frame = window.requestAnimationFrame(() => {
      setAttachMenuOpen(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [disabled]);

  function handleKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey || isComposingRef.current) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  async function handleSubmit(event) {
    const result = onSubmit(event);
    Promise.resolve(result).finally(() => {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    });
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <div className={styles.composerShell}>
        <div className={styles.composerCapsule}>
          {attachMenuOpen && attachActions.length ? (
            <div className={styles.composerBloom} data-testid="room-composer-bloom">
              {attachActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={styles.composerBloomItem}
                  onClick={() => {
                    setAttachMenuOpen(false);
                    action.onClick?.();
                  }}
                  data-testid={action.testId}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}

          {scopeLabel || scopeDetail ? (
            <div className={styles.composerMeta}>
              {scopeLabel ? <strong>{scopeLabel}</strong> : null}
              {scopeDetail ? <span>{scopeDetail}</span> : null}
            </div>
          ) : null}

          <div className={styles.composerRow}>
            <button
              type="button"
              className={styles.composerTool}
              onClick={() => {
                if (attachActions.length) {
                  setAttachMenuOpen((current) => !current);
                  return;
                }
                onOpenAttach?.();
              }}
              aria-label="Open add menu"
              data-testid="room-composer-plus"
            >
              <Plus size={16} />
            </button>
            <textarea
              data-testid="room-composer-input"
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => {
                isComposingRef.current = true;
              }}
              onCompositionEnd={() => {
                isComposingRef.current = false;
              }}
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
            />
            <div className={styles.composerActions}>
              {canListen ? (
                <Link
                  href={listenHref}
                  className={styles.composerListenInline}
                  aria-label="Open listening lane"
                  title="Open listening lane"
                >
                  <Headphones size={14} />
                </Link>
              ) : null}
              <button
                type="submit"
                className={`${styles.composerSend} ${canSubmit ? styles.composerSendActive : ""}`}
                disabled={!canSubmit}
                aria-label={pending ? "Sending" : "Send"}
                data-testid="room-composer-send"
              >
                <SendHorizontal size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function LoadingMessage() {
  return (
    <article className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
      <div className={`${styles.messageCard} ${styles.messageAssistant}`}>
        <div className={styles.messageMeta}>
          <span>Seven</span>
          <small>Thinking</small>
        </div>
        <div className={styles.loadingDots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </article>
  );
}

function AuthorityPanel({ authorityContext, roomIdentity }) {
  if (!authorityContext) return null;

  const sourceTitles = (Array.isArray(authorityContext?.sources) ? authorityContext.sources : [])
    .map((source) => normalizeText(source?.title))
    .filter(Boolean)
    .slice(0, 3);
  const diagnostics = (Array.isArray(authorityContext?.diagnostics) ? authorityContext.diagnostics : [])
    .map((diagnostic) => normalizeText(diagnostic?.message))
    .filter(Boolean)
    .slice(0, 3);
  const artifact = authorityContext?.artifact || {};
  const runtime = authorityContext?.runtime || {};
  const operateSummary = authorityContext?.adjacent?.operate || null;
  const canonSource = authorityContext?.canonSource || authorityContext?.assembly || null;
  const focusedWitness = authorityContext?.focusedWitness || null;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <Kicker tone="neutral">Authority</Kicker>
          <strong>What is box truth right now</strong>
        </div>
      </div>

      <div className={styles.authorityGrid}>
        <div className={styles.authorityBlock}>
          <span>Box</span>
          <strong>{roomIdentity?.boxTitle || authorityContext?.project?.title || "Untitled Box"}</strong>
          {normalizeText(authorityContext?.project?.subtitle) ? (
            <p>{authorityContext.project.subtitle}</p>
          ) : null}
        </div>

        <div className={styles.authorityBlock}>
          <span>Conversation</span>
          <strong>{roomIdentity?.conversationTitle || authorityContext?.session?.title || "Conversation"}</strong>
          <p>{roomIdentity?.canonScopeLabel || "Canon stays box-level across conversations."}</p>
        </div>

        <div className={styles.authorityBlock}>
          <span>Canon source</span>
          <strong>{canonSource?.title || "Hidden Room source"}</strong>
          <p>{normalizeText(artifact?.compileState) || "unknown"} • {Number(artifact?.clauseCount) || 0} clauses</p>
        </div>

        <div className={styles.authorityBlock}>
          <span>Runtime state</span>
          <strong>
            {normalizeText(runtime?.state) || "open"}
          </strong>
          <p>
            {normalizeText(runtime?.nextBestAction) || "No runtime nudge right now."}
          </p>
        </div>

        <div className={styles.authorityBlock}>
          <span>Recent sources</span>
          {sourceTitles.length ? (
            <ul className={styles.authorityList}>
              {sourceTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          ) : (
            <p>No recent source witness in view yet.</p>
          )}
        </div>

        <div className={styles.authorityBlock}>
          <span>Focused witness</span>
          {focusedWitness?.title ? (
            <>
              <strong>{focusedWitness.title}</strong>
              <p>{normalizeText(focusedWitness?.sourceSummary) || "Witness focus is open in this room."}</p>
            </>
          ) : (
            <p>No witness focus is open.</p>
          )}
        </div>

        <div className={styles.authorityBlock}>
          <span>Adjacent advisory</span>
          {operateSummary?.available ? (
            <>
              <strong>{operateSummary?.hasRun ? "Operate ready" : "Operate available"}</strong>
              <p>
                {operateSummary?.hasRun && normalizeText(operateSummary?.nextMove)
                  ? operateSummary.nextMove
                  : "Operate stays box-level and non-canonical here."}
              </p>
            </>
          ) : (
            <p>No adjacent advisory read yet.</p>
          )}
        </div>

        <div className={styles.authorityBlock}>
          <span>Diagnostics</span>
          {diagnostics.length ? (
            <ul className={styles.authorityList}>
              {diagnostics.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : (
            <p>No current diagnostics.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkspaceManagementSection({
  view,
  projectKey,
  onOpenMode,
  onOpenWitness,
  onOpenOperate,
  onProjectSelect,
  onCreateSession,
  onActivateSession,
  onArchiveSession,
  canOpenWitness,
  canOpenOperate,
  busy,
}) {
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionActionRow}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => onOpenMode("source")}
          disabled={!normalizeText(projectKey)}
          data-testid="room-open-source"
        >
          <Upload size={14} />
          Add Source
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => onOpenMode("create")}
          data-testid="room-open-create-box"
        >
          <Plus size={14} />
          New Box
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            void onOpenWitness();
          }}
          disabled={!canOpenWitness}
          data-testid="room-open-witness"
        >
          Witness
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            void onOpenOperate();
          }}
          disabled={!canOpenOperate}
          data-testid="room-open-operate"
        >
          Operate
        </button>
      </div>

      {normalizeText(projectKey) ? (
        <RoomSessionList
          sessions={view?.sessions}
          activeSessionId={view?.session?.id}
          onCreate={onCreateSession}
          onActivate={onActivateSession}
          onArchive={onArchiveSession}
          busy={busy}
        />
      ) : null}

      <ProjectPicker
        projects={view?.projects}
        activeProjectKey={projectKey}
        onSelect={onProjectSelect}
        onCreate={() => onOpenMode("create")}
      />

      {view?.project ? (
        <ShellSurface className={styles.managementMeta}>
          <div className={styles.managementMetaRow}>
            <span>Sources</span>
            <strong>{Number(view.project.sourceCount) || 0}</strong>
          </div>
          <div className={styles.managementMetaRow}>
            <span>Drafts</span>
            <strong>{Number(view.project.receiptDraftCount) || 0}</strong>
          </div>
        </ShellSurface>
      ) : null}
    </div>
  );
}

function WorkspaceSectionContent({
  mode,
  view,
  projectKey,
  pendingStarterAction,
  highlightedRegion,
  mirrorCollapsed,
  workingEchoCollapsed,
  onToggleMirror,
  onToggleWorkingEcho,
  onOpenWitness,
  onOpenOperate,
  onClose,
  onOpenMode,
  onProjectSelect,
  onCreateSession,
  onActivateSession,
  onArchiveSession,
  onCreateBox,
  onSourceComplete,
  onRunOperate,
  onAskSevenAudit,
  operatePending,
  operateError,
  operateResult,
  busy,
}) {
  if (mode === "threads") {
    return (
      <RoomSessionList
        sessions={view?.sessions}
        activeSessionId={view?.session?.id}
        onCreate={onCreateSession}
        onActivate={onActivateSession}
        onArchive={onArchiveSession}
        busy={busy}
      />
    );
  }

  if (mode === "mirror") {
    return (
      <div className={styles.sectionStack}>
        {view?.hasStructure ? (
          <MirrorPanel
            view={view}
            highlightedRegion={highlightedRegion}
            collapsed={mirrorCollapsed}
            onToggle={onToggleMirror}
            onOpenWitness={onOpenWitness}
          />
        ) : (
          <ShellSurface className={styles.sectionNotice} roomy>
            <p>No mirror is visible yet. Start with a source and a declared aim.</p>
          </ShellSurface>
        )}
        {view?.workingEcho ? (
          <WorkingEchoPanel
            workingEcho={view.workingEcho}
            collapsed={workingEchoCollapsed}
            onToggle={onToggleWorkingEcho}
          />
        ) : null}
        <AuthorityPanel authorityContext={view?.authorityContext} roomIdentity={view?.roomIdentity} />
      </div>
    );
  }

  if (mode === "witness") {
    return <FocusedWitnessPanel focusedWitness={view?.focusedWitness} onBack={onClose} />;
  }

  if (mode === "operate") {
    return (
      <OperatePanel
        operateSummary={view?.adjacent?.operate || null}
        pending={operatePending}
        error={operateError}
        result={operateResult}
        onRun={onRunOperate}
        onAskSeven={onAskSevenAudit}
        onBack={onClose}
      />
    );
  }

  if (mode === "context" || mode === "boxes") {
    return (
      <WorkspaceManagementSection
        view={view}
        projectKey={projectKey}
        onOpenMode={onOpenMode}
        onOpenWitness={onOpenWitness}
        onOpenOperate={onOpenOperate}
        onProjectSelect={onProjectSelect}
        onCreateSession={onCreateSession}
        onActivateSession={onActivateSession}
        onArchiveSession={onArchiveSession}
        canOpenWitness={Boolean(normalizeText(view?.focusedWitness?.openHref || view?.deepLinks?.reader))}
        canOpenOperate={Boolean(
          normalizeText(view?.adjacent?.operate?.openHref) || view?.adjacent?.operate?.available,
        )}
        busy={busy}
      />
    );
  }

  if (mode === "source") {
    return (
      <SourceTray
        projectKey={projectKey}
        onComplete={onSourceComplete}
        initialMode={pendingStarterAction || "upload"}
      />
    );
  }

  if (mode === "create") {
    return <CreateBoxForm onCreate={onCreateBox} busy={busy} />;
  }

  return null;
}

function buildDreamHref(documentId = "", anchor = "") {
  const params = new URLSearchParams();
  if (normalizeText(documentId)) {
    params.set("document", normalizeText(documentId));
  }
  if (normalizeText(anchor)) {
    params.set("anchor", normalizeText(anchor));
  }
  const query = params.toString();
  return query ? `/dream?${query}` : "/dream";
}

export default function RoomWorkspace({
  initialView,
  initialSection = "",
  workspaceLabel = "Personal",
}) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [composerText, setComposerText] = useState("");
  const [turnPending, setTurnPending] = useState(false);
  const [actionPending, startActionTransition] = useTransition();
  const [messageError, setMessageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [mirrorCollapsed, setMirrorCollapsed] = useState(false);
  const [overlayMode, setOverlayMode] = useState(() => {
    const requestedSection = normalizeSectionId(initialSection);
    if (requestedSection === "context" || requestedSection === "boxes") return "threads";
    if (requestedSection) return requestedSection;
    const nextIntent = normalizeText(initialView?.overlayIntent).toLowerCase();
    return nextIntent === "instrument" ? "threads" : nextIntent === "boxes" ? "threads" : nextIntent;
  });
  const [applyingMessageId, setApplyingMessageId] = useState("");
  const [busyReceiptKitId, setBusyReceiptKitId] = useState("");
  const [operatePending, setOperatePending] = useState(false);
  const [operateError, setOperateError] = useState("");
  const [operateResult, setOperateResult] = useState(null);
  const [highlightedRegion, setHighlightedRegion] = useState("");
  const [workingEchoCollapsed, setWorkingEchoCollapsed] = useState(false);
  const [optimisticUserMessage, setOptimisticUserMessage] = useState("");
  const [pendingDreamBridgePayload, setPendingDreamBridgePayload] = useState(null);
  const [dismissedDreamBridgePayload, setDismissedDreamBridgePayload] = useState(null);
  const [pendingStarterAction, setPendingStarterAction] = useState("");
  const [composerFocusSignal, setComposerFocusSignal] = useState(0);
  const [postAddGuidance, setPostAddGuidance] = useState(null);
  const [resumeBanner, setResumeBanner] = useState(null);
  const threadRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const overlayIntentKeyRef = useRef("");
  const persistedDreamBridgePayload = normalizeDreamBridgePayload(view?.bridgeContext);
  const dreamBridgePayload =
    pendingDreamBridgePayload ||
    (persistedDreamBridgePayload
      ? { ...persistedDreamBridgePayload, state: "sent" }
      : null);
  const projectKey = view?.project?.projectKey || "";
  const activeSessionId = view?.session?.id || "";
  const currentFocusedDocumentKey = view?.focusedWitness?.documentKey || "";
  const messages = Array.isArray(view?.messages) ? view.messages : [];
  const roomDraftKey = getRoomDraftKey(projectKey, activeSessionId);
  const hasRecentSources = Array.isArray(view?.recentSources) && view.recentSources.length > 0;
  const meaningfulConversation = hasMeaningfulConversation(view);
  const showStarter =
    Boolean(view?.starter?.show) && messages.length === 0 && !normalizeText(optimisticUserMessage);
  const canSend = Boolean(normalizeText(projectKey) && normalizeText(activeSessionId));
  const composerPlaceholder = meaningfulConversation
    ? "Continue the live issue or add new source"
    : hasRecentSources
      ? "Ask Seven about this source or name the issue"
      : "Tell Seven what is live right now";
  const roomTitle = normalizeText(view?.session?.title) || "Conversation";
  const assemblyTitle = normalizeText(view?.project?.title) || "Untitled Box";
  const scopeSummary =
    normalizeText(view?.roomIdentity?.canonScopeLabel) ||
    "Canon stays assembly-level across conversations.";

  useEffect(() => {
    setView(initialView);
    setOperateError("");
    setOperateResult(null);
  }, [initialView]);

  useEffect(() => {
    const requestedSection = normalizeSectionId(initialSection);
    if (!requestedSection) return;
    const nextSection =
      requestedSection === "context" || requestedSection === "boxes"
        ? "threads"
        : requestedSection;
    setOverlayMode((current) => current || nextSection);
  }, [initialSection]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [view, turnPending]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const incomingPayload = loadDreamBridgePayload();
    if (!incomingPayload?.documentId) {
      return;
    }

    if (incomingPayload.state === "dismissed" || incomingPayload.state === "sent") {
      clearDreamBridgePayload();
      return;
    }

    setDismissedDreamBridgePayload(null);
    setPendingDreamBridgePayload(incomingPayload);
  }, []);

  useEffect(() => {
    if (!dismissedDreamBridgePayload?.documentId) return;
    const timeoutId = window.setTimeout(() => {
      setDismissedDreamBridgePayload(null);
    }, BRIDGE_DISMISS_RECOVERY_MS);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dismissedDreamBridgePayload]);

  useEffect(() => {
    if (!dreamBridgePayload?.documentId) return;
    setDismissedDreamBridgePayload(null);
  }, [dreamBridgePayload?.documentId, dreamBridgePayload?.savedAt, dreamBridgePayload?.state]);

  useEffect(() => {
    setDismissedDreamBridgePayload(null);
  }, [activeSessionId, currentFocusedDocumentKey, projectKey]);

  useEffect(() => {
    if (!roomDraftKey) return;
    setComposerText(loadSessionDraft(roomDraftKey));
  }, [roomDraftKey]);

  useEffect(() => {
    if (!roomDraftKey) return;
    saveSessionDraft(roomDraftKey, composerText);
  }, [composerText, roomDraftKey]);

  useEffect(() => {
    if (!projectKey || !activeSessionId) return;
    let cancelled = false;

    async function syncResumeBanner() {
      const previous = loadRuntimeSurfaceResumeState();
      const lastSeenAt = Date.parse(previous?.lastSeenAt || "") || 0;
      const shouldOfferLibraryResume = Boolean(
        previous?.lastSurface === "dream" &&
          previous?.library?.documentId &&
          Date.now() - lastSeenAt >= ROOM_IDLE_RESUME_MS,
      );

      saveRuntimeSurfaceResumeState({
        surface: "room",
        room: {
          projectKey,
          sessionId: activeSessionId,
          title: view?.session?.title || "Room",
          updatedAt: view?.session?.updatedAt || new Date().toISOString(),
        },
      });

      if (!shouldOfferLibraryResume) {
        if (!cancelled) {
          setResumeBanner(null);
        }
        return;
      }

      try {
        const dreamDocuments = await listDreamDocuments();
        const resumeDocument = dreamDocuments.find(
          (document) => normalizeText(document?.id) === normalizeText(previous?.library?.documentId),
        );
        if (!resumeDocument?.id) {
          clearRuntimeSurfaceResumeLibrary();
          if (!cancelled) {
            setResumeBanner(null);
          }
          return;
        }

        if (!cancelled) {
          setResumeBanner({
            documentId: resumeDocument.id,
            anchor: previous.library.anchor || "",
            libraryTitle: previous.library.title || resumeDocument.filename || "",
          });
        }
      } catch {
        if (!cancelled) {
          setResumeBanner(null);
        }
      }
    }

    void syncResumeBanner();

    return () => {
      cancelled = true;
    };
  }, [activeSessionId, projectKey, view?.session?.title, view?.session?.updatedAt]);

  function applyRoomView(nextView, { clearPendingBridge = false } = {}) {
    setView(nextView);
    if (clearPendingBridge) {
      setPendingDreamBridgePayload(null);
      setDismissedDreamBridgePayload(null);
      clearDreamBridgePayload();
    }
  }

  useEffect(() => {
    const rawIntent = normalizeText(view?.overlayIntent).toLowerCase();
    const nextIntent =
      rawIntent === "instrument" || rawIntent === "boxes"
        ? "threads"
        : rawIntent;
    const intentKey = [nextIntent, projectKey, activeSessionId, currentFocusedDocumentKey].join(":");
    if (!nextIntent || overlayMode || overlayIntentKeyRef.current === intentKey) return;
    overlayIntentKeyRef.current = intentKey;
    setOverlayMode(nextIntent);
  }, [activeSessionId, currentFocusedDocumentKey, overlayMode, projectKey, view?.overlayIntent]);

  function highlightRegion(region = "") {
    const normalizedRegion = normalizeText(region).toLowerCase();
    if (!normalizedRegion) return;
    setHighlightedRegion(normalizedRegion);
    setMirrorCollapsed(false);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedRegion("");
    }, 1400);
  }

  function resolveStarterAction(nextAction = "") {
    const normalizedAction = normalizeText(nextAction).toLowerCase();
    if (!normalizedAction) return;
    if (normalizedAction === "talk") {
      setComposerFocusSignal((current) => current + 1);
      return;
    }
    setPendingStarterAction(normalizedAction);
    setOverlayMode("source");
  }

  async function refreshRoom(
    nextProjectKey = projectKey,
    nextSessionId = activeSessionId,
    nextDocumentKey = currentFocusedDocumentKey,
    nextAdjacent = "",
  ) {
    const params = new URLSearchParams();
    if (normalizeText(nextProjectKey)) {
      params.set("projectKey", normalizeText(nextProjectKey));
    }
    if (normalizeText(nextSessionId)) {
      params.set("sessionId", normalizeText(nextSessionId));
    }
    if (normalizeText(nextDocumentKey)) {
      params.set("documentKey", normalizeText(nextDocumentKey));
    }
    if (normalizeText(nextAdjacent)) {
      params.set("adjacent", normalizeText(nextAdjacent));
    }
    const response = await fetch(`/api/workspace/room${params.toString() ? `?${params.toString()}` : ""}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "Could not refresh the room.");
    }
    applyRoomView(payload.view);
    return payload.view;
  }

  async function handleProjectSelect(nextProjectKey, { starterAction = "" } = {}) {
    setActionError("");
    try {
      await refreshRoom(nextProjectKey, "", "", "");
      setPendingDreamBridgePayload(null);
      setPostAddGuidance(null);
      setResumeBanner(null);
      clearDreamBridgePayload();
      setPendingStarterAction("");
      startActionTransition(() => {
        router.replace(buildWorkspaceHref(nextProjectKey), { scroll: false });
      });
      if (normalizeText(starterAction)) {
        resolveStarterAction(starterAction);
      } else {
        setOverlayMode("");
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not open that box.");
    }
  }

  async function handleCreateBox({ title, subtitle }) {
    const response = await fetch("/api/workspace/project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, subtitle }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "Could not create the box.");
    }
    await handleProjectSelect(payload?.project?.projectKey || "", {
      starterAction: pendingStarterAction,
    });
  }

  async function createDefaultBox(starterAction = "paste") {
    const response = await fetch("/api/workspace/project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Untitled Box", subtitle: "" }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "Could not create the box.");
    }
    await handleProjectSelect(payload?.project?.projectKey || "", {
      starterAction,
    });
    return payload?.project?.projectKey || "";
  }

  async function seedLibraryDocumentFromRoomSource(sourceDocument = null) {
    if (!sourceDocument?.rawMarkdown) return null;
    try {
      const documentRecord = await buildDreamDocumentRecord({
        filename: buildDreamFilenameFromRoomSource(sourceDocument),
        rawMarkdown: sourceDocument.rawMarkdown,
        sourceKind: "upload",
      });
      await saveDreamDocument(documentRecord);
      return documentRecord;
    } catch {
      return null;
    }
  }

  function buildPostAddGuidance(nextView, dreamDocument = null) {
    const meaningfulConversation = hasMeaningfulConversation(nextView);
    return {
      dreamDocumentId: dreamDocument?.id || "",
      dreamAnchor: "",
      primaryAction: meaningfulConversation ? "room" : "library",
      primaryLabel: meaningfulConversation ? "Ask Seven here" : "Open in Library for structural read",
      secondaryLabel: meaningfulConversation ? "Open in Library" : "Ask Seven here",
      headline: meaningfulConversation
        ? "Your source is ready inside the live thread."
        : "Your source is ready for structural read.",
      body: meaningfulConversation
        ? "Stay in Room when the live issue is already underway. Open Library when you want a structural read before the next move."
        : "Open Library when you want the structural read first. Stay here if you already know the question you want to ask Seven.",
    };
  }

  async function handleSourceComplete(payload = null) {
    setActionError("");
    const sourceDocument = payload?.document || payload?.sourceDocument || null;
    const seededDreamDocument = await seedLibraryDocumentFromRoomSource(sourceDocument);
    const nextView = await refreshRoom(projectKey, activeSessionId, currentFocusedDocumentKey);
    setPostAddGuidance(buildPostAddGuidance(nextView, seededDreamDocument));
    setOverlayMode("");
    setPendingStarterAction("");
  }

  async function handleCreateSession() {
    if (!normalizeText(projectKey)) return;
    setActionError("");
    try {
      const response = await fetch("/api/workspace/room/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          documentKey: currentFocusedDocumentKey,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not start a new conversation.");
      }
      applyRoomView(payload.view, { clearPendingBridge: true });
      setComposerText("");
      saveSessionDraft(roomDraftKey, "");
      setMessageError("");
      setPostAddGuidance(null);
      startActionTransition(() => {
        router.replace(
          buildWorkspaceHref(projectKey, {
            sessionId: payload?.view?.session?.id || "",
            documentKey: currentFocusedDocumentKey,
          }),
          { scroll: false },
        );
      });
      setOverlayMode("");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not start a new conversation.",
      );
    }
  }

  async function handleActivateSession(nextSessionId) {
    if (!normalizeText(projectKey) || !normalizeText(nextSessionId)) return;
    setActionError("");
    try {
      const response = await fetch("/api/workspace/room/sessions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          sessionId: nextSessionId,
          documentKey: currentFocusedDocumentKey,
          action: "activate",
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not open that conversation.");
      }
      applyRoomView(payload.view, { clearPendingBridge: true });
      setPostAddGuidance(null);
      startActionTransition(() => {
        router.replace(
          buildWorkspaceHref(projectKey, {
            sessionId: payload?.view?.session?.id || nextSessionId,
            documentKey: currentFocusedDocumentKey,
          }),
          { scroll: false },
        );
      });
      setOverlayMode("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not open that conversation.");
    }
  }

  async function handleArchiveSession(nextSessionId) {
    if (!normalizeText(projectKey) || !normalizeText(nextSessionId)) return;
    setActionError("");
    try {
      const response = await fetch("/api/workspace/room/sessions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          sessionId: nextSessionId,
          documentKey: currentFocusedDocumentKey,
          action: "archive",
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not archive that conversation.");
      }
      applyRoomView(payload.view, { clearPendingBridge: true });
      setPostAddGuidance(null);
      startActionTransition(() => {
        router.replace(
          buildWorkspaceHref(projectKey, {
            sessionId: payload?.view?.session?.id || "",
            documentKey: currentFocusedDocumentKey,
          }),
          { scroll: false },
        );
      });
      setOverlayMode("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not archive that conversation.");
    }
  }

  async function handleTurnSubmit(event) {
    event.preventDefault();
    if (!normalizeText(projectKey) || !normalizeText(activeSessionId)) {
      setMessageError("Open a room to start talking.");
      return;
    }
    const message = normalizeLongForm(composerText);
    if (!message) return;
    setTurnPending(true);
    setMessageError("");
    setOptimisticUserMessage(message);
    setPostAddGuidance(null);
    setResumeBanner(null);
    setDismissedDreamBridgePayload(null);
    setComposerText("");
    saveSessionDraft(roomDraftKey, "");
    const bridgePayload =
      pendingDreamBridgePayload?.state === "armed" ? pendingDreamBridgePayload : null;
    try {
      const response = await fetch("/api/workspace/room/turn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          sessionId: activeSessionId,
          documentKey: currentFocusedDocumentKey,
          message,
          bridgePayload,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "The room did not answer.");
      }
      applyRoomView(payload.view, { clearPendingBridge: Boolean(bridgePayload) });
      setOptimisticUserMessage("");
    } catch (error) {
      setComposerText((current) => current || message);
      setOptimisticUserMessage("");
      setMessageError(error instanceof Error ? error.message : "The room did not answer.");
    } finally {
      setTurnPending(false);
    }
  }

  async function handleApplyProposal(message) {
    const roomPayload = message?.roomPayload;
    if (!hasProposalContent(roomPayload)) return;
    setApplyingMessageId(message.id);
    setActionError("");
    try {
      const response = await fetch("/api/workspace/room/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          sessionId: activeSessionId,
          documentKey: currentFocusedDocumentKey,
          action: "apply_proposal_preview",
          assistantMessageId: message.id,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not apply the proposal.");
      }
      applyRoomView(payload.view);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not apply the proposal.");
    } finally {
      setApplyingMessageId("");
    }
  }

  async function handleCompleteReceiptKit({ receiptKit, completion }) {
    setBusyReceiptKitId(receiptKit?.id || "");
    setActionError("");
    try {
      const nextCompletion = { ...(completion || {}) };
      if (nextCompletion.uploadFile instanceof File) {
        const formData = new FormData();
        formData.set("file", nextCompletion.uploadFile);
        formData.set("projectKey", projectKey);
        const uploadResponse = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });
        const uploadPayload = await uploadResponse.json().catch(() => null);
        if (!uploadResponse.ok) {
          throw new Error(uploadPayload?.error || "Could not upload the return.");
        }
        nextCompletion.uploadedDocument = uploadPayload?.document || null;
        delete nextCompletion.uploadFile;
      }
      if (normalizeText(nextCompletion.linkUrl)) {
        const linkResponse = await fetch("/api/workspace/link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectKey,
            url: normalizeText(nextCompletion.linkUrl),
          }),
        });
        const linkPayload = await linkResponse.json().catch(() => null);
        if (!linkResponse.ok) {
          throw new Error(linkPayload?.error || "Could not capture the return link.");
        }
        nextCompletion.uploadedDocument = linkPayload?.document || nextCompletion.uploadedDocument || null;
      }

      const response = await fetch("/api/workspace/room/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          sessionId: activeSessionId,
          documentKey: currentFocusedDocumentKey,
          action: "complete_receipt_kit",
          receiptKit,
          completion: nextCompletion,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not record the return.");
      }
      applyRoomView(payload.view);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not record the return.");
    } finally {
      setBusyReceiptKitId("");
    }
  }

  async function loadOperateSummary() {
    if (!normalizeText(projectKey)) return null;
    setOperatePending(true);
    setOperateError("");
    try {
      const params = new URLSearchParams();
      params.set("projectKey", projectKey);
      params.set("mode", "summary");
      const response = await fetch(`/api/workspace/operate?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Operate could not load the latest box read.");
      }
      setOperateResult(payload?.result || null);
      return payload?.result || null;
    } catch (error) {
      setOperateResult(null);
      setOperateError(
        error instanceof Error ? error.message : "Operate could not load the latest box read.",
      );
      return null;
    } finally {
      setOperatePending(false);
    }
  }

  async function handleRunOperate() {
    if (!normalizeText(projectKey)) return;
    setOperatePending(true);
    setOperateError("");
    try {
      const response = await fetch("/api/workspace/operate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          mode: "summary",
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Operate could not finish.");
      }
      setOperateResult(payload?.result || null);
      await refreshRoom(projectKey, activeSessionId, currentFocusedDocumentKey, "operate");
    } catch (error) {
      setOperateError(error instanceof Error ? error.message : "Operate could not finish.");
    } finally {
      setOperatePending(false);
    }
  }

  function handleAskSevenAudit() {
    const result = operateResult;
    if (!result) return;
    setComposerText(buildOperateAuditPrompt(result));
    handleCloseOverlay();
  }

  async function handleStarterAction(nextAction = "") {
    const normalizedAction = normalizeText(nextAction).toLowerCase();
    if (!normalizedAction) return;

    setActionError("");
    try {
      if (normalizedAction === "talk") {
        if (!normalizeText(projectKey)) {
          await createDefaultBox("talk");
          return;
        }
        setComposerFocusSignal((current) => current + 1);
        return;
      }

      if (!normalizeText(projectKey)) {
        await createDefaultBox(normalizedAction);
        return;
      }

      setPendingStarterAction(normalizedAction);
      setOverlayMode("source");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not start the room.");
    }
  }

  async function handleOpenSourceFromComposer(mode = "upload") {
    const nextMode =
      mode === "paste" ? "paste" : mode === "link" ? "link" : mode === "library" ? "library" : "upload";
    setActionError("");
    try {
      if (!normalizeText(projectKey)) {
        await createDefaultBox(nextMode === "library" ? "upload" : nextMode);
        return;
      }
      if (nextMode === "library") {
        router.push("/dream");
        return;
      }
      setPendingStarterAction(nextMode);
      setOverlayMode("source");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not open source intake.");
    }
  }

  function handleOpenGuidanceLibrary() {
    if (postAddGuidance?.dreamDocumentId) {
      setActiveDreamDocument(postAddGuidance.dreamDocumentId);
      router.push(buildDreamHref(postAddGuidance.dreamDocumentId, postAddGuidance.dreamAnchor || ""));
    } else {
      router.push("/dream");
    }
    setPostAddGuidance(null);
  }

  function handleAskSevenHere() {
    setPostAddGuidance(null);
    setComposerFocusSignal((current) => current + 1);
  }

  function handleDismissResumeBanner() {
    setResumeBanner(null);
  }

  function handleReturnToLibrary() {
    if (!resumeBanner?.documentId) {
      router.push("/dream");
      return;
    }
    setActiveDreamDocument(resumeBanner.documentId);
    router.push(buildDreamHref(resumeBanner.documentId, resumeBanner.anchor || ""));
    setResumeBanner(null);
  }

  function handleUseDreamBridge() {
    if (!dreamBridgePayload?.documentId) return;
    const nextPayload = normalizeDreamBridgePayload({
      ...dreamBridgePayload,
      state: "armed",
    });
    if (nextPayload) {
      setPendingDreamBridgePayload(nextPayload);
      saveDreamBridgePayload(nextPayload);
    }
    setComposerFocusSignal((current) => current + 1);
  }

  function handleDismissDreamBridge() {
    if (dreamBridgePayload?.documentId) {
      setDismissedDreamBridgePayload(dreamBridgePayload);
    }
    setPendingDreamBridgePayload(null);
    clearDreamBridgePayload();
  }

  function handleRestoreDreamBridge() {
    const nextPayload = normalizeDreamBridgePayload(dismissedDreamBridgePayload);
    if (!nextPayload?.documentId) return;
    setPendingDreamBridgePayload(nextPayload);
    saveDreamBridgePayload(nextPayload);
    setDismissedDreamBridgePayload(null);
  }

  async function handleOpenWitness(nextDocumentKey = "") {
    const targetDocumentKey =
      normalizeText(nextDocumentKey) ||
      currentFocusedDocumentKey ||
      extractDocumentKeyFromWorkspaceHref(view?.deepLinks?.reader || "");
    const witnessHref = targetDocumentKey
      ? buildWitnessHref(projectKey, activeSessionId, targetDocumentKey)
      : normalizeText(view?.focusedWitness?.openHref || view?.deepLinks?.reader);
    if (!witnessHref) return;
    const alreadyFocused = Boolean(
      targetDocumentKey &&
        currentFocusedDocumentKey &&
        targetDocumentKey === currentFocusedDocumentKey &&
        view?.focusedWitness,
    );
    if (alreadyFocused) {
      setOverlayMode("witness");
      return;
    }
    try {
      await refreshRoom(projectKey, activeSessionId, targetDocumentKey, "witness");
      startActionTransition(() => {
        router.replace(witnessHref, { scroll: false });
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not open that witness.");
    }
  }

  async function handleOpenOperate() {
    const operateHref = normalizeText(view?.adjacent?.operate?.openHref);
    try {
      await refreshRoom(projectKey, activeSessionId, currentFocusedDocumentKey, "operate");
      if (operateHref) {
        startActionTransition(() => {
          router.replace(operateHref, { scroll: false });
        });
      }
      setOverlayMode("operate");
      if (view?.adjacent?.operate?.hasRun) {
        await loadOperateSummary();
      } else {
        setOperateError("");
        setOperateResult(null);
      }
    } catch (error) {
      setOperateError(error instanceof Error ? error.message : "Could not open Operate.");
    }
  }

  function handleCloseOverlay() {
    const nextMode = normalizeText(overlayMode).toLowerCase();
    setOverlayMode("");
    if (nextMode === "create") {
      setPendingStarterAction("");
    }
    if (nextMode === "source") {
      setPendingStarterAction("");
    }
    if (nextMode === "witness") {
      startActionTransition(() => {
        router.replace(
          buildWorkspaceHref(projectKey, {
            sessionId: activeSessionId,
          }),
          { scroll: false },
        );
      });
      return;
    }
    if (nextMode === "operate") {
      startActionTransition(() => {
        router.replace(
          buildWorkspaceHref(projectKey, {
            sessionId: activeSessionId,
            ...(currentFocusedDocumentKey ? { documentKey: currentFocusedDocumentKey } : {}),
          }),
          { scroll: false },
        );
      });
    }
  }

  const activeSectionMode = normalizeText(overlayMode).toLowerCase();
  const sectionMeta =
    activeSectionMode === "threads"
      ? { label: "Conversations", title: view?.session?.title || "Conversations" }
      : activeSectionMode === "mirror"
      ? { label: "Live Read", title: view?.project?.title || "Room" }
      : activeSectionMode === "witness"
        ? { label: "Source Detail", title: view?.focusedWitness?.title || "Focused witness" }
        : activeSectionMode === "operate"
          ? { label: "Audit", title: view?.project?.title || "Box advisory" }
          : activeSectionMode === "source"
              ? { label: "Source", title: "Add source" }
              : activeSectionMode === "create"
                ? { label: "Start Room", title: "Create the internal room container" }
                : { label: "", title: "" };

  const scopeControl = (
    <button
      type="button"
      className={styles.contextButton}
      onClick={() => setOverlayMode("context")}
      data-testid="room-scope-control"
    >
      <span>{scopeSummary}</span>
      <small>{assemblyTitle}</small>
    </button>
  );

  const roomRail = (
    <div className={styles.sectionStack} data-testid="room-shell-rail">
      <RoomSessionList
        sessions={view?.sessions}
        activeSessionId={view?.session?.id}
        onCreate={handleCreateSession}
        onActivate={handleActivateSession}
        onArchive={handleArchiveSession}
        busy={actionPending}
      />

      <RoomArtifactList
        sources={view?.recentSources}
        onOpenWitness={(nextDocumentKey) => {
          void handleOpenWitness(nextDocumentKey);
        }}
      />

      <ProjectPicker
        projects={view?.projects}
        activeProjectKey={projectKey}
        onSelect={(nextProjectKey) => {
          void handleProjectSelect(nextProjectKey);
        }}
        onCreate={() => setOverlayMode("create")}
      />
    </div>
  );

  const workspaceMain = (
    <div className={styles.workspaceMain} data-testid="room-workspace">
      {actionError || messageError ? (
        <div className={styles.bannerStack}>
          {actionError ? <p className={styles.errorBanner}>{actionError}</p> : null}
          {messageError ? <p className={styles.errorBanner}>{messageError}</p> : null}
        </div>
      ) : null}

      {resumeBanner ? (
        <RoomResumeBanner
          resume={resumeBanner}
          onContinue={handleDismissResumeBanner}
          onReturnToLibrary={handleReturnToLibrary}
          onDismiss={handleDismissResumeBanner}
        />
      ) : null}

      {dreamBridgePayload?.documentId ? (
        <DreamBridgeNotice
          payload={dreamBridgePayload}
          onUse={handleUseDreamBridge}
          onDismiss={handleDismissDreamBridge}
        />
      ) : dismissedDreamBridgePayload?.documentId ? (
        <DreamBridgeRecoveryNotice
          payload={dismissedDreamBridgePayload}
          onRestore={handleRestoreDreamBridge}
        />
      ) : null}

      {view?.workingEcho ? (
        <WorkingEchoStrip
          view={view}
          onOpenDetail={() => setOverlayMode("mirror")}
        />
      ) : null}

      {postAddGuidance ? (
        <PostAddGuidanceCard
          guidance={postAddGuidance}
          onOpenLibrary={handleOpenGuidanceLibrary}
          onAskHere={handleAskSevenHere}
          onDismiss={() => setPostAddGuidance(null)}
        />
      ) : null}

      <div
        ref={threadRef}
        className={`${styles.threadViewport} ${showStarter ? styles.threadViewportCentered : ""}`}
      >
        {showStarter ? (
          <StarterView
            starter={view?.starter}
            onStartAction={(nextAction) => void handleStarterAction(nextAction)}
            onTeachLiveIssue={() => void handleStarterAction("talk")}
            onTeachSourceDocument={() => void handleStarterAction("paste")}
          />
        ) : null}

        <div className={styles.thread}>
          {optimisticUserMessage ? (
            <article className={`${styles.messageRow} ${styles.messageRowUser}`}>
              <div className={`${styles.messageCard} ${styles.messageUser}`}>
                <div className={styles.messageMeta}>
                  <span>You</span>
                </div>
                <div className={styles.messageBody}>
                  <p>{optimisticUserMessage}</p>
                </div>
              </div>
            </article>
          ) : null}

          {messages.map((message) => (
            <ThreadMessage
              key={message.id}
              message={message}
              view={view}
              onApplyProposal={handleApplyProposal}
              onCompleteReceiptKit={handleCompleteReceiptKit}
              applying={applyingMessageId === message.id}
              busyReceiptKitId={busyReceiptKitId}
              onHighlight={highlightRegion}
            />
          ))}

          {turnPending ? <LoadingMessage /> : null}

          {!messages.length && !showStarter && !view?.hasStructure ? (
            <div className={styles.emptyThread}>
              <FogPlaceholder>Unresolved regions belong here until witness arrives.</FogPlaceholder>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <LoegosShell
      route="workspace"
      lensLabel="Room"
      title={roomTitle}
      workspaceLabel={workspaceLabel}
      scopeControl={scopeControl}
      rail={roomRail}
      main={workspaceMain}
      composer={
        <Composer
          value={composerText}
          onChange={setComposerText}
          onSubmit={handleTurnSubmit}
          pending={turnPending}
          placeholder={composerPlaceholder}
          disabled={!canSend}
          onOpenAttach={() => void handleOpenSourceFromComposer("upload")}
          attachActions={[
            {
              label: "Paste source",
              onClick: () => void handleOpenSourceFromComposer("paste"),
              testId: "room-composer-bloom-paste",
            },
            {
              label: "Upload file",
              onClick: () => void handleOpenSourceFromComposer("upload"),
              testId: "room-composer-bloom-upload",
            },
            {
              label: "Capture link",
              onClick: () => void handleOpenSourceFromComposer("link"),
              testId: "room-composer-bloom-link",
            },
            {
              label: "Open Library",
              onClick: () => void handleOpenSourceFromComposer("library"),
              testId: "room-composer-bloom-library",
            },
          ]}
          listenHref={view?.deepLinks?.reader || ""}
          focusSignal={composerFocusSignal}
          scopeLabel={assemblyTitle}
          scopeDetail={scopeSummary}
        />
      }
      sheet={{
        open: Boolean(activeSectionMode),
        label: sectionMeta.label,
        title: sectionMeta.title,
        onClose: handleCloseOverlay,
        children: (
          <WorkspaceSectionContent
            mode={activeSectionMode}
            view={view}
            projectKey={projectKey}
            pendingStarterAction={pendingStarterAction}
            highlightedRegion={highlightedRegion}
            mirrorCollapsed={mirrorCollapsed}
            workingEchoCollapsed={workingEchoCollapsed}
            onToggleMirror={() => setMirrorCollapsed((current) => !current)}
            onToggleWorkingEcho={() => setWorkingEchoCollapsed((current) => !current)}
            onOpenWitness={handleOpenWitness}
            onOpenOperate={handleOpenOperate}
            onClose={handleCloseOverlay}
            onOpenMode={setOverlayMode}
            onProjectSelect={handleProjectSelect}
            onCreateSession={handleCreateSession}
            onActivateSession={handleActivateSession}
            onArchiveSession={handleArchiveSession}
            onCreateBox={handleCreateBox}
            onSourceComplete={handleSourceComplete}
            onRunOperate={handleRunOperate}
            onAskSevenAudit={handleAskSevenAudit}
            operatePending={operatePending}
            operateError={operateError}
            operateResult={operateResult}
            busy={actionPending}
          />
        ),
      }}
    />
  );
}
