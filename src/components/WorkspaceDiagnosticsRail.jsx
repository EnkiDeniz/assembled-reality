import {
  BoxMetric,
  ConvergenceBar,
  SettlementHex,
  ShapeGlyph,
  SignalChip,
} from "@/components/LoegosSystem";
import { buildWorkspaceBlockProvenanceView } from "@/lib/workspace-provenance";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

function getDiagnosticTone(level = "") {
  const normalized = String(level || "").trim().toLowerCase();
  if (normalized === "error") return "alert";
  if (normalized === "warn") return "active";
  if (normalized === "success") return "clear";
  return "neutral";
}

function uniqueDiagnostics(items = []) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    const key = `${item?.code || ""}:${item?.targetId || ""}:${item?.message || ""}`;
    if (!key.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatConvergenceState(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "hallucinating") return "Hallucinating";
  if (normalized === "divergent") return "Divergent";
  if (normalized === "convergent") return "Convergent";
  return value;
}

function getTrustRank(level = "") {
  const normalized = String(level || "").trim().toUpperCase();
  if (normalized === "L3") return 3;
  if (normalized === "L2") return 2;
  return 1;
}

function toPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.round(numeric));
}

function DiagnosticsList({ items = [], emptyMessage = "No findings.", blockMap = null, documents = [] }) {
  return (
    <div className="loegos-diagnostics__list">
      {items.length ? (
        items.map((item, index) => {
          const targetBlock =
            blockMap instanceof Map ? blockMap.get(String(item?.targetId || "").trim()) || null : null;
          const provenance = targetBlock
            ? buildWorkspaceBlockProvenanceView(targetBlock, documents)
            : null;

          return (
            <article key={`${item?.code || "diagnostic"}-${item?.targetId || index}`} className="loegos-diagnostics__item">
              <div className="loegos-diagnostics__item-head">
                <SignalChip tone={getDiagnosticTone(item?.level)} subtle>
                  {item?.level || "info"}
                </SignalChip>
                {item?.code ? (
                  <span className="loegos-diagnostics__item-code">{item.code}</span>
                ) : null}
              </div>
              <p className="loegos-diagnostics__item-message">{item?.message || ""}</p>
              {provenance ? (
                <p className="loegos-diagnostics__item-target">
                  {provenance.label} · {provenance.compact}
                </p>
              ) : null}
              {item?.detail ? (
                <p className="loegos-diagnostics__item-detail">{item.detail}</p>
              ) : null}
            </article>
          );
        })
      ) : (
        <p className="loegos-diagnostics__empty">{emptyMessage}</p>
      )}
    </div>
  );
}

function PreflightRow({ label, status = "neutral", detail = "" }) {
  const ok = status === "clear";
  return (
    <div className="loegos-diagnostics__check">
      <div className="loegos-diagnostics__check-copy">
        <span className="loegos-diagnostics__check-label">{label}</span>
        {detail ? <span className="loegos-diagnostics__check-detail">{detail}</span> : null}
      </div>
      <SignalChip tone={ok ? "clear" : status === "blocked" ? "alert" : "active"} subtle>
        {ok ? "pass" : status === "blocked" ? "blocked" : "watch"}
      </SignalChip>
    </div>
  );
}

function OperateRead({ result = null, pending = false, errorMessage = "" }) {
  if (pending && !result) {
    return <p className="loegos-diagnostics__empty">Operate is reading this box.</p>;
  }

  if (errorMessage) {
    const isRateLimited = String(errorMessage).includes("429");
    return (
      <article className="loegos-diagnostics__callout is-alert" role="alert">
        <strong>{isRateLimited ? "Operate is rate-limited." : "Operate could not finish."}</strong>
        <p>
          {isRateLimited
            ? "The box stayed intact. Wait for capacity, then retry once."
            : errorMessage}
        </p>
      </article>
    );
  }

  if (!result) {
    return (
      <p className="loegos-diagnostics__empty">
        Run Operate to get a compiler-style read of the current box.
      </p>
    );
  }

  return (
    <div className="loegos-diagnostics__operate">
      <div className="loegos-diagnostics__operate-grid">
        <BoxMetric label="Convergence" value={formatConvergenceState(result.convergence)} detail={`${result.gradient}/7 gradient`} />
        <BoxMetric label="Trust" value={`${result.trustFloor}-${result.trustCeiling}`} detail={`${result.includedSourceCount || 0} sources in scope`} />
      </div>
      <div className="loegos-diagnostics__sentences">
        {[
          ["Aim", result.aim],
          ["Ground", result.ground],
          ["Bridge", result.bridge],
        ].map(([label, sentence]) => (
          <article key={label} className="loegos-diagnostics__sentence">
            <span className="loegos-diagnostics__sentence-label">{label}</span>
            <p className="loegos-diagnostics__sentence-text">{sentence?.sentence || ""}</p>
            {sentence?.rationale ? (
              <p className="loegos-diagnostics__sentence-detail">{sentence.rationale}</p>
            ) : null}
          </article>
        ))}
      </div>
      {result?.nextMove ? (
        <article className="loegos-diagnostics__callout">
          <strong>Next move</strong>
          <p>{result.nextMove}</p>
        </article>
      ) : null}
    </div>
  );
}

function BuildOutputCard({
  receiptSummary = null,
  onOpenReceipts,
  onDraftReceipt,
  onSealLatestDraft,
  receiptPending = false,
  operateReady = false,
}) {
  const latestDraft = receiptSummary?.latestDraft || null;
  const latestStatus = receiptSummary?.latestDraftStatusLabel || "No draft yet";

  return (
    <div className="loegos-diagnostics__build">
      <article className="loegos-diagnostics__build-card">
        <div className="loegos-diagnostics__build-head">
          <span className="loegos-diagnostics__build-label">Compiled output</span>
          <SignalChip
            tone={latestDraft?.status === "SEALED" ? "clear" : latestDraft ? "active" : "neutral"}
            subtle
          >
            {latestStatus}
          </SignalChip>
        </div>
        <strong className="loegos-diagnostics__build-title">
          {latestDraft?.title || "No sealed receipt yet"}
        </strong>
        <p className="loegos-diagnostics__build-detail">
          {latestDraft?.payload?.decision ||
            latestDraft?.payload?.learned ||
            latestDraft?.interpretation ||
            "Receipts leave the editor as build output. They can be inspected or flagged, but they do not collapse back into draft cards."}
        </p>
        <div className="loegos-diagnostics__actions">
          <button type="button" className="terminal-button" onClick={onOpenReceipts}>
            Open receipts
          </button>
          <button
            type="button"
            className="terminal-button"
            onClick={onDraftReceipt}
            disabled={!operateReady || receiptPending}
          >
            {receiptPending ? "Saving…" : "Draft receipt"}
          </button>
          {latestDraft && latestDraft.status !== "SEALED" ? (
            <button
              type="button"
              className="terminal-button is-primary"
              onClick={() => onSealLatestDraft?.(latestDraft)}
              disabled={receiptPending}
            >
              Seal latest
            </button>
          ) : null}
        </div>
      </article>
    </div>
  );
}

export default function WorkspaceDiagnosticsRail({
  formalState = null,
  blocks = [],
  documents = [],
  sealCheck = null,
  operateResult = null,
  operatePending = false,
  operateError = "",
  receiptSummary = null,
  receiptPending = false,
  confirmationCount = 0,
  clipboardCount = 0,
  stagedCount = 0,
  thread = null,
  documentTitle = "",
  inputValue = "",
  pendingInput = false,
  inputError = "",
  suggestions = [],
  onInputChange,
  onSubmit,
  onSuggestion,
  onStageMessage,
  onRunOperate,
  onOpenReceipts,
  onDraftReceipt,
  onSealLatestDraft,
}) {
  const primaryCard = formalState?.primaryCard || null;
  const hex = primaryCard?.hex || { edges: [], settlementStage: 0, greenEdgeCount: 0 };
  const formalBlocks = Array.isArray(formalState?.blocks) ? formalState.blocks : [];
  const blockMap = Array.isArray(blocks)
    ? new Map(
        blocks
          .filter(Boolean)
          .map((block) => [String(block?.id || "").trim(), block]),
      )
    : new Map();
  const depthReady = formalBlocks.some((block) => Number(block?.depth || 0) >= 3);
  const evidenceReady = Boolean(primaryCard?.realityBlockCount > 0);
  const messages = Array.isArray(thread?.messages) ? thread.messages.slice(-3) : [];
  const blockingDiagnostics = uniqueDiagnostics([
    ...(sealCheck?.errors || []),
    ...(formalState?.diagnostics?.errors || []),
  ]);
  const parseDiagnostics = uniqueDiagnostics([
    ...(formalState?.diagnostics?.shadowTypes || []),
    ...(formalState?.diagnostics?.warnings || []),
    ...(formalState?.diagnostics?.infos || []),
  ]);
  const edgeMap = Array.isArray(hex?.edges) ? hex.edges : [];
  const preflightChecks = [
    {
      key: "weld",
      label: "Weld exists",
      status: primaryCard?.derivedWeldAvailable ? "clear" : "blocked",
      detail: primaryCard?.derivedWeldAvailable
        ? "Aim and reality are both in scope."
        : "Seal requires a weld with both aim and reality.",
    },
    {
      key: "convergence",
      label: "Convergence threshold",
      status: Number(sealCheck?.cardConvergencePercent || primaryCard?.convergencePercent || 0) >= 70 ? "clear" : "blocked",
      detail: `${toPercent(sealCheck?.cardConvergencePercent || primaryCard?.convergencePercent)}% in the current box.`,
    },
    {
      key: "trust",
      label: "Trust floor",
      status: getTrustRank(sealCheck?.trustFloor || primaryCard?.trustFloor || "L1") >= 2 ? "clear" : "blocked",
      detail: `${sealCheck?.trustFloor || primaryCard?.trustFloor || "L1"} minimum.`,
    },
    {
      key: "depth",
      label: "Depth requirement",
      status: depthReady ? "clear" : "watch",
      detail: depthReady
        ? "At least one block has moved into proved depth."
        : "The box still reads as early-stage material.",
    },
    {
      key: "evidence",
      label: "Evidence chain",
      status: evidenceReady ? "clear" : "blocked",
      detail: evidenceReady
        ? "Reality is attached and traceable."
        : "Add reality evidence before sealing.",
    },
  ];

  return (
    <aside className="loegos-diagnostics" aria-label="Box diagnostics">
      <div className="loegos-diagnostics__header">
        <div className="loegos-diagnostics__copy">
          <span className="loegos-diagnostics__eyebrow">Compiler</span>
          <h2 className="loegos-diagnostics__title">Debugger + build state</h2>
          <p className="loegos-diagnostics__detail">
            Preflight, contradictions, Operate, and build output stay beside the open artifact.
          </p>
        </div>
        <div className="loegos-diagnostics__header-meta">
          <SettlementHex stageCount={hex?.settlementStage || 0} label={`stage ${hex?.settlementStage || 0}`} />
          <div className="loegos-diagnostics__header-chips">
            <SignalChip tone={sealCheck?.canSeal ? "clear" : blockingDiagnostics.length ? "alert" : "active"}>
              {sealCheck?.canSeal ? "ready to seal" : blockingDiagnostics.length ? "blocked" : "needs work"}
            </SignalChip>
            {confirmationCount > 0 ? (
              <SignalChip tone="active" subtle>{confirmationCount} confirmations</SignalChip>
            ) : null}
          </div>
        </div>
      </div>

      <section className="loegos-diagnostics__section">
        <div className="loegos-diagnostics__section-head">
          <span>1. Seal preflight</span>
          {sealCheck?.summary ? <span>{sealCheck.summary}</span> : null}
        </div>
        <div className="loegos-diagnostics__checks">
          {preflightChecks.map((check) => (
            <PreflightRow
              key={check.key}
              label={check.label}
              status={check.status}
              detail={check.detail}
            />
          ))}
        </div>
        <div className="loegos-diagnostics__actions">
          <button
            type="button"
            className="terminal-button is-primary"
            onClick={onRunOperate}
            disabled={operatePending}
          >
            {operatePending ? "Compiling…" : "Run Operate"}
          </button>
          <button type="button" className="terminal-button" onClick={onOpenReceipts}>
            Open receipts
          </button>
        </div>
      </section>

      <section className="loegos-diagnostics__section">
        <div className="loegos-diagnostics__section-head">
          <span>2. Blocking contradictions</span>
          <span>{blockingDiagnostics.length}</span>
        </div>
        <DiagnosticsList
          items={blockingDiagnostics}
          blockMap={blockMap}
          documents={documents}
          emptyMessage="No blocking contradictions are active."
        />
      </section>

      <section className="loegos-diagnostics__section">
        <div className="loegos-diagnostics__section-head">
          <span>3. Shape + parse issues</span>
          <span>{parseDiagnostics.length}</span>
        </div>
        <DiagnosticsList
          items={parseDiagnostics}
          blockMap={blockMap}
          documents={documents}
          emptyMessage="No shadow types or parse warnings are active."
        />
      </section>

      <section className="loegos-diagnostics__section">
        <div className="loegos-diagnostics__section-head">
          <span>4. Convergence + Operate</span>
          <span>{toPercent(primaryCard?.convergencePercent)}%</span>
        </div>
        <ConvergenceBar
          left={primaryCard?.aimBlockCount || 0}
          middle={primaryCard?.realityBlockCount || 0}
          right={Math.max(primaryCard?.weldBlockCount || 0, primaryCard?.alignmentPairCount || 0)}
          className="loegos-diagnostics__convergence"
        />
        <OperateRead result={operateResult} pending={operatePending} errorMessage={operateError} />
      </section>

      <section className="loegos-diagnostics__section">
        <div className="loegos-diagnostics__section-head">
          <span>5. Trust / depth / settlement</span>
          <span>{hex?.greenEdgeCount || 0}/6 edges</span>
        </div>
        <div className="loegos-diagnostics__metrics">
          <BoxMetric label="Trust floor" value={primaryCard?.trustFloor || "L1"} detail={primaryCard?.trustCeiling ? `ceiling ${primaryCard.trustCeiling}` : ""} />
          <BoxMetric label="Depth ready" value={depthReady ? "yes" : "early"} detail={`${formalBlocks.length} typed block${formalBlocks.length === 1 ? "" : "s"}`} />
          <BoxMetric label="In stage" value={clipboardCount + stagedCount} detail="Unresolved assembly state" />
        </div>
        <div className="loegos-diagnostics__edge-list">
          {edgeMap.map((edge) => (
            <div key={edge.id} className="loegos-diagnostics__edge">
              <div className="loegos-diagnostics__edge-copy">
                <span className="loegos-diagnostics__edge-label">{edge.label}</span>
                <span className="loegos-diagnostics__edge-detail">{edge.percent}%</span>
              </div>
              <SignalChip tone={edge.signal} subtle>{edge.signal}</SignalChip>
            </div>
          ))}
        </div>
      </section>

      <section className="loegos-diagnostics__section loegos-diagnostics__section--build">
        <div className="loegos-diagnostics__section-head">
          <span>Build output</span>
          <span>{receiptSummary?.draftCount || 0}</span>
        </div>
        <BuildOutputCard
          receiptSummary={receiptSummary}
          onOpenReceipts={onOpenReceipts}
          onDraftReceipt={onDraftReceipt}
          onSealLatestDraft={onSealLatestDraft}
          receiptPending={receiptPending}
          operateReady={Boolean(operateResult)}
        />
      </section>

      <section className="loegos-diagnostics__section loegos-diagnostics__section--seven">
        <div className="loegos-diagnostics__section-head">
          <span>Seven</span>
          <span>{documentTitle || "Current box"}</span>
        </div>
        {messages.length ? (
          <div className="loegos-diagnostics__thread">
            {messages.map((message) => {
              const assistant = message?.role === "assistant";
              return (
                <article
                  key={message.id}
                  className={joinClasses(
                    "loegos-diagnostics__thread-message",
                    assistant ? "is-assistant" : "is-user",
                  )}
                >
                  <div className="loegos-diagnostics__thread-head">
                    {assistant ? <ShapeGlyph shapeKey="weld" size={14} /> : null}
                    <span>{assistant ? "Seven" : "You"}</span>
                    {assistant && !message?.pending ? (
                      <button
                        type="button"
                        className="loegos-diagnostics__stage"
                        onClick={() => onStageMessage?.(message)}
                      >
                        Stage
                      </button>
                    ) : null}
                  </div>
                  <p className="loegos-diagnostics__thread-text">
                    {message?.pending ? "Thinking…" : message?.content || ""}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="loegos-diagnostics__empty">
            Seven stays inference-first here. Ask for a reroute, a contradiction trace, or a missing-evidence read.
          </p>
        )}
        {suggestions.length ? (
          <div className="loegos-diagnostics__suggestions">
            {suggestions.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="loegos-diagnostics__suggestion"
                onClick={() => onSuggestion?.(suggestion)}
                disabled={pendingInput}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
        {inputError ? <p className="loegos-diagnostics__error">{inputError}</p> : null}
        <div className="loegos-diagnostics__composer">
          <textarea
            className="loegos-diagnostics__input"
            value={inputValue}
            onChange={(event) => onInputChange?.(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit?.();
              }
            }}
            placeholder={pendingInput ? "Seven is reading…" : "Ask Seven to diagnose the current box…"}
            disabled={pendingInput}
            rows={3}
          />
          <button
            type="button"
            className="terminal-button"
            onClick={() => onSubmit?.()}
            disabled={!String(inputValue || "").trim() || pendingInput}
          >
            {pendingInput ? "Reading…" : "Ask Seven"}
          </button>
        </div>
      </section>
    </aside>
  );
}
