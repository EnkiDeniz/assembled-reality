"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const INTRO_STORAGE_KEY = "document-assembler:intro-complete-v1";

const STEPS = [
  {
    id: "mess",
    headline: "You've got stuff everywhere.",
    body: "Notes, PDFs, drafts, voice memos, screenshots. The problem is not having material. The problem is that none of it lines up when it is time to build.",
  },
  {
    id: "pieces",
    headline: "We turn documents into pieces.",
    body: "Drop in a file and it becomes blocks: headings, paragraphs, quotes, lists. Small enough to inspect. Small enough to move.",
  },
  {
    id: "listen",
    headline: "Listen instead of reading.",
    body: "Press play and the document performs itself. The line you hear lights up. The next one waits. You can keep moving and still stay inside the text.",
  },
  {
    id: "pick",
    headline: "Keep the parts that matter.",
    body: "Tap plus. A block goes into your pocket. Do that across one source or five. You are not collecting files anymore. You are collecting usable parts.",
  },
  {
    id: "build",
    headline: "Assemble something new.",
    body: "Order the blocks, add AI when it helps, edit what needs to change, and create a new document with visible lineage.",
  },
  {
    id: "learn",
    headline: "Live it. Then come back.",
    body: "The document is not the finish line. It is the setup. Do the work, return with what happened, and keep the gap between plan and outcome visible.",
  },
  {
    id: "loop",
    headline: "Plan it. Live it. Learn from it.",
    body: "That is the whole loop.",
  },
];

function MessVisual() {
  const items = [
    "meeting-notes-march.pdf",
    "voice memo 2:34am",
    "research-plan-v3.docx",
    "quote from Tuesday",
    "slack screenshot",
  ];

  return (
    <div className="intro-visual intro-visual--mess" aria-hidden="true">
      {items.map((item) => (
        <span key={item} className="intro-visual__scrap">
          {item}
        </span>
      ))}
    </div>
  );
}

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

function PickVisual() {
  const blocks = [
    { text: "Ship before the quarter closes.", active: false },
    { text: "Each team owns one deliverable.", active: true },
    { text: "Move fast but leave receipts.", active: true },
    { text: "Reports are due every Friday.", active: false },
  ];

  return (
    <div className="intro-visual intro-visual--pick" aria-hidden="true">
      {blocks.map((block) => (
        <div key={block.text} className="intro-pick__row">
          <span className={`intro-pick__toggle ${block.active ? "is-active" : ""}`}>
            {block.active ? "−" : "+"}
          </span>
          <span className={`intro-pick__text ${block.active ? "is-active" : ""}`}>{block.text}</span>
        </div>
      ))}

      <div className="intro-pick__pocket">Pocket · 2 pieces saved</div>
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

function LearnVisual() {
  const moments = [
    "You take the plan into the meeting.",
    "Something lands. Something slips.",
    "You return with what actually happened.",
    "The gap becomes usable evidence.",
  ];

  return (
    <div className="intro-visual intro-visual--learn" aria-hidden="true">
      {moments.map((moment) => (
        <div key={moment} className="intro-learn__row">
          <span className="intro-learn__dot" />
          <span>{moment}</span>
        </div>
      ))}
    </div>
  );
}

function LoopVisual() {
  const chain = ["UPLOAD", "LISTEN", "PICK", "BUILD", "LIVE", "LEARN"];

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
      <span className="intro-loop__return">then do it again</span>
    </div>
  );
}

function IntroVisual({ stepId }) {
  if (stepId === "mess") return <MessVisual />;
  if (stepId === "pieces") return <PiecesVisual />;
  if (stepId === "listen") return <ListenVisual />;
  if (stepId === "pick") return <PickVisual />;
  if (stepId === "build") return <BuildVisual />;
  if (stepId === "learn") return <LearnVisual />;
  return <LoopVisual />;
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
          <h2 className="intro-auth__title">You already know the loop.</h2>
          <p className="terminal-copy">Go back to the workspace when you’re ready.</p>
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
        <h2 className="intro-auth__title">Start assembling.</h2>
        <p className="terminal-copy">
          Sign in once and the next stop is your workspace.
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
  const [stage, setStage] = useState(forceIntro ? "intro" : "loading");

  useEffect(() => {
    if (forceIntro || signedIn) {
      setStage("intro");
      return;
    }

    try {
      const seenIntro = window.localStorage.getItem(INTRO_STORAGE_KEY) === "1";
      setStage(seenIntro ? "auth" : "intro");
    } catch {
      setStage("intro");
    }
  }, [forceIntro, signedIn]);

  function markIntroSeen() {
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {}
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

    setStage("auth");
  }

  function handleSkip() {
    markIntroSeen();

    if (signedIn) {
      router.push("/workspace");
      return;
    }

    setStage("auth");
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
