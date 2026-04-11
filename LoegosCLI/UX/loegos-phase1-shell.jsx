"use client";

import { useEffect, useRef, useState } from "react";
import { compileSource } from "../packages/compiler/src/index.mjs";
import {
  buildBoxSectionsFromArtifact,
  buildScopedEntries,
  clauseSummary,
  deriveEntrySignalProfile,
  deriveFreshnessState,
  deriveLatestQualifiedReturnAt,
  derivePaneInteractionContract,
  extractClausesByHead,
  formatAgeLabel,
  getClauseKeyword,
  getLastReturnClause,
  mapMergedStateForField,
  deriveDistantEchoSignal,
  buildEchoFieldModel,
  splitDiagnostics,
} from "./lib/artifact-view-model.mjs";
import { applySevenProposalGate } from "./lib/proposal-gate.mjs";
import { fetchSevenProposal } from "./lib/seven-proposal-client.mjs";
import { importSourceLink, pasteSource, uploadSources } from "./lib/intake-adapter.mjs";
import {
  loadListeningSession,
  requestVoiceAudio,
  saveListeningSession,
} from "./lib/voice-player-adapter.mjs";
import {
  appendEvent,
  appendReceipt,
  applyClosureState,
  createWindowState,
} from "../packages/runtime/src/index.mjs";

const TOKENS = {
  bg: "var(--loegos-ground)",
  bgDark: "var(--loegos-ground)",
  card: "var(--loegos-surface-1)",
  cardDark: "var(--loegos-surface-1)",
  text: "var(--loegos-text-primary)",
  textDark: "var(--loegos-text-primary)",
  muted: "var(--loegos-text-secondary)",
  border: "var(--loegos-line)",
  borderDark: "var(--loegos-line)",
  accent: "var(--loegos-brand)",
  error: "var(--loegos-signal-alert)",
  warn: "var(--loegos-signal-active)",
  success: "var(--loegos-signal-clear)",
  attested: "var(--loegos-brand-muted)",
  mono: "var(--font-code)",
  sans: "var(--font-ui)",
};

const BADGE_COLORS = {
  shape_error: TOKENS.error,
  flagged: TOKENS.error,
  awaiting: TOKENS.accent,
  attested: TOKENS.attested,
  rerouted: TOKENS.warn,
  stopped: TOKENS.muted,
  sealed: TOKENS.success,
  open: TOKENS.muted,
};

const FIELD_COLORS = {
  mapped: {
    accent: TOKENS.success,
    bg: "var(--loegos-surface-2)",
    border: "var(--loegos-line)",
  },
  fog: {
    accent: TOKENS.warn,
    bg: "var(--loegos-surface-2)",
    border: "var(--loegos-line)",
  },
  fractured: {
    accent: TOKENS.error,
    bg: "var(--loegos-surface-2)",
    border: "var(--loegos-line)",
  },
  awaiting: {
    accent: TOKENS.accent,
    bg: "var(--loegos-surface-2)",
    border: "var(--loegos-line)",
  },
};

const RANGE_LEVELS = [
  { key: "box", label: "Level 1 - Single Box" },
  { key: "domain", label: "Level 2 - Domain" },
  { key: "field", label: "Level 3 - Full Field" },
  { key: "shared", label: "Level 4 - Shared Field" },
];

function toIdentifier(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

function getStorageKey(projectKey = "", documentKey = "") {
  return `loegos-phase2:${String(projectKey || "project").trim()}:${String(documentKey || "doc").trim()}`;
}

function getRangeStorageKey(projectKey = "", documentKey = "") {
  return `loegos-phase2:range:${String(projectKey || "project").trim()}:${String(documentKey || "doc").trim()}`;
}

function getUtilityStorageKey(projectKey = "", documentKey = "") {
  return `loegos-phase2:utility:${String(projectKey || "project").trim()}:${String(documentKey || "doc").trim()}`;
}

function buildDefaultSourceFromBootstrap(bootstrap = {}) {
  const titleToken = toIdentifier(bootstrap?.documentTitle || "workspace_window") || "workspace_window";
  return `GND box @${titleToken}
DIR aim stabilize_phase2_shell
GND witness @initial_source from "${String(bootstrap?.documentTitle || "workspace").trim()}" with v_phase2
INT story compiler_truth_is_primary
MOV move validate_phase2_integration via manual
TST test mirror_and_editor_agree
`;
}

function buildImportedWitnessClause({ kind = "source", documentKey = "", label = "" } = {}) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const ref = toIdentifier(documentKey || `${kind}_${stamp}`) || `import_${stamp}`;
  const sourceLabel = String(label || documentKey || kind || "source").trim();
  return [
    `GND witness @${ref} from "${sourceLabel}" with v_${stamp}`,
    `INT story imported_${toIdentifier(kind || "source") || "source"}_evidence`,
  ].join("\n");
}

function applyArtifactToRuntimeWindow(previousWindow, artifact, eventMeta = null, previousArtifact = null) {
  let nextWindow = {
    ...(previousWindow || {}),
    state: artifact.mergedWindowState,
    updatedAt: new Date().toISOString(),
    compile: {
      compilationId: artifact.compilationId,
      diagnostics: artifact.diagnostics || [],
      summary: artifact.summary || { ok: false, hardErrorCount: 1, warningCount: 0 },
      closureVerb: artifact.closureType || null,
    },
  };

  if (eventMeta) {
    nextWindow = appendEvent(nextWindow, {
      kind: eventMeta.kind || "artifact_update",
      detail: eventMeta.detail || "",
      compilationId: artifact.compilationId,
      metadata: eventMeta.metadata || null,
    });
  }

  const previousReturnCount = extractClausesByHead(previousArtifact, "RTN").length;
  const nextReturnCount = extractClausesByHead(artifact, "RTN").length;
  if (nextReturnCount > previousReturnCount) {
    const latestReturnClause = getLastReturnClause(artifact);
    const via = getClauseKeyword(latestReturnClause, "via") || "unlabeled";
    nextWindow = appendEvent(nextWindow, {
      kind: "return_received",
      detail: `Echo returned via ${via}`,
      compilationId: artifact.compilationId,
      metadata: {
        provenance: via,
      },
    });
  }

  const distantEcho = deriveDistantEchoSignal(previousArtifact, artifact);
  if (distantEcho) {
    nextWindow = appendEvent(nextWindow, {
      kind: "distant_echo_arrived",
      detail: `Field ${distantEcho.previousFieldState} -> ${distantEcho.nextFieldState} via ${distantEcho.returnProvenance}`,
      compilationId: artifact.compilationId,
      metadata: {
        chainSummary: distantEcho.chainSummary,
        returnDelta: distantEcho.returnDelta,
      },
    });
  }

  if (artifact.closureType) {
    nextWindow = applyClosureState(nextWindow, artifact.closureType);
    const existingReceipt = (nextWindow.receipts || []).some(
      (receipt) => receipt.compilationId === artifact.compilationId && receipt.kind === artifact.closureType,
    );
    if (!existingReceipt) {
      nextWindow = appendReceipt(nextWindow, {
        kind: artifact.closureType,
        compilationId: artifact.compilationId,
        summary: `Closure ${artifact.closureType}`,
        diagnosticsSnapshot: artifact.diagnostics || [],
      });
    }
  }

  return nextWindow;
}

function buildRuntimeRecord(artifact, filename, previousWindow = null) {
  const baseWindow =
    previousWindow ||
    createWindowState({
      windowId: filename,
      filePath: filename,
      compileResult: artifact,
    });
  return applyArtifactToRuntimeWindow(baseWindow, artifact, null, null);
}

function buildInitialFiles(bootstrap = {}) {
  const providedFiles = Array.isArray(bootstrap?.files) ? bootstrap.files : [];
  if (providedFiles.length > 0) {
    return providedFiles
      .map((entry, index) => ({
        filename:
          String(entry?.filename || "").trim() ||
          `workspace-${index + 1}.loe`,
        source: String(entry?.source || "").trim(),
      }))
      .filter((entry) => entry.source);
  }

  return [
    {
      filename: "workspace-phase2.loe",
      source: buildDefaultSourceFromBootstrap(bootstrap),
    },
    {
      filename: "attest-sentinel.loe",
      source: `GND box @attest_sentinel
DIR aim preserve_auditability
GND witness @handoff from "phase2-handoff.md" with v_phase2
CLS attest unresolved_dependency if "Human attestation recorded during phase 2 integration"
`,
    },
  ];
}

function hydrateSourcesFromBootstrap(bootstrap = {}) {
  const entries = {};
  const files = buildInitialFiles(bootstrap);
  files.forEach(({ filename, source }) => {
    const artifact = compileSource({ source, filename });
    entries[filename] = {
      filename,
      source,
      artifact,
      runtimeWindow: buildRuntimeRecord(artifact, filename),
      lastProposal: null,
      sourceDocuments: Array.isArray(bootstrap?.sourceDocuments)
        ? bootstrap.sourceDocuments
        : [],
    };
  });
  return entries;
}

function persistShellState(storageKey, state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Ignore storage failures to avoid blocking UI.
  }
}

function readPersistedShellState(storageKey) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function SectionCard({ title, items = [], accent = TOKENS.accent }) {
  return (
    <section className="phase2-card">
      <div className="phase2-card__title" style={{ color: accent }}>
        {title}
      </div>
      {items.length ? (
        items.map((item) => (
          <div key={`${title}-${item.line}-${item.text}`} className="phase2-card__line">
            {item.text}
          </div>
        ))
      ) : (
        <div className="phase2-card__empty">No entries yet.</div>
      )}
    </section>
  );
}

function mapSegmentDomainToRegion(domain = "") {
  const normalized = String(domain || "").trim().toLowerCase();
  if (normalized === "aim") return "aim";
  if (normalized === "evidence" || normalized === "ground") return "evidence";
  if (normalized === "story" || normalized === "interpretation") return "story";
  if (normalized === "move" || normalized === "test" || normalized === "action") return "action";
  return "";
}

function IconGlyph({ symbol = "•" }) {
  return <span className="phase2-icon-glyph" aria-hidden="true">{symbol}</span>;
}

function toWitnessRef(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "receipt_value";
}

function parseNumberCandidate(input = "") {
  const normalized = String(input || "").replace(/,/g, "");
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function derivePredictionResult(expected = "", actual = "") {
  const expectedText = String(expected || "").trim();
  const actualText = String(actual || "").trim();
  if (!expectedText || !actualText) return "surprised";
  const actualNumber = parseNumberCandidate(actualText);
  const rangeMatch = expectedText.match(/(-?\d+(\.\d+)?)\s*[-to]+\s*(-?\d+(\.\d+)?)/i);
  if (rangeMatch && actualNumber !== null) {
    const low = Number(rangeMatch[1]);
    const high = Number(rangeMatch[3]);
    if (Number.isFinite(low) && Number.isFinite(high)) {
      if (actualNumber >= Math.min(low, high) && actualNumber <= Math.max(low, high)) return "matched";
      return actualNumber < Math.min(low, high) || actualNumber > Math.max(low, high)
        ? "surprised"
        : "contradicted";
    }
  }
  const gteMatch = expectedText.match(/>=\s*(-?\d+(\.\d+)?)/);
  if (gteMatch && actualNumber !== null) {
    return actualNumber >= Number(gteMatch[1]) ? "matched" : "contradicted";
  }
  const lteMatch = expectedText.match(/<=\s*(-?\d+(\.\d+)?)/);
  if (lteMatch && actualNumber !== null) {
    return actualNumber <= Number(lteMatch[1]) ? "matched" : "contradicted";
  }
  return actualText.toLowerCase().includes(expectedText.toLowerCase().slice(0, 20))
    ? "matched"
    : "surprised";
}

function buildReceiptKitClause(kit, completedValue, completionKind) {
  const need = String(kit?.need || "missing witness").trim();
  const witnessRef = toWitnessRef(need);
  const safeValue = String(completedValue || "").replace(/"/g, "'");
  if (completionKind === "draft_message") {
    return `MOV move ${witnessRef} via manual`;
  }
  if (completionKind === "link") {
    return `GND witness @${witnessRef} from "${safeValue || "external_link"}" as score`;
  }
  if (completionKind === "upload") {
    return `GND witness @${witnessRef} from "${safeValue || "uploaded_file"}" with hash_pending`;
  }
  return `GND witness @${witnessRef} from "user_return" as score "${safeValue || "provided"}"`;
}

function SevenSegment({
  segment,
  index,
  messageIndex,
  openSegmentId,
  onToggle,
}) {
  const domain = String(segment?.domain || "neutral").trim().toLowerCase();
  const text = String(segment?.text || "").trim();
  const clause = String(segment?.suggestedClause || "").trim();
  const segmentId = `m${messageIndex}-s${index}`;
  const isOpen = openSegmentId === segmentId;
  const region = mapSegmentDomainToRegion(domain);
  const isTagged = Boolean(region) || Boolean(clause);

  if (!text) return null;

  return (
    <span className="phase2-segment-wrap">
      <button
        type="button"
        data-testid="phase2-seven-segment"
        className={`phase2-segment ${isOpen ? "is-open" : ""} ${isTagged ? "is-tagged" : ""}`}
        onClick={() => onToggle(segmentId, region)}
      >
        {text}
      </button>
      {isOpen && clause ? (
        <span className="phase2-segment__clause" data-testid="phase2-seven-segment-clause">
          {clause}
        </span>
      ) : null}
    </span>
  );
}

function ReceiptKitCard({ messageIndex, kit, onComplete }) {
  const [value, setValue] = useState("");
  const [compareActual, setCompareActual] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [checkItems, setCheckItems] = useState(() =>
    Array.isArray(kit?.artifact?.config?.items)
      ? kit.artifact.config.items.map((item) => ({ text: String(item || "").trim(), done: false }))
      : [],
  );
  const type = String(kit?.artifact?.type || "paste").trim();
  const cfg = kit?.artifact?.config || {};

  return (
    <div className="phase2-receipt-kit" data-testid="phase2-receipt-kit">
      <div className="phase2-card__title">Receipt Kit</div>
      <div className="phase2-card__line">Need: {kit?.need}</div>
      <div className="phase2-card__meta">Why: {kit?.why}</div>
      <div className="phase2-card__meta">Fastest: {kit?.fastestPath}</div>
      {type === "paste" ? (
        <div className="phase2-stack-gap">
          <input
            className="terminal-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={cfg.placeholder || "Paste value"}
            data-testid="phase2-receipt-paste-input"
          />
          <button
            type="button"
            className="terminal-button"
            onClick={() => onComplete(messageIndex, kit, "paste", value)}
            data-testid="phase2-receipt-paste-submit"
            disabled={!String(value).trim()}
          >
            Attach return
          </button>
        </div>
      ) : null}
      {type === "compare" ? (
        <div className="phase2-stack-gap">
          <div className="phase2-card__meta">Expected: {cfg.expected || kit?.prediction?.expected}</div>
          <input
            className="terminal-input"
            value={compareActual}
            onChange={(event) => setCompareActual(event.target.value)}
            placeholder={cfg.label || "Paste actual result"}
            data-testid="phase2-receipt-compare-input"
          />
          <button
            type="button"
            className="terminal-button"
            onClick={() => onComplete(messageIndex, kit, "compare", compareActual)}
            data-testid="phase2-receipt-compare-submit"
            disabled={!String(compareActual).trim()}
          >
            Compare expected vs actual
          </button>
        </div>
      ) : null}
      {type === "upload" ? (
        <div className="phase2-stack-gap">
          <input
            type="file"
            data-testid="phase2-receipt-upload-input"
            onChange={(event) => {
              const file = event?.target?.files?.[0];
              if (!file) return;
              setUploadName(file.name);
            }}
          />
          <button
            type="button"
            className="terminal-button"
            disabled={!uploadName}
            onClick={() => onComplete(messageIndex, kit, "upload", uploadName)}
            data-testid="phase2-receipt-upload-submit"
          >
            Log uploaded receipt
          </button>
        </div>
      ) : null}
      {type === "link" ? (
        <div className="phase2-stack-gap">
          <a className="phase2-link" href={cfg.url || "#"} target="_blank" rel="noreferrer">
            {cfg.label || "Open link"}
          </a>
          <button
            type="button"
            className="terminal-button"
            onClick={() => onComplete(messageIndex, kit, "link", cfg.url || cfg.label || "link_checked")}
            data-testid="phase2-receipt-link-done"
          >
            Mark link checked
          </button>
        </div>
      ) : null}
      {type === "draft_message" ? (
        <div className="phase2-stack-gap">
          <textarea
            className="terminal-input"
            rows={4}
            value={String(cfg.body || "")}
            readOnly
            data-testid="phase2-receipt-draft-body"
          />
          <div className="phase2-row">
            <button
              type="button"
              className="terminal-button"
              onClick={() => navigator?.clipboard?.writeText(String(cfg.body || ""))}
              data-testid="phase2-receipt-draft-copy"
            >
              Copy message
            </button>
            <button
              type="button"
              className="terminal-button"
              onClick={() => onComplete(messageIndex, kit, "draft_message", cfg.subject || "message_sent")}
              data-testid="phase2-receipt-draft-done"
            >
              Mark sent
            </button>
          </div>
        </div>
      ) : null}
      {type === "checklist" ? (
        <div className="phase2-stack-gap">
          {checkItems.map((item, index) => (
            <label key={`check-${index}`} className="phase2-settings-checkbox">
              <input
                type="checkbox"
                checked={Boolean(item.done)}
                onChange={(event) =>
                  setCheckItems((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, done: event.target.checked } : entry,
                    ),
                  )
                }
              />
              <span>{item.text}</span>
            </label>
          ))}
          <button
            type="button"
            className="terminal-button"
            onClick={() =>
              onComplete(
                messageIndex,
                kit,
                "checklist",
                checkItems
                  .filter((entry) => entry.done)
                  .map((entry) => entry.text)
                  .join("; "),
              )
            }
            data-testid="phase2-receipt-checklist-done"
          >
            Log checked items
          </button>
        </div>
      ) : null}
      <div className="phase2-card__meta">Enough: {kit?.enough}</div>
      <div className="phase2-card__meta">
        Prediction: {kit?.prediction?.expected} ({kit?.prediction?.direction}, {kit?.prediction?.timebound})
      </div>
      <div className="phase2-card__meta">Surprise condition: {kit?.prediction?.surprise}</div>
    </div>
  );
}

function EchoLegibilityPanel({ model }) {
  const fieldColors = FIELD_COLORS[model.fieldState] || FIELD_COLORS.fog;
  const echoRatioPercent = `${Math.round((Number(model.echoRatio) || 0) * 100)}%`;
  const pingLabel = model.pingSent ? "sent" : "not_sent";
  const waitingLabel = model.waiting ? "listening" : "no_pending_wait";
  const fogDensityLabel = String(model.fogDensity || "thick").toLowerCase();

  return (
    <section
      data-testid="phase2-echo-legibility"
      className="phase2-card phase2-echo-legibility"
      style={{ borderColor: fieldColors.border, background: fieldColors.bg }}
    >
      <div className="phase2-card__title" style={{ color: fieldColors.accent }}>
        Echo Field Legibility
      </div>
      <div className="phase2-echo-legibility__grid">
        <div>
          <div className="phase2-echo-legibility__label">Did I ping?</div>
          <div data-testid="phase2-ping-question">{pingLabel}</div>
        </div>
        <div>
          <div className="phase2-echo-legibility__label">Am I waiting?</div>
          <div data-testid="phase2-waiting-question">{waitingLabel}</div>
        </div>
        <div>
          <div className="phase2-echo-legibility__label">What came back, from where?</div>
          <div data-testid="phase2-return-question">{model.returnProvenance}</div>
        </div>
        <div>
          <div className="phase2-echo-legibility__label">How clear is this region?</div>
          <div data-testid="phase2-fog-question">{fogDensityLabel}</div>
        </div>
        <div>
          <div className="phase2-echo-legibility__label">field_state</div>
          <div data-testid="phase2-field-state" style={{ color: fieldColors.accent }}>
            {model.fieldState}
          </div>
        </div>
        <div>
          <div className="phase2-echo-legibility__label">echo_to_story</div>
          <div data-testid="phase2-echo-ratio">
            {model.echoCount}:{model.storyCount} ({echoRatioPercent})
          </div>
        </div>
        <div>
          <div className="phase2-echo-legibility__label">fog_density</div>
          <div data-testid="phase2-fog-density">{fogDensityLabel}</div>
        </div>
        <div>
          <div className="phase2-echo-legibility__label">return_provenance</div>
          <div data-testid="phase2-return-provenance">{model.returnProvenance}</div>
        </div>
      </div>
    </section>
  );
}

function PaneCard({ title, testId, accent = TOKENS.accent, lines = [] }) {
  return (
    <section data-testid={testId} className="phase2-card">
      <div className="phase2-card__title" style={{ color: accent }}>
        {title}
      </div>
      {lines.length ? (
        lines.map((line) => (
          <div key={`${title}-${line}`} className="phase2-pane__line">
            {line}
          </div>
        ))
      ) : (
        <div className="phase2-pane__empty">No signal yet.</div>
      )}
    </section>
  );
}

function IntakePanel({ projectKey, onStatus, onImported }) {
  const fileInputRef = useRef(null);
  const [pasteText, setPasteText] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [busy, setBusy] = useState("");

  async function handleUploadFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setBusy("upload");
    try {
      const result = await uploadSources({ files, projectKey });
      onStatus(`Uploaded. project=${result.projectKey || "n/a"} document=${result.documentKey || "n/a"}`);
      onImported?.({
        kind: "upload",
        projectKey: result.projectKey || projectKey,
        documentKey: result.documentKey || "",
        label: "Uploaded source",
      });
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePasteSubmit(event) {
    event.preventDefault();
    setBusy("paste");
    try {
      const result = await pasteSource({ text: pasteText, projectKey, mode: "source" });
      onStatus(`Pasted source. document=${result.documentKey || "n/a"}`);
      onImported?.({
        kind: "paste",
        projectKey,
        documentKey: result.documentKey || "",
        label: "Pasted source",
      });
      setPasteText("");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Paste failed.");
    } finally {
      setBusy("");
    }
  }

  async function handleLinkSubmit(event) {
    event.preventDefault();
    setBusy("link");
    try {
      const result = await importSourceLink({ projectKey, url: linkValue });
      onStatus(`Imported link. document=${result.documentKey || "n/a"}`);
      onImported?.({
        kind: "link",
        projectKey: result.projectKey || projectKey,
        documentKey: result.documentKey || "",
        label: linkValue,
      });
      setLinkValue("");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Link import failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="phase2-card">
      <div className="phase2-card__title" style={{ color: TOKENS.accent }}>
        Content Intake (Protected)
      </div>
      <div className="phase2-card__meta">
        project: {projectKey || "unscoped"}
      </div>
      <div className="phase2-row">
        <input ref={fileInputRef} type="file" multiple onChange={handleUploadFiles} data-testid="phase2-intake-file-input" />
        <button type="button" className="terminal-button" onClick={() => fileInputRef.current?.click()} disabled={busy === "upload"}>
          {busy === "upload" ? "Importing..." : "Choose files"}
        </button>
      </div>
      <form onSubmit={handlePasteSubmit} className="phase2-stack-gap">
        <textarea
          data-testid="phase2-intake-paste-input"
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder="Paste source text"
          rows={3}
          className="terminal-input"
          style={{ width: "100%", minHeight: 84 }}
        />
        <button type="submit" className="terminal-button" disabled={!pasteText.trim() || busy === "paste"} data-testid="phase2-intake-paste-submit">
          {busy === "paste" ? "Saving..." : "Save pasted source"}
        </button>
      </form>
      <form onSubmit={handleLinkSubmit} className="phase2-stack-gap">
        <input
          data-testid="phase2-intake-link-input"
          type="url"
          value={linkValue}
          onChange={(event) => setLinkValue(event.target.value)}
          placeholder="https://example.com"
          className="terminal-input"
          style={{ width: "100%" }}
        />
        <button type="submit" className="terminal-button" disabled={!linkValue.trim() || busy === "link"} data-testid="phase2-intake-link-submit">
          {busy === "link" ? "Importing..." : "Import link"}
        </button>
      </form>
    </section>
  );
}

function VoicePlayerPanel({ sourceText = "", documentKey = "", onStatus }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [voiceId, setVoiceId] = useState("");
  const [rate, setRate] = useState(1);
  const [audioUrl, setAudioUrl] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    if (!documentKey) return;
    let cancelled = false;
    loadListeningSession({ documentKey })
      .then((data) => {
        if (cancelled) return;
        const preferredRate = Number(data?.voicePreferences?.preferredListeningRate);
        const preferredProvider = String(data?.voicePreferences?.preferredVoiceProvider || "").trim();
        const preferredVoiceId = String(data?.voicePreferences?.preferredVoiceId || "").trim();
        if (Number.isFinite(preferredRate) && preferredRate > 0) {
          setRate(preferredRate);
        }
        if (preferredProvider) {
          setProvider(preferredProvider);
        }
        if (preferredVoiceId) {
          setVoiceId(preferredVoiceId);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [documentKey]);

  async function handlePlay() {
    const excerpt = String(sourceText || "").slice(0, 320).trim();
    if (!excerpt) {
      onStatus("No source text to play.");
      return;
    }
    try {
      const result = await requestVoiceAudio({
        text: excerpt,
        preferredProvider: provider,
        voiceId,
        rate,
      });
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const nextUrl = URL.createObjectURL(result.blob);
      setAudioUrl(nextUrl);
      const audio = new Audio(nextUrl);
      audio.playbackRate = Number(rate) || 1;
      audioRef.current = audio;
      await audio.play();
      setIsPlaying(true);
      onStatus(`Playing via ${result.headers.provider || "provider"}.`);
      await saveListeningSession({
        documentKey,
        mode: "flow",
        activeNodeId: "sample",
        rate,
        provider: result.headers.provider || provider,
        voiceId: result.headers.voiceId || voiceId,
        status: "active",
      }).catch(() => {});
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        void saveListeningSession({
          documentKey,
          mode: "flow",
          activeNodeId: "sample",
          rate,
          provider,
          voiceId,
          status: "idle",
        }).catch(() => {});
      });
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Playback failed.");
      setIsPlaying(false);
    }
  }

  async function handlePause() {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      await saveListeningSession({
        documentKey,
        mode: "flow",
        activeNodeId: "sample",
        rate,
        provider,
        voiceId,
        status: "paused",
      }).catch(() => {});
    }
  }

  async function handleResumeSession() {
    try {
      const data = await loadListeningSession({ documentKey });
      onStatus(
        `Listening session restored (${data?.listeningSession?.status || "idle"}, rate=${
          data?.voicePreferences?.preferredListeningRate || 1
        }).`,
      );
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Could not load listening session.");
    }
  }

  return (
    <section className="phase2-card">
      <div className="phase2-card__title" style={{ color: TOKENS.success }}>
        Voice Player (Protected)
      </div>
      <div className="phase2-card__meta">
        document: {documentKey || "none"}
      </div>
      <div className="phase2-stack-gap">
        <input className="terminal-input" value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="provider" />
        <input className="terminal-input" value={voiceId} onChange={(event) => setVoiceId(event.target.value)} placeholder="voice id (optional)" />
        <input
          className="terminal-input"
          type="number"
          min="0.75"
          max="2.5"
          step="0.05"
          value={rate}
          onChange={(event) => setRate(Number(event.target.value) || 1)}
          placeholder="rate"
        />
      </div>
      <div className="phase2-row">
        <button type="button" className="terminal-button" onClick={handlePlay} disabled={isPlaying} data-testid="phase2-voice-play">
          Play
        </button>
        <button type="button" className="terminal-button" onClick={handlePause} disabled={!isPlaying} data-testid="phase2-voice-pause">
          Pause
        </button>
        <button type="button" className="terminal-button" onClick={handleResumeSession} data-testid="phase2-voice-resume">
          Resume state
        </button>
      </div>
    </section>
  );
}

function SettingsProfileHelpPanel({ projectKey = "", documentKey = "", onStatus }) {
  const storageKey = getUtilityStorageKey(projectKey, documentKey);
  const [activeTab, setActiveTab] = useState("settings");
  const [settings, setSettings] = useState({
    themeMode: "system",
    density: "comfortable",
    hotkeysEnabled: true,
  });
  const [profile, setProfile] = useState({
    displayName: "",
    role: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setSettings((current) => ({
        ...current,
        ...(parsed?.settings || {}),
      }));
      setProfile((current) => ({
        ...current,
        ...(parsed?.profile || {}),
      }));
    } catch {
      // Ignore broken local preference payloads.
    }
  }, [storageKey]);

  function persist(nextSettings, nextProfile) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          settings: nextSettings,
          profile: nextProfile,
        }),
      );
    } catch {
      // Ignore storage failures to keep shell responsive.
    }
  }

  function updateSettings(nextSettings) {
    setSettings(nextSettings);
    persist(nextSettings, profile);
  }

  function updateProfile(nextProfile) {
    setProfile(nextProfile);
    persist(settings, nextProfile);
  }

  return (
    <section className="phase2-card phase2-settings-panel" data-testid="phase2-settings-panel">
      <div className="phase2-card__title">Workspace Utility</div>
      <div className="phase2-settings-tabs" role="tablist" aria-label="Settings profile help tabs">
        <button
          type="button"
          data-testid="phase2-tab-settings"
          className={`terminal-button ${activeTab === "settings" ? "is-active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
        <button
          type="button"
          data-testid="phase2-tab-profile"
          className={`terminal-button ${activeTab === "profile" ? "is-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          type="button"
          data-testid="phase2-tab-help"
          className={`terminal-button ${activeTab === "help" ? "is-active" : ""}`}
          onClick={() => setActiveTab("help")}
        >
          Help
        </button>
      </div>

      {activeTab === "settings" ? (
        <div className="phase2-stack-gap" data-testid="phase2-settings-content">
          <label className="phase2-card__meta">
            Theme mode
            <select
              className="terminal-input"
              value={settings.themeMode}
              onChange={(event) => updateSettings({ ...settings, themeMode: event.target.value })}
            >
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label className="phase2-card__meta">
            Density
            <select
              className="terminal-input"
              value={settings.density}
              onChange={(event) => updateSettings({ ...settings, density: event.target.value })}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label className="phase2-settings-checkbox">
            <input
              type="checkbox"
              checked={Boolean(settings.hotkeysEnabled)}
              onChange={(event) => updateSettings({ ...settings, hotkeysEnabled: event.target.checked })}
            />
            <span>Enable compass hotkeys</span>
          </label>
          <button
            type="button"
            className="terminal-button"
            onClick={() => onStatus("Preferences saved locally for this workspace.")}
          >
            Save preferences
          </button>
        </div>
      ) : null}

      {activeTab === "profile" ? (
        <div className="phase2-stack-gap" data-testid="phase2-profile-content">
          <input
            className="terminal-input"
            placeholder="Display name"
            value={profile.displayName}
            onChange={(event) => updateProfile({ ...profile, displayName: event.target.value })}
          />
          <input
            className="terminal-input"
            placeholder="Role (founder, operator, reviewer...)"
            value={profile.role}
            onChange={(event) => updateProfile({ ...profile, role: event.target.value })}
          />
          <div className="phase2-card__meta">
            Current profile: {profile.displayName || "Anonymous"}{profile.role ? ` - ${profile.role}` : ""}
          </div>
        </div>
      ) : null}

      {activeTab === "help" ? (
        <div className="phase2-stack-gap" data-testid="phase2-help-content">
          <div className="phase2-card__line">1. State your decision in Room.</div>
          <div className="phase2-card__line">2. Send one lawful ping (move + test).</div>
          <div className="phase2-card__line">3. Attach one return with provenance.</div>
          <div className="phase2-card__line">4. Use next lawful move and close with proof.</div>
          <a href="/workspace/phase1?phase2demo=1" className="phase2-link">
            Open launch workspace
          </a>
        </div>
      ) : null}
    </section>
  );
}

function EditorView({ files, activeFile, onSelectFile, parityOk }) {
  const artifact = files[activeFile]?.artifact || null;
  const runtimeRecord = files[activeFile]?.runtimeWindow || null;
  const diagnostics = splitDiagnostics(artifact?.diagnostics || []);
  const badgeColor = BADGE_COLORS[artifact?.mergedWindowState] || TOKENS.muted;
  const echoFieldModel = buildEchoFieldModel(artifact, runtimeRecord);

  return (
    <div className="phase2-editor-layout">
      <aside className="phase2-editor-sidebar">
        {Object.keys(files).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelectFile(name)}
            className={`phase2-editor-file ${name === activeFile ? "is-active" : ""}`}
          >
            {name}
          </button>
        ))}
      </aside>
      <main className="phase2-editor-main">
        <div className="phase2-editor-status" style={{ color: badgeColor }}>
          {artifact?.mergedWindowState || "open"} | {artifact?.compileState || "clean"} |{" "}
          {artifact?.runtimeState || "open"}
        </div>
        <div
          data-testid="phase2-parity-indicator"
          className="phase2-editor-parity"
          style={{ color: parityOk ? TOKENS.success : TOKENS.error }}
        >
          parity: {parityOk ? "ok" : "mismatch"}
        </div>
        <div data-testid="phase2-editor-field-state" className="phase2-editor-field-state">
          field_state: {echoFieldModel.fieldState} | fog: {echoFieldModel.fogDensity} | echo/story:{" "}
          {echoFieldModel.echoCount}:{echoFieldModel.storyCount}
        </div>
        <div className="phase2-editor-tokenized">
          {(artifact?.tokenizedLines || []).map((line) => (
            <div key={`${line.line}-${line.raw}`}>
              <span className="phase2-editor-line-number">{line.line}</span>
              {(line.tokens || []).map((token, index) => (
                <span
                  key={`${line.line}-${index}`}
                  style={{
                    color:
                      token.category === "head" || token.cat === "head"
                        ? TOKENS.accent
                        : TOKENS.textDark,
                  }}
                >
                  {token.text}
                  {index < (line.tokens || []).length - 1 ? " " : ""}
                </span>
              ))}
            </div>
          ))}
        </div>
        <section>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 11, marginBottom: 6 }}>Compiler Diagnostics</div>
          {[...diagnostics.errors, ...diagnostics.warnings].map((diagnostic) => (
            <div key={`${diagnostic.code}-${diagnostic.span?.line}`} style={{ marginBottom: 4 }}>
              {diagnostic.code} ({diagnostic.severity}) - {diagnostic.message}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

function MirrorView({
  files,
  activeFile,
  fileEntry,
  projectKey,
  documentKey,
  parityOk,
  statusMessage,
  onStatus,
  onSourceUpdate,
}) {
  const artifact = fileEntry.artifact;
  const runtimeRecord = fileEntry.runtimeWindow;
  const sections = buildBoxSectionsFromArtifact(artifact);
  const [drillOpen, setDrillOpen] = useState(false);
  const [openRippleEventId, setOpenRippleEventId] = useState("");
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [instrumentOpen, setInstrumentOpen] = useState(false);
  const [boxCollapsed, setBoxCollapsed] = useState(false);
  const [highlightRegion, setHighlightRegion] = useState("");
  const [openSegmentId, setOpenSegmentId] = useState("");
  const [rangeIndex, setRangeIndex] = useState(0);
  const [rangePulse, setRangePulse] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [attestRationale, setAttestRationale] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const rangeStorageKey = getRangeStorageKey(projectKey, documentKey);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = Number(window.localStorage.getItem(rangeStorageKey));
      if (Number.isInteger(stored) && stored >= 0 && stored < RANGE_LEVELS.length) {
        setRangeIndex(stored);
      }
    } catch {
      // Ignore read failures.
    }
  }, [rangeStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(rangeStorageKey, String(rangeIndex));
    } catch {
      // Ignore write failures.
    }
  }, [rangeStorageKey, rangeIndex]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRangePulse(false);
    }, 260);
    return () => window.clearTimeout(timeout);
  }, [rangePulse]);

  useEffect(() => {
    function onKeyDown(event) {
      const key = String(event?.key || "");
      const activeTag = String(event?.target?.tagName || "").toLowerCase();
      const isTypingSurface =
        activeTag === "input" ||
        activeTag === "textarea" ||
        Boolean(event?.target?.isContentEditable);
      if (isTypingSurface || event.metaKey || event.ctrlKey || event.altKey) return;
      if (!/^[1-4]$/.test(key)) return;
      const nextIndex = Number(key) - 1;
      if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= RANGE_LEVELS.length) return;
      event.preventDefault();
      setRangeIndex(nextIndex);
      setRangePulse(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeRange = RANGE_LEVELS[rangeIndex] || RANGE_LEVELS[0];
  const allEntries = Object.entries(files || {}).map(([filename, entry]) => ({ filename, ...entry }));
  const scopedEntries = buildScopedEntries({
    files,
    activeFile,
    levelKey: activeRange.key,
  });
  const effectiveEntries = scopedEntries.length > 0 ? scopedEntries : allEntries;

  const badgeColor = BADGE_COLORS[runtimeRecord.state] || TOKENS.muted;
  const warnings = splitDiagnostics(artifact.diagnostics).warnings;
  const echoFieldModel = buildEchoFieldModel(artifact, runtimeRecord);
  const interactionContract = derivePaneInteractionContract(artifact, runtimeRecord);
  const paneContract = interactionContract.paneContract;
  const scopedMoveClauses = effectiveEntries.flatMap((entry) => extractClausesByHead(entry.artifact, "MOV"));
  const scopedTestClauses = effectiveEntries.flatMap((entry) => extractClausesByHead(entry.artifact, "TST"));
  const awaitingEntries = effectiveEntries.filter((entry) =>
    buildEchoFieldModel(entry.artifact, entry.runtimeWindow).waiting,
  );
  const scopedReturnClauses = effectiveEntries.flatMap((entry) =>
    extractClausesByHead(entry.artifact, "RTN").map((clause) => ({ clause, entry })),
  );
  const scopedEchoEvents = effectiveEntries.flatMap((entry) =>
    (entry.runtimeWindow?.events || [])
      .filter((event) => event.kind === "return_received" || event.kind === "distant_echo_arrived")
      .map((event) => ({ event, entry })),
  );

  const pingLines = [
    `required_action: ${paneContract.ping.requiredAction}`,
    `proof_condition: ${paneContract.ping.proofCondition}`,
    `status: ${scopedMoveClauses.length > 0 && scopedTestClauses.length > 0 ? "sent" : "not_sent"}`,
    `outstanding_pings: ${awaitingEntries.length}`,
    scopedMoveClauses[scopedMoveClauses.length - 1]
      ? `latest_move: ${clauseSummary(scopedMoveClauses[scopedMoveClauses.length - 1])}`
      : "latest_move: none",
  ];

  const listenLines = [
    `required_action: ${paneContract.listen.requiredAction}`,
    `proof_condition: ${paneContract.listen.proofCondition}`,
    awaitingEntries.length
      ? `mode: listening (${awaitingEntries.length} awaiting)`
      : "mode: not_waiting",
    awaitingEntries[0]
      ? `awaiting_box: ${awaitingEntries[0].filename}`
      : "awaiting_box: none",
    awaitingEntries[0]
      ? `since_ping: ${formatAgeLabel(awaitingEntries[0]?.runtimeWindow?.updatedAt)}`
      : "since_ping: n/a",
  ];

  const lastScopedReturn = scopedReturnClauses[scopedReturnClauses.length - 1] || null;
  const lastScopedReturnVia = getClauseKeyword(lastScopedReturn?.clause, "via") || "none";
  const scopedRippleCount = scopedEchoEvents.filter(({ event }) => event.kind === "distant_echo_arrived").length;
  const echoLines = [
    `required_action: ${paneContract.echoes.requiredAction}`,
    `proof_condition: ${paneContract.echoes.proofCondition}`,
    `returns: ${scopedReturnClauses.length}`,
    `ripple_events: ${scopedRippleCount}`,
    `provenance: ${lastScopedReturnVia}`,
    lastScopedReturn ? `latest_echo: ${clauseSummary(lastScopedReturn.clause)}` : "latest_echo: none",
  ];

  const mappedCount = effectiveEntries.filter(
    (entry) => mapMergedStateForField(entry?.artifact?.mergedWindowState) === "mapped",
  ).length;
  const fracturedCount = effectiveEntries.filter(
    (entry) => mapMergedStateForField(entry?.artifact?.mergedWindowState) === "fractured",
  ).length;
  const awaitingCount = awaitingEntries.length;
  const freshness = deriveFreshnessState(deriveLatestQualifiedReturnAt(runtimeRecord) || runtimeRecord?.updatedAt);
  const scopedSignalProfiles = effectiveEntries.map((entry) => deriveEntrySignalProfile(entry));
  const sharedEvidenceCount = scopedSignalProfiles.reduce(
    (total, profile) => total + profile.externalEvidenceSignals,
    0,
  );
  const scopeCountLabel = `${effectiveEntries.length}${scopedEntries.length === 0 ? " (fallback)" : ""}`;
  const loopCompleted = (runtimeRecord?.events || []).some((event) => event.kind === "return_received");
  const canUnlockCompass = loopCompleted || allEntries.length >= 3;
  const shouldShowCompass = compassEnabled || canUnlockCompass;
  const evidenceCount = sections.evidence.length;
  const storyCount = sections.story.length;
  const actionCount = sections.actions.length;
  const ratioTotal = evidenceCount + storyCount || 1;
  const evidenceRatio = Math.round((evidenceCount / ratioTotal) * 100);
  const fieldLines = [
    `required_action: ${paneContract.field.requiredAction}`,
    `proof_condition: ${paneContract.field.proofCondition}`,
    `field_state: ${echoFieldModel.fieldState}`,
    `mapped/fog/fractured/awaiting: ${mappedCount}/${Math.max(0, effectiveEntries.length - mappedCount - fracturedCount - awaitingCount)}/${fracturedCount}/${awaitingCount}`,
    `freshness: ${freshness}`,
    activeRange.key === "shared" ? `shared_signals: ${sharedEvidenceCount}` : `scope_boxes: ${scopeCountLabel}`,
  ];

  async function handleSend() {
    const text = String(input || "").trim();
    if (!text || pending) return;
    setInput("");
    setPending(true);
    setMessages((current) => [...current, { role: "human", text }]);
    try {
      const proposal = await fetchSevenProposal({
        userInput: text,
        documentKey,
        boxTitle: sections.aim || "phase2_box",
        rootText: sections.aim || "",
        sourceDocuments: fileEntry.sourceDocuments || [],
      });
      const gate = applySevenProposalGate({
        currentSource: fileEntry.source,
        proposal,
        filename: fileEntry.filename,
      });
      setMessages((current) => [...current, { role: "seven", proposal, gate }]);
      if (!gate.accepted) {
        onSourceUpdate(fileEntry.source, {
          kind: "proposal_rejected",
          detail: gate.reason,
          metadata: {
            diagnosticsCount: gate.diagnostics.length,
          },
          proposal,
          proposalAccepted: false,
        });
        onStatus(`Proposal rejected: ${gate.reason}`);
        return;
      }
      onSourceUpdate(gate.nextSource, {
        kind: "proposal_accepted",
        detail: "Seven proposal accepted by compiler gate.",
        metadata: {
          diagnosticsCount: gate.diagnostics.length,
        },
        proposal,
        proposalAccepted: true,
      });
      onStatus("Proposal accepted through compiler gate.");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Could not fetch Seven proposal.");
    } finally {
      setPending(false);
    }
  }

  function cycleRange() {
    setRangeIndex((current) => (current + 1) % RANGE_LEVELS.length);
    setRangePulse(true);
  }

  function handleSegmentToggle(segmentId, region) {
    setOpenSegmentId((current) => (current === segmentId ? "" : segmentId));
    if (region) {
      setHighlightRegion(region);
      setBoxCollapsed(false);
      window.setTimeout(() => setHighlightRegion(""), 1200);
    }
  }

  function handleReceiptKitComplete(messageIndex, kit, completionKind, completedValue) {
    const value = String(completedValue || "").trim();
    if (!value && completionKind !== "checklist") {
      onStatus("Receipt kit needs a concrete value before completion.");
      return;
    }
    const clause = buildReceiptKitClause(kit, value, completionKind);
    const currentSource = String(fileEntry.source || "").trim();
    const nextSource = `${currentSource}\n${clause}\n`;
    const predictionResult =
      completionKind === "compare"
        ? derivePredictionResult(kit?.prediction?.expected || kit?.artifact?.config?.expected, value)
        : null;
    onSourceUpdate(nextSource, {
      kind: "receipt_kit_completed",
      detail: `Receipt kit completed via ${completionKind}`,
      metadata: {
        need: kit?.need || "",
        completionKind,
        value,
        predictionExpected: kit?.prediction?.expected || "",
        predictionResult,
      },
    });
    setMessages((current) =>
      current.map((message, index) => {
        if (index !== messageIndex || message.role !== "seven") return message;
        return {
          ...message,
          receiptKitStatus: {
            completed: true,
            completionKind,
            value,
            predictionResult: predictionResult || "",
          },
        };
      }),
    );
    if (predictionResult) {
      onStatus(`Receipt logged. Prediction result: ${predictionResult}.`);
      return;
    }
    onStatus("Receipt logged and attached to the box.");
  }

  function handleAttestOverride() {
    const rationale = String(attestRationale || "").trim();
    if (!rationale) {
      onStatus("Attest override requires rationale.");
      return;
    }
    const escaped = rationale.replace(/"/g, "'");
    const nextSource = `${String(fileEntry.source || "").trim()}\nCLS attest manual_override if "${escaped}"\n`;
    onSourceUpdate(nextSource, {
      kind: "manual_attest_requested",
      detail: "Manual attest requested with rationale.",
      metadata: { rationale },
    });
    setAttestRationale("");
    onStatus("Attest override submitted to compiler/runtime gate.");
  }

  return (
    <div className={`phase2-mirror-layout ${supportOpen ? "is-tools-open" : "is-chat-first"}`}>
      <div>
        <section data-testid="phase2-room-surface" className="phase2-card phase2-block-gap">
          <div className="phase2-box-head">
            <div className="phase2-card__title">The Room</div>
            <button type="button" data-testid="phase2-state-badge" className="phase2-state-badge" style={{ color: badgeColor }}>
              {interactionContract.stateChip.stateLabel}
            </button>
          </div>
          <div className="phase2-card__line">What am I testing now? {paneContract.ping.requiredAction}</div>
          <div className="phase2-card__meta">What is still unknown? {paneContract.echoes.requiredAction}</div>
          <div className="phase2-card__meta">What is next lawful move? {interactionContract.nextBestAction}</div>
          <div className="phase2-card__meta">Proof condition: {paneContract.field.proofCondition}</div>
          <div className="phase2-scroll phase2-chat-scroll phase2-block-gap">
            {messages.length === 0 ? (
              <div className="phase2-pane__empty">Start by describing the decision you want to test.</div>
            ) : (
              messages.map((message, index) => (
                <div key={`message-${index}`} className="phase2-chat-message">
                  {message.role === "human" ? (
                    <div>
                      <strong>You:</strong> {message.text}
                    </div>
                  ) : (
                    <div>
                      <strong>Seven:</strong>{" "}
                      {(message?.proposal?.segments || []).length ? (
                        (message.proposal.segments || []).map((segment, segmentIndex) => (
                          <SevenSegment
                            key={`segment-${segmentIndex}`}
                            segment={segment}
                            index={segmentIndex}
                            messageIndex={index}
                            openSegmentId={openSegmentId}
                            onToggle={handleSegmentToggle}
                          />
                        ))
                      ) : (
                        <span>{message.proposal?.segments?.[0]?.text || "No segment returned."}</span>
                      )}
                      <div style={{ color: message.gate?.accepted ? TOKENS.success : TOKENS.error }}>
                        {message.gate?.accepted ? "accepted" : `rejected (${message.gate?.reason})`}
                      </div>
                      {message?.proposal?.receiptKit ? (
                        <ReceiptKitCard
                          messageIndex={index}
                          kit={message.proposal.receiptKit}
                          onComplete={handleReceiptKitComplete}
                        />
                      ) : null}
                      {message?.receiptKitStatus?.completed ? (
                        <div className="phase2-card__meta" data-testid="phase2-receipt-result">
                          receipt_result: {message.receiptKitStatus.completionKind}
                          {message.receiptKitStatus.predictionResult
                            ? ` (${message.receiptKitStatus.predictionResult})`
                            : ""}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <textarea
            data-testid="phase2-chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            placeholder="Describe your next test and ask Seven for one lawful proposal"
            className="terminal-input"
            style={{ width: "100%", minHeight: 84 }}
          />
          <div className="phase2-row">
            <button
              type="button"
              className="terminal-button phase2-icon-button"
              onClick={handleSend}
              data-testid="phase2-chat-send"
              disabled={pending}
              aria-label={pending ? "Sending to Seven" : "Send to Seven"}
              title={pending ? "Sending to Seven" : "Send to Seven"}
            >
              <IconGlyph symbol={pending ? "…" : "➤"} />
            </button>
            {statusMessage ? <div className="phase2-card__meta">{statusMessage}</div> : null}
          </div>
        </section>
        <div className="phase2-row phase2-block-gap">
          <button
            type="button"
            className="terminal-button phase2-icon-button"
            data-testid="phase2-room-tools-toggle"
            onClick={() => setSupportOpen((current) => !current)}
            aria-label={supportOpen ? "Hide tools" : "Show tools"}
            title={supportOpen ? "Hide tools" : "Show tools"}
          >
            <IconGlyph symbol={supportOpen ? "▤" : "☰"} />
          </button>
          <div className="phase2-card__meta">Chat-first mode keeps conversation primary.</div>
        </div>
        <section className="phase2-card phase2-block-gap">
          <div className="phase2-box-head">
            <strong>Box Mirror</strong>
            <div className="phase2-row">
              <div className="phase2-card__meta">
                {sections.aim || "structure forming"} | e:{evidenceCount} s:{storyCount} a:{actionCount}
              </div>
              <button
                type="button"
                className="terminal-button phase2-icon-button"
                data-testid="phase2-box-collapse-toggle"
                onClick={() => setBoxCollapsed((value) => !value)}
                aria-label={boxCollapsed ? "Expand box mirror" : "Collapse box mirror"}
                title={boxCollapsed ? "Expand box mirror" : "Collapse box mirror"}
              >
                <IconGlyph symbol={boxCollapsed ? "▾" : "▴"} />
              </button>
            </div>
          </div>
          <div className="phase2-ratio-wrap" data-testid="phase2-evidence-story-ratio">
            <span className="phase2-ratio-wrap__label">◻</span>
            <div className="phase2-ratio-wrap__track">
              <div className="phase2-ratio-wrap__fill" style={{ width: `${evidenceRatio}%` }} />
            </div>
            <span className="phase2-ratio-wrap__label">○</span>
          </div>
          {!boxCollapsed ? (
            <>
            <button
              type="button"
              data-testid="phase2-state-badge"
              onClick={() => setDrillOpen((value) => !value)}
              className="phase2-state-badge"
              style={{ color: badgeColor }}
            >
              {runtimeRecord.state}
            </button>
            {drillOpen ? (
              <div className="phase2-card__meta">
                Compile: {artifact.compileState} | Runtime: {artifact.runtimeState} | Closure:{" "}
                {artifact.closureType || "none"}
              </div>
            ) : null}
            <div
              data-testid="phase2-parity-chip"
              className="phase2-card__meta"
              style={{ color: parityOk ? TOKENS.success : TOKENS.error }}
            >
              mirror/editor parity: {parityOk ? "ok" : "mismatch"}
            </div>
            <div className={`phase2-region ${highlightRegion === "aim" ? "is-highlighted" : ""}`}>
              <SectionCard title="Aim" items={sections.aim ? [{ text: sections.aim, line: 0 }] : []} accent={TOKENS.accent} />
            </div>
            <div className="phase2-two-col">
              <div className={`phase2-region ${highlightRegion === "evidence" ? "is-highlighted" : ""}`}>
                <SectionCard title="Evidence" items={sections.evidence} accent={TOKENS.success} />
              </div>
              <div className={`phase2-region ${highlightRegion === "story" ? "is-highlighted" : ""}`}>
                <SectionCard title="Story" items={sections.story} accent={TOKENS.warn} />
              </div>
            </div>
            <div className={`phase2-region ${highlightRegion === "action" ? "is-highlighted" : ""}`}>
              <SectionCard title="Action" items={sections.actions} accent={TOKENS.accent} />
            </div>
            <div className="phase2-divider">
              <div className="phase2-card__title">Shape Advisory (Mirror only)</div>
              {warnings.length ? (
                <div className="phase2-card__line" style={{ color: TOKENS.warn }}>{warnings[0].message}</div>
              ) : (
                <div className="phase2-card__empty">No advisory right now.</div>
              )}
            </div>
            <div>
              <a href="/shapelibrary" target="_blank" rel="noreferrer" className="phase2-link">
                Open Shape Library Operator Surface
              </a>
            </div>
            <div>
              <EchoLegibilityPanel model={echoFieldModel} />
            </div>
            </>
          ) : (
            <div className="phase2-card__meta">Collapsed for focus. Expand to inspect full structure, advisory, and legibility.</div>
          )}
        </section>
        {supportOpen ? (
          <>
        <section data-testid="phase2-product-law" className="phase2-card phase2-block-gap">
          <div className="phase2-card__title" style={{ color: TOKENS.accent }}>
            Product Law
          </div>
          <div className="phase2-card__line">
            Only returned evidence clears fog; mapped regions can become stale without renewed echoes.
          </div>
        </section>
        {shouldShowCompass ? (
          <section data-testid="phase2-four-pane-instrument" className="phase2-card phase2-block-gap">
            <div className="phase2-instrument-head">
              <span>Compass (ambient)</span>
              <span data-testid="phase2-range-label" className="phase2-card__meta">
                {activeRange.label}
              </span>
            </div>
            <div className="phase2-range-switch-wrap">
              <div className="phase2-four-pane-grid">
                <PaneCard title="△ Ping" testId="phase2-pane-ping" accent={TOKENS.warn} lines={pingLines} />
                <PaneCard title="◻ Field" testId="phase2-pane-field" accent={badgeColor} lines={fieldLines} />
                <PaneCard title="○ Listen" testId="phase2-pane-listen" accent={TOKENS.warn} lines={listenLines} />
                <PaneCard title="7 Echoes" testId="phase2-pane-echoes" accent={TOKENS.success} lines={echoLines} />
              </div>
              <button
                type="button"
                data-testid="phase2-range-switch"
                onClick={cycleRange}
                className="phase2-range-switch"
                style={{ boxShadow: rangePulse ? "0 0 0 6px color-mix(in srgb, var(--loegos-brand) 25%, transparent)" : "none" }}
                title="Switch range level"
              >
                ⊙
              </button>
            </div>
            <div data-testid="phase2-range-track" className="phase2-range-track">
              {RANGE_LEVELS.map((level, index) => {
                const isActive = index === rangeIndex;
                return (
                  <div key={level.key} className={`phase2-range-track__item ${isActive ? "is-active" : ""}`}>
                    L{index + 1}
                  </div>
                );
              })}
            </div>
            <div className="phase2-card__meta" data-testid="phase2-range-hint">
              {"Center switch rotates range: box -> domain -> full field -> shared field."}
            </div>
            <div className="phase2-card__meta phase2-hotkeys-hint" data-testid="phase2-range-hotkeys-hint">
              Hotkeys: 1=box, 2=domain, 3=full field, 4=shared field.
            </div>
          </section>
        ) : (
          <section className="phase2-card phase2-block-gap" data-testid="phase2-compass-lock">
            <div className="phase2-card__title">Compass locked</div>
            <div className="phase2-card__line">
              {"Unlock after first full ping->return loop, 3+ boxes, or enable manually."}
            </div>
            <button
              type="button"
              className="terminal-button phase2-icon-button"
              data-testid="phase2-compass-enable"
              onClick={() => setCompassEnabled(true)}
              aria-label="Enable compass"
              title="Enable compass"
            >
              <IconGlyph symbol="◎" />
            </button>
          </section>
        )}
        <section className="phase2-card phase2-block-gap" data-testid="phase2-instrument-drawer">
          <div className="phase2-box-head">
            <div className="phase2-card__title">Instrument drawer</div>
            <button
              type="button"
              className="terminal-button phase2-icon-button"
              data-testid="phase2-instrument-toggle"
              onClick={() => setInstrumentOpen((current) => !current)}
              aria-label={instrumentOpen ? "Hide advanced controls" : "Show advanced controls"}
              title={instrumentOpen ? "Hide advanced controls" : "Show advanced controls"}
            >
              <IconGlyph symbol={instrumentOpen ? "⌄" : "⌃"} />
            </button>
          </div>
          {instrumentOpen ? (
            <>
              <div className="phase2-card__meta">
                Trace, audit, and override controls. Compiler/runtime still decide lawful state.
              </div>
              <div className="phase2-card phase2-block-gap">
                <div className="phase2-card__title">Manual attest override</div>
                <div className="phase2-card__meta">
                  Use only when closure requires human attestation with explicit rationale.
                </div>
                <textarea
                  value={attestRationale}
                  onChange={(event) => setAttestRationale(event.target.value)}
                  rows={2}
                  className="terminal-input"
                  placeholder='Explain rationale for "CLS attest ... if"'
                  style={{ width: "100%" }}
                />
                <button
                  type="button"
                  className="terminal-button phase2-icon-button"
                  data-testid="phase2-attest-submit"
                  onClick={handleAttestOverride}
                  aria-label="Submit attest request"
                  title="Submit attest request"
                >
                  <IconGlyph symbol="✓" />
                </button>
              </div>
              <div className="phase2-card__title">Runtime Ledger Timeline</div>
              <div data-testid="phase2-ledger-panel" className="phase2-scroll phase2-ledger-scroll">
                {(runtimeRecord?.events || []).length === 0 ? (
                  <div style={{ color: TOKENS.muted }}>No events yet.</div>
                ) : (
                  (runtimeRecord.events || [])
                    .slice()
                    .reverse()
                    .map((event) => (
                      <div key={event.id} className="phase2-ledger-item">
                        {event.kind === "distant_echo_arrived" ? (
                          <div
                            data-testid="phase2-distant-echo-event"
                            style={{
                              border: `1px solid ${TOKENS.accent}`,
                              borderRadius: 8,
                              padding: "4px 6px",
                              background: "var(--loegos-surface-2)",
                            }}
                          >
                            <strong>Ripple:</strong> {event.detail || "Distant echo arrived"}
                            <div className="phase2-block-gap-xs">
                              <button
                                type="button"
                                data-testid="phase2-ripple-toggle"
                                onClick={() =>
                                  setOpenRippleEventId((current) => (current === event.id ? "" : event.id))
                                }
                                className="terminal-button"
                              >
                                {openRippleEventId === event.id ? "Hide chain" : "View chain"}
                              </button>
                            </div>
                            {openRippleEventId === event.id && String(event?.metadata?.chainSummary || "").trim() ? (
                              <div className="phase2-card__meta">
                                chain: {event.metadata.chainSummary}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div>
                            {event.kind} - {event.detail || "updated"}
                          </div>
                        )}
                      </div>
                    ))
                )}
                {(runtimeRecord?.receipts || []).length > 0 ? (
                  <div className="phase2-block-gap-xs">
                    <div className="phase2-card__title">Receipts</div>
                    {(runtimeRecord.receipts || [])
                      .slice()
                      .reverse()
                      .map((receipt) => (
                        <div key={receipt.id} className="phase2-ledger-item">
                          {receipt.kind} ({receipt.compilationId})
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="phase2-card__meta">
              Hidden by default. Open when you need deep diagnostics, ledger trace, or attest control.
            </div>
          )}
        </section>
          </>
        ) : null}
      </div>

      {supportOpen ? (
      <div className="phase2-side-column">
        <SettingsProfileHelpPanel
          projectKey={projectKey}
          documentKey={documentKey}
          onStatus={onStatus}
        />
        <IntakePanel
          projectKey={projectKey}
          onStatus={onStatus}
          onImported={(imported) => {
            const clause = buildImportedWitnessClause(imported);
            const nextSource = `${String(fileEntry.source || "").trim()}\n${clause}\n`;
            onSourceUpdate(nextSource, {
              kind: "intake_imported",
              detail: `Imported ${imported.kind || "source"} witness`,
              metadata: imported,
            });
          }}
        />
        <VoicePlayerPanel
          sourceText={fileEntry.source}
          documentKey={documentKey}
          onStatus={onStatus}
        />
      </div>
      ) : null}
    </div>
  );
}

export default function LoegosPhase1Shell({ bootstrap = {} }) {
  const bootstrapProjectKey = String(bootstrap?.projectKey || "").trim();
  const bootstrapDocumentKey = String(bootstrap?.documentKey || "").trim();
  const storageKey = getStorageKey(bootstrapProjectKey, bootstrapDocumentKey);
  const persistedState = readPersistedShellState(storageKey);
  const initialSources =
    persistedState?.sources && typeof persistedState.sources === "object"
      ? (() => {
          const hydrated = {};
          Object.entries(persistedState.sources).forEach(([filename, entry]) => {
            const source = String(entry?.source || "").trim();
            if (!source) return;
            const artifact = compileSource({ source, filename });
            hydrated[filename] = {
              filename,
              source,
              artifact,
              runtimeWindow: buildRuntimeRecord(artifact, filename, entry?.runtimeWindow || null),
              lastProposal: entry?.lastProposal || null,
              sourceDocuments: Array.isArray(entry?.sourceDocuments)
                ? entry.sourceDocuments
                : [],
            };
          });
          return Object.keys(hydrated).length
            ? hydrated
            : hydrateSourcesFromBootstrap(bootstrap);
        })()
      : hydrateSourcesFromBootstrap(bootstrap);

  const [view, setView] = useState("mirror");
  const [activeFile, setActiveFile] = useState(
    persistedState?.activeFile && initialSources[persistedState.activeFile]
      ? persistedState.activeFile
      : Object.keys(initialSources)[0] || "",
  );
  const [statusMessage, setStatusMessage] = useState(String(bootstrap?.migrationNotice || "").trim());
  const [sources, setSources] = useState(initialSources);

  const resolvedActiveFile = sources[activeFile]
    ? activeFile
    : Object.keys(sources)[0] || "";

  function updateActiveSource(nextSource, eventMeta = null) {
    setSources((current) => {
      const fileKey = current[activeFile] ? activeFile : Object.keys(current)[0] || "";
      const entry = current[fileKey];
      if (!entry) return current;
      const artifact = compileSource({ source: nextSource, filename: fileKey });
      const runtimeWindow = applyArtifactToRuntimeWindow(
        buildRuntimeRecord(entry.artifact, entry.filename, entry.runtimeWindow),
        artifact,
        eventMeta,
        entry.artifact,
      );
      const nextSourceDocuments =
        eventMeta?.kind === "intake_imported" && eventMeta?.metadata
          ? (() => {
              const currentDocs = Array.isArray(entry.sourceDocuments) ? entry.sourceDocuments : [];
              const nextDoc = {
                kind: String(eventMeta.metadata.kind || "source").trim(),
                projectKey: String(eventMeta.metadata.projectKey || "").trim(),
                documentKey: String(eventMeta.metadata.documentKey || "").trim(),
                label: String(eventMeta.metadata.label || "").trim(),
              };
              const uniqueKey = `${nextDoc.kind}:${nextDoc.projectKey}:${nextDoc.documentKey}:${nextDoc.label}`;
              const hasDoc = currentDocs.some((doc) => {
                const docKey = `${String(doc?.kind || "").trim()}:${String(doc?.projectKey || "").trim()}:${String(doc?.documentKey || "").trim()}:${String(doc?.label || "").trim()}`;
                return docKey === uniqueKey;
              });
              return hasDoc ? currentDocs : [...currentDocs, nextDoc];
            })()
          : entry.sourceDocuments;
      const next = {
        ...current,
        [fileKey]: {
          ...entry,
          source: nextSource,
          artifact,
          runtimeWindow,
          sourceDocuments: nextSourceDocuments,
          lastProposal: eventMeta?.proposal
            ? {
                accepted: Boolean(eventMeta?.proposalAccepted),
                at: new Date().toISOString(),
                proposal: eventMeta.proposal,
                detail: eventMeta.detail || "",
              }
            : entry.lastProposal,
        },
      };
      persistShellState(storageKey, { activeFile: fileKey, sources: next });
      return {
        ...next,
      };
    });
  }

  const activeEntry = sources[resolvedActiveFile];
  const parityOk = Boolean(
    activeEntry?.artifact?.compilationId &&
      activeEntry?.runtimeWindow?.compile?.compilationId === activeEntry?.artifact?.compilationId,
  );

  const isEditor = view === "editor";

  if (!activeEntry) {
    return (
      <div className="phase2-shell phase2-shell--loading" data-testid="phase2-shell-root">
        Loading Phase 2 shell...
      </div>
    );
  }

  return (
    <div
      data-testid="phase2-shell-root"
      className={`phase2-shell ${isEditor ? "is-editor" : "is-mirror"}`}
    >
      <header className="phase2-shell__header">
        <strong className="phase2-shell__brand">Loegos Phase 2</strong>
        <div className="phase2-shell__meta">
          {bootstrapProjectKey || "project"} / {bootstrapDocumentKey || "document"}
        </div>
        <div className="phase2-row">
          <button
            type="button"
            className="terminal-button phase2-icon-button"
            onClick={() => setView("mirror")}
            data-testid="phase2-nav-mirror"
            aria-label="Mirror view"
            title="Mirror view"
          >
            <IconGlyph symbol="◧" />
          </button>
          <button
            type="button"
            className="terminal-button phase2-icon-button"
            onClick={() => setView("editor")}
            data-testid="phase2-nav-editor"
            aria-label="Editor view"
            title="Editor view"
          >
            <IconGlyph symbol="⌨" />
          </button>
        </div>
      </header>

      {view === "mirror" ? (
        <MirrorView
          files={sources}
          activeFile={resolvedActiveFile}
          fileEntry={activeEntry}
          projectKey={bootstrapProjectKey}
          documentKey={bootstrapDocumentKey}
          parityOk={parityOk}
          onSourceUpdate={updateActiveSource}
          statusMessage={statusMessage}
          onStatus={setStatusMessage}
        />
      ) : (
        <EditorView
          files={sources}
          activeFile={resolvedActiveFile}
          onSelectFile={setActiveFile}
          parityOk={parityOk}
        />
      )}
    </div>
  );
}
