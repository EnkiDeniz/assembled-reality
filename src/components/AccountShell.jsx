import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

function formatStatus(value) {
  return String(value || "disconnected")
    .toLowerCase()
    .replace(/_/g, " ");
}

export default function AccountShell({
  profile,
  email,
  connectionStatus,
  drafts,
  documentCount,
}) {
  return (
    <main className="terminal-page account-shell">
      <section className="account-shell__panel">
        <div className="account-shell__copy">
          <span className="terminal-kicker">Account</span>
          <h1 className="account-shell__title">Identity, receipts, and integrations</h1>
          <p className="terminal-copy">
            The product surface is now the workspace. Account stays small and operational.
          </p>
          <div className="terminal-actions">
            <Link href="/workspace" className="terminal-link is-primary">
              Back to workspace
            </Link>
            <Link href="/intro" className="terminal-link">
              View intro again
            </Link>
            <SignOutButton className="terminal-button is-danger" />
          </div>
        </div>

        <div className="account-grid">
          <section className="account-card">
            <h2 className="account-card__title">Identity</h2>
            <p className="account-card__value">
              {profile?.displayName || "Reader"}
              <br />
              {email || "No email on file"}
            </p>
          </section>

          <section className="account-card">
            <h2 className="account-card__title">GetReceipts</h2>
            <p className="account-card__value">Status: {formatStatus(connectionStatus)}</p>
            <div className="terminal-actions" style={{ marginTop: 14 }}>
              <Link href="/connect/getreceipts" className="terminal-link">
                {connectionStatus === "CONNECTED" ? "Manage connection" : "Connect GetReceipts"}
              </Link>
            </div>
          </section>

          <section className="account-card">
            <h2 className="account-card__title">Workspace</h2>
            <p className="account-card__value">
              Documents: {documentCount}
              <br />
              Receipt drafts: {drafts.length}
            </p>
          </section>

          <section className="account-card">
            <h2 className="account-card__title">Receipt drafts</h2>
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
