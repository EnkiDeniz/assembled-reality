"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { PRODUCT_NAME } from "@/lib/product-language";

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
      setError(thrownError instanceof Error ? thrownError.message : "Could not send magic link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="terminal-page auth-shell">
      <section className="auth-shell__panel">
        <div className="auth-shell__copy">
          <h1 className="auth-shell__title">{PRODUCT_NAME}</h1>
          <div className="terminal-pill-row">
            <span className={`terminal-pill ${authCapabilities.appleEnabled ? "is-green" : ""}`}>
              Apple sign-in {authCapabilities.appleEnabled ? "available" : "unavailable"}
            </span>
            <span className={`terminal-pill ${authCapabilities.magicLinksEnabled ? "is-green" : ""}`}>
              Magic link {authCapabilities.magicLinksEnabled ? "available" : "unavailable"}
            </span>
          </div>
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
                {submitting ? "Sending..." : "Send magic link"}
              </button>
            </div>
            {status ? <p className="terminal-status is-success">{status}</p> : null}
            {error ? <p className="terminal-status is-error">{error}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
