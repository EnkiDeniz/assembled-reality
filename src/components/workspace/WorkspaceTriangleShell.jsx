"use client";

import { MoreHorizontal } from "lucide-react";
import styles from "@/components/workspace/WorkspaceTriangleShell.module.css";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function ScopeBadge({ label = "", detail = "" }) {
  if (!label && !detail) return null;
  return (
    <div className={styles.metaBadge} data-kind="scope">
      {label ? <strong>{label}</strong> : null}
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}

export function BasisBadge({ label = "", commitment = "" }) {
  if (!label && !commitment) return null;
  return (
    <div className={styles.metaBadge} data-kind="basis">
      {label ? <strong>{label}</strong> : null}
      {commitment ? <span>{commitment}</span> : null}
    </div>
  );
}

function UtilityButton({ item }) {
  const Icon = item?.icon || MoreHorizontal;
  return (
    <button
      type="button"
      className={joinClasses(styles.utilityButton, item?.active ? styles.utilityButtonActive : "")}
      onClick={item?.onClick}
      aria-label={item?.label || "Utility"}
      title={item?.label || "Utility"}
      data-testid={item?.testId || undefined}
    >
      <Icon size={16} aria-hidden="true" />
      <span>{item?.label || "Utility"}</span>
    </button>
  );
}

function UtilityPanel({ panel = null }) {
  if (!panel?.open) return null;
  return (
    <div className={styles.utilityOverlay} data-testid="workspace-utility-overlay">
      <button
        type="button"
        className={styles.utilityBackdrop}
        aria-label="Close utility panel"
        onClick={panel.onClose}
      />
      <section className={styles.utilityPanel}>
        <div className={styles.utilityPanelHead}>
          <div>
            <span className={styles.eyebrow}>Utility</span>
            <strong>{panel.title || "Utility"}</strong>
          </div>
          <button type="button" className={styles.utilityClose} onClick={panel.onClose}>
            Close
          </button>
        </div>
        <div className={styles.utilityPanelBody}>{panel.content || null}</div>
      </section>
    </div>
  );
}

export default function WorkspaceTriangleShell({
  workspaceLabel = "Personal",
  utilityItems = [],
  continuity = null,
  knowledge = null,
  account = null,
  header = null,
  canonical = null,
  main = null,
  composer = null,
  rightPane = null,
  rightLabel = "",
  rightTitle = "",
  rightMeta = null,
  rightPaneVisible = true,
  onCloseRightPane = null,
  utilityPanel = null,
}) {
  return (
    <main
      className={joinClasses(styles.root, !rightPaneVisible ? styles.rootNoRightPane : "")}
      data-testid="workspace-triangle-shell"
    >
      <aside className={styles.utilityRail}>
        <div className={styles.utilityRailHead}>
          <span className={styles.wordmark}>Lœgos</span>
          <span className={styles.workspaceLabel}>{workspaceLabel}</span>
        </div>
        <div className={styles.utilityRailBody}>
          {utilityItems.map((item) => (
            <UtilityButton key={item.id || item.label} item={item} />
          ))}
        </div>
      </aside>

      <aside className={styles.leftRail}>
        <div className={styles.leftRailBody}>
          {continuity ? (
            <section className={styles.leftSection}>
              <div className={styles.leftSectionHead}>
                <span className={styles.eyebrow}>Continuity</span>
                <strong>Boxes and Sessions</strong>
              </div>
              {continuity}
            </section>
          ) : null}

          {knowledge ? (
            <section className={styles.leftSection}>
              <div className={styles.leftSectionHead}>
                <span className={styles.eyebrow}>Knowledge and Artifacts</span>
                <strong>Witnesses, Library, Receipts</strong>
              </div>
              {knowledge}
            </section>
          ) : null}
        </div>

        {account ? (
          <footer className={styles.accountBand}>
            <div className={styles.accountCopy}>
              <strong>{account.name || "Personal"}</strong>
              {account.detail ? <span>{account.detail}</span> : null}
            </div>
            {account.action ? (
              <button type="button" className={styles.accountAction} onClick={account.action.onClick}>
                {account.action.label}
              </button>
            ) : null}
          </footer>
        ) : null}
      </aside>

      <section className={styles.centerStage}>
        {header ? <div className={styles.centerHeader}>{header}</div> : null}
        {canonical ? <div className={styles.canonicalStrip}>{canonical}</div> : null}
        <div className={styles.centerMain}>{main}</div>
        {composer ? <div className={styles.centerComposer}>{composer}</div> : null}
      </section>

      {rightPaneVisible ? (
        <aside className={styles.rightPane}>
          <div className={styles.rightPaneHead}>
            <div className={styles.rightPaneHeadTop}>
              <div>
                {rightLabel ? <span className={styles.eyebrow}>{rightLabel}</span> : null}
                <strong>{rightTitle || "Artifact"}</strong>
              </div>
              {onCloseRightPane ? (
                <button
                  type="button"
                  className={styles.paneClose}
                  onClick={onCloseRightPane}
                  aria-label="Close artifact pane"
                >
                  Close
                </button>
              ) : null}
            </div>
            {rightMeta ? <div className={styles.rightMeta}>{rightMeta}</div> : null}
          </div>
          <div className={styles.rightPaneBody}>{rightPane}</div>
        </aside>
      ) : null}

      <UtilityPanel panel={utilityPanel} />
    </main>
  );
}
