"use client";

import { useSyncExternalStore } from "react";
import { Kicker, SignalChip } from "@/components/shell/LoegosShell";
import styles from "@/components/dream/SectionDreamScreen.module.css";

const SELF_CHECK_KEY = "assembled-reality:compiler-read-self-check:v1";

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
      body: "The source document is not directly executable Lœgos. The read stays provisional.",
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
    body: "The raw source result is available for inspection.",
  };
}

function buildInterpretationSummary(compilerRead = null) {
  const translatedSubsetResult = compilerRead?.translatedSubsetResult || null;
  const limitationClass = normalizeText(compilerRead?.limitationClass);
  const outcomeClass = normalizeText(compilerRead?.outcomeClass);

  if (outcomeClass === "direct_source_compiled") {
    return "This document already compiled directly as source, so no translated subset was needed.";
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

function isMeaningfulCompilerRead(compilerRead = null) {
  if (!compilerRead) return false;
  const claimCount = Array.isArray(compilerRead?.claimSet) ? compilerRead.claimSet.length : 0;
  const nextMoveCount = Array.isArray(compilerRead?.nextMoves) ? compilerRead.nextMoves.length : 0;
  return Boolean(
    claimCount ||
      nextMoveCount ||
      normalizeText(compilerRead?.verdict?.primaryFinding) ||
      normalizeText(compilerRead?.documentSummary?.documentType),
  );
}

function getSelfCheckStorageKey(documentId = "") {
  return `${SELF_CHECK_KEY}:${normalizeText(documentId) || "unknown"}`;
}

function loadSelfCheck(documentId = "") {
  if (typeof window === "undefined" || !normalizeText(documentId)) return "";
  try {
    return normalizeText(window.localStorage.getItem(getSelfCheckStorageKey(documentId)));
  } catch {
    return "";
  }
}

function saveSelfCheck(documentId = "", value = "") {
  if (typeof window === "undefined" || !normalizeText(documentId)) return;
  try {
    if (!normalizeText(value)) {
      window.localStorage.removeItem(getSelfCheckStorageKey(documentId));
      window.dispatchEvent(new CustomEvent("compiler-read-self-check-change", { detail: { documentId } }));
      return;
    }
    window.localStorage.setItem(getSelfCheckStorageKey(documentId), normalizeText(value));
    window.dispatchEvent(new CustomEvent("compiler-read-self-check-change", { detail: { documentId } }));
  } catch {
    // Ignore local persistence failures and keep the read usable.
  }
}

function subscribeToSelfCheck(documentId = "", callback = () => {}) {
  if (typeof window === "undefined" || !normalizeText(documentId)) {
    return () => {};
  }

  function handleStorage(event) {
    if (event.key && event.key !== getSelfCheckStorageKey(documentId)) return;
    callback();
  }

  function handleChange(event) {
    if (normalizeText(event?.detail?.documentId) !== normalizeText(documentId)) return;
    callback();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener("compiler-read-self-check-change", handleChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("compiler-read-self-check-change", handleChange);
  };
}

function CompilerReadSelfCheck({ documentId = "", compilerRead = null }) {
  const meaningful = isMeaningfulCompilerRead(compilerRead);
  const selectedValue = useSyncExternalStore(
    (callback) => subscribeToSelfCheck(documentId, callback),
    () => loadSelfCheck(documentId),
    () => "",
  );

  if (!meaningful) {
    return null;
  }

  const options = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "already_knew", label: "I already knew this" },
  ];

  return (
    <div className={styles.compilerReadSelfCheck} data-testid="dream-compiler-read-self-check">
      <div className={styles.compilerReadSectionHead}>
        <div className={styles.compilerReadIdentity}>
          <Kicker tone="neutral">Calibration</Kicker>
          <strong>Did this change your next move?</strong>
        </div>
      </div>
      <div className={styles.compilerReadSelfCheckButtons}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.compilerReadSelfCheckButton} ${selectedValue === option.value ? styles.compilerReadSelfCheckButtonActive : ""}`}
            onClick={() => {
              saveSelfCheck(documentId, option.value);
            }}
            data-testid={`dream-compiler-read-self-check-${option.value}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CompilerReadDetail({ compilerRead = null }) {
  if (!compilerRead) return null;

  const claimSet = Array.isArray(compilerRead?.claimSet) ? compilerRead.claimSet : [];
  const rawDocumentResult = compilerRead?.rawDocumentResult || null;
  const translatedSubsetResult = compilerRead?.translatedSubsetResult || null;
  const embeddedExecutableResult = compilerRead?.embeddedExecutableResult || null;
  const omittedClaims = Array.isArray(translatedSubsetResult?.omittedClaims)
    ? translatedSubsetResult.omittedClaims
    : [];
  const omittedClaimDetails = omittedClaims
    .map((claimId) => claimSet.find((claim) => claim.id === claimId))
    .filter(Boolean);
  const diagnostics = [
    ...buildLayerDiagnostics("Raw source", rawDocumentResult),
    ...buildLayerDiagnostics("Translated subset", translatedSubsetResult),
    ...buildLayerDiagnostics("Embedded program", embeddedExecutableResult),
  ];
  const embeddedSummary = buildEmbeddedSummary(embeddedExecutableResult);

  return (
    <div className={styles.compilerReadDetail} data-testid="dream-compiler-read-detail">
      <div className={styles.compilerReadSection} data-testid="dream-compiler-read-claims">
        <div className={styles.compilerReadSectionHead}>
          <div className={styles.compilerReadIdentity}>
            <Kicker tone="neutral">Claims</Kicker>
            <strong>What the read can currently ground</strong>
          </div>
        </div>
        {claimSet.length ? (
          <div className={styles.compilerReadClaimList}>
            {claimSet.map((claim) => (
              <article key={claim.id} className={styles.compilerReadClaim}>
                <div className={styles.compilerReadClaimHead}>
                  <strong>{claim.text || "Untitled claim"}</strong>
                  <div className={styles.compilerReadChips}>
                    {renderClaimMeta(claim).map((meta) => (
                      <SignalChip key={`${claim.id}:${meta}`} tone="neutral">
                        {meta}
                      </SignalChip>
                    ))}
                  </div>
                </div>
                {claim.sourceExcerpt ? (
                  <p className={styles.compilerReadExcerpt}>{claim.sourceExcerpt}</p>
                ) : null}
                {claim.reason ? <p>{claim.reason}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p>No structured claim set was produced in this run.</p>
        )}
      </div>

      {omittedClaimDetails.length ? (
        <div className={styles.compilerReadSection} data-testid="dream-compiler-read-omitted">
          <div className={styles.compilerReadSectionHead}>
            <div className={styles.compilerReadIdentity}>
              <Kicker tone="neutral">Omitted material</Kicker>
              <strong>What did not travel cleanly</strong>
            </div>
          </div>
          <div className={styles.compilerReadClaimList}>
            {omittedClaimDetails.map((claim) => (
              <article key={claim.id} className={styles.compilerReadClaim}>
                <div className={styles.compilerReadClaimHead}>
                  <strong>{claim.text || "Untitled claim"}</strong>
                </div>
                {claim.sourceExcerpt ? (
                  <p className={styles.compilerReadExcerpt}>{claim.sourceExcerpt}</p>
                ) : null}
                <p>{claim.reason || "This claim could not travel cleanly in the current subset."}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <details className={styles.compilerReadInspect} data-testid="dream-compiler-read-evidence">
        <summary>Show diagnostics and translation detail</summary>
        <div className={styles.compilerReadInspectBody}>
          {diagnostics.length ? (
            <div className={styles.compilerReadInspectBlock} data-testid="dream-compiler-read-diagnostics">
              <Kicker tone="neutral">Diagnostics</Kicker>
              <ul className={styles.compilerReadList}>
                {diagnostics.map((diagnostic) => (
                  <li key={diagnostic.key}>{diagnostic.label}: {diagnostic.text}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {translatedSubsetResult?.present ? (
            <div className={styles.compilerReadInspectBlock} data-testid="dream-compiler-read-inspect">
              <Kicker tone="neutral">Translated subset</Kicker>
              <p>{translatedSubsetResult.translationStrategy || "A lawful subset was carried."}</p>
              {translatedSubsetResult.source ? <pre>{translatedSubsetResult.source}</pre> : null}
            </div>
          ) : null}

          {embeddedExecutableResult?.present ? (
            <div className={styles.compilerReadInspectBlock} data-testid="dream-compiler-read-inspect">
              <Kicker tone="neutral">Embedded program</Kicker>
              <p>{embeddedSummary.body}</p>
              {embeddedExecutableResult.source ? <pre>{embeddedExecutableResult.source}</pre> : null}
            </div>
          ) : null}

          {rawDocumentResult ? (
            <div className={styles.compilerReadInspectBlock}>
              <Kicker tone="neutral">Admission control</Kicker>
              <p>{buildAdmissionSummary(rawDocumentResult).body}</p>
            </div>
          ) : null}
        </div>
      </details>
    </div>
  );
}

export default function CompilerReadPanel({
  documentId = "",
  compilerRead = null,
  pending = false,
  error = "",
  mode = "summary",
  onOpenInspect = null,
}) {
  if (!pending && !error && !compilerRead) {
    return null;
  }

  const claimSet = Array.isArray(compilerRead?.claimSet) ? compilerRead.claimSet : [];
  const nextMoves = Array.isArray(compilerRead?.nextMoves) ? compilerRead.nextMoves : [];
  const rawDocumentResult = compilerRead?.rawDocumentResult || null;
  const translatedSubsetResult = compilerRead?.translatedSubsetResult || null;
  const rawSecondaryTrusted = Boolean(rawDocumentResult?.secondaryRuntimeTrusted);
  const admissionSummary = buildAdmissionSummary(rawDocumentResult);
  const interpretationSummary = buildInterpretationSummary(compilerRead);
  const primaryFinding = compilerRead?.verdict?.primaryFinding || "No primary finding yet.";
  const nextMove = nextMoves[0] || "No concrete next move was proposed in this run.";
  const omittedCount = Array.isArray(translatedSubsetResult?.omittedClaims)
    ? translatedSubsetResult.omittedClaims.length
    : 0;

  if (mode === "detail") {
    return (
      <section
        className={styles.compilerReadPanel}
        data-testid="dream-compiler-read-panel"
        aria-live="polite"
      >
        <div className={styles.compilerReadHead}>
          <div className={styles.compilerReadIdentity}>
            <Kicker tone={error ? "flagged" : "brand"}>Compiler Read</Kicker>
            <strong>Claims first. Diagnostics on demand. Still provisional.</strong>
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
        <CompilerReadDetail compilerRead={compilerRead} />
      </section>
    );
  }

  return (
    <section
      className={styles.compilerReadPanel}
      data-testid="dream-compiler-read-panel"
      aria-live="polite"
    >
      <div className={styles.compilerReadHead}>
        <div className={styles.compilerReadIdentity}>
          <Kicker tone={error ? "flagged" : "brand"}>Compiler Read</Kicker>
          <strong>What this is, what it means now, and what to do next.</strong>
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
          <div className={styles.compilerReadSummaryLead} data-testid="dream-compiler-read-summary">
            <div className={styles.compilerReadCard}>
              <Kicker tone="neutral">Finding</Kicker>
              <strong>{primaryFinding}</strong>
              <p>{interpretationSummary}</p>
            </div>
            <div className={styles.compilerReadCard} data-testid="dream-compiler-read-next-moves">
              <Kicker tone="neutral">Next move</Kicker>
              <strong>{nextMove}</strong>
              <p>{admissionSummary.title}. {admissionSummary.body}</p>
            </div>
          </div>

          <div className={styles.compilerReadChips}>
            <SignalChip tone="neutral">{sentenceCase(compilerRead?.documentSummary?.documentType || "mixed")}</SignalChip>
            <SignalChip tone="neutral">{claimSet.length} claims</SignalChip>
            <SignalChip tone="neutral">{omittedCount} omitted</SignalChip>
            {rawSecondaryTrusted ? (
              <SignalChip tone="neutral">{sentenceCase(rawDocumentResult?.runtimeState || "open")}</SignalChip>
            ) : (
              <SignalChip tone="neutral">Not direct source</SignalChip>
            )}
          </div>

          {onOpenInspect ? (
            <div className={styles.compilerReadActionRow}>
              <button
                type="button"
                className={styles.compilerReadInspectButton}
                onClick={onOpenInspect}
                data-testid="dream-compiler-read-open-inspect"
              >
                Inspect claims and diagnostics
              </button>
            </div>
          ) : null}

          <CompilerReadSelfCheck documentId={documentId} compilerRead={compilerRead} />
        </>
      ) : null}
    </section>
  );
}
