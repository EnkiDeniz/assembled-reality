"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseSevenAudioHeaders } from "@/lib/seven";
import SignOutButton from "@/components/SignOutButton";

function commandHelp() {
  return [
    "/open <document-key>",
    "/next",
    "/prev",
    "/play",
    "/pause",
    "/account",
    "/connect",
  ].join(" · ");
}

function formatConnectionStatus(value) {
  return String(value || "disconnected").toLowerCase().replace(/_/g, " ");
}

export default function WorkspaceShell({
  profile,
  documents,
  selectedDocument,
  blocks,
  evidenceCount,
  messageCount,
  connectionStatus,
  voiceEnabled,
  defaultVoiceProvider,
}) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const currentAudioBlockIdRef = useRef(null);
  const [selectedBlockId, setSelectedBlockId] = useState(() => blocks[0]?.id || null);
  const [command, setCommand] = useState("");
  const [status, setStatus] = useState(commandHelp());
  const [statusTone, setStatusTone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [rate, setRate] = useState(1);
  const [resolvedVoiceProvider, setResolvedVoiceProvider] = useState(
    defaultVoiceProvider || "device",
  );

  if (!selectedDocument) {
    return (
      <main className="terminal-page">
        <div className="terminal-frame">
          <header className="terminal-topbar">
            <div className="terminal-topbar__brand">
              <span className="terminal-topbar__eyebrow">Document Assembler</span>
              <h1 className="terminal-topbar__title">Workspace</h1>
            </div>
          </header>
          <section className="terminal-pane__section">
            <p className="terminal-context__empty">
              No document is available yet. Import a source document after signing in.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) || blocks[0] || null,
    [blocks, selectedBlockId],
  );

  useEffect(() => {
    setSelectedBlockId(blocks[0]?.id || null);
  }, [selectedDocument?.documentKey, blocks]);

  useEffect(
    () => () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    },
    [],
  );

  function setFeedback(message, tone = "") {
    setStatus(message);
    setStatusTone(tone);
  }

  function navigateToDocument(documentKey) {
    startTransition(() => {
      router.push(`/workspace?document=${encodeURIComponent(documentKey)}`);
    });
  }

  function cleanupAudioUrl() {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  async function playCurrentBlock() {
    if (!selectedBlock?.plainText?.trim()) {
      setFeedback("Select a block with readable text first.", "error");
      return;
    }

    if (!voiceEnabled) {
      setFeedback("Voice providers are unavailable in this environment.", "error");
      return;
    }

    if (audioRef.current && currentAudioBlockIdRef.current === selectedBlock.id) {
      audioRef.current.playbackRate = rate;
      await audioRef.current.play();
      setPlaying(true);
      return;
    }

    setLoadingAudio(true);
    setFeedback(`Loading audio for block ${selectedBlock.number}...`);

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      cleanupAudioUrl();

      const response = await fetch("/api/seven/audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: selectedBlock.plainText,
          preferredProvider: defaultVoiceProvider || undefined,
          rate,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not load audio.");
      }

      const headerState = parseSevenAudioHeaders(response.headers);
      const blob = await response.blob();
      const nextAudioUrl = URL.createObjectURL(blob);
      const audio = new Audio(nextAudioUrl);

      audio.playbackRate = rate;
      audio.addEventListener("ended", () => {
        setPlaying(false);
        setFeedback(`Finished block ${selectedBlock.number}.`);
      });
      audio.addEventListener("pause", () => {
        setPlaying(false);
      });
      audio.addEventListener("play", () => {
        setPlaying(true);
      });

      audioRef.current = audio;
      audioUrlRef.current = nextAudioUrl;
      currentAudioBlockIdRef.current = selectedBlock.id;
      setResolvedVoiceProvider(headerState.provider || defaultVoiceProvider || "device");

      await audio.play();
      setFeedback(
        `Playing block ${selectedBlock.number} via ${headerState.provider || defaultVoiceProvider || "device"}.`,
        "success",
      );
    } catch (thrownError) {
      setPlaying(false);
      setFeedback(
        thrownError instanceof Error ? thrownError.message : "Could not load audio.",
        "error",
      );
    } finally {
      setLoadingAudio(false);
    }
  }

  function pauseAudio() {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setPlaying(false);
    setFeedback("Playback paused.");
  }

  function seekAudio(deltaSeconds) {
    if (!audioRef.current) {
      setFeedback("Start playback before seeking.", "error");
      return;
    }

    audioRef.current.currentTime = Math.max(
      0,
      Math.min(audioRef.current.duration || Infinity, audioRef.current.currentTime + deltaSeconds),
    );
    setFeedback(`Jumped ${deltaSeconds > 0 ? "forward" : "back"} ${Math.abs(deltaSeconds)} seconds.`);
  }

  function selectAdjacentBlock(offset) {
    if (!selectedBlock) return;
    const currentIndex = blocks.findIndex((block) => block.id === selectedBlock.id);
    const nextBlock = blocks[currentIndex + offset];
    if (!nextBlock) return;
    setSelectedBlockId(nextBlock.id);
    setFeedback(`Selected block ${nextBlock.number}.`);
  }

  function cycleRate() {
    const rates = [1, 1.25, 1.5];
    const currentIndex = rates.indexOf(rate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
    setFeedback(`Playback rate ${nextRate.toFixed(2)}x.`);
  }

  async function importDocument(file) {
    if (!file) return;

    setUploading(true);
    setFeedback(`Importing ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.document?.documentKey) {
        throw new Error(payload?.error || "The document could not be imported.");
      }

      setFeedback(`Imported ${payload.document.title}.`, "success");
      navigateToDocument(payload.document.documentKey);
      router.refresh();
    } catch (thrownError) {
      setFeedback(
        thrownError instanceof Error ? thrownError.message : "The document could not be imported.",
        "error",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleCommandSubmit(event) {
    event.preventDefault();
    const trimmed = command.trim();
    if (!trimmed) return;

    if (trimmed === "/next") {
      selectAdjacentBlock(1);
    } else if (trimmed === "/prev") {
      selectAdjacentBlock(-1);
    } else if (trimmed === "/play") {
      await playCurrentBlock();
    } else if (trimmed === "/pause") {
      pauseAudio();
    } else if (trimmed === "/account") {
      router.push("/account");
    } else if (trimmed === "/connect") {
      router.push("/connect/getreceipts");
    } else if (trimmed.startsWith("/open ")) {
      const documentKey = trimmed.slice(6).trim();
      const matched = documents.find((document) => document.documentKey === documentKey);
      if (!matched) {
        setFeedback(`Document ${documentKey} was not found.`, "error");
      } else {
        navigateToDocument(matched.documentKey);
      }
    } else {
      setFeedback(`Unknown command. ${commandHelp()}`, "error");
    }

    setCommand("");
  }

  return (
    <main className="terminal-page">
      <div className="terminal-frame">
        <header className="terminal-topbar">
          <div className="terminal-topbar__brand">
            <span className="terminal-topbar__eyebrow">Document Assembler</span>
            <h1 className="terminal-topbar__title">Workspace</h1>
            <span className="terminal-topbar__meta">
              {profile?.displayName || "Reader"} · {documents.length} source
              {documents.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="terminal-pill-row">
            <span className="terminal-pill is-green">
              auth · active
            </span>
            <span className={`terminal-pill ${connectionStatus === "CONNECTED" ? "is-green" : "is-amber"}`}>
              getreceipts · {formatConnectionStatus(connectionStatus)}
            </span>
            <span className={`terminal-pill ${voiceEnabled ? "is-cyan" : ""}`}>
              voice · {voiceEnabled ? resolvedVoiceProvider : "offline"}
            </span>
            <Link href="/account" className="terminal-link">
              account
            </Link>
            <SignOutButton className="terminal-button" />
          </div>
        </header>

        <div className="terminal-shell">
          <aside className="terminal-pane">
            <section className="terminal-pane__section">
              <h2 className="terminal-pane__heading">Sources</h2>
              <div className="source-list">
                {documents.map((document) => (
                  <button
                    key={document.documentKey}
                    type="button"
                    className={`source-item ${
                      document.documentKey === selectedDocument.documentKey ? "is-active" : ""
                    }`}
                    onClick={() => navigateToDocument(document.documentKey)}
                  >
                    <div className="source-item__eyebrow">
                      <span>{document.sourceType}</span>
                      <span>{document.formatLabel}</span>
                    </div>
                    <p className="source-item__title">{document.title}</p>
                    {document.excerpt ? (
                      <p className="source-item__detail">{document.excerpt}</p>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>

            <section className="terminal-pane__section">
              <h2 className="terminal-pane__heading">Import</h2>
              <div className="terminal-upload">
                <input
                  ref={fileInputRef}
                  className="terminal-file-input"
                  type="file"
                  accept=".txt,.md,.markdown,.doc,.docx,.pdf"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    void importDocument(file);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="terminal-file-label"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Importing..." : "Import document"}
                </button>
              </div>
            </section>

            <section className="terminal-pane__section">
              <h2 className="terminal-pane__heading">Roadmap buckets</h2>
              <div className="terminal-list">
                <span className="terminal-pill">assemblies · next</span>
                <span className="terminal-pill">receipts · active backend</span>
                <span className="terminal-pill">ai ops · next shell</span>
              </div>
            </section>
          </aside>

          <section className="terminal-pane terminal-buffer">
            <header className="terminal-buffer__header">
              <span className="terminal-label">Buffer</span>
              <h2 className="terminal-buffer__title">{selectedDocument.title}</h2>
              <div className="terminal-buffer__meta">
                <span className="terminal-pill">{selectedDocument.documentKey}</span>
                <span className="terminal-pill">{blocks.length} blocks</span>
                <span className="terminal-pill">{selectedDocument.sectionCount} sections</span>
              </div>
            </header>

            <div className="terminal-blocks">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  className={`block-row ${
                    block.id === selectedBlock?.id ? "is-selected" : ""
                  } ${block.kind === "ai" ? "is-ai" : ""}`}
                  onClick={() => setSelectedBlockId(block.id)}
                >
                  <div className="block-row__meta">
                    <span>
                      [{String(block.number).padStart(3, "0")}] {block.kind}
                    </span>
                    <span>{block.sectionLabel}</span>
                  </div>
                  <p className="block-row__title">{block.preview || block.markdown}</p>
                </button>
              ))}
            </div>
          </section>

          <aside className="terminal-pane terminal-context">
            <section className="terminal-pane__section">
              <h2 className="terminal-pane__heading">Context</h2>
              {selectedBlock ? (
                <>
                  <div className="context-line">
                    <span>selected</span>
                    <span>block {selectedBlock.number}</span>
                  </div>
                  <p className="block-row__title" style={{ marginTop: 10 }}>
                    {selectedBlock.sectionLabel}
                  </p>
                  <p className="context-copy">{selectedBlock.preview}</p>
                  <div className="terminal-pill-row" style={{ marginTop: 14 }}>
                    <span className="terminal-pill is-cyan">source · {selectedDocument.title}</span>
                    <span className="terminal-pill">section · {selectedBlock.sectionSlug}</span>
                    <span className="terminal-pill">order · {selectedBlock.orderInSection}</span>
                  </div>
                </>
              ) : (
                <p className="terminal-context__empty">No block selected.</p>
              )}
            </section>

            <section className="terminal-pane__section">
              <h2 className="terminal-pane__heading">Workspace state</h2>
              <div className="terminal-list">
                <span className="terminal-pill">messages · {messageCount}</span>
                <span className="terminal-pill">evidence · {evidenceCount}</span>
                <span className="terminal-pill is-amber">assemblies · next</span>
              </div>
            </section>

            <section className="terminal-pane__section">
              <h2 className="terminal-pane__heading">Commands</h2>
              <p className="terminal-context__empty">
                {commandHelp()}
              </p>
            </section>
          </aside>
        </div>

        <div className="terminal-transport">
          <button
            type="button"
            className="terminal-button"
            disabled={!voiceEnabled || loadingAudio}
            onClick={() => seekAudio(-10)}
          >
            {"<<"} 10
          </button>
          <button
            type="button"
            className="terminal-button is-primary"
            disabled={!voiceEnabled || loadingAudio}
            onClick={() => (playing ? pauseAudio() : playCurrentBlock())}
          >
            {loadingAudio ? "loading" : playing ? "pause" : "play"}
          </button>
          <button
            type="button"
            className="terminal-button"
            disabled={!voiceEnabled || loadingAudio}
            onClick={() => seekAudio(10)}
          >
            10 {">>"}
          </button>
          <button type="button" className="terminal-button" onClick={() => selectAdjacentBlock(-1)}>
            prev block
          </button>
          <button type="button" className="terminal-button" onClick={() => selectAdjacentBlock(1)}>
            next block
          </button>
          <button type="button" className="terminal-button" onClick={cycleRate}>
            rate {rate.toFixed(2)}x
          </button>
          <div className="terminal-transport__status">
            scope · block
          </div>
          <div className="terminal-transport__status">
            voice · {resolvedVoiceProvider}
          </div>
        </div>

        <form className="terminal-commandbar" onSubmit={handleCommandSubmit}>
          <label className="terminal-commandbar__field">
            <span className="terminal-commandbar__prompt">&gt;</span>
            <input
              className="terminal-commandbar__input"
              type="text"
              placeholder="/open assembled-reality-v07-final"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
            />
          </label>
          <button type="submit" className="terminal-button">
            run
          </button>
          <div className={`terminal-status ${statusTone ? `is-${statusTone}` : ""}`}>{status}</div>
        </form>
      </div>
    </main>
  );
}
