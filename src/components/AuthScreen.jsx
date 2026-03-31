"use client";

import { useState } from "react";

function AppleIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="auth-screen__provider-icon">
      <path
        fill="currentColor"
        d="M13.89 2.03c0 1-.4 1.95-1.02 2.63-.67.72-1.77 1.27-2.78 1.2a3.24 3.24 0 0 1 1.05-2.44c.7-.77 1.87-1.32 2.75-1.39v.01Zm2.8 10.92c-.42.96-.92 1.84-1.62 2.78-.94 1.26-1.7 2.13-2.69 2.14-.88.01-1.11-.57-2.31-.56-1.19.01-1.45.57-2.33.56-.99-.01-1.7-.78-2.64-2.04-2.63-3.51-2.91-7.63-1.29-10.12 1.15-1.77 2.95-2.81 4.64-2.81.91 0 1.77.61 2.39.61.61 0 1.76-.75 2.97-.64.52.02 1.98.21 2.92 1.57-.08.05-1.74 1.02-1.72 3.03.02 2.4 2.09 3.21 2.11 3.22-.02.06-.33 1.1-1.43 2.26Z"
      />
    </svg>
  );
}

export default function AuthScreen({
  documentTitle,
  onAppleSignIn,
  onMagicLinkSignIn,
  authCapabilities,
}) {
  const [emailOnly, setEmailOnly] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const handleMagicLink = async (event) => {
    event.preventDefault();
    if (!emailOnly.trim()) return;

    setEmailSubmitting(true);
    setError("");
    setEmailMessage("");

    const result = await onMagicLinkSignIn(emailOnly.trim());

    if (!result?.ok) {
      setError("We could not send the entry link.");
      setEmailSubmitting(false);
      return;
    }

    setEmailMessage("Check your inbox for the sign-in link.");
    setEmailSubmitting(false);
  };

  return (
    <main className="lock-screen auth-screen">
      <div className="lock-screen__frame auth-screen__frame">
        <div className="lock-screen__header">
          <p className="lock-screen__eyebrow">Private reading instrument</p>
          <h1 className="lock-screen__title">{documentTitle}</h1>
          <p className="lock-screen__lede">
            Sign in to continue.
          </p>
        </div>

        {authCapabilities?.appleEnabled ? (
          <button
            type="button"
            className="auth-screen__provider-button"
            onClick={() => onAppleSignIn()}
          >
            <AppleIcon />
            <span>Continue with Apple</span>
          </button>
        ) : null}

        {authCapabilities?.magicLinksEnabled ? (
          <form className="auth-screen__magic-link" onSubmit={handleMagicLink}>
            <label className="sr-only" htmlFor="reader-email-link">
              Email for magic link
            </label>
            <div className="lock-screen__field">
              <input
                id="reader-email-link"
                className="lock-screen__input"
                type="email"
                placeholder="Email for magic link"
                value={emailOnly}
                onChange={(event) => setEmailOnly(event.target.value)}
                required
              />
              <button type="submit" className="lock-screen__submit" disabled={emailSubmitting}>
                {emailSubmitting ? "Sending" : "Send link"}
              </button>
            </div>
            <div className="lock-screen__status">{emailMessage || "\u00A0"}</div>
          </form>
        ) : null}

        {authCapabilities?.appleEnabled || authCapabilities?.magicLinksEnabled ? (
          <div className="lock-screen__divider" />
        ) : null}

        {!authCapabilities?.appleEnabled && !authCapabilities?.magicLinksEnabled ? (
          <div className="lock-screen__status">Sign-in is not available right now.</div>
        ) : null}

        {error ? <div className="lock-screen__status">{error}</div> : null}
      </div>
    </main>
  );
}
