import { useEffect, useMemo, useState } from "react";
import CuneiformPuzzle from "./CuneiformPuzzle";
import { BYPASS_CODES } from "../lib/cuneiform";

export default function UnlockScreen({ onUnlock }) {
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);

  useEffect(() => {
    document.body.classList.add("is-lock-screen");
    return () => document.body.classList.remove("is-lock-screen");
  }, []);

  const normalizedCode = useMemo(() => code.trim().toLowerCase(), [code]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (BYPASS_CODES.includes(normalizedCode)) {
      onUnlock("bypass");
      return;
    }

    setWrong(true);
    window.setTimeout(() => setWrong(false), 900);
  };

  return (
    <main className="lock-screen">
      <div className="lock-screen__frame">
        <div className="lock-screen__header">
          <p className="lock-screen__eyebrow">Assembled Reality</p>
          <h1 className="lock-screen__title">hineni</h1>
        </div>

        <form className="lock-screen__form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="entry-code">
            Internal entry code
          </label>
          <input
            id="entry-code"
            className={`lock-screen__input ${wrong ? "is-wrong" : ""}`}
            type="password"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setWrong(false);
            }}
            placeholder=" "
          />
          <div className="lock-screen__status">{wrong ? "Not yet." : "\u00A0"}</div>
        </form>

        <button
          type="button"
          className="lock-screen__puzzle-toggle"
          onClick={() => setShowPuzzle((current) => !current)}
          aria-expanded={showPuzzle}
          aria-controls="cuneiform-matrix"
        >
          𒀭 𒂗 𒆠 𒐛
        </button>

        {showPuzzle && (
          <div id="cuneiform-matrix" className="lock-screen__puzzle">
            <CuneiformPuzzle onSolved={onUnlock} />
          </div>
        )}
      </div>
    </main>
  );
}
