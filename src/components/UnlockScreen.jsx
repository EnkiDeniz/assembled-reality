"use client";

import { useEffect, useMemo, useState } from "react";
import CuneiformPuzzle from "./CuneiformPuzzle";

export default function UnlockScreen({
  onUnlock,
  onSignOut = null,
  userName = "",
  variant = "default",
}) {
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isLandingVariant = variant === "landing";

  useEffect(() => {
    document.body.classList.add("is-lock-screen");
    if (isLandingVariant) {
      document.body.classList.add("is-lock-screen-minimal");
    }

    return () => {
      document.body.classList.remove("is-lock-screen");
      document.body.classList.remove("is-lock-screen-minimal");
    };
  }, [isLandingVariant]);

  const normalizedCode = useMemo(() => code.trim().toLowerCase(), [code]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!normalizedCode || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ code: normalizedCode }),
      });

      if (!response.ok) {
        throw new Error("Invalid code");
      }

      onUnlock("bypass");
      return;
    } catch {
      setWrong(true);
      window.setTimeout(() => setWrong(false), 900);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={`lock-screen ${isLandingVariant ? "lock-screen--minimal" : ""}`}>
      <div className={`lock-screen__frame ${isLandingVariant ? "lock-screen__frame--minimal" : ""}`}>
        {!isLandingVariant ? (
          <div className="lock-screen__header">
            <p className="lock-screen__eyebrow">Private reading instrument</p>
            <h1 className="lock-screen__title">Assembled Reality</h1>
            <p className="lock-screen__lede">Enter an internal access code to continue.</p>
            {userName ? (
              <div className="lock-screen__identity">
                <span>Signed in as {userName}</span>
                {onSignOut ? (
                  <button type="button" className="lock-screen__identity-action" onClick={onSignOut}>
                    Switch reader
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <form
          className={`lock-screen__form ${isLandingVariant ? "lock-screen__form--minimal" : ""}`}
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="entry-code">
            Internal entry code
          </label>
          <div
            className={`lock-screen__field ${wrong ? "is-wrong" : ""} ${isLandingVariant ? "lock-screen__field--minimal" : ""}`}
          >
            <input
              id="entry-code"
              className={`lock-screen__input ${isLandingVariant ? "lock-screen__input--minimal" : ""}`}
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
              placeholder={isLandingVariant ? "" : "Access code"}
            />
            <button
              type="submit"
              className={`lock-screen__submit ${isLandingVariant ? "lock-screen__submit--minimal" : ""}`}
              disabled={submitting}
            >
              {submitting ? "..." : "Enter"}
            </button>
          </div>
          <div className={`lock-screen__status ${isLandingVariant ? "lock-screen__status--minimal" : ""}`}>
            {wrong ? "Not yet." : "\u00A0"}
          </div>
        </form>

        {!isLandingVariant ? <div className="lock-screen__divider" /> : null}

        <button
          type="button"
          className={`lock-screen__puzzle-toggle ${isLandingVariant ? "lock-screen__puzzle-toggle--minimal" : ""}`}
          onClick={() => setShowPuzzle((current) => !current)}
          aria-expanded={showPuzzle}
          aria-controls="cuneiform-matrix"
        >
          {showPuzzle
            ? isLandingVariant
              ? "hide puzzle"
              : "Hide alternate entry"
            : isLandingVariant
              ? "solve the puzzle"
              : "Open alternate entry"}
        </button>

        {showPuzzle && (
          <div
            id="cuneiform-matrix"
            className={`lock-screen__puzzle ${isLandingVariant ? "lock-screen__puzzle--minimal" : ""}`}
          >
            <CuneiformPuzzle onSolved={onUnlock} />
          </div>
        )}
      </div>
    </main>
  );
}
