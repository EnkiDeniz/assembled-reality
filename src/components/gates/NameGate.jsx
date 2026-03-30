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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(180,90,56,0.14),_transparent_28%),radial-gradient(circle_at_80%_22%,_rgba(139,116,66,0.12),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.55),_transparent)]" />
      <div className="absolute left-[10%] top-[18%] h-36 w-36 rounded-full border border-circle/40 opacity-60 animate-float-slow" />
      <div className="absolute bottom-[16%] right-[8%] h-44 w-44 rotate-[12deg] border border-square/35 opacity-50 animate-drift" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-14 md:px-10">
        <div className="w-full max-w-[860px]">
          <div className="mx-auto max-w-[500px] text-center">
            <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-ink-muted">
              Arrive
            </div>
            <h1 className="mt-6 font-serif text-[clamp(3.2rem,7vw,5.8rem)] leading-[0.94] tracking-[-0.04em] text-ink">
              Choose the name you will read under.
            </h1>
            <p className="mt-5 text-[1rem] leading-[1.85] text-ink-tertiary">
              Reader identity stays attached to signals, annotations, and carried passages. Arrival is part of the record.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-[680px] gap-3 border-t border-border-warm pt-7 sm:grid-cols-2">
            {READERS.map(n => (
              <button
                key={n}
                onClick={() => onSelect(n)}
                className="group relative min-h-14 overflow-hidden rounded-full border border-border-dark/75 bg-paper-soft/78 px-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-paper-soft hover:shadow-[0_18px_40px_rgba(27,24,21,0.08)]"
              >
                <span className="absolute inset-y-[22%] left-4 w-px bg-gradient-to-b from-transparent via-border-dark to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <span className="block font-serif text-[1.55rem] leading-none text-ink">{n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
