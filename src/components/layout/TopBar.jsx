import { useState, useCallback, useEffect } from "react";

function formatTimer(seconds) {
  if (seconds < 60) return null; // don't show under 1 min
  const m = Math.floor(seconds / 60);
  return `${m}m`;
}

export default function TopBar({ reader, tS, tA, nav, setNav, pulse, setPulse, carry, setCarry, currentSection, sessionDuration }) {
  const [scrollPct, setScrollPct] = useState(0);

  const onScroll = useCallback(() => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0) setScrollPct(Math.min(1, window.scrollY / h));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const hasActivity = tS > 0 || tA > 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-100 px-3 pt-[calc(env(safe-area-inset-top)+12px)] md:px-5 md:pt-5">
      <div className="pointer-events-auto relative mx-auto max-w-[1500px] overflow-hidden rounded-[1.55rem] border border-border-dark/75 bg-paper-soft/92 shadow-[0_24px_70px_rgba(20,17,15,0.1)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-3 py-3 md:px-5 md:py-3.5">
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
          <button
            onClick={() => setNav(!nav)}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border bg-white/45 p-1.5 text-[1rem] text-ink-secondary transition-all duration-150 hover:border-border-dark hover:bg-white/70 ${
              nav ? "border-border-dark text-ink" : "border-border/70"
            }`}
          >{"\u2630"}</button>

            <div className="min-w-0">
              <div className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                Assembled Reality
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-3">
                <span className="truncate font-serif text-[1.1rem] leading-none text-ink md:text-[1.2rem]">
                  {currentSection ? currentSection.title : "Reading instrument"}
                </span>
                {currentSection && (
                  <span className="hidden rounded-full border border-border px-2.5 py-1 font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink-muted md:inline-flex">
                    &sect;{currentSection.num}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 md:gap-2.5">
          {hasActivity && (
            <span className="hidden rounded-full border border-border bg-white/35 px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink-muted lg:inline-flex">
              {tS} signals · {tA} notes
            </span>
          )}
          <button onClick={() => setPulse(!pulse)} className={pillClass(pulse)} title="Team activity">Pulse</button>
          <button onClick={() => setCarry(!carry)} className={pillClass(carry)} title="Your collected passages">Carry</button>
          <span className="hidden font-sans text-sm font-medium text-ink-muted md:inline">{reader}</span>
          {sessionDuration > 0 && formatTimer(sessionDuration) && (
            <span className="hidden font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink-faint md:inline">
              {formatTimer(sessionDuration)}
            </span>
          )}
        </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-border-warm/90 bg-white/18 px-4 py-2 md:hidden">
          <div className="min-w-0 truncate font-sans text-[0.78rem] uppercase tracking-[0.18em] text-ink-muted">
            {currentSection ? `§${currentSection.num} ${currentSection.title}` : "Reading instrument"}
          </div>
          <div className="font-sans text-[0.78rem] text-ink-muted">{reader}</div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-border/55">
          <div
            className="h-full bg-gradient-to-r from-triangle/50 via-square/45 to-circle/45 transition-[width] duration-100 ease-linear"
            style={{ width: `${scrollPct * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

const pillClass = (active) =>
  `min-h-10 min-w-auto rounded-full border px-3 py-1 text-sm font-medium transition-all duration-150 ${
    active
      ? "border-ink bg-ink text-paper-soft"
      : "border-border-dark/70 bg-white/34 text-ink-tertiary hover:border-ink hover:bg-white/60"
  }`;
