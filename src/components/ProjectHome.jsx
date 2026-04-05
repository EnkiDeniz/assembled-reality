import BoxObjectVisualization from "@/components/BoxObjectVisualization";
import RootSummaryPanel from "@/components/RootSummaryPanel";
import WorkspaceGlyph from "@/components/WorkspaceGlyph";
import { buildSourceSummaryViewModel } from "@/lib/box-view-models";

function formatTrustLabel(value = "") {
  const normalized = String(value || "").trim();
  return normalized ? `${normalized} trust` : "";
}

function formatReceiptModeLabel(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "operate") return "Operate read";
  if (normalized === "assemble") return "Seed revision";
  if (normalized === "receipt") return "Receipt";
  return "Workspace draft";
}

function buildSourceProvenanceLine(sourceSummary, document) {
  if (!sourceSummary) return "";

  const parts = [
    sourceSummary.trustProfile?.summary || "",
    sourceSummary.provenance?.sourceLabel &&
    sourceSummary.provenance.sourceLabel !== document?.title
      ? sourceSummary.provenance.sourceLabel
      : "",
  ].filter(Boolean);

  return parts[0] || "";
}

function buildSourceBadges(sourceSummary) {
  if (!sourceSummary) return [];

  return [
    sourceSummary.badge || "",
    sourceSummary.originLabel || "",
    formatTrustLabel(sourceSummary.trustProfile?.trustLevelHint),
  ].filter(Boolean);
}

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
  const badges = buildSourceBadges(sourceSummary);
  const provenanceLine = buildSourceProvenanceLine(sourceSummary, document);

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
        {provenanceLine ? (
          <span className="assembler-project-home__row-provenance">{provenanceLine}</span>
        ) : null}
      </button>

      <div className="assembler-project-home__row-aside">
        <div className="assembler-project-home__row-badges">
          {loadingDocumentKey === document.documentKey ? (
            <span className="assembler-project-home__row-badge">Loading…</span>
          ) : (
            badges.map((badge) => (
              <span key={`${document.documentKey}-${badge}`} className="assembler-project-home__row-badge">
                {badge}
              </span>
            ))
          )}
          {!badges.length && !loadingDocumentKey ? (
            <span className="assembler-project-home__row-badge">
              {getDocumentKindLabel(document)}
            </span>
          ) : null}
        </div>
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

function QuickAction({ icon, label, detail = "", onClick, disabled = false, primary = false }) {
  return (
    <button
      type="button"
      className={`assembler-project-home__quick-action ${primary ? "is-primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="assembler-project-home__quick-action-icon" aria-hidden="true">
        <WorkspaceGlyph kind={icon} />
      </span>
      <span className="assembler-project-home__quick-action-copy">
        <span className="assembler-project-home__quick-action-label">{label}</span>
        {detail ? <span className="assembler-project-home__quick-action-detail">{detail}</span> : null}
      </span>
    </button>
  );
}

function OverviewCard({ eyebrow, title, detail, action = null }) {
  return (
    <article className="assembler-project-home__overview-card">
      <span className="assembler-project-home__overview-eyebrow">{eyebrow}</span>
      <h2 className="assembler-project-home__overview-title">{title}</h2>
      {detail ? <p className="assembler-project-home__overview-detail">{detail}</p> : null}
      {action ? (
        <button
          type="button"
          className="assembler-project-home__overview-action"
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </button>
      ) : null}
    </article>
  );
}

export default function ProjectHome({
  boxViewModel,
  activeProject,
  projectDrafts = [],
  loadingDocumentKey = "",
  busy = false,
  guideDocument = null,
  sourceDocuments = [],
  currentAssemblyDocument = null,
  recentAssemblies = [],
  primaryAction,
  currentPositionAction = null,
  onBrowseBoxes,
  onOpenReceipts,
  onOpenDocument,
  onDeleteDocument,
  onPasteClipboard,
  onOpenSpeak,
  onOpenIntake,
  onOpenConfirmation,
  onSaveRoot,
  onRootInstrumentChange,
  onRunRootAssist,
  rootPending = false,
  ActionIcon,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
  canDeleteDocument,
  sourceOpenMode,
  isMobileLayout = false,
}) {
  const boxTitle = boxViewModel?.boxTitle || activeProject?.boxTitle || activeProject?.title || "Untitled Box";
  const boxSubtitle =
    boxViewModel?.boxSubtitle ||
    activeProject?.boxSubtitle ||
    activeProject?.subtitle ||
    "Start with a source and shape the seed.";
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
  const latestRealSourceSummary = buildSourceSummaryViewModel(sourceDocuments[0] || null);
  const resumeTarget = boxViewModel?.resumeTarget || null;
  const rootPanelKey = [
    boxViewModel?.root?.text || "",
    boxViewModel?.root?.gloss || "",
    boxViewModel?.root?.hasRoot ? "1" : "0",
    boxViewModel?.stateSummary?.current || "",
    boxViewModel?.confirmationCount || 0,
  ].join("::");
  const quickActions = [
    primaryAction
      ? {
          key: "resume",
          icon: primaryAction.label.toLowerCase().includes("seed") ? "seed" : "open",
          label: primaryAction.label,
          detail: primaryAction.detail || "",
          onClick: primaryAction.onClick,
          disabled: primaryAction.disabled,
          primary: true,
        }
      : null,
    {
      key: "add",
      icon: "plus",
      label: "Add source",
      detail: "Upload, paste, link, photo, or speak",
      onClick: onOpenIntake,
      disabled: busy,
    },
    {
      key: "speak",
      icon: "speak",
      label: "Speak",
      detail: "Capture a voice note",
      onClick: onOpenSpeak,
      disabled: busy,
    },
    {
      key: "proof",
      icon: "receipt",
      label: "Receipts",
      detail: "Review proof",
      onClick: onOpenReceipts,
      disabled: false,
    },
  ].filter(Boolean);

  if (isMobileLayout) {
    return (
      <div className="assembler-project-home assembler-project-home--next assembler-project-home--mobile">
        <section className="assembler-project-home__quick-actions assembler-project-home__quick-actions--mobile">
          {quickActions
            .filter((action) => action.key !== "proof")
            .map((action) => (
              <QuickAction
                key={action.key}
                icon={action.icon}
                label={action.label}
                detail={action.detail}
                onClick={action.onClick}
                disabled={action.disabled}
                primary={action.primary}
              />
            ))}
          {currentAssemblyDocument?.documentKey &&
          !String(primaryAction?.label || "").toLowerCase().includes("seed") ? (
            <QuickAction
              icon="seed"
              label="Open Seed"
              detail="Open the live working position"
              onClick={() =>
                onOpenDocument(currentAssemblyDocument.documentKey, "assemble", { phase: "create" })
              }
              disabled={false}
            />
          ) : null}
        </section>

        <section className="assembler-project-home__panel assembler-project-home__panel--compact">
          <div className="assembler-project-home__section-head">
            <span>Current box</span>
            <button
              type="button"
              className="assembler-project-home__section-action"
              onClick={onBrowseBoxes}
            >
              All boxes
            </button>
          </div>
          <div className="assembler-project-home__compact-copy">
            <strong className="assembler-project-home__compact-title">{boxTitle}</strong>
            <p className="assembler-project-home__compact-detail">{boxSubtitle}</p>
            <div className="assembler-project-home__meta">
              <span>{boxViewModel?.realSourceCount || 0} real source{(boxViewModel?.realSourceCount || 0) === 1 ? "" : "s"}</span>
              <span>{boxViewModel?.hasSeed ? "Seed ready" : "No seed yet"}</span>
              <span>{receiptSummary.draftCount || 0} proof draft{(receiptSummary.draftCount || 0) === 1 ? "" : "s"}</span>
            </div>
          </div>
        </section>

        <RootSummaryPanel
          key={rootPanelKey}
          root={boxViewModel?.root}
          stateSummary={boxViewModel?.stateSummary}
          confirmationCount={boxViewModel?.confirmationCount || 0}
          pending={rootPending}
          compact
          onSaveRoot={onSaveRoot}
          onOpenConfirmation={onOpenConfirmation}
          onInstrumentChange={onRootInstrumentChange}
          onRunSevenAssist={onRunRootAssist}
        />

        <section className="assembler-project-home__panel">
          <div className="assembler-project-home__section-head">
            <span>Resume</span>
          </div>
          <div className="assembler-project-home__compact-copy">
            <strong className="assembler-project-home__compact-title">
              {resumeTarget?.title || "No active position yet"}
            </strong>
            <p className="assembler-project-home__compact-detail">
              {resumeTarget?.detail || "Bring in a source or keep shaping the seed."}
            </p>
            {currentPositionAction ? (
              <button
                type="button"
                className="assembler-project-home__primary-button"
                onClick={currentPositionAction.onClick}
                disabled={currentPositionAction.disabled}
              >
                {currentPositionAction.label}
              </button>
            ) : null}
          </div>
        </section>

        <section className="assembler-project-home__panel">
          <div className="assembler-project-home__section-head">
            <span>Proof</span>
            <button
              type="button"
              className="assembler-project-home__section-action"
              onClick={onOpenReceipts}
            >
              Open Receipts
            </button>
          </div>
          <div className="assembler-project-home__compact-copy">
            <strong className="assembler-project-home__compact-title">
              {receiptSummary.latestDraftStatusLabel || "No proof yet"}
            </strong>
            <p className="assembler-project-home__compact-detail">
              {[
                receiptSummary.courthouseStatusLine || "",
                receiptSummary.syncLine || "",
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        </section>

        <section className="assembler-project-home__panel assembler-project-home__panel--sources">
          <div className="assembler-project-home__section-head">
            <span>Recent sources</span>
          </div>

          <div className="assembler-project-home__list">
            {sourceRows.length ? (
              sourceRows.slice(0, 4).map((document) => (
                <ProjectHomeDocumentRow
                  key={document.documentKey}
                  document={document}
                  loadingDocumentKey={loadingDocumentKey}
                  onListen={() => onOpenDocument(document.documentKey, "listen", { phase: "think" })}
                  onOpen={() =>
                    onOpenDocument(
                      document.documentKey,
                      document.isAssembly || document.documentType === "assembly" ? "assemble" : sourceOpenMode,
                      {
                        phase:
                          document.isAssembly || document.documentType === "assembly"
                            ? "create"
                            : "think",
                      },
                    )
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
                No imported sources yet. Add a source or speak a note to start.
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`assembler-project-home assembler-project-home--next ${isMobileLayout ? "is-mobile" : ""}`}>
      <section className="assembler-project-home__masthead">
        <div className="assembler-project-home__copy">
          <span className="assembler-project-home__eyebrow">Box home</span>
          <h1 className="assembler-project-home__title">{boxTitle}</h1>
          <p className="assembler-project-home__subtitle">{boxSubtitle}</p>
          <div className="assembler-project-home__meta">
            <span>{boxViewModel?.realSourceCount || 0} real source{(boxViewModel?.realSourceCount || 0) === 1 ? "" : "s"}</span>
            <span>{boxViewModel?.hasSeed ? "Seed ready" : "No seed yet"}</span>
            <span>{receiptSummary.draftCount || 0} proof draft{(receiptSummary.draftCount || 0) === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="assembler-project-home__masthead-actions">
          <BoxObjectVisualization
            state={boxViewModel?.visualizationState}
            size="compact"
            title={boxViewModel?.seedTitle || "Seed"}
            subtitle={boxViewModel?.hasSeed ? "Current working position" : "Waiting for the first seed"}
          />

          <div className="assembler-project-home__masthead-controls">
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
            </div>
          </div>
        </div>
      </section>

      <section className="assembler-project-home__quick-actions">
        {quickActions.map((action) => (
          <QuickAction
            key={action.key}
            icon={action.icon}
            label={action.label}
            detail={action.detail}
            onClick={action.onClick}
            disabled={action.disabled}
            primary={action.primary}
          />
        ))}
      </section>

      <RootSummaryPanel
        key={rootPanelKey}
        root={boxViewModel?.root}
        stateSummary={boxViewModel?.stateSummary}
        confirmationCount={boxViewModel?.confirmationCount || 0}
        pending={rootPending}
        onSaveRoot={onSaveRoot}
        onOpenConfirmation={onOpenConfirmation}
        onInstrumentChange={onRootInstrumentChange}
        onRunSevenAssist={onRunRootAssist}
      />

      <section className="assembler-project-home__overview">
        <OverviewCard
          eyebrow="Resume"
          title={resumeTarget?.title || "No active position yet"}
          detail={resumeTarget?.detail || "Bring in a source or keep shaping the seed."}
          action={currentPositionAction}
        />
        <OverviewCard
          eyebrow="Seed"
          title={currentAssemblyDocument?.title || "No seed yet"}
          detail={
            currentAssemblyDocument
              ? "The seed is the live position of this box."
              : "The first real source creates the first seed."
          }
          action={
            currentAssemblyDocument
              ? {
                  label: "Open seed",
                  onClick: () =>
                    onOpenDocument(currentAssemblyDocument.documentKey, "assemble", { phase: "create" }),
                  disabled: false,
                }
              : null
          }
        />
        <OverviewCard
          eyebrow="Receipts"
          title={receiptSummary.latestDraftTitle || receiptSummary.latestDraftStatusLabel || "No proof drafted yet"}
          detail={[
            receiptSummary.latestDraftStatusLabel || "",
            receiptSummary.courthouseStatusLine || "",
            receiptSummary.syncLine || "",
          ].filter(Boolean).join(" · ")}
          action={{ label: "Open Receipts", onClick: onOpenReceipts, disabled: false }}
        />
        <OverviewCard
          eyebrow="Sources"
          title={
            sourceRows.length
              ? `${sourceRows.length} source${sourceRows.length === 1 ? "" : "s"}`
              : "No sources yet"
          }
          detail={
            sourceDocuments.length && latestRealSourceSummary
              ? `Latest: ${latestRealSourceSummary.originLabel?.toLowerCase() || "source"} · ${latestRealSourceSummary.trustProfile?.summary || "Use sources to read the box before changing the seed."}`
              : sourceRows.length
                ? "Use sources to read the box before changing the seed."
              : "Paste, photo, speak, or add a link to start."
          }
          action={{ label: "Add source", onClick: onOpenIntake, disabled: busy }}
        />
      </section>

      <div className="assembler-project-home__layout">
        <section className="assembler-project-home__panel assembler-project-home__panel--sources">
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
                Paste
              </button>
            </div>
          </div>

          <div className="assembler-project-home__list">
            {sourceRows.length ? (
              sourceRows.slice(0, isMobileLayout ? 6 : 8).map((document) => (
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
                No imported sources yet. Use the quick actions above to start.
              </p>
            )}
          </div>
        </section>

        <div className="assembler-project-home__stack">
          <section className="assembler-project-home__panel">
            <div className="assembler-project-home__section-head">
              <span>Seed</span>
              <span>{currentAssemblyDocument ? "Live" : "Waiting"}</span>
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
                  No seed yet. The first real source will create it automatically.
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
                    <div className="assembler-project-home__receipt-copy">
                      <span className="assembler-project-home__receipt-title">
                        {draft.title || "Untitled receipt"}
                      </span>
                      <span className="assembler-project-home__receipt-detail">
                        {formatReceiptModeLabel(draft.mode)}
                        {draft.updatedAt
                          ? ` · ${new Intl.DateTimeFormat(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }).format(new Date(draft.updatedAt))}`
                          : ""}
                      </span>
                    </div>
                    <span className="assembler-project-home__receipt-meta">
                      {draft.statusLabel}
                    </span>
                  </div>
                ))
              ) : (
                <p className="assembler-project-home__empty">
                  No receipts yet. Draft one after you shape the seed or run Operate.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
