"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { signIn } from "next-auth/react";
import {
  SevenGradient,
  SettlementHex,
  ShapeNav,
  SignalChip,
  buildStaticShapeNav,
} from "@/components/LoegosSystem";
import PublicFooterLinks from "@/components/PublicFooterLinks";
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
  return false;
}

function ProposalPeekLink() {
  return (
    <Link href="/design-proposal" className="intro-proposal-link">
      Proposal
    </Link>
  );
}

function EntrySystemPanel() {
  return (
    <div className="loegos-entry__panel">
      <div className="loegos-entry__panel-copy">
        <span className="loegos-kicker">System thesis</span>
        <h2 className="loegos-entry__panel-title">Navigate by shape. Act by verb.</h2>
        <p className="loegos-entry__panel-body">
          Four rooms keep orientation stable. Each room exposes a different toolset for the same
          object as it moves from direction, to evidence, to assembly, to proof.
        </p>
      </div>

      <ShapeNav items={buildStaticShapeNav("aim")} activeShape="aim" compact />

      <div className="loegos-entry__rooms">
        <div className="loegos-entry__room">
          <span className="loegos-entry__room-title">Settlement</span>
          <SettlementHex stageCount={4} label="4 / 7" />
          <SevenGradient level={4} label="Resolution process" />
        </div>
        <div className="loegos-entry__room">
          <span className="loegos-entry__room-title">Signals</span>
          <SignalChip tone="clear">Verified</SignalChip>
          <SignalChip tone="active">Partial</SignalChip>
          <SignalChip tone="neutral">Unknown</SignalChip>
        </div>
        <div className="loegos-entry__room">
          <span className="loegos-entry__room-title">Desktop posture</span>
          <span className="loegos-entry__room-copy">
            Quiet navigation. Dominant canvas. One right sidecar. Proof kept distinct from the
            workbench.
          </span>
        </div>
        <div className="loegos-entry__room">
          <span className="loegos-entry__room-title">Mobile posture</span>
          <span className="loegos-entry__room-copy">
            Capture first. Listen on the move. Re-enter the current box in Reality, not in a
            shrunk desktop shell.
          </span>
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
      <main className="loegos-entry">
        <section className="loegos-entry__shell">
          <div className="loegos-entry__masthead">
            <div className="loegos-entry__brandline">
              <span className="loegos-wordmark">
                {PRODUCT_MARK} <span className="loegos-wordmark__sub">entry system</span>
              </span>
              <span className="loegos-thesis">Navigate by shape. Act by verb.</span>
            </div>
          </div>

          <div className="loegos-entry__hero">
            <div className="loegos-entry__copy">
              <span className="loegos-kicker">Brand anchor</span>
              <h1 className="loegos-display">{BRAND_TRUTH}</h1>
              <p className="loegos-entry__lede">{ACTION_LINE}</p>
              <div className="loegos-entry__support">
                <SignalChip tone="clear">Desktop assembly</SignalChip>
                <SignalChip tone="neutral">Mobile capture</SignalChip>
                <SignalChip tone="active">Proof preserved</SignalChip>
              </div>
            </div>

            <div className="loegos-entry__panel">
              <div className="loegos-entry__panel-copy">
                <span className="loegos-kicker">Enter the box</span>
                <h2 className="loegos-entry__panel-title">Return to the current box.</h2>
                <p className="loegos-entry__panel-body">
                  Signed-out readers enter through identity. Signed-in readers re-enter the last
                  active box and continue assembling from the right room.
                </p>
              </div>
              <div className="intro-auth-inline intro-auth-inline--stacked">
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

  return (
    <main className="loegos-entry">
      <section className="loegos-entry__shell">
        <div className="loegos-entry__masthead">
          <div className="loegos-entry__brandline">
            <span className="loegos-wordmark">
              {PRODUCT_MARK} <span className="loegos-wordmark__sub">assembled reality</span>
            </span>
            <span className="loegos-thesis">Navigate by shape. Act by verb.</span>
          </div>
        </div>

        <div className="loegos-entry__hero">
          <div className="loegos-entry__copy">
            <span className="loegos-kicker">Assemble reality</span>
            <h1 className="loegos-display">{BRAND_TRUTH}</h1>
            <p className="loegos-entry__lede">{ACTION_LINE}</p>
            <div className="loegos-entry__support">
              <p className="loegos-entry__lede">
                The box is the noun. The verbs are the tools inside it. Capture from life on the
                phone, then return on desktop to stage, rewrite, operate, and seal the proof.
              </p>
            </div>
          </div>

          <div className="loegos-entry__panel">
            <div className="loegos-entry__panel-copy">
              <span className="loegos-kicker">Enter</span>
              <h2 className="loegos-entry__panel-title">Open the assembler.</h2>
              <p className="loegos-entry__panel-body">
                Identity is lightweight. The important thing is what box you return to and what
                move becomes clear once you are inside.
              </p>
            </div>
            <div className="intro-auth-inline">
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
