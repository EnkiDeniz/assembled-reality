"use client";

import { useMemo, useRef, useState } from "react";
import { compileSource } from "../packages/compiler/src/index.mjs";
import { buildBoxSectionsFromArtifact, splitDiagnostics } from "./lib/artifact-view-model.mjs";
import { applySevenProposalGate } from "./lib/proposal-gate.mjs";
import { importSourceLink, pasteSource, uploadSources } from "./lib/intake-adapter.mjs";
import {
  loadListeningSession,
  requestVoiceAudio,
  saveListeningSession,
} from "./lib/voice-player-adapter.mjs";

const SAMPLE_SOURCES = {
  "phase1-window.loe": `GND box @phase1_window
DIR aim prove_compiler_truth_ui
GND witness @handoff from "handoff.md" with v_apr9
INT story reset_shell_without_regressing_intake_or_player
MOV move build_phase1_shell via manual
TST test intake_and_player_survive
`,
  "attest-window.loe": `GND box @recovery_window
DIR aim close_with_full_audit
GND witness @audit_note from "audit_note.md" with v_apr9
INT story evidence_is_partial
CLS attest unresolved_dependency if "Waiting on external evidence delivery window"
`,
};

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

function buildRuntimeRecord(artifact, previousRecord = null) {
  return {
    runtimeState: artifact.runtimeState,
    closureType: artifact.closureType,
    mergedWindowState: artifact.mergedWindowState,
    compileState: artifact.compileState,
    events: Array.isArray(previousRecord?.events) ? previousRecord.events : [],
    receipts: Array.isArray(previousRecord?.receipts) ? previousRecord.receipts : [],
    updatedAt: new Date().toISOString(),
  };
}

async function sevenRespond(inputText) {
  const text = String(inputText || "").trim();
  if (!text) return { segments: [] };
  return {
    segments: [
      {
        text: "I suggest grounding that as witness and one bounded move.",
        domain: "neutral",
        suggestedClause: `GND witness @note_${Date.now()} from "chat-note.md" with v_${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "")}
MOV move next_step via manual
TST test response_quality`,
      },
    ],
  };
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

function IntakePanel({ onStatus }) {
  const fileInputRef = useRef(null);
  const [projectKey, setProjectKey] = useState("");
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
      <input
        value={projectKey}
        onChange={(event) => setProjectKey(event.target.value)}
        placeholder="projectKey (optional)"
        style={{ width: "100%", marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input ref={fileInputRef} type="file" multiple onChange={handleUploadFiles} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy === "upload"}>
          {busy === "upload" ? "Importing..." : "Choose files"}
        </button>
      </div>
      <form onSubmit={handlePasteSubmit} style={{ marginBottom: 8 }}>
        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder="Paste source text"
          rows={3}
          style={{ width: "100%" }}
        />
        <button type="submit" disabled={!pasteText.trim() || busy === "paste"}>
          {busy === "paste" ? "Saving..." : "Save pasted source"}
        </button>
      </form>
      <form onSubmit={handleLinkSubmit}>
        <input
          type="url"
          value={linkValue}
          onChange={(event) => setLinkValue(event.target.value)}
          placeholder="https://example.com"
          style={{ width: "100%", marginBottom: 6 }}
        />
        <button type="submit" disabled={!linkValue.trim() || busy === "link"}>
          {busy === "link" ? "Importing..." : "Import link"}
        </button>
      </form>
    </section>
  );
}

function VoicePlayerPanel({ sourceText = "", onStatus }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [voiceId, setVoiceId] = useState("");
  const [rate, setRate] = useState(1);
  const [audioUrl, setAudioUrl] = useState("");
  const audioRef = useRef(null);

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
        documentKey: "phase1-window",
        mode: "flow",
        activeNodeId: "sample",
        rate,
        provider: result.headers.provider || provider,
        voiceId: result.headers.voiceId || voiceId,
        status: "active",
      }).catch(() => {});
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
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
        documentKey: "phase1-window",
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
      const data = await loadListeningSession({ documentKey: "phase1-window" });
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
        <button type="button" onClick={handlePlay} disabled={isPlaying}>
          Play
        </button>
        <button type="button" onClick={handlePause} disabled={!isPlaying}>
          Pause
        </button>
        <button type="button" onClick={handleResumeSession}>
          Resume state
        </button>
      </div>
    </section>
  );
}

function EditorView({ files, activeFile, onSelectFile }) {
  const artifact = files[activeFile]?.artifact || null;
  const diagnostics = splitDiagnostics(artifact?.diagnostics || []);
  const badgeColor = BADGE_COLORS[artifact?.mergedWindowState] || TOKENS.muted;

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
        <div style={{ fontFamily: TOKENS.mono, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
          {(artifact?.tokenizedLines || []).map((line) => (
            <div key={`${line.line}-${line.raw}`}>
              <span style={{ color: TOKENS.muted, marginRight: 8 }}>{line.line}</span>
              {(line.tokens || []).map((token, index) => (
                <span key={`${line.line}-${index}`} style={{ color: token.category === "head" ? TOKENS.accent : TOKENS.textDark }}>
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

function MirrorView({ fileEntry, onSourceUpdate, statusMessage, onStatus }) {
  const artifact = fileEntry.artifact;
  const runtimeRecord = fileEntry.runtimeRecord;
  const sections = buildBoxSectionsFromArtifact(artifact);
  const [drillOpen, setDrillOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const badgeColor = BADGE_COLORS[runtimeRecord.mergedWindowState] || TOKENS.muted;
  const warnings = splitDiagnostics(artifact.diagnostics).warnings;

  async function handleSend() {
    const text = String(input || "").trim();
    if (!text) return;
    setInput("");
    setMessages((current) => [...current, { role: "human", text }]);
    const proposal = await sevenRespond(text);
    const gate = applySevenProposalGate({
      currentSource: fileEntry.source,
      proposal,
      filename: fileEntry.filename,
    });
    setMessages((current) => [...current, { role: "seven", proposal, gate }]);
    if (!gate.accepted) {
      onStatus(`Proposal rejected: ${gate.reason}`);
      return;
    }
    onSourceUpdate(gate.nextSource);
    onStatus("Proposal accepted through compiler gate.");
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
              onClick={() => setDrillOpen((value) => !value)}
              style={{ color: badgeColor, border: "none", background: "transparent", fontFamily: TOKENS.mono }}
            >
              {runtimeRecord.mergedWindowState}
            </button>
          </div>
          {drillOpen ? (
            <div style={{ fontFamily: TOKENS.mono, fontSize: 11, color: TOKENS.muted, marginBottom: 8 }}>
              Compile: {runtimeRecord.compileState} | Runtime: {runtimeRecord.runtimeState} | Closure:{" "}
              {runtimeRecord.closureType || "none"}
            </div>
          ) : null}
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
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            placeholder="Type input for Seven"
            style={{ width: "100%", marginBottom: 6 }}
          />
          <button type="button" onClick={handleSend}>
            Send
          </button>
          {statusMessage ? <div style={{ marginTop: 6, color: TOKENS.muted, fontSize: 12 }}>{statusMessage}</div> : null}
        </section>
      </div>

      <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
        <IntakePanel onStatus={onStatus} />
        <VoicePlayerPanel sourceText={fileEntry.source} onStatus={onStatus} />
      </div>
    </div>
  );
}

export default function LoegosPhase1Shell() {
  const [view, setView] = useState("mirror");
  const [activeFile, setActiveFile] = useState("phase1-window.loe");
  const [statusMessage, setStatusMessage] = useState("");
  const [sources, setSources] = useState(() => {
    const entries = {};
    Object.entries(SAMPLE_SOURCES).forEach(([filename, source]) => {
      const artifact = compileSource({ source, filename });
      entries[filename] = {
        filename,
        source,
        artifact,
        runtimeRecord: buildRuntimeRecord(artifact),
      };
    });
    return entries;
  });

  const activeEntry = sources[activeFile];

  function updateActiveSource(nextSource) {
    setSources((current) => {
      const entry = current[activeFile];
      const artifact = compileSource({ source: nextSource, filename: activeFile });
      return {
        ...current,
        [activeFile]: {
          ...entry,
          source: nextSource,
          artifact,
          runtimeRecord: buildRuntimeRecord(artifact, entry.runtimeRecord),
        },
      };
    });
  }

  const isEditor = view === "editor";

  return (
    <div
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
        <strong style={{ letterSpacing: "0.08em", fontFamily: TOKENS.mono }}>Loeogs Phase 1</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setView("mirror")}>
            Mirror
          </button>
          <button type="button" onClick={() => setView("editor")}>
            Editor
          </button>
        </div>
      </header>

      {view === "mirror" ? (
        <MirrorView
          fileEntry={activeEntry}
          onSourceUpdate={updateActiveSource}
          statusMessage={statusMessage}
          onStatus={setStatusMessage}
        />
      ) : (
        <EditorView files={sources} activeFile={activeFile} onSelectFile={setActiveFile} />
      )}
    </div>
  );
}
