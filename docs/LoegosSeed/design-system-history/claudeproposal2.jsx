import { useState } from "react";

// ═══════════════════════════════════════════════════════════
// LŒGOS DESIGN SYSTEM v3.1 — CONVERGENCE
//
// Best of both proposals.
// Shape language: △ □ œ 𒐛 (non-negotiable)
// Assembled cards with expandable blocks (ours)
// Object glyph that fills with assembly (theirs, adapted)
// Surface gradients for soft depth (theirs)
// Responsive typography (theirs)
// Convergence bars, depth stacks, dashboard signals (ours)
// Mobile capture, compass, radar (ours)
// ═══════════════════════════════════════════════════════════

const t = {
  canvas: "#0c0d10",
  shell: "#121315",
  raised: "#1a1d22",
  s3: "#1f2228",
  s4: "#262a30",

  white: "#f0f2f4",
  soft: "rgba(255,255,255,0.70)",
  meta: "rgba(255,255,255,0.42)",
  ghost: "rgba(255,255,255,0.18)",
  void: "rgba(255,255,255,0.06)",

  blue: "#5ea7ff",
  blueDim: "rgba(94,167,255,0.10)",
  blueSoft: "rgba(94,167,255,0.22)",
  green: "#7fd9a0",
  greenDim: "rgba(127,217,160,0.10)",
  amber: "#f0bf69",
  amberDim: "rgba(240,191,105,0.10)",
  red: "#ff7f7f",
  redDim: "rgba(255,127,127,0.10)",
  neutral: "#717780",

  line: "rgba(255,255,255,0.07)",
  lineLit: "rgba(255,255,255,0.12)",

  mono: "ui-monospace,'SF Mono',SFMono-Regular,Menlo,monospace",
  sans: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",
};

const shapes = {
  aim:     { glyph: "△", label: "Aim",     prompt: "What are you promising?",  desc: "What was intended, promised, or declared." },
  reality: { glyph: "□", label: "Reality", prompt: "What evidence exists?",     desc: "What pushed back with evidence, constraint, or measurement." },
  weld:    { glyph: "œ", label: "Weld",    prompt: "What converged?",           desc: "Where aim and reality meet and return a signal." },
  seal:    { glyph: "𒐛", label: "Seal",    prompt: "What gets sealed?",         desc: "The proof. The receipt. Seven." },
};

const sigMap = { released: "green", sealed: "green", clear: "green", committing: "amber", collecting: "amber", shaping: "amber", proving: "amber", active: "amber", blocked: "red", alert: "red", overdue: "red", waiting: "neutral", dormant: "neutral", draft: "neutral" };
const sc = s => t[sigMap[s] || "neutral"];
const sd = s => ({ green: t.greenDim, amber: t.amberDim, red: t.redDim, neutral: "rgba(113,119,128,0.08)" }[sigMap[s] || "neutral"]);

// ── SURFACE ─────────────────────────────────────────────────
// From competition: subtle gradient depth. No hard borders.
function Surface({ children, style, glow }) {
  return (
    <div style={{
      border: `1px solid ${t.line}`,
      borderRadius: 16,
      background: `linear-gradient(180deg, rgba(255,255,255,0.022), transparent 28%), rgba(255,255,255,0.018)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── KICKER ──────────────────────────────────────────────────
function Kicker({ children, color }) {
  return <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: color || t.meta }}>{children}</span>;
}

// ── DEPTH STACK ─────────────────────────────────────────────
function DepthStack({ depth = 0, size = 24 }) {
  const colors = [t.neutral, t.amber, t.blue, t.green];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, width: size, alignItems: "center", flexShrink: 0 }}>
      {[0,1,2,3].map(i => <div key={i} style={{ width: size - (3-i)*4, height: 2, borderRadius: 1, backgroundColor: i < depth ? colors[i] : t.void }} />)}
    </div>
  );
}

// ── OBJECT GLYPH ────────────────────────────────────────────
// Adapted from competition: 7-sided shape that fills with assembly.
// But now the fill stages map to our four shapes.
function ObjectGlyph({ depth = 0, size = 86 }) {
  const fill = depth / 4;
  const stageColors = [
    "rgba(113,119,128,0.3)",   // d1 = collected (neutral)
    "rgba(240,191,105,0.3)",   // d2 = shaped (amber)
    "rgba(94,167,255,0.3)",    // d3 = proved (blue)
    "rgba(127,217,160,0.3)",   // d4 = sealed (green)
  ];
  const activeColor = depth > 0 ? stageColors[depth - 1] : "transparent";

  return (
    <div style={{
      position: "relative",
      width: size,
      height: size,
      clipPath: "polygon(50% 0%, 88% 18%, 100% 62%, 72% 100%, 28% 100%, 0% 55%, 12% 18%)",
      background: `linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)), rgba(255,255,255,0.02)`,
      overflow: "hidden",
    }}>
      {/* Grid lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
        backgroundSize: "14px 14px",
        opacity: 0.4,
      }} />
      {/* Fill */}
      <div style={{
        position: "absolute", inset: 0,
        width: `${fill * 100}%`,
        background: `linear-gradient(180deg, ${activeColor}, transparent 80%)`,
        transition: "width 0.4s ease",
      }} />
      {/* Core hollow */}
      <div style={{
        position: "absolute",
        inset: size * 0.18,
        clipPath: "polygon(50% 0%, 90% 20%, 100% 66%, 74% 100%, 26% 100%, 0% 58%, 10% 20%)",
        border: `1px solid rgba(255,255,255,0.06)`,
        background: "rgba(7,10,14,0.5)",
      }} />
      {/* Shape glyph in center */}
      {depth > 0 && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.22,
          color: depth >= 4 ? t.green : depth >= 3 ? t.blue : depth >= 2 ? t.amber : t.neutral,
          fontWeight: 400, zIndex: 2,
        }}>
          {depth >= 4 ? "𒐛" : depth >= 3 ? "œ" : depth >= 2 ? "□" : "△"}
        </div>
      )}
    </div>
  );
}

// ── CONVERGENCE BAR ─────────────────────────────────────────
function ConvergenceBar({ percent = 0, width = 140 }) {
  const w = (width/2) * (percent/100);
  const welded = percent >= 90;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>△</span>
      <div style={{ width, height: 4, backgroundColor: t.void, borderRadius: 2, position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: w, height: "100%", backgroundColor: t.blue, borderRadius: "2px 0 0 2px", transition: "width 0.3s" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: w, height: "100%", backgroundColor: t.green, borderRadius: "0 2px 2px 0", transition: "width 0.3s" }} />
        {welded && <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 8, height: 8, borderRadius: 4, backgroundColor: t.amber, boxShadow: `0 0 10px ${t.amber}40` }} />}
      </div>
      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>□</span>
      {welded && <span style={{ fontSize: 12, fontWeight: 700, color: t.amber }}>œ</span>}
    </div>
  );
}

function SignalDot({ status, size = 6 }) { return <span style={{ width: size, height: size, borderRadius: size/2, backgroundColor: sc(status), display: "inline-block", flexShrink: 0 }} />; }

function Indicator({ status, label }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: sc(status), lineHeight: 1 }}><SignalDot status={status} />{label || status}</span>;
}

function TrustBadge({ level }) {
  const c = [t.neutral, t.amber, t.green][level-1];
  const d = [sd("waiting"), sd("committing"), sd("released")][level-1];
  return <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: c, backgroundColor: d, padding: "3px 8px", borderRadius: 4, lineHeight: 1 }}>L{level}</span>;
}

function Btn({ variant = "secondary", children, size = "md", full }) {
  const sizes = { sm: { padding: "6px 12px", fontSize: 11 }, md: { padding: "9px 18px", fontSize: 12 }, lg: { padding: "12px 22px", fontSize: 13 } };
  const variants = {
    primary: { background: `linear-gradient(180deg, rgba(94,167,255,0.9), rgba(94,167,255,0.7))`, color: t.canvas, border: `1px solid ${t.blueSoft}` },
    secondary: { background: "rgba(255,255,255,0.04)", color: t.soft, border: `1px solid ${t.lineLit}` },
    ghost: { background: "transparent", color: t.meta, border: "1px solid transparent" },
  };
  return <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, fontFamily: t.mono, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", lineHeight: 1, width: full ? "100%" : "auto", ...sizes[size], ...variants[variant] }}>{children}</button>;
}

function MetricsStrip({ items }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 16 }}>{items.map((m, i) => <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: t.mono, fontSize: 11, fontWeight: 600, color: t.soft }}>{m.icon && <span style={{ color: t.meta }}>{m.icon}</span>}{m.value}{m.label && <span style={{ fontSize: 9, fontWeight: 500, color: t.meta, letterSpacing: "0.06em", textTransform: "uppercase" }}>{m.label}</span>}</span>)}</div>;
}

// ── BLOCK ───────────────────────────────────────────────────
function Block({ shape, children, status, depth, image, time, location }) {
  const s = shapes[shape];
  return (
    <div style={{ display: "flex", gap: 10, padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 10, borderLeft: `2px solid ${status ? sc(status) : t.void}` }}>
      {s && <span style={{ fontSize: 14, color: t.meta, lineHeight: 1.4, flexShrink: 0 }}>{s.glyph}</span>}
      <div style={{ flex: 1 }}>
        {image && <div style={{ width: "100%", height: 80, backgroundColor: t.raised, borderRadius: 8, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 18, color: t.ghost }}>◻</span></div>}
        <div style={{ fontFamily: t.sans, fontSize: 14, color: t.white, lineHeight: 1.55 }}>{children}</div>
        {(time || location) && <div style={{ display: "flex", gap: 12, marginTop: 6 }}>{time && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>{time}</span>}{location && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>📍 {location}</span>}</div>}
      </div>
      {depth !== undefined && <DepthStack depth={depth} size={16} />}
    </div>
  );
}

// ── ASSEMBLED CARD ──────────────────────────────────────────
function AssembledCard({ shape, label, title, desc, blocks = [], depth = 0, convergence, status, trust, meta, actions = [], metrics, glyph }) {
  const s = shapes[shape] || shapes.reality;
  const [open, setOpen] = useState(false);
  const bc = blocks.length;
  return (
    <Surface style={{ overflow: "hidden", borderRadius: 18 }}>
      <div style={{ padding: "22px 22px 18px", display: "grid", gridTemplateColumns: glyph ? "auto 1fr auto" : "auto 1fr auto", gap: "14px 16px", alignItems: "start", cursor: bc > 0 ? "pointer" : "default" }} onClick={() => bc > 0 && setOpen(!open)}>
        {/* Left: shape glyph or object glyph */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 2 }}>
          {glyph ? <ObjectGlyph depth={depth} size={72} /> : (
            <>
              <span style={{ fontSize: 20, color: t.blue, fontWeight: shape === "weld" ? 700 : 400 }}>{s.glyph}</span>
              <DepthStack depth={depth} size={22} />
            </>
          )}
        </div>
        {/* Center */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {label && <Kicker color={t.blue}>{label}</Kicker>}
            {trust && <TrustBadge level={trust} />}
          </div>
          <div style={{ fontFamily: t.sans, fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 620, color: t.white, lineHeight: 1.3, letterSpacing: "-0.02em" }}>{title}</div>
          {desc && <p style={{ margin: "8px 0 0", fontFamily: t.sans, fontSize: 14, color: t.soft, lineHeight: 1.55 }}>{desc}</p>}
          {convergence !== undefined && <div style={{ marginTop: 10 }}><ConvergenceBar percent={convergence} width={170} /></div>}
          {metrics && <div style={{ marginTop: 10 }}>{metrics}</div>}
          {meta && <div style={{ fontFamily: t.mono, fontSize: 10, color: t.meta, marginTop: 10 }}>{meta}</div>}
        </div>
        {/* Right: status */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {status && <Indicator status={status} />}
          {bc > 0 && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>{bc} blocks {open ? "▴" : "▾"}</span>}
        </div>
      </div>
      {actions.length > 0 && <div style={{ padding: "0 22px 18px", display: "flex", gap: 8, justifyContent: "flex-end" }}>{actions}</div>}
      {open && bc > 0 && (
        <div style={{ borderTop: `1px solid ${t.line}`, padding: "14px 22px 18px", display: "flex", flexDirection: "column", gap: 6, background: "rgba(0,0,0,0.2)" }}>
          <Kicker>Assembled from</Kicker>
          <div style={{ height: 4 }} />
          {blocks.map((b, i) => <Block key={i} shape={b.shape} status={b.status} depth={b.depth}>{b.text}</Block>)}
        </div>
      )}
    </Surface>
  );
}

// ── PHASE LANE ──────────────────────────────────────────────
function PhaseLane({ items = [] }) {
  const phases = ["aim", "reality", "weld", "seal"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, borderRadius: 14, overflow: "hidden" }}>
      {phases.map(p => {
        const pi = items.filter(i => i.phase === p);
        return (
          <Surface key={p} style={{ padding: "14px 12px", borderRadius: 0, minHeight: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: t.blue, fontWeight: p === "weld" ? 700 : 400 }}>{shapes[p].glyph}</span>
              <Kicker>{shapes[p].label}</Kicker>
              <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ghost, marginLeft: "auto" }}>{pi.length}</span>
            </div>
            {pi.map((item, i) => (
              <div key={i} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `2px solid ${item.status ? sc(item.status) : t.void}`, marginBottom: 6 }}>
                <div style={{ fontFamily: t.sans, fontSize: 12, color: t.white, lineHeight: 1.4, marginBottom: 4 }}>{item.title}</div>
                <DepthStack depth={item.depth} size={14} />
              </div>
            ))}
          </Surface>
        );
      })}
    </div>
  );
}

// ── COMPASS ─────────────────────────────────────────────────
function Compass({ activeBox, aims = 0, realities = 0, welds = 0, sealed = 0 }) {
  const total = aims + realities + welds + sealed || 1;
  const segs = [{ s: "aim", n: aims, c: t.blue }, { s: "reality", n: realities, c: t.green }, { s: "weld", n: welds, c: t.amber }, { s: "seal", n: sealed, c: t.neutral }];
  return (
    <Surface style={{ padding: "16px 20px" }}>
      {activeBox && <Kicker>{activeBox}</Kicker>}
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 2, margin: "12px 0 14px" }}>
        {segs.map(s => s.n > 0 && <div key={s.s} style={{ flex: s.n/total, backgroundColor: s.c, borderRadius: 2, minWidth: 4 }} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {segs.map(s => (
          <div key={s.s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 14, color: s.n > 0 ? s.c : t.ghost, fontWeight: s.s === "weld" ? 700 : 400 }}>{shapes[s.s].glyph}</span>
            <span style={{ fontFamily: t.mono, fontSize: 14, fontWeight: 700, color: s.n > 0 ? t.white : t.ghost }}>{s.n}</span>
          </div>
        ))}
      </div>
    </Surface>
  );
}

// ── QUICK CAPTURE ───────────────────────────────────────────
function QuickCapture({ activeShape, onSelect }) {
  return (
    <Surface style={{ overflow: "hidden", borderRadius: 18 }}>
      <div style={{ height: 160, background: `radial-gradient(circle at 50% 60%, rgba(94,167,255,0.06), transparent 70%), ${t.canvas}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <div style={{ width: 100, height: 100, border: `1px solid ${t.lineLit}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: t.sans, fontSize: 11, color: t.ghost, textAlign: "center", lineHeight: 1.5 }}>Point at reality.<br/>Tap to capture.</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[["◻","Photo",true],["◉","Voice",false],["⌨","Text",false]].map(([ic,lb,ac]) => (
            <div key={lb} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 14, color: ac ? t.white : t.meta }}>{ic}</span>
              <span style={{ fontFamily: t.mono, fontSize: 7, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: ac ? t.white : t.meta }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 18px" }}>
        <Kicker>What did you catch?</Kicker>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {Object.entries(shapes).map(([key, s]) => {
            const a = activeShape === key;
            return (
              <div key={key} onClick={() => onSelect?.(key)} style={{ flex: 1, padding: "12px 6px", borderRadius: 10, background: a ? t.blueDim : "rgba(255,255,255,0.02)", border: `1px solid ${a ? t.blueSoft : t.line}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "all 0.15s" }}>
                <span style={{ fontSize: 16, color: a ? t.blue : t.meta, fontWeight: key === "weld" ? 700 : 400 }}>{s.glyph}</span>
                <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: a ? t.blue : t.meta }}>{s.label}</span>
              </div>
            );
          })}
        </div>
        {activeShape && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${t.line}` }}>
              <span style={{ fontSize: 13, color: t.blue, fontWeight: activeShape === "weld" ? 700 : 400 }}>{shapes[activeShape].glyph}</span>
              <span style={{ fontFamily: t.sans, fontSize: 13, color: t.meta, flex: 1 }}>{shapes[activeShape].prompt}</span>
            </div>
            <div style={{ marginTop: 12 }}><Btn variant="primary" size="md" full>Add to Box</Btn></div>
          </div>
        )}
      </div>
    </Surface>
  );
}

// ── RADAR ────────────────────────────────────────────────────
function AssemblyRadar({ items = [] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <Surface key={i} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
          <DepthStack depth={item.depth} size={18} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.sans, fontSize: 13, fontWeight: 500, color: t.white, marginBottom: 6 }}>{item.title}</div>
            <ConvergenceBar percent={item.convergence} width={150} />
          </div>
          <span style={{ fontFamily: t.mono, fontSize: 13, fontWeight: 700, color: item.convergence >= 90 ? t.amber : t.meta }}>{item.convergence}%</span>
        </Surface>
      ))}
    </div>
  );
}

// ── NAV ─────────────────────────────────────────────────────
function Nav({ active }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 12px", background: `linear-gradient(180deg, rgba(255,255,255,0.02), transparent)`, borderTop: `1px solid ${t.line}` }}>
      {Object.entries(shapes).map(([key, s]) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 14px", cursor: "pointer", position: "relative" }}>
          <span style={{ fontSize: 16, color: active === key ? t.white : t.meta, fontWeight: key === "weld" ? 700 : 400 }}>{s.glyph}</span>
          <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: active === key ? t.white : t.meta }}>{s.label}</span>
          {active === key && <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 14, height: 2, borderRadius: 1, backgroundColor: t.blue }} />}
        </div>
      ))}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 14px", cursor: "pointer" }}>
        <span style={{ fontSize: 16, color: t.meta }}>+</span>
        <span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.meta }}>Add</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════

const tabs = ["overview", "desktop", "mobile", "system"];

export default function App() {
  const [tab, setTab] = useState("overview");
  const [capShape, setCapShape] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at 20% 0%, rgba(94,167,255,0.08), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(127,217,160,0.04), transparent 50%), ${t.canvas}`,
      color: t.white, fontFamily: t.sans,
    }}>
      {/* Shell */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <Surface style={{ borderRadius: 24, overflow: "hidden", padding: 0 }}>

          {/* Header */}
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${t.line}`, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: t.mono, fontSize: 15, fontWeight: 700, letterSpacing: "0.16em" }}>LŒGOS</span>
              <span style={{ fontFamily: t.mono, fontSize: 10, color: t.meta }}>Design System v3.1 — Convergence</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {tabs.map(x => (
                <button key={x} onClick={() => setTab(x)} style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 14px", border: "none", borderRadius: 8, cursor: "pointer", background: tab === x ? "rgba(255,255,255,0.06)" : "transparent", color: tab === x ? t.white : t.meta }}>{x}</button>
              ))}
            </div>
          </div>

          <div style={{ padding: 24 }}>

            {/* ── OVERVIEW ───────────────────────────────── */}
            {tab === "overview" && (
              <>
                {/* Hero */}
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: 20, marginBottom: 28, alignItems: "center" }}>
                  <div>
                    <Kicker color={t.blue}>Assembled Design</Kicker>
                    <h1 style={{ margin: "12px 0 0", fontSize: "clamp(28px, 3vw, 42px)", fontWeight: 680, lineHeight: 0.98, letterSpacing: "-0.04em" }}>
                      Meaning is an<br/>assembled object.
                    </h1>
                    <p style={{ margin: "16px 0 0", fontSize: 15, color: t.soft, lineHeight: 1.6, maxWidth: 480 }}>
                      The UI is not decorated with the philosophy. Every card is an assembled object with visible depth. Every block is an operator sentence. Every seal is proof that aim met reality.
                    </p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <ObjectGlyph depth={3} size={120} />
                  </div>
                </div>

                {/* Shape language */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 28 }}>
                  {Object.entries(shapes).map(([key, s]) => (
                    <Surface key={key} style={{ padding: 18, textAlign: "center" }}>
                      <span style={{ fontSize: 24, color: t.blue, fontWeight: key === "weld" ? 700 : 400 }}>{s.glyph}</span>
                      <div style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.white, marginTop: 8 }}>{s.label}</div>
                      <div style={{ fontFamily: t.sans, fontSize: 12, color: t.soft, marginTop: 6, lineHeight: 1.4 }}>{s.desc}</div>
                    </Surface>
                  ))}
                </div>

                {/* Object glyph stages */}
                <Surface style={{ padding: 22, marginBottom: 28 }}>
                  <Kicker color={t.blue}>Assembly Depth — the object fills as it assembles</Kicker>
                  <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginTop: 20, flexWrap: "wrap", gap: 16 }}>
                    {[1,2,3,4].map(d => (
                      <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <ObjectGlyph depth={d} size={64} />
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <DepthStack depth={d} size={20} />
                          <span style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 600, color: t.soft, textTransform: "uppercase" }}>{["Collected","Shaped","Proved","Sealed"][d-1]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Surface>

                {/* Convergence */}
                <Surface style={{ padding: 22 }}>
                  <Kicker color={t.blue}>Convergence — where aim meets reality</Kicker>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
                    {[20,50,75,92,100].map(p => (
                      <div key={p} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{ fontFamily: t.mono, fontSize: 11, color: t.meta, minWidth: 36, textAlign: "right" }}>{p}%</span>
                        <ConvergenceBar percent={p} width={220} />
                      </div>
                    ))}
                  </div>
                </Surface>
              </>
            )}

            {/* ── DESKTOP ────────────────────────────────── */}
            {tab === "desktop" && (
              <>
                {/* Workspace */}
                <Surface style={{ borderRadius: 18, overflow: "hidden", padding: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: `1px solid ${t.line}` }}>
                    <span style={{ fontFamily: t.mono, fontSize: 13, fontWeight: 700, letterSpacing: "0.14em" }}>LŒGOS</span>
                    <div style={{ flex: 1 }} />
                    <Btn variant="ghost" size="sm">Seven</Btn>
                  </div>

                  <div style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                        <span style={{ fontSize: 15, color: t.blue }}>□</span>
                        <span style={{ fontFamily: t.sans, fontSize: 18, fontWeight: 680, letterSpacing: "-0.02em" }}>Reality</span>
                        <span style={{ fontFamily: t.mono, fontSize: 12, color: t.meta }}>79</span>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}><Indicator status="released" /><Indicator status="committing" /></div>
                    </div>

                    <AssembledCard
                      shape="reality" label="Reality" title="Listen · Lœgos — Origin, Evolution, Feedback, and Receipt"
                      desc="Assembly Index is ready."
                      depth={3} status="released" trust={3} convergence={92} glyph
                      metrics={<MetricsStrip items={[{value:"11",label:"sources"},{value:"45",label:"entries"},{value:"79",label:"index"}]} />}
                      meta="Deniz · Apr 5, 2026"
                      actions={[<Btn key="a" variant="ghost" size="sm">Add Source</Btn>, <Btn key="b" variant="secondary" size="sm">Open</Btn>]}
                      blocks={[
                        { shape: "aim", text: "Create a listening experience that proves Lœgos assembled itself.", status: "released", depth: 4 },
                        { shape: "reality", text: "99 evidence entries collected from origin corpus.", status: "released", depth: 3 },
                        { shape: "weld", text: "Evidence aligns with aim — assembly index ready.", status: "proving", depth: 3 },
                      ]}
                    />

                    <div style={{ height: 16 }} />

                    <PhaseLane items={[
                      { phase: "aim", title: "Draft Seven Post 3", status: "active", depth: 1 },
                      { phase: "aim", title: "Yuki trial update", status: "committing", depth: 1 },
                      { phase: "reality", title: "Builder code review", status: "committing", depth: 2 },
                      { phase: "reality", title: "Melih feedback", status: "released", depth: 2 },
                      { phase: "weld", title: "Feedback — 92%", status: "proving", depth: 3 },
                      { phase: "seal", title: "Prototype receipt", status: "sealed", depth: 4 },
                    ]} />

                    <div style={{ height: 16 }} />

                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${t.line}` }}>
                      <span style={{ fontSize: 14, color: t.meta }}>□</span>
                      <span style={{ fontFamily: t.sans, fontSize: 13, color: t.meta, flex: 1 }}>What evidence exists?</span>
                      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ghost }}>⏎</span>
                    </div>
                  </div>

                  <Nav active="reality" />
                </Surface>
              </>
            )}

            {/* ── MOBILE ─────────────────────────────────── */}
            {tab === "mobile" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Phone: Home */}
                  <Surface style={{ borderRadius: 22, overflow: "hidden", padding: 0 }}>
                    <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em" }}>LŒGOS</span>
                      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>6:44 PM</span>
                    </div>
                    <div style={{ padding: "0 12px 10px" }}>
                      <Compass activeBox="Prototype → Melih" aims={3} realities={5} welds={2} sealed={1} />
                    </div>
                    <div style={{ padding: "0 12px 8px" }}>
                      <Surface style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                        <ObjectGlyph depth={3} size={40} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: t.sans, fontSize: 12, fontWeight: 500, color: t.white, marginBottom: 4 }}>Ship prototype</div>
                          <ConvergenceBar percent={92} width={100} />
                        </div>
                        <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.amber }}>92%</span>
                      </Surface>
                    </div>
                    <div style={{ padding: "0 12px" }}>
                      <Block shape="reality" status="collecting" depth={1} time="6:42 PM" location="W 14th">Triangle poster spotted.</Block>
                      <div style={{ height: 4 }} />
                      <Block shape="weld" status="proving" depth={3} time="4:45 PM">Melih + demo = 92%.</Block>
                      <div style={{ height: 4 }} />
                      <Block shape="seal" status="sealed" depth={4} time="11:00 AM">Prototype sealed. 𒐛</Block>
                    </div>
                    <div style={{ height: 8 }} />
                    <Nav active="reality" />
                  </Surface>

                  {/* Phone: Capture */}
                  <Surface style={{ borderRadius: 22, overflow: "hidden", padding: 0 }}>
                    <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em" }}>CAPTURE</span>
                      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>6:45 PM</span>
                    </div>
                    <QuickCapture activeShape={capShape} onSelect={setCapShape} />
                  </Surface>
                </div>

                <div style={{ height: 20 }} />

                <Kicker color={t.blue}>Assembly Radar</Kicker>
                <div style={{ height: 12 }} />
                <AssemblyRadar items={[
                  { title: "Ship prototype for Melih", convergence: 92, depth: 3 },
                  { title: "Draft Seven Post 3", convergence: 45, depth: 2 },
                  { title: "Design system for Builders", convergence: 78, depth: 2 },
                  { title: "Yuki trial — UPenn", convergence: 30, depth: 1 },
                ]} />
              </>
            )}

            {/* ── SYSTEM ─────────────────────────────────── */}
            {tab === "system" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                  <Surface style={{ padding: 20 }}>
                    <Kicker color={t.blue}>Brand (Blue)</Kicker>
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                      {[["accent",t.blue],["dim",t.blueDim],["soft",t.blueSoft]].map(([n,c]) => (
                        <div key={n} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: c }} />
                          <span style={{ fontFamily: t.mono, fontSize: 10, color: t.soft }}>{n}</span>
                        </div>
                      ))}
                    </div>
                  </Surface>
                  <Surface style={{ padding: 20 }}>
                    <Kicker color={t.green}>Signals</Kicker>
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                      {[["green",t.green,"Clear"],["amber",t.amber,"Active"],["red",t.red,"Act now"],["neutral",t.neutral,"Waiting"]].map(([n,c,l]) => (
                        <div key={n} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: c }} />
                          <span style={{ fontFamily: t.mono, fontSize: 10, color: c }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </Surface>
                </div>

                <Surface style={{ padding: 20, marginBottom: 28 }}>
                  <Kicker>Surfaces</Kicker>
                  <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
                    {[["canvas",t.canvas],["shell",t.shell],["raised",t.raised],["s3",t.s3],["s4",t.s4]].map(([n,c]) => (
                      <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ width: "100%", height: 36, backgroundColor: c, borderRadius: 6, border: `1px solid ${t.lineLit}` }} />
                        <span style={{ fontFamily: t.mono, fontSize: 8, color: t.meta }}>{n}</span>
                      </div>
                    ))}
                  </div>
                </Surface>

                <Surface style={{ padding: 20, marginBottom: 28 }}>
                  <Kicker>Typography</Kicker>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
                    {[
                      { l: "display", f: t.sans, s: "clamp(28px,3vw,42px)", w: 680, ls: "-0.04em", ex: "Meaning is an assembled object." },
                      { l: "heading", f: t.sans, s: "18px", w: 620, ls: "-0.02em", ex: "Origin, Evolution, Feedback, and Receipt" },
                      { l: "body", f: t.sans, s: "14px", w: 400, ls: "0", ex: "Assembly Index is ready. Close the gap." },
                      { l: "kicker", f: t.mono, s: "11px", w: 600, ls: "0.1em", ex: "RELEASED · COMMITTING", tt: "uppercase" },
                      { l: "meta", f: t.mono, s: "10px", w: 600, ls: "0.06em", ex: "Deniz · Apr 5, 2026" },
                    ].map(x => (
                      <div key={x.l} style={{ display: "flex", gap: 16 }}>
                        <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ghost, minWidth: 48, textAlign: "right", paddingTop: 4, flexShrink: 0 }}>{x.l}</span>
                        <div style={{ fontFamily: x.f, fontSize: x.s, fontWeight: x.w, letterSpacing: x.ls, textTransform: x.tt || "none", color: t.white, lineHeight: 1.3 }}>{x.ex}</div>
                      </div>
                    ))}
                  </div>
                </Surface>

                <Surface style={{ padding: 20 }}>
                  <Kicker>Foundation Rules</Kicker>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                    {[
                      "△ □ œ 𒐛 are the only navigation icons. No Lucide. No generic icons.",
                      "Blue stays brand. Green/amber/red stay functional. They never cross.",
                      "Assembly depth shown through depth stacks AND object glyph fill.",
                      "Convergence bar shows aim meeting reality. œ activates at 90%.",
                      "Every card is an assembled object. Click to see its blocks.",
                      "Mobile and desktop share one object model. Posture changes, language doesn't.",
                      "Trust = L1/L2/L3. Same signal colors. One badge, not a paragraph.",
                    ].map((rule, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.meta, minWidth: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                        <span style={{ fontFamily: t.sans, fontSize: 13, color: t.soft, lineHeight: 1.5 }}>{rule}</span>
                      </div>
                    ))}
                  </div>
                </Surface>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "16px 24px", borderTop: `1px solid ${t.line}`, textAlign: "center" }}>
            <span style={{ fontFamily: t.mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: t.ghost }}>Lœgos Design System v3.1 · △ □ œ 𒐛 · Convergence · Lakin.ai</span>
          </div>
        </Surface>
      </div>
    </div>
  );
}
