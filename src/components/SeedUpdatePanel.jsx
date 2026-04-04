export default function SeedUpdatePanel({
  suggestion = null,
  pending = false,
  onApply,
  onEdit,
  onDismiss,
}) {
  if (!suggestion) return null;

  return (
    <section className="assembler-seed-update">
      <div className="assembler-seed-update__copy">
        <span className="assembler-seed-update__eyebrow">Seed update available</span>
        <h3 className="assembler-seed-update__title">
          {suggestion.title || "Seven found a clearer shape for the seed."}
        </h3>
        <p className="assembler-seed-update__body">
          {suggestion.summary ||
            "Review the proposed Aim, What&apos;s here, The gap, and Sealed copy before replacing the live seed."}
        </p>
      </div>

      <div className="assembler-seed-update__preview">
        {suggestion.aim ? (
          <article className="assembler-seed-update__section">
            <span>Aim</span>
            <p>{suggestion.aim}</p>
          </article>
        ) : null}
        {suggestion.whatsHere ? (
          <article className="assembler-seed-update__section">
            <span>What&apos;s here</span>
            <p>{suggestion.whatsHere}</p>
          </article>
        ) : null}
        {suggestion.gap ? (
          <article className="assembler-seed-update__section">
            <span>The gap</span>
            <p>{suggestion.gap}</p>
          </article>
        ) : null}
      </div>

      <div className="assembler-seed-update__actions">
        <button
          type="button"
          className="terminal-button is-primary"
          onClick={onApply}
          disabled={pending}
        >
          {pending ? "Applying…" : "Apply"}
        </button>
        <button type="button" className="terminal-button" onClick={onEdit} disabled={pending}>
          Edit
        </button>
        <button type="button" className="terminal-button" onClick={onDismiss} disabled={pending}>
          Dismiss
        </button>
      </div>
    </section>
  );
}
