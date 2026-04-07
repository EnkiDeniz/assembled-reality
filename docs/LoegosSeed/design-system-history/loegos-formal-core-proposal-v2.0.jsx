import React from "react";

const t = {
  canvas: "#0b0c0f",
  shell: "#121318",
  surface: "#17191f",
  raised: "#1d2028",
  lifted: "#242833",
  text: "#f4f6f8",
  soft: "rgba(244,246,248,0.72)",
  muted: "rgba(244,246,248,0.46)",
  ghost: "rgba(244,246,248,0.18)",
  line: "rgba(244,246,248,0.08)",
  lineStrong: "rgba(244,246,248,0.14)",
  blue: "#5ea7ff",
  blueDim: "rgba(94,167,255,0.1)",
  blueSoft: "rgba(94,167,255,0.18)",
  green: "#67d07e",
  greenDim: "rgba(103,208,126,0.11)",
  amber: "#f0bf69",
  amberDim: "rgba(240,191,105,0.11)",
  red: "#ef6d62",
  redDim: "rgba(239,109,98,0.11)",
  neutral: "#8f94a3",
  neutralDim: "rgba(143,148,163,0.11)",
  mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace',
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
  shadow: "0 24px 90px rgba(0,0,0,0.34)",
};

const shapeSpec = {
  aim: {
    glyph: "△",
    label: "Aim",
    noun: "declared object",
    verbs: ["declare", "name", "sharpen"],
    role: "Defines what the box is trying to make real.",
    precondition: "No precondition. A box can begin in Aim.",
  },
  reality: {
    glyph: "□",
    label: "Reality",
    noun: "evidence field",
    verbs: ["capture", "listen", "inspect"],
    role: "Records what the world returned: observation, source, measurement, witness.",
    precondition: "No precondition. Reality can be appended at any time.",
  },
  weld: {
    glyph: "œ",
    label: "Weld",
    noun: "converged relation",
    verbs: ["stage", "rewrite", "operate"],
    role: "Binds aim and reality into an accountable comparison.",
    precondition: "Requires at least one aim and one reality block in scope.",
  },
  seal: {
    glyph: "𒐛",
    label: "Seal",
    noun: "proof action",
    verbs: ["review", "seal", "share"],
    role: "Commits a proved relation into portable receipt state.",
    precondition: "Requires a weld, convergence >= 0.7, and trust floor L2.",
  },
};

const verbSpec = {
  aim: shapeSpec.aim.verbs,
  reality: shapeSpec.reality.verbs,
  weld: shapeSpec.weld.verbs,
  seal: shapeSpec.seal.verbs,
};

const signalStates = [
  {
    label: "neutral",
    tone: "neutral",
    meaning: "No strong claim yet.",
    transition: "Can move to amber, green, or red. Cannot return here once informed.",
  },
  {
    label: "amber",
    tone: "amber",
    meaning: "Active, incomplete, or time-sensitive.",
    transition: "Can move toward green or red. Cannot un-activate.",
  },
  {
    label: "green",
    tone: "green",
    meaning: "Confirmed enough to proceed.",
    transition: "Can downgrade to amber or red if contradicted. Cannot become unknown.",
  },
  {
    label: "red",
    tone: "red",
    meaning: "Blocked, contradicted, or broken.",
    transition: "Can recover to amber or green with new evidence. Cannot become unknown.",
  },
];

const trustLevels = [
  {
    label: "L1",
    title: "Unverified",
    tone: "neutral",
    rule: "Exists but has no provenance chain yet.",
  },
  {
    label: "L2",
    title: "Partial",
    tone: "amber",
    rule: "Has provenance or secondary confirmation.",
  },
  {
    label: "L3",
    title: "Verified",
    tone: "green",
    rule: "Has provenance, >= 2 independent sources, and survived Operate.",
  },
];

const depthLevels = [
  {
    level: 1,
    title: "Collected",
    tone: "neutral",
    rule: "The block exists with content.",
  },
  {
    level: 2,
    title: "Shaped",
    tone: "amber",
    rule: "The block was edited, contested, or compared.",
  },
  {
    level: 3,
    title: "Proved",
    tone: "blue",
    rule: "The block gained support, survived Operate, or reached trust L2+.",
  },
  {
    level: 4,
    title: "Sealed",
    tone: "green",
    rule: "The block entered a valid seal operation. Depth never decreases.",
  },
];

const hexEdges = [
  { edge: "Edge 0", aspect: "aim completeness", tone: "green", note: "All declared aims addressed." },
  { edge: "Edge 1", aspect: "evidence quality", tone: "green", note: "Average trust across reality blocks is strong." },
  { edge: "Edge 2", aspect: "convergence strength", tone: "green", note: "Aim-reality alignment remains above threshold." },
  { edge: "Edge 3", aspect: "weld validity", tone: "green", note: "Every weld is backed by aim and reality." },
  { edge: "Edge 4", aspect: "depth distribution", tone: "amber", note: "The box is assembled but not fully deep everywhere." },
  { edge: "Edge 5", aspect: "seal integrity", tone: "amber", note: "Valid seals exist, but one open thread remains." },
];

const consentRules = {
  consent: [
    "Add block",
    "Recast shape",
    "Major signal reversal",
    "Seal",
    "Accept Seven output as a new block",
  ],
  automatic: [
    "Convergence recomputation",
    "Hex updates",
    "Eligible depth increase",
    "Trust recalculation from provenance",
  ],
};

const workedFlow = [
  {
    step: "1. Aim declared",
    shape: "aim",
    tone: "blue",
    detail: "Seed: Ship working prototype to Melih by Friday.",
  },
  {
    step: "2. Reality captured on phone",
    shape: "reality",
    tone: "amber",
    detail: "Photo of prototype running. Trust L1. Depth 1. Convergence increases.",
  },
  {
    step: "3. More reality on desktop",
    shape: "reality",
    tone: "green",
    detail: "Email confirms Melih is available Friday. Trust L2. Evidence quality rises.",
  },
  {
    step: "4. Operate read",
    shape: "weld",
    tone: "amber",
    detail: "Seven diagnoses unresolved action. No mutation. Compared blocks deepen.",
  },
  {
    step: "5. Weld formed after confirmation",
    shape: "weld",
    tone: "green",
    detail: "Prototype link sent. System confirms aim met reality. Weld becomes valid.",
  },
  {
    step: "6. Seal applied",
    shape: "seal",
    tone: "green",
    detail: "Type check passes: weld exists, convergence 0.92, trust >= L2, depth >= 3.",
  },
  {
    step: "7. New micro-aim opens",
    shape: "aim",
    tone: "amber",
    detail: "Feedback creates a pricing question. Macro receipt stays valid while the loop continues.",
  },
];

const operatorSentence = [
  { word: "Ship", shape: "aim", signal: "neutral", position: "detect" },
  { word: "working", shape: "reality", signal: "neutral", position: "compare" },
  { word: "prototype", shape: "reality", signal: "amber", position: "adapt" },
  { word: "to", shape: "weld", signal: "neutral", position: "amplify" },
  { word: "Melih", shape: "reality", signal: "green", position: "maintain" },
  { word: "by", shape: "weld", signal: "neutral", position: "prepare" },
  { word: "Friday", shape: "seal", signal: "amber", position: "arrive" },
];

function toneVars(tone) {
  if (tone === "green") {
    return { color: t.green, bg: t.greenDim, border: "rgba(103,208,126,0.24)" };
  }
  if (tone === "amber") {
    return { color: t.amber, bg: t.amberDim, border: "rgba(240,191,105,0.24)" };
  }
  if (tone === "red") {
    return { color: t.red, bg: t.redDim, border: "rgba(239,109,98,0.24)" };
  }
  if (tone === "blue") {
    return { color: t.blue, bg: t.blueDim, border: "rgba(94,167,255,0.25)" };
  }
  return { color: t.neutral, bg: t.neutralDim, border: "rgba(143,148,163,0.24)" };
}

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

function Section({ title, kicker, children, intro }) {
  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <Kicker>{kicker}</Kicker>
        <h2
          style={{
            margin: 0,
            fontFamily: t.sans,
            fontSize: "clamp(24px, 3vw, 40px)",
            lineHeight: 1.04,
            letterSpacing: "-0.045em",
            fontWeight: 680,
            color: t.text,
          }}
        >
          {title}
        </h2>
        {intro ? (
          <p
            style={{
              margin: 0,
              maxWidth: 760,
              fontFamily: t.sans,
              fontSize: 16,
              lineHeight: 1.65,
              color: t.soft,
            }}
          >
            {intro}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Surface({ children, style, className = "" }) {
  return (
    <div
      className={className}
      style={{
        border: `1px solid ${t.line}`,
        borderRadius: 24,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.03), transparent 28%), rgba(255,255,255,0.018)",
        boxShadow: t.shadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ children, color = t.blue }) {
  return (
    <span
      style={{
        fontFamily: t.mono,
        fontSize: 11,
        fontWeight: 650,
        letterSpacing: "0.11em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </span>
  );
}

function SignalChip({ tone = "neutral", children }) {
  const vars = toneVars(tone);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 28,
        padding: "0 12px",
        borderRadius: 999,
        border: `1px solid ${vars.border}`,
        background: vars.bg,
        color: vars.color,
        fontFamily: t.mono,
        fontSize: 11,
        fontWeight: 650,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: vars.color,
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
}

function MonoLine({ children, color = t.soft, size = 12 }) {
  return (
    <div
      style={{
        fontFamily: t.mono,
        fontSize: size,
        lineHeight: 1.5,
        color,
      }}
    >
      {children}
    </div>
  );
}

function RoomCard({ shapeKey }) {
  const spec = shapeSpec[shapeKey];
  return (
    <Surface style={{ padding: 22 }}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                border: `1px solid ${t.lineStrong}`,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.03)",
                color: spec.label === "Weld" ? t.blue : t.text,
                fontSize: spec.label === "Weld" ? 28 : 25,
                fontWeight: spec.label === "Weld" ? 700 : 500,
              }}
            >
              {spec.glyph}
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              <Kicker>{spec.label}</Kicker>
              <div
                style={{
                  fontFamily: t.sans,
                  fontSize: 24,
                  fontWeight: 640,
                  letterSpacing: "-0.03em",
                  color: t.text,
                }}
              >
                {spec.noun}
              </div>
            </div>
          </div>
          <SignalChip tone="blue">noun room</SignalChip>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: t.sans,
            fontSize: 15,
            lineHeight: 1.65,
            color: t.soft,
          }}
        >
          {spec.role}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {verbSpec[shapeKey].map((verb) => (
            <SignalChip key={verb} tone="neutral">
              {verb}
            </SignalChip>
          ))}
        </div>
        <Surface style={{ padding: 14, borderRadius: 18, background: "rgba(255,255,255,0.015)", boxShadow: "none" }}>
          <Kicker color={t.muted}>runtime condition</Kicker>
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: t.sans,
              fontSize: 14,
              lineHeight: 1.6,
              color: t.soft,
            }}
          >
            {spec.precondition}
          </p>
        </Surface>
      </div>
    </Surface>
  );
}

function AxisCard({ title, kicker, items, renderItem, footer }) {
  return (
    <Surface style={{ padding: 22 }}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <Kicker>{kicker}</Kicker>
          <div
            style={{
              fontFamily: t.sans,
              fontSize: 24,
              fontWeight: 640,
              letterSpacing: "-0.03em",
              color: t.text,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {items.map(renderItem)}
        </div>
        {footer ? <MonoLine color={t.muted}>{footer}</MonoLine> : null}
      </div>
    </Surface>
  );
}

function WordChip({ item }) {
  const shape = shapeSpec[item.shape];
  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        minWidth: 92,
        padding: "14px 12px",
        borderRadius: 18,
        border: `1px solid ${t.line}`,
        background: "rgba(255,255,255,0.025)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span
          style={{
            fontFamily: t.sans,
            fontSize: shape.label === "Weld" ? 22 : 18,
            fontWeight: shape.label === "Weld" ? 700 : 500,
            color: t.text,
          }}
        >
          {shape.glyph}
        </span>
        <SignalChip tone={item.signal}>{item.signal}</SignalChip>
      </div>
      <div
        style={{
          fontFamily: t.sans,
          fontSize: 18,
          fontWeight: 640,
          letterSpacing: "-0.02em",
          color: t.text,
        }}
      >
        {item.word}
      </div>
      <MonoLine size={11} color={t.muted}>
        {shape.label} / {item.position}
      </MonoLine>
    </div>
  );
}

function HexInspector({ centerGlyph = "𒐛" }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const outer = hexPoints(cx, cy, 88);
  const inner = hexPoints(cx, cy, 54);

  return (
    <div style={{ display: "grid", gap: 20, alignItems: "center" }}>
      <div style={{ display: "grid", placeItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
          <polygon
            points={outer.map((pt) => pt.join(",")).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          <polygon
            points={inner.map((pt) => pt.join(",")).join(" ")}
            fill="rgba(255,255,255,0.015)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          {outer.map((pt, idx) => {
            const next = outer[(idx + 1) % outer.length];
            return (
              <line
                key={`edge-${idx}`}
                x1={pt[0]}
                y1={pt[1]}
                x2={next[0]}
                y2={next[1]}
                stroke={toneVars(hexEdges[idx].tone).color}
                strokeWidth="5"
                strokeLinecap="round"
              />
            );
          })}
          {[0, 1, 2].map((idx) => (
            <line
              key={`grid-${idx}`}
              x1={outer[idx][0]}
              y1={outer[idx][1]}
              x2={outer[idx + 3][0]}
              y2={outer[idx + 3][1]}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="central"
            fill={t.text}
            fontSize="34"
            fontWeight={centerGlyph === "œ" ? 700 : 500}
            fontFamily={t.sans}
          >
            {centerGlyph}
          </text>
          <text
            x={cx}
            y={cy + 26}
            textAnchor="middle"
            fill={t.muted}
            fontSize="11"
            fontFamily={t.mono}
          >
            stage 6 / 7
          </text>
        </svg>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {hexEdges.map((edge) => (
          <div
            key={edge.edge}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 12,
              alignItems: "start",
              padding: "12px 14px",
              borderRadius: 16,
              border: `1px solid ${t.line}`,
              background: "rgba(255,255,255,0.018)",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                marginTop: 4,
                background: toneVars(edge.tone).color,
              }}
            />
            <div style={{ display: "grid", gap: 4 }}>
              <MonoLine color={t.text}>{edge.edge} / {edge.aspect}</MonoLine>
              <div style={{ fontFamily: t.sans, fontSize: 14, lineHeight: 1.55, color: t.soft }}>
                {edge.note}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineCard({ item }) {
  const shape = shapeSpec[item.shape];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 14,
        alignItems: "start",
        padding: "16px 18px",
        borderRadius: 20,
        border: `1px solid ${t.line}`,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          border: `1px solid ${toneVars(item.tone).border}`,
          background: toneVars(item.tone).bg,
          color: item.shape === "weld" ? t.blue : toneVars(item.tone).color,
          fontSize: item.shape === "weld" ? 24 : 20,
          fontWeight: item.shape === "weld" ? 700 : 500,
        }}
      >
        {shape.glyph}
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <MonoLine color={toneVars(item.tone).color}>{item.step}</MonoLine>
        <div
          style={{
            fontFamily: t.sans,
            fontSize: 15,
            lineHeight: 1.65,
            color: t.soft,
          }}
        >
          {item.detail}
        </div>
      </div>
    </div>
  );
}

function MobileRealityFrame() {
  return (
    <Surface style={{ padding: 18, borderRadius: 28 }}>
      <div
        style={{
          maxWidth: 360,
          margin: "0 auto",
          borderRadius: 28,
          border: `1px solid ${t.lineStrong}`,
          background: `linear-gradient(180deg, rgba(255,255,255,0.035), transparent 18%), ${t.shell}`,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <Kicker>reality / quick capture</Kicker>
            <MonoLine color={t.text}>capture first, classify second</MonoLine>
          </div>
          <SignalChip tone="amber">L1 / d1</SignalChip>
        </div>
        <div style={{ padding: 18, display: "grid", gap: 14 }}>
          <Surface style={{ padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.018)", boxShadow: "none" }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <MonoLine color={t.text}>□ prototype running on laptop</MonoLine>
                <SignalChip tone="amber">pending provenance</SignalChip>
              </div>
              <div
                style={{
                  height: 170,
                  borderRadius: 16,
                  border: `1px solid ${t.line}`,
                  background:
                    "linear-gradient(135deg, rgba(94,167,255,0.12), rgba(255,255,255,0.02)), rgba(255,255,255,0.03)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <MonoLine color={t.soft}>photo field / source attached / timestamped</MonoLine>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <SignalChip tone="neutral">shape: reality</SignalChip>
                <SignalChip tone="neutral">trust: L1</SignalChip>
                <SignalChip tone="neutral">depth: 1</SignalChip>
              </div>
            </div>
          </Surface>
          <div style={{ display: "grid", gap: 10 }}>
            <MonoLine color={t.soft}>The phone adds a reality block into a live box.</MonoLine>
            <MonoLine color={t.muted}>Provenance attaches now. Reclassification can happen after capture, not before it.</MonoLine>
          </div>
        </div>
      </div>
    </Surface>
  );
}

function DesktopWorkbench() {
  return (
    <Surface style={{ padding: 20, overflow: "hidden" }}>
      <div className="desktop-workbench">
        <div className="workbench-pane">
          <Kicker>reality</Kicker>
          <div style={{ display: "grid", gap: 12 }}>
            <Surface style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
              <div style={{ display: "grid", gap: 8 }}>
                <MonoLine color={t.text}>□ photo: prototype running</MonoLine>
                <MonoLine color={t.soft}>Trust L1 → L2 after provenance.</MonoLine>
                <SignalChip tone="green">addresses: prototype</SignalChip>
              </div>
            </Surface>
            <Surface style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
              <div style={{ display: "grid", gap: 8 }}>
                <MonoLine color={t.text}>□ email: Melih available Friday</MonoLine>
                <MonoLine color={t.soft}>Source chain attached. Trust L2.</MonoLine>
                <SignalChip tone="green">addresses: Melih / Friday</SignalChip>
              </div>
            </Surface>
          </div>
        </div>
        <div className="workbench-pane workbench-center">
          <Kicker>Weld / Operate</Kicker>
          <Surface style={{ padding: 18, borderRadius: 20, background: "rgba(94,167,255,0.06)", boxShadow: "none" }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <MonoLine color={t.text}>œ diagnostic evaluation</MonoLine>
                <SignalChip tone="amber">convergence 0.67</SignalChip>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <MonoLine color={t.soft}>Resolved: prototype exists / Melih available.</MonoLine>
                <MonoLine color={t.soft}>Unresolved: the act of shipping has not occurred yet.</MonoLine>
                <MonoLine color={t.muted}>Seven reads and recommends. It does not mutate the box.</MonoLine>
              </div>
            </div>
          </Surface>
          <Surface style={{ padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
            <div style={{ display: "grid", gap: 10 }}>
              <MonoLine color={t.text}>Weld candidate</MonoLine>
              <MonoLine color={t.soft}>Aim met reality. Prototype shipped before Friday deadline.</MonoLine>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <SignalChip tone="green">valid weld</SignalChip>
                <SignalChip tone="green">depth 3</SignalChip>
                <SignalChip tone="amber">user confirms addition</SignalChip>
              </div>
            </div>
          </Surface>
        </div>
        <div className="workbench-pane">
          <Kicker>Seal</Kicker>
          <Surface style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
            <div style={{ display: "grid", gap: 10 }}>
              <MonoLine color={t.text}>seal preflight</MonoLine>
              <div style={{ display: "grid", gap: 6 }}>
                <MonoLine color={t.soft}>✓ weld exists</MonoLine>
                <MonoLine color={t.soft}>✓ convergence ≥ 0.7</MonoLine>
                <MonoLine color={t.soft}>✓ trust ≥ L2</MonoLine>
                <MonoLine color={t.soft}>✓ depth ≥ 3</MonoLine>
              </div>
            </div>
          </Surface>
          <Surface style={{ padding: 16, borderRadius: 18, background: "rgba(103,208,126,0.07)", boxShadow: "none" }}>
            <div style={{ display: "grid", gap: 10 }}>
              <MonoLine color={t.text}>𒐛 receipt</MonoLine>
              <MonoLine color={t.soft}>Promise fulfilled. Evidence chain preserved. Portable proof emitted.</MonoLine>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <SignalChip tone="green">sealed</SignalChip>
                <SignalChip tone="green">append-only</SignalChip>
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </Surface>
  );
}

export default function LoegosFormalCoreProposalV20() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(94,167,255,0.09), transparent 32%), radial-gradient(circle at bottom right, rgba(103,208,126,0.05), transparent 28%), #0b0c0f",
        color: t.text,
        fontFamily: t.sans,
      }}
    >
      <style>{`
        .formal-shell {
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 24px 72px;
          display: grid;
          gap: 28px;
        }
        .hero-grid,
        .grammar-grid,
        .state-grid,
        .contract-grid,
        .worked-grid {
          display: grid;
          gap: 18px;
        }
        .hero-grid {
          grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
          align-items: stretch;
        }
        .grammar-grid {
          grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
        }
        .shape-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }
        .state-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .hex-grid,
        .posture-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }
        .contract-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .worked-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .desktop-workbench {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: 16px;
        }
        .workbench-pane {
          display: grid;
          gap: 14px;
          align-content: start;
        }
        .word-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        @media (max-width: 1120px) {
          .shape-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .desktop-workbench,
          .hero-grid,
          .grammar-grid,
          .hex-grid,
          .posture-grid,
          .contract-grid,
          .worked-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @media (max-width: 760px) {
          .formal-shell {
            padding: 18px 14px 56px;
            gap: 20px;
          }
          .shape-grid,
          .state-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .word-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
      <div className="formal-shell">
        <Surface style={{ padding: 28, overflow: "hidden" }}>
          <div className="hero-grid">
            <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: t.mono,
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    color: t.text,
                  }}
                >
                  LŒGOS FORMAL-CORE PROPOSAL v2.0
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 10, color: t.muted }}>
                  standalone jsx / runtime design board
                </span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(34px, 5vw, 72px)",
                    lineHeight: 0.92,
                    letterSpacing: "-0.07em",
                    fontWeight: 730,
                    color: t.text,
                  }}
                >
                  Lœgos compiles coordination into accountable state.
                </h1>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(24px, 3vw, 40px)",
                    lineHeight: 1.02,
                    letterSpacing: "-0.05em",
                    fontWeight: 650,
                    color: t.soft,
                  }}
                >
                  Navigate by shape. Act by verb.
                </h1>
              </div>
              <p
                style={{
                  margin: 0,
                  maxWidth: 780,
                  fontFamily: t.sans,
                  fontSize: 17,
                  lineHeight: 1.72,
                  color: t.soft,
                }}
              >
                This proposal upgrades the earlier system from navigation language to runtime language.
                The interface now has to expose formal state: type, signal, depth, trust, convergence,
                settlement, and consent. Shapes are typed nouns. Verbs are the toolsets inside them.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <SignalChip tone="blue">type</SignalChip>
                <SignalChip tone="neutral">signal</SignalChip>
                <SignalChip tone="neutral">depth</SignalChip>
                <SignalChip tone="neutral">trust</SignalChip>
                <SignalChip tone="amber">convergence</SignalChip>
                <SignalChip tone="green">settlement</SignalChip>
                <SignalChip tone="neutral">consent</SignalChip>
              </div>
            </div>
            <Surface style={{ padding: 22, alignSelf: "stretch", boxShadow: "none" }}>
              <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
                <Kicker>formal claims</Kicker>
                <div style={{ display: "grid", gap: 12 }}>
                  <MonoLine color={t.text}>Shapes are type labels, not decoration.</MonoLine>
                  <MonoLine color={t.text}>Seven is diagnostic-only and never mutates without consent.</MonoLine>
                  <MonoLine color={t.text}>Seal is proof. Seven is not Seal.</MonoLine>
                  <MonoLine color={t.text}>The hex is derived settlement, never manually set.</MonoLine>
                  <MonoLine color={t.text}>Block depth is 1-4. Settlement stage is 0-7.</MonoLine>
                </div>
              </div>
            </Surface>
          </div>
        </Surface>

        <Section
          kicker="1. grammar board"
          title="Program -> Box -> Card -> Block -> Word"
          intro="The runtime is hierarchical. The UI should show the levels clearly enough that users feel they are working inside a typed program, not a loose stack of documents."
        >
          <div className="grammar-grid">
            <Surface style={{ padding: 24 }}>
              <div style={{ display: "grid", gap: 18 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {["Program", "Box", "Card", "Block", "Word"].map((node, index) => (
                    <React.Fragment key={node}>
                      <div
                        style={{
                          padding: "14px 16px",
                          borderRadius: 18,
                          border: `1px solid ${t.line}`,
                          background: index === 1 ? t.blueDim : "rgba(255,255,255,0.02)",
                          fontFamily: t.mono,
                          fontSize: 12,
                          color: index === 1 ? t.blue : t.text,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {node}
                      </div>
                      {index < 4 ? <MonoLine color={t.muted}>-&gt;</MonoLine> : null}
                    </React.Fragment>
                  ))}
                </div>
                <Surface style={{ padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
                  <div style={{ display: "grid", gap: 12 }}>
                    <Kicker>operator sentence</Kicker>
                    <div className="word-grid">
                      {operatorSentence.map((item) => (
                        <WordChip key={`${item.word}-${item.position}`} item={item} />
                      ))}
                    </div>
                  </div>
                </Surface>
              </div>
            </Surface>
            <Surface style={{ padding: 24 }}>
              <div style={{ display: "grid", gap: 14 }}>
                <Kicker>formal dimensions</Kicker>
                <div style={{ display: "grid", gap: 10 }}>
                  <MonoLine color={t.text}>shape: △ / □ / œ / 𒐛</MonoLine>
                  <MonoLine color={t.text}>signal: neutral / amber / green / red</MonoLine>
                  <MonoLine color={t.text}>position: detect → compare → adapt → amplify → maintain → prepare → arrive</MonoLine>
                  <MonoLine color={t.text}>trust: L1 → L2 → L3</MonoLine>
                  <MonoLine color={t.text}>depth: 1 → 2 → 3 → 4</MonoLine>
                </div>
                <Surface style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
                  <MonoLine color={t.soft}>Sentence length stays within 7 +/- 2.</MonoLine>
                  <MonoLine color={t.soft}>Aim and grounding must both appear.</MonoLine>
                  <MonoLine color={t.muted}>Words are typed, signals evolve, and convergence is computed from current state.</MonoLine>
                </Surface>
              </div>
            </Surface>
          </div>
        </Section>

        <Section
          kicker="2. shape rooms"
          title="Typed rooms with local toolsets"
          intro="The navigation argument resolves cleanly here: shapes are the nouns, verbs are the tools on the wall once the user enters the room."
        >
          <div className="shape-grid">
            {Object.keys(shapeSpec).map((shapeKey) => (
              <RoomCard key={shapeKey} shapeKey={shapeKey} />
            ))}
          </div>
        </Section>

        <Section
          kicker="3. state axes"
          title="Signal, trust, and depth are separate"
          intro="These dimensions should never be blended into one ambiguous confidence badge. Signal tells urgency or contradiction. Trust tells provenance. Depth tells earned assembly history."
        >
          <div className="state-grid">
            <AxisCard
              title="Signal"
              kicker="monotonically informative"
              items={signalStates}
              renderItem={(item) => (
                <Surface key={item.label} style={{ padding: 14, borderRadius: 18, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <SignalChip tone={item.tone}>{item.label}</SignalChip>
                    <MonoLine color={t.soft}>{item.meaning}</MonoLine>
                    <MonoLine color={t.muted}>{item.transition}</MonoLine>
                  </div>
                </Surface>
              )}
              footer="A signal can change direction. It cannot return to unknown."
            />
            <AxisCard
              title="Trust"
              kicker="provenance ladder"
              items={trustLevels}
              renderItem={(item) => (
                <Surface key={item.label} style={{ padding: 14, borderRadius: 18, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <SignalChip tone={item.tone}>{item.label} / {item.title}</SignalChip>
                    <MonoLine color={t.soft}>{item.rule}</MonoLine>
                  </div>
                </Surface>
              )}
              footer="L3 blocks can anchor seals with lower convergence than weakly sourced blocks."
            />
            <AxisCard
              title="Depth"
              kicker="earned history"
              items={depthLevels}
              renderItem={(item) => (
                <Surface key={item.level} style={{ padding: 14, borderRadius: 18, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <SignalChip tone={item.tone}>{item.level} / {item.title}</SignalChip>
                    <MonoLine color={t.soft}>{item.rule}</MonoLine>
                  </div>
                </Surface>
              )}
              footer="Block depth is 1-4 only. Settlement stage is separate and box-level."
            />
          </div>
        </Section>

        <Section
          kicker="4. hex settlement inspector"
          title="Flat-top hex. Six edges plus center."
          intro="The hex is not a logo flourish. It is a computed inspection surface for the box. Edges carry aspect state. The center glyph shows the dominant phase. Stage 7 is earned only when the whole structure settles."
        >
          <div className="hex-grid">
            <Surface style={{ padding: 24 }}>
              <HexInspector />
            </Surface>
            <Surface style={{ padding: 24 }}>
              <div style={{ display: "grid", gap: 16 }}>
                <Kicker>stage mapping</Kicker>
                <div style={{ display: "grid", gap: 10 }}>
                  <MonoLine color={t.text}>0 green edges = stage 0</MonoLine>
                  <MonoLine color={t.text}>1-2 green edges = stages 1-2</MonoLine>
                  <MonoLine color={t.text}>3-4 green edges = stages 3-4</MonoLine>
                  <MonoLine color={t.text}>5 green edges = stages 5-6</MonoLine>
                  <MonoLine color={t.text}>6 green edges + valid seals = stage 7</MonoLine>
                </div>
                <Surface style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
                  <MonoLine color={t.soft}>Hex state is always derived from current box state.</MonoLine>
                  <MonoLine color={t.soft}>It updates after every add, signal change, or seal operation.</MonoLine>
                  <MonoLine color={t.muted}>No user or agent sets the hex directly.</MonoLine>
                </Surface>
              </div>
            </Surface>
          </div>
        </Section>

        <Section
          kicker="5. consent and runtime contract"
          title="The user commits. The system computes."
          intro="This is where the product becomes trustworthy. Content changes require consent. Structural computation runs automatically. The box is append-only even when interpretation evolves."
        >
          <div className="contract-grid">
            <Surface style={{ padding: 24 }}>
              <div style={{ display: "grid", gap: 16 }}>
                <Kicker>requires user consent</Kicker>
                <div style={{ display: "grid", gap: 10 }}>
                  {consentRules.consent.map((item) => (
                    <MonoLine key={item} color={t.text}>
                      {item}
                    </MonoLine>
                  ))}
                </div>
              </div>
            </Surface>
            <Surface style={{ padding: 24 }}>
              <div style={{ display: "grid", gap: 16 }}>
                <Kicker>automatic system computation</Kicker>
                <div style={{ display: "grid", gap: 10 }}>
                  {consentRules.automatic.map((item) => (
                    <MonoLine key={item} color={t.text}>
                      {item}
                    </MonoLine>
                  ))}
                </div>
              </div>
            </Surface>
          </div>
          <Surface style={{ padding: 22 }}>
            <div className="worked-grid">
              <Surface style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
                <MonoLine color={t.text}>append-only log</MonoLine>
                <MonoLine color={t.soft}>Blocks can be flagged, recast, or signal-changed, but never deleted.</MonoLine>
              </Surface>
              <Surface style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.016)", boxShadow: "none" }}>
                <MonoLine color={t.text}>seal permanence</MonoLine>
                <MonoLine color={t.soft}>A sealed block can be flagged for re-evaluation, but the seal itself remains in the record.</MonoLine>
              </Surface>
            </div>
          </Surface>
        </Section>

        <Section
          kicker="6. mobile and desktop postures"
          title="One box, two postures"
          intro="Mobile is Reality-first because life happens in motion. Desktop is Weld-and-Seal-heavy because assembly and proof need width, comparison, and explicit preflight."
        >
          <div className="posture-grid">
            <div style={{ display: "grid", gap: 16 }}>
              <Kicker>mobile reality capture</Kicker>
              <MobileRealityFrame />
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <Kicker>desktop weld / operate / seal</Kicker>
              <DesktopWorkbench />
            </div>
          </div>
        </Section>

        <Section
          kicker="7. worked example"
          title="Seed to sealed receipt, then back into life"
          intro="The loop is not a wizard. The box can complete a macro-promise while a new micro-aim opens. That is the core behavior this proposal needs to make visually obvious."
        >
          <div className="worked-grid">
            {workedFlow.map((item) => (
              <TimelineCard key={item.step} item={item} />
            ))}
          </div>
        </Section>

        <Surface style={{ padding: 24 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <Kicker>closing rule</Kicker>
            <div
              style={{
                fontFamily: t.sans,
                fontSize: "clamp(22px, 3vw, 34px)",
                fontWeight: 640,
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                color: t.text,
              }}
            >
              Shapes are nouns. Verbs are toolsets. Seven diagnoses. Seal commits. The hex reports settlement.
            </div>
            <MonoLine color={t.muted}>
              The final UI should feel less like a dashboard and more like a live compiler for accountable state.
            </MonoLine>
          </div>
        </Surface>
      </div>
    </div>
  );
}
