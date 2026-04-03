"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const INTRO_STORAGE_KEY = "document-assembler:intro-complete-v1";
const INTRO_STORAGE_EVENT = "document-assembler:intro-storage";

const STEPS = [
  {
    id: "source",
    headline: "Start with a source.",
    body: "Import PDF, Word, markdown, or plain text. The workspace turns it into blocks you can inspect, move, and reuse.",
  },
  {
    id: "inspect",
    headline: "Inspect it block by block.",
    body: "Read it, play it, and pull the parts that matter into the clipboard without losing where they came from.",
  },
  {
    id: "assemble",
    headline: "Assemble something usable.",
    body: "Order the blocks, edit where needed, and turn the selection into a new assembly with visible lineage.",
  },
  {
    id: "receipt",
    headline: "Keep the receipt.",
    body: "Draft or export the log so the source, selections, edits, and assembly stay attached to the outcome.",
  },
];

function PiecesVisual() {
  const pieces = [
    { kind: "heading", text: "Project plan" },
    { kind: "paragraph", text: "The goal is to ship before the quarter closes." },
    { kind: "paragraph", text: "Each team owns one deliverable and reports weekly." },
    { kind: "quote", text: "Move fast but leave receipts." },
  ];

  return (
    <div className="intro-visual intro-visual--blocks" aria-hidden="true">
      {pieces.map((piece) => (
        <div key={piece.text} className={`intro-mini-block is-${piece.kind}`}>
          <div className="intro-mini-block__stripe" />
          <div className="intro-mini-block__body">
            <span className="intro-mini-block__label">{piece.kind}</span>
            <span className="intro-mini-block__text">{piece.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

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

function BuildVisual() {
  const rows = [
    "[Source] Ship before the quarter closes",
    "[Notes] Each team owns one deliverable",
    "[AI] Summary of both",
  ];

  return (
    <div className="intro-visual intro-visual--build" aria-hidden="true">
      <div className="intro-build__stack">
        {rows.map((row, index) => (
          <div key={row} className="intro-build__row">
            <span className="intro-build__index">{index + 1}</span>
            <span className="intro-build__text">{row}</span>
          </div>
        ))}
      </div>
      <div className="intro-build__result">Assemble → New document on shelf</div>
    </div>
  );
}

function LoopVisual() {
  const chain = ["SOURCE", "BLOCKS", "ASSEMBLY", "RECEIPT"];

  return (
    <div className="intro-visual intro-visual--loop" aria-hidden="true">
      <div className="intro-loop__chain">
        {chain.map((item, index) => (
          <div key={item} className="intro-loop__item">
            <span>{item}</span>
            {index < chain.length - 1 ? <span className="intro-loop__arrow">→</span> : null}
          </div>
        ))}
      </div>
      <span className="intro-loop__return">proof stays with the result</span>
    </div>
  );
}

function IntroVisual({ stepId }) {
  if (stepId === "source") return <PiecesVisual />;
  if (stepId === "inspect") return <ListenVisual />;
  if (stepId === "assemble") return <BuildVisual />;
  return <LoopVisual />;
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
        callbackUrl: "/workspace",
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
          <span className="terminal-kicker">Intro Replay</span>
          <h2 className="intro-auth__title">Your workspace is ready.</h2>
          <p className="terminal-copy">Open it when you’re ready to inspect a source, build an assembly, or draft a receipt.</p>
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
        <h2 className="intro-auth__title">Start with a source.</h2>
        <p className="terminal-copy">
          Sign in once and head straight to the workspace to import, inspect, assemble, and keep the receipt.
        </p>
      </div>

      <div className="terminal-actions">
        <button
          type="button"
          className="terminal-button is-primary"
          disabled={!authCapabilities.appleEnabled}
          onClick={() => signIn("apple", { callbackUrl: "/workspace" })}
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
  const [step, setStep] = useState(0);
  const seenIntro = useSyncExternalStore(
    subscribeToIntroState,
    getIntroSeenSnapshot,
    getIntroSeenServerSnapshot,
  );
  const stage =
    forceIntro || signedIn ? "intro" : seenIntro === null ? "loading" : seenIntro ? "auth" : "intro";

  function markIntroSeen() {
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, "1");
      window.dispatchEvent(new Event(INTRO_STORAGE_EVENT));
    } catch {
      // Ignore storage failures and continue into the workspace flow.
    }
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((value) => value + 1);
      return;
    }

    markIntroSeen();

    if (signedIn) {
      router.push("/workspace");
      return;
    }
  }

  function handleSkip() {
    markIntroSeen();

    if (signedIn) {
      router.push("/workspace");
      return;
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
          {!forceIntro ? (
            <Link href="/intro" className="intro-auth-shell__replay">
              View intro again
            </Link>
          ) : null}
        </section>
      </main>
    );
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <main className="intro-page">
      <section className="intro-shell">
        <div className="intro-progress" aria-hidden="true">
          {STEPS.map((entry, index) => (
            <span
              key={entry.id}
              className={`intro-progress__dot ${
                index === step ? "is-active" : index < step ? "is-complete" : ""
              }`}
            />
          ))}
        </div>

        <div className="intro-copy">
          <span className="terminal-kicker">Document Assembler</span>
          <h1 className="intro-copy__title">{current.headline}</h1>
          <p className="intro-copy__body">{current.body}</p>
        </div>

        <div className="intro-stage">
          <IntroVisual stepId={current.id} />
        </div>

        <div className="intro-actions">
          {step > 0 ? (
            <button
              type="button"
              className="intro-actions__button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
            >
              Back
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            className={`intro-actions__button ${isLast ? "is-primary" : ""}`}
            onClick={handleNext}
          >
            {isLast ? (signedIn ? "Open workspace" : "Start assembling") : "Next"}
          </button>
        </div>

        {!isLast ? (
          <button type="button" className="intro-skip" onClick={handleSkip}>
            skip intro
          </button>
        ) : null}
      </section>
    </main>
  );
}
