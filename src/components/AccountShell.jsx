import Link from "next/link";
import { formatVoiceLabel } from "@/lib/listening";
import AccountProfileForm from "@/components/AccountProfileForm";
import SignOutButton from "@/components/SignOutButton";

function formatStatus(value) {
  return String(value || "disconnected")
    .toLowerCase()
    .replace(/_/g, " ");
}

function formatListeningRate(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate <= 0) {
    return "1x";
  }

  return `${rate}x`;
}

function getPreferredVoiceLabel(profile) {
  if (!profile?.preferredVoiceProvider) {
    return "Automatic";
  }

  return formatVoiceLabel(profile.preferredVoiceProvider, profile.preferredVoiceId);
}

export default function AccountShell({
  profile,
  email,
  connectionStatus,
  drafts,
  documentCount,
  notice = "",
  noticeTone = "",
}) {
  return (
    <main className="terminal-page account-shell">
      <section className="account-shell__panel">
        <div className="account-shell__header">
          <div className="account-shell__copy">
            <h1 className="account-shell__title">Account</h1>
          </div>

          <div className="account-shell__actions">
            <Link href="/workspace" className="terminal-link is-primary">
              Workspace
            </Link>
            <Link href="/intro" className="terminal-link">
              Intro
            </Link>
            <SignOutButton className="account-shell__signout" />
          </div>
        </div>

        {notice ? (
          <div className={`account-shell__notice ${noticeTone ? `is-${noticeTone}` : ""}`}>
            {notice}
          </div>
        ) : null}

        <div className="account-grid">
          <section className="account-card account-card--identity">
            <div className="account-card__head">
              <h2 className="account-card__title">Identity</h2>
            </div>
            <AccountProfileForm
              displayName={profile?.displayName || "Reader"}
              readerSlug={profile?.readerSlug || ""}
              email={email}
            />
          </section>

          <section className="account-card">
            <div className="account-card__head">
              <h2 className="account-card__title">Listening defaults</h2>
            </div>
            <dl className="account-card__list">
              <div className="account-card__row">
                <dt>Preferred voice</dt>
                <dd>{getPreferredVoiceLabel(profile)}</dd>
              </div>
              <div className="account-card__row">
                <dt>Listening speed</dt>
                <dd>{formatListeningRate(profile?.preferredListeningRate)}</dd>
              </div>
            </dl>
            <p className="account-card__hint">Updated from your latest listening session.</p>
          </section>

          <section className="account-card">
            <div className="account-card__head">
              <h2 className="account-card__title">GetReceipts</h2>
              <span
                className={`terminal-pill ${
                  connectionStatus === "CONNECTED" ? "is-green" : ""
                }`}
              >
                {formatStatus(connectionStatus)}
              </span>
            </div>
            <p className="account-card__value account-card__value--compact">
              {connectionStatus === "CONNECTED"
                ? "Ready to receive drafts from the workspace."
                : "Connect when you want drafts to flow out."}
            </p>
            <div className="terminal-actions account-card__actions">
              <Link href="/connect/getreceipts" className="terminal-link">
                {connectionStatus === "CONNECTED" ? "Manage connection" : "Connect GetReceipts"}
              </Link>
            </div>
          </section>

          <section className="account-card">
            <div className="account-card__head">
              <h2 className="account-card__title">Workspace</h2>
            </div>
            <div className="account-metrics">
              <div className="account-metric">
                <span className="account-metric__value">{documentCount}</span>
                <span className="account-metric__label">Documents</span>
              </div>
              <div className="account-metric">
                <span className="account-metric__value">{drafts.length}</span>
                <span className="account-metric__label">Receipt drafts</span>
              </div>
            </div>
          </section>

          <section className="account-card">
            <div className="account-card__head">
              <h2 className="account-card__title">Receipt drafts</h2>
            </div>
            {drafts.length ? (
              <div className="receipt-list">
                {drafts.map((draft) => (
                  <article key={draft.id} className="receipt-row">
                    <div className="receipt-row__meta">
                      <span>{String(draft.status || "local_draft").toLowerCase()}</span>
                      <span>{String(draft.stance || "tentative").toLowerCase()}</span>
                    </div>
                    <p className="receipt-row__title">{draft.title || "Untitled receipt"}</p>
                    {draft.interpretation ? (
                      <p className="receipt-row__body">{draft.interpretation}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="account-card__value">No receipt drafts yet.</p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
