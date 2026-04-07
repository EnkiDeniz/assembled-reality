import { useState } from "react";

// ═══════════════════════════════════════════════════════════
// LŒGOS DESIGN SYSTEM v4.1 — FINAL
//
// △ aim → □ reality → œ weld → 𒐛 seal
//
// HEXAGON: flat-top, no gradient fill. Edges carry meaning.
// Seven lives in the seal glyph, not the polygon count.
// Assembly = honeycomb. Cells that fit together.
// ═══════════════════════════════════════════════════════════

const t = {
  canvas: "#0c0d10", shell: "#121315", raised: "#1a1d22", s3: "#1f2228", s4: "#262a30",
  white: "#f0f2f4", soft: "rgba(255,255,255,0.70)", meta: "rgba(255,255,255,0.42)", ghost: "rgba(255,255,255,0.18)", void: "rgba(255,255,255,0.06)",
  blue: "#5ea7ff", blueDim: "rgba(94,167,255,0.08)", blueSoft: "rgba(94,167,255,0.22)",
  green: "#7fd9a0", greenDim: "rgba(127,217,160,0.10)",
  amber: "#f0bf69", amberDim: "rgba(240,191,105,0.10)",
  red: "#ff7f7f", redDim: "rgba(255,127,127,0.10)",
  neutral: "#8f93a1",
  line: "rgba(255,255,255,0.07)", lineLit: "rgba(255,255,255,0.12)",
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
const sd = s => ({ green: t.greenDim, amber: t.amberDim, red: t.redDim, neutral: "rgba(143,147,161,0.06)" }[sigMap[s] || "neutral"]);

// ═══════════════════════════════════════════════════════════
// HEX GLYPH — the core innovation
//
// Flat-top hexagon. Six edges. No gradient fill.
// Each edge is a data channel that can carry its own color.
// The center holds the phase glyph.
// The edges tell you the state of the whole box at a glance.
//
// WHY HEXAGON NOT HEPTAGON:
// Seven (𒐛) lives in the seal glyph, not the polygon count.
// The hexagon is honeycomb — cells that fit together,
// each holding something, together building a structure.
// Assembly is hexagonal, not septagonal.
//
// WHY NO GRADIENT FILL:
// The edges have meaning. Gradients would obscure them.
// In the future, each of the six edges could carry a
// different signal color. Six edges × three signal colors
// = a tiny dashboard that says more than a whole card.
// Keep it clean now so it can speak later.
// ═══════════════════════════════════════════════════════════

function hexPoints(cx, cy, r) {
  // Flat-top hexagon: first vertex at 0° (right), going counterclockwise
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

function HexGlyph({ depth = 0, size = 86, edges, showGlyph = true }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.28;
  const outerPts = hexPoints(cx, cy, outerR);
  const innerPts = hexPoints(cx, cy, innerR);

  // Default edge colors based on depth
  const depthColors = [t.neutral, t.amber, t.blue, t.green];
  const defaultEdges = Array(6).fill("rgba(255,255,255,0.08)");
  if (depth >= 1) { defaultEdges[0] = depthColors[0]; defaultEdges[5] = depthColors[0]; }
  if (depth >= 2) { defaultEdges[1] = depthColors[1]; defaultEdges[4] = depthColors[1]; }
  if (depth >= 3) { defaultEdges[2] = depthColors[2]; defaultEdges[3] = depthColors[2]; }
  if (depth >= 4) { defaultEdges.fill(depthColors[3]); }

  const edgeColors = edges || defaultEdges;
  const glyphs = ["△", "□", "œ", "𒐛"];
  const glyphColors = [t.neutral, t.amber, t.blue, t.green];
  const activeGlyph = depth > 0 ? glyphs[Math.min(depth - 1, 3)] : "";
  const activeColor = depth > 0 ? glyphColors[Math.min(depth - 1, 3)] : t.ghost;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      {/* Outer hex edges — each edge is its own path with its own color */}
      {outerPts.map((pt, i) => {
        const next = outerPts[(i + 1) % 6];
        return (
          <line
            key={`edge-${i}`}
            x1={pt[0]} y1={pt[1]}
            x2={next[0]} y2={next[1]}
            stroke={edgeColors[i]}
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}

      {/* Inner hex — subtle structure line */}
      <polygon
        points={innerPts.map(p => p.join(",")).join(" ")}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={1}
      />

      {/* Grid lines — faint cross-structure */}
      {[0, 1, 2].map(i => (
        <line
          key={`grid-${i}`}
          x1={outerPts[i][0]} y1={outerPts[i][1]}
          x2={outerPts[i + 3][0]} y2={outerPts[i + 3][1]}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={0.5}
        />
      ))}

      {/* Center glyph */}
      {showGlyph && activeGlyph && (
        <text
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill={activeColor}
          fontSize={size * 0.2}
          fontFamily={t.sans}
          fontWeight={depth === 3 ? 700 : 400}
        >
          {activeGlyph}
        </text>
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED PRIMITIVES (unchanged from v4.0)
// ═══════════════════════════════════════════════════════════

function Surface({ children, style }) {
  return <div style={{ border: `1px solid ${t.line}`, borderRadius: 16, background: `linear-gradient(180deg, rgba(255,255,255,0.022), transparent 28%), rgba(255,255,255,0.018)`, ...style }}>{children}</div>;
}
function Kicker({ children, color }) { return <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: color || t.meta }}>{children}</span>; }
function DepthStack({ depth = 0, size = 22 }) {
  const colors = [t.neutral, t.amber, t.blue, t.green];
  return <div style={{ display: "flex", flexDirection: "column", gap: 2, width: size, alignItems: "center", flexShrink: 0 }}>{[0,1,2,3].map(i => <div key={i} style={{ width: size-(3-i)*4, height: 2, borderRadius: 1, backgroundColor: i < depth ? colors[i] : t.void }} />)}</div>;
}
function ConvergenceBar({ percent = 0, width = 140 }) {
  const w = (width/2)*(percent/100); const welded = percent >= 90;
  return <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>△</span><div style={{ width, height: 4, backgroundColor: t.void, borderRadius: 2, position: "relative", overflow: "hidden", flexShrink: 0 }}><div style={{ position: "absolute", left: 0, top: 0, width: w, height: "100%", backgroundColor: t.blue, borderRadius: "2px 0 0 2px", transition: "width 0.3s" }} /><div style={{ position: "absolute", right: 0, top: 0, width: w, height: "100%", backgroundColor: t.green, borderRadius: "0 2px 2px 0", transition: "width 0.3s" }} />{welded && <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 8, height: 8, borderRadius: 4, backgroundColor: t.amber, boxShadow: `0 0 10px ${t.amber}40` }} />}</div><span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>□</span>{welded && <span style={{ fontSize: 12, fontWeight: 700, color: t.amber }}>œ</span>}</div>;
}
function SignalDot({ status, size = 6 }) { return <span style={{ width: size, height: size, borderRadius: size/2, backgroundColor: sc(status), display: "inline-block", flexShrink: 0 }} />; }
function Indicator({ status, label }) { return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: sc(status), lineHeight: 1 }}><SignalDot status={status} />{label || status}</span>; }
function TrustBadge({ level }) { const c = [t.neutral, t.amber, t.green][level-1]; const d = [sd("waiting"), sd("committing"), sd("released")][level-1]; return <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: c, backgroundColor: d, padding: "3px 8px", borderRadius: 4, lineHeight: 1 }}>L{level}</span>; }
function MetricsStrip({ items }) { return <div style={{ display: "flex", alignItems: "center", gap: 16 }}>{items.map((m, i) => <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: t.mono, fontSize: 11, fontWeight: 600, color: t.soft }}>{m.icon && <span style={{ color: t.meta }}>{m.icon}</span>}{m.value}{m.label && <span style={{ fontSize: 9, fontWeight: 500, color: t.meta, letterSpacing: "0.06em", textTransform: "uppercase" }}>{m.label}</span>}</span>)}</div>; }
function Btn({ variant = "secondary", children, size = "md", full }) {
  const sizes = { sm: { padding: "6px 12px", fontSize: 11 }, md: { padding: "9px 18px", fontSize: 12 }, lg: { padding: "12px 22px", fontSize: 13 } };
  const variants = { primary: { background: `linear-gradient(180deg, rgba(94,167,255,0.9), rgba(94,167,255,0.7))`, color: t.canvas, border: `1px solid ${t.blueSoft}` }, secondary: { background: "rgba(255,255,255,0.04)", color: t.soft, border: `1px solid ${t.lineLit}` }, ghost: { background: "transparent", color: t.meta, border: "1px solid transparent" } };
  return <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, fontFamily: t.mono, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", lineHeight: 1, width: full ? "100%" : "auto", ...sizes[size], ...variants[variant] }}>{children}</button>;
}
function Block({ shape, children, status, depth, time, location }) {
  const s = shapes[shape];
  return <div style={{ display: "flex", gap: 10, padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 10, borderLeft: `2px solid ${status ? sc(status) : t.void}` }}>{s && <span style={{ fontSize: 14, color: t.meta, lineHeight: 1.4, flexShrink: 0, fontWeight: shape === "weld" ? 700 : 400 }}>{s.glyph}</span>}<div style={{ flex: 1 }}><div style={{ fontFamily: t.sans, fontSize: 14, color: t.white, lineHeight: 1.55 }}>{children}</div>{(time || location) && <div style={{ display: "flex", gap: 12, marginTop: 6 }}>{time && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>{time}</span>}{location && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>📍 {location}</span>}</div>}</div>{depth !== undefined && <DepthStack depth={depth} size={16} />}</div>;
}

function AssembledCard({ shape, label, title, desc, blocks = [], depth = 0, convergence, status, trust, meta, actions = [], metrics, hex }) {
  const s = shapes[shape] || shapes.reality;
  const [open, setOpen] = useState(false);
  const bc = blocks.length;
  return (
    <Surface style={{ overflow: "hidden", borderRadius: 18 }}>
      <div style={{ padding: "22px 22px 18px", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "14px 16px", alignItems: "start", cursor: bc > 0 ? "pointer" : "default" }} onClick={() => bc > 0 && setOpen(!open)}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 2 }}>
          {hex ? <HexGlyph depth={depth} size={72} /> : <><span style={{ fontSize: 20, color: t.blue, fontWeight: shape === "weld" ? 700 : 400 }}>{s.glyph}</span><DepthStack depth={depth} size={22} /></>}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>{label && <Kicker color={t.blue}>{label}</Kicker>}{trust && <TrustBadge level={trust} />}</div>
          <div style={{ fontFamily: t.sans, fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 620, color: t.white, lineHeight: 1.3, letterSpacing: "-0.02em" }}>{title}</div>
          {desc && <p style={{ margin: "8px 0 0", fontFamily: t.sans, fontSize: 14, color: t.soft, lineHeight: 1.55 }}>{desc}</p>}
          {convergence !== undefined && <div style={{ marginTop: 10 }}><ConvergenceBar percent={convergence} width={170} /></div>}
          {metrics && <div style={{ marginTop: 10 }}>{metrics}</div>}
          {meta && <div style={{ fontFamily: t.mono, fontSize: 10, color: t.meta, marginTop: 10 }}>{meta}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>{status && <Indicator status={status} />}{bc > 0 && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>{bc} blocks {open ? "▴" : "▾"}</span>}</div>
      </div>
      {actions.length > 0 && <div style={{ padding: "0 22px 18px", display: "flex", gap: 8, justifyContent: "flex-end" }}>{actions}</div>}
      {open && bc > 0 && <div style={{ borderTop: `1px solid ${t.line}`, padding: "14px 22px 18px", display: "flex", flexDirection: "column", gap: 6, background: "rgba(0,0,0,0.2)" }}><Kicker>Assembled from</Kicker><div style={{ height: 4 }} />{blocks.map((b, i) => <Block key={i} shape={b.shape} status={b.status} depth={b.depth}>{b.text}</Block>)}</div>}
    </Surface>
  );
}

function Nav({ active }) {
  return <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 12px", background: `linear-gradient(180deg, rgba(255,255,255,0.02), transparent)`, borderTop: `1px solid ${t.line}` }}>{Object.entries(shapes).map(([key, s]) => <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 14px", cursor: "pointer", position: "relative" }}><span style={{ fontSize: 16, color: active === key ? t.white : t.meta, fontWeight: key === "weld" ? 700 : 400 }}>{s.glyph}</span><span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: active === key ? t.white : t.meta }}>{s.label}</span>{active === key && <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 14, height: 2, borderRadius: 1, backgroundColor: t.blue }} />}</div>)}<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 14px", cursor: "pointer" }}><span style={{ fontSize: 16, color: t.meta }}>+</span><span style={{ fontFamily: t.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.meta }}>Add</span></div></div>;
}

function Compass({ activeBox, aims = 0, realities = 0, welds = 0, sealed = 0 }) {
  const total = aims+realities+welds+sealed||1;
  const segs = [{s:"aim",n:aims,c:t.blue},{s:"reality",n:realities,c:t.green},{s:"weld",n:welds,c:t.amber},{s:"seal",n:sealed,c:t.neutral}];
  return <Surface style={{ padding: "16px 20px" }}>{activeBox && <Kicker>{activeBox}</Kicker>}<div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 2, margin: "12px 0 14px" }}>{segs.map(s => s.n > 0 && <div key={s.s} style={{ flex: s.n/total, backgroundColor: s.c, borderRadius: 2, minWidth: 4 }} />)}</div><div style={{ display: "flex", justifyContent: "space-between" }}>{segs.map(s => <div key={s.s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><span style={{ fontSize: 14, color: s.n > 0 ? s.c : t.ghost, fontWeight: s.s === "weld" ? 700 : 400 }}>{shapes[s.s].glyph}</span><span style={{ fontFamily: t.mono, fontSize: 14, fontWeight: 700, color: s.n > 0 ? t.white : t.ghost }}>{s.n}</span></div>)}</div></Surface>;
}

// ═══════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════

const tabs = ["hex", "desktop", "mobile", "notes"];

export default function App() {
  const [tab, setTab] = useState("hex");

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at 20% 0%, rgba(94,167,255,0.08), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(127,217,160,0.04), transparent 50%), ${t.canvas}`, color: t.white, fontFamily: t.sans }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <Surface style={{ borderRadius: 24, overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${t.line}`, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: t.mono, fontSize: 15, fontWeight: 700, letterSpacing: "0.16em" }}>LŒGOS</span>
              <span style={{ fontFamily: t.mono, fontSize: 10, color: t.meta }}>Design System v4.1</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>{tabs.map(x => <button key={x} onClick={() => setTab(x)} style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 14px", border: "none", borderRadius: 8, cursor: "pointer", background: tab === x ? "rgba(255,255,255,0.06)" : "transparent", color: tab === x ? t.white : t.meta }}>{x}</button>)}</div>
          </div>

          <div style={{ padding: 24 }}>

            {/* ── HEX ────────────────────────────────────── */}
            {tab === "hex" && (
              <>
                <div style={{ marginBottom: 28 }}>
                  <Kicker color={t.blue}>The Hex Glyph</Kicker>
                  <h2 style={{ margin: "12px 0 0", fontSize: "clamp(24px, 2.6vw, 38px)", fontWeight: 680, lineHeight: 1.0, letterSpacing: "-0.04em" }}>Six edges. Each one speaks.</h2>
                  <p style={{ margin: "12px 0 0", fontSize: 15, color: t.soft, lineHeight: 1.6, maxWidth: 520 }}>
                    Flat-top hexagon. No gradient fill. Each edge is a data channel that can carry its own signal color. The center holds the phase glyph. One tiny hex says more than a whole card.
                  </p>
                </div>

                {/* Four depth stages */}
                <Surface style={{ padding: 28, marginBottom: 20 }}>
                  <Kicker color={t.blue}>Assembly Depth</Kicker>
                  <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginTop: 24, flexWrap: "wrap", gap: 20 }}>
                    {[1,2,3,4].map(d => (
                      <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <HexGlyph depth={d} size={80} />
                        <DepthStack depth={d} size={20} />
                        <span style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 600, color: t.soft, textTransform: "uppercase", letterSpacing: "0.08em" }}>{["Collected","Shaped","Proved","Sealed"][d-1]}</span>
                      </div>
                    ))}
                  </div>
                </Surface>

                {/* Edge as data demo */}
                <Surface style={{ padding: 28, marginBottom: 20 }}>
                  <Kicker color={t.amber}>Edges as Data Channels — Future</Kicker>
                  <p style={{ margin: "10px 0 20px", fontFamily: t.sans, fontSize: 14, color: t.soft, lineHeight: 1.55 }}>
                    Each of the six edges can carry a different signal color. One hex becomes a dashboard. Here are examples of what a single glyph could communicate:
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24 }}>
                    {/* All clear */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <HexGlyph depth={4} size={72} edges={[t.green,t.green,t.green,t.green,t.green,t.green]} />
                      <span style={{ fontFamily: t.mono, fontSize: 8, color: t.green, textTransform: "uppercase", letterSpacing: "0.08em" }}>All clear</span>
                    </div>
                    {/* Mixed state */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <HexGlyph depth={3} size={72} edges={[t.green,t.green,t.amber,t.amber,t.green,t.neutral]} />
                      <span style={{ fontFamily: t.mono, fontSize: 8, color: t.amber, textTransform: "uppercase", letterSpacing: "0.08em" }}>In progress</span>
                    </div>
                    {/* One blocked */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <HexGlyph depth={2} size={72} edges={[t.green,t.amber,t.red,t.amber,t.green,t.neutral]} />
                      <span style={{ fontFamily: t.mono, fontSize: 8, color: t.red, textTransform: "uppercase", letterSpacing: "0.08em" }}>One blocked</span>
                    </div>
                    {/* Early stage */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <HexGlyph depth={1} size={72} edges={[t.neutral,t.neutral,t.neutral,t.neutral,t.neutral,t.neutral]} />
                      <span style={{ fontFamily: t.mono, fontSize: 8, color: t.neutral, textTransform: "uppercase", letterSpacing: "0.08em" }}>Just started</span>
                    </div>
                  </div>
                </Surface>

                {/* Sizes */}
                <Surface style={{ padding: 28 }}>
                  <Kicker>Sizes</Kicker>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginTop: 20 }}>
                    {[24, 36, 48, 72, 96].map(s => (
                      <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <HexGlyph depth={3} size={s} showGlyph={s >= 36} />
                        <span style={{ fontFamily: t.mono, fontSize: 8, color: t.meta }}>{s}px</span>
                      </div>
                    ))}
                  </div>
                </Surface>
              </>
            )}

            {/* ── DESKTOP ────────────────────────────────── */}
            {tab === "desktop" && (
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
                    desc="Assembly Index is ready." depth={3} status="released" trust={3} convergence={92} hex
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
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${t.line}` }}>
                    <span style={{ fontSize: 14, color: t.meta }}>□</span>
                    <span style={{ fontFamily: t.sans, fontSize: 13, color: t.meta, flex: 1 }}>What evidence exists?</span>
                    <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ghost }}>⏎</span>
                  </div>
                </div>
                <Nav active="reality" />
              </Surface>
            )}

            {/* ── MOBILE ─────────────────────────────────── */}
            {tab === "mobile" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Surface style={{ borderRadius: 22, overflow: "hidden", padding: 0 }}>
                  <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em" }}>LŒGOS</span>
                    <span style={{ fontFamily: t.mono, fontSize: 9, color: t.meta }}>6:44 PM</span>
                  </div>
                  <div style={{ padding: "0 12px 10px" }}><Compass activeBox="Prototype → Melih" aims={3} realities={5} welds={2} sealed={1} /></div>
                  <div style={{ padding: "0 12px 8px" }}>
                    <Surface style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <HexGlyph depth={3} size={40} />
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
                    <Block shape="seal" status="sealed" depth={4} time="11:00 AM">Prototype sealed. 𒐛</Block>
                  </div>
                  <div style={{ height: 8 }} />
                  <Nav active="reality" />
                </Surface>

                {/* Hex grid preview — honeycomb of boxes */}
                <Surface style={{ padding: 20, borderRadius: 22 }}>
                  <Kicker color={t.blue}>Your boxes at a glance</Kicker>
                  <p style={{ margin: "8px 0 16px", fontFamily: t.sans, fontSize: 12, color: t.soft, lineHeight: 1.5 }}>Each hex is a box. The edges tell you its state. The glyph tells you its phase. Honeycomb.</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <HexGlyph depth={4} size={52} edges={[t.green,t.green,t.green,t.green,t.green,t.green]} />
                      <span style={{ fontFamily: t.mono, fontSize: 7, color: t.meta }}>Origin</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <HexGlyph depth={3} size={52} edges={[t.green,t.green,t.amber,t.amber,t.green,t.neutral]} />
                      <span style={{ fontFamily: t.mono, fontSize: 7, color: t.meta }}>Prototype</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <HexGlyph depth={2} size={52} edges={[t.green,t.amber,t.red,t.amber,t.green,t.neutral]} />
                      <span style={{ fontFamily: t.mono, fontSize: 7, color: t.meta }}>Seven #3</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <HexGlyph depth={1} size={52} edges={[t.neutral,t.neutral,t.neutral,t.neutral,t.neutral,t.neutral]} />
                      <span style={{ fontFamily: t.mono, fontSize: 7, color: t.meta }}>Yuki</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <HexGlyph depth={1} size={52} edges={[t.amber,t.neutral,t.neutral,t.neutral,t.neutral,t.neutral]} />
                      <span style={{ fontFamily: t.mono, fontSize: 7, color: t.meta }}>DataModel</span>
                    </div>
                  </div>
                </Surface>
              </div>
            )}

            {/* ── NOTES ──────────────────────────────────── */}
            {tab === "notes" && (
              <>
                <Surface style={{ padding: 28, marginBottom: 20 }}>
                  <Kicker color={t.blue}>Note 1 — Why hexagon, not heptagon</Kicker>
                  <div style={{ fontFamily: t.sans, fontSize: 15, color: t.soft, lineHeight: 1.7, marginTop: 12 }}>
                    <p style={{ margin: "0 0 14px" }}>The previous version used a 7-sided polygon. Seven is important to Lœgos — but it already lives in the seal glyph (𒐛). It does not also need to live in the polygon count. Putting 7 in two places is saying the same thing twice. That is not an operator sentence.</p>
                    <p style={{ margin: "0 0 14px" }}>The hexagon is honeycomb. Cells that fit together. Each one holds something. Together they build a structure. Assembly is hexagonal — stable, tessellating, flat on the ground. Not balancing on a point.</p>
                    <p style={{ margin: 0 }}>Flat-top orientation: the hex sits on a flat edge, not a vertex. Grounded. Stable. Like a building, not a diamond.</p>
                  </div>
                </Surface>

                <Surface style={{ padding: 28, marginBottom: 20 }}>
                  <Kicker color={t.amber}>Note 2 — Why no gradient fill</Kicker>
                  <div style={{ fontFamily: t.sans, fontSize: 15, color: t.soft, lineHeight: 1.7, marginTop: 12 }}>
                    <p style={{ margin: "0 0 14px" }}>The previous version filled the polygon with a color gradient to show assembly progress. This looked good but wasted the edges. The edges have meaning — or will.</p>
                    <p style={{ margin: "0 0 14px" }}>A hexagon has six edges. Each edge is a data channel. In the current implementation, edges light up symmetrically with depth (collected → shaped → proved → sealed). But in the future, each edge could carry a different signal color independently.</p>
                    <p style={{ margin: "0 0 14px" }}>Six edges × three signal colors (green, amber, red) + neutral = an enormous combinatoric space. One tiny hex could communicate: "three aspects are clear, two are in progress, one is blocked." That is more information than a full card provides.</p>
                    <p style={{ margin: 0 }}>Gradients would obscure this. Keep the hex clean now so it can speak later. The shading is not decoration — it is reserved capacity.</p>
                  </div>
                </Surface>

                <Surface style={{ padding: 28, marginBottom: 20 }}>
                  <Kicker color={t.green}>Note 3 — Why shapes are primary navigation, not verbs</Kicker>
                  <div style={{ fontFamily: t.sans, fontSize: 15, color: t.soft, lineHeight: 1.7, marginTop: 12 }}>
                    <p style={{ margin: "0 0 14px" }}>The competing proposal suggested verb-based primary navigation — Capture, Think, Create, Operate, Proof — with shapes as secondary annotation. The instinct was right: users need to know what they are doing. But the conclusion was wrong.</p>
                    <p style={{ margin: "0 0 14px" }}>The verbs are just the shapes described with more words:</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "auto auto 1fr", gap: "12px 20px", alignItems: "center", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, marginBottom: 16 }}>
                    {[
                      ["△", "Aim",     "= capture, declare, promise. The verb is inside the shape."],
                      ["□", "Reality", "= think, gather, measure. Reading reality IS the verb."],
                      ["œ", "Weld",    "= create, operate, converge. Shaping IS welding aim to reality."],
                      ["𒐛", "Seal",    "= prove, receipt, settle. Proof IS the seal."],
                    ].map(([g, label, note]) => (
                      <React.Fragment key={label}>
                        <span style={{ fontSize: 20, color: t.blue, fontWeight: label === "Weld" ? 700 : 400, textAlign: "center" }}>{g}</span>
                        <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 700, color: t.white, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
                        <span style={{ fontFamily: t.sans, fontSize: 14, color: t.soft, lineHeight: 1.5 }}>{note}</span>
                      </React.Fragment>
                    ))}
                  </div>

                  <div style={{ fontFamily: t.sans, fontSize: 15, color: t.soft, lineHeight: 1.7 }}>
                    <p style={{ margin: "0 0 14px" }}>Having both is saying the same thing twice. Five verbs for what four glyphs already say. Four is more honest than five because it matches the actual geometry.</p>
                    <p style={{ margin: "0 0 14px" }}>The shapes are not annotation on the work. They ARE the work. When you are in △, you are capturing aims. When you are in □, you are collecting evidence. The mode and the material are the same thing.</p>
                    <p style={{ margin: 0 }}>The verb layer was a translation layer. C-3PO, not R2-D2. The shapes speak directly.</p>
                  </div>
                </Surface>

                <Surface style={{ padding: 28, marginBottom: 20 }}>
                  <Kicker color={t.white}>Note 4 — The shapes are not decoration on the geometry. They are the geometry.</Kicker>
                  <div style={{ fontFamily: t.sans, fontSize: 15, color: t.soft, lineHeight: 1.7, marginTop: 12 }}>
                    <p style={{ margin: "0 0 14px" }}>The four shapes are not icons applied to the UI. They already ARE the UI. Every screen, every component, every layout is performing one of the four geometric operations.</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "16px 20px", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 22, color: t.blue, textAlign: "center" }}>□</span>
                    <div>
                      <div style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.white, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>□ is everywhere</div>
                      <div style={{ fontFamily: t.sans, fontSize: 14, color: t.soft, lineHeight: 1.55 }}>The screen is a square. Every card is a rectangle. Every input, every surface in the entire system is □ — reality pushing back with edges and constraints. When you put content in a card, you are putting reality in a square. That is not a metaphor. That is the geometry.</div>
                    </div>

                    <span style={{ fontSize: 22, color: t.blue, textAlign: "center" }}>△</span>
                    <div>
                      <div style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.white, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>△ is hierarchy</div>
                      <div style={{ fontFamily: t.sans, fontSize: 14, color: t.soft, lineHeight: 1.55 }}>Every card has a visual triangle: title (loudest) → body (medium) → meta (quietest). The eye travels in a triangle. Header → content → footer is a triangle. Every time you read a screen, you are tracing an aim — from the point of entry down to the base.</div>
                    </div>

                    <span style={{ fontSize: 22, color: t.blue, textAlign: "center", fontWeight: 700 }}>œ</span>
                    <div>
                      <div style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.white, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>œ is every seam</div>
                      <div style={{ fontFamily: t.sans, fontSize: 14, color: t.soft, lineHeight: 1.55 }}>The border between nav and content — that is a weld. The convergence bar is an obvious œ, but so is the moment a card header meets its body. The line between the compass and the stream. Every place where two zones of the UI meet and have to agree — that is œ happening structurally.</div>
                    </div>

                    <span style={{ fontSize: 22, color: t.blue, textAlign: "center" }}>𒐛</span>
                    <div>
                      <div style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.white, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>𒐛 is closure</div>
                      <div style={{ fontFamily: t.sans, fontSize: 14, color: t.soft, lineHeight: 1.55 }}>A sealed card. A completed form. A full hex. The bottom nav bar closing the screen. The footer sealing the document. Every time the UI says "this is done, this is bounded, this is complete" — that is 𒐛.</div>
                    </div>
                  </div>

                  <div style={{ fontFamily: t.sans, fontSize: 15, color: t.soft, lineHeight: 1.7 }}>
                    <p style={{ margin: 0 }}>The design system does not use the shapes. The design system IS the shapes. The variables run across both the philosophy and the visual language because they were never separate. Ultra compression: the same four operations that describe how meaning assembles also describe how a screen assembles. □ contains. △ directs. œ joins. 𒐛 seals. That is the entire design system in four verbs.</p>
                  </div>
                </Surface>

                <Surface style={{ padding: 28 }}>
                  <Kicker>What converged</Kicker>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                    {[
                      "Shape language: △ □ œ 𒐛 as primary navigation and material grammar.",
                      "Flat-top hexagon as the assembly glyph. Edges as data channels.",
                      "Token split: blue = brand, green/amber/red = signals. Never cross.",
                      "Depth stacks for inline. Hex glyph for hero. Both show the same data.",
                      "Convergence bar: aim (blue) meets reality (green). œ activates at 90%.",
                      "Trust: L1/L2/L3 mapping to signal colors.",
                      "Assembled cards: click to see blocks. Cards are receipts of their own construction.",
                      "Surface gradients for soft depth. No hard borders on containers.",
                      "Mobile and desktop share one object model. Same box. Same language.",
                      "No Lucide icons. No generic icons. Shapes only.",
                      "The shapes are the geometry: □ contains, △ directs, œ joins, 𒐛 seals. The UI IS the philosophy.",
                    ].map((rule, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <SignalDot status="released" size={6} />
                        <span style={{ fontFamily: t.sans, fontSize: 14, color: t.soft, lineHeight: 1.5 }}>{rule}</span>
                      </div>
                    ))}
                  </div>
                </Surface>
              </>
            )}
          </div>

          <div style={{ padding: "16px 24px", borderTop: `1px solid ${t.line}`, textAlign: "center" }}>
            <span style={{ fontFamily: t.mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: t.ghost }}>Lœgos Design System v4.1 · △ □ œ 𒐛 · Lakin.ai</span>
          </div>
        </Surface>
      </div>
    </div>
  );
}
