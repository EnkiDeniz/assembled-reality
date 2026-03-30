import { useState, useEffect } from "react";
import { READERS } from "../../constants";

export default function NameGate({ onSelect }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 50); }, []);
  return (
    <div
      className="relative isolate min-h-screen overflow-hidden bg-paper transition-opacity duration-700"
      style={{ opacity: vis ? 1 : 0 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(180,90,56,0.12),_transparent_24%),radial-gradient(circle_at_82%_18%,_rgba(139,116,66,0.1),_transparent_22%),linear-gradient(135deg,_rgba(255,255,255,0.75),_rgba(255,255,255,0.18)_52%,_rgba(232,220,203,0.4))]" />
      <div className="absolute right-[-10rem] bottom-[-4rem] h-[26rem] w-[26rem] rounded-full border border-border-warm/75 opacity-70" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-[calc(env(safe-area-inset-top)+40px)] md:px-10">
        <div className="grid w-full max-w-[1180px] gap-10 lg:grid-cols-[minmax(0,0.9fr)_460px] lg:items-center">
          <div className="max-w-[36rem]">
            <div className="font-mono text-[0.72rem] uppercase tracking-[0.26em] text-ink-muted">
              Arrival
            </div>
            <h1 className="mt-5 font-serif text-[clamp(3.2rem,6.7vw,6rem)] leading-[0.92] tracking-[-0.05em] text-ink">
              Choose the name you will read under.
            </h1>
            <p className="mt-5 text-[1.02rem] leading-[1.9] text-ink-tertiary md:text-[1.08rem]">
              Reader identity stays attached to signals, annotations, carry, and seal-readiness. Arrival is part of the record.
            </p>
          </div>

          <div className="rounded-[2rem] border border-border-dark/70 bg-paper-soft/95 px-6 py-7 shadow-[0_32px_90px_rgba(20,17,15,0.1)] md:px-8">
            <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
              Reader identity
            </div>
            <div className="mt-3 font-serif text-[2rem] leading-[1.04] text-ink">
              Select your witness name.
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {READERS.map(n => (
                <button
                  key={n}
                  onClick={() => onSelect(n)}
                  className="group relative min-h-14 overflow-hidden rounded-[1.2rem] border border-border-dark/75 bg-white/35 px-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-paper-soft hover:shadow-[0_18px_40px_rgba(27,24,21,0.08)]"
                >
                  <span className="absolute inset-y-[20%] left-4 w-px bg-gradient-to-b from-transparent via-border-dark to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  <span className="block font-serif text-[1.45rem] leading-none text-ink">{n}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
