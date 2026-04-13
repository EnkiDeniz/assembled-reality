"use client";

import { Kicker, SignalChip } from "@/components/shell/LoegosShell";
import styles from "@/components/dream/SectionDreamScreen.module.css";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sentenceCase(value = "") {
  const normalized = normalizeText(value).replace(/_/g, " ");
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function renderClaimMeta(claim) {
  return [
    sentenceCase(claim?.claimKind),
    sentenceCase(claim?.provenanceClass),
    sentenceCase(claim?.supportStatus),
    sentenceCase(claim?.translationReadiness),
  ].filter(Boolean);
}

export default function CompilerReadPanel({
  compilerRead = null,
  pending = false,
  error = "",
}) {
  if (!pending && !error && !compilerRead) {
    return null;
  }

  const claimSet = Array.isArray(compilerRead?.claimSet) ? compilerRead.claimSet : [];
  const nextMoves = Array.isArray(compilerRead?.nextMoves) ? compilerRead.nextMoves : [];
  const omittedClaims = Array.isArray(compilerRead?.loeCandidate?.omittedClaims)
    ? compilerRead.loeCandidate.omittedClaims
    : [];
  const omittedClaimDetails = omittedClaims
    .map((claimId) => claimSet.find((claim) => claim.id === claimId))
    .filter(Boolean);
  const diagnostics = Array.isArray(compilerRead?.compileResult?.diagnostics)
    ? compilerRead.compileResult.diagnostics
    : [];
  const compilerWasRun = Boolean(normalizeText(compilerRead?.loeCandidate?.source));

  return (
    <section
      className={styles.compilerReadPanel}
      data-testid="dream-compiler-read-panel"
      aria-live="polite"
    >
      <div className={styles.compilerReadHead}>
        <div className={styles.compilerReadIdentity}>
          <Kicker tone={error ? "flagged" : "brand"}>Compiler Read</Kicker>
          <strong>Seven-assisted. Provisional. Not proof.</strong>
        </div>
        {compilerRead?.verdict?.readDisposition ? (
          <SignalChip tone="neutral">{sentenceCase(compilerRead.verdict.readDisposition)}</SignalChip>
        ) : null}
      </div>

      {pending ? (
        <p className={styles.compilerReadStatus} data-testid="dream-compiler-read-status">
          Running Compiler Read…
        </p>
      ) : null}

      {error ? (
        <div
          className={styles.compilerReadError}
          role="alert"
          data-testid="dream-compiler-read-error"
        >
          <strong>Compiler Read could not finish.</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {compilerRead ? (
        <>
          <div className={styles.compilerReadSummary} data-testid="dream-compiler-read-summary">
            <div className={styles.compilerReadCard}>
              <Kicker tone="neutral">Plain-language result</Kicker>
              <strong>{compilerRead?.verdict?.primaryFinding || "No primary finding yet."}</strong>
              <p>{compilerRead?.documentSummary?.summary || "No summary returned."}</p>
              <div className={styles.compilerReadChips}>
                <SignalChip tone="neutral">
                  {sentenceCase(compilerRead?.documentSummary?.documentType || "mixed")}
                </SignalChip>
                <SignalChip tone="neutral">
                  {sentenceCase(compilerRead?.documentSummary?.dominantMode || "mixed")}
                </SignalChip>
                <SignalChip tone="neutral">
                  {sentenceCase(compilerRead?.verdict?.overall || "mixed")}
                </SignalChip>
              </div>
            </div>

            <div className={styles.compilerReadCard}>
              <Kicker tone="neutral">What the language can hold right now</Kicker>
              <p>{compilerRead?.loeCandidate?.translationStrategy || "No lawful subset was translated."}</p>
              <div className={styles.compilerReadChips}>
                <SignalChip tone="neutral">
                  {sentenceCase(compilerRead?.compileResult?.compileState || "unknown")}
                </SignalChip>
                <SignalChip tone="neutral">
                  {sentenceCase(compilerRead?.compileResult?.runtimeState || "open")}
                </SignalChip>
                <SignalChip tone="neutral">
                  {sentenceCase(compilerRead?.compileResult?.mergedWindowState || "open")}
                </SignalChip>
              </div>
            </div>
          </div>

          <div className={styles.compilerReadSection} data-testid="dream-compiler-read-claims">
            <div className={styles.compilerReadSectionHead}>
              <Kicker tone="neutral">Claims</Kicker>
              <span>Seven-assisted extraction remains provisional.</span>
            </div>
            <div className={styles.compilerReadClaimList}>
              {claimSet.map((claim) => (
                <article key={claim.id} className={styles.compilerReadClaim}>
                  <div className={styles.compilerReadClaimHead}>
                    <strong>{claim.text}</strong>
                    <div className={styles.compilerReadChips}>
                      {renderClaimMeta(claim).map((item) => (
                        <SignalChip key={`${claim.id}:${item}`} tone="neutral">
                          {item}
                        </SignalChip>
                      ))}
                    </div>
                  </div>
                  <p>{claim.reason}</p>
                  <blockquote className={styles.compilerReadExcerpt}>{claim.sourceExcerpt}</blockquote>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.compilerReadSection} data-testid="dream-compiler-read-next-moves">
            <div className={styles.compilerReadSectionHead}>
              <Kicker tone="neutral">Next moves</Kicker>
              <span>Next-step bias only.</span>
            </div>
            <ul className={styles.compilerReadList}>
              {nextMoves.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <details className={styles.compilerReadInspect} data-testid="dream-compiler-read-inspect">
            <summary>Inspect translation & diagnostics</summary>
            <div className={styles.compilerReadInspectBody}>
              <div className={styles.compilerReadInspectBlock}>
                <Kicker tone="neutral">Generated .loe</Kicker>
                <pre>{compilerRead?.loeCandidate?.source || "# No lawful subset translated in v0."}</pre>
              </div>

              <div className={styles.compilerReadInspectBlock}>
                <Kicker tone="neutral">Compile artifact summary</Kicker>
                <ul className={styles.compilerReadList}>
                  <li>Compile state: {sentenceCase(compilerRead?.compileResult?.compileState || "unknown")}</li>
                  <li>Runtime state: {sentenceCase(compilerRead?.compileResult?.runtimeState || "open")}</li>
                  <li>
                    Merged window state: {sentenceCase(compilerRead?.compileResult?.mergedWindowState || "open")}
                  </li>
                </ul>
              </div>

              <div className={styles.compilerReadInspectBlock}>
                <Kicker tone="neutral">Diagnostics</Kicker>
                {diagnostics.length ? (
                  <ul className={styles.compilerReadList}>
                    {diagnostics.map((diagnostic) => (
                      <li key={`${diagnostic.code}:${diagnostic.line || 0}`}>
                        {sentenceCase(diagnostic.severity)} {diagnostic.code}: {diagnostic.message}
                      </li>
                    ))}
                  </ul>
                ) : !compilerWasRun ? (
                  <p>No compiler run yet because no lawful subset translated in v0.</p>
                ) : (
                  <p>No compiler diagnostics on the translated subset.</p>
                )}
              </div>

              <div className={styles.compilerReadInspectBlock}>
                <Kicker tone="neutral">Omitted claims</Kicker>
                {omittedClaimDetails.length ? (
                  <ul className={styles.compilerReadList}>
                    {omittedClaimDetails.map((claim) => (
                      <li key={claim.id}>
                        <strong>{claim.text}</strong>: {claim.reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No claims were omitted from the translated subset.</p>
                )}
              </div>
            </div>
          </details>
        </>
      ) : null}
    </section>
  );
}
