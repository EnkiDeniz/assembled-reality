"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { signIn } from "next-auth/react";
import {
  SevenGradient,
  SettlementHex,
  SignalChip,
} from "@/components/LoegosSystem";
import PublicFooterLinks from "@/components/PublicFooterLinks";
import {
  BOUNDARY_LINE,
  BRAND_TRUTH,
  PRODUCT_MARK,
} from "@/lib/product-language";
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
  return false;
}

function ProposalPeekLink() {
  return (
    <Link href="/design-proposal" className="intro-proposal-link">
      Proposal
    </Link>
  );
}

const PRODUCT_LAW =
  "Only returned evidence clears fog; mapped regions can become stale without renewed echoes.";

const INSTRUMENT_PANES = [
  {
    title: "Ping",
    body: "State the aim and send a move/test pair into reality.",
    detail: "mov + tst",
  },
  {
    title: "Listen",
    body: "Hold awaiting as active listening, not missing progress.",
    detail: "awaiting",
  },
  {
    title: "Echoes",
    body: "Read returns by provenance so wall and imagination stay separate.",
    detail: "rtn + provenance",
  },
  {
    title: "Field",
    body: "See mapped, fog, fractured, and stale regions in one surface.",
    detail: "state + freshness",
  },
];

const HERO_SEQUENCE = ["Send a ping.", "Wait in listening mode.", "Receive echoes.", "Navigate the field."];

const FOUR_QUESTIONS = [
  "Did I ping?",
  "Am I waiting?",
  "What came back, from where?",
  "How clear is this region?",
];

function EntrySystemPanel() {
  return (
    <div className="loegos-entry__panel">
      <div className="loegos-entry__panel-copy">
        <span className="loegos-kicker">Product law</span>
        <h2 className="loegos-entry__panel-title">The Echo Instrument</h2>
        <p className="loegos-entry__panel-body">
          Lœgos gives you one navigable field compiled from returns. It is not a document manager.
          It is an instrument for decision structure.
        </p>
        <p className="loegos-entry__panel-body">{PRODUCT_LAW}</p>
      </div>

      <div className="loegos-entry__rooms">
        {INSTRUMENT_PANES.map((room) => (
          <div key={room.title} className="loegos-entry__room">
            <span className="loegos-entry__room-title">{room.title}</span>
            <span className="loegos-entry__room-copy">{room.body}</span>
            <span className="loegos-entry__room-detail">{room.detail}</span>
          </div>
        ))}
      </div>

      <div className="loegos-entry__system-row">
        <div className="loegos-entry__system-card">
          <span className="loegos-entry__room-title">Runtime state</span>
          <SettlementHex stageCount={4} label="4 / 7" />
          <SevenGradient level={4} label="Field resolution" />
        </div>
        <div className="loegos-entry__system-card">
          <span className="loegos-entry__room-title">One glance checks</span>
          <div className="loegos-entry__signal-row">
            {FOUR_QUESTIONS.map((question) => (
              <SignalChip key={question} tone="neutral">
                {question}
              </SignalChip>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
        callbackUrl: "/workspace",
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
            href="/workspace"
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
            void signIn("apple", { callbackUrl: "/workspace" });
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

      <p className="intro-auth__note">
        Read the <Link href="/disclaimer" className="intro-auth__note-link">disclaimer</Link> before opening the box.
      </p>
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
  const returning = stage === "auth";
  const authKicker = returning ? "Return to the box" : "Enter the box";
  const authTitle = returning ? "Resume the field." : "Open the field.";
  const authBody = returning
    ? "Sign in to reopen the active box and continue from the latest signal."
    : "Sign in to start pinging, listening, and reading returns.";

  return (
    <main className="loegos-entry">
      <section className="loegos-entry__shell">
        <div className="loegos-entry__masthead">
          <div className="loegos-entry__brandline">
            <span className="loegos-wordmark">
              {PRODUCT_MARK} <span className="loegos-wordmark__sub">language tool</span>
            </span>
            <span className="loegos-thesis">An IDE for reality.</span>
          </div>
        </div>

        <div className="loegos-entry__hero">
          <div className="loegos-entry__copy">
            <span className="loegos-kicker">Category</span>
            <h1 className="loegos-display">{BRAND_TRUTH}</h1>
            <p className="loegos-entry__lede">
              Lœgos is an echo instrument for decisions. Send pings into reality, listen for what
              returns, and navigate only returned signal.
            </p>
            <div className="loegos-entry__support">
              <p className="loegos-entry__lede loegos-entry__lede--support">
                The field stays honest: mapped where returns are strong, fog where they are not,
                fractured where contradictions land, stale where surfaces need renewed echoes.
              </p>
              <div className="loegos-entry__boundary">
                {BOUNDARY_LINE.split(". ")
                  .filter(Boolean)
                  .map((item) => (
                    <span key={item} className="loegos-entry__boundary-item">
                      {item.replace(/\.$/, "")}
                    </span>
                  ))}
              </div>
              <div className="loegos-entry__sequence">
                {HERO_SEQUENCE.map((item) => (
                  <span key={item} className="loegos-entry__sequence-step">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="loegos-entry__panel">
            <div className="loegos-entry__panel-copy">
              <span className="loegos-kicker">{authKicker}</span>
              <h2 className="loegos-entry__panel-title">{authTitle}</h2>
              <p className="loegos-entry__panel-body">{authBody}</p>
              <div className="loegos-entry__auth-notes">
                <span>Inside the box: Ping. Listen. Echoes. Field.</span>
                <span>Seven reads signal. Returns stay attributed.</span>
              </div>
            </div>
            <div className={`intro-auth-inline ${returning ? "intro-auth-inline--stacked" : ""}`}>
              <AuthPanel
                authCapabilities={authCapabilities}
                signedIn={signedIn}
                onEnter={markIntroSeen}
              />
            </div>
          </div>
        </div>

        <EntrySystemPanel />

        <div className="loegos-entry__footer">
          <PublicFooterLinks className="intro-auth-inline__footer" />
          <ProposalPeekLink />
        </div>
      </section>
    </main>
  );
}
