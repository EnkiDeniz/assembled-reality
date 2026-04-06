"use client";

import { useMemo, useState } from "react";
import { ShapeGlyph, SignalChip } from "@/components/LoegosSystem";
import {
  ASSEMBLY_CONFIRMATION_STATUSES,
  ASSEMBLY_PRIMARY_TAGS,
} from "@/lib/assembly-architecture";
import { buildFormalSentenceAnnotations } from "@/lib/formal-core/runtime";
import { getOverlaySignalTone } from "@/lib/operate-overlay";
import { buildWorkspaceBlockProvenanceView } from "@/lib/workspace-provenance";

function getConfirmationStateView(block = null) {
  const status = String(block?.confirmationStatus || "").trim().toLowerCase();
  const tag = String(block?.primaryTag || "").trim().toLowerCase();

  if (status === ASSEMBLY_CONFIRMATION_STATUSES.confirmed) {
    return {
      label: tag ? `${tag} confirmed` : "confirmed",
      tone: "green",
    };
  }

  if (status === ASSEMBLY_CONFIRMATION_STATUSES.discarded) {
    return {
      label: "discarded",
      tone: "red",
    };
  }

  return {
    label: "draft",
    tone: "neutral",
  };
}

function buildBlockMetaDetail(block = null) {
  if (!block) return "";
  const currentTag = String(block?.primaryTag || "").trim().toLowerCase();
  if (!currentTag || currentTag === ASSEMBLY_PRIMARY_TAGS.unconfirmed) return "";
  return currentTag;
}

function getFormalSignalHintForBlock(block = null) {
  if (!block) return "neutral";
  if (block.author === "ai" || block.operation === "edited") return "amber";
  if (String(block.confirmationStatus || "").trim().toLowerCase() === "confirmed") return "green";
  return "neutral";
}

function getFormalDiagnosticTone(level = "") {
  const normalized = String(level || "").trim().toLowerCase();
  if (normalized === "error") return "alert";
  if (normalized === "warn") return "active";
  return "neutral";
}

function formatShapeLabel(shapeKey = "") {
  const normalized = String(shapeKey || "").trim();
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatOverlaySignalLabel(signal = "") {
  const normalized = String(signal || "").trim().toLowerCase();
  if (normalized === "override") return "Attested";
  if (normalized === "green") return "Grounded";
  if (normalized === "red") return "Broken";
  return "Partial";
}

function buildOperateEvidenceTeaser(finding = null) {
  const evidence = Array.isArray(finding?.evidence) ? finding.evidence[0] || null : null;
  if (!evidence) return null;

  const sourceTitle = String(evidence?.documentTitle || evidence?.documentKey || "Source").trim();
  const excerpt = String(evidence?.excerpt || "")
    .replace(/\s+/g, " ")
    .trim();
  const preview =
    excerpt.length > 160 ? `${excerpt.slice(0, 159).trim()}…` : excerpt;

  if (!sourceTitle && !preview) return null;

  return {
    sourceTitle: sourceTitle || "Source",
    excerpt: preview || "Local evidence is attached to this finding.",
  };
}

function BlockFormalAnnotations({ block, annotation = null, hidePrimaryShape = false }) {
  const resolvedAnnotation = useMemo(
    () =>
      annotation ||
      buildFormalSentenceAnnotations(block?.plainText || block?.text || "", {
        sentenceIdPrefix: block?.id || "block",
        signalHint: getFormalSignalHintForBlock(block),
      }),
    [annotation, block],
  );
  const primarySentence = resolvedAnnotation.sentences[0] || null;
  const diagnostics = Array.isArray(resolvedAnnotation.diagnostics)
    ? resolvedAnnotation.diagnostics.slice(0, 2)
    : [];

  if ((!primarySentence || hidePrimaryShape) && diagnostics.length === 0) return null;

  return (
    <div className="assembler-block__formal">
      <div className="assembler-block__formal-head">
        {primarySentence && !hidePrimaryShape ? (
          <div className="assembler-block__formal-shape">
            <ShapeGlyph shapeKey={primarySentence.shapeKey} size={14} />
            <span>Reads as {formatShapeLabel(primarySentence.shapeKey)}</span>
          </div>
        ) : null}
        {primarySentence?.signal ? (
          <SignalChip tone={primarySentence.signal} subtle>
            {primarySentence.signal}
          </SignalChip>
        ) : null}
      </div>
      {diagnostics.length ? (
        <div className="assembler-block__formal-notes">
          {diagnostics.map((diagnostic, index) => (
            <div key={`${diagnostic.code || "formal"}-${index}`} className="assembler-block__formal-note">
              <SignalChip tone={getFormalDiagnosticTone(diagnostic.level)} subtle>
                {diagnostic.level || "info"}
              </SignalChip>
              <span>{diagnostic.message}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BlockOperateFinding({
  finding = null,
  selected = false,
  pending = false,
  onInspect,
}) {
  if (!finding) return null;

  const spans = Array.isArray(finding?.spans) ? finding.spans : [];
  const evidenceTeaser = selected ? buildOperateEvidenceTeaser(finding) : null;

  return (
    <div
      className={`assembler-block__operate ${selected ? "is-active" : ""}`}
      data-testid="workspace-block-finding"
    >
      <div className="assembler-block__operate-head">
        <div className="assembler-block__operate-chips">
          <SignalChip tone={getOverlaySignalTone(finding?.displaySignal || finding?.signal)} subtle>
            {formatOverlaySignalLabel(finding?.displaySignal || finding?.signal)}
          </SignalChip>
          <SignalChip tone={finding?.overrideApplied ? "neutral" : "active"} subtle>
            {finding?.trustLevel || "L1"}
          </SignalChip>
        </div>
        <button
          type="button"
          className="assembler-tiny-button"
          onClick={(event) => {
            event.stopPropagation();
            onInspect?.();
          }}
          disabled={pending}
          data-testid="workspace-finding-inspect"
        >
          {selected ? "Inspecting" : "Inspect"}
        </button>
      </div>

      {finding?.rationale ? (
        <p className="assembler-block__operate-copy">{finding.rationale}</p>
      ) : null}
      {finding?.uncertainty ? (
        <p className="assembler-block__operate-note">{finding.uncertainty}</p>
      ) : null}
      {finding?.overrideApplied ? (
        <p className="assembler-block__operate-note">
          Underlying machine read: {formatOverlaySignalLabel(finding?.baseSignal || finding?.signal)} at{" "}
          {finding?.baseTrustLevel || finding?.trustLevel || "L1"}.
        </p>
      ) : null}
      {evidenceTeaser ? (
        <article
          className="assembler-block__operate-evidence"
          data-testid="workspace-selected-finding-evidence-preview"
        >
          <span className="assembler-block__operate-evidence-label">Witness</span>
          <strong className="assembler-block__operate-evidence-title">
            {evidenceTeaser.sourceTitle}
          </strong>
          <p className="assembler-block__operate-evidence-copy">{evidenceTeaser.excerpt}</p>
        </article>
      ) : null}

      {spans.length ? (
        <div className="assembler-block__operate-spans">
          {spans.map((span) => (
            <button
              key={`${finding.blockId}:${span.start}:${span.end}`}
              type="button"
              className="assembler-block__operate-span"
              onClick={(event) => {
                event.stopPropagation();
                onInspect?.();
              }}
              disabled={pending}
            >
              <SignalChip tone={getOverlaySignalTone(span.signal)} subtle>
                {span.text}
              </SignalChip>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BlockEditor({ block, saveState, onEdit }) {
  const [draftText, setDraftText] = useState(block.text);
  const statusLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "conflict"
          ? "Reload latest before saving again"
          : saveState === "error"
            ? "Not saved"
            : "";

  return (
    <div className="assembler-block__editor-wrap">
      <textarea
        className="assembler-block__editor"
        value={draftText}
        onChange={(event) => setDraftText(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        onBlur={() => onEdit(block.id, draftText)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void onEdit(block.id, draftText);
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setDraftText(block.text);
            event.currentTarget.blur();
          }
        }}
      />

      {statusLabel ? (
        <div className={`assembler-block__editor-status is-${saveState || "idle"}`}>
          {statusLabel}
        </div>
      ) : null}
    </div>
  );
}

function BlockRow({
  block,
  documents = [],
  finding = null,
  showFinding = false,
  findingSelected = false,
  isFocused,
  isPlaying,
  isNext,
  isSelected,
  editMode,
  showNativeActions = false,
  actionPending = false,
  canDelete = false,
  saveState,
  onFocus,
  onAdd,
  onDelete,
  onRemove,
  onEdit,
  onKeepDraft,
  onAcceptInference,
  onRecastTag,
  onOpenSourceWitness,
  onInspectFinding,
  blockRef,
}) {
  const [recastOpen, setRecastOpen] = useState(false);
  const annotation = useMemo(
    () =>
      buildFormalSentenceAnnotations(block?.plainText || block?.text || "", {
        sentenceIdPrefix: block?.id || "block",
        signalHint: getFormalSignalHintForBlock(block),
      }),
    [block],
  );
  const primarySentence = annotation.sentences[0] || null;
  const inlineDiagnostics = Array.isArray(annotation?.diagnostics)
    ? annotation.diagnostics.slice(0, 2)
    : [];
  const provenanceView = useMemo(
    () => buildWorkspaceBlockProvenanceView(block, documents),
    [block, documents],
  );
  const confirmationState = useMemo(() => getConfirmationStateView(block), [block]);
  const currentTag = buildBlockMetaDetail(block);
  const controlsDisabled = actionPending || saveState === "saving";
  const canMutateBlock = Boolean(editMode && block.isEditable);
  const primaryShapeKey = primarySentence?.shapeKey || "";
  const showContextActions = showNativeActions && (isFocused || isSelected || recastOpen);
  const originLabel =
    block.sectionLabel ||
    block.sourceTitle ||
    block.sourceDocumentKey ||
    block.documentKey ||
    "Artifact";
  const showOperateFinding = Boolean(showFinding && finding);

  return (
    <article
      ref={blockRef}
      className={`assembler-block is-${block.kind} ${
        isFocused ? "is-focused" : ""
      } ${isPlaying ? "is-playing" : ""} ${isNext ? "is-next" : ""} ${
        isSelected ? "is-selected" : ""
      } ${block.author === "ai" ? "is-ai" : ""} ${
        block.operation === "edited" ? "is-edited" : ""
      }`}
      onClick={() => onFocus(block.id)}
      data-block-id={block.id}
      data-testid="workspace-block-row"
    >
      <div className="assembler-block__stripe" aria-hidden="true" />

      <div className="assembler-block__gutter">
        <span className="assembler-block__line-number">
          {String(block.sourcePosition + 1).padStart(3, "0")}
        </span>
        {primaryShapeKey ? (
          <div className="assembler-block__gutter-shape">
            <ShapeGlyph shapeKey={primaryShapeKey} size={13} />
            <span>{formatShapeLabel(primaryShapeKey)}</span>
          </div>
        ) : (
          <span className="assembler-block__gutter-detail">Untyped</span>
        )}
        <SignalChip tone={confirmationState.tone} subtle className="assembler-block__gutter-chip">
          {confirmationState.label}
        </SignalChip>
        {showOperateFinding ? (
          <>
            <SignalChip
              tone={getOverlaySignalTone(finding?.displaySignal || finding?.signal)}
              subtle
              className="assembler-block__gutter-chip"
            >
              {formatOverlaySignalLabel(finding?.displaySignal || finding?.signal)}
            </SignalChip>
            <SignalChip
              tone={finding?.overrideApplied ? "neutral" : "active"}
              subtle
              className="assembler-block__gutter-chip"
            >
              {finding?.trustLevel || "L1"}
            </SignalChip>
          </>
        ) : null}
        {currentTag ? (
          <span className="assembler-block__gutter-detail">tag · {currentTag}</span>
        ) : null}
        <span className="assembler-block__gutter-detail">{originLabel}</span>
        {provenanceView?.compact ? (
          <span className="assembler-block__gutter-detail">
            {provenanceView.label} · {provenanceView.compact}
          </span>
        ) : null}
        {showNativeActions
          ? inlineDiagnostics.map((diagnostic, index) => (
              <span
                key={`${diagnostic.code || "diag"}-${index}`}
                className={`assembler-block__gutter-detail assembler-block__gutter-detail--${String(
                  diagnostic.level || "",
                ).toLowerCase() || "info"}`}
              >
                {diagnostic.message}
              </span>
            ))
          : null}
      </div>

      <div className="assembler-block__body">
        {editMode && block.isEditable ? (
          <BlockEditor
            key={`${block.id}:${block.updatedAt || block.text}`}
            block={block}
            saveState={saveState}
            onEdit={onEdit}
          />
        ) : block.kind === "list" ? (
          <div className="assembler-block__text">
            {String(block.text || "")
              .split("\n")
              .filter(Boolean)
              .map((line, index) => (
                <div key={`${block.id}-line-${index}`} className="assembler-block__list-line">
                  <span className="assembler-block__bullet">•</span>
                  <span>{line.replace(/^[-+*]\s+/, "").trim()}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="assembler-block__text">{block.text.replace(/^#{1,6}\s+/, "")}</div>
        )}

        {block.author === "ai" ? (
          <span className="assembler-block__badge">AI-GENERATED · {block.operation}</span>
        ) : null}
        {!showNativeActions ? (
          <BlockFormalAnnotations
            block={block}
            annotation={annotation}
            hidePrimaryShape={Boolean(primaryShapeKey)}
          />
        ) : null}
        {showOperateFinding ? (
          <BlockOperateFinding
            finding={finding}
            selected={findingSelected}
            pending={controlsDisabled}
            onInspect={() => onInspectFinding?.(finding?.findingId)}
          />
        ) : null}
        {showContextActions ? (
          <div className="assembler-block__actions">
            {canMutateBlock ? (
              <>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={() => onKeepDraft?.(block)}
                  disabled={controlsDisabled}
                >
                  Keep draft
                </button>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={() => onAcceptInference?.(block, primarySentence)}
                  disabled={controlsDisabled || !primarySentence?.shapeKey}
                >
                  Accept read
                </button>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={() => setRecastOpen((value) => !value)}
                  disabled={controlsDisabled}
                >
                  Recast tag
                </button>
              </>
            ) : null}
            <button
              type="button"
              className={`assembler-tiny-button ${isSelected ? "is-active" : ""}`}
              onClick={() => (isSelected ? onRemove(block.id) : onAdd(block))}
              disabled={controlsDisabled}
            >
              {isSelected ? "Remove from weld" : "Stage into weld"}
            </button>
            <button
              type="button"
              className="assembler-tiny-button"
              onClick={() => onOpenSourceWitness?.(block)}
              disabled={controlsDisabled || !String(block?.sourceDocumentKey || block?.documentKey || "").trim()}
            >
              Open witness
            </button>
            {canDelete ? (
              <button
                type="button"
                className="assembler-tiny-button is-danger"
                onClick={() => onDelete(block.id)}
                disabled={controlsDisabled}
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
        {showContextActions && canMutateBlock && recastOpen ? (
          <div className="assembler-block__recast">
            {[
              ["Aim", ASSEMBLY_PRIMARY_TAGS.aim],
              ["Evidence", ASSEMBLY_PRIMARY_TAGS.evidence],
              ["Story", ASSEMBLY_PRIMARY_TAGS.story],
            ].map(([label, tag]) => (
              <button
                key={tag}
                type="button"
                className={`assembler-tiny-button ${currentTag === tag ? "is-active" : ""}`}
                onClick={() => {
                  setRecastOpen(false);
                  onRecastTag?.(block, tag);
                }}
                disabled={controlsDisabled}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function WorkspaceDocumentWorkbench({
  className = "",
  streamClassName = "",
  blocksClassName = "assembler-document__blocks",
  prefixContent = null,
  blocks = [],
  documents = [],
  operateOverlayFindingMap = null,
  showingInlineOperateDocument = false,
  operateOverlayOpen = false,
  selectedOperateFindingId = "",
  blockRefs = null,
  focusBlockId = "",
  currentBlockId = "",
  nextBlockId = "",
  isPlaying = false,
  selectedBlockIds = [],
  editMode = false,
  showNativeActions = false,
  blockActionPendingId = "",
  canDeleteBlock = false,
  blockSaveStates = {},
  emptyTitle = "No blocks yet.",
  emptyDetail = "The artifact opens at line 1. Add text or carry evidence into it.",
  testId = "workspace-document-workbench",
  onFocusBlock,
  onAddBlock,
  onDeleteBlock,
  onRemoveBlock,
  onEditBlock,
  onKeepDraftBlock,
  onAcceptBlockInference,
  onRecastBlockTag,
  onOpenSourceWitness,
  onRevealFinding,
}) {
  const selectedIds = useMemo(
    () => (selectedBlockIds instanceof Set ? selectedBlockIds : new Set(selectedBlockIds)),
    [selectedBlockIds],
  );

  return (
    <section className={className} data-testid={testId}>
      {prefixContent}

      <div className={streamClassName}>
        {blocks.length ? (
          <div className={blocksClassName}>
            {blocks.map((block) => (
              <BlockRow
                key={block.id}
                block={block}
                documents={documents}
                finding={showingInlineOperateDocument ? operateOverlayFindingMap?.get(block.id) || null : null}
                showFinding={showingInlineOperateDocument && operateOverlayOpen}
                findingSelected={
                  String(operateOverlayFindingMap?.get(block.id)?.findingId || "").trim() ===
                  String(selectedOperateFindingId || "").trim()
                }
                blockRef={(element) => {
                  if (blockRefs?.current) {
                    blockRefs.current[block.id] = element;
                  }
                }}
                isFocused={block.id === focusBlockId}
                isPlaying={block.id === currentBlockId && isPlaying}
                isNext={block.id === nextBlockId}
                isSelected={selectedIds.has(block.id)}
                editMode={editMode}
                showNativeActions={showNativeActions}
                actionPending={blockActionPendingId === block.id}
                canDelete={canDeleteBlock}
                saveState={blockSaveStates[block.id] || ""}
                onFocus={onFocusBlock}
                onAdd={onAddBlock}
                onDelete={onDeleteBlock}
                onRemove={onRemoveBlock}
                onEdit={onEditBlock}
                onKeepDraft={onKeepDraftBlock}
                onAcceptInference={onAcceptBlockInference}
                onRecastTag={onRecastBlockTag}
                onOpenSourceWitness={onOpenSourceWitness}
                onInspectFinding={onRevealFinding}
              />
            ))}
          </div>
        ) : (
          <div className="assembler-ide-editor__empty">
            <p>{emptyTitle}</p>
            <span>{emptyDetail}</span>
          </div>
        )}
      </div>
    </section>
  );
}
