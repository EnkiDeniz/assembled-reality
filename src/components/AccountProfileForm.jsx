"use client";

import { useState } from "react";
import styles from "@/components/AccountProfileForm.module.css";

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
    setMessage("Saving…");

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
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Display name</span>
        <input
          className={styles.input}
          type="text"
          name="displayName"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={pending}
        />
      </label>

      <dl className={styles.metaList}>
        <div className={styles.metaRow}>
          <dt>Handle</dt>
          <dd>{readerSlug || "Not set"}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Email</dt>
          <dd>{email || "No email on file"}</dd>
        </div>
      </dl>

      <div className={styles.footer}>
        <span
          className={`${styles.status} ${tone === "success" ? styles.statusSuccess : ""} ${tone === "error" ? styles.statusError : ""}`}
          aria-live="polite"
        >
          {message || "Used for receipts and ownership labels."}
        </span>
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "Saving…" : "Save name"}
        </button>
      </div>
    </form>
  );
}
