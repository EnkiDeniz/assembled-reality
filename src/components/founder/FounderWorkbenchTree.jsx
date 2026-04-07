"use client";

function TreeSection({ section = null }) {
  if (!section) return null;

  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <section className="founder-tree__section">
      <div className="founder-tree__section-head">
        <span className="founder-tree__section-label">{section.label}</span>
        {section.countLabel ? (
          <span className="founder-tree__section-count">{section.countLabel}</span>
        ) : null}
      </div>

      {items.length ? (
        <div className="founder-tree__items">
          {items.map((item) => (
            <div
              key={item.key}
              className={`founder-tree__item ${item.active ? "is-active" : ""}`}
              aria-current={item.active ? "true" : undefined}
            >
              <div className="founder-tree__item-copy">
                <strong className="founder-tree__item-title">{item.title}</strong>
                {item.detail ? (
                  <span className="founder-tree__item-detail">{item.detail}</span>
                ) : null}
              </div>
              {item.badge ? <span className="founder-tree__item-badge">{item.badge}</span> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="founder-tree__empty">{section.emptyLabel || "Nothing here yet."}</p>
      )}
    </section>
  );
}

export default function FounderWorkbenchTree({
  projectTitle = "",
  artifactKind = "",
  artifactTitle = "",
  sections = [],
  primaryAction = null,
  secondaryAction = null,
}) {
  return (
    <aside className="founder-tree" data-testid="founder-workbench-tree" aria-label="Workbench files">
      <div className="founder-tree__root">
        <span className="founder-tree__root-label">Box</span>
        <strong className="founder-tree__root-title">{projectTitle || "Current box"}</strong>
        <p className="founder-tree__root-copy">
          {artifactKind ? `${artifactKind} · ` : ""}
          {artifactTitle || "No active artifact"}
        </p>
      </div>

      <div className="founder-tree__sections">
        {(Array.isArray(sections) ? sections : []).map((section) => (
          <TreeSection key={section.key || section.label} section={section} />
        ))}
      </div>

      {primaryAction?.onClick || secondaryAction?.onClick ? (
        <div className="founder-tree__footer">
          <span className="founder-tree__section-label">Next move</span>
          <strong className="founder-tree__footer-title">
            {primaryAction?.title || "Keep one honest next move visible."}
          </strong>
          {primaryAction?.detail ? (
            <p className="founder-tree__footer-copy">{primaryAction.detail}</p>
          ) : null}
          <div className="founder-tree__footer-actions">
            {primaryAction?.onClick ? (
              <button
                type="button"
                className="terminal-button is-primary"
                data-testid={primaryAction.testId || undefined}
                onClick={primaryAction.onClick}
              >
                {primaryAction.label || "Continue"}
              </button>
            ) : null}
            {secondaryAction?.onClick ? (
              <button
                type="button"
                className="terminal-button"
                data-testid={secondaryAction.testId || undefined}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
