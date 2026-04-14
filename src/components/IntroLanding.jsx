"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import PublicFooterLinks from "@/components/PublicFooterLinks";
import { PRODUCT_MARK } from "@/lib/product-language";
import { recordProductEvent } from "@/lib/product-analytics";

function resolveAuthErrorMessage(error = "", { allowlistEnabled = false } = {}) {
  if (!error) return "";
  if (error === "AccessDenied") {
    return allowlistEnabled
      ? "This email is not approved for the private beta."
      : "Access to the beta is currently restricted.";
  }
  if (error === "Verification") {
    return "The sign-in link could not be verified. Try again from the same browser.";
  }
  return error;
}

function AuthPanel({ authCapabilities, signedIn, betaAccess, authError }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [betaCode, setBetaCode] = useState("");
  const [showBetaCode, setShowBetaCode] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const authErrorMessage = resolveAuthErrorMessage(authError, betaAccess);

  async function handleUnlock(event) {
    event.preventDefault();
    setUnlocking(true);
    setUnlockError("");

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: betaCode }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not unlock the beta.");
      }

      window.location.reload();
    } catch (thrownError) {
      setUnlockError(
        thrownError instanceof Error ? thrownError.message : "Could not unlock the beta.",
      );
    } finally {
      setUnlocking(false);
    }
  }

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
        throw new Error(resolveAuthErrorMessage(result.error, betaAccess) || result.error);
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

  if (betaAccess?.passwordRequired && !betaAccess?.unlocked) {
    return (
      <div className="intro-auth">
        <form className="terminal-upload" onSubmit={handleUnlock}>
          <label className="terminal-label" htmlFor="beta-password">
            Private beta password
          </label>
          <div className="intro-auth__password-row">
            <input
              id="beta-password"
              className="terminal-input"
              type={showBetaCode ? "text" : "password"}
              name="beta-password"
              autoComplete="current-password"
              placeholder="Enter beta password"
              value={betaCode}
              disabled={unlocking}
              onChange={(event) => setBetaCode(event.target.value)}
            />
            <button
              type="button"
              className="intro-auth__visibility-toggle"
              aria-label={showBetaCode ? "Hide password" : "Show password"}
              aria-pressed={showBetaCode}
              disabled={unlocking}
              onClick={() => setShowBetaCode((current) => !current)}
            >
              {showBetaCode ? "Hide" : "Show"}
            </button>
          </div>
          <div className="terminal-actions">
            <button
              type="submit"
              className="terminal-button is-primary"
              disabled={!betaCode.trim() || unlocking}
            >
              {unlocking ? "Unlocking…" : "Unlock private beta"}
            </button>
          </div>
          {unlockError ? (
            <p className="terminal-status is-error" aria-live="polite">
              {unlockError}
            </p>
          ) : null}
          {authErrorMessage ? (
            <p className="terminal-status is-error" aria-live="polite">
              {authErrorMessage}
            </p>
          ) : null}
        </form>
      </div>
    );
  }

  if (signedIn) {
    return (
      <div className="intro-auth">
        <div className="terminal-actions">
          <Link
            href="/workspace"
            className="terminal-link is-primary"
          >
            Enter {PRODUCT_MARK}
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
            void signIn("apple", { callbackUrl: "/workspace" });
          }}
        >
          Sign in with Apple
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
        Read the <Link href="/disclaimer" className="intro-auth__note-link">disclaimer</Link> before entering.
      </p>
      {betaAccess?.allowlistEnabled ? (
        <p className="intro-auth__note">Only approved private beta emails can enter.</p>
      ) : null}
      {authErrorMessage ? (
        <p className="terminal-status is-error" aria-live="polite">
          {authErrorMessage}
        </p>
      ) : null}
    </div>
  );
}

export default function IntroLanding({
  authCapabilities,
  authError = "",
  betaAccess = null,
  signedIn = false,
}) {
  const isPrivateBeta = Boolean(betaAccess?.passwordRequired || betaAccess?.allowlistEnabled);
  const heroKicker = isPrivateBeta ? "Private beta" : "Sign in";
  const heroTitle = isPrivateBeta ? `${PRODUCT_MARK} is in private beta.` : `Enter ${PRODUCT_MARK}.`;
  const heroBody = isPrivateBeta
    ? ""
    : "Continue with Apple or a magic link to enter the workspace.";
  const panelKicker = signedIn
    ? "Ready"
    : betaAccess?.passwordRequired && !betaAccess?.unlocked
      ? "Enter"
      : "Sign in";
  const panelTitle = signedIn
    ? `Enter ${PRODUCT_MARK}`
    : betaAccess?.passwordRequired && !betaAccess?.unlocked
      ? "Unlock private beta"
      : `Sign in to ${PRODUCT_MARK}`;
  const panelBody = signedIn
    ? "Your beta session is ready."
    : betaAccess?.passwordRequired && !betaAccess?.unlocked
      ? "Use the shared password to continue."
      : isPrivateBeta
        ? "Use Apple or a magic link."
        : "Use Apple or a magic link.";

  return (
    <main className="loegos-entry loegos-entry--beta-gate">
      <section className="loegos-entry__shell">
        <div className="loegos-entry__masthead">
          <div className="loegos-entry__brandline">
            <span className="loegos-wordmark">
              {PRODUCT_MARK} <span className="loegos-wordmark__sub">{isPrivateBeta ? "private beta" : "sign in"}</span>
            </span>
            <span className="loegos-thesis">{isPrivateBeta ? "Invited access only" : "Apple and email sign-in"}</span>
          </div>
        </div>

        <div className="loegos-entry__hero loegos-entry__hero--gate">
          <div className="loegos-entry__copy loegos-entry__copy--gate">
            <span className="loegos-kicker">{heroKicker}</span>
            <h1 className="loegos-display">{heroTitle}</h1>
            {heroBody ? <p className="loegos-entry__lede">{heroBody}</p> : null}
          </div>

          <div className="loegos-entry__panel loegos-entry__panel--gate">
            <div className="loegos-entry__panel-copy">
              <span className="loegos-kicker">{panelKicker}</span>
              <h2 className="loegos-entry__panel-title">{panelTitle}</h2>
              <p className="loegos-entry__panel-body">{panelBody}</p>
            </div>
            <div className="intro-auth-inline">
              <AuthPanel
                authCapabilities={authCapabilities}
                authError={authError}
                betaAccess={betaAccess}
                signedIn={signedIn}
              />
            </div>
          </div>
        </div>

        <div className="loegos-entry__footer loegos-entry__footer--gate">
          <PublicFooterLinks className="intro-auth-inline__footer" />
        </div>
      </section>
    </main>
  );
}
