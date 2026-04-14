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

function buildLayerDiagnostics(label, result) {
  const diagnostics = Array.isArray(result?.diagnostics) ? result.diagnostics : [];
  if (!diagnostics.length) {
    return [];
  }
  return diagnostics.map((diagnostic) => ({
    key: `${label}:${diagnostic.code}:${diagnostic.line || 0}`,
    label,
    text: `${sentenceCase(diagnostic.severity)} ${diagnostic.code}: ${diagnostic.message}`,
  }));
}

function buildAdmissionSummary(rawDocumentResult = null) {
  const compileState = normalizeText(rawDocumentResult?.compileState).toLowerCase();
  if (compileState === "blocked") {
    return {
      title: "Not direct source",
      body: "The source document is not directly executable Lœgos. Diagnostics are available below, and the structural read continues through interpretation.",
    };
  }

  if (compileState === "clean") {
    return {
      title: "Direct source compiled",
      body: "The source document compiled as provided. This is admission control, not proof.",
    };
  }

  if (compileState === "not_run") {
    return {
      title: "No raw compile run",
      body: "No raw compile was executed for this document.",
    };
  }

  return {
    title: "Admission control is provisional",
    body: "The raw source result is available for inspection below.",
  };
}

function buildInterpretationSummary(compilerRead = null) {
  const translatedSubsetResult = compilerRead?.translatedSubsetResult || null;
  const limitationClass = normalizeText(compilerRead?.limitationClass);
  const outcomeClass = normalizeText(compilerRead?.outcomeClass);

  if (outcomeClass === "direct_source_compiled") {
    return "This document already compiled directly as source, so no translated subset was needed in this read.";
  }

  if (translatedSubsetResult?.present) {
    return translatedSubsetResult.translationStrategy || "A lawful subset was translated and checked.";
  }

  if (limitationClass === "compiler_gap") {
    return "No lawful subset was carried because the current language cannot represent the central structure honestly yet.";
  }

  if (limitationClass === "translation_loss") {
    return "No lawful subset was carried because the current translation would flatten too much of the document’s meaning.";
  }

  if (limitationClass === "out_of_scope") {
    return "This document remains outside the current language boundary and stays informative only.";
  }

  if (outcomeClass === "raw_not_direct_source") {
    return "The structural read remains open, but no lawful subset was established in this run.";
  }

  return "No lawful subset was translated in this read.";
}

function buildEmbeddedSummary(embeddedExecutableResult = null) {
  const compileState = normalizeText(embeddedExecutableResult?.compileState).toLowerCase();
  const detectionMethod = sentenceCase(embeddedExecutableResult?.detectionMethod || "fenced block");

  if (compileState === "clean") {
    return {
      title: "Direct program found",
      body: `This document already contains executable \`.loe\` detected via ${detectionMethod}.`,
    };
  }

  return {
    title: "Embedded program candidate",
    body: `This document contains an embedded \`.loe\` candidate detected via ${detectionMethod}, but it did not compile cleanly in this read.`,
  };
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
  const rawDocumentResult = compilerRead?.rawDocumentResult || null;
  const translatedSubsetResult = compilerRead?.translatedSubsetResult || null;
  const embeddedExecutableResult = compilerRead?.embeddedExecutableResult || null;
  const omittedClaims = Array.isArray(translatedSubsetResult?.omittedClaims)
    ? translatedSubsetResult.omittedClaims
    : [];
  const omittedClaimDetails = omittedClaims
    .map((claimId) => claimSet.find((claim) => claim.id === claimId))
    .filter(Boolean);
  const admissionSummary = buildAdmissionSummary(rawDocumentResult);
  const interpretationSummary = buildInterpretationSummary(compilerRead);
  const diagnostics = [
    ...buildLayerDiagnostics("Raw source", rawDocumentResult),
    ...buildLayerDiagnostics("Translated subset", translatedSubsetResult),
    ...buildLayerDiagnostics("Embedded program", embeddedExecutableResult),
  ];
  const rawSecondaryTrusted = Boolean(rawDocumentResult?.secondaryRuntimeTrusted);
  const embeddedSummary = buildEmbeddedSummary(embeddedExecutableResult);

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
            <div className={styles.compilerReadCard} data-testid="dream-compiler-read-admission">
              <Kicker tone="neutral">Admission control</Kicker>
              <strong>{admissionSummary.title}</strong>
              <p>{admissionSummary.body}</p>
              <div className={styles.compilerReadChips}>
                <SignalChip tone="neutral">
                  {sentenceCase(rawDocumentResult?.compileState || "unknown")}
                </SignalChip>
                {!rawSecondaryTrusted ? (
                  <SignalChip tone="neutral">Not direct source</SignalChip>
                ) : (
                  <>
                    <SignalChip tone="neutral">
                      {sentenceCase(rawDocumentResult?.runtimeState || "open")}
                    </SignalChip>
                    <SignalChip tone="neutral">
                      {sentenceCase(rawDocumentResult?.mergedWindowState || "open")}
                    </SignalChip>
                  </>
                )}
              </div>
            </div>

            <div className={styles.compilerReadCard} data-testid="dream-compiler-read-interpretation">
              <Kicker tone="neutral">Structural interpretation</Kicker>
              <strong>{compilerRead?.verdict?.primaryFinding || "No primary finding yet."}</strong>
              <p>{interpretationSummary}</p>
              <div className={styles.compilerReadChips}>
                <SignalChip tone="neutral">
                  {sentenceCase(compilerRead?.documentSummary?.documentType || "mixed")}
                </SignalChip>
                <SignalChip tone="neutral">
                  {sentenceCase(compilerRead?.outcomeClass || "mixed")}
                </SignalChip>
                {compilerRead?.limitationClass ? (
                  <SignalChip tone="neutral">
                    {sentenceCase(compilerRead.limitationClass)}
                  </SignalChip>
                ) : null}
                {compilerRead?.outcomeClass === "direct_source_compiled" ? (
                  <SignalChip tone="neutral">Direct source</SignalChip>
                ) : translatedSubsetResult?.present ? (
                  <SignalChip tone="neutral">
                    {sentenceCase(translatedSubsetResult?.mergedWindowState || "unknown")}
                  </SignalChip>
                ) : (
                  <SignalChip tone="neutral">No lawful subset</SignalChip>
                )}
              </div>
            </div>

            {embeddedExecutableResult?.present ? (
              <div className={styles.compilerReadCard} data-testid="dream-compiler-read-embedded">
                <Kicker tone="neutral">Embedded executable</Kicker>
                <strong>{embeddedSummary.title}</strong>
                <p>{embeddedSummary.body}</p>
                <div className={styles.compilerReadChips}>
                  <SignalChip tone="neutral">
                    {sentenceCase(embeddedExecutableResult?.compileState || "unknown")}
                  </SignalChip>
                  <SignalChip tone="neutral">
                    {sentenceCase(embeddedExecutableResult?.mergedWindowState || "unknown")}
                  </SignalChip>
                </div>
              </div>
            ) : null}
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

          <div className={styles.compilerReadSection} data-testid="dream-compiler-read-omitted">
            <div className={styles.compilerReadSectionHead}>
              <Kicker tone="neutral">Omitted material</Kicker>
              <span>Claims intentionally left outside the translated subset.</span>
            </div>
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

          <div className={styles.compilerReadSection} data-testid="dream-compiler-read-diagnostics">
            <div className={styles.compilerReadSectionHead}>
              <Kicker tone="neutral">Diagnostics</Kicker>
              <span>Admission-control and compiler output remain inspectable.</span>
            </div>
            {diagnostics.length ? (
              <ul className={styles.compilerReadList}>
                {diagnostics.map((diagnostic) => (
                  <li key={diagnostic.key}>
                    <strong>{diagnostic.label}</strong>: {diagnostic.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No compiler diagnostics were emitted in this read.</p>
            )}
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
                <Kicker tone="neutral">Raw source summary</Kicker>
                <ul className={styles.compilerReadList}>
                  <li>Compile state: {sentenceCase(rawDocumentResult?.compileState || "unknown")}</li>
                  <li>
                    Secondary runtime trusted: {rawSecondaryTrusted ? "Yes" : "No"}
                  </li>
                  <li>Runtime state: {sentenceCase(rawDocumentResult?.runtimeState || "unknown")}</li>
                  <li>
                    Merged window state: {sentenceCase(rawDocumentResult?.mergedWindowState || "unknown")}
                  </li>
                </ul>
              </div>

              <div className={styles.compilerReadInspectBlock}>
                <Kicker tone="neutral">Generated .loe subset</Kicker>
                <pre>{translatedSubsetResult?.source || "# No lawful subset translated in this read."}</pre>
              </div>

              <div className={styles.compilerReadInspectBlock}>
                <Kicker tone="neutral">Translated subset summary</Kicker>
                <ul className={styles.compilerReadList}>
                  <li>Present: {translatedSubsetResult?.present ? "Yes" : "No"}</li>
                  <li>
                    Compile state: {sentenceCase(translatedSubsetResult?.compileState || "not_run")}
                  </li>
                  <li>
                    Runtime state: {sentenceCase(translatedSubsetResult?.runtimeState || "not_run")}
                  </li>
                  <li>
                    Merged window state: {sentenceCase(
                      translatedSubsetResult?.mergedWindowState || "not_run",
                    )}
                  </li>
                </ul>
              </div>

              {embeddedExecutableResult?.present ? (
                <div className={styles.compilerReadInspectBlock}>
                  <Kicker tone="neutral">Embedded executable source</Kicker>
                  <pre>{embeddedExecutableResult.source}</pre>
                </div>
              ) : null}
            </div>
          </details>
        </>
      ) : null}
    </section>
  );
}
