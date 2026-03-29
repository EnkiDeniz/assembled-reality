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
      className="min-h-screen flex items-center justify-center bg-surface transition-opacity duration-600"
      style={{ opacity: vis ? 1 : 0 }}
    >
      <div className="w-full max-w-[400px] px-5 py-8 text-center">
        <input
          autoFocus
          value={inp}
          onChange={e => { setInp(e.target.value); setWrong(false); }}
          onKeyDown={e => e.key === "Enter" && check()}
          spellCheck={false}
          className="w-full py-3.5 text-lg font-sans bg-transparent border-none border-b outline-none text-center transition-all duration-200"
          style={{
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            borderBottomColor: wrong ? "#DC2626" : "var(--color-border)",
            color: wrong ? "#DC2626" : "var(--color-ink)",
          }}
        />
        <div
          className="mt-3 text-base text-error h-[18px] transition-opacity duration-200"
          style={{ opacity: wrong ? 1 : 0 }}
        >
          {wrong ? "Not yet." : ""}
        </div>
      </div>
    </div>
  );
}
