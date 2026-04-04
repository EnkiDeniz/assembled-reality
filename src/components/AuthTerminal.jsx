"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { PRODUCT_NAME } from "@/lib/product-language";
import { recordProductEvent } from "@/lib/product-analytics";

export default function AuthTerminal({ authCapabilities }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleMagicLink(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/workspace?mode=listen",
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      setStatus("Magic link sent. Check your inbox.");
    } catch (thrownError) {
      recordProductEvent("auth_failed", {
        method: "magic_link",
        surface: "auth_terminal",
      });
      setError(thrownError instanceof Error ? thrownError.message : "Could not send magic link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="intro-page auth-shell">
      <section className="auth-shell__panel">
        <div className="auth-shell__copy">
          <h1 className="auth-shell__title">{PRODUCT_NAME}</h1>
        </div>

        <div className="auth-shell__body">
          <div className="terminal-actions">
            <button
              type="button"
              className="terminal-button is-primary"
              disabled={!authCapabilities.appleEnabled}
              onClick={() => signIn("apple", { callbackUrl: "/workspace?mode=listen" })}
            >
              Continue with Apple
            </button>
          </div>

          <div className="terminal-divider" />

          <form className="terminal-upload" onSubmit={handleMagicLink}>
            <label className="terminal-label" htmlFor="email">
              Email magic link
            </label>
            <input
              id="email"
              className="terminal-input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              disabled={!authCapabilities.magicLinksEnabled || submitting}
              onChange={(event) => setEmail(event.target.value)}
            />
            <div className="terminal-actions">
              <button
                type="submit"
                className="terminal-button"
                disabled={!authCapabilities.magicLinksEnabled || !email.trim() || submitting}
              >
                {submitting ? "Sending…" : "Send magic link"}
              </button>
            </div>
            {status ? <p className="terminal-status is-success" aria-live="polite">{status}</p> : null}
            {error ? <p className="terminal-status is-error" aria-live="polite">{error}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
