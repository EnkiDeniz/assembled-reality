import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

function renderBlockContent(block = null) {
  if (!block) return null;

  const text = String(block?.text || "").replace(/^#{1,6}\s+/, "");
  if (block?.kind === "heading") {
    return <h2 className="founder-block__heading">{text}</h2>;
  }

  if (block?.kind === "list") {
    return (
      <div className="founder-block__list">
        {String(block?.text || "")
          .split("\n")
          .map((line) => line.replace(/^[-+*]\s+/, "").trim())
          .filter(Boolean)
          .map((line, index) => (
            <div key={`${block?.id || "block"}-line-${index}`} className="founder-block__list-line">
              <span className="founder-block__bullet">•</span>
              <span>{line}</span>
            </div>
          ))}
      </div>
    );
  }

  return <p className="founder-block__text">{text}</p>;
}

function FounderArtifactBlock({
  block = null,
  selected = false,
  playing = false,
  next = false,
  onSelect,
}) {
  if (!block) return null;

  return (
    <button
      type="button"
      className={`founder-block ${selected ? "is-selected" : ""} ${playing ? "is-playing" : ""} ${
        next ? "is-next" : ""
      }`}
      onClick={() => onSelect?.(block?.id)}
      data-testid="founder-block"
    >
      <span className="founder-block__line">
        {String((block?.sourcePosition || 0) + 1).padStart(3, "0")}
      </span>
      <div className="founder-block__body">{renderBlockContent(block)}</div>
    </button>
  );
}

export default function FounderShell({
  testId = "founder-shell",
  artifactKind = "Source",
  artifactTitle = "",
  artifactSubtitle = "",
  projectTitle = "",
  intro = "",
  blocks = [],
  selectedBlockId = "",
  currentBlockId = "",
  nextBlockId = "",
  onSelectBlock,
  systemTitle = "",
  systemCopy = "",
  systemExcerptLabel = "",
  systemExcerpt = "",
  primaryAction = null,
  secondaryAction = null,
  onOpenFullWorkspace,
  assistantOpen = false,
  onToggleAssistant,
  assistant = null,
  player = null,
}) {
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;

  return (
    <section className="founder-shell" data-testid={testId}>
      <div className="founder-shell__frame" data-testid="founder-shell">
        <header className="founder-shell__header">
          <div className="founder-shell__copy">
            <span className="founder-shell__eyebrow">{artifactKind}</span>
            <h1 className="founder-shell__title">{artifactTitle || "Untitled artifact"}</h1>
            {intro ? <p className="founder-shell__intro">{intro}</p> : null}
            <div className="founder-shell__meta">
              {projectTitle ? <span>{projectTitle}</span> : null}
              {artifactSubtitle ? <span>{artifactSubtitle}</span> : null}
            </div>
          </div>

          <div className="founder-shell__session" aria-label="Account and session">
            <button
              type="button"
              className="founder-shell__quiet-action"
              data-testid="founder-shell-open-full-workspace"
              onClick={onOpenFullWorkspace}
            >
              Open full workspace
            </button>
            <Link
              href="/account"
              className="founder-shell__session-link"
              data-testid="workspace-account-link"
            >
              Account
            </Link>
            <SignOutButton className="founder-shell__session-signout">
              Sign out
            </SignOutButton>
          </div>
        </header>

        <div className="founder-shell__body">
          <main className="founder-shell__artifact" data-testid="founder-shell-artifact">
            <div className="founder-shell__artifact-scroll">
              {hasBlocks ? (
                <div className="founder-shell__blocks">
                  {blocks.map((block) => (
                    <FounderArtifactBlock
                      key={block.id}
                      block={block}
                      selected={block.id === selectedBlockId}
                      playing={block.id === currentBlockId}
                      next={block.id === nextBlockId}
                      onSelect={onSelectBlock}
                    />
                  ))}
                </div>
              ) : (
                <div className="founder-shell__empty">
                  <span className="founder-shell__empty-label">{artifactKind}</span>
                  <strong className="founder-shell__empty-title">No content yet.</strong>
                  <p className="founder-shell__empty-copy">
                    Add one real source, keep it raw, and the next step will shape the first seed.
                  </p>
                </div>
              )}
            </div>
          </main>

          <aside className="founder-shell__side">
            <article className="founder-shell__panel" data-testid="founder-shell-read">
              <span className="founder-shell__panel-eyebrow">Lœgos read</span>
              <strong className="founder-shell__panel-title">
                {systemTitle || "Reading stays literal here."}
              </strong>
              {systemCopy ? <p className="founder-shell__panel-copy">{systemCopy}</p> : null}
              {systemExcerpt ? (
                <div className="founder-shell__excerpt">
                  {systemExcerptLabel ? (
                    <span className="founder-shell__excerpt-label">{systemExcerptLabel}</span>
                  ) : null}
                  <p className="founder-shell__excerpt-copy">{systemExcerpt}</p>
                </div>
              ) : null}
            </article>

            <article className="founder-shell__panel founder-shell__panel--next" data-testid="founder-shell-next-step">
              <span className="founder-shell__panel-eyebrow">Next step</span>
              <strong className="founder-shell__panel-title">
                {primaryAction?.title || "Keep the next move obvious."}
              </strong>
              {primaryAction?.detail ? (
                <p className="founder-shell__panel-copy">{primaryAction.detail}</p>
              ) : null}
              <div className="founder-shell__panel-actions">
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
            </article>
          </aside>
        </div>

        {player ? <div className="founder-shell__player">{player}</div> : null}

        {onToggleAssistant ? (
          <div className="founder-shell__assistant-anchor">
            {!assistantOpen ? (
              <button
                type="button"
                className="founder-shell__assistant-toggle"
                data-testid="founder-shell-assistant-toggle"
                onClick={onToggleAssistant}
              >
                Ask Seven
              </button>
            ) : null}
            {assistantOpen && assistant ? (
              <div className="founder-shell__assistant-panel">{assistant}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
