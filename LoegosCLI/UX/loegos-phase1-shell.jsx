"use client";

import { useEffect, useRef, useState } from "react";
import { compileSource } from "../packages/compiler/src/index.mjs";
import {
  buildBoxSectionsFromArtifact,
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
  bg: "#FAFAF8",
  bgDark: "#0f1218",
  card: "#ffffff",
  cardDark: "#151a22",
  text: "#1f2530",
  textDark: "#eef3fb",
  muted: "#6f7a8c",
  border: "rgba(26,30,38,0.12)",
  borderDark: "rgba(238,243,251,0.14)",
  accent: "#3b7dd8",
  error: "#c0392b",
  warn: "#b08a1a",
  success: "#3a8f5c",
  attested: "#7b5ea7",
  mono: "'SF Mono', SFMono-Regular, Menlo, Consolas, monospace",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
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
    bg: "rgba(58,143,92,0.08)",
    border: "rgba(58,143,92,0.24)",
  },
  fog: {
    accent: TOKENS.warn,
    bg: "rgba(176,138,26,0.08)",
    border: "rgba(176,138,26,0.24)",
  },
  fractured: {
    accent: TOKENS.error,
    bg: "rgba(192,57,43,0.08)",
    border: "rgba(192,57,43,0.24)",
  },
  awaiting: {
    accent: TOKENS.accent,
    bg: "rgba(59,125,216,0.08)",
    border: "rgba(59,125,216,0.24)",
  },
};

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
    <section
      style={{
        border: `1px solid ${TOKENS.border}`,
        background: TOKENS.card,
        borderRadius: 10,
        padding: 10,
      }}
    >
      <div
        style={{
          fontFamily: TOKENS.mono,
          fontSize: 11,
          color: accent,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {title}
      </div>
      {items.length ? (
        items.map((item) => (
          <div key={`${title}-${item.line}-${item.text}`} style={{ fontSize: 13, color: TOKENS.text }}>
            {item.text}
          </div>
        ))
      ) : (
        <div style={{ color: TOKENS.muted, fontSize: 12 }}>No entries yet.</div>
      )}
    </section>
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
      style={{
        border: `1px solid ${fieldColors.border}`,
        background: fieldColors.bg,
        borderRadius: 10,
        padding: 10,
      }}
    >
      <div
        style={{
          fontFamily: TOKENS.mono,
          fontSize: 11,
          color: fieldColors.accent,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Echo Field Legibility
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
        <div>
          <div style={{ color: TOKENS.muted, fontFamily: TOKENS.mono, fontSize: 11 }}>Did I ping?</div>
          <div data-testid="phase2-ping-question">{pingLabel}</div>
        </div>
        <div>
          <div style={{ color: TOKENS.muted, fontFamily: TOKENS.mono, fontSize: 11 }}>Am I waiting?</div>
          <div data-testid="phase2-waiting-question">{waitingLabel}</div>
        </div>
        <div>
          <div style={{ color: TOKENS.muted, fontFamily: TOKENS.mono, fontSize: 11 }}>
            What came back, from where?
          </div>
          <div data-testid="phase2-return-question">{model.returnProvenance}</div>
        </div>
        <div>
          <div style={{ color: TOKENS.muted, fontFamily: TOKENS.mono, fontSize: 11 }}>How clear is this region?</div>
          <div data-testid="phase2-fog-question">{fogDensityLabel}</div>
        </div>
        <div>
          <div style={{ color: TOKENS.muted, fontFamily: TOKENS.mono, fontSize: 11 }}>field_state</div>
          <div data-testid="phase2-field-state" style={{ color: fieldColors.accent }}>
            {model.fieldState}
          </div>
        </div>
        <div>
          <div style={{ color: TOKENS.muted, fontFamily: TOKENS.mono, fontSize: 11 }}>echo_to_story</div>
          <div data-testid="phase2-echo-ratio">
            {model.echoCount}:{model.storyCount} ({echoRatioPercent})
          </div>
        </div>
        <div>
          <div style={{ color: TOKENS.muted, fontFamily: TOKENS.mono, fontSize: 11 }}>fog_density</div>
          <div data-testid="phase2-fog-density">{fogDensityLabel}</div>
        </div>
        <div>
          <div style={{ color: TOKENS.muted, fontFamily: TOKENS.mono, fontSize: 11 }}>return_provenance</div>
          <div data-testid="phase2-return-provenance">{model.returnProvenance}</div>
        </div>
      </div>
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
    <section style={{ border: `1px solid ${TOKENS.border}`, borderRadius: 10, padding: 10 }}>
      <div style={{ fontFamily: TOKENS.mono, fontSize: 11, color: TOKENS.accent, marginBottom: 8 }}>
        Content Intake (Protected)
      </div>
      <div style={{ marginBottom: 8, color: TOKENS.muted, fontSize: 12 }}>
        project: {projectKey || "unscoped"}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input ref={fileInputRef} type="file" multiple onChange={handleUploadFiles} data-testid="phase2-intake-file-input" />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy === "upload"}>
          {busy === "upload" ? "Importing..." : "Choose files"}
        </button>
      </div>
      <form onSubmit={handlePasteSubmit} style={{ marginBottom: 8 }}>
        <textarea
          data-testid="phase2-intake-paste-input"
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder="Paste source text"
          rows={3}
          style={{ width: "100%" }}
        />
        <button type="submit" disabled={!pasteText.trim() || busy === "paste"} data-testid="phase2-intake-paste-submit">
          {busy === "paste" ? "Saving..." : "Save pasted source"}
        </button>
      </form>
      <form onSubmit={handleLinkSubmit}>
        <input
          data-testid="phase2-intake-link-input"
          type="url"
          value={linkValue}
          onChange={(event) => setLinkValue(event.target.value)}
          placeholder="https://example.com"
          style={{ width: "100%", marginBottom: 6 }}
        />
        <button type="submit" disabled={!linkValue.trim() || busy === "link"} data-testid="phase2-intake-link-submit">
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
    <section style={{ border: `1px solid ${TOKENS.border}`, borderRadius: 10, padding: 10 }}>
      <div style={{ fontFamily: TOKENS.mono, fontSize: 11, color: TOKENS.success, marginBottom: 8 }}>
        Voice Player (Protected)
      </div>
      <div style={{ marginBottom: 6, color: TOKENS.muted, fontSize: 12 }}>
        document: {documentKey || "none"}
      </div>
      <div style={{ display: "grid", gap: 6, marginBottom: 8 }}>
        <input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="provider" />
        <input value={voiceId} onChange={(event) => setVoiceId(event.target.value)} placeholder="voice id (optional)" />
        <input
          type="number"
          min="0.75"
          max="2.5"
          step="0.05"
          value={rate}
          onChange={(event) => setRate(Number(event.target.value) || 1)}
          placeholder="rate"
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={handlePlay} disabled={isPlaying} data-testid="phase2-voice-play">
          Play
        </button>
        <button type="button" onClick={handlePause} disabled={!isPlaying} data-testid="phase2-voice-pause">
          Pause
        </button>
        <button type="button" onClick={handleResumeSession} data-testid="phase2-voice-resume">
          Resume state
        </button>
      </div>
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
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", height: "100%" }}>
      <aside style={{ borderRight: `1px solid ${TOKENS.borderDark}`, background: TOKENS.cardDark }}>
        {Object.keys(files).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelectFile(name)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              background: name === activeFile ? "rgba(59,125,216,0.15)" : "transparent",
              color: TOKENS.textDark,
              border: "none",
              borderLeft: `3px solid ${name === activeFile ? TOKENS.accent : "transparent"}`,
            }}
          >
            {name}
          </button>
        ))}
      </aside>
      <main style={{ background: TOKENS.bgDark, color: TOKENS.textDark, padding: 12, overflow: "auto" }}>
        <div style={{ marginBottom: 8, color: badgeColor, fontFamily: TOKENS.mono, fontSize: 11 }}>
          {artifact?.mergedWindowState || "open"} | {artifact?.compileState || "clean"} |{" "}
          {artifact?.runtimeState || "open"}
        </div>
        <div
          data-testid="phase2-parity-indicator"
          style={{ marginBottom: 8, color: parityOk ? TOKENS.success : TOKENS.error, fontSize: 12 }}
        >
          parity: {parityOk ? "ok" : "mismatch"}
        </div>
        <div data-testid="phase2-editor-field-state" style={{ marginBottom: 8, color: TOKENS.muted, fontSize: 12 }}>
          field_state: {echoFieldModel.fieldState} | fog: {echoFieldModel.fogDensity} | echo/story:{" "}
          {echoFieldModel.echoCount}:{echoFieldModel.storyCount}
        </div>
        <div style={{ fontFamily: TOKENS.mono, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
          {(artifact?.tokenizedLines || []).map((line) => (
            <div key={`${line.line}-${line.raw}`}>
              <span style={{ color: TOKENS.muted, marginRight: 8 }}>{line.line}</span>
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
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState([]);

  const badgeColor = BADGE_COLORS[runtimeRecord.state] || TOKENS.muted;
  const warnings = splitDiagnostics(artifact.diagnostics).warnings;
  const echoFieldModel = buildEchoFieldModel(artifact, runtimeRecord);

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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 12, padding: 12 }}>
      <div>
        <section
          style={{
            border: `1px solid ${TOKENS.border}`,
            background: TOKENS.card,
            borderRadius: 10,
            padding: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <strong>Box</strong>
            <button
              type="button"
              data-testid="phase2-state-badge"
              onClick={() => setDrillOpen((value) => !value)}
              style={{ color: badgeColor, border: "none", background: "transparent", fontFamily: TOKENS.mono }}
            >
              {runtimeRecord.state}
            </button>
          </div>
          {drillOpen ? (
            <div style={{ fontFamily: TOKENS.mono, fontSize: 11, color: TOKENS.muted, marginBottom: 8 }}>
              Compile: {artifact.compileState} | Runtime: {artifact.runtimeState} | Closure:{" "}
              {artifact.closureType || "none"}
            </div>
          ) : null}
          <div
            data-testid="phase2-parity-chip"
            style={{ marginBottom: 8, color: parityOk ? TOKENS.success : TOKENS.error, fontSize: 12 }}
          >
            mirror/editor parity: {parityOk ? "ok" : "mismatch"}
          </div>
          <SectionCard title="Aim" items={sections.aim ? [{ text: sections.aim, line: 0 }] : []} accent={TOKENS.accent} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <SectionCard title="Evidence" items={sections.evidence} accent={TOKENS.success} />
            <SectionCard title="Story" items={sections.story} accent={TOKENS.warn} />
          </div>
          <div style={{ marginTop: 8 }}>
            <SectionCard title="Action" items={sections.actions} accent={TOKENS.accent} />
          </div>
          <div style={{ marginTop: 10, borderTop: `1px solid ${TOKENS.border}`, paddingTop: 8 }}>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 11, marginBottom: 4 }}>Shape Advisory (Mirror only)</div>
            {warnings.length ? (
              <div style={{ color: TOKENS.warn, fontSize: 12 }}>{warnings[0].message}</div>
            ) : (
              <div style={{ color: TOKENS.muted, fontSize: 12 }}>No advisory right now.</div>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <a href="/shapelibrary" target="_blank" rel="noreferrer" style={{ color: TOKENS.accent, fontSize: 12 }}>
              Open Shape Library Operator Surface
            </a>
          </div>
          <div style={{ marginTop: 10 }}>
            <EchoLegibilityPanel model={echoFieldModel} />
          </div>
        </section>

        <section style={{ border: `1px solid ${TOKENS.border}`, borderRadius: 10, padding: 10, background: TOKENS.card }}>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 11, marginBottom: 6 }}>Chat Intake (Proposal Gate)</div>
          <div style={{ maxHeight: 220, overflow: "auto", marginBottom: 8 }}>
            {messages.map((message, index) => (
              <div key={`message-${index}`} style={{ marginBottom: 6, fontSize: 13 }}>
                {message.role === "human" ? (
                  <div>
                    <strong>You:</strong> {message.text}
                  </div>
                ) : (
                  <div>
                    <strong>Seven:</strong> {message.proposal?.segments?.[0]?.text}
                    <div style={{ color: message.gate?.accepted ? TOKENS.success : TOKENS.error }}>
                      {message.gate?.accepted ? "accepted" : `rejected (${message.gate?.reason})`}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <textarea
            data-testid="phase2-chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            placeholder="Type input for Seven"
            style={{ width: "100%", marginBottom: 6 }}
          />
          <button type="button" onClick={handleSend} data-testid="phase2-chat-send" disabled={pending}>
            {pending ? "Sending..." : "Send"}
          </button>
          {statusMessage ? <div style={{ marginTop: 6, color: TOKENS.muted, fontSize: 12 }}>{statusMessage}</div> : null}
        </section>

        <section style={{ border: `1px solid ${TOKENS.border}`, borderRadius: 10, padding: 10, background: TOKENS.card }}>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 11, marginBottom: 6 }}>Runtime Ledger Timeline</div>
          <div data-testid="phase2-ledger-panel" style={{ maxHeight: 200, overflow: "auto", fontSize: 12 }}>
            {(runtimeRecord?.events || []).length === 0 ? (
              <div style={{ color: TOKENS.muted }}>No events yet.</div>
            ) : (
              (runtimeRecord.events || [])
                .slice()
                .reverse()
                .map((event) => (
                  <div key={event.id} style={{ marginBottom: 4 }}>
                    {event.kind === "distant_echo_arrived" ? (
                      <div
                        data-testid="phase2-distant-echo-event"
                        style={{
                          border: `1px solid ${TOKENS.accent}`,
                          borderRadius: 8,
                          padding: "4px 6px",
                          background: "rgba(59,125,216,0.08)",
                        }}
                      >
                        <strong>Ripple:</strong> {event.detail || "Distant echo arrived"}
                        <div style={{ marginTop: 4 }}>
                          <button
                            type="button"
                            data-testid="phase2-ripple-toggle"
                            onClick={() =>
                              setOpenRippleEventId((current) => (current === event.id ? "" : event.id))
                            }
                            style={{
                              border: `1px solid ${TOKENS.border}`,
                              background: "transparent",
                              borderRadius: 6,
                              fontSize: 11,
                              padding: "2px 6px",
                            }}
                          >
                            {openRippleEventId === event.id ? "Hide chain" : "View chain"}
                          </button>
                        </div>
                        {openRippleEventId === event.id && String(event?.metadata?.chainSummary || "").trim() ? (
                          <div style={{ color: TOKENS.muted }}>
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
              <div style={{ marginTop: 8 }}>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 11 }}>Receipts</div>
                {(runtimeRecord.receipts || [])
                  .slice()
                  .reverse()
                  .map((receipt) => (
                    <div key={receipt.id} style={{ marginBottom: 4 }}>
                      {receipt.kind} ({receipt.compilationId})
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
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
      const next = {
        ...current,
        [fileKey]: {
          ...entry,
          source: nextSource,
          artifact,
          runtimeWindow,
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
      <div style={{ padding: 20, fontFamily: TOKENS.sans }} data-testid="phase2-shell-root">
        Loading Phase 2 shell...
      </div>
    );
  }

  return (
    <div
      data-testid="phase2-shell-root"
      style={{
        height: "100vh",
        background: isEditor ? TOKENS.bgDark : TOKENS.bg,
        color: isEditor ? TOKENS.textDark : TOKENS.text,
        fontFamily: TOKENS.sans,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: `1px solid ${isEditor ? TOKENS.borderDark : TOKENS.border}`,
        }}
      >
        <strong style={{ letterSpacing: "0.08em", fontFamily: TOKENS.mono }}>Loegos Phase 2</strong>
        <div style={{ color: isEditor ? TOKENS.muted : TOKENS.text, fontSize: 12 }}>
          {bootstrapProjectKey || "project"} / {bootstrapDocumentKey || "document"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setView("mirror")} data-testid="phase2-nav-mirror">
            Mirror
          </button>
          <button type="button" onClick={() => setView("editor")} data-testid="phase2-nav-editor">
            Editor
          </button>
        </div>
      </header>

      {view === "mirror" ? (
        <MirrorView
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
