"use client";

import { useState } from "react";

export default function AccountProfileForm({
  displayName = "",
  readerSlug = "",
  email = "",
}) {
  const [name, setName] = useState(displayName);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = String(name || "").trim();
    if (!trimmedName) {
      setTone("error");
      setMessage("Display name is required.");
      return;
    }

    setPending(true);
    setTone("");
    setMessage("Saving...");

    try {
      const response = await fetch("/api/reader/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: trimmedName,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.profile) {
        throw new Error(payload?.error || "Could not update your profile.");
      }

      setName(payload.profile.displayName || trimmedName);
      setTone("success");
      setMessage("Saved.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Could not update your profile.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="account-profile-form" onSubmit={handleSubmit}>
      <label className="account-profile-form__field">
        <span className="terminal-label">Display name</span>
        <input
          className="terminal-input"
          type="text"
          name="displayName"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={pending}
        />
      </label>

      <dl className="account-card__list">
        <div className="account-card__row">
          <dt>Handle</dt>
          <dd>{readerSlug || "Not set"}</dd>
        </div>
        <div className="account-card__row">
          <dt>Email</dt>
          <dd>{email || "No email on file"}</dd>
        </div>
      </dl>

      <div className="account-profile-form__footer">
        <span className={`account-profile-form__status ${tone ? `is-${tone}` : ""}`}>
          {message || "Used for receipts and ownership labels."}
        </span>
        <button type="submit" className="terminal-button" disabled={pending}>
          {pending ? "Saving..." : "Save name"}
        </button>
      </div>
    </form>
  );
}
