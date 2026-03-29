import { useState, useCallback, useEffect } from "react";

function formatTimer(seconds) {
  if (seconds < 60) return null; // don't show under 1 min
  const m = Math.floor(seconds / 60);
  return `${m}m`;
}

export default function TopBar({ reader, tS, tA, nav, setNav, pulse, setPulse, carry, setCarry, receipt, setReceipt, currentSection, sessionDuration }) {
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
    <div className="fixed top-0 left-0 right-0 z-100">
      <div className="bg-surface/92 backdrop-blur-[8px] border-b border-border px-2.5 md:px-[18px] h-10 flex items-center justify-between text-base">
        <div className="flex items-center gap-1.5 md:gap-3.5">
          <button
            onClick={() => setNav(!nav)}
            className={`bg-transparent border-none cursor-pointer text-[0.875rem] p-1.5 min-h-9 min-w-9 flex items-center justify-center ${nav ? "md:text-ink" : ""} text-ink-secondary`}
          >{"\u2630"}</button>
          {currentSection && (
            <span className="md:hidden text-xs text-ink-muted font-medium max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="font-mono">§{currentSection.num}</span> {currentSection.title}
            </span>
          )}
          <span className="hidden md:inline font-semibold tracking-[0.04em] uppercase text-ink-muted text-sm">
            Assembled Reality
          </span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2.5">
          {hasActivity && (
            <span className="hidden md:inline text-ink-muted text-sm">{tS}s &middot; {tA}a</span>
          )}
          <button onClick={() => setPulse(!pulse)} className={pillClass(pulse)} title="Team activity">Pulse</button>
          <button onClick={() => setCarry(!carry)} className={pillClass(carry)} title="Your collected passages">Carry</button>
          <button onClick={() => setReceipt(!receipt)} className={pillClass(receipt)} title="Session receipt">Receipt</button>
          {sessionDuration > 0 && formatTimer(sessionDuration) && (
            <span className="font-mono text-xs text-ink-faint hidden md:inline">{formatTimer(sessionDuration)}</span>
          )}
          <span className="text-ink-muted text-sm font-medium max-w-15 md:max-w-none overflow-hidden text-ellipsis whitespace-nowrap">{reader}</span>
        </div>
      </div>
      {/* Reading progress bar */}
      <div className="h-0.5 bg-transparent w-full relative -mt-px">
        <div
          className="h-full bg-ink opacity-15 transition-[width] duration-100 ease-linear"
          style={{ width: `${scrollPct * 100}%` }}
        />
      </div>
    </div>
  );
}

const pillClass = (active) =>
  `px-2.5 py-1 text-sm font-medium border rounded-[3px] cursor-pointer min-h-7 min-w-auto transition-all duration-100 ${
    active
      ? "bg-ink text-white border-ink"
      : "bg-transparent text-ink-tertiary border-border"
  }`;
