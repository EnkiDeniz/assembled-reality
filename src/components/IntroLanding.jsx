"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const INTRO_STORAGE_KEY = "document-assembler:intro-complete-v1";
const INTRO_STORAGE_EVENT = "document-assembler:intro-storage";

function ListenVisual() {
  const [active, setActive] = useState(0);
  const lines = [
    "The goal is to ship before the quarter closes.",
    "Each team owns one deliverable.",
    "Move fast but leave receipts.",
  ];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActive((value) => (value + 1) % lines.length);
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [lines.length]);

  return (
    <div className="intro-visual intro-visual--listen" aria-hidden="true">
      <div className="intro-listen__lines">
        {lines.map((line, index) => (
          <div
            key={line}
            className={`intro-listen__line ${index === active ? "is-active" : ""}`}
          >
            <div className="intro-listen__stripe" />
            <span>{line}</span>
          </div>
        ))}
      </div>

      <div className="intro-listen__player">
        <span className="intro-listen__play">PLAY</span>
        <div className="intro-listen__rail">
          <div
            className="intro-listen__fill"
            style={{ width: `${((active + 1) / lines.length) * 100}%` }}
          />
        </div>
        <span className="intro-listen__count">
          {active + 1}/{lines.length}
        </span>
      </div>
    </div>
  );
}

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

function AuthPanel({ authCapabilities, signedIn }) {
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

  if (signedIn) {
    return (
      <div className="intro-auth">
        <div className="intro-auth__copy">
          <h2 className="intro-auth__title">Your workspace is ready.</h2>
          <p className="terminal-copy">Press play where you left off.</p>
        </div>
        <div className="terminal-actions">
          <Link href="/workspace" className="terminal-link is-primary">
            Open workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="intro-auth">
      <div className="intro-auth__copy">
        <span className="terminal-kicker">Get Started</span>
        <h2 className="intro-auth__title">Sign in to start listening.</h2>
      </div>

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
        <label className="terminal-label" htmlFor="landing-email">
          Email magic link
        </label>
        <input
          id="landing-email"
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
  );
}

export default function IntroLanding({
  authCapabilities,
  signedIn = false,
  forceIntro = false,
}) {
  const router = useRouter();
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

  function handleEnter() {
    markIntroSeen();

    if (signedIn) {
      router.push("/workspace?mode=listen");
    }
  }

  if (stage === "loading") {
    return <main className="intro-page" />;
  }

  if (stage === "auth") {
    return (
      <main className="intro-page">
        <section className="intro-auth-shell">
          <AuthPanel authCapabilities={authCapabilities} signedIn={signedIn} />
        </section>
      </main>
    );
  }

  return (
    <main className="intro-page">
      <section className="intro-shell">
        <div className="intro-copy">
          <span className="terminal-kicker">Assembled Reality</span>
          <h1 className="intro-copy__title">Listen to any document. Keep what matters.</h1>
          <p className="intro-copy__body">
            Drop a PDF, press play, and build something from the parts that land.
          </p>
        </div>

        <div className="intro-stage">
          <ListenVisual />
        </div>

        {signedIn ? (
          <div className="intro-actions">
            <span />
            <button
              type="button"
              className="intro-actions__button is-primary"
              onClick={handleEnter}
            >
              Open workspace
            </button>
          </div>
        ) : (
          <div className="intro-auth-inline">
            <AuthPanel authCapabilities={authCapabilities} signedIn={false} />
          </div>
        )}
      </section>
    </main>
  );
}
