import { useState } from "react";

// ═══════════════════════════════════════════════════════════
// LŒGOS DESIGN SYSTEM v1.3
// Blue brand. Dashboard signals. No brown.
// ═══════════════════════════════════════════════════════════

const tokens = {
  color: {
    ground: "#0C0C0E",
    surface1: "#121214",
    surface2: "#18181B",
    surface3: "#1E1E22",
    elevated: "#252528",

    textPrimary: "#EEEEF0",
    textSecondary: "#8B8B92",
    textMuted: "#4E4E56",
    textGhost: "#2D2D33",

    // ── BRAND ACCENT ──
    // Blue. From the login screen. This is Lœgos.
    accent: "#4A9EF2",
    accentDim: "rgba(74,158,242,0.10)",
    accentSoft: "rgba(74,158,242,0.20)",

    // ── DASHBOARD SIGNALS ──
    // Universal. Not brand. Functional only.
    green: "#5EC269",
    greenDim: "rgba(94,194,105,0.10)",
    amber: "#E5A84B",
    amberDim: "rgba(229,168,75,0.10)",
    red: "#E05A52",
    redDim: "rgba(224,90,82,0.10)",
    neutral: "#6B6B73",

    border: "rgba(255,255,255,0.06)",
  },
  space: [0, 2, 4, 8, 12, 16, 24, 32, 48, 64],
  radius: { sm: 4, md: 8, lg: 12 },
  font: {
    mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
    sans: "'Inter',-apple-system,sans-serif",
  },
};

// ── SIGNAL MAP ──────────────────────────────────────────────
const signalMap = {
  released: "green", sealed: "green", clear: "green",
  committing: "amber", collecting: "amber", shaping: "amber", proving: "amber", active: "amber",
  blocked: "red", alert: "red", overdue: "red",
  waiting: "neutral", dormant: "neutral", imported: "neutral",
};

function sigColor(status) {
  const s = signalMap[status] || "neutral";
  return tokens.color[s];
}
function sigDim(status) {
  const s = signalMap[status] || "neutral";
  return { green: tokens.color.greenDim, amber: tokens.color.amberDim, red: tokens.color.redDim, neutral: "rgba(107,107,115,0.08)" }[s];
}

// ── SIGNAL DOT ──────────────────────────────────────────────
function SignalDot({ status, size = 6 }) {
  return <span style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: sigColor(status), display: "inline-block", flexShrink: 0 }} />;
}

// ── INDICATOR ───────────────────────────────────────────────
function Indicator({ status, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: tokens.font.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: sigColor(status), lineHeight: 1 }}>
      <SignalDot status={status} />
      {label || status}
    </span>
  );
}

// ── BUTTON ──────────────────────────────────────────────────
function Button({ variant = "secondary", children, size = "md" }) {
  const sizes = { sm: { padding: "5px 10px", fontSize: 10 }, md: { padding: "7px 14px", fontSize: 11 }, lg: { padding: "9px 18px", fontSize: 12 } };
  const variants = {
    primary: { backgroundColor: tokens.color.accent, color: tokens.color.ground },
    secondary: { backgroundColor: tokens.color.surface3, color: tokens.color.textSecondary },
    ghost: { backgroundColor: "transparent", color: tokens.color.textMuted },
  };
  return (
    <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, border: "none", borderRadius: tokens.radius.sm, fontFamily: tokens.font.mono, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", lineHeight: 1, ...sizes[size], ...variants[variant] }}>
      {children}
    </button>
  );
}

// ── SPATIAL CARD ────────────────────────────────────────────
function SpatialCard({ label, statuses = [], title, description, actions = [], accent }) {
  return (
    <div
      style={{
        backgroundColor: tokens.color.surface2,
        borderRadius: tokens.radius.md,
        padding: tokens.space[6],
        borderLeft: accent ? `2px solid ${tokens.color.accent}` : "2px solid transparent",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gridTemplateRows: "auto 1fr auto",
        gap: `${tokens.space[4]}px ${tokens.space[5]}px`,
        minHeight: 100,
      }}
    >
      <div style={{ gridColumn: 1, gridRow: 1 }}>
        {label && <span style={{ fontFamily: tokens.font.mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: accent ? tokens.color.accent : tokens.color.textMuted }}>{label}</span>}
      </div>
      <div style={{ gridColumn: 2, gridRow: 1, display: "flex", gap: tokens.space[4], alignItems: "center", justifyContent: "flex-end" }}>
        {statuses.map((s, i) => <Indicator key={i} status={s} />)}
      </div>
      <div style={{ gridColumn: "1 / -1", gridRow: 2, alignSelf: "center" }}>
        {title && <div style={{ fontFamily: tokens.font.sans, fontSize: 16, fontWeight: 600, color: tokens.color.textPrimary, lineHeight: 1.35, marginBottom: description ? tokens.space[2] : 0 }}>{title}</div>}
        {description && <div style={{ fontFamily: tokens.font.sans, fontSize: 13, color: tokens.color.textSecondary, lineHeight: 1.4 }}>{description}</div>}
      </div>
      {actions.length > 0 && (
        <div style={{ gridColumn: "1 / -1", gridRow: 3, display: "flex", gap: tokens.space[3], justifyContent: "flex-end" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

// ── COMPACT CARD ────────────────────────────────────────────
function CompactCard({ label, status, value, action }) {
  return (
    <div style={{ backgroundColor: tokens.color.surface2, borderRadius: tokens.radius.md, padding: `${tokens.space[4]}px ${tokens.space[5]}px`, display: "flex", alignItems: "center", gap: tokens.space[4] }}>
      <SignalDot status={status} />
      <span style={{ fontFamily: tokens.font.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tokens.color.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: tokens.font.sans, fontSize: 13, color: tokens.color.textPrimary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

// ── ENTRY ROW ───────────────────────────────────────────────
function EntryRow({ index, type, status, children }) {
  return (
    <div style={{ display: "flex", gap: tokens.space[4], padding: `${tokens.space[4]}px 0`, borderBottom: `1px solid ${tokens.color.border}`, alignItems: "flex-start" }}>
      <span style={{ fontFamily: tokens.font.mono, fontSize: 10, color: tokens.color.textGhost, minWidth: 24, flexShrink: 0, paddingTop: 2 }}>{String(index).padStart(3, "0")}</span>
      {status && <SignalDot status={status} size={5} />}
      <div style={{ flex: 1 }}>
        {type && <span style={{ fontFamily: tokens.font.mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tokens.color.textMuted, marginRight: tokens.space[3] }}>{type}</span>}
        <span style={{ fontFamily: tokens.font.sans, fontSize: 13, color: tokens.color.textPrimary, lineHeight: 1.5 }}>{children}</span>
      </div>
    </div>
  );
}

// ── NAV ITEM ────────────────────────────────────────────────
function NavItem({ icon, label, active, badge }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 14px", cursor: "pointer", position: "relative" }}>
      <span style={{ fontSize: 15, color: active ? tokens.color.textPrimary : tokens.color.textMuted }}>{icon}</span>
      <span style={{ fontFamily: tokens.font.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: active ? tokens.color.textPrimary : tokens.color.textMuted }}>{label}</span>
      {active && <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 12, height: 2, borderRadius: 1, backgroundColor: tokens.color.accent }} />}
      {badge && <span style={{ position: "absolute", top: 3, right: 6, fontFamily: tokens.font.mono, fontSize: 7, fontWeight: 700, color: tokens.color.accent }}>{badge}</span>}
    </div>
  );
}

// ── METRIC ──────────────────────────────────────────────────
function Metric({ value, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <span style={{ fontFamily: tokens.font.mono, fontSize: 18, fontWeight: 700, color: tokens.color.textPrimary }}>{value}</span>
      <span style={{ fontFamily: tokens.font.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: tokens.color.textMuted }}>{label}</span>
    </div>
  );
}

// ── HELPERS ──────────────────────────────────────────────────
function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: tokens.space[4], margin: `${tokens.space[7]}px 0` }}>
      <div style={{ flex: 1, height: 1, backgroundColor: tokens.color.border }} />
      {label && <span style={{ fontFamily: tokens.font.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: tokens.color.textGhost }}>{label}</span>}
      <div style={{ flex: 1, height: 1, backgroundColor: tokens.color.border }} />
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div style={{ marginBottom: tokens.space[6] }}>
      <h2 style={{ fontFamily: tokens.font.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: tokens.color.accent, margin: 0 }}>{title}</h2>
      {description && <p style={{ fontFamily: tokens.font.sans, fontSize: 13, color: tokens.color.textSecondary, margin: `${tokens.space[3]}px 0 0`, lineHeight: 1.5 }}>{description}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════

const tabs = ["palette", "signals", "cards", "components", "composed"];

export default function App() {
  const [tab, setTab] = useState("palette");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: tokens.color.ground, color: tokens.color.textPrimary }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: tokens.color.ground, padding: `${tokens.space[5]}px ${tokens.space[6]}px` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: tokens.space[4], marginBottom: tokens.space[4] }}>
          <span style={{ fontFamily: tokens.font.mono, fontSize: 14, fontWeight: 700, letterSpacing: "0.16em", color: tokens.color.textPrimary }}>LŒGOS</span>
          <span style={{ fontFamily: tokens.font.mono, fontSize: 9, color: tokens.color.textMuted, letterSpacing: "0.06em" }}>DS v1.3</span>
        </div>
        <div style={{ display: "flex", gap: tokens.space[2] }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ fontFamily: tokens.font.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 12px", border: "none", borderRadius: tokens.radius.sm, cursor: "pointer", backgroundColor: tab === t ? tokens.color.surface3 : "transparent", color: tab === t ? tokens.color.textPrimary : tokens.color.textMuted }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: `${tokens.space[5]}px ${tokens.space[6]}px`, maxWidth: 680, margin: "0 auto" }}>

        {/* ── PALETTE ────────────────────────────────────── */}
        {tab === "palette" && (
          <>
            <SectionHeader title="Brand vs Signal" description="Two color systems. They never cross. Blue is brand — identity, accent, active states, navigation. Green/amber/red are signals — functional status only." />

            {/* Brand accent showcase */}
            <div style={{ backgroundColor: tokens.color.surface2, borderRadius: tokens.radius.md, padding: tokens.space[6], marginBottom: tokens.space[6] }}>
              <div style={{ fontFamily: tokens.font.mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: tokens.color.accent, marginBottom: tokens.space[5] }}>Brand Accent</div>
              <div style={{ display: "flex", gap: tokens.space[4], alignItems: "center", marginBottom: tokens.space[5] }}>
                <div style={{ width: 48, height: 48, borderRadius: tokens.radius.md, backgroundColor: tokens.color.accent }} />
                <div style={{ width: 48, height: 48, borderRadius: tokens.radius.md, backgroundColor: tokens.color.accentSoft }} />
                <div style={{ width: 48, height: 48, borderRadius: tokens.radius.md, backgroundColor: tokens.color.accentDim }} />
                <div>
                  <div style={{ fontFamily: tokens.font.mono, fontSize: 11, fontWeight: 600, color: tokens.color.accent }}>#4A9EF2</div>
                  <div style={{ fontFamily: tokens.font.sans, fontSize: 12, color: tokens.color.textMuted, marginTop: 2 }}>Used for: labels, active nav, left-edge accent, primary buttons, section headers, links</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: tokens.space[5], flexWrap: "wrap" }}>
                <div style={{ borderLeft: `2px solid ${tokens.color.accent}`, paddingLeft: tokens.space[4] }}>
                  <span style={{ fontFamily: tokens.font.mono, fontSize: 9, color: tokens.color.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>Active card edge</span>
                </div>
                <Button variant="primary" size="sm">Primary Action</Button>
                <span style={{ fontFamily: tokens.font.mono, fontSize: 10, color: tokens.color.accent, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center" }}>Section Label</span>
              </div>
            </div>

            {/* Surfaces */}
            <div style={{ fontFamily: tokens.font.mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: tokens.color.textMuted, marginBottom: tokens.space[4] }}>Surfaces</div>
            <div style={{ display: "flex", gap: tokens.space[2], marginBottom: tokens.space[6] }}>
              {[["ground", tokens.color.ground], ["s1", tokens.color.surface1], ["s2", tokens.color.surface2], ["s3", tokens.color.surface3], ["elevated", tokens.color.elevated]].map(([n, c]) => (
                <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: "100%", height: 40, backgroundColor: c, borderRadius: tokens.radius.sm, border: `1px solid ${tokens.color.border}` }} />
                  <span style={{ fontFamily: tokens.font.mono, fontSize: 8, color: tokens.color.textMuted }}>{n}</span>
                </div>
              ))}
            </div>

            {/* Text levels */}
            <div style={{ fontFamily: tokens.font.mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: tokens.color.textMuted, marginBottom: tokens.space[4] }}>Text</div>
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.space[3], marginBottom: tokens.space[6] }}>
              {[["primary", tokens.color.textPrimary, "Content you read"], ["secondary", tokens.color.textSecondary, "Supporting context"], ["muted", tokens.color.textMuted, "Labels, metadata"], ["ghost", tokens.color.textGhost, "Structural lines"]].map(([n, c, ex]) => (
                <div key={n} style={{ display: "flex", alignItems: "baseline", gap: tokens.space[5] }}>
                  <span style={{ fontFamily: tokens.font.mono, fontSize: 9, color: tokens.color.textMuted, minWidth: 56, textAlign: "right" }}>{n}</span>
                  <span style={{ fontFamily: tokens.font.sans, fontSize: 14, color: c }}>{ex}</span>
                </div>
              ))}
            </div>

            {/* Signal colors — functional only */}
            <div style={{ fontFamily: tokens.font.mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: tokens.color.textMuted, marginBottom: tokens.space[4] }}>Signals (functional only)</div>
            <div style={{ display: "flex", gap: tokens.space[5] }}>
              {[["green", tokens.color.green, "Clear"], ["amber", tokens.color.amber, "Active"], ["red", tokens.color.red, "Act now"], ["neutral", tokens.color.neutral, "Waiting"]].map(([n, c, label]) => (
                <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: tokens.radius.md, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${c}15` }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />
                  </div>
                  <span style={{ fontFamily: tokens.font.mono, fontSize: 8, fontWeight: 600, color: c, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                </div>
              ))}
            </div>

            <Divider label="Rule" />
            <div style={{ fontFamily: tokens.font.sans, fontSize: 13, color: tokens.color.textSecondary, lineHeight: 1.7 }}>
              Blue never means a status. Green/amber/red never mean brand. If a label is blue, it's identity. If a dot is green, something is done. They don't mix.
            </div>
          </>
        )}

        {/* ── SIGNALS ────────────────────────────────────── */}
        {tab === "signals" && (
          <>
            <SectionHeader title="Dashboard Signals" description="Three urgency categories. The dot tells you how fast. The label tells you what." />
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.space[6], marginBottom: tokens.space[7] }}>
              {[
                { signal: "green", label: "Green — Clear", desc: "Done. Released. Sealed. No action needed.", statuses: ["released", "sealed", "clear"] },
                { signal: "amber", label: "Amber — Active", desc: "In progress. Assembling. Attention — not alarm.", statuses: ["committing", "collecting", "shaping", "proving"] },
                { signal: "red", label: "Red — Act Now", desc: "Blocked. Overdue. Needs your hands.", statuses: ["blocked", "alert", "overdue"] },
                { signal: "neutral", label: "Neutral — Waiting", desc: "Dormant. Not yet started. No signal yet.", statuses: ["waiting", "dormant", "imported"] },
              ].map((g) => (
                <div key={g.signal} style={{ display: "flex", gap: tokens.space[5] }}>
                  <div style={{ width: 40, height: 40, borderRadius: tokens.radius.md, backgroundColor: sigDim(g.statuses[0]), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <SignalDot status={g.statuses[0]} size={10} />
                  </div>
                  <div>
                    <div style={{ fontFamily: tokens.font.mono, fontSize: 10, fontWeight: 700, color: sigColor(g.statuses[0]), letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{g.label}</div>
                    <div style={{ fontFamily: tokens.font.sans, fontSize: 12, color: tokens.color.textSecondary, marginBottom: tokens.space[3] }}>{g.desc}</div>
                    <div style={{ display: "flex", gap: tokens.space[4], flexWrap: "wrap" }}>
                      {g.statuses.map((s) => <Indicator key={s} status={s} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── CARDS ──────────────────────────────────────── */}
        {tab === "cards" && (
          <>
            <SectionHeader title="Spatial Cards" description="Corners carry meaning. Blue left-edge = active/brand. Status dots top-right. Actions bottom-right." />
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.space[5] }}>
              <SpatialCard label="Reality" accent statuses={["released", "committing"]} title="Listen · Lœgos — Origin, Evolution, Feedback, and Receipt" description="Assembly Index is ready." actions={[<Button key="a" variant="ghost" size="sm">Add Source</Button>, <Button key="b" variant="secondary" size="sm">Open</Button>]} />
              <SpatialCard label="Assembly Lane" statuses={["released", "committing"]} title="How Lœgos Assembled Itself" description="11 sources · 45 entries" actions={[<Button key="a" variant="ghost" size="sm">Collecting</Button>, <Button key="b" variant="ghost" size="sm">Shaping</Button>, <Button key="c" variant="secondary" size="sm">Proving</Button>]} />
              <SpatialCard label="Seed" statuses={["waiting"]} title="Seed of seeds" description="Current live assembly shape · 0 blocks" actions={[<Button key="a" variant="ghost" size="sm">Tools</Button>]} />
              <SpatialCard label="Sync" statuses={["blocked"]} title="GitHub → GetReceipts pipeline" description="Auth token expired 2 hours ago." actions={[<Button key="a" variant="primary" size="sm">Reconnect</Button>]} />
            </div>

            <Divider label="Compact" />
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.space[3] }}>
              <CompactCard label="Origin" status="released" value="28 entries" action={<Button variant="ghost" size="sm">Open</Button>} />
              <CompactCard label="Feedback" status="committing" value="12 entries" action={<Button variant="ghost" size="sm">Open</Button>} />
              <CompactCard label="Pipeline" status="blocked" value="Auth expired" action={<Button variant="primary" size="sm">Fix</Button>} />
              <CompactCard label="Archive" status="waiting" value="No content yet" />
            </div>

            <Divider label="Anatomy" />
            <div style={{ backgroundColor: tokens.color.surface2, borderRadius: tokens.radius.md, padding: tokens.space[6], borderLeft: `2px solid ${tokens.color.accent}`, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto 1fr auto", gap: `${tokens.space[5]}px`, minHeight: 120 }}>
              <div style={{ fontFamily: tokens.font.mono, fontSize: 9, color: tokens.color.accent, letterSpacing: "0.1em" }}>↖ LABEL (blue = brand)</div>
              <div style={{ fontFamily: tokens.font.mono, fontSize: 9, color: tokens.color.green, letterSpacing: "0.1em", textAlign: "right" }}>● ● STATUS ↗ (signal colors)</div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontFamily: tokens.font.sans, fontSize: 15, fontWeight: 600, color: tokens.color.textPrimary, marginBottom: 2 }}>← Title (white, full width)</div>
                <div style={{ fontFamily: tokens.font.sans, fontSize: 12, color: tokens.color.textSecondary }}>← Description (secondary)</div>
              </div>
              <div />
              <div style={{ fontFamily: tokens.font.mono, fontSize: 9, color: tokens.color.textMuted, letterSpacing: "0.1em", textAlign: "right", alignSelf: "end" }}>ACTIONS ↘</div>
            </div>
          </>
        )}

        {/* ── COMPONENTS ─────────────────────────────────── */}
        {tab === "components" && (
          <>
            <SectionHeader title="Buttons" description="Primary = blue (brand action). Secondary = surface shift. Ghost = text only." />
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.space[5], marginBottom: tokens.space[7] }}>
              {["primary", "secondary", "ghost"].map((v) => (
                <div key={v} style={{ display: "flex", alignItems: "center", gap: tokens.space[6] }}>
                  <span style={{ fontFamily: tokens.font.mono, fontSize: 9, color: tokens.color.textGhost, minWidth: 56, textAlign: "right" }}>{v}</span>
                  <div style={{ display: "flex", gap: tokens.space[3] }}>
                    <Button variant={v} size="sm">Small</Button>
                    <Button variant={v} size="md">Medium</Button>
                    <Button variant={v} size="lg">Large</Button>
                  </div>
                </div>
              ))}
            </div>

            <Divider />
            <SectionHeader title="Entry Rows" />
            <div style={{ backgroundColor: tokens.color.surface2, borderRadius: tokens.radius.md, padding: `0 ${tokens.space[5]}px` }}>
              <EntryRow index={1} type="Assembly" status="released">A black screen with a single line of gray text.</EntryRow>
              <EntryRow index={2} type="Origin" status="committing">Writing was invented for receipts.</EntryRow>
              <EntryRow index={3} type="Feedback" status="blocked">Missing source link — cannot verify.</EntryRow>
              <EntryRow index={4} type="Imported" status="waiting">No content yet.</EntryRow>
            </div>

            <Divider />
            <SectionHeader title="Navigation" />
            <div style={{ backgroundColor: tokens.color.surface1, borderRadius: tokens.radius.md, padding: `${tokens.space[3]}px ${tokens.space[4]}px`, display: "flex", justifyContent: "space-around" }}>
              <NavItem icon="◇" label="Lane" active badge="79" />
              <NavItem icon="▷" label="Listen" />
              <NavItem icon="+" label="Add" />
              <NavItem icon="◷" label="Seed" />
              <NavItem icon="▤" label="Receipts" />
            </div>

            <Divider />
            <SectionHeader title="Metrics" />
            <div style={{ display: "flex", justifyContent: "space-around", padding: tokens.space[6], backgroundColor: tokens.color.surface2, borderRadius: tokens.radius.md }}>
              <Metric value="79" label="Index" />
              <Metric value="11" label="Sources" />
              <Metric value="45" label="Entries" />
            </div>

            <Divider />
            <SectionHeader title="Typography" />
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.space[5] }}>
              {[
                { label: "label", fam: tokens.font.mono, sz: 10, wt: 600, ls: "0.1em", tt: "uppercase", sample: "RELEASED · COMMITTING" },
                { label: "mono", fam: tokens.font.mono, sz: 12, wt: 500, ls: "0.03em", tt: "none", sample: "11 sources 45 entries" },
                { label: "body", fam: tokens.font.sans, sz: 13, wt: 400, ls: "0.01em", tt: "none", sample: "Assembly Index is ready." },
                { label: "body-lg", fam: tokens.font.sans, sz: 15, wt: 400, ls: "0", tt: "none", sample: "Close the gap between what you think and what you do." },
                { label: "heading", fam: tokens.font.sans, sz: 17, wt: 600, ls: "-0.01em", tt: "none", sample: "Origin, Evolution, Feedback, and Receipt" },
                { label: "title", fam: tokens.font.mono, sz: 15, wt: 700, ls: "0.08em", tt: "uppercase", sample: "How Lœgos Assembled Itself" },
                { label: "display", fam: tokens.font.sans, sz: 28, wt: 700, ls: "-0.03em", tt: "none", sample: "Meaning is an assembled object." },
              ].map((t) => (
                <div key={t.label} style={{ display: "flex", gap: tokens.space[5] }}>
                  <span style={{ fontFamily: tokens.font.mono, fontSize: 9, color: tokens.color.textGhost, minWidth: 50, textAlign: "right", paddingTop: 4, flexShrink: 0 }}>{t.label}</span>
                  <div>
                    <div style={{ fontFamily: t.fam, fontSize: t.sz, fontWeight: t.wt, letterSpacing: t.ls, textTransform: t.tt, color: tokens.color.textPrimary, lineHeight: 1.35 }}>{t.sample}</div>
                    <div style={{ fontFamily: tokens.font.mono, fontSize: 8, color: tokens.color.textGhost, marginTop: 2 }}>{t.sz}px · {t.wt} · {t.ls}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── COMPOSED ───────────────────────────────────── */}
        {tab === "composed" && (
          <>
            <SectionHeader title="Composed Screen" description="Blue brand. Signal dots. Spatial cards. Everything in place." />
            <div style={{ backgroundColor: tokens.color.ground, borderRadius: tokens.radius.lg, overflow: "hidden", border: `1px solid ${tokens.color.border}` }}>
              {/* Top bar */}
              <div style={{ display: "flex", alignItems: "center", gap: tokens.space[3], padding: `${tokens.space[4]}px ${tokens.space[5]}px`, borderBottom: `1px solid ${tokens.color.border}` }}>
                <span style={{ fontFamily: tokens.font.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: tokens.color.textPrimary, marginRight: tokens.space[3] }}>LŒGOS</span>
                <Button variant="secondary" size="sm">How Lœg</Button>
                <Button variant="ghost" size="sm">Seven</Button>
              </div>

              <div style={{ padding: tokens.space[5] }}>
                {/* Prompt */}
                <div style={{ backgroundColor: tokens.color.surface2, borderRadius: tokens.radius.md, padding: `${tokens.space[4]}px ${tokens.space[5]}px`, marginBottom: tokens.space[5], display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: tokens.font.sans, fontSize: 13, color: tokens.color.textSecondary }}>Show how Lœgos assembled itself</span>
                  <div style={{ display: "flex", gap: tokens.space[4], alignItems: "center" }}>
                    <Indicator status="released" />
                    <span style={{ fontFamily: tokens.font.mono, fontSize: 10, color: tokens.color.textMuted }}>𒐛 79</span>
                  </div>
                </div>

                {/* Reality card */}
                <SpatialCard label="Reality" accent statuses={["released", "committing"]} title="Listen · Lœgos — Origin, Evolution, Feedback, and Receipt" description="Assembly Index is ready." actions={[<Button key="a" variant="ghost" size="sm">Add Source</Button>, <Button key="b" variant="secondary" size="sm">Open</Button>]} />

                <div style={{ height: tokens.space[5] }} />

                <div style={{ fontFamily: tokens.font.sans, fontSize: 13, color: tokens.color.textSecondary, marginBottom: tokens.space[4] }}>Proof witness · Evidence spine</div>

                <div style={{ backgroundColor: tokens.color.surface2, borderRadius: tokens.radius.md, padding: `0 ${tokens.space[5]}px` }}>
                  <EntryRow index={1} type="Assembly" status="released">A black screen with a single line of gray text.</EntryRow>
                  <EntryRow index={2} type="Origin" status="committing">The first receipt: writing was invented for receipts.</EntryRow>
                </div>
              </div>

              {/* Bottom nav */}
              <div style={{ display: "flex", justifyContent: "space-around", padding: `${tokens.space[3]}px ${tokens.space[4]}px`, borderTop: `1px solid ${tokens.color.border}`, backgroundColor: tokens.color.surface1 }}>
                <NavItem icon="◇" label="Lane" active badge="79" />
                <NavItem icon="▷" label="Listen" />
                <NavItem icon="+" label="Add" />
                <NavItem icon="◷" label="Seed" />
                <NavItem icon="▤" label="Receipts" />
              </div>
            </div>

            <Divider label="Login Screen" />

            {/* Login mockup */}
            <div style={{ backgroundColor: tokens.color.surface2, borderRadius: tokens.radius.lg, padding: tokens.space[7], display: "grid", gridTemplateColumns: "1fr 1fr", gap: tokens.space[7], alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: tokens.font.mono, fontSize: 12, color: tokens.color.textMuted, letterSpacing: "0.06em", marginBottom: tokens.space[4] }}>Lœgos</div>
                <div style={{ fontFamily: tokens.font.sans, fontSize: 26, fontWeight: 700, color: tokens.color.textPrimary, lineHeight: 1.2, marginBottom: tokens.space[4], letterSpacing: "-0.02em" }}>Meaning is an assembled object.</div>
                <div style={{ fontFamily: tokens.font.sans, fontSize: 14, color: tokens.color.accent, lineHeight: 1.5 }}>Close the gap between what you think and what you do.</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: tokens.space[4] }}>
                <Button variant="primary" size="lg">Continue with Apple</Button>
                <div style={{ fontFamily: tokens.font.mono, fontSize: 10, color: tokens.color.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Email magic link</div>
                <div style={{ backgroundColor: tokens.color.surface3, borderRadius: tokens.radius.sm, padding: "10px 14px" }}>
                  <span style={{ fontFamily: tokens.font.mono, fontSize: 12, color: tokens.color.textPrimary }}>deniz@lakin.ai</span>
                </div>
                <Button variant="secondary" size="lg">Send magic link</Button>
                <div style={{ fontFamily: tokens.font.sans, fontSize: 12, color: tokens.color.green }}>Magic link sent. Check your inbox.</div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: tokens.space[8], paddingTop: tokens.space[6], borderTop: `1px solid ${tokens.color.border}`, textAlign: "center" }}>
          <span style={{ fontFamily: tokens.font.mono, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: tokens.color.textGhost }}>Lœgos Design System v1.3 · Lakin.ai · 𒐛</span>
        </div>
      </div>
    </div>
  );
}
