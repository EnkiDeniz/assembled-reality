"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  buildSevenFallbackMessage,
  getSevenProviderLabel,
  parseSevenAudioHeaders,
} from "@/lib/seven";
import {
  DEFAULT_READER_PREFERENCES,
  loadReaderPreferences,
  saveReaderPreferences,
} from "@/lib/storage";

const TEXT_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const PAGE_WIDTH_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "wide", label: "Wide" },
];

const THEME_OPTIONS = [
  { value: "paper", label: "Paper" },
  { value: "dark", label: "Dark" },
];

function draftLink(draft) {
  const remote = draft?.payload?.remoteReceipt;
  return remote?.edit_url || remote?.detail_url || remote?.links?.edit || remote?.links?.detail || "";
}

function formatStatus(value) {
  return String(value || "disconnected")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function PreferenceGroup({ title, description, value, options, onChange }) {
  return (
    <div className="account-pref-group">
      <div className="account-pref-group__header">
        <h3 className="account-pref-group__title">{title}</h3>
        <p className="account-pref-group__description">{description}</p>
      </div>
      <div className="account-pref-group__options" role="radiogroup" aria-label={title}>
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              className={`account-pref-option ${active ? "is-active" : ""}`}
              onClick={() => onChange(option.value)}
              role="radio"
              aria-checked={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ label, value, detail = "" }) {
  return (
    <div className="account-stat">
      <span className="account-stat__label">{label}</span>
      <strong className="account-stat__value">{value}</strong>
      {detail ? <span className="account-stat__detail">{detail}</span> : null}
    </div>
  );
}

function formatDiagnosticTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

function DiagnosticCard({ title, description, buttonLabel, result, onRun }) {
  const checkedAt = result?.checkedAt ? formatDiagnosticTime(result.checkedAt) : "";

  return (
    <div className="account-diagnostic">
      <div className="account-diagnostic__copy">
        <p className="account-diagnostic__title">{title}</p>
        <p className="account-diagnostic__description">{description}</p>
        <p className={`account-diagnostic__result is-${result?.status || "idle"}`}>
          {result?.message || "Not tested yet."}
        </p>
        {checkedAt ? <p className="account-diagnostic__meta">Last checked at {checkedAt}</p> : null}
      </div>
      <button type="button" className="account-button" disabled={result?.status === "running"} onClick={onRun}>
        {result?.status === "running" ? "Testing..." : buttonLabel}
      </button>
    </div>
  );
}

export default function AccountScreen({
  initialProfile,
  email,
  connectionStatus,
  drafts = [],
  readingSnapshot = null,
}) {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || "");
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_READER_PREFERENCES;
    }

    return loadReaderPreferences();
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sevenDiagnostics, setSevenDiagnostics] = useState({
    chat: {
      status: "idle",
      message: "",
      checkedAt: null,
    },
    voice: {
      status: "idle",
      message: "",
      checkedAt: null,
    },
  });
  const accountName = displayName.trim() || initialProfile?.displayName || "Reader";
  const membershipLabel = "Reader";
  const connectionLabel = formatStatus(connectionStatus);
  const connectionCopy =
    connectionStatus === "connected"
      ? "Reading receipts can move directly into your GetReceipts flow."
      : "Connect GetReceipts when you want reading notes to become structured drafts.";
  const readingProgress = readingSnapshot?.progressPercent ?? 0;
  const resumeHref = readingSnapshot?.resumeHref || "/read";
  const receiptsCount = drafts.length;

  useEffect(() => {
    saveReaderPreferences(preferences);
  }, [preferences]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

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

  const runChatDiagnostic = async () => {
    setSevenDiagnostics((current) => ({
      ...current,
      chat: {
        ...current.chat,
        status: "running",
        message: "Testing Seven chat...",
      },
    }));

    try {
      const response = await fetch("/api/seven", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "summary",
          documentTitle: "Seven diagnostic",
          documentSubtitle: "",
          introMarkdown: "",
          sectionOutline: "1. Diagnostic",
          currentLabel: "Diagnostic",
          currentSectionTitle: "Diagnostic",
          currentSectionMarkdown:
            "This is a short diagnostic paragraph used to confirm that Seven can answer a simple request.",
        }),
      });

      const payload = await response.json().catch(() => null);
      const checkedAt = new Date();

      if (!response.ok || !payload?.ok) {
        setSevenDiagnostics((current) => ({
          ...current,
          chat: {
            status: "error",
            message: payload?.error || "Seven chat diagnostic failed.",
            checkedAt,
          },
        }));
        return;
      }

      setSevenDiagnostics((current) => ({
        ...current,
        chat: {
          status: "success",
          message: `Chat responded through ${getSevenProviderLabel(payload.provider)}.`,
          checkedAt,
        },
      }));
    } catch (thrownError) {
      setSevenDiagnostics((current) => ({
        ...current,
        chat: {
          status: "error",
          message:
            thrownError instanceof Error
              ? thrownError.message
              : "Seven chat diagnostic failed.",
          checkedAt: new Date(),
        },
      }));
    }
  };

  const runVoiceDiagnostic = async () => {
    setSevenDiagnostics((current) => ({
      ...current,
      voice: {
        ...current.voice,
        status: "running",
        message: "Testing Seven voice...",
      },
    }));

    try {
      const response = await fetch("/api/seven/audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "Seven diagnostic check.",
        }),
      });

      const checkedAt = new Date();
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setSevenDiagnostics((current) => ({
          ...current,
          voice: {
            status: "error",
            message: payload?.error || "Seven voice diagnostic failed.",
            checkedAt,
          },
        }));
        return;
      }

      const audioMeta = parseSevenAudioHeaders(response.headers);
      await response.blob();

      const message = audioMeta.fallbackFrom
        ? buildSevenFallbackMessage({
            fallbackTo: audioMeta.provider || "openai",
            fallbackFrom: audioMeta.fallbackFrom,
            reasonCode: audioMeta.fallbackReasonCode || "unknown_error",
          })
        : `Voice responded through ${getSevenProviderLabel(audioMeta.provider)}.`;

      setSevenDiagnostics((current) => ({
        ...current,
        voice: {
          status: "success",
          message,
          checkedAt,
        },
      }));
    } catch (thrownError) {
      setSevenDiagnostics((current) => ({
        ...current,
        voice: {
          status: "error",
          message:
            thrownError instanceof Error
              ? thrownError.message
              : "Seven voice diagnostic failed.",
          checkedAt: new Date(),
        },
      }));
    }
  };

  return (
    <main className="account-shell">
      <div className="account-stage">
        <header className="account-header">
          <div className="account-header__brand">
            <span className="account-header__eyebrow">Assembled Reality</span>
            <span className="account-header__title">Account</span>
          </div>
          <div className="account-header__actions">
            <Link className="account-button" href="/read">
              Return to reading
            </Link>
            <button type="button" className="account-button" onClick={handleSignOut}>
              Log out
            </button>
          </div>
        </header>

        <section className="account-hero">
          <div>
            <p className="lock-screen__eyebrow">Account</p>
            <h1 className="account-hero__title">{accountName}</h1>
            <p className="account-hero__lede">
              Your reading identity, device settings, and session controls live here.
            </p>
          </div>
          <div className="account-hero__meta" aria-label="Account status">
            <span>{email}</span>
            <span>{membershipLabel}</span>
            <span>{connectionLabel}</span>
          </div>
        </section>

        <div className="account-grid">
          <section id="snapshot" className="account-panel account-panel--rail account-panel--snapshot">
            <div className="account-panel__header">
              <div>
                <p className="account-panel__eyebrow">Reading</p>
                <h2 className="account-panel__title">Snapshot</h2>
              </div>
            </div>

            <div className="account-stats">
              <StatTile
                label="Progress"
                value={`${readingProgress}%`}
                detail={readingSnapshot?.resumeLabel || "Beginning"}
              />
              <StatTile label="Bookmarks" value={readingSnapshot?.bookmarkCount ?? 0} />
              <StatTile label="Highlights" value={readingSnapshot?.highlightCount ?? 0} />
              <StatTile label="Notes" value={readingSnapshot?.noteCount ?? 0} />
              <StatTile label="Receipts" value={receiptsCount} />
            </div>

            <Link className="account-button is-primary" href={resumeHref}>
              Continue Reading
            </Link>
          </section>

          <section id="profile" className="account-panel">
            <div className="account-panel__header">
              <div>
                <p className="account-panel__eyebrow">Profile</p>
                <h2 className="account-panel__title">Identity</h2>
                <p className="account-panel__lede">
                  Keep your reader name current so your notebook and receipts stay legible.
                </p>
              </div>
            </div>

            <form className="account-form" onSubmit={handleSave}>
              <div className="account-form__grid">
                <label className="account-field" htmlFor="reader-display-name">
                  <span className="account-field__label">Display name</span>
                  <input
                    id="reader-display-name"
                    className="account-input"
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                  />
                </label>
                <div className="account-field account-field--static">
                  <span className="account-field__label">Email</span>
                  <span className="account-field__value">{email}</span>
                </div>
              </div>

              <div className="account-form__actions">
                <button type="submit" className="account-button is-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save Profile"}
                </button>
                <span className="account-form__status">
                  {error ? <span className="is-error">{error}</span> : message || " "}
                </span>
              </div>
            </form>
          </section>

          <section id="settings" className="account-panel">
            <div className="account-panel__header">
              <div>
                <p className="account-panel__eyebrow">Settings</p>
                <h2 className="account-panel__title">Reading Preferences</h2>
                <p className="account-panel__lede">
                  These controls shape the manuscript surface and save in this browser immediately.
                </p>
              </div>
              <button
                type="button"
                className="account-button"
                onClick={() => setPreferences(DEFAULT_READER_PREFERENCES)}
              >
                Reset
              </button>
            </div>

            <div className="account-preferences">
              <PreferenceGroup
                title="Text size"
                description="Tune the density of the reading surface."
                value={preferences.textSize}
                options={TEXT_SIZE_OPTIONS}
                onChange={(value) => setPreferences((current) => ({ ...current, textSize: value }))}
              />
              <PreferenceGroup
                title="Reading width"
                description="Choose whether the text sits in a tighter or looser column."
                value={preferences.pageWidth}
                options={PAGE_WIDTH_OPTIONS}
                onChange={(value) => setPreferences((current) => ({ ...current, pageWidth: value }))}
              />
              <PreferenceGroup
                title="Theme"
                description="Switch between the paper surface and the dark reading mode."
                value={preferences.theme}
                options={THEME_OPTIONS}
                onChange={(value) => setPreferences((current) => ({ ...current, theme: value }))}
              />
            </div>
          </section>

          <section id="receipts" className="account-panel">
            <div className="account-panel__header">
              <div>
                <p className="account-panel__eyebrow">Activity</p>
                <h2 className="account-panel__title">Reading Receipts</h2>
                <p className="account-panel__lede">
                  Drafts created from reviewed evidence appear here.
                </p>
              </div>
            </div>

            {drafts.length === 0 ? (
              <p className="account-empty">
                No reading receipts yet. Create one in Seven after you review and assemble evidence worth carrying forward.
              </p>
            ) : (
              <div className="account-receipts">
                {drafts.map((draft) => {
                  const href = draftLink(draft);

                  return (
                    <article key={draft.id} className="account-receipt">
                      <div className="account-receipt__body">
                        <p className="account-receipt__title">{draft.title || "Untitled receipt"}</p>
                        <p className="account-receipt__meta">
                          {draft.status.toLowerCase().replaceAll("_", " ")}
                        </p>
                      </div>
                      {href ? (
                        <a className="account-receipt__link" href={href} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section id="connections" className="account-panel">
            <div className="account-panel__header">
              <div>
                <p className="account-panel__eyebrow">Connections</p>
                <h2 className="account-panel__title">GetReceipts</h2>
                <p className="account-panel__lede">{connectionCopy}</p>
              </div>
              <div className="account-connection-status">{connectionLabel}</div>
            </div>

            <div className="account-connection">
              <div className="account-connection__copy">
                <p className="account-connection__title">
                  {connectionStatus === "connected"
                    ? "Your account is ready to create receipt drafts from reading context."
                    : "Connect when you want to turn notebook material into structured output."}
                </p>
                <p className="account-connection__detail">
                  The manuscript stays the center of the experience. This handoff is only for the reviewed interpretation work that comes out of it.
                </p>
              </div>
              <a className="account-button is-primary" href="/connect/getreceipts">
                {connectionStatus === "connected" ? "Manage Connection" : "Connect GetReceipts"}
              </a>
            </div>
          </section>

          <section id="seven-diagnostics" className="account-panel account-panel--rail">
            <div className="account-panel__header">
              <div>
                <p className="account-panel__eyebrow">Seven</p>
                <h2 className="account-panel__title">Diagnostics</h2>
                <p className="account-panel__lede">
                  Verify chat and voice before you head back into the reader.
                </p>
              </div>
            </div>

            <div className="account-diagnostics">
              <DiagnosticCard
                title="Chat"
                description="Checks whether Seven can answer a simple diagnostic prompt right now."
                buttonLabel="Test Chat"
                result={sevenDiagnostics.chat}
                onRun={runChatDiagnostic}
              />
              <DiagnosticCard
                title="Voice"
                description="Checks whether Seven can generate voice audio and shows the active provider."
                buttonLabel="Test Voice"
                result={sevenDiagnostics.voice}
                onRun={runVoiceDiagnostic}
              />
            </div>
          </section>

          <section className="account-panel account-panel--rail">
            <div className="account-panel__header">
              <div>
                <p className="account-panel__eyebrow">Session</p>
                <h2 className="account-panel__title">Access</h2>
                <p className="account-panel__lede">
                  Sign out when you are done, especially on a shared device.
                </p>
              </div>
            </div>
            <button type="button" className="account-button" onClick={handleSignOut}>
              Log Out
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
