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
  ACTION_LINE,
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

const PRODUCT_STACK = [
  {
    title: "Lœgos",
    body: "The language that structures the exchange.",
  },
  {
    title: "Box",
    body: "The IDE and runtime where authored work lives.",
  },
  {
    title: "Seven",
    body: "The inference agent that parses, flags, and preflights.",
  },
  {
    title: "Receipt",
    body: "The compiled artifact that carries what survived.",
  },
];

const SHAPE_ROOMS = [
  {
    title: "△ Aim",
    body: "Declare what matters. Name the direction. Sharpen the claim.",
    detail: "declare · name · sharpen",
  },
  {
    title: "□ Reality",
    body: "Capture what the world gives back and what can be pointed at.",
    detail: "capture · listen · inspect",
  },
  {
    title: "œ Weld",
    body: "Stage the comparison, rewrite the object, and test convergence.",
    detail: "stage · rewrite · operate",
  },
  {
    title: "𒐛 Seal",
    body: "Commit what survived and let the receipt travel as proof.",
    detail: "review · seal · share",
  },
];

const HERO_SEQUENCE = [
  "Declare an aim.",
  "Capture what reality returns.",
  "Let Seven infer.",
  "Seal what survived.",
];

function EntrySystemPanel() {
  return (
    <div className="loegos-entry__panel">
      <div className="loegos-entry__panel-copy">
        <span className="loegos-kicker">How it works</span>
        <h2 className="loegos-entry__panel-title">Write the block. Let the box check it.</h2>
        <p className="loegos-entry__panel-body">
          Lœgos gives the exchange a grammar. Seven infers what is missing or mislabeled. Box
          keeps the runtime state. Seal commits the receipt when the work is ready to travel.
        </p>
      </div>

      <div className="loegos-entry__stack">
        {PRODUCT_STACK.map((item) => (
          <div key={item.title} className="loegos-entry__stack-item">
            <span className="loegos-entry__stack-title">{item.title}</span>
            <span className="loegos-entry__stack-body">{item.body}</span>
          </div>
        ))}
      </div>

      <div className="loegos-entry__rooms">
        {SHAPE_ROOMS.map((room) => (
          <div key={room.title} className="loegos-entry__room">
            <span className="loegos-entry__room-title">{room.title}</span>
            <span className="loegos-entry__room-copy">{room.body}</span>
            <span className="loegos-entry__room-detail">{room.detail}</span>
          </div>
        ))}
      </div>

      <div className="loegos-entry__system-row">
        <div className="loegos-entry__system-card">
          <span className="loegos-entry__room-title">Build state</span>
          <SettlementHex stageCount={4} label="4 / 7" />
          <SevenGradient level={4} label="Resolution process" />
        </div>
        <div className="loegos-entry__system-card">
          <span className="loegos-entry__room-title">Runtime signals</span>
          <div className="loegos-entry__signal-row">
            <SignalChip tone="clear">Verified</SignalChip>
            <SignalChip tone="active">Partial</SignalChip>
            <SignalChip tone="neutral">Unknown</SignalChip>
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

      <p className="intro-auth__note">
        Read the <Link href="/disclaimer" className="terminal-link">disclaimer</Link> before you
        open the box.
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
  const authTitle = returning ? "Resume the current runtime." : "Open the runtime.";
  const authBody = returning
    ? "Signed-in readers re-enter the active box and continue from the room that already has live work."
    : "Identity is the threshold, not the product. The work begins once you are inside the box with sources, blocks, diagnostics, and receipts.";

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
            <p className="loegos-entry__lede">{ACTION_LINE}</p>
            <div className="loegos-entry__support">
              <p className="loegos-entry__lede loegos-entry__lede--support">
                Declare what you intend. Capture what reality gives back. Let Seven infer what is
                missing or misread. Seal what survived as a receipt.
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
                <span>Desktop: write, infer, interpret, seal.</span>
                <span>Mobile: capture, listen, append reality.</span>
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
