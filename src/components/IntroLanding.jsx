"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { signIn } from "next-auth/react";
import { ACTION_LINE, BRAND_TRUTH, PRODUCT_MARK } from "@/lib/product-language";
import { recordProductEvent } from "@/lib/product-analytics";

const INTRO_STORAGE_KEY = "document-assembler:intro-complete-v1";
const INTRO_STORAGE_EVENT = "document-assembler:intro-storage";

function subscribeToIntroState(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(INTRO_STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(INTRO_STORAGE_EVENT, callback);
  };
}

function getIntroSeenSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getIntroSeenServerSnapshot() {
  return null;
}

function AuthPanel({ authCapabilities, signedIn, onEnter }) {
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
      onEnter?.();
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
        surface: "landing",
      });
      setError(thrownError instanceof Error ? thrownError.message : "Could not send magic link.");
    } finally {
      setSubmitting(false);
    }
  }

  if (signedIn) {
    return (
      <div className="intro-auth">
        <div className="terminal-actions">
          <Link
            href="/workspace?mode=listen"
            className="terminal-link is-primary"
            onClick={() => onEnter?.()}
          >
            Open {PRODUCT_MARK}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="intro-auth">
      <div className="terminal-actions">
        <button
          type="button"
          className="terminal-button is-primary"
          disabled={!authCapabilities.appleEnabled}
          onClick={() => {
            onEnter?.();
            void signIn("apple", { callbackUrl: "/workspace?mode=listen" });
          }}
        >
          Continue with Apple
        </button>
      </div>

      <div className="terminal-divider" />

      <form className="terminal-upload" onSubmit={handleMagicLink}>
        <label className="terminal-label" htmlFor="landing-email">
          Email magic link
        </label>
        <input
          id="landing-email"
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
  );
}

export default function IntroLanding({
  authCapabilities,
  signedIn = false,
  forceIntro = false,
}) {
  const seenIntro = useSyncExternalStore(
    subscribeToIntroState,
    getIntroSeenSnapshot,
    getIntroSeenServerSnapshot,
  );
  const stage =
    forceIntro || signedIn
      ? "landing"
      : seenIntro === null
        ? "loading"
        : seenIntro
          ? "auth"
          : "landing";

  function markIntroSeen() {
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, "1");
      window.dispatchEvent(new Event(INTRO_STORAGE_EVENT));
    } catch {
      // Ignore storage failures.
    }
  }

  if (stage === "loading") {
    return <main className="intro-page" />;
  }

  if (stage === "auth") {
    return (
      <main className="intro-page">
        <section className="intro-shell intro-shell--operator">
          <div className="intro-shell__stage intro-shell__stage--auth">
            <div className="intro-copy intro-copy--auth">
              <span className="intro-copy__eyebrow">{PRODUCT_MARK}</span>
              <h1 className="intro-copy__title">{BRAND_TRUTH}</h1>
              <p className="intro-copy__support">{ACTION_LINE}</p>
            </div>
            <div className="intro-auth-inline intro-auth-inline--stacked">
              <AuthPanel
                authCapabilities={authCapabilities}
                signedIn={signedIn}
                onEnter={markIntroSeen}
              />
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="intro-page">
      <section className="intro-shell intro-shell--operator">
        <div className="intro-shell__stage">
          <div className="intro-copy">
            <span className="intro-copy__eyebrow">{PRODUCT_MARK}</span>
            <h1 className="intro-copy__title">{BRAND_TRUTH}</h1>
            <p className="intro-copy__support">{ACTION_LINE}</p>
          </div>

          <div className="intro-auth-inline">
            <AuthPanel
              authCapabilities={authCapabilities}
              signedIn={signedIn}
              onEnter={markIntroSeen}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
