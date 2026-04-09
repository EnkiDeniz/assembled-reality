"use client";

function FounderInfoSection({ section = null }) {
  if (!section) return null;

  const items = Array.isArray(section.items) ? section.items.filter(Boolean) : [];

  return (
    <section className="founder-info-panel__section">
      <span className="founder-shell__panel-eyebrow">{section.label || "Section"}</span>
      {section.title ? <strong className="founder-shell__panel-title">{section.title}</strong> : null}
      {section.copy ? <p className="founder-shell__panel-copy">{section.copy}</p> : null}
      {items.length ? (
        <div className="founder-info-panel__list">
          {items.map((item) => (
            <div key={item.key || item.label || item.value} className="founder-info-panel__list-item">
              <span className="founder-info-panel__list-label">{item.label}</span>
              <strong className="founder-info-panel__list-value">{item.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
      {section.action?.onClick ? (
        <div className="founder-shell__panel-actions">
          <button
            type="button"
            className={section.action.primary ? "terminal-button is-primary" : "terminal-button"}
            onClick={section.action.onClick}
            data-testid={section.action.testId || undefined}
            disabled={section.action.disabled}
          >
            {section.action.label || "Continue"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default function FounderInfoPanel({
  testId = "founder-info-panel",
  eyebrow = "Inspect",
  title = "",
  copy = "",
  sections = [],
}) {
  return (
    <div className="founder-shell__panel founder-info-panel" data-testid={testId}>
      <div className="founder-info-panel__head">
        <span className="founder-shell__panel-eyebrow">{eyebrow}</span>
        {title ? <strong className="founder-shell__panel-title">{title}</strong> : null}
        {copy ? <p className="founder-shell__panel-copy">{copy}</p> : null}
      </div>

      <div className="founder-info-panel__body">
        {(Array.isArray(sections) ? sections : []).map((section) => (
          <FounderInfoSection key={section.key || section.label || section.title} section={section} />
        ))}
      </div>
    </div>
  );
}
