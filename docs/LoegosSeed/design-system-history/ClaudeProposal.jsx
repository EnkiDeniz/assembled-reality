import { useState } from "react";

// ═══════════════════════════════════════════════════════════
// LŒGOS DESIGN SYSTEM v3.0 — UNIFIED
//
// Desktop: assembled workspace, phase lanes, composed views
// Mobile: reality navigation, quick capture, compass, radar
// One system. One philosophy. Every screen size.
//
// △ aim → □ reality → œ weld → 𒐛 seal
// ═══════════════════════════════════════════════════════════

const t = {
  ground: "#0C0C0E", s1: "#121214", s2: "#17171A", s3: "#1D1D21", s4: "#242428",
  white: "#EEEEF0", sec: "#8B8B92", muted: "#4E4E56", ghost: "#2D2D33",
  blue: "#4A9EF2", blueDim: "rgba(74,158,242,0.08)", blueSoft: "rgba(74,158,242,0.15)",
  green: "#5EC269", greenDim: "rgba(94,194,105,0.08)",
  amber: "#E5A84B", amberDim: "rgba(229,168,75,0.08)",
  red: "#E05A52", redDim: "rgba(224,90,82,0.08)",
  neutral: "#6B6B73",
  border: "rgba(255,255,255,0.04)", borderLit: "rgba(255,255,255,0.08)",
  mono: "'JetBrains Mono','SF Mono',monospace",
  sans: "'Inter',-apple-system,sans-serif",
};

const shapes = {
  aim:     { glyph: "△", label: "Aim",     prompt: "What are you promising?",  desc: "What was intended, promised, or declared." },
  reality: { glyph: "□", label: "Reality", prompt: "What evidence exists?",     desc: "What pushed back with evidence, constraint, or measurement." },
  weld:    { glyph: "œ", label: "Weld",    prompt: "What converged?",           desc: "Where aim and reality meet and return a signal." },
  seal:    { glyph: "𒐛", label: "Seal",    prompt: "What gets sealed?",         desc: "The proof. The receipt. Seven." },
};

const sigMap = { released: "green", sealed: "green", clear: "green", committing: "amber", collecting: "amber", shaping: "amber", proving: "amber", active: "amber", blocked: "red", alert: "red", overdue: "red", waiting: "neutral", dormant: "neutral", draft: "neutral" };
const sigC = (s) => t[sigMap[s] || "neutral"];
const sigD = (s) => ({ green: t.greenDim, amber: t.amberDim, red: t.redDim, neutral: "rgba(107,107,115,0.06)" }[sigMap[s] || "neutral"]);

// ═══════════════════════════════════════════════════════════
// PRIMITIVES — shared across desktop + mobile
// ═══════════════════════════════════════════════════════════

function DepthStack({ depth = 0, size = 24 }) {
  const colors = [t.muted, t.amber, t.blue, t.green];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, width: size, alignItems: "center", flexShrink: 0 }}>
      {[0,1,2,3].map(i => <div key={i} style={{ width: size - (3-i)*4, height: 2, borderRadius: 1, backgroundColor: i < depth ? colors[i] : t.border }} />)}
    </div>
  );
}

function ConvergenceBar({ percent = 0, width = 120 }) {
  const w = (width/2) * (percent/100);
  const welded = percent >= 90;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.muted }}>△</span>
      <div style={{ width, height: 4, backgroundColor: t.border, borderRadius: 2, position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: w, height: "100%", backgroundColor: t.blue, borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: w, height: "100%", backgroundColor: t.green, borderRadius: "0 2px 2px 0" }} />
        {welded && <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 8, height: 8, borderRadius: 4, backgroundColor: t.amber, boxShadow: `0 0 8px ${t.amber}40` }} />}
      </div>
      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.muted }}>□</span>
      {welded && <span style={{ fontFamily: t.sans, fontSize: 12, fontWeight: 700, color: t.amber }}>œ</span>}
    </div>
  );
}

function SignalDot({ status, size = 6 }) {
  return <span style={{ width: size, height: size, borderRadius: size/2, backgroundColor: sigC(status), display: "inline-block", flexShrink: 0 }} />;
}

function Indicator({ status, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: sigC(status), lineHeight: 1 }}>
      <SignalDot status={status} />{label || status}
    </span>
  );
}

function TrustBadge({ level }) {
  const c = [t.neutral, t.amber, t.green][level-1];
  const d = [sigD("waiting"), sigD("committing"), sigD("released")][level-1];
  return <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: c, backgroundColor: d, padding: "3px 8px", borderRadius: 3, lineHeight: 1 }}>L{level}</span>;
}

function ShapeIcon({ shape, size = 18, color }) {
  const s = shapes[shape];
  return s ? <span style={{ fontSize: size, color: color || t.blue, lineHeight: 1, fontWeight: shape === "weld" ? 700 : 400, display: "inline-flex", alignItems: "center", justifyContent: "center", width: size*1.2, height: size*1.2, flexShrink: 0 }}>{s.glyph}</span> : null;
}

function Btn({ variant = "secondary", children, size = "md", full }) {
  const sizes = { sm: { padding: "5px 10px", fontSize: 10 }, md: { padding: "8px 16px", fontSize: 11 }, lg: { padding: "12px 20px", fontSize: 13 } };
  const variants = { primary: { backgroundColor: t.blue, color: t.ground }, secondary: { backgroundColor: t.s3, color: t.sec }, ghost: { backgroundColor: "transparent", color: t.muted } };
  return <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, border: "none", borderRadius: 4, fontFamily: t.mono, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", lineHeight: 1, width: full ? "100%" : "auto", ...sizes[size], ...variants[variant] }}>{children}</button>;
}

function MetricsStrip({ items }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {items.map((m, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: t.mono, fontSize: 11, fontWeight: 600, color: t.sec }}>
          {m.icon && <span style={{ fontSize: 12, color: t.muted }}>{m.icon}</span>}
          {m.value}
          {m.label && <span style={{ fontSize: 9, fontWeight: 500, color: t.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{m.label}</span>}
        </span>
      ))}
    </div>
  );
}

function CountHeader({ title, current, total, shape }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      {shape && <ShapeIcon shape={shape} size={14} />}
      <span style={{ fontFamily: t.sans, fontSize: 18, fontWeight: 700, color: t.white }}>{title}</span>
      {(current !== undefined || total !== undefined) && <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 500, color: t.muted }}>{current !== undefined && total !== undefined ? `${current}/${total}` : current || total}</span>}
    </div>
  );
}

function Nav({ active }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 12px", backgroundColor: t.s1, borderTop: `1px solid ${t.border}` }}>
      {Object.entries(shapes).map(([key, s]) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 14px", cursor: "pointer", position: "relative" }}>
          <span style={{ fontSize: 15, color: active === key ? t.white : t.muted, fontWeight: key === "weld" ? 700 : 400 }}>{s.glyph}</span>
          <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: active === key ? t.white : t.muted }}>{s.label}</span>
          {active === key && <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 12, height: 2, borderRadius: 1, backgroundColor: t.blue }} />}
        </div>
      ))}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 14px", cursor: "pointer" }}>
        <span style={{ fontSize: 15, color: t.muted }}>+</span>
        <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.muted }}>Add</span>
      </div>
    </div>
  );
}

function Divider({ label }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}><div style={{ flex: 1, height: 1, backgroundColor: t.border }} />{label && <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: t.ghost }}>{label}</span>}<div style={{ flex: 1, height: 1, backgroundColor: t.border }} /></div>;
}

function SH({ title, desc }) {
  return <div style={{ marginBottom: 24 }}><h2 style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: t.blue, margin: 0 }}>{title}</h2>{desc && <p style={{ fontFamily: t.sans, fontSize: 13, color: t.sec, margin: "8px 0 0", lineHeight: 1.5 }}>{desc}</p>}</div>;
}

// ═══════════════════════════════════════════════════════════
// BLOCKS + ASSEMBLED CARDS (Desktop + Mobile shared)
// ═══════════════════════════════════════════════════════════

function Block({ shape, children, status, depth, image, time, location }) {
  const s = shapes[shape];
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 14px", backgroundColor: t.s2, borderRadius: 6, borderLeft: `2px solid ${status ? sigC(status) : t.border}` }}>
      {s && <span style={{ fontSize: 13, color: t.muted, lineHeight: 1.4, flexShrink: 0 }}>{s.glyph}</span>}
      <div style={{ flex: 1 }}>
        {image && <div style={{ width: "100%", height: 80, backgroundColor: t.s3, borderRadius: 4, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 20, color: t.ghost }}>◻</span></div>}
        <div style={{ fontFamily: t.sans, fontSize: 13, color: t.white, lineHeight: 1.5 }}>{children}</div>
        {(time || location) && <div style={{ display: "flex", gap: 12, marginTop: 6 }}>{time && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ghost }}>{time}</span>}{location && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ghost }}>📍 {location}</span>}</div>}
      </div>
      {depth !== undefined && <DepthStack depth={depth} size={16} />}
    </div>
  );
}

function AssembledCard({ shape, label, title, blocks = [], depth = 0, convergence, status, trust, meta, actions = [], metrics, children }) {
  const s = shapes[shape] || shapes.reality;
  const [open, setOpen] = useState(false);
  const bc = blocks.length;
  return (
    <div style={{ backgroundColor: t.s2, borderRadius: 10, overflow: "hidden", border: `1px solid ${t.border}` }}>
      <div style={{ padding: "20px 20px 16px", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "12px 14px", alignItems: "start", cursor: bc > 0 ? "pointer" : "default" }} onClick={() => bc > 0 && setOpen(!open)}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 2 }}>
          <span style={{ fontSize: 18, color: t.blue, fontWeight: shape === "weld" ? 700 : 400 }}>{s.glyph}</span>
          <DepthStack depth={depth} size={20} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {label && <span style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.blue }}>{label}</span>}
            {trust && <TrustBadge level={trust} />}
          </div>
          <div style={{ fontFamily: t.sans, fontSize: 15, fontWeight: 600, color: t.white, lineHeight: 1.35, marginBottom: 4 }}>{title}</div>
          {convergence !== undefined && <div style={{ marginTop: 8 }}><ConvergenceBar percent={convergence} width={160} /></div>}
          {metrics && <div style={{ marginTop: 8 }}>{metrics}</div>}
          {meta && <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, marginTop: 8 }}>{meta}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {status && <Indicator status={status} />}
          {bc > 0 && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.muted }}>{bc} blocks {open ? "▴" : "▾"}</span>}
        </div>
      </div>
      {actions.length > 0 && <div style={{ padding: "0 20px 16px", display: "flex", gap: 8, justifyContent: "flex-end" }}>{actions}</div>}
      {open && bc > 0 && (
        <div style={{ borderTop: `1px solid ${t.border}`, padding: "12px 20px 16px", display: "flex", flexDirection: "column", gap: 6, backgroundColor: t.s1 }}>
          <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: t.ghost, marginBottom: 2 }}>Assembled from</span>
          {blocks.map((b, i) => <Block key={i} shape={b.shape} status={b.status} depth={b.depth}>{b.text}</Block>)}
        </div>
      )}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DESKTOP COMPONENTS
// ═══════════════════════════════════════════════════════════

function PhaseLane({ items = [] }) {
  const phases = ["aim", "reality", "weld", "seal"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, backgroundColor: t.s1, borderRadius: 10, overflow: "hidden" }}>
      {phases.map(p => {
        const pi = items.filter(i => i.phase === p);
        return (
          <div key={p} style={{ padding: "14px 12px", backgroundColor: t.s2, display: "flex", flexDirection: "column", gap: 8, minHeight: 90 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: t.blue, fontWeight: p === "weld" ? 700 : 400 }}>{shapes[p].glyph}</span>
              <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.muted }}>{shapes[p].label}</span>
              <span style={{ fontFamily: t.mono, fontSize: 8, color: t.ghost, marginLeft: "auto" }}>{pi.length}</span>
            </div>
            {pi.map((item, i) => (
              <div key={i} style={{ padding: "8px 10px", backgroundColor: t.s3, borderRadius: 6, borderLeft: `2px solid ${item.status ? sigC(item.status) : t.border}` }}>
                <div style={{ fontFamily: t.sans, fontSize: 12, color: t.white, lineHeight: 1.4, marginBottom: 4 }}>{item.title}</div>
                <DepthStack depth={item.depth} size={16} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function OperatorInput({ shape, placeholder }) {
  const s = shapes[shape];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", backgroundColor: t.s1, borderRadius: 8, borderBottom: `1px solid ${t.borderLit}` }}>
      {s && <span style={{ fontSize: 14, color: t.muted, fontWeight: shape === "weld" ? 700 : 400 }}>{s.glyph}</span>}
      <span style={{ fontFamily: t.sans, fontSize: 13, color: t.ghost, flex: 1 }}>{placeholder || s?.prompt || "Smallest move that still matters."}</span>
      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ghost }}>⏎</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MOBILE COMPONENTS
// ═══════════════════════════════════════════════════════════

function Compass({ activeBox, aims = 0, realities = 0, welds = 0, sealed = 0 }) {
  const total = aims + realities + welds + sealed || 1;
  const segs = [
    { shape: "aim", count: aims, color: t.blue },
    { shape: "reality", count: realities, color: t.green },
    { shape: "weld", count: welds, color: t.amber },
    { shape: "seal", count: sealed, color: t.muted },
  ];
  return (
    <div style={{ backgroundColor: t.s2, borderRadius: 12, padding: "16px 20px" }}>
      {activeBox && <div style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.muted, marginBottom: 12 }}>{activeBox}</div>}
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 2, marginBottom: 14 }}>
        {segs.map(s => s.count > 0 && <div key={s.shape} style={{ flex: s.count/total, backgroundColor: s.color, borderRadius: 2, minWidth: 4 }} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {segs.map(s => (
          <div key={s.shape} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 14, color: s.count > 0 ? s.color : t.ghost, fontWeight: s.shape === "weld" ? 700 : 400 }}>{shapes[s.shape].glyph}</span>
            <span style={{ fontFamily: t.mono, fontSize: 14, fontWeight: 700, color: s.count > 0 ? t.white : t.ghost }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickCapture({ activeShape, onSelect }) {
  return (
    <div style={{ backgroundColor: t.s2, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ height: 180, backgroundColor: t.ground, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 120, height: 120, border: `1px solid ${t.borderLit}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: t.sans, fontSize: 11, color: t.ghost, textAlign: "center", lineHeight: 1.5 }}>Point at reality.<br/>Tap to capture.</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["◻","Photo",true],["◉","Voice",false],["⌨","Text",false]].map(([ic,lb,ac]) => (
            <div key={lb} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 16, color: ac ? t.white : t.muted }}>{ic}</span>
              <span style={{ fontFamily: t.mono, fontSize: 7, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: ac ? t.white : t.muted }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: t.ghost, marginBottom: 12 }}>What did you catch?</div>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(shapes).map(([key, s]) => {
            const a = activeShape === key;
            return (
              <div key={key} onClick={() => onSelect?.(key)} style={{ flex: 1, padding: "12px 8px", borderRadius: 8, backgroundColor: a ? t.blueDim : t.s3, border: `1px solid ${a ? t.blueSoft : t.border}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16, color: a ? t.blue : t.muted, fontWeight: key === "weld" ? 700 : 400 }}>{s.glyph}</span>
                <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: a ? t.blue : t.muted }}>{s.label}</span>
              </div>
            );
          })}
        </div>
        {activeShape && (
          <div style={{ marginTop: 12 }}>
            <OperatorInput shape={activeShape} />
            <div style={{ marginTop: 12 }}><Btn variant="primary" size="md" full>Add to Box</Btn></div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssemblyRadar({ items = [] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ backgroundColor: t.s2, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <DepthStack depth={item.depth} size={18} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.sans, fontSize: 13, fontWeight: 500, color: t.white, marginBottom: 6 }}>{item.title}</div>
            <ConvergenceBar percent={item.convergence} width={140} />
          </div>
          <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 700, color: item.convergence >= 90 ? t.amber : t.muted }}>{item.convergence}%</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// APP — TABBED SECTIONS
// ═══════════════════════════════════════════════════════════

const sections = [
  { id: "shapes",     label: "Shapes" },
  { id: "primitives", label: "Primitives" },
  { id: "desktop",    label: "Desktop" },
  { id: "mobile",     label: "Mobile" },
  { id: "tokens",     label: "Tokens" },
];

export default function App() {
  const [sec, setSec] = useState("shapes");
  const [capShape, setCapShape] = useState(null);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.ground, color: t.white, fontFamily: t.sans }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: t.ground, padding: "12px 24px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
          <span style={{ fontFamily: t.mono, fontSize: 14, fontWeight: 700, letterSpacing: "0.16em" }}>LŒGOS</span>
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.muted }}>Design System v3.0</span>
        </div>
        <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSec(s.id)} style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 12px", border: "none", borderRadius: 4, cursor: "pointer", backgroundColor: sec === s.id ? t.s3 : "transparent", color: sec === s.id ? t.white : t.muted, whiteSpace: "nowrap" }}>{s.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 760, margin: "0 auto" }}>

        {/* ── SHAPES ─────────────────────────────────────── */}
        {sec === "shapes" && (
          <>
            <SH title="Shape Language" desc="Four glyphs. Four phases. The icon system, the navigation, the philosophy." />

            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 32 }}>
              {Object.entries(shapes).map(([key, s]) => (
                <div key={key} style={{ backgroundColor: t.s2, borderRadius: 8, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <ShapeIcon shape={key} size={22} color={t.amber} />
                  <div>
                    <div style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.white, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: t.sans, fontSize: 13, color: t.sec, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 32 }}>
              {Object.entries(shapes).map(([key, s], i) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <ShapeIcon shape={key} size={20} />
                    <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, color: t.muted, textTransform: "uppercase" }}>{s.label}</span>
                  </div>
                  {i < 3 && <span style={{ fontFamily: t.mono, fontSize: 12, color: t.ghost }}>→</span>}
                </div>
              ))}
            </div>

            <Divider label="Orthogonal Systems" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ backgroundColor: t.s2, borderRadius: 8, padding: 20 }}>
                <div style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.blue, marginBottom: 12 }}>Shapes = WHAT phase</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(shapes).map(([k, s]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ShapeIcon shape={k} size={14} />
                      <span style={{ fontFamily: t.mono, fontSize: 10, color: t.sec }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: t.s2, borderRadius: 8, padding: 20 }}>
                <div style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.green, marginBottom: 12 }}>Signals = HOW urgent</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[["green","Clear","released"],["amber","Active","committing"],["red","Act now","blocked"],["neutral","Waiting","waiting"]].map(([,l,s]) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <SignalDot status={s} size={8} />
                      <span style={{ fontFamily: t.mono, fontSize: 10, color: sigC(s) }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Divider label="Assembly Depth" />
            <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
              {[1,2,3,4].map(d => (
                <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <DepthStack depth={d} size={28} />
                  <span style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 600, color: t.white }}>d={d}</span>
                  <span style={{ fontFamily: t.mono, fontSize: 8, color: t.muted, textTransform: "uppercase" }}>{["Collected","Shaped","Proved","Sealed"][d-1]}</span>
                </div>
              ))}
            </div>

            <Divider label="Convergence" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[20,50,75,92,100].map(p => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, minWidth: 32, textAlign: "right" }}>{p}%</span>
                  <ConvergenceBar percent={p} width={200} />
                </div>
              ))}
            </div>

            <Divider label="Trust" />
            <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
              {[1,2,3].map(l => (
                <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <TrustBadge level={l} />
                  <span style={{ fontFamily: t.mono, fontSize: 8, color: t.ghost }}>{["unverified","partial","verified"][l-1]}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PRIMITIVES ─────────────────────────────────── */}
        {sec === "primitives" && (
          <>
            <SH title="Blocks" desc="The operator sentence made visual. One shape + one statement + one signal. The atom of assembly." />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 32 }}>
              <Block shape="aim" status="committing" depth={1}>Ship prototype to Melih by Friday.</Block>
              <Block shape="reality" status="released" depth={2}>Prototype shared. Feedback received.</Block>
              <Block shape="weld" status="proving" depth={3}>92% convergence. One open question.</Block>
              <Block shape="seal" status="sealed" depth={4}>Sealed Apr 5, 2026. Receipt generated.</Block>
            </div>

            <Divider />
            <SH title="Buttons" />
            <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
              <Btn variant="primary" size="sm">Seal</Btn>
              <Btn variant="secondary" size="sm">Open</Btn>
              <Btn variant="ghost" size="sm">Add Source</Btn>
              <Btn variant="primary" size="md">Add to Box</Btn>
              <Btn variant="secondary" size="md">Track</Btn>
            </div>

            <Divider />
            <SH title="Inputs" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
              <OperatorInput shape="aim" />
              <OperatorInput shape="reality" />
              <OperatorInput shape="weld" />
              <OperatorInput shape="seal" />
            </div>

            <Divider />
            <SH title="Navigation" />
            <div style={{ borderRadius: 10, overflow: "hidden" }}><Nav active="reality" /></div>
          </>
        )}

        {/* ── DESKTOP ────────────────────────────────────── */}
        {sec === "desktop" && (
          <>
            <SH title="Desktop Workspace" desc="Assembled cards, phase lanes, operator inputs. Full workspace view." />

            <div style={{ backgroundColor: t.ground, borderRadius: 12, overflow: "hidden", border: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em" }}>LŒGOS</span>
                <div style={{ flex: 1 }} />
                <Btn variant="ghost" size="sm">Seven</Btn>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                  <CountHeader title="Reality" current={79} shape="reality" />
                  <div style={{ display: "flex", gap: 12 }}><Indicator status="released" /><Indicator status="committing" /></div>
                </div>

                <AssembledCard
                  shape="reality" label="Reality" title="Listen · Lœgos — Origin, Evolution, Feedback, and Receipt"
                  depth={3} status="released" trust={3} convergence={92}
                  metrics={<MetricsStrip items={[{value:"11",label:"sources"},{value:"45",label:"entries"}]} />}
                  meta="Deniz · Apr 5, 2026"
                  actions={[<Btn key="a" variant="ghost" size="sm">Add Source</Btn>, <Btn key="b" variant="secondary" size="sm">Open</Btn>]}
                  blocks={[
                    { shape: "aim", text: "Create a listening experience that proves assembly.", status: "released", depth: 4 },
                    { shape: "reality", text: "99 entries from origin corpus.", status: "released", depth: 3 },
                    { shape: "weld", text: "Evidence aligns — assembly index ready.", status: "proving", depth: 3 },
                  ]}
                />

                <div style={{ height: 16 }} />

                <PhaseLane items={[
                  { phase: "aim", title: "Draft Seven Post 3", status: "active", depth: 1 },
                  { phase: "reality", title: "Builder code review", status: "committing", depth: 2 },
                  { phase: "weld", title: "Feedback — 92%", status: "proving", depth: 3 },
                  { phase: "seal", title: "Prototype receipt", status: "sealed", depth: 4 },
                ]} />

                <div style={{ height: 16 }} />
                <OperatorInput shape="reality" />
              </div>

              <Nav active="reality" />
            </div>
          </>
        )}

        {/* ── MOBILE ─────────────────────────────────────── */}
        {sec === "mobile" && (
          <>
            <SH title="Mobile — Reality Navigation" desc="The phone is a reality sensor. Compass, radar, capture, stream." />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Phone 1: Home */}
              <div style={{ backgroundColor: t.ground, borderRadius: 20, overflow: "hidden", border: `1px solid ${t.border}` }}>
                <div style={{ padding: "8px 14px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em" }}>LŒGOS</span>
                  <span style={{ fontFamily: t.mono, fontSize: 9, color: t.muted }}>6:44 PM</span>
                </div>
                <div style={{ padding: "0 10px 8px" }}>
                  <Compass activeBox="Prototype → Melih" aims={3} realities={5} welds={2} sealed={1} />
                </div>
                <div style={{ padding: "0 10px 8px" }}>
                  <div style={{ backgroundColor: t.s2, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <DepthStack depth={3} size={14} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: t.sans, fontSize: 11, fontWeight: 500, color: t.white, marginBottom: 4 }}>Ship prototype</div>
                      <ConvergenceBar percent={92} width={100} />
                    </div>
                    <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: t.amber }}>92%</span>
                  </div>
                </div>
                <div style={{ padding: "0 10px" }}>
                  <Block shape="reality" status="collecting" depth={1} time="6:42 PM" location="W 14th">Triangle poster spotted.</Block>
                  <div style={{ height: 4 }} />
                  <Block shape="weld" status="proving" depth={3} time="4:45 PM">Melih + demo = 92%.</Block>
                </div>
                <div style={{ height: 8 }} />
                <Nav active="reality" />
              </div>

              {/* Phone 2: Capture */}
              <div style={{ backgroundColor: t.ground, borderRadius: 20, overflow: "hidden", border: `1px solid ${t.border}` }}>
                <div style={{ padding: "8px 14px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em" }}>CAPTURE</span>
                  <span style={{ fontFamily: t.mono, fontSize: 9, color: t.muted }}>6:45 PM</span>
                </div>
                <QuickCapture activeShape={capShape} onSelect={setCapShape} />
              </div>
            </div>

            <Divider label="Assembly Radar" />
            <AssemblyRadar items={[
              { title: "Ship prototype for Melih", convergence: 92, depth: 3 },
              { title: "Draft Seven Post 3", convergence: 45, depth: 2 },
              { title: "Design system for Builders", convergence: 78, depth: 2 },
              { title: "Yuki trial — UPenn", convergence: 30, depth: 1 },
            ]} />
          </>
        )}

        {/* ── TOKENS ─────────────────────────────────────── */}
        {sec === "tokens" && (
          <>
            <SH title="Color Tokens" desc="Blue = brand. Green/amber/red = signals. Never cross." />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              <div style={{ backgroundColor: t.s2, borderRadius: 8, padding: 20 }}>
                <div style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.blue, marginBottom: 16 }}>Brand</div>
                {[["accent",t.blue,"#4A9EF2"],["accentDim",t.blueDim,"8%"],["accentSoft",t.blueSoft,"15%"]].map(([n,c,v]) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: c }} />
                    <span style={{ fontFamily: t.mono, fontSize: 10, color: t.sec }}>{n}</span>
                    <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ghost, marginLeft: "auto" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ backgroundColor: t.s2, borderRadius: 8, padding: 20 }}>
                <div style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.green, marginBottom: 16 }}>Signals</div>
                {[["green",t.green],["amber",t.amber],["red",t.red],["neutral",t.neutral]].map(([n,c]) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: c }} />
                    <span style={{ fontFamily: t.mono, fontSize: 10, color: c }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>

            <SH title="Surfaces" />
            <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
              {[["ground",t.ground],["s1",t.s1],["s2",t.s2],["s3",t.s3],["s4",t.s4]].map(([n,c]) => (
                <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: "100%", height: 40, backgroundColor: c, borderRadius: 4, border: `1px solid ${t.borderLit}` }} />
                  <span style={{ fontFamily: t.mono, fontSize: 8, color: t.muted }}>{n}</span>
                </div>
              ))}
            </div>

            <SH title="Text" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
              {[["primary",t.white,"Content you read"],["secondary",t.sec,"Supporting context"],["muted",t.muted,"Labels, metadata"],["ghost",t.ghost,"Structural lines"]].map(([n,c,ex]) => (
                <div key={n} style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                  <span style={{ fontFamily: t.mono, fontSize: 9, color: t.muted, minWidth: 56, textAlign: "right" }}>{n}</span>
                  <span style={{ fontFamily: t.sans, fontSize: 14, color: c }}>{ex}</span>
                </div>
              ))}
            </div>

            <SH title="Typography" />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "label", f: t.mono, s: 10, w: 600, ls: "0.1em", tt: "uppercase", ex: "RELEASED · COMMITTING" },
                { label: "mono", f: t.mono, s: 12, w: 500, ls: "0.03em", tt: "none", ex: "11 sources 45 entries" },
                { label: "body", f: t.sans, s: 13, w: 400, ls: "0.01em", tt: "none", ex: "Assembly Index is ready." },
                { label: "body-lg", f: t.sans, s: 15, w: 400, ls: "0", tt: "none", ex: "Close the gap between what you think and what you do." },
                { label: "heading", f: t.sans, s: 17, w: 600, ls: "-0.01em", tt: "none", ex: "Origin, Evolution, Feedback, and Receipt" },
                { label: "title", f: t.mono, s: 15, w: 700, ls: "0.08em", tt: "uppercase", ex: "How Lœgos Assembled Itself" },
                { label: "display", f: t.sans, s: 24, w: 700, ls: "-0.02em", tt: "none", ex: "Meaning is an assembled object." },
              ].map(x => (
                <div key={x.label} style={{ display: "flex", gap: 16 }}>
                  <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ghost, minWidth: 50, textAlign: "right", paddingTop: 4, flexShrink: 0 }}>{x.label}</span>
                  <div>
                    <div style={{ fontFamily: x.f, fontSize: x.s, fontWeight: x.w, letterSpacing: x.ls, textTransform: x.tt, color: t.white, lineHeight: 1.35 }}>{x.ex}</div>
                    <div style={{ fontFamily: t.mono, fontSize: 8, color: t.ghost, marginTop: 2 }}>{x.s}px · {x.w}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 24, borderTop: `1px solid ${t.border}`, textAlign: "center" }}>
          <span style={{ fontFamily: t.mono, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: t.ghost }}>Lœgos Design System v3.0 · △ □ œ 𒐛 · Assembled Design · Lakin.ai</span>
        </div>
      </div>
    </div>
  );
}
