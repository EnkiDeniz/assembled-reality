import { buildSourceSummaryViewModel } from "@/lib/box-view-models";

function ProjectHomeDocumentRow({
  document,
  loadingDocumentKey,
  onListen,
  onOpen,
  onDelete,
  _ActionIcon,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
}) {
  const sourceSummary = buildSourceSummaryViewModel(document);
  const isGuide =
    document?.documentType === "builtin" || document?.sourceType === "builtin";

  return (
    <div className={`assembler-project-home__row ${isGuide ? "is-guide" : ""}`}>
      <button
        type="button"
        className="assembler-project-home__row-quick"
        onClick={onListen}
        aria-label={`Listen to ${document.title}`}
      >
        <_ActionIcon kind="listen" />
      </button>

      <button
        type="button"
        className="assembler-project-home__row-body"
        onClick={onOpen}
      >
        <span className="assembler-project-home__row-title">{document.title}</span>
        <span className="assembler-project-home__row-meta">
          {sourceSummary?.metaLine || getDocumentBlockCountLabel(document)}
        </span>
      </button>

      <div className="assembler-project-home__row-aside">
        <span className="assembler-project-home__row-badge">
          {loadingDocumentKey === document.documentKey
            ? "Loading…"
            : sourceSummary?.badge || getDocumentKindLabel(document)}
        </span>
        {onDelete ? (
          <button
            type="button"
            className="assembler-project-home__row-delete"
            onClick={onDelete}
            aria-label={`Delete ${document.title}`}
            title={`Delete ${document.title}`}
          >
            <_ActionIcon kind="delete" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({ eyebrow, title, body, detail, actions = [], tone = "" }) {
  return (
    <article className={`assembler-project-home__summary ${tone ? `is-${tone}` : ""}`}>
      <span className="assembler-project-home__summary-eyebrow">{eyebrow}</span>
      <h2 className="assembler-project-home__summary-title">{title}</h2>
      {body ? <p className="assembler-project-home__summary-body">{body}</p> : null}
      {detail ? <p className="assembler-project-home__summary-detail">{detail}</p> : null}
      {actions.length ? (
        <div className="assembler-project-home__summary-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`assembler-project-home__summary-action ${action.primary ? "is-primary" : ""}`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function ProjectHome({
  boxViewModel,
  activeProject,
  projectDrafts = [],
  projectActionPending = "",
  loadingDocumentKey = "",
  busy = false,
  guideDocument = null,
  sourceDocuments = [],
  currentAssemblyDocument = null,
  recentAssemblies = [],
  primaryAction,
  currentPositionAction = null,
  onBrowseBoxes,
  onManageProjects,
  onOpenReceipts,
  onOpenDocument,
  onDeleteDocument,
  onPasteClipboard,
  onOpenSpeak,
  onOpenIntake,
  ActionIcon,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
  canDeleteDocument,
  sourceOpenMode,
}) {
  const boxTitle = boxViewModel?.boxTitle || activeProject?.boxTitle || activeProject?.title || "Untitled Box";
  const boxSubtitle =
    boxViewModel?.boxSubtitle ||
    activeProject?.boxSubtitle ||
    activeProject?.subtitle ||
    "Start with a source and shape the assembly.";
  const sourceRows = guideDocument
    ? [guideDocument, ...sourceDocuments]
    : sourceDocuments;
  const receiptSummary = boxViewModel?.receiptSummary || {
    draftCount: projectDrafts.length,
    latestDraftTitle: "",
    latestDraftStatusLabel: "Local only",
    syncLine: "Draft a local receipt when the box is ready.",
    recentDrafts: projectDrafts.slice(0, 4),
  };
  const currentContext = boxViewModel?.resumeTarget || null;

  return (
    <div className="assembler-project-home">
      <section className="assembler-project-home__masthead">
        <div className="assembler-project-home__copy">
          <span className="assembler-project-home__eyebrow">What&apos;s in the Box</span>
          <h1 className="assembler-project-home__title">{boxTitle}</h1>
          <p className="assembler-project-home__subtitle">{boxSubtitle}</p>
          <div className="assembler-project-home__meta">
            <span>{boxViewModel?.realSourceCount || 0} real source{(boxViewModel?.realSourceCount || 0) === 1 ? "" : "s"}</span>
            <span>{boxViewModel?.assemblyCount || 0} assembl{(boxViewModel?.assemblyCount || 0) === 1 ? "y" : "ies"}</span>
            <span>{receiptSummary.draftCount || 0} receipt{(receiptSummary.draftCount || 0) === 1 ? "" : "s"}</span>
          </div>
          <p className="assembler-project-home__diagnostic">
            <span className="assembler-project-home__diagnostic-label">Seven</span>
            <span>{boxViewModel?.sevenDiagnostic}</span>
          </p>
        </div>

        <div className="assembler-project-home__masthead-actions">
          <button
            type="button"
            className="assembler-project-home__primary-button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.label}
          </button>
          <div className="assembler-project-home__masthead-secondary">
            <button
              type="button"
              className="assembler-project-home__secondary-button"
              onClick={onBrowseBoxes}
            >
              All boxes
            </button>
            <button
              type="button"
              className="assembler-project-home__secondary-button"
              onClick={onManageProjects}
              disabled={Boolean(projectActionPending)}
            >
              Box management
            </button>
          </div>
        </div>
      </section>

      <section className="assembler-project-home__summary-grid">
        <SummaryCard
          eyebrow="Next move"
          title={primaryAction.label}
          body={primaryAction.title}
          detail={primaryAction.detail || boxViewModel?.strongestNextMove?.supportingDetail || ""}
          actions={[
            {
              label: primaryAction.label,
              onClick: primaryAction.onClick,
              disabled: primaryAction.disabled,
              primary: true,
            },
          ]}
          tone="primary"
        />

        <SummaryCard
          eyebrow="Current position"
          title={currentContext?.title || "No current position yet"}
          body={currentContext?.detail || "Add a real source or continue the assembly to create momentum."}
          detail={
            currentAssemblyDocument
              ? "Assembly is the live working position of this box."
              : "Return and resume should always point somewhere legible."
          }
          actions={
            currentPositionAction
              ? [
                  {
                    label: currentPositionAction.label,
                    onClick: currentPositionAction.onClick,
                    disabled: currentPositionAction.disabled,
                  },
                ]
              : []
          }
        />

        <SummaryCard
          eyebrow="Proof"
          title={receiptSummary.latestDraftTitle || "No proof drafted yet"}
          body={
            receiptSummary.latestDraftTitle
              ? `${receiptSummary.latestDraftStatusLabel} · ${receiptSummary.connectionStatusLabel || "Local proof"}`
              : receiptSummary.connectionStatusLabel === "Connected"
                ? "GetReceipts is connected. Local drafts can push when ready."
                : "Local proof is ready even without a GetReceipts connection."
          }
          detail={receiptSummary.syncLine}
          actions={[
            {
              label: "Open Receipts",
              onClick: onOpenReceipts,
              disabled: false,
            },
          ]}
        />

        <SummaryCard
          eyebrow="Source inventory"
          title={
            sourceRows.length
              ? `${sourceRows.length} source${sourceRows.length === 1 ? "" : "s"} in this box`
              : "No imported sources yet"
          }
          body={
            sourceRows.length
              ? "Think reads the box from sources first. Create turns those sources into assembly."
              : "Start with a supported 1.0 source or capture a Speak note."
          }
          detail="Supported now: PDF, DOCX, Markdown/TXT, paste, link, and Speak note."
          actions={[
            {
              label: "Add source",
              onClick: onOpenIntake,
              disabled: busy,
            },
            {
              label: "Speak note",
              onClick: onOpenSpeak,
              disabled: busy,
            },
          ]}
        />
      </section>

      <div className="assembler-project-home__layout">
        <section className="assembler-project-home__panel assembler-project-home__panel--materials">
          <div className="assembler-project-home__section-head">
            <span>Sources</span>
            <div className="assembler-project-home__section-actions">
              <button
                type="button"
                className="assembler-project-home__section-action"
                onClick={onOpenIntake}
                disabled={busy}
              >
                Add source
              </button>
              <button
                type="button"
                className="assembler-project-home__section-action"
                onClick={onPasteClipboard}
                disabled={busy}
              >
                Paste to staging
              </button>
            </div>
          </div>

          <div className="assembler-project-home__list">
            {sourceRows.length ? (
              sourceRows.slice(0, 8).map((document) => (
                <ProjectHomeDocumentRow
                  key={document.documentKey}
                  document={document}
                  loadingDocumentKey={loadingDocumentKey}
                  onListen={() => onOpenDocument(document.documentKey, "listen", { phase: "think" })}
                  onOpen={() =>
                    onOpenDocument(document.documentKey, sourceOpenMode, { phase: "think" })
                  }
                  onDelete={
                    canDeleteDocument(document) && onDeleteDocument
                      ? () => onDeleteDocument(document)
                      : null
                  }
                  _ActionIcon={ActionIcon}
                  getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                  getDocumentKindLabel={getDocumentKindLabel}
                />
              ))
            ) : (
              <p className="assembler-project-home__empty">
                No imported sources yet. Add one and start building.
              </p>
            )}
          </div>
        </section>

        <div className="assembler-project-home__stack">
          <section className="assembler-project-home__panel">
            <div className="assembler-project-home__section-head">
              <span>Assembly</span>
              <span>{currentAssemblyDocument ? "Active" : "Empty"}</span>
            </div>

            <div className="assembler-project-home__list">
              {currentAssemblyDocument ? (
                <ProjectHomeDocumentRow
                  document={currentAssemblyDocument}
                  loadingDocumentKey={loadingDocumentKey}
                  onListen={() =>
                    onOpenDocument(currentAssemblyDocument.documentKey, "listen", { phase: "think" })
                  }
                  onOpen={() =>
                    onOpenDocument(currentAssemblyDocument.documentKey, "assemble", { phase: "create" })
                  }
                  onDelete={
                    canDeleteDocument(currentAssemblyDocument) && onDeleteDocument
                      ? () => onDeleteDocument(currentAssemblyDocument)
                      : null
                  }
                  _ActionIcon={ActionIcon}
                  getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                  getDocumentKindLabel={getDocumentKindLabel}
                />
              ) : (
                <p className="assembler-project-home__empty">
                  No assembly yet. Start with a source and keep building.
                </p>
              )}

              {recentAssemblies.map((document) => (
                <ProjectHomeDocumentRow
                  key={document.documentKey}
                  document={document}
                  loadingDocumentKey={loadingDocumentKey}
                  onListen={() => onOpenDocument(document.documentKey, "listen", { phase: "think" })}
                  onOpen={() => onOpenDocument(document.documentKey, "assemble", { phase: "create" })}
                  onDelete={
                    canDeleteDocument(document) && onDeleteDocument
                      ? () => onDeleteDocument(document)
                      : null
                  }
                  _ActionIcon={ActionIcon}
                  getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                  getDocumentKindLabel={getDocumentKindLabel}
                />
              ))}
            </div>
          </section>

          <section className="assembler-project-home__panel">
            <div className="assembler-project-home__section-head">
              <span>Recent proof</span>
              <button
                type="button"
                className="assembler-project-home__section-action"
                onClick={onOpenReceipts}
              >
                Open Receipts
              </button>
            </div>

            <div className="assembler-project-home__receipt-panel">
              {receiptSummary.recentDrafts?.length ? (
                receiptSummary.recentDrafts.map((draft) => (
                  <div key={draft.id} className="assembler-project-home__receipt-row">
                    <span className="assembler-project-home__receipt-title">
                      {draft.title || "Untitled receipt"}
                    </span>
                    <span className="assembler-project-home__receipt-meta">
                      {draft.statusLabel}
                    </span>
                  </div>
                ))
              ) : (
                <p className="assembler-project-home__empty">
                  No receipts yet. Draft one after you assemble or Operate.
                </p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
