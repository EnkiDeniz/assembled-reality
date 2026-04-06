"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import {
  DISCLAIMER_ACCEPT_PHRASE,
  DISCLAIMER_SUPPORT_EMAIL,
  disclaimerGate,
} from "@/lib/disclaimer-content";

export default function WorkspaceDisclaimerGate({ onAccept }) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const ready = useMemo(
    () => value.trim().toLowerCase() === DISCLAIMER_ACCEPT_PHRASE,
    [value],
  );

  async function handleAccept() {
    if (!ready || pending) return;

    setPending(true);
    setError("");

    try {
      await onAccept?.();
    } catch (thrownError) {
      setError(
        thrownError instanceof Error
          ? thrownError.message
          : "Could not record your acknowledgment.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="loegos-disclaimer-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-disclaimer-title"
      data-testid="workspace-disclaimer-gate"
    >
      <div className="loegos-disclaimer-gate__backdrop" />
      <section className="loegos-disclaimer-gate__panel">
        <div className="loegos-disclaimer-gate__copy">
          <span className="loegos-kicker">{disclaimerGate.eyebrow}</span>
          <h2 id="workspace-disclaimer-title" className="loegos-disclaimer-gate__title">
            {disclaimerGate.title}
          </h2>
          <p className="loegos-disclaimer-gate__lede">{disclaimerGate.lede}</p>
          <p className="loegos-disclaimer-gate__boundary">{disclaimerGate.boundary}</p>
        </div>

        <div className="loegos-disclaimer-gate__grid">
          <section className="loegos-disclaimer-gate__section">
            <h3>Keep in view</h3>
            <ul>
              {disclaimerGate.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="loegos-disclaimer-gate__section">
            <h3>Use it safely</h3>
            <ul>
              {disclaimerGate.guidance.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="loegos-disclaimer-gate__consent">
          <p>{disclaimerGate.consent}</p>
          <label className="loegos-disclaimer-gate__prompt" htmlFor="workspace-disclaimer-input">
            {disclaimerGate.prompt}
          </label>
          <input
            id="workspace-disclaimer-input"
            className="loegos-disclaimer-gate__input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={DISCLAIMER_ACCEPT_PHRASE}
            autoComplete="off"
            spellCheck="false"
            data-testid="workspace-disclaimer-input"
          />
          {error ? <p className="loegos-disclaimer-gate__error">{error}</p> : null}
          <div className="loegos-disclaimer-gate__actions">
            <button
              type="button"
              className="terminal-button is-primary"
              disabled={!ready || pending}
              onClick={() => void handleAccept()}
              data-testid="workspace-disclaimer-submit"
            >
              {pending ? "Recording…" : disclaimerGate.proceedLabel}
            </button>
            <Link href="/disclaimer" target="_blank" rel="noreferrer" className="terminal-link">
              {disclaimerGate.reviewLabel}
            </Link>
            <button
              type="button"
              className="terminal-button"
              onClick={() => void signOut({ callbackUrl: "/" })}
            >
              {disclaimerGate.deferLabel}
            </button>
          </div>
          <p className="loegos-disclaimer-gate__support">
            {disclaimerGate.supportLine} Support: {DISCLAIMER_SUPPORT_EMAIL}
          </p>
        </div>
      </section>
    </div>
  );
}
