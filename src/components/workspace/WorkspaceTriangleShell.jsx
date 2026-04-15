"use client";

import styles from "@/components/workspace/WorkspaceTriangleShell.module.css";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function WorkspaceTriangleShell({
  sidebar = null,
  account = null,
  header = null,
  canonical = null,
  main = null,
  composer = null,
  rightPane = null,
  rightTitle = "",
  onCloseRightPane = null,
}) {
  const hasRightPane = Boolean(rightPane);
  return (
    <main
      className={joinClasses(styles.root, hasRightPane ? styles.rootWithRight : "")}
      data-testid="workspace-triangle-shell"
    >
      <aside className={styles.leftRail}>
        <div className={styles.leftRailHead}>
          <span className={styles.wordmark}>Lœgos</span>
        </div>
        <div className={styles.leftRailBody}>{sidebar}</div>
        {account ? (
          <footer className={styles.accountBand}>
            <div className={styles.accountIdentity}>
              <strong>{account.name || "Personal"}</strong>
              {account.detail ? <span>{account.detail}</span> : null}
            </div>
            <div className={styles.accountActions}>
              {account.actions?.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={styles.accountButton}
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </footer>
        ) : null}
      </aside>

      <section className={styles.center}>
        {header ? <div className={styles.centerHeader}>{header}</div> : null}
        {canonical ? <div className={styles.centerCanonical}>{canonical}</div> : null}
        <div className={styles.centerMain}>{main}</div>
        {composer ? <div className={styles.centerComposer}>{composer}</div> : null}
      </section>

      {hasRightPane ? (
        <aside className={styles.rightPane}>
          <div className={styles.rightPaneHead}>
            <strong>{rightTitle || "Artifact"}</strong>
            {onCloseRightPane ? (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onCloseRightPane}
                aria-label="Close"
              >
                ✕
              </button>
            ) : null}
          </div>
          <div className={styles.rightPaneBody}>{rightPane}</div>
        </aside>
      ) : null}
    </main>
  );
}
