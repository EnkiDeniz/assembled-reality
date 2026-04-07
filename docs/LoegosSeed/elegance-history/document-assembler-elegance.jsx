import { useState, useEffect, useRef } from "react";

/* ── Icon Components (monoline, 1.5px stroke style) ── */
const Icon = ({ children, size = 20, color = "#666", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
);

const PlayIcon = ({ size, color = "#000", filled }) => filled ? (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <polygon points="6,3 20,12 6,21" fill={color} stroke="none" />
  </svg>
) : (
  <Icon size={size} color={color}><polygon points="6,3 20,12 6,21" fill="none" /></Icon>
);

const PauseIcon = ({ size, color }) => (
  <Icon size={size} color={color}>
    <line x1="8" y1="5" x2="8" y2="19" strokeWidth="2.5" />
    <line x1="16" y1="5" x2="16" y2="19" strokeWidth="2.5" />
  </Icon>
);

const PrevIcon = ({ size, color }) => (
  <Icon size={size} color={color}><polygon points="18,3 6,12 18,21" fill="none" /></Icon>
);

const NextIcon = ({ size, color }) => (
  <Icon size={size} color={color}><polygon points="6,3 18,12 6,21" fill="none" /></Icon>
);

const BackIcon = ({ size, color }) => (
  <Icon size={size} color={color}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12,19 5,12 12,5" />
  </Icon>
);

const MoreIcon = ({ size, color }) => (
  <Icon size={size} color={color}>
    <circle cx="12" cy="5" r="1" fill={color} stroke="none" />
    <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
    <circle cx="12" cy="19" r="1" fill={color} stroke="none" />
  </Icon>
);

const GridIcon = ({ size, color }) => (
  <Icon size={size} color={color}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icon>
);

const UploadIcon = ({ size, color }) => (
  <Icon size={size} color={color}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5,12 12,5 19,12" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </Icon>
);

const PlusCircleIcon = ({ size, color }) => (
  <Icon size={size} color={color}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </Icon>
);

const MicIcon = ({ size, color, active }) => (
  <Icon size={size} color={color}>
    <rect x="9" y="2" width="6" height="11" rx="3" fill={active ? color : "none"} />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </Icon>
);

const DocIcon = ({ size, color }) => (
  <Icon size={size} color={color}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </Icon>
);

/* ── Colors ── */
const C = {
  bg: "#0e0e0e",
  surface: "#161616",
  border: "#222222",
  text: "#e0e0e0",
  textSec: "#888888",
  textDim: "#444444",
  green: "#22c55e",
  amber: "#f59e0b",
  blue: "#60a5fa",
  purple: "#a78bfa",
  red: "#ef4444",
};

const font = "'IBM Plex Mono', 'Fira Code', monospace";

/* ── Shared Components ── */
function TopBar({ title, onBack, onMore }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px", borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={iconBtn}><BackIcon size={20} color={C.textSec} /></button>
        )}
        <span style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.text }}>{title}</span>
      </div>
      {onMore && (
        <button onClick={onMore} style={iconBtn}><MoreIcon size={20} color={C.textSec} /></button>
      )}
    </div>
  );
}

function Badge({ children, color = C.textDim }) {
  return (
    <span style={{
      fontFamily: font, fontSize: 9, color, letterSpacing: "0.08em",
      padding: "2px 6px", border: `1px solid ${color}33`, borderRadius: 3,
      fontWeight: 600,
    }}>{children}</span>
  );
}

/* ── Screen: Home ── */
function HomeScreen({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{
        padding: "20px 16px 0", display: "flex", alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: "0.1em" }}>
          DOCUMENT ASSEMBLER
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: 14, border: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>D</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
        {/* continue listening */}
        <div
          onClick={() => onNavigate("listen")}
          style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
            padding: "16px", marginBottom: 20, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontFamily: font, fontSize: 10, color: C.green, letterSpacing: "0.08em", marginBottom: 6 }}>
              CONTINUE LISTENING
            </div>
            <div style={{ fontFamily: font, fontSize: 14, color: C.text, fontWeight: 600 }}>Leader</div>
            <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 4 }}>
              Block 3 of 23 · left off 2 hours ago
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 22, background: C.green,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PlayIcon size={18} color="#000" filled />
          </div>
        </div>

        {/* action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28 }}>
          {[
            { icon: <PlayIcon size={18} color={C.textSec} />, label: "Listen", action: "browse" },
            { icon: <GridIcon size={18} color={C.textSec} />, label: "Assemble", action: "assembly" },
            { icon: <UploadIcon size={18} color={C.textSec} />, label: "Upload", action: null },
            { icon: <PlusCircleIcon size={18} color={C.textSec} />, label: "New", action: null },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={() => btn.action && onNavigate(btn.action)}
              style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
                padding: "14px 12px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.green + "44"}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              {btn.icon}
              <span style={{ fontFamily: font, fontSize: 12, color: C.text, fontWeight: 500 }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* sources */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12,
        }}>
          <span style={{ fontFamily: font, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", fontWeight: 600 }}>
            SOURCES
          </span>
          <span style={{ fontFamily: font, fontSize: 10, color: C.textDim }}>6</span>
        </div>

        {[
          { title: "Leader", type: "TXT", blocks: 23 },
          { title: "The Thesis", type: "DOCX", blocks: 14 },
          { title: "A monolith does not move.", type: "MD", blocks: 8 },
          { title: "Assembled Reality", type: "SAMPLE", blocks: 499 },
        ].map((doc, i) => (
          <div
            key={i}
            onClick={() => onNavigate("listen")}
            style={{
              display: "flex", alignItems: "center", padding: "12px 0",
              borderBottom: `1px solid ${C.border}11`, cursor: "pointer", gap: 12,
            }}
          >
            <button style={{
              ...iconBtn, width: 32, height: 32, borderRadius: 16,
              border: `1px solid ${C.border}`,
            }}>
              <PlayIcon size={12} color={C.textSec} />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: font, fontSize: 13, color: C.text }}>{doc.title}</div>
              <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, marginTop: 2 }}>
                {doc.blocks} blocks
              </div>
            </div>
            <Badge>{doc.type}</Badge>
          </div>
        ))}

        {/* assemblies */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 24, marginBottom: 12,
        }}>
          <span style={{ fontFamily: font, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", fontWeight: 600 }}>
            ASSEMBLIES
          </span>
          <span style={{ fontFamily: font, fontSize: 10, color: C.textDim }}>0</span>
        </div>
        <div style={{ fontFamily: font, fontSize: 12, color: C.textDim, fontStyle: "italic" }}>
          You haven't assembled anything yet.
        </div>
      </div>

      {/* status bar */}
      <div style={{
        padding: "8px 16px", borderTop: `1px solid ${C.border}`,
        display: "flex", gap: 16, justifyContent: "center",
      }}>
        {[
          { label: "ELEVEN", color: C.green },
          { label: "GETRECEIPTS", color: C.green },
        ].map((s, i) => (
          <span key={i} style={{ fontFamily: font, fontSize: 9, color: s.color, opacity: 0.5, letterSpacing: "0.06em" }}>
            ● {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Screen: Listening ── */
function ListenScreen({ onNavigate }) {
  const [playing, setPlaying] = useState(false);
  const [activeBlock, setActiveBlock] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showConvo, setShowConvo] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [hasAnswer, setHasAnswer] = useState(false);
  const intervalRef = useRef(null);

  const blocks = [
    { id: "001", type: "heading", text: "What's Taught as Good Management but Functions as Sovereignty Extraction" },
    { id: "002", type: "paragraph", text: "These two things can happen at the same time. A manager can genuinely believe they are developing someone while systematically extracting their sovereignty. The playbook is familiar: frame every decision as mentorship, every boundary as insubordination, every original idea as \"not quite ready.\"" },
    { id: "003", type: "paragraph", text: "The managed person learns to check before acting, to present ideas as questions, to route their confidence through someone else's approval. This isn't development. It's dependency engineering." },
    { id: "004", type: "quote", text: "\"If a line cannot survive contact with builders, users, markets, and receipts, it should not survive the document.\"" },
    { id: "005", type: "paragraph", text: "The test is simple: after the management, does the person have more capacity to act independently, or less? If less, then what happened was extraction, regardless of what it was called." },
    { id: "006", type: "heading", text: "The Friction" },
    { id: "007", type: "paragraph", text: "There is a moment every builder knows. The room is aligned. The ideas are connecting. And then something stops." },
    { id: "008", type: "paragraph", text: "The instinct is to curse it." },
    { id: "009", type: "quote", text: "\"Friction is not failure. Friction is testimony.\"" },
  ];

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setActiveBlock(prev => {
          if (prev >= blocks.length - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, 3000 / speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, blocks.length]);

  const speeds = [0.75, 1, 1.25, 1.5, 2];
  const cycleSpeed = () => setSpeed(speeds[(speeds.indexOf(speed) + 1) % speeds.length]);

  const handleMic = () => {
    if (!showConvo) {
      setShowConvo(true);
      setPlaying(false);
      setMicActive(true);
      setTimeout(() => {
        setMicActive(false);
        setHasAnswer(true);
      }, 2000);
    } else {
      setShowConvo(false);
      setHasAnswer(false);
    }
  };

  const blockStyle = (type, isActive) => ({
    fontFamily: font,
    fontSize: type === "heading" ? 20 : 15,
    fontWeight: type === "heading" ? 700 : 400,
    color: type === "heading" ? "#fff" : type === "quote" ? C.amber : isActive ? C.text : "#aaa",
    fontStyle: type === "quote" ? "italic" : "normal",
    lineHeight: 1.7,
    transition: "color 0.4s ease",
  });

  const stripeColor = (type) =>
    type === "heading" ? "#fff" : type === "quote" ? C.amber : C.textDim;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <TopBar title="Leader" onBack={() => onNavigate("home")} onMore={() => {}} />

      {/* document */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        {blocks.map((block, i) => (
          <div
            key={block.id}
            onClick={() => { setActiveBlock(i); }}
            style={{
              display: "flex", gap: 12, padding: "12px 0",
              cursor: "pointer", position: "relative",
              background: i === activeBlock && playing ? `${C.green}0a` : "transparent",
              borderRadius: 4, transition: "background 0.4s",
              marginBottom: 2,
            }}
          >
            {/* stripe */}
            <div style={{
              width: 3, borderRadius: 2, flexShrink: 0,
              background: i === activeBlock && playing ? C.green : stripeColor(block.type),
              opacity: i === activeBlock && playing ? 1 : 0.4,
              transition: "all 0.4s",
            }} />
            {/* content */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: font, fontSize: 10, color: C.textDim, marginBottom: 4,
                textAlign: "right",
              }}>{block.id}</div>
              <div style={blockStyle(block.type, i === activeBlock)}>{block.text}</div>
            </div>
          </div>
        ))}
        <div style={{ height: 120 }} />
      </div>

      {/* conversation area */}
      {showConvo && (
        <div style={{
          padding: "14px 16px", borderTop: `1px solid ${C.border}`,
          background: C.surface,
          animation: "slideUp 0.3s ease",
        }}>
          {micActive ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, padding: "16px 0",
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: 6, background: C.green,
                animation: "pulse 1s ease infinite",
              }} />
              <span style={{ fontFamily: font, fontSize: 12, color: C.green }}>Listening...</span>
            </div>
          ) : hasAnswer ? (
            <div>
              <div style={{
                fontFamily: font, fontSize: 12, color: C.textSec,
                fontStyle: "italic", marginBottom: 10, paddingLeft: 10,
                borderLeft: `2px solid ${C.textDim}`,
              }}>
                "What does sovereignty extraction actually look like in practice?"
              </div>
              <div style={{ fontFamily: font, fontSize: 13, color: C.text, lineHeight: 1.7 }}>
                It shows up as control over decisions disguised as guidance. The document gives three examples in the next section — each one looks like mentorship from the outside but removes the person's capacity to act independently.
              </div>
              <div style={{
                display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap",
              }}>
                {["Give me an example", "How does this connect to receipts?"].map((s, i) => (
                  <button key={i} style={{
                    background: "none", border: `1px solid ${C.border}`, borderRadius: 20,
                    padding: "5px 12px", fontFamily: font, fontSize: 10,
                    color: C.textSec, cursor: "pointer",
                  }}>{s}</button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* player */}
      <div style={{
        padding: "16px", borderTop: `1px solid ${C.border}`,
        background: "#0a0a0a",
      }}>
        {/* controls */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
          marginBottom: 14,
        }}>
          <button
            onClick={() => setActiveBlock(Math.max(0, activeBlock - 1))}
            style={iconBtn}
          ><PrevIcon size={22} color={C.textSec} /></button>

          <button
            onClick={() => setPlaying(!playing)}
            style={{
              width: 52, height: 52, borderRadius: 26,
              background: playing ? C.green : C.surface,
              border: playing ? "none" : `1.5px solid ${C.green}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {playing
              ? <PauseIcon size={20} color="#000" />
              : <PlayIcon size={20} color={C.green} filled />
            }
          </button>

          <button
            onClick={() => setActiveBlock(Math.min(blocks.length - 1, activeBlock + 1))}
            style={iconBtn}
          ><NextIcon size={22} color={C.textSec} /></button>
        </div>

        {/* progress */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
        }}>
          <span style={{ fontFamily: font, fontSize: 10, color: C.textDim, width: 36 }}>
            {activeBlock + 1}/{blocks.length}
          </span>
          <div style={{
            flex: 1, height: 3, background: C.border, borderRadius: 2,
          }}>
            <div style={{
              width: `${((activeBlock + 1) / blocks.length) * 100}%`,
              height: "100%", background: C.green, borderRadius: 2,
              transition: "width 0.3s",
            }} />
          </div>
        </div>

        {/* bottom row: speed, mic, voice */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <button onClick={cycleSpeed} style={{
            ...pillBtn, minWidth: 36,
          }}>{speed}x</button>

          <button onClick={handleMic} style={{
            ...iconBtn,
            width: 36, height: 36, borderRadius: 18,
            border: showConvo ? `1.5px solid ${C.green}` : `1.5px solid ${C.border}`,
            background: micActive ? `${C.green}15` : "transparent",
          }}>
            <MicIcon size={18} color={showConvo ? C.green : C.textSec} active={micActive} />
          </button>

          <button style={pillBtn}>Seven</button>
        </div>
      </div>
    </div>
  );
}

/* ── Screen: Browse ── */
function BrowseScreen({ onNavigate }) {
  const docs = [
    { title: "Leader", type: "TXT", blocks: 23 },
    { title: "The Thesis", type: "DOCX", blocks: 14 },
    { title: "A monolith does not move.", type: "MD", blocks: 8 },
    { title: "Assembled Reality", type: "SAMPLE", blocks: 499 },
    { title: "The Convergence Spiral", type: "MD", blocks: 42 },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <TopBar title="Browse" onBack={() => onNavigate("home")} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 14,
        }}>
          <span style={{ fontFamily: font, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", fontWeight: 600 }}>
            SOURCES
          </span>
          <span style={{ fontFamily: font, fontSize: 10, color: C.textDim }}>{docs.length}</span>
        </div>

        {docs.map((doc, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 12px", marginBottom: 4,
            background: C.surface, borderRadius: 6,
            cursor: "pointer", border: `1px solid transparent`,
            transition: "border-color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.border}
            onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
            onClick={() => onNavigate("listen")}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate("listen"); }}
              style={{
                width: 36, height: 36, borderRadius: 18,
                background: "none", border: `1.5px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "border-color 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.green}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <PlayIcon size={14} color={C.textSec} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: font, fontSize: 13, color: C.text, fontWeight: 500,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{doc.title}</div>
              <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, marginTop: 3 }}>
                {doc.blocks} blocks
              </div>
            </div>
            <Badge>{doc.type}</Badge>
          </div>
        ))}

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 28, marginBottom: 12,
        }}>
          <span style={{ fontFamily: font, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", fontWeight: 600 }}>
            ASSEMBLIES
          </span>
          <span style={{ fontFamily: font, fontSize: 10, color: C.textDim }}>0</span>
        </div>
        <div style={{ fontFamily: font, fontSize: 12, color: C.textDim, fontStyle: "italic", padding: "0 12px" }}>
          You haven't assembled anything yet.
        </div>
      </div>
    </div>
  );
}

/* ── Screen: Assembly ── */
function AssemblyScreen({ onNavigate }) {
  const [blocks, setBlocks] = useState([
    { id: 1, from: "Leader", fromColor: C.blue, text: "What's Taught as Good Management but Functions as Sovereignty Extraction" },
    { id: 2, from: "The Thesis", fromColor: C.blue, text: "GitHub is the largest open dataset of assembled human coordination on Earth." },
    { id: 3, from: "AI · extracted", fromColor: C.green, text: "Both documents argue that coordination without receipts is aggregation — things pile up but nothing is selected, verified, or proven." },
  ]);
  const [assembled, setAssembled] = useState(false);

  const move = (i, dir) => {
    const t = i + dir;
    if (t < 0 || t >= blocks.length) return;
    const n = [...blocks];
    [n[i], n[t]] = [n[t], n[i]];
    setBlocks(n);
  };

  const remove = (i) => setBlocks(blocks.filter((_, idx) => idx !== i));

  const srcCount = new Set(blocks.map(b => b.from.replace("AI · extracted", "AI"))).size;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => onNavigate("home")} style={iconBtn}>
            <BackIcon size={20} color={C.textSec} />
          </button>
          <span style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.text }}>Assemble</span>
        </div>
        <button
          onClick={() => setBlocks([])}
          style={{ ...pillBtn, color: C.red, borderColor: `${C.red}33` }}
        >Clear</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {!assembled ? (
          <>
            <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 }}>
              NEW ASSEMBLY
            </div>
            <div style={{ fontFamily: font, fontSize: 12, color: C.textSec, marginBottom: 20 }}>
              {blocks.length} block{blocks.length !== 1 ? "s" : ""} from {srcCount} source{srcCount !== 1 ? "s" : ""}
            </div>

            {blocks.map((block, i) => (
              <div key={block.id} style={{
                background: C.surface, borderRadius: 6, padding: "14px",
                marginBottom: 8, border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>{i + 1}</span>
                    <span style={{ fontFamily: font, fontSize: 10, color: block.fromColor, fontWeight: 600 }}>
                      [{block.from}]
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => move(i, -1)} disabled={i === 0}
                      style={{ ...iconBtn, opacity: i === 0 ? 0.2 : 1, width: 28, height: 28 }}>
                      <span style={{ fontFamily: font, fontSize: 14, color: C.textSec }}>↑</span>
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1}
                      style={{ ...iconBtn, opacity: i === blocks.length - 1 ? 0.2 : 1, width: 28, height: 28 }}>
                      <span style={{ fontFamily: font, fontSize: 14, color: C.textSec }}>↓</span>
                    </button>
                    <button onClick={() => remove(i)}
                      style={{ ...iconBtn, width: 28, height: 28 }}>
                      <span style={{ fontFamily: font, fontSize: 14, color: C.red }}>−</span>
                    </button>
                  </div>
                </div>
                <div style={{
                  fontFamily: font, fontSize: 13, color: C.text, lineHeight: 1.6,
                }}>{block.text}</div>
              </div>
            ))}
          </>
        ) : (
          <div style={{
            textAlign: "center", padding: "40px 20px",
            animation: "fadeIn 0.4s ease",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 24, background: `${C.green}15`,
              border: `1.5px solid ${C.green}`, margin: "0 auto 16px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <GridIcon size={22} color={C.green} />
            </div>
            <div style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Your new doc is ready.
            </div>
            <div style={{ fontFamily: font, fontSize: 12, color: C.green }}>
              3 pieces · 2 sources + AI
            </div>
            <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 12 }}>
              It just showed up on your shelf.
            </div>
            <button
              onClick={() => onNavigate("listen")}
              style={{
                background: "none", border: `1px solid ${C.green}`, color: C.green,
                padding: "10px 24px", borderRadius: 4, cursor: "pointer",
                fontFamily: font, fontSize: 12, fontWeight: 600, marginTop: 20,
              }}
            >Listen to it now</button>
          </div>
        )}
      </div>

      {!assembled && blocks.length > 0 && (
        <div style={{ padding: "16px", borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => setAssembled(true)}
            style={{
              width: "100%", padding: "14px", borderRadius: 6,
              background: C.green, border: "none", cursor: "pointer",
              fontFamily: font, fontSize: 13, fontWeight: 700, color: "#000",
              letterSpacing: "0.04em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <GridIcon size={16} color="#000" />
            ASSEMBLE
          </button>
        </div>
      )}
    </div>
  );
}

/* ── App Shell ── */
export default function App() {
  const [screen, setScreen] = useState("home");

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", height: "100vh",
      background: C.bg, display: "flex", flexDirection: "column",
      overflow: "hidden", position: "relative",
      borderLeft: `1px solid ${C.border}`,
      borderRight: `1px solid ${C.border}`,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>

      {screen === "home" && <HomeScreen onNavigate={setScreen} />}
      {screen === "listen" && <ListenScreen onNavigate={setScreen} />}
      {screen === "browse" && <BrowseScreen onNavigate={setScreen} />}
      {screen === "assembly" && <AssemblyScreen onNavigate={setScreen} />}
    </div>
  );
}

const iconBtn = {
  background: "none", border: "none", cursor: "pointer", padding: 4,
  display: "flex", alignItems: "center", justifyContent: "center",
};

const pillBtn = {
  background: "none", border: `1px solid ${C.border}`,
  color: C.textSec, padding: "4px 10px", borderRadius: 20,
  fontFamily: font, fontSize: 11, cursor: "pointer",
};
