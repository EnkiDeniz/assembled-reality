import { useState } from "react";

export default function WelcomeGuide({ reader, dismissed, onDismiss, onReopen }) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="mb-5 flex flex-col gap-4 rounded-[1.6rem] border border-border-warm bg-white/34 px-5 py-4 shadow-[0_12px_26px_rgba(20,17,15,0.03)] md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
            Orientation
          </div>
          <p className="mt-1 text-sm leading-[1.7] text-ink-tertiary">
            Welcome, {reader}. This is a living document shaped by signals, tags, and discussion.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { onReopen(); setExpanded(true); }}
            className="rounded-full border border-border-dark/70 bg-paper-soft px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink"
          >
            How to read this text
          </button>
          {!dismissed && (
            <button
              onClick={onDismiss}
              className="rounded-full border border-transparent px-2 py-2 text-sm font-medium text-ink-muted transition-colors duration-150 hover:text-ink"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 animate-fade-in rounded-[1.9rem] border border-border-warm bg-surface-warm/90 px-5 py-5 shadow-[0_18px_40px_rgba(20,17,15,0.05)] md:px-7">
      <div className="flex flex-col gap-4 border-b border-border-warm pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
            Reading guide
          </div>
          <div className="mt-2 font-serif text-[2rem] leading-none text-ink">
            Read it like a threshold, not a brochure.
          </div>
        </div>
        <button
          onClick={() => { onDismiss(); setExpanded(false); }}
          className="rounded-full border border-border-dark/70 px-4 py-2 text-sm font-medium text-ink-tertiary transition-colors duration-150 hover:border-ink hover:text-ink"
        >
          Collapse
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <GuideItem
          icon="✦"
          title="Select any line"
          desc="Highlight with a shape, carry a passage, or start an inline comment thread."
        />
        <GuideItem
          icon="△ □ ○"
          title="Read through the shapes"
          desc={<><Sh c="#B45A38">△</Sh> aim · <Sh c="#546C77">□</Sh> evidence · <Sh c="#8B7442">○</Sh> context</>}
        />
        <GuideItem
          icon="§"
          title="Use the section footer"
          desc={<>Every section can be signaled, tagged, and discussed without breaking the reading rhythm.</>}
        />
        <GuideItem
          icon="◉"
          title="Watch the room"
          desc={<><strong>Pulse</strong> shows team activity. <strong>Carry</strong> collects the lines worth keeping.</>}
        />
      </div>
    </div>
  );
}

function GuideItem({ icon, title, desc }) {
  return (
    <div className="flex gap-3 border-b border-border-warm pb-4 last:border-b-0">
      <span className="min-w-8 shrink-0 pt-0.5 text-center font-mono text-sm leading-[18px] text-ink-muted">{icon}</span>
      <div>
        <div className="font-serif text-[1.4rem] leading-none text-ink-secondary">{title}</div>
        <div className="mt-1 text-sm leading-[1.7] text-ink-tertiary">{desc}</div>
      </div>
    </div>
  );
}

function Sh({ c, children }) {
  return <span style={{ color: c }} className="font-semibold">{children}</span>;
}
