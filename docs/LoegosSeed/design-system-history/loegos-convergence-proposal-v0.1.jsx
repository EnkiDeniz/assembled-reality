import React from "react";
import {
  Blocks,
  Camera,
  CheckCircle2,
  Circle,
  MoveRight,
  NotebookPen,
  PanelLeft,
  ReceiptText,
  Sparkles,
  Target,
  TriangleAlert,
  Workflow,
} from "lucide-react";

const t = {
  ground: "#0c0d10",
  shell: "#121315",
  s2: "#17181d",
  s3: "#1d1f24",
  s4: "#252932",
  white: "#f3f5f7",
  sec: "rgba(255,255,255,0.72)",
  muted: "rgba(255,255,255,0.45)",
  ghost: "rgba(255,255,255,0.24)",
  blue: "#5ea7ff",
  blueSoft: "rgba(94,167,255,0.14)",
  blueDim: "rgba(94,167,255,0.08)",
  green: "#7fd9a0",
  greenDim: "rgba(127,217,160,0.1)",
  amber: "#f0bf69",
  amberDim: "rgba(240,191,105,0.1)",
  red: "#ff7f7f",
  redDim: "rgba(255,127,127,0.1)",
  neutral: "#8f93a1",
  neutralDim: "rgba(143,147,161,0.08)",
  line: "rgba(255,255,255,0.08)",
  lineStrong: "rgba(255,255,255,0.12)",
  shadow: "0 32px 72px rgba(0,0,0,0.34)",
  mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace',
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
};

const shapes = {
  aim: {
    glyph: "△",
    label: "Aim",
    desc: "What was intended, promised, or declared.",
    prompt: "What are you promising?",
  },
  reality: {
    glyph: "□",
    label: "Reality",
    desc: "What pushed back with evidence, constraint, or measurement.",
    prompt: "What evidence exists?",
  },
  weld: {
    glyph: "œ",
    label: "Weld",
    desc: "Where aim and reality meet and return a signal.",
    prompt: "What converged?",
  },
  seal: {
    glyph: "𒐛",
    label: "Seal",
    desc: "What survived contact and can now travel as proof.",
    prompt: "What can be sealed?",
  },
};

const navPhases = [
  {
    id: "capture",
    label: "Capture",
    cue: "see -> capture -> file",
    body:
      "The user starts in life, not in the workspace. Mobile should let them catch signal before the moment disappears.",
    icon: Camera,
  },
  {
    id: "think",
    label: "Think",
    cue: "read -> listen -> select",
    body:
      "The active source owns the screen. The shell gets quieter so the user can understand the material.",
    icon: PanelLeft,
  },
  {
    id: "create",
    label: "Create",
    cue: "stage -> rewrite -> compare",
    body:
      "The seed becomes the working object. Inputs, staging, and edits all serve that one thing.",
    icon: NotebookPen,
  },
  {
    id: "operate",
    label: "Operate",
    cue: "run -> diagnose -> decide",
    body:
      "Operate should feel singular and conclusive. It is not chat and not another panel of speculation.",
    icon: Sparkles,
  },
  {
    id: "proof",
    label: "Proof",
    cue: "receipt -> witness -> seal",
    body:
      "Receipts are where return, witness, and portability become visible. Proof is a different posture from editing.",
    icon: ReceiptText,
  },
];

const mergeRules = [
  {
    title: "Primary navigation = verbs",
    body:
      "Users move through Capture, Think, Create, Operate, and Proof. These are the natural steps of the tool.",
  },
  {
    title: "Secondary grammar = shapes",
    body:
      "Aim, Reality, Weld, and Seal classify the kind of material in front of the user. They annotate the work rather than replacing the workflow.",
  },
  {
    title: "Orthogonal urgency = signals",
    body:
      "Blue stays brand and action. Green, amber, red, and neutral communicate urgency and status without hijacking identity.",
  },
];

const signalRows = [
  { label: "Clear", status: "green", note: "can proceed" },
  { label: "Active", status: "amber", note: "needs attention" },
  { label: "Act now", status: "red", note: "blocked or urgent" },
  { label: "Waiting", status: "neutral", note: "no strong claim yet" },
];

const blockExamples = [
  {
    shape: "aim",
    title: "Open a sourdough bakery in Cobble Hill by Q1.",
    note: "Issues the invoice.",
    tone: "blue",
    depth: 1,
  },
  {
    shape: "reality",
    title: "Lease research for 3 locations. Cost estimate verified.",
    note: "Material with provenance.",
    tone: "green",
    depth: 2,
  },
  {
    shape: "weld",
    title: "Funding gap remains $40K. Next move: lender shortlist.",
    note: "Diagnosis turned into a move.",
    tone: "amber",
    depth: 3,
  },
  {
    shape: "seal",
    title: "Startup cost estimate verified. Receipt sealed Mar 8.",
    note: "Portable proof.",
    tone: "green",
    depth: 4,
  },
];

const objectStates = [
  { label: "Declared", receipts: "0 receipts", fill: 0.22, tone: "neutral", color: "linear-gradient(180deg, rgba(94,167,255,0.42), rgba(94,167,255,0.12))" },
  { label: "Grounded", receipts: "3 receipts", fill: 0.62, tone: "amber", color: "linear-gradient(180deg, rgba(94,167,255,0.52), rgba(94,167,255,0.18))" },
  { label: "Sealed", receipts: "14 receipts", fill: 1, tone: "green", color: "linear-gradient(180deg, rgba(127,217,160,0.58), rgba(94,167,255,0.2))" },
];

const mobilePosture = [
  "capture first, classify second",
  "quick seed glance",
  "one-thumb add to box",
  "same shape and signal language",
];

const desktopPosture = [
  "compare source against seed",
  "use operator blocks as working units",
  "run Operate as a single decisive read",
  "inspect receipts with provenance detail",
];

const sourceRows = [
  { title: "Roadside storefront photo", meta: "captured on phone · image source", tone: "neutral", chip: "Open" },
  { title: "Voice memo from the car", meta: "speak note · audio source", tone: "amber", chip: "Queued" },
  { title: "Operator Sentences", meta: "95 blocks · text source", tone: "green", chip: "Verified" },
  { title: "Seed of seeds", meta: "working seed · current box", tone: "blue", chip: "Active" },
];

function toneStyle(tone) {
  if (tone === "green") {
    return { color: t.green, bg: t.greenDim, border: "rgba(127,217,160,0.24)" };
  }
  if (tone === "amber") {
    return { color: t.amber, bg: t.amberDim, border: "rgba(240,191,105,0.24)" };
  }
  if (tone === "red") {
    return { color: t.red, bg: t.redDim, border: "rgba(255,127,127,0.24)" };
  }
  if (tone === "blue") {
    return { color: "#8abfff", bg: t.blueSoft, border: "rgba(94,167,255,0.26)" };
  }
  return { color: t.sec, bg: t.neutralDim, border: "rgba(255,255,255,0.08)" };
}

function Kicker({ children, style }) {
  return (
    <span
      style={{
        fontFamily: t.mono,
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: t.muted,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function SignalChip({ tone, children }) {
  const c = toneStyle(tone);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.color,
        fontFamily: t.mono,
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ShapeBadge({ shape, active }) {
  const s = shapes[shape];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 34,
        padding: "0 12px",
        borderRadius: 999,
        border: `1px solid ${active ? "rgba(94,167,255,0.24)" : t.line}`,
        background: active ? t.blueDim : "rgba(255,255,255,0.03)",
        color: active ? t.blue : t.sec,
        fontFamily: t.mono,
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1, fontWeight: shape === "weld" ? 700 : 400 }}>{s.glyph}</span>
      {s.label}
    </div>
  );
}

function SignalDot({ status, size = 8 }) {
  const c = toneStyle(status);
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        display: "inline-block",
        background: c.color,
        flexShrink: 0,
      }}
    />
  );
}

function DepthStack({ depth = 0, size = 22 }) {
  const colors = [t.neutral, t.amber, t.blue, t.green];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, width: size, alignItems: "center", flexShrink: 0 }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: size - (3 - i) * 4,
            height: 2,
            borderRadius: 1,
            background: i < depth ? colors[i] : t.line,
          }}
        />
      ))}
    </div>
  );
}

function ConvergenceBar({ percent = 0, width = 140 }) {
  const left = (width / 2) * (percent / 100);
  const welded = percent >= 90;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontFamily: t.mono, fontSize: 10, color: t.muted }}>△</span>
      <div
        style={{
          width,
          height: 4,
          position: "relative",
          overflow: "hidden",
          borderRadius: 2,
          background: t.line,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: left,
            height: "100%",
            background: t.blue,
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: left,
            height: "100%",
            background: t.green,
            borderRadius: "0 2px 2px 0",
          }}
        />
        {welded ? (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 8,
              height: 8,
              borderRadius: 999,
              background: t.amber,
              boxShadow: `0 0 8px ${t.amber}40`,
            }}
          />
        ) : null}
      </div>
      <span style={{ fontFamily: t.mono, fontSize: 10, color: t.muted }}>□</span>
      {welded ? (
        <span style={{ fontSize: 13, color: t.amber, fontWeight: 700, lineHeight: 1 }}>œ</span>
      ) : null}
    </div>
  );
}

function ObjectGlyph({ fill, color }) {
  return (
    <div className="convergence-object-shape">
      <div
        className="convergence-object-fill"
        style={{
          transform: `scaleX(${fill})`,
          background: color,
        }}
      />
      <div className="convergence-object-core" />
    </div>
  );
}

function SectionHeader({ eyebrow, title, body }) {
  return (
    <div style={{ maxWidth: 780, marginBottom: 18 }}>
      <Kicker>{eyebrow}</Kicker>
      <h2
        style={{
          margin: "8px 0 0",
          fontSize: "clamp(28px, 2.8vw, 46px)",
          lineHeight: 0.98,
          letterSpacing: "-0.045em",
          fontWeight: 620,
        }}
      >
        {title}
      </h2>
      {body ? (
        <p
          style={{
            margin: "12px 0 0",
            color: t.sec,
            fontSize: 15,
            lineHeight: 1.62,
          }}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}

function Surface({ children, style }) {
  return (
    <div
      style={{
        border: `1px solid ${t.line}`,
        borderRadius: 24,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.025), transparent 24%), rgba(255,255,255,0.02)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function LoegosConvergenceProposalV01() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 28,
        background:
          "radial-gradient(circle at top left, rgba(94,167,255,0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(127,217,160,0.06), transparent 24%), linear-gradient(180deg, #0c0d10 0%, #0a0b0d 100%)",
        color: t.white,
        fontFamily: t.sans,
      }}
    >
      <style>{`
        .convergence-shell {
          width: min(1460px, 100%);
          margin: 0 auto;
          padding: 30px;
          border: 1px solid ${t.line};
          border-radius: 34px;
          background: linear-gradient(180deg, rgba(255,255,255,0.024), transparent 20%), ${t.shell};
          box-shadow: ${t.shadow};
        }

        .convergence-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.78fr);
          gap: 20px;
          margin-top: 28px;
        }

        .convergence-grid-3,
        .convergence-grid-4,
        .convergence-grid-5,
        .convergence-grid-foundation {
          display: grid;
          gap: 16px;
        }

        .convergence-grid-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .convergence-grid-4 {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .convergence-grid-5 {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        .convergence-grid-foundation {
          grid-template-columns: 1.1fr 0.95fr 0.95fr;
        }

        .convergence-object-shape {
          position: relative;
          width: 86px;
          aspect-ratio: 1;
          clip-path: polygon(50% 0, 88% 18%, 100% 62%, 72% 100%, 28% 100%, 0 55%, 12% 18%);
          background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)), rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.14);
          overflow: hidden;
        }

        .convergence-object-shape::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 16px 16px;
          opacity: 0.28;
        }

        .convergence-object-fill {
          position: absolute;
          inset: 0 auto 0 0;
          width: 100%;
          transform-origin: left center;
          box-shadow: inset 0 0 22px rgba(94,167,255,0.18);
        }

        .convergence-object-core {
          position: absolute;
          inset: 16px;
          clip-path: polygon(50% 0, 90% 20%, 100% 66%, 74% 100%, 26% 100%, 0 58%, 10% 20%);
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(7,10,14,0.4);
        }

        .convergence-poster {
          position: relative;
          overflow: hidden;
          min-height: 640px;
          padding: 22px;
          background:
            linear-gradient(135deg, rgba(5,8,12,0.88), rgba(18,23,28,0.98)),
            linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .convergence-poster::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(180deg, rgba(0,0,0,0.34), transparent 92%);
          pointer-events: none;
        }

        .convergence-poster-body {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 0.88fr);
          gap: 24px;
          min-height: calc(100% - 28px);
          padding-top: 92px;
        }

        .convergence-stack {
          display: grid;
          gap: 16px;
        }

        @media (max-width: 1180px) {
          .convergence-hero,
          .convergence-grid-3,
          .convergence-grid-4,
          .convergence-grid-5,
          .convergence-grid-foundation,
          .convergence-poster-body {
            grid-template-columns: 1fr;
          }

          .convergence-poster {
            min-height: auto;
          }
        }

        @media (max-width: 780px) {
          .convergence-shell {
            padding: 20px;
            border-radius: 24px;
          }
        }
      `}</style>

      <div className="convergence-shell">
        <header
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            gap: 24,
            paddingBottom: 22,
            borderBottom: `1px solid ${t.line}`,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 860 }}>
            <Kicker>Convergence proposal v0.1</Kicker>
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: "clamp(40px, 4.4vw, 76px)",
                lineHeight: 0.92,
                letterSpacing: "-0.055em",
                fontWeight: 620,
              }}
            >
              Verbs navigate.
              <br />
              Shapes annotate.
            </h1>
            <p
              style={{
                margin: "14px 0 0",
                color: t.sec,
                fontSize: 16,
                lineHeight: 1.65,
                maxWidth: 860,
              }}
            >
              Best-of-both proposal: keep the symbolic rigor of Aim, Reality, Weld, and Seal, but
              let the user move through the real loop of Capture, Think, Create, Operate, and
              Proof. Capture first. Classify second. Assemble across phone and desktop as one box.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <SignalChip tone="blue">brand = blue</SignalChip>
            <SignalChip tone="green">signals = orthogonal</SignalChip>
            <SignalChip tone="amber">workflow = primary</SignalChip>
          </div>
        </header>

        <section className="convergence-hero">
          <Surface className="convergence-poster" style={{ padding: 22 }}>
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Kicker>Loegos</Kicker>
              <Kicker>one box across devices</Kicker>
              <Kicker>navigation + system</Kicker>
            </div>

            <div className="convergence-poster-body">
              <div style={{ alignSelf: "end", maxWidth: 620 }}>
                <Kicker>Convergence thesis</Kicker>
                <h2
                  style={{
                    margin: "10px 0 0",
                    fontSize: "clamp(42px, 5vw, 84px)",
                    lineHeight: 0.92,
                    letterSpacing: "-0.06em",
                    fontWeight: 620,
                  }}
                >
                  One object.
                  <br />
                  Two grammars.
                </h2>
                <p
                  style={{
                    margin: "14px 0 0",
                    color: t.sec,
                    fontSize: 16,
                    lineHeight: 1.68,
                    maxWidth: 560,
                  }}
                >
                  The user should move by verb and understand by shape. That gives Loegos a system
                  that is both philosophically distinctive and practically navigable.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
                  {["capture first", "seed as object", "shapes classify", "settlement earns proof"].map((item) => (
                    <span
                      key={item}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.04)",
                        color: t.sec,
                        fontSize: 13,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="convergence-stack">
                <Kicker>Object states</Kicker>
                {objectStates.map((state) => (
                  <Surface
                    key={state.label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0, 1fr)",
                      gap: 14,
                      alignItems: "center",
                      padding: 14,
                    }}
                  >
                    <div style={{ width: 108, display: "flex", justifyContent: "center" }}>
                      <ObjectGlyph fill={state.fill} color={state.color} />
                    </div>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <Kicker>{state.label}</Kicker>
                        <SignalChip tone={state.tone}>{state.receipts}</SignalChip>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <ConvergenceBar percent={state.fill * 100} width={150} />
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            </div>
          </Surface>

          <div className="convergence-stack">
            {mergeRules.map((rule) => (
              <Surface key={rule.title} style={{ padding: 18 }}>
                <Kicker>Merge rule</Kicker>
                <h3 style={{ margin: "8px 0 0", fontSize: 20, lineHeight: 1.15 }}>{rule.title}</h3>
                <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 15, lineHeight: 1.62 }}>{rule.body}</p>
              </Surface>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Primary workflow"
            title="The user moves through the assembler as a natural tool"
            body="These verbs are the top-level navigation because they match the user's real sequence in life and in work."
          />
          <div className="convergence-grid-5">
            {navPhases.map(({ id, label, cue, body, icon: Icon }) => (
              <Surface key={id} style={{ padding: 18, minHeight: 220 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    border: `1px solid ${t.line}`,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <Icon size={17} />
                </div>
                <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>{label}</h3>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    color: "#8abfff",
                    fontFamily: t.mono,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {cue}
                </span>
                <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>{body}</p>
              </Surface>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Secondary shape grammar"
            title="The four-shape language survives as semantic indexing"
            body="Shapes stay visible and powerful, but they stop doing the whole job of navigation by themselves."
          />
          <div className="convergence-grid-4">
            {Object.entries(shapes).map(([key, s]) => (
              <Surface key={key} style={{ padding: 18, minHeight: 220 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 22,
                      lineHeight: 1,
                      color: key === "seal" ? t.amber : t.blue,
                      fontWeight: key === "weld" ? 700 : 400,
                    }}
                  >
                    {s.glyph}
                  </span>
                  <Kicker>{s.label}</Kicker>
                </div>
                <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 15, lineHeight: 1.6 }}>{s.desc}</p>
                <div style={{ marginTop: 14 }}>
                  <SignalChip tone={key === "seal" ? "green" : key === "weld" ? "amber" : "blue"}>
                    {s.prompt}
                  </SignalChip>
                </div>
              </Surface>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Shared primitives"
            title="The best reusable pieces should survive the merge"
            body="This is where the symbolic system gets useful: blocks, depth, convergence, and proof all become legible without overexplaining."
          />
          <div className="convergence-grid-4">
            {blockExamples.map((item) => (
              <Surface key={item.title} style={{ padding: 18, minHeight: 220, borderColor: toneStyle(item.tone).border }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 18,
                      lineHeight: 1,
                      color: item.tone === "green" ? t.green : item.tone === "amber" ? t.amber : t.blue,
                      fontWeight: item.shape === "weld" ? 700 : 400,
                    }}
                  >
                    {shapes[item.shape].glyph}
                  </span>
                  <Kicker>{shapes[item.shape].label}</Kicker>
                </div>
                <strong style={{ display: "block", marginTop: 12, fontSize: 18, lineHeight: 1.28 }}>{item.title}</strong>
                <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>{item.note}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14 }}>
                  <DepthStack depth={item.depth} size={18} />
                  <SignalChip tone={item.tone}>{shapes[item.shape].label}</SignalChip>
                </div>
              </Surface>
            ))}
          </div>

          <Surface style={{ padding: 18, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <Kicker>Convergence primitive</Kicker>
              <Workflow size={16} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 16, alignItems: "center" }}>
              {[20, 50, 75, 92].map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, minWidth: 24 }}>{p}%</span>
                  <ConvergenceBar percent={p} width={150} />
                </div>
              ))}
            </div>
          </Surface>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Signals"
            title="Urgency stays orthogonal to shape and navigation"
            body="Blue is brand and action. Signal colors only say how urgent or settled something is."
          />
          <div className="convergence-grid-4">
            {signalRows.map((item) => (
              <Surface key={item.label} style={{ padding: 18, minHeight: 160 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <SignalDot status={item.status} />
                  <Kicker>{item.label}</Kicker>
                </div>
                <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 15, lineHeight: 1.6 }}>{item.note}</p>
              </Surface>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Cross-device posture"
            title="Equal quality on mobile and desktop means different strengths, not different products"
            body="The box should feel like one thing across devices. The posture changes with context, but the nouns and signals stay stable."
          />
          <div className="convergence-grid-3">
            <Surface style={{ padding: 18, minHeight: 240 }}>
              <Kicker>Phone</Kicker>
              <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>Field capture companion</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                {mobilePosture.map((item) => (
                  <SignalChip key={item} tone="blue">
                    {item}
                  </SignalChip>
                ))}
              </div>
              <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>
                The best mobile idea from the competing proposal survives here, but with one change:
                capture comes before classification. The user should not have to sort reality before
                they catch it.
              </p>
            </Surface>

            <Surface style={{ padding: 18, minHeight: 240 }}>
              <Kicker>Desktop</Kicker>
              <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>Deep assembly bench</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                {desktopPosture.map((item) => (
                  <SignalChip key={item} tone="amber">
                    {item}
                  </SignalChip>
                ))}
              </div>
              <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>
                Desktop gets density only where it helps the user compare, rewrite, operate, and
                inspect proof honestly.
              </p>
            </Surface>

            <Surface style={{ padding: 18, minHeight: 240 }}>
              <Kicker>Shared law</Kicker>
              <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>One box, one seed</h3>
              <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>
                The user should never feel that mobile and desktop are different products. Capture,
                seed, Operate, receipts, and the four-shape annotation model all belong to the same
                box.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <ShapeBadge shape="aim" />
                <ShapeBadge shape="reality" active />
                <ShapeBadge shape="weld" />
                <ShapeBadge shape="seal" />
              </div>
            </Surface>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Merged workspace"
            title="The shell should frame the object instead of turning into another dashboard"
            body="This composition keeps their symbolic structure, but it follows the user's actual loop and keeps the seed in the middle."
          />

          <Surface
            style={{
              padding: 16,
              borderRadius: 28,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.018), transparent 26%), rgba(0,0,0,0.18)",
            }}
          >
            <div
              className="convergence-grid-3"
              style={{ gridTemplateColumns: "minmax(230px,0.9fr) minmax(0,1.3fr) minmax(250px,0.82fr)" }}
            >
              <Surface style={{ padding: 18, minHeight: 460 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <Kicker>Think</Kicker>
                  <SignalChip tone="blue">Capture filed</SignalChip>
                </div>
                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                  {sourceRows.map((row) => (
                    <Surface key={row.title} style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <strong style={{ display: "block", fontSize: 16 }}>{row.title}</strong>
                          <p style={{ margin: "6px 0 0", color: t.sec, fontSize: 13, lineHeight: 1.5 }}>{row.meta}</p>
                        </div>
                        <SignalChip tone={row.tone}>{row.chip}</SignalChip>
                      </div>
                    </Surface>
                  ))}
                </div>
              </Surface>

              <Surface style={{ padding: 18, minHeight: 460 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <Kicker>Create</Kicker>
                    <h3 style={{ margin: "8px 0 0", fontSize: 20 }}>Current seed</h3>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <ShapeBadge shape="aim" />
                    <ShapeBadge shape="reality" active />
                    <ShapeBadge shape="weld" />
                  </div>
                </div>

                <Surface style={{ padding: 18, marginTop: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <Kicker>One object, multiple views</Kicker>
                    <SignalChip tone="amber">3 receipts sealed</SignalChip>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 300px" }}>
                      <h4 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>
                        Open a sourdough bakery in Cobble Hill by Q1.
                      </h4>
                      <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 15, lineHeight: 1.6 }}>
                        Lease research for three locations is sealed. Cost estimate verified.
                        Funding gap remains open. The next move is a lender shortlist.
                      </p>
                      <div style={{ marginTop: 14 }}>
                        <ConvergenceBar percent={92} width={190} />
                      </div>
                    </div>

                    <div style={{ width: 140, display: "flex", justifyContent: "center" }}>
                      <ObjectGlyph
                        fill={0.62}
                        color="linear-gradient(180deg, rgba(94,167,255,0.52), rgba(94,167,255,0.18))"
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
                    {blockExamples.slice(0, 3).map((item) => (
                      <div
                        key={item.title}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          minHeight: 34,
                          padding: "0 12px",
                          borderRadius: 999,
                          border: `1px solid ${toneStyle(item.tone).border}`,
                          background: toneStyle(item.tone).bg,
                          color: toneStyle(item.tone).color,
                          fontFamily: t.mono,
                          fontSize: 11,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        <span style={{ fontSize: 14, lineHeight: 1, fontWeight: item.shape === "weld" ? 700 : 400 }}>
                          {shapes[item.shape].glyph}
                        </span>
                        {shapes[item.shape].label}
                      </div>
                    ))}
                  </div>
                </Surface>
              </Surface>

              <div className="convergence-stack">
                <Surface style={{ padding: 18 }}>
                  <Kicker>Operate</Kicker>
                  <h4 style={{ margin: "8px 0 0", fontSize: 20 }}>Honest read</h4>
                  <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>
                    Show Aim, Ground, Bridge, convergence, and next move without turning it into
                    chat.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    <SignalChip tone="amber">Retry after cooldown</SignalChip>
                    <SignalChip tone="green">L3 trust</SignalChip>
                  </div>
                </Surface>

                <Surface style={{ padding: 18 }}>
                  <Kicker>Proof</Kicker>
                  <h4 style={{ margin: "8px 0 0", fontSize: 20 }}>Receipt ledger</h4>
                  <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>
                    Proof stays separate from editing. This is where settlement details expand.
                  </p>
                  <div style={{ display: "grid", gap: 12, marginTop: 14, color: t.sec, fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle2 size={15} color={t.green} />
                      Cost estimate sealed
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <TriangleAlert size={15} color={t.amber} />
                      Funding still open
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Circle size={15} color={t.muted} />
                      Permits unknown
                    </div>
                  </div>
                </Surface>
              </div>
            </div>
          </Surface>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Foundation tokens"
            title="Keep the clean token discipline from the competing system"
            body="This part should remain brutally simple: blue for brand and action, signal colors for urgency, graphite surfaces, mono for labels and proof metadata."
          />
          <div className="convergence-grid-foundation">
            <Surface style={{ padding: 18 }}>
              <Kicker>Brand vs signals</Kicker>
              <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                {[
                  ["Brand blue", t.blue, "identity, active states, primary actions"],
                  ["Signal green", t.green, "clear, sealed, released"],
                  ["Signal amber", t.amber, "active, committing, cooling down"],
                  ["Signal red", t.red, "blocked or urgent"],
                  ["Signal neutral", t.neutral, "waiting, open, unknown"],
                ].map(([label, color, note]) => (
                  <div
                    key={label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0, 1fr)",
                      gap: 12,
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${t.line}`,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        border: `1px solid ${t.line}`,
                        background: color,
                      }}
                    />
                    <div>
                      <strong style={{ display: "block", fontSize: 15, lineHeight: 1.2 }}>{label}</strong>
                      <p style={{ margin: "6px 0 0", color: t.sec, fontSize: 13, lineHeight: 1.5 }}>{note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface style={{ padding: 18 }}>
              <Kicker>Shape laws</Kicker>
              <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                {Object.entries(shapes).map(([key, s]) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${t.line}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        lineHeight: 1,
                        color: key === "seal" ? t.amber : t.blue,
                        fontWeight: key === "weld" ? 700 : 400,
                      }}
                    >
                      {s.glyph}
                    </span>
                    <div>
                      <strong style={{ display: "block", fontSize: 15 }}>{s.label}</strong>
                      <p style={{ margin: "6px 0 0", color: t.sec, fontSize: 13, lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface style={{ padding: 18 }}>
              <Kicker>Summary</Kicker>
              <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.62 }}>
                This merged direction is the clearest synthesis:
              </p>
              <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
                {[
                  "Keep the four-shape language as a semantic system.",
                  "Keep the clean blue-vs-signal token split.",
                  "Use verb-based navigation for the actual user path.",
                  "Make phone capture and desktop assembly one continuous box experience.",
                ].map((item) => (
                  <li key={item} style={{ position: "relative", paddingLeft: 16, color: t.sec, fontSize: 14, lineHeight: 1.55 }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 9,
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: t.blue,
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Surface>
          </div>
        </section>
      </div>
    </div>
  );
}
