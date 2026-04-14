"use client";

import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import LoegosShell, {
  Kicker,
  SignalChip,
  Surface as ShellSurface,
} from "@/components/shell/LoegosShell";
import { buildEchoPulseState } from "@/lib/loegos-shell";
import { formatVoiceLabel } from "@/lib/listening";
import AccountProfileForm from "@/components/AccountProfileForm";
import SignOutButton from "@/components/SignOutButton";
import styles from "@/components/AccountShell.module.css";

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
  const listeningRate = formatListeningRate(profile?.preferredListeningRate);
  const preferredVoice = getPreferredVoiceLabel(profile);
  const connectionLabel = formatStatus(connectionStatus);
  const accountEcho = buildEchoPulseState({
    change: noticeTone === "success" ? notice : "",
    tension: noticeTone === "error" ? notice : "",
    survives:
      connectionStatus === "CONNECTED"
        ? "Proof line is live."
        : drafts.length
          ? `${drafts.length} draft${drafts.length === 1 ? "" : "s"} waiting.`
          : "",
  });

  return (
    <LoegosShell
      route="account"
      title="Account"
      pulse={accountEcho.pulse}
      contextControl={(
        <Link href="/workspace" className={styles.headerLink}>
          <ArrowLeftRight size={14} />
          <span>Utility</span>
        </Link>
      )}
      main={(
        <div className={styles.main}>
          {notice ? (
            <div
              className={`${styles.notice} ${noticeTone === "success" ? styles.noticeSuccess : ""} ${noticeTone === "error" ? styles.noticeError : ""}`}
            >
              {notice}
            </div>
          ) : null}

          <div className={styles.grid}>
            <ShellSurface className={styles.card} roomy>
              <div className={styles.head}>
                <Kicker tone="brand">Identity</Kicker>
                <strong>{profile?.displayName || "Reader"}</strong>
              </div>
              <div className={styles.metrics}>
                <SignalChip tone="neutral">{documentCount} docs</SignalChip>
                <SignalChip tone="neutral">{drafts.length} drafts</SignalChip>
              </div>
              <AccountProfileForm
                displayName={profile?.displayName || "Reader"}
                readerSlug={profile?.readerSlug || ""}
                email={email}
              />
            </ShellSurface>

            <ShellSurface className={styles.card} roomy>
              <div className={styles.head}>
                <Kicker tone="neutral">Listening</Kicker>
                <strong>{preferredVoice}</strong>
              </div>
              <div className={styles.list}>
                <div className={styles.row}>
                  <span>Speed</span>
                  <strong>{listeningRate}</strong>
                </div>
                <div className={styles.row}>
                  <span>Voice</span>
                  <strong>{preferredVoice}</strong>
                </div>
              </div>
              <div className={styles.linkRow}>
                <Link href="/dream" className={`${styles.linkButton} ${styles.linkButtonPrimary}`}>
                  Open Library
                </Link>
              </div>
            </ShellSurface>

            <ShellSurface className={styles.card} roomy>
              <div className={styles.head}>
                <Kicker tone={connectionStatus === "CONNECTED" ? "grounded" : "neutral"}>
                  Proof
                </Kicker>
                <strong>GetReceipts</strong>
              </div>
              <div className={styles.metrics}>
                <SignalChip tone={connectionStatus === "CONNECTED" ? "grounded" : "neutral"}>
                  {connectionLabel}
                </SignalChip>
              </div>
              <div className={styles.list}>
                <div className={styles.row}>
                  <span>Connection</span>
                  <strong>{connectionLabel}</strong>
                </div>
                <div className={styles.row}>
                  <span>Drafts</span>
                  <strong>{drafts.length}</strong>
                </div>
              </div>
              <div className={styles.linkRow}>
                <Link href="/connect/getreceipts" className={styles.linkButton}>
                  {connectionStatus === "CONNECTED" ? "Manage link" : "Connect"}
                </Link>
              </div>
            </ShellSurface>

            <ShellSurface className={styles.card} roomy>
              <div className={styles.head}>
                <Kicker tone="neutral">Receipts</Kicker>
                <strong>Latest drafts</strong>
              </div>
              {drafts.length ? (
                <div className={styles.draftList}>
                  {drafts.slice(0, 4).map((draft) => (
                    <article key={draft.id} className={styles.draft}>
                      <div className={styles.draftMeta}>
                        <span>{String(draft.status || "local_draft").toLowerCase()}</span>
                        <span>{String(draft.stance || "tentative").toLowerCase()}</span>
                      </div>
                      <strong>{draft.title || "Untitled receipt"}</strong>
                      {draft.interpretation ? <p>{draft.interpretation}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No drafts yet.</p>
              )}

              <div className={styles.footer}>
                <Link href="/workspace" className={`${styles.linkButton} ${styles.linkButtonPrimary}`}>
                  Return to Room
                </Link>
                <SignOutButton className={styles.signout}>Sign Out</SignOutButton>
              </div>
            </ShellSurface>
          </div>
        </div>
      )}
    />
  );
}
