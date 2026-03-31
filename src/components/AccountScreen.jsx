"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { clearUnlockState } from "@/lib/storage";

function draftLink(draft) {
  const remote = draft?.payload?.remoteReceipt;
  return remote?.edit_url || remote?.detail_url || remote?.links?.edit || remote?.links?.detail || "";
}

export default function AccountScreen({ initialProfile, email, connectionStatus, drafts = [] }) {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const accountName = displayName || initialProfile?.displayName || "Reader";
  const membershipLabel =
    initialProfile?.cohort === "FOUNDING" ? "Founding reader" : "Private beta member";

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/reader/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Could not update profile.");
      }

      setDisplayName(payload.profile?.displayName || displayName);
      setMessage("Display name updated.");
    } catch (thrownError) {
      setError(thrownError instanceof Error ? thrownError.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="account-shell">
      <section className="account-card">
        <p className="lock-screen__eyebrow">Account</p>
        <h1 className="account-card__title">{accountName}</h1>
        <dl className="account-card__meta">
          <div>
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>{membershipLabel}</dd>
          </div>
          <div>
            <dt>GetReceipts</dt>
            <dd>{connectionStatus}</dd>
          </div>
        </dl>

        <form className="account-card__form" onSubmit={handleSave}>
          <label className="account-card__label" htmlFor="reader-display-name">
            Display name
          </label>
          <input
            id="reader-display-name"
            className="account-card__input"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
          <div className="account-card__actions">
            <Link className="account-card__button" href="/read">
              Back to reading
            </Link>
            <button type="submit" className="account-card__button is-primary" disabled={saving}>
              {saving ? "Saving" : "Save"}
            </button>
            <a className="account-card__button" href="/connect/getreceipts">
              Connect GetReceipts
            </a>
            <button
              type="button"
              className="account-card__button"
              onClick={() => {
                clearUnlockState();
                signOut({ callbackUrl: "/" });
              }}
            >
              Sign out
            </button>
          </div>
          <div className="account-card__status">
            {error ? <span className="is-error">{error}</span> : message || "\u00A0"}
          </div>
        </form>

        <div className="account-card__drafts">
          <p className="account-card__label">Reading receipts</p>
          {drafts.length === 0 ? (
            <p className="account-card__empty">No reading receipts yet.</p>
          ) : (
            <div className="account-card__draft-list">
              {drafts.map((draft) => {
                const href = draftLink(draft);
                return (
                  <article key={draft.id} className="account-card__draft-item">
                    <div>
                      <p className="account-card__draft-title">{draft.title || "Untitled receipt"}</p>
                      <p className="account-card__draft-meta">
                        {draft.status.toLowerCase().replaceAll("_", " ")}
                      </p>
                    </div>
                    {href ? (
                      <a className="account-card__draft-link" href={href} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
