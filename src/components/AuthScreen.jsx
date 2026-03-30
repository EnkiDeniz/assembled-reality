"use client";

import { useState } from "react";

export default function AuthScreen({ documentTitle, foundingReaders, onSignIn }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    accessCode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await onSignIn(form);

    if (!result?.ok) {
      setError("We could not place you yet.");
      setSubmitting(false);
      return;
    }

    window.location.reload();
  };

  return (
    <main className="lock-screen auth-screen">
      <div className="lock-screen__frame auth-screen__frame">
        <div className="lock-screen__header">
          <p className="lock-screen__eyebrow">Private reading instrument</p>
          <h1 className="lock-screen__title">{documentTitle}</h1>
          <p className="lock-screen__lede">
            Sign in with your reader identity to enter the document.
          </p>
        </div>

        <form className="auth-screen__form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="reader-name">
            Reader name
          </label>
          <input
            id="reader-name"
            className="auth-screen__input"
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />

          <label className="sr-only" htmlFor="reader-email">
            Reader email
          </label>
          <input
            id="reader-email"
            className="auth-screen__input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />

          <label className="sr-only" htmlFor="reader-code">
            Access code
          </label>
          <div className={`lock-screen__field ${error ? "is-wrong" : ""}`}>
            <input
              id="reader-code"
              className="lock-screen__input"
              type="password"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Access code"
              value={form.accessCode}
              onChange={(event) => setForm((current) => ({ ...current, accessCode: event.target.value }))}
              required
            />
            <button type="submit" className="lock-screen__submit" disabled={submitting}>
              {submitting ? "Entering" : "Enter"}
            </button>
          </div>
          <div className="lock-screen__status">{error ? error : "\u00A0"}</div>
        </form>

        <div className="lock-screen__divider" />

        <div className="auth-screen__directory">
          <p className="auth-screen__directory-label">Founding readers</p>
          <div className="auth-screen__directory-list">
            {foundingReaders.map((reader) => (
              <span key={reader} className="auth-screen__directory-chip">
                {reader}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
