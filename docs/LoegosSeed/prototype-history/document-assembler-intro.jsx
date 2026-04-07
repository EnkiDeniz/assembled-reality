import { useState, useEffect } from "react";

const steps = [
  {
    id: "mess",
    headline: "You've got stuff everywhere.",
    body: "Notes from class. A PDF your boss sent. That article you saved three weeks ago. A voice memo from a walk. It's all in different places and none of it talks to each other.",
    visual: "mess",
  },
  {
    id: "pieces",
    headline: "We turn your stuff into pieces.",
    body: "Drop in a file — PDF, Word doc, anything. We chop it into pieces. Each piece is a paragraph, a heading, a quote. Like cutting lumber into boards before you build.",
    visual: "pieces",
  },
  {
    id: "listen",
    headline: "Listen instead of reading.",
    body: "Hit play. Your document reads itself out loud. The part you're hearing lights up so you always know where you are. Walk the dog. Do the dishes. Still learning.",
    visual: "listen",
  },
  {
    id: "pick",
    headline: "Pick the parts you care about.",
    body: "See something good? Hit the + button. It goes into your pocket. Do this across one document or five. You're shopping for the best parts.",
    visual: "pick",
  },
  {
    id: "build",
    headline: "Build something new from old parts.",
    body: "Your pocket has pieces from different places. Put them in order. Hit Assemble. You just built a new document — like building a treehouse from wood you found in three different yards.",
    visual: "build",
  },
  {
    id: "golive",
    headline: "Now go do it for real.",
    body: "Your document isn't the finish line. It's the starting line. Go have the meeting. Launch the project. Send the proposal. Live it. The tool will be here when you get back.",
    visual: "golive",
  },
  {
    id: "comeback",
    headline: "Come back. Tell it what happened.",
    body: "Did it work? What surprised you? What broke? Drop in what you learned — a note, a result, even just a sentence. The AI already knows what you planned. Now it knows what actually happened. The gap between the two is where you grow.",
    visual: "comeback",
  },
  {
    id: "go",
    headline: "Plan it. Live it. Learn from it.\nThat's the whole loop.",
    body: null,
    visual: "go",
  },
];

function MessVisual() {
  const items = [
    { text: "meeting_notes_march.pdf", rot: -3, x: -20, op: 0.35 },
    { text: "voice memo 2:34am", rot: 2, x: 50, op: 0.25 },
    { text: "\"we should really write this down\"", rot: -1, x: -10, op: 0.45 },
    { text: "research-paper-v3-FINAL-final.docx", rot: 1.5, x: 30, op: 0.3 },
    { text: "screenshot from slack", rot: -2.5, x: -30, op: 0.2 },
    { text: "that thing Sarah said on Tuesday", rot: 0.5, x: 40, op: 0.4 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", padding: "10px 0" }}>
      {items.map((item, i) => (
        <div key={i} style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
          color: "#888", opacity: item.op, fontStyle: "italic",
          transform: `rotate(${item.rot}deg) translateX(${item.x}px)`,
          animation: `fadeIn 0.5s ease ${i * 0.12}s both`,
        }}>{item.text}</div>
      ))}
    </div>
  );
}

function PiecesVisual() {
  const pieces = [
    { color: "#ffffff", label: "HEADING", text: "Project Plan" },
    { color: "#6b7280", label: "PARAGRAPH", text: "The goal is to ship by end of quarter with three milestones..." },
    { color: "#6b7280", label: "PARAGRAPH", text: "Each team owns one deliverable and reports weekly." },
    { color: "#f59e0b", label: "QUOTE", text: "\"Move fast but leave receipts.\"" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%", maxWidth: 400 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "stretch", gap: 10, padding: "8px 0",
          animation: `slideIn 0.4s ease ${i * 0.12}s both`,
        }}>
          <div style={{ width: 3, background: p.color, borderRadius: 2, opacity: 0.7 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#444", letterSpacing: "0.08em", marginBottom: 3 }}>{p.label}</div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: p.label === "HEADING" ? 15 : 12,
              fontWeight: p.label === "HEADING" ? 700 : 400,
              color: p.label === "QUOTE" ? "#f59e0b" : p.label === "HEADING" ? "#fff" : "#999",
              fontStyle: p.label === "QUOTE" ? "italic" : "normal", lineHeight: 1.6,
            }}>{p.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListenVisual() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setActive(prev => (prev + 1) % 3), 2000);
    return () => clearInterval(interval);
  }, []);
  const lines = [
    "The goal is to ship by end of quarter.",
    "Each team owns one deliverable.",
    "Move fast but leave receipts.",
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%", maxWidth: 400 }}>
      {lines.map((text, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 3,
          background: i === active ? "rgba(34,197,94,0.08)" : "transparent",
          transition: "background 0.4s ease",
        }}>
          <div style={{
            width: 3, alignSelf: "stretch", borderRadius: 2,
            background: i === active ? "#22c55e" : "#262626",
            transition: "background 0.4s ease",
          }} />
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
            color: i === active ? "#e0e0e0" : "#444",
            transition: "color 0.4s ease", lineHeight: 1.6,
          }}>{text}</div>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, justifyContent: "center" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 18, background: "#22c55e",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, color: "#000", fontWeight: 700,
        }}>▶</div>
        <div style={{ flex: 1, maxWidth: 180, height: 3, background: "#222", borderRadius: 2 }}>
          <div style={{
            width: `${((active + 1) / 3) * 100}%`, height: "100%",
            background: "#22c55e", borderRadius: 2, transition: "width 0.4s ease",
          }} />
        </div>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#444" }}>{active + 1}/3</span>
      </div>
    </div>
  );
}

function PickVisual() {
  const [picked, setPicked] = useState([false, false, true, false]);
  const items = [
    "The goal is to ship by end of quarter.",
    "Each team owns one deliverable.",
    "\"Move fast but leave receipts.\"",
    "Reports are due every Friday.",
  ];
  const toggle = (i) => setPicked(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  const count = picked.filter(Boolean).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%", maxWidth: 400 }}>
      {items.map((text, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px" }}>
          <button onClick={() => toggle(i)} style={{
            width: 24, height: 24, borderRadius: 3, background: "none", cursor: "pointer", padding: 0,
            border: picked[i] ? "1.5px solid #22c55e" : "1.5px solid #333",
            color: picked[i] ? "#22c55e" : "#555",
            fontSize: 15, lineHeight: "22px", textAlign: "center",
            transition: "all 0.15s", fontFamily: "monospace",
          }}>{picked[i] ? "−" : "+"}</button>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
            color: picked[i] ? "#e0e0e0" : "#666",
            transition: "color 0.15s", lineHeight: 1.6,
          }}>{text}</div>
        </div>
      ))}
      {count > 0 && (
        <div style={{
          marginTop: 10, padding: "8px 12px",
          background: "rgba(34,197,94,0.04)", border: "1px solid #1a3a1a",
          borderRadius: 3, fontFamily: "monospace", fontSize: 11, color: "#22c55e",
        }}>YOUR POCKET · {count} piece{count > 1 ? "s" : ""} saved</div>
      )}
    </div>
  );
}

function BuildVisual() {
  const [built, setBuilt] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 400, alignItems: "center" }}>
      {!built ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
            {[
              { from: "Project Plan", text: "Ship by end of quarter" },
              { from: "Sarah's Notes", text: "Each team owns one deliverable" },
              { from: "AI", text: "Summary of both documents" },
            ].map((b, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 10px", fontFamily: "monospace", fontSize: 11,
                background: "rgba(255,255,255,0.02)", borderRadius: 2,
              }}>
                <span style={{ color: "#444", width: 14 }}>{i + 1}</span>
                <span style={{ color: b.from === "AI" ? "#22c55e" : "#4a9eff", fontSize: 10, flexShrink: 0 }}>[{b.from}]</span>
                <span style={{ color: "#888" }}>{b.text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setBuilt(true)} style={{
            background: "#22c55e", border: "none", color: "#000",
            padding: "10px 28px", borderRadius: 3, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
            fontWeight: 700, marginTop: 12, letterSpacing: "0.04em",
          }}>ASSEMBLE</button>
        </>
      ) : (
        <div style={{
          width: "100%", padding: "18px", border: "1px solid #22c55e",
          borderRadius: 3, animation: "fadeIn 0.4s ease", textAlign: "center",
        }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            Your new doc is ready.
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#22c55e" }}>3 pieces · 2 sources + AI</div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#444", marginTop: 8 }}>
            It just showed up on your shelf. You can listen to it right now.
          </div>
        </div>
      )}
    </div>
  );
}

function GoLiveVisual() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800);
    const t2 = setTimeout(() => setStage(2), 1800);
    const t3 = setTimeout(() => setStage(3), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const moments = [
    { icon: "📋", text: "You walk into the meeting with your plan." },
    { icon: "🗣️", text: "You present it. People push back." },
    { icon: "✅", text: "Three things land. One doesn't." },
    { icon: "📝", text: "You take a note on your phone." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 380 }}>
      {moments.map((m, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "8px 0",
          opacity: i <= stage ? 1 : 0,
          transform: i <= stage ? "translateX(0)" : "translateX(12px)",
          transition: "all 0.5s ease",
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
            color: i <= stage ? "#999" : "#333", lineHeight: 1.6,
          }}>{m.text}</span>
        </div>
      ))}
    </div>
  );
}

function ComeBackVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 420 }}>
      {/* the return */}
      <div style={{
        padding: "10px 12px", background: "rgba(255,255,255,0.02)",
        borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12, color: "#999", marginBottom: 4,
      }}>
        <span style={{ color: "#444", fontSize: 10 }}>YOU ADDED:</span>
        <div style={{ marginTop: 4 }}>"Milestone 1 shipped on time. Milestone 2 slipped a week. Team B needs more support."</div>
      </div>

      {/* AI remembers */}
      <div style={{
        padding: "10px 12px", borderRadius: 3,
        border: "1px solid #1a2a1a",
        background: "rgba(34,197,94,0.03)",
      }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#22c55e", letterSpacing: "0.06em" }}>AI REMEMBERS YOUR PLAN</span>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
          color: "#888", marginTop: 6, lineHeight: 1.7,
        }}>
          Your plan had 3 milestones. 1 landed, 1 slipped, 1 is unclear. You flagged Team B. Want me to pull your original notes on Team B's deliverable so you can figure out what to adjust?
        </div>
      </div>

      {/* the gap */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginTop: 6, padding: "8px 0",
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginBottom: 4, letterSpacing: "0.08em" }}>WHAT YOU PLANNED</div>
          <div style={{ fontFamily: "monospace", fontSize: 20, color: "#4a9eff" }}>3</div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#444" }}>milestones</div>
        </div>
        <div style={{ color: "#333", fontFamily: "monospace", fontSize: 16 }}>→</div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginBottom: 4, letterSpacing: "0.08em" }}>WHAT HAPPENED</div>
          <div style={{ fontFamily: "monospace", fontSize: 20, color: "#f59e0b" }}>1</div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#444" }}>on time</div>
        </div>
        <div style={{ color: "#333", fontFamily: "monospace", fontSize: 16 }}>→</div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginBottom: 4, letterSpacing: "0.08em" }}>THE GAP</div>
          <div style={{ fontFamily: "monospace", fontSize: 20, color: "#22c55e" }}>2</div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#444" }}>to learn from</div>
        </div>
      </div>
    </div>
  );
}

function GoVisual() {
  const chain = [
    { word: "UPLOAD", color: "#888" },
    { word: "LISTEN", color: "#888" },
    { word: "PICK", color: "#888" },
    { word: "BUILD", color: "#888" },
    { word: "LIVE IT", color: "#f59e0b" },
    { word: "LEARN", color: "#22c55e" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{
        display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center",
      }}>
        {chain.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
              color: c.color, fontWeight: i >= 4 ? 700 : 400,
              letterSpacing: "0.06em",
            }}>{c.word}</span>
            {i < chain.length - 1 && <span style={{ color: "#333", fontSize: 11 }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{
        fontFamily: "monospace", fontSize: 10, color: "#444",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>then do it again</span>
        <span style={{ color: "#333" }}>↩</span>
      </div>
    </div>
  );
}

const visuals = {
  mess: MessVisual,
  pieces: PiecesVisual,
  listen: ListenVisual,
  pick: PickVisual,
  build: BuildVisual,
  golive: GoLiveVisual,
  comeback: ComeBackVisual,
  go: GoVisual,
};

export default function Intro() {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Visual = visuals[current.visual];
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      minHeight: "100vh", background: "#0e0e0e", color: "#c8c8c8",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div style={{ display: "flex", gap: 5, marginBottom: 48 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 3,
            background: i === step ? "#22c55e" : i < step ? "#1a3a1a" : "#1a1a1a",
            borderRadius: 2, transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      <div key={`h-${step}`} style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 21, fontWeight: 700, color: "#fff",
        textAlign: "center", marginBottom: current.body ? 12 : 32,
        maxWidth: 440, lineHeight: 1.4, whiteSpace: "pre-line",
        animation: "fadeIn 0.4s ease",
      }}>
        {current.headline}
      </div>

      {current.body && (
        <div key={`b-${step}`} style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13, color: "#777", textAlign: "center",
          maxWidth: 400, lineHeight: 1.8, marginBottom: 36,
          animation: "fadeIn 0.4s ease 0.1s both",
        }}>
          {current.body}
        </div>
      )}

      <div key={`v-${step}`} style={{
        marginBottom: 48, width: "100%", maxWidth: 480,
        display: "flex", justifyContent: "center",
        animation: "fadeIn 0.4s ease 0.2s both",
      }}>
        <Visual />
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{
            background: "none", border: "1px solid #333", color: "#555",
            padding: "10px 20px", borderRadius: 3, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
          }}>BACK</button>
        )}
        <button onClick={() => !isLast && setStep(step + 1)} style={{
          background: isLast ? "#22c55e" : "none",
          border: isLast ? "none" : "1px solid #22c55e",
          color: isLast ? "#000" : "#22c55e",
          padding: "10px 28px", borderRadius: 3, cursor: "pointer",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
          fontWeight: 700, letterSpacing: "0.04em",
        }}>{isLast ? "LET'S GO" : "NEXT"}</button>
      </div>

      {!isLast && (
        <button onClick={() => setStep(steps.length - 1)} style={{
          background: "none", border: "none", color: "#333",
          marginTop: 16, cursor: "pointer", fontFamily: "monospace", fontSize: 10,
        }}>skip intro</button>
      )}
    </div>
  );
}
