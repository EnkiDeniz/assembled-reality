import { useEffect, useState } from "react";
import { PASSPHRASE } from "../../constants";

export default function PassGate({ onPass }) {
  const [inp, setInp] = useState("");
  const [wrong, setWrong] = useState(false);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVis(true), 40);
    return () => clearTimeout(timer);
  }, []);

  const check = () => {
    if (inp.trim().toLowerCase() === PASSPHRASE) {
      onPass();
      return;
    }

    setWrong(true);
    setTimeout(() => setWrong(false), 1200);
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-paper px-6 transition-opacity duration-500"
      style={{ opacity: vis ? 1 : 0 }}
    >
      <div className="w-full max-w-[360px]">
        <input
          autoFocus
          type="password"
          value={inp}
          onChange={(e) => {
            setInp(e.target.value);
            setWrong(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") check();
          }}
          spellCheck={false}
          aria-label="Passphrase"
          className="w-full border-none border-b bg-transparent px-0 py-4 text-center font-serif text-[1.55rem] tracking-[0.06em] text-ink outline-none transition-colors duration-200"
          style={{
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            borderBottomColor: wrong ? "var(--color-error)" : "var(--color-border-dark)",
            color: wrong ? "var(--color-error)" : "var(--color-ink)",
          }}
        />
        <div
          className="mt-4 h-[18px] text-center font-sans text-[0.72rem] uppercase tracking-[0.22em] text-error transition-opacity duration-200"
          style={{ opacity: wrong ? 1 : 0 }}
        >
          {wrong ? "Not yet." : ""}
        </div>
      </div>
    </main>
  );
}
