import { useState, useEffect } from "react";
import { PASSPHRASE } from "../../constants";

export default function PassGate({ onPass }) {
  const [inp, setInp] = useState("");
  const [wrong, setWrong] = useState(false);
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 80); }, []);
  const check = () => {
    if (inp.trim().toLowerCase() === PASSPHRASE) onPass();
    else { setWrong(true); setTimeout(() => setWrong(false), 1200); }
  };
  return (
    <div
      className="relative isolate min-h-screen overflow-hidden bg-paper transition-opacity duration-700"
      style={{ opacity: vis ? 1 : 0 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(180,90,56,0.14),_transparent_30%),radial-gradient(circle_at_78%_22%,_rgba(84,108,119,0.1),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.6),_transparent)]" />
      <div className="absolute left-[-4rem] top-[18%] h-40 w-40 rounded-full border border-border-warm opacity-70 animate-float-slow" />
      <div className="absolute bottom-[12%] right-[8%] h-52 w-52 rotate-[14deg] border border-square/35 opacity-55 animate-drift" />
      <div className="absolute right-[16%] top-[16%] h-0 w-0 border-l-[72px] border-r-[72px] border-b-[120px] border-l-transparent border-r-transparent border-b-triangle/12" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-14 md:px-10">
        <div className="w-full max-w-[720px] text-center">
          <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-ink-muted">
            Private reading room
          </div>
          <h1 className="mt-6 font-serif text-[clamp(3.6rem,8vw,6.6rem)] leading-[0.92] tracking-[-0.04em] text-ink">
            Assembled Reality
          </h1>
          <p className="mx-auto mt-5 max-w-[28rem] text-[1rem] leading-[1.85] text-ink-tertiary md:text-[1.05rem]">
            Access begins with a passphrase. The room is private because the document is meant to be read with consequence, not skimmed without position.
          </p>

          <div className="mx-auto mt-14 max-w-[420px] border-t border-border-warm pt-6">
            <input
              autoFocus
              value={inp}
              onChange={e => { setInp(e.target.value); setWrong(false); }}
              onKeyDown={e => e.key === "Enter" && check()}
              spellCheck={false}
              className="w-full border-none border-b bg-transparent px-0 py-4 text-center font-serif text-[1.65rem] tracking-[0.03em] outline-none transition-all duration-200"
              style={{
                borderBottomWidth: "1px",
                borderBottomStyle: "solid",
                borderBottomColor: wrong ? "var(--color-error)" : "var(--color-border-dark)",
                color: wrong ? "var(--color-error)" : "var(--color-ink)",
              }}
            />
            <div
              className="mt-4 h-[18px] font-sans text-sm tracking-[0.1em] uppercase text-error transition-opacity duration-200"
              style={{ opacity: wrong ? 1 : 0 }}
            >
              {wrong ? "Not yet." : ""}
            </div>
          </div>

          <div className="mt-10 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-muted">
            Passphrase required on arrival
          </div>
        </div>
      </div>
    </div>
  );
}
