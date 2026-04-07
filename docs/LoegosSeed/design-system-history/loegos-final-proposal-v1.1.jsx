import React from "react";
import {
  Camera,
  CheckCircle2,
  Circle,
  Layers3,
  MoveRight,
  NotebookPen,
  PanelLeft,
  ReceiptText,
  Send,
  Sparkles,
  Target,
  TriangleAlert,
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
  ghost: "rgba(255,255,255,0.22)",
  blue: "#5ea7ff",
  blueDim: "rgba(94,167,255,0.08)",
  blueSoft: "rgba(94,167,255,0.14)",
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

const shapes = [
  {
    id: "aim",
    glyph: "△",
    label: "Aim",
    thesis: "The declared object.",
    body:
      "Aim is where the box names what it is trying to make real. The seed lives here. The user sharpens intention before the system does anything else.",
    question: "What are we trying to make real?",
    verbs: ["declare", "name", "sharpen"],
    icon: Target,
    tone: "blue",
  },
  {
    id: "reality",
    glyph: "□",
    label: "Reality",
    thesis: "What the world gave back.",
    body:
      "Reality is where capture, import, listening, and evidence live. Mobile starts here because life starts here. Capture is the first move inside Reality, not a separate universe.",
    question: "What did the world actually give us?",
    verbs: ["capture", "listen", "inspect"],
    icon: Camera,
    tone: "green",
  },
  {
    id: "weld",
    glyph: "œ",
    label: "Weld",
    thesis: "Where shaping and reading meet.",
    body:
      "Weld is where the user stages, rewrites, compares, and runs Operate. Create and Operate are siblings here because both are acts of convergence.",
    question: "What holds enough to act on?",
    verbs: ["stage", "rewrite", "operate"],
    icon: Sparkles,
    tone: "amber",
  },
  {
    id: "seal",
    glyph: "𒐛",
    label: "Seal",
    thesis: "What survived and can travel.",
    body:
      "Seal is proof. Receipts, witness, and shareable evidence belong here. Seven is not Seal. Seven can help, but Seal is where portability is earned.",
    question: "What can now travel as proof?",
    verbs: ["review", "seal", "share"],
    icon: ReceiptText,
    tone: "green",
  },
];

const shapeRows = [
  {
    shape: "aim",
    title: "Open a sourdough bakery in Cobble Hill by Q1.",
    note: "Seed statement. Invoice issued.",
    depth: 1,
    tone: "blue",
  },
  {
    shape: "reality",
    title: "Roadside storefront photo. Voice memo from the car. Lease research attached.",
    note: "Capture and evidence.",
    depth: 2,
    tone: "green",
  },
  {
    shape: "weld",
    title: "Funding gap remains $40K. Next move: lender shortlist.",
    note: "Operate read turned into a move.",
    depth: 3,
    tone: "amber",
  },
  {
    shape: "seal",
    title: "Startup cost estimate verified. Receipt sealed Mar 8.",
    note: "Portable proof.",
    depth: 4,
    tone: "green",
  },
];

const signalSystem = [
  { label: "Clear", tone: "green", note: "ready to proceed" },
  { label: "Active", tone: "amber", note: "needs attention" },
  { label: "Act now", tone: "red", note: "blocked or urgent" },
  { label: "Waiting", tone: "neutral", note: "no strong claim yet" },
];

const geometryCompression = [
  {
    glyph: "△",
    label: "Triangle",
    title: "Direction and declaration",
    body:
      "Triangles point. They belong on seed markers, next moves, and places where the box needs a vector. They should stay light and directional, not become the default container shape.",
    tone: "blue",
  },
  {
    glyph: "□",
    label: "Square",
    title: "Field, frame, and test",
    body:
      "The screen is almost a square and so are cards, captures, and document frames. That is not incidental. Square is the default posture because reality arrives as something framed, constrained, and testable.",
    tone: "green",
  },
  {
    glyph: "œ",
    label: "Weld",
    title: "Join and convergence",
    body:
      "Weld is where two things meet and are made to answer each other. Comparison bars, operator blocks, stage rails, and operate surfaces should all feel like joint geometry, not independent cards.",
    tone: "amber",
  },
  {
    glyph: "⬡",
    label: "Seven-end",
    title: "Settled object geometry",
    body:
      "Hexagonal vessels are reserved for things that have crossed enough of the seven-stage gradient to travel: sealed receipts, converged objects, and portable proof. It is not a fifth phase. It is a settlement condition.",
    tone: "green",
  },
];

const gradientSteps = [
  "Detect",
  "Compare",
  "Adapt",
  "Amplify",
  "Maintain",
  "Prepare",
  "Arrive",
];

const phoneFlow = [
  {
    title: "Open Reality",
    note: "Phone lands on the live edge of the box, not a miniature dashboard.",
  },
  {
    title: "Capture first",
    note: "Take the photo, record the memo, paste the link. Do not force classification before capture.",
  },
  {
    title: "File into shape",
    note: "After capture, the user can tag it into Aim, Reality, Weld, or Seal.",
  },
  {
    title: "Glance at seed",
    note: "The phone can always show where the box stands right now.",
  },
];

const desktopFlow = [
  {
    title: "Compare source against seed",
    note: "Reality and Aim stay close enough to work against each other.",
  },
  {
    title: "Weld in the center",
    note: "Staging, editing, and Operate share one convergence posture.",
  },
  {
    title: "Seal stays separate",
    note: "Receipts expand into proof mode instead of blending back into editing.",
  },
];

function toneStyle(tone) {
  if (tone === "green") return { color: t.green, bg: t.greenDim, border: "rgba(127,217,160,0.24)" };
  if (tone === "amber") return { color: t.amber, bg: t.amberDim, border: "rgba(240,191,105,0.24)" };
  if (tone === "red") return { color: t.red, bg: t.redDim, border: "rgba(255,127,127,0.24)" };
  if (tone === "blue") return { color: "#8abfff", bg: t.blueSoft, border: "rgba(94,167,255,0.26)" };
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

function ObjectGlyph({ fill, color }) {
  return (
    <div className="final-proposal-object">
      <div
        className="final-proposal-object-fill"
        style={{
          transform: `scaleX(${fill})`,
          background: color,
        }}
      />
      <div className="final-proposal-object-core" />
    </div>
  );
}

function SevenGradient({ active = 0, tone = "blue", showLabels = false }) {
  const c = toneStyle(tone);
  return (
    <div style={{ display: "grid", gap: showLabels ? 8 : 6 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 6,
        }}
      >
        {gradientSteps.map((step, index) => (
          <div
            key={step}
            style={{
              height: showLabels ? 10 : 6,
              borderRadius: 999,
              border: `1px solid ${index < active ? c.border : t.line}`,
              background: index < active ? c.color : "rgba(255,255,255,0.04)",
              opacity: index < active ? 1 : 0.45,
            }}
            title={`${index + 1}. ${step}`}
          />
        ))}
      </div>
      {showLabels ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 6,
            color: t.muted,
            fontFamily: t.mono,
            fontSize: 9,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {gradientSteps.map((step) => (
            <span key={step} style={{ textAlign: "center" }}>
              {step}
            </span>
          ))}
        </div>
      ) : null}
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

export default function LoegosFinalProposalV1() {
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
        .final-proposal-shell {
          width: min(1460px, 100%);
          margin: 0 auto;
          padding: 30px;
          border: 1px solid ${t.line};
          border-radius: 34px;
          background: linear-gradient(180deg, rgba(255,255,255,0.024), transparent 20%), ${t.shell};
          box-shadow: ${t.shadow};
        }

        .final-grid-2,
        .final-grid-3,
        .final-grid-4 {
          display: grid;
          gap: 16px;
        }

        .final-grid-2 {
          grid-template-columns: 1.2fr 0.8fr;
        }

        .final-grid-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .final-grid-4 {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .final-proposal-object {
          position: relative;
          width: 88px;
          aspect-ratio: 1;
          clip-path: polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0 50%);
          background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)), rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.14);
          overflow: hidden;
        }

        .final-proposal-object::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 16px 16px;
          opacity: 0.28;
        }

        .final-proposal-object-fill {
          position: absolute;
          inset: 0 auto 0 0;
          width: 100%;
          transform-origin: left center;
          box-shadow: inset 0 0 22px rgba(94,167,255,0.18);
        }

        .final-proposal-object-core {
          position: absolute;
          inset: 16px;
          clip-path: polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0 50%);
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(7,10,14,0.4);
        }

        .final-hero {
          position: relative;
          overflow: hidden;
          min-height: 620px;
          padding: 22px;
          border-radius: 28px;
          border: 1px solid ${t.line};
          background:
            linear-gradient(135deg, rgba(5,8,12,0.88), rgba(18,23,28,0.98)),
            linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .final-hero::after {
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

        .final-hero-body {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(340px, 0.82fr);
          gap: 24px;
          min-height: calc(100% - 28px);
          padding-top: 92px;
        }

        @media (max-width: 1180px) {
          .final-grid-2,
          .final-grid-3,
          .final-grid-4,
          .final-hero-body {
            grid-template-columns: 1fr;
          }

          .final-hero {
            min-height: auto;
          }
        }

        @media (max-width: 780px) {
          .final-proposal-shell {
            padding: 20px;
            border-radius: 24px;
          }
        }
      `}</style>

      <div className="final-proposal-shell">
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
          <div style={{ maxWidth: 880 }}>
            <Kicker>Final proposal v1.1</Kicker>
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: "clamp(40px, 4.4vw, 78px)",
                lineHeight: 0.92,
                letterSpacing: "-0.055em",
                fontWeight: 620,
              }}
            >
              Shapes and workflow are the same system.
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
              This is the resolved proposal: `Aim / Reality / Weld / Seal` become the top-level
              families of work, and the user&apos;s actions live naturally inside them. Capture is a
              move inside Reality. Create and Operate are two moves inside Weld. Proof belongs to
              Seal. The geometry now compresses all the way through the interface: triangles point,
              squares frame reality, weld joins, and hexagonal vessels mark seventh-end settlement.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <SignalChip tone="blue">shapes = navigation families</SignalChip>
            <SignalChip tone="amber">verbs = moves inside them</SignalChip>
            <SignalChip tone="blue">squares = default field</SignalChip>
            <SignalChip tone="green">signals stay orthogonal</SignalChip>
          </div>
        </header>

        <section style={{ marginTop: 28 }}>
          <div className="final-grid-2">
            <div className="final-hero">
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
                <Kicker>phone + desktop</Kicker>
                <Kicker>single grammar</Kicker>
              </div>

              <div className="final-hero-body">
                <div style={{ alignSelf: "end", maxWidth: 620 }}>
                  <Kicker>Final thesis</Kicker>
                  <h2
                    style={{
                      margin: "10px 0 0",
                      fontSize: "clamp(42px, 5vw, 84px)",
                      lineHeight: 0.92,
                      letterSpacing: "-0.06em",
                      fontWeight: 620,
                    }}
                  >
                    Aim names.
                    <br />
                    Reality enters.
                    <br />
                    Weld decides.
                    <br />
                    Seal proves.
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
                    This keeps the philosophical clarity of the shape system, but it also makes the
                    tool legible as a real user journey. The shell defaults to square field logic,
                    the user moves by vectors, and settled objects earn a hexagonal vessel only when
                    the seven-stage gradient has done enough work.
                  </p>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { label: "Declared", fill: 0.22, tone: "neutral", stage: 1, color: "linear-gradient(180deg, rgba(94,167,255,0.42), rgba(94,167,255,0.12))", chip: "0 receipts" },
                    { label: "Grounded", fill: 0.62, tone: "amber", stage: 4, color: "linear-gradient(180deg, rgba(94,167,255,0.52), rgba(94,167,255,0.18))", chip: "3 receipts" },
                    { label: "Sealed", fill: 1, tone: "green", stage: 7, color: "linear-gradient(180deg, rgba(127,217,160,0.58), rgba(94,167,255,0.2))", chip: "14 receipts" },
                  ].map((state) => (
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
                          <SignalChip tone={state.tone}>{state.chip}</SignalChip>
                        </div>
                        <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>
                          {state.label === "Declared"
                            ? "The seed exists, but reality has not answered yet."
                            : state.label === "Grounded"
                              ? "Sources and early returns are giving the object weight."
                              : "Receipts have made enough of the object real to stand on."}
                        </p>
                        <div style={{ marginTop: 12 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                              marginBottom: 8,
                            }}
                          >
                            <Kicker>Seven-stage settlement</Kicker>
                            <Kicker>{state.stage} / 7</Kicker>
                          </div>
                          <SevenGradient active={state.stage} tone={state.label === "Sealed" ? "green" : "blue"} />
                        </div>
                      </div>
                    </Surface>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {shapes.map((shape) => {
                const c = toneStyle(shape.tone);
                const Icon = shape.icon;
                return (
                  <Surface key={shape.id} style={{ padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          fontSize: 22,
                          lineHeight: 1,
                          color: c.color,
                          fontWeight: shape.id === "weld" ? 700 : 400,
                        }}
                      >
                        {shape.glyph}
                      </span>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 34,
                          height: 34,
                          borderRadius: 12,
                          border: `1px solid ${t.line}`,
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <Kicker style={{ color: c.color }}>{shape.label}</Kicker>
                    </div>
                    <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>{shape.thesis}</h3>
                    <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>{shape.body}</p>
                    <div style={{ marginTop: 14 }}>
                      <SignalChip tone={shape.tone}>{shape.question}</SignalChip>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                      {shape.verbs.map((verb) => (
                        <span
                          key={verb}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            minHeight: 30,
                            padding: "0 10px",
                            borderRadius: 999,
                            border: `1px solid ${t.line}`,
                            background: "rgba(255,255,255,0.03)",
                            color: t.sec,
                            fontFamily: t.mono,
                            fontSize: 10,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          {verb}
                        </span>
                      ))}
                    </div>
                  </Surface>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Shared primitives"
            title="The strongest symbolic pieces survive, but they now serve one clearer architecture"
            body="These are the reusable atoms: shape-tagged blocks, assembly depth, seven-step settlement, and orthogonal urgency."
          />
          <div className="final-grid-4">
            {shapeRows.map((item) => (
              <Surface key={item.title} style={{ padding: 18, minHeight: 220, borderColor: toneStyle(item.tone).border }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 18,
                      lineHeight: 1,
                      color: toneStyle(item.tone).color,
                      fontWeight: item.shape === "weld" ? 700 : 400,
                    }}
                  >
                    {shapes.find((s) => s.id === item.shape)?.glyph}
                  </span>
                  <Kicker>{shapes.find((s) => s.id === item.shape)?.label}</Kicker>
                </div>
                <strong style={{ display: "block", marginTop: 12, fontSize: 18, lineHeight: 1.28 }}>{item.title}</strong>
                <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>{item.note}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14 }}>
                  <DepthStack depth={item.depth} size={18} />
                  <SignalChip tone={item.tone}>{shapes.find((s) => s.id === item.shape)?.label}</SignalChip>
                </div>
              </Surface>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Geometry compression"
            title="The same geometry should appear in language, navigation, cards, and proof surfaces"
            body="This is the ultra-compressed layer underneath the design system. Shapes are not decoration. They are how the product keeps philosophy and interface in sync."
          />
          <div className="final-grid-2">
            <div className="final-grid-4" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              {geometryCompression.map((item) => (
                <Surface key={item.label} style={{ padding: 18, minHeight: 220, borderColor: toneStyle(item.tone).border }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontSize: item.label === "Seven-end" ? 20 : 18,
                        lineHeight: 1,
                        color: toneStyle(item.tone).color,
                        fontWeight: item.label === "Weld" ? 700 : 500,
                      }}
                    >
                      {item.glyph}
                    </span>
                    <Kicker style={{ color: toneStyle(item.tone).color }}>{item.label}</Kicker>
                  </div>
                  <h3 style={{ margin: "12px 0 0", fontSize: 18, lineHeight: 1.18 }}>{item.title}</h3>
                  <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>{item.body}</p>
                </Surface>
              ))}
            </div>

            <Surface style={{ padding: 18 }}>
              <Kicker>Seven-stage gradient</Kicker>
              <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>
                Every canonical family has internal resolution
              </h3>
              <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.62 }}>
                The macro-phases stay `Aim / Reality / Weld / Seal`, but inside each one the object
                moves through a seven-step gradient. That is how the system avoids being vague. A
                thing is not just "in Reality." It is detecting, comparing, adapting, amplifying,
                maintaining, preparing, or arriving.
              </p>
              <div style={{ marginTop: 16 }}>
                <SevenGradient active={7} tone="green" showLabels />
              </div>

              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {[
                  "Operator sentences are the text primitive: the smallest human-readable unit that still runs.",
                  "Cards stay square by default because they are fields of evidence, not final objects.",
                  "Triangles belong on orientation, next move, and declared aim.",
                  "Hexagonal vessels appear only when something has earned portability or seal-state weight.",
                ].map((line) => (
                  <div
                    key={line}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0, 1fr)",
                      gap: 10,
                      alignItems: "start",
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${t.line}`,
                    }}
                  >
                    <MoveRight size={14} color={t.blue} style={{ marginTop: 2 }} />
                    <p style={{ margin: 0, color: t.sec, fontSize: 13, lineHeight: 1.56 }}>{line}</p>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Cross-device"
            title="Mobile and desktop are equally important because they are different postures of the same box"
            body="This proposal keeps one shared top-level navigation on both devices. What changes is the action emphasis inside each shape."
          />
          <div className="final-grid-2">
            <Surface style={{ padding: 18 }}>
              <Kicker>Phone posture</Kicker>
              <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>Reality-first companion</h3>
              <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                {phoneFlow.map((step, index) => (
                  <div
                    key={step.title}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0, 1fr)",
                      gap: 12,
                      alignItems: "start",
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${t.line}`,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        background: t.blueDim,
                        color: t.blue,
                        fontFamily: t.mono,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <strong style={{ display: "block", fontSize: 15 }}>{step.title}</strong>
                      <p style={{ margin: "6px 0 0", color: t.sec, fontSize: 13, lineHeight: 1.5 }}>{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <SignalChip tone="blue">Aim</SignalChip>
                <SignalChip tone="green">Reality</SignalChip>
                <SignalChip tone="amber">Weld</SignalChip>
                <SignalChip tone="green">Seal</SignalChip>
              </div>
            </Surface>

            <Surface style={{ padding: 18 }}>
              <Kicker>Desktop posture</Kicker>
              <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>Weld-centered workbench</h3>
              <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                {desktopFlow.map((step) => (
                  <div
                    key={step.title}
                    style={{
                      display: "grid",
                      gap: 6,
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${t.line}`,
                    }}
                  >
                    <strong style={{ display: "block", fontSize: 15 }}>{step.title}</strong>
                    <p style={{ margin: 0, color: t.sec, fontSize: 13, lineHeight: 1.5 }}>{step.note}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    minHeight: 38,
                    padding: "0 12px",
                    borderRadius: 999,
                    background: t.blueDim,
                    border: `1px solid ${toneStyle("blue").border}`,
                    color: t.blue,
                    fontFamily: t.mono,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <NotebookPen size={14} />
                  Create lives in Weld
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    minHeight: 38,
                    padding: "0 12px",
                    borderRadius: 999,
                    background: t.amberDim,
                    border: `1px solid ${toneStyle("amber").border}`,
                    color: t.amber,
                    fontFamily: t.mono,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <Sparkles size={14} />
                  Operate lives in Weld
                </div>
              </div>
            </Surface>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Final shell"
            title="One final workspace composition"
            body="This shows how the unified model behaves: same four families across devices, with the center of gravity moving depending on what the user is doing."
          />
          <Surface
            style={{
              padding: 16,
              borderRadius: 28,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.018), transparent 26%), rgba(0,0,0,0.18)",
            }}
          >
            <div className="final-grid-3">
              <Surface style={{ padding: 18, minHeight: 440 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <Kicker>Reality</Kicker>
                  <SignalChip tone="blue">capture filed</SignalChip>
                </div>
                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                  {[
                    { title: "Roadside storefront photo", meta: "captured on phone · image source", tone: "neutral", chip: "Open" },
                    { title: "Voice memo from the car", meta: "speak note · audio source", tone: "amber", chip: "Queued" },
                    { title: "Lease research", meta: "text source · verified", tone: "green", chip: "Clear" },
                  ].map((row) => (
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

              <Surface style={{ padding: 18, minHeight: 440 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <Kicker>Weld</Kicker>
                    <h3 style={{ margin: "8px 0 0", fontSize: 20 }}>Current seed</h3>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <SignalChip tone="blue">stage</SignalChip>
                    <SignalChip tone="amber">operate</SignalChip>
                  </div>
                </div>

                <Surface style={{ padding: 18, marginTop: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <Kicker>Aim inside Weld</Kicker>
                    <SignalChip tone="amber">3 receipts sealed</SignalChip>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 300px" }}>
                      <h4 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>
                        Open a sourdough bakery in Cobble Hill by Q1.
                      </h4>
                      <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 15, lineHeight: 1.6 }}>
                        Lease research is sealed. Cost estimate verified. Funding gap remains open.
                        The next move is a lender shortlist.
                      </p>
                    </div>
                    <div style={{ width: 140, display: "flex", justifyContent: "center" }}>
                      <ObjectGlyph
                        fill={0.62}
                        color="linear-gradient(180deg, rgba(94,167,255,0.52), rgba(94,167,255,0.18))"
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
                    <SignalChip tone="blue">Aim</SignalChip>
                    <SignalChip tone="green">Reality</SignalChip>
                    <SignalChip tone="amber">Weld</SignalChip>
                  </div>
                </Surface>
              </Surface>

              <Surface style={{ padding: 18, minHeight: 440 }}>
                <Kicker>Seal</Kicker>
                <h4 style={{ margin: "8px 0 0", fontSize: 20 }}>Receipt ledger</h4>
                <p style={{ margin: "12px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>
                  Proof expands here instead of blending back into editing. This is where the box
                  shows what survived.
                </p>

                <div style={{ display: "grid", gap: 12, marginTop: 14, color: t.sec, fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={15} color={t.green} />
                    Startup cost estimate sealed
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

                <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      minHeight: 38,
                      padding: "0 12px",
                      borderRadius: 999,
                      background: t.greenDim,
                      border: `1px solid ${toneStyle("green").border}`,
                      color: t.green,
                      fontFamily: t.mono,
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      width: "fit-content",
                    }}
                  >
                    <Send size={14} />
                    shareable receipt
                  </div>
                </div>
              </Surface>
            </div>
          </Surface>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Orthogonal signals"
            title="Urgency remains separate from shape and family"
            body="The final system keeps the clearest rule from the competing proposal: brand and signal must never collapse into one another."
          />
          <div className="final-grid-4">
            {signalSystem.map((item) => (
              <Surface key={item.label} style={{ padding: 18, minHeight: 160 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: toneStyle(item.tone).color,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <Kicker>{item.label}</Kicker>
                </div>
                <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 14, lineHeight: 1.58 }}>{item.note}</p>
              </Surface>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Why this wins"
            title="The final proposal resolves the main disagreement instead of splitting the difference"
          />
          <div className="final-grid-4">
            <Surface style={{ padding: 18, minHeight: 220 }}>
              <Kicker>System truth</Kicker>
              <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 15, lineHeight: 1.62 }}>
                It preserves the philosophical depth of the four-shape model instead of flattening
                it into a generic app workflow.
              </p>
            </Surface>

            <Surface style={{ padding: 18, minHeight: 220 }}>
              <Kicker>User truth</Kicker>
              <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 15, lineHeight: 1.62 }}>
                It still matches how a human actually uses the tool: catch something in life, read
                it, shape it, operate on it, then preserve proof.
              </p>
            </Surface>

            <Surface style={{ padding: 18, minHeight: 220 }}>
              <Kicker>Device truth</Kicker>
              <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 15, lineHeight: 1.62 }}>
                It works equally well on phone and desktop because both devices speak the same four
                families while emphasizing different moves inside them.
              </p>
            </Surface>

            <Surface style={{ padding: 18, minHeight: 220 }}>
              <Kicker>Compression truth</Kicker>
              <p style={{ margin: "14px 0 0", color: t.sec, fontSize: 15, lineHeight: 1.62 }}>
                It gives the product one deep structure across language, geometry, and interface:
                triangles for vectors, squares for evidence fields, weld for convergence, and
                hexagonal settlement only when the seven-stage gradient has been crossed.
              </p>
            </Surface>
          </div>
        </section>
      </div>
    </div>
  );
}
