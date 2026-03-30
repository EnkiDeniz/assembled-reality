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
    <div className="pointer-events-none fixed inset-x-0 top-0 z-100 px-3 pt-3 md:px-4 md:pt-4">
      <div className="pointer-events-auto relative mx-auto flex h-14 max-w-[1440px] items-center justify-between rounded-full border border-border-dark/70 bg-paper-soft/78 px-3 shadow-[0_18px_45px_rgba(27,24,21,0.08)] backdrop-blur-xl md:px-5">
        <div className="flex items-center gap-1.5 md:gap-4">
          <button
            onClick={() => setNav(!nav)}
            className={`flex min-h-10 min-w-10 items-center justify-center rounded-full border border-transparent bg-transparent p-1.5 text-[1rem] text-ink-secondary transition-all duration-150 hover:border-border hover:bg-white/55 ${nav ? "md:text-ink" : ""}`}
          >{"\u2630"}</button>
          {currentSection && (
            <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap font-sans text-xs font-medium text-ink-muted md:hidden">
              <span className="font-mono">&sect;{currentSection.num}</span> {currentSection.title}
            </span>
          )}
          <div className="hidden md:block">
            <div className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
              Assembled Reality
            </div>
            <div className="mt-0.5 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink-faint">
              Reading instrument
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2.5">
          {hasActivity && (
            <span className="hidden font-sans text-xs uppercase tracking-[0.16em] text-ink-muted md:inline">
              {tS}s &middot; {tA}a
            </span>
          )}
          <button onClick={() => setPulse(!pulse)} className={pillClass(pulse)} title="Team activity">Pulse</button>
          <button onClick={() => setCarry(!carry)} className={pillClass(carry)} title="Your collected passages">Carry</button>
          <span className="max-w-15 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-sm font-medium text-ink-muted md:max-w-none">{reader}</span>
          {sessionDuration > 0 && formatTimer(sessionDuration) && (
            <span className="hidden font-mono text-xs uppercase tracking-[0.14em] text-ink-faint md:inline">{formatTimer(sessionDuration)}</span>
          )}
        </div>
        <div className="absolute inset-x-5 bottom-0 h-px overflow-hidden rounded-full bg-border/50">
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
  `min-h-9 min-w-auto rounded-full border px-3 py-1 text-sm font-medium transition-all duration-150 ${
    active
      ? "border-ink bg-ink text-paper-soft"
      : "border-border-dark/70 bg-transparent text-ink-tertiary hover:border-ink hover:bg-white/55"
  }`;
