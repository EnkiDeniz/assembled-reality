import { useState, useEffect, useRef } from "react";

const VOICES = ["Sir Michael Caine", "Aria", "Nova", "Onyx"];

const STRIPE_COLORS = {
  heading: "#ffffff",
  paragraph: "#6b7280",
  list: "#60a5fa",
  quote: "#f59e0b",
  ai: "#22c55e",
  edited: "#06b6d4",
};

const EMPTY_BLOCKS = [];

const SAMPLE_DOCS = [
  {
    id: "doc-a",
    title: "GitHub as Coordination Fossil Record",
    isAssembly: false,
    sourceFiles: ["Lakin.docx"],
    blocks: [
      { id: "a1", type: "heading", text: "# The Thesis", author: "human", operation: "imported", origin_doc: "doc-a", origin_position: 0 },
      { id: "a2", type: "paragraph", text: "GitHub is the largest open dataset of assembled human coordination on Earth. Every commit, pull request, issue, and merge is a receipt — a timestamped, authored, verifiable record of a decision made in collaboration with others.", author: "human", operation: "imported", origin_doc: "doc-a", origin_position: 1 },
      { id: "a3", type: "paragraph", text: "Yet we treat it as a code repository. This is like treating the Library of Alexandria as a warehouse. The artifact is not the code. The artifact is the coordination pattern that produced the code.", author: "human", operation: "imported", origin_doc: "doc-a", origin_position: 2 },
      { id: "a4", type: "heading", text: "# The Fossil Record", author: "human", operation: "imported", origin_doc: "doc-a", origin_position: 3 },
      { id: "a5", type: "paragraph", text: "A fossil record preserves not the living organism but the trace of its activity. A trilobite impression tells us about the creature, the sediment, the pressure, and the time. GitHub preserves the same: not the living act of collaboration, but its trace.", author: "human", operation: "imported", origin_doc: "doc-a", origin_position: 4 },
      { id: "a6", type: "paragraph", text: "Every pull request is a fossil of a negotiation. Every merge conflict resolved is a fossil of a disagreement that found resolution. Every abandoned branch is a fossil of a path not taken.", author: "human", operation: "imported", origin_doc: "doc-a", origin_position: 5 },
      { id: "a7", type: "heading", text: "# Assembly Index", author: "human", operation: "imported", origin_doc: "doc-a", origin_position: 6 },
      { id: "a8", type: "paragraph", text: "The assembly index of a repository tells you how many coordination steps were required to produce it. A repo with 10,000 commits from 200 contributors has a higher assembly index than a solo project with 50 commits. The complexity is not in the code — it is in the coordination.", author: "human", operation: "imported", origin_doc: "doc-a", origin_position: 7 },
      { id: "a9", type: "quote", text: "> \"A receipt is proof of assembly, and assembly is the universe's word for life.\"", author: "human", operation: "imported", origin_doc: "doc-a", origin_position: 8 },
    ],
  },
  {
    id: "doc-b",
    title: "Assembly Theory Applied to Collaboration",
    isAssembly: false,
    sourceFiles: ["Assembly.md"],
    blocks: [
      { id: "b1", type: "heading", text: "# Assembly Theory at Scale", author: "human", operation: "imported", origin_doc: "doc-b", origin_position: 0 },
      { id: "b2", type: "paragraph", text: "Lee Cronin and Sara Walker proposed that life can be detected by measuring the complexity of molecular assembly. If a molecule requires more steps to assemble than random chemistry can produce, it was made by a living system.", author: "human", operation: "imported", origin_doc: "doc-b", origin_position: 1 },
      { id: "b3", type: "paragraph", text: "The same principle applies to human coordination. A document, a product, a company — each has an assembly index. The higher the index, the more coordination was required. And coordination, unlike mere aggregation, requires selection.", author: "human", operation: "imported", origin_doc: "doc-b", origin_position: 2 },
      { id: "b4", type: "heading", text: "# Selection as Signal", author: "human", operation: "imported", origin_doc: "doc-b", origin_position: 3 },
      { id: "b5", type: "paragraph", text: "Selection is the key. Random processes aggregate but do not select. A river collects sediment; it does not choose which grains to keep. A team reviewing a pull request is selecting — this change stays, that one goes, this approach is better than that one.", author: "human", operation: "imported", origin_doc: "doc-b", origin_position: 4 },
      { id: "b6", type: "paragraph", text: "The receipt of that selection — the merge, the approval, the comment — is the evidence that coordination happened. Without the receipt, you have aggregation. With the receipt, you have assembly.", author: "human", operation: "imported", origin_doc: "doc-b", origin_position: 5 },
      { id: "b7", type: "list", text: "- Aggregation: things pile up\n- Coordination: things are selected\n- Assembly: coordination leaves a receipt\n- Life: assembly becomes autocatalytic", author: "human", operation: "imported", origin_doc: "doc-b", origin_position: 6 },
      { id: "b8", type: "heading", text: "# Implications", author: "human", operation: "imported", origin_doc: "doc-b", origin_position: 7 },
      { id: "b9", type: "paragraph", text: "If assembly theory is correct, then the receipt is not bureaucracy. It is biology. It is the mechanism by which coordinated systems prove they are alive. An organization without receipts is not coordinating — it is merely aggregating.", author: "human", operation: "imported", origin_doc: "doc-b", origin_position: 8 },
    ],
  },
];

const RECEIPT_LOG = [
  { time: "14:22:01", action: "UPLOADED", detail: "GitHub as Coordination Fossil Record (PDF → MD)" },
  { time: "14:22:03", action: "UPLOADED", detail: "Assembly Theory Applied to Collaboration (MD)" },
  { time: "14:22:10", action: "LISTENED", detail: "Doc A — Blocks 1-3 (1m 42s)" },
  { time: "14:23:55", action: "LISTENED", detail: "Doc B — Blocks 1-4 (2m 18s)" },
  { time: "14:26:14", action: "AI_QUERY", detail: '"find where both documents discuss receipts"' },
  { time: "14:26:18", action: "AI_RESULT", detail: "2 blocks produced (extraction)" },
  { time: "14:26:30", action: "SELECTED", detail: "Doc A — Block 9 → Clipboard" },
  { time: "14:26:45", action: "ASSEMBLED", detail: 'New document "Evidence Merge" from 3 blocks' },
];

function BlockView({ block, isPlaying, isSelected, onSelect, onDeselect, onJumpTo, editMode, onEdit }) {
  const [editText, setEditText] = useState(block.text);
  const stripeColor = block.author === "ai" ? STRIPE_COLORS.ai
    : block.operation === "edited" ? STRIPE_COLORS.edited
    : STRIPE_COLORS[block.type] || STRIPE_COLORS.paragraph;

  const renderText = (text) => {
    const cleaned = text.replace(/^#+\s*/, "").replace(/^>\s*/, "").replace(/^[-*]\s*/gm, "");
    return cleaned;
  };

  const isHeading = block.type === "heading";
  const isQuote = block.type === "quote";
  const isList = block.type === "list";

  return (
    <div
      onClick={() => onJumpTo(block.id)}
      style={{
        display: "flex",
        alignItems: "stretch",
        cursor: "pointer",
        background: isPlaying ? "rgba(34,197,94,0.08)" : "transparent",
        borderRadius: 2,
        transition: "background 0.3s ease",
        marginBottom: 2,
        position: "relative",
      }}
    >
      {/* stripe */}
      <div style={{
        width: 3,
        minHeight: "100%",
        background: stripeColor,
        borderRadius: 2,
        marginRight: 12,
        opacity: isPlaying ? 1 : 0.5,
        transition: "opacity 0.3s",
        flexShrink: 0,
      }} />

      {/* select controls */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        marginRight: 10,
        flexShrink: 0,
        width: 22,
      }}>
        {!isSelected ? (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(block); }}
            style={{
              background: "none", border: "1px solid #444", color: "#888",
              width: 22, height: 22, borderRadius: 2, cursor: "pointer",
              fontSize: 14, lineHeight: "20px", textAlign: "center", padding: 0,
            }}
            title="Add to clipboard"
          >+</button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onDeselect(block.id); }}
            style={{
              background: "none", border: "1px solid #22c55e", color: "#22c55e",
              width: 22, height: 22, borderRadius: 2, cursor: "pointer",
              fontSize: 14, lineHeight: "20px", textAlign: "center", padding: 0,
            }}
            title="Remove from clipboard"
          >−</button>
        )}
      </div>

      {/* content */}
      <div style={{
        flex: 1,
        padding: "10px 0",
        minWidth: 0,
      }}>
        {editMode ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={() => onEdit(block.id, editText)}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", background: "#1a1a1a", color: "#e0e0e0",
              border: "1px solid #333", borderRadius: 2, padding: 8,
              fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
              fontSize: isHeading ? 18 : 14, lineHeight: 1.6,
              resize: "vertical", minHeight: 40,
            }}
          />
        ) : (
          <div style={{
            fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
            fontSize: isHeading ? 20 : 14,
            fontWeight: isHeading ? 700 : 400,
            color: isHeading ? "#fff" : isQuote ? "#f59e0b" : "#c8c8c8",
            fontStyle: isQuote ? "italic" : "normal",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            letterSpacing: isHeading ? "0.02em" : 0,
          }}>
            {isList ? block.text.split("\n").map((line, i) => (
              <div key={i} style={{ paddingLeft: 8, position: "relative" }}>
                <span style={{ color: "#60a5fa", marginRight: 8 }}>•</span>
                {line.replace(/^[-*]\s*/, "")}
              </div>
            )) : renderText(block.text)}
          </div>
        )}
        {block.author === "ai" && (
          <span style={{
            fontSize: 10, color: "#22c55e", fontFamily: "monospace",
            marginTop: 4, display: "inline-block", opacity: 0.7,
          }}>AI-GENERATED · {block.operation}</span>
        )}
      </div>

      {/* selected indicator */}
      {isSelected && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: 3, background: "#22c55e", borderRadius: 2,
        }} />
      )}
    </div>
  );
}

function Shelf({ docs, activeDocId, onSelect, onUpload }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 16px", borderBottom: "1px solid #222",
      overflowX: "auto", flexShrink: 0,
    }}>
      {docs.map(doc => (
        <button
          key={doc.id}
          onClick={() => onSelect(doc.id)}
          style={{
            background: doc.id === activeDocId ? "#2a2a2a" : "transparent",
            border: doc.id === activeDocId ? "1px solid #444" : "1px solid #282828",
            color: doc.id === activeDocId ? "#fff" : "#777",
            padding: "6px 14px", borderRadius: 3, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
            whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.15s",
          }}
        >
          {doc.isAssembly && <span style={{ color: "#22c55e", fontSize: 8 }}>●</span>}
          {doc.title}
        </button>
      ))}
      <button
        onClick={onUpload}
        style={{
          background: "transparent", border: "1px dashed #444",
          color: "#666", padding: "6px 14px", borderRadius: 3,
          cursor: "pointer", fontFamily: "monospace", fontSize: 12,
        }}
      >+ Upload</button>
    </div>
  );
}

function Player({ isPlaying, onToggle, speed, onSpeedChange, voice, onVoiceChange, currentBlockIndex, totalBlocks, progress, onSkipBack, onSkipForward }) {
  return (
    <div style={{
      padding: "12px 16px", borderTop: "1px solid #222",
      display: "flex", alignItems: "center", gap: 14,
      flexShrink: 0, background: "#0d0d0d",
    }}>
      {/* controls */}
      <button onClick={onSkipBack} style={playerBtn}>◄15</button>
      <button onClick={onToggle} style={{
        ...playerBtn,
        background: isPlaying ? "#22c55e" : "#333",
        color: isPlaying ? "#000" : "#fff",
        width: 40, height: 40, borderRadius: 20, fontSize: 16,
      }}>
        {isPlaying ? "❚❚" : "▶"}
      </button>
      <button onClick={onSkipForward} style={playerBtn}>30►</button>

      {/* progress */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace", width: 50, textAlign: "right" }}>
          {currentBlockIndex + 1}/{totalBlocks}
        </span>
        <div style={{
          flex: 1, height: 3, background: "#222", borderRadius: 2, position: "relative",
        }}>
          <div style={{
            width: `${progress}%`, height: "100%", background: "#22c55e",
            borderRadius: 2, transition: "width 0.3s",
          }} />
        </div>
      </div>

      {/* speed */}
      <button
        onClick={onSpeedChange}
        style={{
          ...playerBtn, fontSize: 11, padding: "4px 8px", minWidth: 36,
        }}
      >{speed}x</button>

      {/* voice */}
      <select
        value={voice}
        onChange={(e) => onVoiceChange(e.target.value)}
        style={{
          background: "#1a1a1a", border: "1px solid #333", color: "#888",
          padding: "4px 6px", borderRadius: 3, fontSize: 11,
          fontFamily: "monospace", cursor: "pointer",
        }}
      >
        {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );
}

const playerBtn = {
  background: "none", border: "1px solid #333", color: "#888",
  padding: "4px 8px", borderRadius: 3, cursor: "pointer",
  fontFamily: "monospace", fontSize: 12,
};

function Clipboard({ items, docs, onRemove, onReorder, onAssemble, onClear }) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const docCount = new Set(items.map(b => b.origin_doc)).size;
  const preview = (text) => {
    const clean = text.replace(/^[#>*-]\s*/gm, "");
    return clean.length > 55 ? clean.slice(0, 55) + "…" : clean;
  };

  const getDocTitle = (docId) => {
    const d = docs.find(doc => doc.id === docId);
    return d ? d.title.slice(0, 20) : docId;
  };

  return (
    <div style={{
      borderTop: "1px solid #222", background: "#0a0a0a",
      flexShrink: 0,
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 16px", cursor: "pointer",
        }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}>
          CLIPBOARD · {items.length} block{items.length > 1 ? "s" : ""} from {docCount} doc{docCount > 1 ? "s" : ""}
          <span style={{ marginLeft: 8, color: "#555" }}>{expanded ? "▼" : "▶"}</span>
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={(e) => { e.stopPropagation(); onAssemble(); }} style={{
            background: "#22c55e", border: "none", color: "#000",
            padding: "4px 12px", borderRadius: 3, cursor: "pointer",
            fontFamily: "monospace", fontSize: 11, fontWeight: 700,
          }}>ASSEMBLE</button>
          <button onClick={(e) => { e.stopPropagation(); onClear(); }} style={{
            background: "none", border: "1px solid #444", color: "#888",
            padding: "4px 10px", borderRadius: 3, cursor: "pointer",
            fontFamily: "monospace", fontSize: 11,
          }}>CLEAR</button>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 10px", maxHeight: 180, overflowY: "auto" }}>
          {items.map((block, i) => (
            <div key={block.id + i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 0", fontFamily: "monospace", fontSize: 11,
              color: "#999", borderBottom: "1px solid #1a1a1a",
            }}>
              <span style={{ color: "#555", width: 18, textAlign: "right" }}>{i + 1}.</span>
              <span style={{ color: "#22c55e", fontSize: 10 }}>[{getDocTitle(block.origin_doc)}]</span>
              <span style={{ flex: 1, color: "#777" }}>{preview(block.text)}</span>
              <button onClick={() => onReorder(i, -1)} disabled={i === 0} style={{ ...tinyBtn, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
              <button onClick={() => onReorder(i, 1)} disabled={i === items.length - 1} style={{ ...tinyBtn, opacity: i === items.length - 1 ? 0.3 : 1 }}>↓</button>
              <button onClick={() => onRemove(i)} style={{ ...tinyBtn, color: "#ef4444" }}>−</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const tinyBtn = {
  background: "none", border: "none", color: "#888",
  cursor: "pointer", fontFamily: "monospace", fontSize: 13, padding: "0 3px",
};

function ReceiptView({ log }) {
  return (
    <div style={{ padding: "16px 20px", fontFamily: "monospace", fontSize: 12 }}>
      <div style={{ color: "#555", marginBottom: 12, fontSize: 10, letterSpacing: "0.1em" }}>
        RECEIPT LOG — {log.length} entries
      </div>
      {log.map((entry, i) => {
        const actionColor =
          entry.action === "LISTENED" ? "#60a5fa" :
          entry.action === "AI_QUERY" ? "#a78bfa" :
          entry.action === "AI_RESULT" ? "#22c55e" :
          entry.action === "ASSEMBLED" ? "#f59e0b" :
          entry.action === "SELECTED" ? "#06b6d4" :
          entry.action === "EDITED" ? "#f472b6" :
          "#888";
        return (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "4px 0",
            borderBottom: "1px solid #151515", color: "#777", lineHeight: 1.6,
          }}>
            <span style={{ color: "#444", flexShrink: 0, width: 65 }}>{entry.time}</span>
            <span style={{ color: actionColor, flexShrink: 0, width: 90, fontWeight: 600 }}>{entry.action}</span>
            <span style={{ color: "#999" }}>{entry.detail}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DocumentAssembler() {
  const [docs, setDocs] = useState(SAMPLE_DOCS);
  const [activeDocId, setActiveDocId] = useState("doc-a");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState("Sir Michael Caine");
  const [clipboard, setClipboard] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState("doc"); // doc | log
  const [aiInput, setAiInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const docViewRef = useRef(null);
  const blockRefs = useRef({});
  const intervalRef = useRef(null);

  const activeDoc = docs.find(d => d.id === activeDocId);
  const blocks = activeDoc?.blocks ?? EMPTY_BLOCKS;

  // simulated playback
  useEffect(() => {
    if (isPlaying) {
      const ms = 2500 / speed;
      intervalRef.current = setInterval(() => {
        setCurrentBlockIdx(prev => {
          if (prev >= blocks.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, ms);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, blocks.length]);

  // auto-scroll to playing block
  useEffect(() => {
    const ref = blockRefs.current[blocks[currentBlockIdx]?.id];
    if (ref && isPlaying) {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentBlockIdx, isPlaying, blocks]);

  const selectBlock = (block) => {
    if (!clipboard.find(b => b.id === block.id)) {
      setClipboard(prev => [...prev, { ...block }]);
    }
  };
  const deselectBlock = (id) => setClipboard(prev => prev.filter(b => b.id !== id));
  const clearClipboard = () => setClipboard([]);

  const reorderClipboard = (index, dir) => {
    const newClip = [...clipboard];
    const target = index + dir;
    if (target < 0 || target >= newClip.length) return;
    [newClip[index], newClip[target]] = [newClip[target], newClip[index]];
    setClipboard(newClip);
  };

  const assemble = () => {
    if (clipboard.length === 0) return;
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: `Assembly ${docs.length - 1}`,
      isAssembly: true,
      sourceFiles: [],
      blocks: clipboard.map((b, i) => ({
        ...b,
        id: `asm-${Date.now()}-${i}`,
        operation: "assembled",
      })),
    };
    setDocs(prev => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setClipboard([]);
    setCurrentBlockIdx(0);
  };

  const handleAi = () => {
    if (!aiInput.trim()) return;
    setAiThinking(true);
    setTimeout(() => {
      const aiBlocks = [
        {
          id: `ai-${Date.now()}-1`,
          type: "paragraph",
          text: `Every pull request is a fossil of a negotiation. The receipt of that selection — the merge, the approval — is the evidence that coordination happened. Without the receipt, you have aggregation. With the receipt, you have assembly.`,
          author: "ai",
          operation: "extracted",
          origin_doc: "ai",
          origin_position: 0,
        },
        {
          id: `ai-${Date.now()}-2`,
          type: "paragraph",
          text: `Both documents converge on one claim: the receipt is not administrative overhead — it is the mechanism by which coordinated systems prove they are alive. GitHub provides the fossil record; Assembly Theory provides the framework for reading it.`,
          author: "ai",
          operation: "synthesized",
          origin_doc: "ai",
          origin_position: 1,
        },
      ];
      setClipboard(prev => [...prev, ...aiBlocks]);
      setAiInput("");
      setAiThinking(false);
    }, 1500);
  };

  const editBlock = (blockId, newText) => {
    setDocs(prev => prev.map(doc => {
      if (doc.id !== activeDocId) return doc;
      return {
        ...doc,
        blocks: doc.blocks.map(b =>
          b.id === blockId ? { ...b, text: newText, operation: "edited" } : b
        ),
      };
    }));
  };

  const jumpTo = (blockId) => {
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx >= 0) setCurrentBlockIdx(idx);
  };

  const speedCycle = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(speed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
  };

  const progress = blocks.length > 0 ? ((currentBlockIdx + 1) / blocks.length) * 100 : 0;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#0e0e0e", color: "#c8c8c8", overflow: "hidden",
    }}>
      {/* Shelf */}
      <Shelf
        docs={docs}
        activeDocId={activeDocId}
        onSelect={(id) => { setActiveDocId(id); setCurrentBlockIdx(0); setIsPlaying(false); }}
        onUpload={() => {}}
      />

      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 16px", borderBottom: "1px solid #1a1a1a", flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setViewMode("doc")}
            style={{
              ...tabBtn,
              color: viewMode === "doc" ? "#fff" : "#555",
              borderBottomColor: viewMode === "doc" ? "#22c55e" : "transparent",
            }}
          >DOC</button>
          <button
            onClick={() => setViewMode("log")}
            style={{
              ...tabBtn,
              color: viewMode === "log" ? "#fff" : "#555",
              borderBottomColor: viewMode === "log" ? "#f59e0b" : "transparent",
            }}
          >LOG</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {viewMode === "doc" && (
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                ...tabBtn, fontSize: 11,
                color: editMode ? "#06b6d4" : "#555",
                borderBottomColor: editMode ? "#06b6d4" : "transparent",
              }}
            >{editMode ? "EDITING" : "EDIT"}</button>
          )}
          {activeDoc && (
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#444" }}>
              {blocks.length} blocks
              {activeDoc.isAssembly && " · assembled"}
            </span>
          )}
        </div>
      </div>

      {/* Document / Receipt View */}
      <div ref={docViewRef} style={{
        flex: 1, overflowY: "auto", padding: "16px 20px",
      }}>
        {viewMode === "log" ? (
          <ReceiptView log={RECEIPT_LOG} />
        ) : (
          <>
            {/* doc header */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 16,
                fontWeight: 700, color: "#fff", margin: 0, marginBottom: 4,
              }}>{activeDoc?.title}</h2>
              {activeDoc?.sourceFiles?.length > 0 && (
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#444" }}>
                  source: {activeDoc.sourceFiles.join(", ")}
                </span>
              )}
            </div>

            {/* blocks */}
            {blocks.map((block, i) => (
              <div key={block.id} ref={(el) => { blockRefs.current[block.id] = el; }}>
                <BlockView
                  block={block}
                  isPlaying={i === currentBlockIdx && isPlaying}
                  isSelected={clipboard.some(b => b.id === block.id)}
                  onSelect={selectBlock}
                  onDeselect={deselectBlock}
                  onJumpTo={jumpTo}
                  editMode={editMode}
                  onEdit={editBlock}
                />
              </div>
            ))}

            {/* spacer for scroll */}
            <div style={{ height: 100 }} />
          </>
        )}
      </div>

      {/* AI Input */}
      <div style={{
        padding: "8px 16px", borderTop: "1px solid #1a1a1a",
        display: "flex", gap: 8, alignItems: "center", flexShrink: 0,
        background: "#0a0a0a",
      }}>
        <span style={{ color: "#a78bfa", fontFamily: "monospace", fontSize: 14, flexShrink: 0 }}>{">"}</span>
        <input
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAi()}
          placeholder={aiThinking ? "thinking..." : "ask something about your documents..."}
          disabled={aiThinking}
          style={{
            flex: 1, background: "transparent", border: "none",
            color: "#c8c8c8", fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13, outline: "none",
            opacity: aiThinking ? 0.4 : 1,
          }}
        />
        {aiInput && (
          <button onClick={handleAi} style={{
            background: "none", border: "1px solid #a78bfa", color: "#a78bfa",
            padding: "3px 10px", borderRadius: 3, cursor: "pointer",
            fontFamily: "monospace", fontSize: 11,
          }}>RUN</button>
        )}
      </div>

      {/* Clipboard */}
      <Clipboard
        items={clipboard}
        docs={docs}
        onRemove={(i) => setClipboard(prev => prev.filter((_, idx) => idx !== i))}
        onReorder={reorderClipboard}
        onAssemble={assemble}
        onClear={clearClipboard}
      />

      {/* Player */}
      <Player
        isPlaying={isPlaying}
        onToggle={() => setIsPlaying(!isPlaying)}
        speed={speed}
        onSpeedChange={speedCycle}
        voice={voice}
        onVoiceChange={setVoice}
        currentBlockIndex={currentBlockIdx}
        totalBlocks={blocks.length}
        progress={progress}
        onSkipBack={() => setCurrentBlockIdx(prev => Math.max(0, prev - 1))}
        onSkipForward={() => setCurrentBlockIdx(prev => Math.min(blocks.length - 1, prev + 1))}
      />
    </div>
  );
}

const tabBtn = {
  background: "none", border: "none", borderBottom: "2px solid transparent",
  color: "#555", padding: "4px 8px", cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600,
  letterSpacing: "0.05em",
};
