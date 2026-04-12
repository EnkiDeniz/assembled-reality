import Link from "next/link";
import {
  AssembledCard,
  BoxMetric,
  ShapeNav,
  SignalChip,
  buildStaticShapeNav,
} from "@/components/LoegosSystem";
import { formatVoiceLabel } from "@/lib/listening";
import AccountProfileForm from "@/components/AccountProfileForm";
import SignOutButton from "@/components/SignOutButton";
import GlobalControlMenu from "@/components/GlobalControlMenu";

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
  const connectionTone = connectionStatus === "CONNECTED" ? "clear" : "neutral";

  return (
    <main className="loegos-account">
      <GlobalControlMenu
        title="Control Surface"
        subtitle="Jump back into the Room, open Section Dream, revisit account controls, or leave cleanly."
      />
      <section className="loegos-account__shell">
        <section className="loegos-account__panel">
          <div className="loegos-account__masthead">
            <div className="loegos-account__brandline">
              <span className="loegos-wordmark">
                Lœgos <span className="loegos-wordmark__sub">account</span>
              </span>
              <span className="loegos-thesis">Navigate by shape. Act by verb.</span>
            </div>

            <div className="loegos-account__hero">
              <span className="loegos-kicker">Control surface</span>
              <h1 className="loegos-display">Account</h1>
              <p className="loegos-account__lede">
                Identity, listening defaults, proof connection, and receipt drafts live here. The
                box work itself stays in the workspace.
              </p>
            </div>
          </div>

          <ShapeNav items={buildStaticShapeNav("seal")} activeShape="seal" compact />

          <div className="loegos-account__metrics">
            <BoxMetric label="Documents" value={documentCount} detail="Visible inside your current boxes." />
            <BoxMetric label="Receipt drafts" value={drafts.length} detail="Local and remote proof drafts." />
            <BoxMetric label="Listening" value={formatListeningRate(profile?.preferredListeningRate)} detail={getPreferredVoiceLabel(profile)} />
            <BoxMetric label="Connection" value={formatStatus(connectionStatus)} detail="GetReceipts sync posture." />
          </div>

          {notice ? (
            <SignalChip tone={noticeTone === "error" ? "alert" : "clear"}>{notice}</SignalChip>
          ) : null}

          <div className="loegos-account__grid">
            <div className="loegos-account__stack">
              <section className="loegos-workspace-panel">
                <div className="loegos-account__section-head">
                  <h2 className="loegos-account__section-title">Identity</h2>
                  <div className="terminal-actions">
                    <Link href="/workspace" className="terminal-link is-primary">
                      Workspace
                    </Link>
                    <Link href="/intro" className="terminal-link">
                      Intro
                    </Link>
                  </div>
                </div>
                <p className="loegos-account__section-copy">
                  Reader identity stays compact so the box, not the profile, remains the center of
                  gravity.
                </p>
                <AccountProfileForm
                  displayName={profile?.displayName || "Reader"}
                  readerSlug={profile?.readerSlug || ""}
                  email={email}
                />
              </section>

              <section className="loegos-workspace-panel">
                <div className="loegos-account__section-head">
                  <h2 className="loegos-account__section-title">Listening defaults</h2>
                  <SignalChip tone="neutral">Reality</SignalChip>
                </div>
                <dl className="loegos-account__list">
                  <div className="loegos-account__row">
                    <dt>Preferred voice</dt>
                    <dd>{getPreferredVoiceLabel(profile)}</dd>
                  </div>
                  <div className="loegos-account__row">
                    <dt>Listening speed</dt>
                    <dd>{formatListeningRate(profile?.preferredListeningRate)}</dd>
                  </div>
                </dl>
                <p className="loegos-account__section-copy">
                  Updated from your latest listening session. Mobile capture and desktop review
                  share the same voice defaults.
                </p>
              </section>
            </div>

            <div className="loegos-account__stack">
              <AssembledCard
                shapeKey="seal"
                label="Proof connection"
                title="GetReceipts"
                body={
                  connectionStatus === "CONNECTED"
                    ? "Ready to receive drafts from the workspace."
                    : "Connect when you want drafts to flow out."
                }
                detail="Seal is proof. Seven is resolution. This surface only handles proof transport."
                signal={formatStatus(connectionStatus)}
                signalTone={connectionTone}
                stageCount={connectionStatus === "CONNECTED" ? 5 : 2}
                footer="Portable proof"
                action={(
                  <Link href="/connect/getreceipts" className="terminal-link">
                    {connectionStatus === "CONNECTED" ? "Manage connection" : "Connect GetReceipts"}
                  </Link>
                )}
              />

              <section className="loegos-workspace-panel">
                <div className="loegos-account__section-head">
                  <h2 className="loegos-account__section-title">Receipt drafts</h2>
                  <SignOutButton className="account-shell__signout" />
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
                  <p className="loegos-account__section-copy">
                    No receipt drafts yet. Drafts appear here after Weld or Seal work happens in
                    the workspace.
                  </p>
                )}
              </section>
            </div>
          </div>

          <footer className="loegos-account__footer">
            <p>Account remains a compact control surface, not a second workspace.</p>
          </footer>
        </section>
      </section>
    </main>
  );
}
