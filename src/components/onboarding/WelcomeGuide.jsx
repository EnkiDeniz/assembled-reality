import { useState, useEffect } from "react";

export default function WelcomeGuide({ reader, dismissed, onDismiss, onReopen }) {
  const [expanded, setExpanded] = useState(!dismissed);

  useEffect(() => {
    if (!dismissed) setExpanded(true);
  }, [dismissed]);

  if (dismissed && !expanded) {
    return (
      <button
        onClick={() => { onReopen(); setExpanded(true); }}
        className="bg-transparent border-none cursor-pointer text-sm text-ink-muted p-0 pb-2 underline underline-offset-2"
      >
        How to use this document
      </button>
    );
  }

  if (!expanded) return null;

  return (
    <div className="mb-6 animate-fade-in">
      {/* Mobile: compact single-line with expand */}
      <div className="md:hidden">
        <MobileGuide reader={reader} onDismiss={() => { onDismiss(); setExpanded(false); }} />
      </div>
      {/* Desktop: full card */}
      <div className="hidden md:block">
        <DesktopGuide reader={reader} onDismiss={() => { onDismiss(); setExpanded(false); }} />
      </div>
    </div>
  );
}

function MobileGuide({ reader, onDismiss }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-3 bg-surface-warm border border-surface-warm-border rounded-[4px]">
      <div className="flex justify-between items-center">
        <div className="text-md font-medium text-ink">
          Welcome, {reader}. <span className="text-ink-tertiary font-normal">This is a living document you shape together.</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <button
            onClick={() => setOpen(!open)}
            className="bg-transparent border-none cursor-pointer text-sm text-ink-muted underline underline-offset-2 p-0"
          >
            {open ? "Less" : "How?"}
          </button>
          <button
            onClick={onDismiss}
            className="bg-transparent border-none cursor-pointer text-ink-faint text-base p-1"
          >
            &times;
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-2.5 pt-2.5 border-t border-surface-warm-border grid grid-cols-1 gap-1.5 animate-fade-in">
          <HintLine icon="✦" text="Select text to highlight, carry, or comment" />
          <HintLine icon="△□○" text="Three shapes: aim · evidence · context" />
          <HintLine icon="§" text="Each section has Signal · Tag · Discuss at the bottom" />
          <HintLine icon="◉" text="Pulse = team activity · Carry = your selections" />
        </div>
      )}
    </div>
  );
}

function DesktopGuide({ reader, onDismiss }) {
  return (
    <div className="py-[18px] px-5 bg-surface-warm border border-surface-warm-border rounded-[4px]">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-body font-semibold text-ink mb-0.5">
            Welcome, {reader}.
          </div>
          <div className="text-md text-ink-tertiary leading-[1.5]">
            This is a living document. You don't just read it — you shape it.
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="bg-transparent border border-border rounded-[3px] px-2.5 py-1 text-sm font-medium text-ink-tertiary cursor-pointer whitespace-nowrap ml-3 min-h-7"
        >
          Got it
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <GuideItem
          icon="✦"
          title="Select any text"
          desc="Highlight with a shape, carry a passage, or start a comment thread."
        />
        <GuideItem
          icon="△ □ ○"
          title="Three shapes"
          desc={<><Sh c="#B84C2A">△</Sh> Strengthens aim · <Sh c="#2A5A6B">□</Sh> Needs evidence · <Sh c="#6B5A2A">○</Sh> Needs context</>}
        />
        <GuideItem
          icon="§"
          title="Section tools"
          desc={<>Each section has <em>Signal · Tag · Discuss</em> at the bottom. Tag sections as load-bearing, needs work, or ready to seal.</>}
        />
        <GuideItem
          icon="◉"
          title="Pulse & Carry"
          desc={<><strong>Pulse</strong> shows team activity. <strong>Carry</strong> collects your selected passages for export.</>}
        />
      </div>

      <div className="mt-2.5 pt-2 border-t border-surface-warm-border text-sm text-ink-muted leading-[1.5]">
        When 4+ readers vote "Ready to seal" on a section, it locks. The document evolves through your signals.
      </div>
    </div>
  );
}

function GuideItem({ icon, title, desc }) {
  return (
    <div className="flex gap-2 items-start p-1.5 px-2 bg-surface rounded-[3px] border border-divider">
      <span className="text-base font-semibold text-ink-muted min-w-7 text-center shrink-0 font-mono leading-[18px] pt-px">{icon}</span>
      <div>
        <div className="text-base font-semibold text-ink-secondary mb-px">{title}</div>
        <div className="text-sm text-ink-tertiary leading-[1.45]">{desc}</div>
      </div>
    </div>
  );
}

function HintLine({ icon, text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-tertiary">
      <span className="font-mono text-xs text-ink-muted w-6 text-center shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function Sh({ c, children }) {
  return <span style={{ color: c }} className="font-semibold">{children}</span>;
}
