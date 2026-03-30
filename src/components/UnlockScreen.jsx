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
          <p className="lock-screen__eyebrow">Private reading instrument</p>
          <h1 className="lock-screen__title">Assembled Reality</h1>
          <p className="lock-screen__lede">Enter an internal access code to continue.</p>
        </div>

        <form className="lock-screen__form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="entry-code">
            Internal entry code
          </label>
          <div className={`lock-screen__field ${wrong ? "is-wrong" : ""}`}>
            <input
              id="entry-code"
              className="lock-screen__input"
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
              placeholder="Access code"
            />
            <button type="submit" className="lock-screen__submit">
              Enter
            </button>
          </div>
          <div className="lock-screen__status">{wrong ? "Not yet." : "\u00A0"}</div>
        </form>

        <div className="lock-screen__divider" />

        <button
          type="button"
          className="lock-screen__puzzle-toggle"
          onClick={() => setShowPuzzle((current) => !current)}
          aria-expanded={showPuzzle}
          aria-controls="cuneiform-matrix"
        >
          {showPuzzle ? "Hide alternate entry" : "Open alternate entry"}
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
