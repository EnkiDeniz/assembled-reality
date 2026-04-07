import React from "react";
import {
  Blocks,
  Camera,
  CheckCircle2,
  Circle,
  Layers3,
  MoveRight,
  NotebookPen,
  PanelLeft,
  ReceiptText,
  Sparkles,
  Target,
  TriangleAlert,
  Workflow,
} from "lucide-react";

const tokens = {
  canvas: "#0d0e10",
  shell: "#121315",
  raised: "#1b1f24",
  line: "rgba(255,255,255,0.08)",
  lineStrong: "rgba(255,255,255,0.12)",
  text: "#f3f5f7",
  textSoft: "rgba(255,255,255,0.7)",
  textMeta: "rgba(255,255,255,0.45)",
  blue: "#5ea7ff",
  green: "#7fd9a0",
  amber: "#f0bf69",
  red: "#ff7f7f",
  shadow: "0 32px 72px rgba(0,0,0,0.34)",
  mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace',
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
};

const pillars = [
  {
    eyebrow: "Object",
    title: "One box, one seed, one changing shape",
    body:
      "The seed is the work becoming legible to itself across phone capture, desktop assembly, and proof.",
  },
  {
    eyebrow: "Language",
    title: "Words behave like assembled parts",
    body:
      "Operator sentences are native primitives. They can be carried, staged, rewritten, and pressure-tested.",
  },
  {
    eyebrow: "Proof",
    title: "Settlement earns solidity",
    body:
      "Receipts do more than log history. They turn wireframe intention into something the box can stand on.",
  },
];

const operatorBlocks = [
  {
    label: "Aim block",
    sentence: "Open a sourdough bakery in Cobble Hill by Q1.",
    role: "Issues the invoice and names what reality would have to answer.",
    tone: "blue",
    icon: Target,
  },
  {
    label: "Ground block",
    sentence: "Lease research for 3 locations. Cost estimate verified.",
    role: "Adds material with provenance instead of vague context around the goal.",
    tone: "green",
    icon: Layers3,
  },
  {
    label: "Bridge block",
    sentence: "Funding gap remains $40K. Next move: lender shortlist.",
    role: "Turns diagnosis into a runnable next move rather than another discussion loop.",
    tone: "amber",
    icon: MoveRight,
  },
  {
    label: "Seal block",
    sentence: "Startup cost estimate verified. Receipt sealed Mar 8.",
    role: "Marks the point where a claim survived contact and earned solidity.",
    tone: "green",
    icon: ReceiptText,
  },
];

const navigationSteps = [
  {
    phase: "Capture",
    title: "Take in the world",
    cue: "see -> capture -> file to box",
    body:
      "Phone intake should be immediate enough for a roadside photo, a voice memo in the car, or a pasted link in motion.",
    icon: Camera,
  },
  {
    phase: "Think",
    title: "Read the source",
    cue: "source -> listen -> select",
    body:
      "The document owns the screen. Navigation quiets down to source switching, playback, and Seven support.",
    icon: PanelLeft,
  },
  {
    phase: "Create",
    title: "Shape the seed",
    cue: "staging -> rewrite -> compare",
    body:
      "The tool becomes tactile here. Navigation pulls the seed, staging, and editable blocks into one working posture.",
    icon: NotebookPen,
  },
  {
    phase: "Operate",
    title: "Read the box",
    cue: "run -> diagnose -> decide",
    body:
      "Operate should feel singular and decisive. The shell sheds side-noise and frames one honest read.",
    icon: Sparkles,
  },
  {
    phase: "Proof",
    title: "Inspect the return",
    cue: "receipt -> witness -> seal",
    body:
      "Proof is not another editor. Navigation shifts into ledger mode, where return, witness, and next move become legible.",
    icon: ReceiptText,
  },
];

const devicePostures = [
  {
    device: "Phone",
    title: "Field capture and fast orientation",
    cue: "capture -> file -> glance -> move",
    body:
      "Mobile should feel like a living companion to reality: fast capture, quick seed check, and immediate filing into the same box.",
  },
  {
    device: "Desktop",
    title: "Deep assembly and proof work",
    cue: "compare -> rewrite -> operate -> inspect",
    body:
      "Desktop earns density by letting the user compare sources, shape the seed, run Operate, and inspect receipts in context.",
  },
  {
    device: "Shared laws",
    title: "One object across both",
    cue: "same nouns -> same signals -> same box",
    body:
      "The posture changes between devices, but the product language does not. It should still feel like one box with one seed.",
  },
];

const settlementSteps = [
  {
    step: "01",
    title: "Invoice",
    body: "A declaration opens an account with reality and frames what would count.",
  },
  {
    step: "02",
    title: "Move",
    body: "The user acts. The box preserves intention, cost, and chosen direction.",
  },
  {
    step: "03",
    title: "Return",
    body: "Reality answers back through friction, witness, or external evidence.",
  },
  {
    step: "04",
    title: "Receipt",
    body: "That answer becomes a portable proof object with provenance attached.",
  },
  {
    step: "05",
    title: "Seal",
    body: "Trust is earned after settlement. The object becomes more solid here.",
  },
];

const sourceRows = [
  {
    title: "Roadside storefront photo",
    meta: "captured on phone · image source",
    chip: "Open",
    tone: "unknown",
  },
  {
    title: "Voice memo from the car",
    meta: "speak note · audio source",
    chip: "Queued",
    tone: "amber",
  },
  {
    title: "Operator Sentences",
    meta: "95 blocks · text source",
    chip: "Verified",
    tone: "green",
  },
  {
    title: "Seed of seeds",
    meta: "working seed · current box",
    chip: "Active",
    tone: "blue",
  },
];

const foundationRules = [
  "Assembly depth should be shown through fill, density, and seal marks.",
  "Blue stays brand and action. Trust never steals the accent.",
  "Green, amber, and red stay functional and never become identity colors.",
  "Mobile and desktop share one object model even when the posture changes.",
];

function toneStyle(tone) {
  if (tone === "green") {
    return {
      color: tokens.green,
      background: "rgba(127,217,160,0.1)",
      borderColor: "rgba(127,217,160,0.22)",
    };
  }
  if (tone === "amber") {
    return {
      color: tokens.amber,
      background: "rgba(240,191,105,0.1)",
      borderColor: "rgba(240,191,105,0.22)",
    };
  }
  if (tone === "red") {
    return {
      color: tokens.red,
      background: "rgba(255,127,127,0.1)",
      borderColor: "rgba(255,127,127,0.22)",
    };
  }
  if (tone === "blue") {
    return {
      color: "#8abfff",
      background: "rgba(94,167,255,0.1)",
      borderColor: "rgba(94,167,255,0.24)",
    };
  }
  return {
    color: tokens.textSoft,
    background: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  };
}

function Kicker({ children, style }) {
  return (
    <span
      style={{
        color: tokens.textMeta,
        fontFamily: tokens.mono,
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function SignalChip({ tone, children }) {
  const toneStyles = toneStyle(tone);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        border: `1px solid ${toneStyles.borderColor}`,
        background: toneStyles.background,
        color: toneStyles.color,
        fontFamily: tokens.mono,
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

function ObjectGlyph({ fill, color }) {
  return (
    <div className="proposal-object-shape">
      <div
        className="proposal-object-fill"
        style={{
          transform: `scaleX(${fill})`,
          background: color,
        }}
      />
      <div className="proposal-object-core" />
    </div>
  );
}

function SectionHeader({ eyebrow, title, body }) {
  return (
    <div style={{ maxWidth: 760, marginBottom: 18 }}>
      <Kicker>{eyebrow}</Kicker>
      <h2
        style={{
          margin: "8px 0 0",
          fontSize: "clamp(28px, 2.8vw, 44px)",
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
            color: tokens.textSoft,
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
        border: `1px solid ${tokens.line}`,
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

export default function LoegosCompetitionProposalV04() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 28,
        background:
          "radial-gradient(circle at top left, rgba(94,167,255,0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(127,217,160,0.06), transparent 24%), linear-gradient(180deg, #0c0d10 0%, #0a0b0d 100%)",
        color: tokens.text,
        fontFamily: tokens.sans,
      }}
    >
      <style>{`
        .proposal-shell {
          width: min(1420px, 100%);
          margin: 0 auto;
          padding: 30px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 34px;
          background: linear-gradient(180deg, rgba(255,255,255,0.024), transparent 20%), ${tokens.shell};
          box-shadow: ${tokens.shadow};
        }

        .proposal-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.76fr);
          gap: 20px;
          margin-top: 28px;
        }

        .proposal-grid-3,
        .proposal-grid-4,
        .proposal-grid-5,
        .proposal-grid-foundation,
        .proposal-grid-nav {
          display: grid;
          gap: 16px;
        }

        .proposal-grid-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .proposal-grid-4 {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .proposal-grid-5 {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        .proposal-grid-foundation {
          grid-template-columns: 1.1fr 0.95fr 0.95fr;
        }

        .proposal-grid-nav {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        .proposal-object-shape {
          position: relative;
          width: 86px;
          aspect-ratio: 1;
          clip-path: polygon(50% 0, 88% 18%, 100% 62%, 72% 100%, 28% 100%, 0 55%, 12% 18%);
          background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)), rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.14);
          overflow: hidden;
        }

        .proposal-object-shape::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 16px 16px;
          opacity: 0.28;
        }

        .proposal-object-fill {
          position: absolute;
          inset: 0 auto 0 0;
          width: 100%;
          transform-origin: left center;
          box-shadow: inset 0 0 22px rgba(94,167,255,0.18);
        }

        .proposal-object-core {
          position: absolute;
          inset: 16px;
          clip-path: polygon(50% 0, 90% 20%, 100% 66%, 74% 100%, 26% 100%, 0 58%, 10% 20%);
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(7,10,14,0.4);
        }

        .proposal-poster {
          position: relative;
          overflow: hidden;
          min-height: 620px;
          padding: 22px;
          background:
            linear-gradient(135deg, rgba(5,8,12,0.88), rgba(18,23,28,0.98)),
            linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .proposal-poster::after {
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

        .proposal-poster-body {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 0.88fr);
          gap: 24px;
          min-height: calc(100% - 28px);
          padding-top: 92px;
        }

        .proposal-shell .mobile-stack {
          display: grid;
          gap: 16px;
        }

        @media (max-width: 1180px) {
          .proposal-hero,
          .proposal-grid-3,
          .proposal-grid-4,
          .proposal-grid-5,
          .proposal-grid-foundation,
          .proposal-grid-nav,
          .proposal-poster-body {
            grid-template-columns: 1fr;
          }

          .proposal-poster {
            min-height: auto;
          }
        }

        @media (max-width: 780px) {
          .proposal-shell {
            padding: 20px;
            border-radius: 24px;
          }
        }
      `}</style>

      <div className="proposal-shell">
        <header
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            gap: 24,
            paddingBottom: 22,
            borderBottom: `1px solid ${tokens.line}`,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 820 }}>
            <Kicker>Proposal v0.4 · shareable JSX</Kicker>
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: "clamp(38px, 4.2vw, 72px)",
                lineHeight: 0.92,
                letterSpacing: "-0.055em",
                fontWeight: 620,
              }}
            >
              Meaning assembles here.
            </h1>
            <p
              style={{
                margin: "14px 0 0",
                color: tokens.textSoft,
                fontSize: 16,
                lineHeight: 1.65,
                maxWidth: 840,
              }}
            >
              A competition-ready Loegos proposal grounded in the live code and the product theory:
              operator blocks, settlement logic, one shared navigation grammar, and a seed that
              becomes real across phone and desktop.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 42,
                padding: "0 16px",
                borderRadius: 14,
                border: `1px solid ${tokens.lineStrong}`,
                background: "rgba(255,255,255,0.03)",
                color: tokens.text,
                fontWeight: 560,
              }}
            >
              Competition board
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 42,
                padding: "0 16px",
                borderRadius: 14,
                border: "1px solid rgba(94,167,255,0.38)",
                background: "linear-gradient(180deg, rgba(94,167,255,0.26), rgba(94,167,255,0.14))",
                color: tokens.text,
                fontWeight: 560,
              }}
            >
              Shareable JSX
            </div>
          </div>
        </header>

        <section className="proposal-hero">
          <Surface className="proposal-poster" style={{ padding: 22 }}>
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
              <Kicker>assembly system</Kicker>
            </div>

            <div className="proposal-poster-body">
              <div style={{ alignSelf: "end", maxWidth: 620 }}>
                <Kicker>System thesis</Kicker>
                <h2
                  style={{
                    margin: "10px 0 0",
                    fontSize: "clamp(42px, 5vw, 82px)",
                    lineHeight: 0.92,
                    letterSpacing: "-0.06em",
                    fontWeight: 620,
                  }}
                >
                  Less dashboard.
                  <br />
                  More object.
                </h2>
                <p
                  style={{
                    margin: "14px 0 0",
                    color: tokens.textSoft,
                    fontSize: 16,
                    lineHeight: 1.68,
                    maxWidth: 560,
                  }}
                >
                  The workspace should not feel like files plus chrome. It should feel like one
                  assembled object gaining reality as sources, operator blocks, and receipts press
                  it into form.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
                  {["seed as object", "blocks as primitives", "solidity over rainbow state", "one navigation grammar"].map(
                    (item) => (
                      <span
                        key={item}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.04)",
                          color: tokens.textSoft,
                          fontSize: 13,
                        }}
                      >
                        {item}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div style={{ display: "grid", alignContent: "start", gap: 12 }}>
                <Kicker>Object preview</Kicker>
                {[
                  {
                    name: "Declared",
                    summary: "Wireframe seed",
                    detail: "Aim exists. The object is visible, but reality has not answered yet.",
                    fill: 0.22,
                    color: "linear-gradient(180deg, rgba(94,167,255,0.48), rgba(94,167,255,0.14))",
                    chip: "0 receipts",
                    tone: "unknown",
                  },
                  {
                    name: "Grounded",
                    summary: "Partial solidity",
                    detail:
                      "Sources and early returns give the shape weight without pretending it is finished.",
                    fill: 0.62,
                    color: "linear-gradient(180deg, rgba(94,167,255,0.52), rgba(94,167,255,0.18))",
                    chip: "3 receipts",
                    tone: "amber",
                  },
                  {
                    name: "Sealed",
                    summary: "Object becoming real",
                    detail:
                      "Receipts have filled enough of the shape that the next move can be made honestly.",
                    fill: 1,
                    color: "linear-gradient(180deg, rgba(127,217,160,0.56), rgba(94,167,255,0.2))",
                    chip: "14 receipts",
                    tone: "green",
                  },
                ].map((item) => (
                  <Surface
                    key={item.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0, 1fr)",
                      gap: 14,
                      alignItems: "center",
                      padding: 14,
                    }}
                  >
                    <div style={{ width: 108, display: "flex", justifyContent: "center" }}>
                      <ObjectGlyph fill={item.fill} color={item.color} />
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
                        <Kicker>{item.name}</Kicker>
                        <SignalChip tone={item.tone}>{item.chip}</SignalChip>
                      </div>
                      <h3 style={{ margin: "8px 0 0", fontSize: 20, lineHeight: 1.15 }}>
                        {item.summary}
                      </h3>
                      <p style={{ margin: "10px 0 0", color: tokens.textSoft, fontSize: 15, lineHeight: 1.58 }}>
                        {item.detail}
                      </p>
                    </div>
                  </Surface>
                ))}
              </div>
            </div>
          </Surface>

          <div className="mobile-stack">
            <Surface style={{ padding: 18 }}>
              <Kicker>Competition edge</Kicker>
              <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
                {[
                  "Blue stays brand and action. Trust never steals the accent.",
                  "Operator blocks become a native UI primitive, not just copy inside a paragraph.",
                  "Phone capture and desktop assembly share one navigation grammar.",
                  "The seed, Operate, and receipts read as the same object from different angles.",
                ].map((item) => (
                  <li key={item} style={{ position: "relative", paddingLeft: 16, color: tokens.textSoft, fontSize: 14, lineHeight: 1.55 }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 9,
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: tokens.blue,
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Surface>

            <Surface style={{ padding: 18 }}>
              <Kicker>Working sentence</Kicker>
              <h3 style={{ margin: "8px 0 0", fontSize: 20, lineHeight: 1.15 }}>
                Think in the box. Create the assembly. Operate on reality.
              </h3>
              <p style={{ margin: "12px 0 0", color: tokens.textSoft, fontSize: 15, lineHeight: 1.62 }}>
                The loop should begin out in the world when the user captures something worth
                assembling and continue through deep assembly on desktop without renaming the work.
              </p>
            </Surface>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="System pillars"
            title="The product only wins if the theory stays visible in the interface"
          />
          <div className="proposal-grid-3">
            {pillars.map((item) => (
              <Surface key={item.title} style={{ padding: 18 }}>
                <Kicker>{item.eyebrow}</Kicker>
                <h3 style={{ margin: "8px 0 0", fontSize: 20, lineHeight: 1.15 }}>{item.title}</h3>
                <p style={{ margin: "12px 0 0", color: tokens.textSoft, fontSize: 15, lineHeight: 1.62 }}>
                  {item.body}
                </p>
              </Surface>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Operator blocks"
            title="Language becomes native interaction material"
            body="In Loegos, sentences are not garnish. They are small assembled parts that can be carried, staged, rewritten, and pressure-tested."
          />
          <div className="proposal-grid-4">
            {operatorBlocks.map(({ label, sentence, role, tone, icon: Icon }) => {
              const toneStyles = toneStyle(tone);
              return (
                <Surface key={label} style={{ padding: 18, borderColor: toneStyles.borderColor, minHeight: 220 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        border: `1px solid ${tokens.line}`,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <Icon size={17} />
                    </div>
                    <Kicker>{label}</Kicker>
                  </div>
                  <strong style={{ display: "block", marginTop: 12, fontSize: 18, lineHeight: 1.28 }}>{sentence}</strong>
                  <p style={{ margin: "12px 0 0", color: tokens.textSoft, fontSize: 14, lineHeight: 1.58 }}>{role}</p>
                </Surface>
              );
            })}
          </div>

          <Surface style={{ padding: 18, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <Kicker>Operator chain</Kicker>
              <Workflow size={16} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
              {["Aim", "Ground", "Bridge", "Seal"].map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    minHeight: 38,
                    padding: "0 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${tokens.line}`,
                    color: tokens.textSoft,
                    fontFamily: tokens.mono,
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>{item}</span>
                  {index < 3 ? <MoveRight size={15} /> : null}
                </div>
              ))}
            </div>
          </Surface>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Navigation grammar"
            title="The tool should navigate the way assembly itself moves"
            body="Navigation is not a separate decoration layer. It should follow the same phase logic as the work from the first field capture to the sealed receipt."
          />
          <div className="proposal-grid-nav">
            {navigationSteps.map(({ phase, title, cue, body, icon: Icon }) => (
              <Surface key={phase} style={{ padding: 18, minHeight: 220 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      border: `1px solid ${tokens.line}`,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Icon size={17} />
                  </div>
                  <Kicker>{phase}</Kicker>
                </div>
                <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>{title}</h3>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    color: "#8abfff",
                    fontFamily: tokens.mono,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {cue}
                </span>
                <p style={{ margin: "12px 0 0", color: tokens.textSoft, fontSize: 14, lineHeight: 1.58 }}>{body}</p>
              </Surface>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Cross-device posture"
            title="Mobile and desktop should feel equally good, not merely compatible"
            body="Equal quality does not mean identical screens. It means each device gets the right version of the assembler tool while preserving one shared object model."
          />
          <div className="proposal-grid-3">
            {devicePostures.map((item) => (
              <Surface key={item.device} style={{ padding: 18, minHeight: 200 }}>
                <Kicker>{item.device}</Kicker>
                <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>{item.title}</h3>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    color: "#8abfff",
                    fontFamily: tokens.mono,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.cue}
                </span>
                <p style={{ margin: "12px 0 0", color: tokens.textSoft, fontSize: 14, lineHeight: 1.58 }}>{item.body}</p>
              </Surface>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Settlement"
            title="Trust is a settlement outcome, not a decorative state"
            body="The shell should show compact signals. Rich trust belongs where the user expects proof: Operate, receipts, and the seed's solidifying edge."
          />
          <div className="proposal-grid-5">
            {settlementSteps.map((item) => (
              <Surface key={item.step} style={{ padding: 18, minHeight: 200 }}>
                <Kicker style={{ color: tokens.blue }}>{item.step}</Kicker>
                <h3 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.15 }}>{item.title}</h3>
                <p style={{ margin: "12px 0 0", color: tokens.textSoft, fontSize: 14, lineHeight: 1.58 }}>{item.body}</p>
              </Surface>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader eyebrow="Foundations" title="One visual system, with clear jobs for color, type, and motion" />
          <div className="proposal-grid-foundation">
            <Surface style={{ padding: 18 }}>
              <Kicker>Palette</Kicker>
              <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                {[
                  ["Canvas", tokens.canvas, "Whole-app ground and negative space."],
                  ["Shell", tokens.shell, "Main workbench plane and structural surfaces."],
                  ["Raised", tokens.raised, "Focused work regions that need separation, not decoration."],
                  ["Action blue", tokens.blue, "Identity, active states, selected controls, and the one primary action."],
                  ["Verified", tokens.green, "Settlement succeeded and the proof can bear weight."],
                  ["Partial", tokens.amber, "Promising, cooling down, or still awaiting stronger contact."],
                ].map(([label, color, use]) => (
                  <div
                    key={label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0,1fr)",
                      gap: 12,
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${tokens.line}`,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        border: `1px solid ${tokens.line}`,
                        background: color,
                      }}
                    />
                    <div>
                      <strong style={{ display: "block", fontSize: 15, lineHeight: 1.2 }}>{label}</strong>
                      <p style={{ margin: "6px 0 0", color: tokens.textSoft, fontSize: 13, lineHeight: 1.5 }}>{use}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface style={{ padding: 18 }}>
              <Kicker>System laws</Kicker>
              <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
                {foundationRules.map((item) => (
                  <li key={item} style={{ position: "relative", paddingLeft: 16, color: tokens.textSoft, fontSize: 14, lineHeight: 1.55 }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 9,
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: tokens.blue,
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Surface>

            <Surface style={{ padding: 18 }}>
              <Kicker>Control family</Kicker>
              <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      minHeight: 42,
                      padding: "0 16px",
                      borderRadius: 14,
                      border: "1px solid rgba(94,167,255,0.38)",
                      background: "linear-gradient(180deg, rgba(94,167,255,0.26), rgba(94,167,255,0.14))",
                    }}
                  >
                    <Sparkles size={16} />
                    Run Operate
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      minHeight: 42,
                      padding: "0 16px",
                      borderRadius: 14,
                      border: `1px solid ${tokens.lineStrong}`,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <ReceiptText size={16} />
                    Open receipts
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <span style={{ color: tokens.textSoft, fontSize: 13 }}>Seed prompt</span>
                  <div
                    style={{
                      minHeight: 44,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 14px",
                      borderRadius: 14,
                      border: `1px solid ${tokens.lineStrong}`,
                      background: "rgba(255,255,255,0.03)",
                      color: tokens.text,
                    }}
                  >
                    State the next proof move in one sentence.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <SignalChip tone="green">Verified</SignalChip>
                  <SignalChip tone="amber">Cooling down</SignalChip>
                  <SignalChip tone="unknown">Open</SignalChip>
                </div>
              </div>
            </Surface>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <SectionHeader
            eyebrow="Workspace proposition"
            title="The shell should frame the object instead of burying it"
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
              className="proposal-grid-3"
              style={{ gridTemplateColumns: "minmax(220px,0.88fr) minmax(0,1.28fr) minmax(240px,0.82fr)" }}
            >
              <Surface style={{ padding: 18, minHeight: 440 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <Kicker>Think</Kicker>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      minHeight: 36,
                      padding: "0 14px",
                      borderRadius: 14,
                      border: `1px solid ${tokens.lineStrong}`,
                      background: "rgba(255,255,255,0.03)",
                      fontSize: 14,
                    }}
                  >
                    <PanelLeft size={15} />
                    Sources
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                  {sourceRows.map((source) => (
                    <Surface key={source.title} style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <strong style={{ display: "block", fontSize: 16 }}>{source.title}</strong>
                          <p style={{ margin: "6px 0 0", color: tokens.textSoft, fontSize: 13, lineHeight: 1.5 }}>{source.meta}</p>
                        </div>
                        <SignalChip tone={source.tone}>{source.chip}</SignalChip>
                      </div>
                    </Surface>
                  ))}
                </div>
              </Surface>

              <Surface style={{ padding: 18, minHeight: 440 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <Kicker>Create</Kicker>
                    <h3 style={{ margin: "8px 0 0", fontSize: 20 }}>Current seed</h3>
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      minHeight: 42,
                      padding: "0 16px",
                      borderRadius: 14,
                      border: "1px solid rgba(94,167,255,0.38)",
                      background: "linear-gradient(180deg, rgba(94,167,255,0.26), rgba(94,167,255,0.14))",
                    }}
                  >
                    <NotebookPen size={16} />
                    Refine seed
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
                      <p style={{ margin: "12px 0 0", color: tokens.textSoft, fontSize: 15, lineHeight: 1.6 }}>
                        Lease research for three locations is sealed. Cost estimate verified.
                        Funding gap remains open. The next move is a lender shortlist.
                      </p>
                    </div>
                    <div style={{ width: 140, display: "flex", justifyContent: "center" }}>
                      <ObjectGlyph
                        fill={0.62}
                        color="linear-gradient(180deg, rgba(94,167,255,0.52), rgba(94,167,255,0.18))"
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                    {[
                      [Target, "Aim", "blue"],
                      [Blocks, "Ground", "green"],
                      [MoveRight, "Bridge", "amber"],
                    ].map(([Icon, label, tone]) => {
                      const toneStyles = toneStyle(tone);
                      return (
                        <div
                          key={label}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            minHeight: 34,
                            padding: "0 12px",
                            borderRadius: 999,
                            border: `1px solid ${toneStyles.borderColor}`,
                            background: toneStyles.background,
                            color: toneStyles.color,
                            fontFamily: tokens.mono,
                            fontSize: 11,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          <Icon size={14} />
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </Surface>
              </Surface>

              <div className="mobile-stack">
                <Surface style={{ padding: 18 }}>
                  <Kicker>Operate</Kicker>
                  <h4 style={{ margin: "8px 0 0", fontSize: 20 }}>Honest read</h4>
                  <p style={{ margin: "12px 0 0", color: tokens.textSoft, fontSize: 14, lineHeight: 1.58 }}>
                    Show Aim, Ground, Bridge, convergence, and next move without turning it into
                    chat.
                  </p>
                  <div style={{ marginTop: 14 }}>
                    <SignalChip tone="amber">Retry after cooldown</SignalChip>
                  </div>
                </Surface>

                <Surface style={{ padding: 18 }}>
                  <Kicker>Receipts</Kicker>
                  <h4 style={{ margin: "8px 0 0", fontSize: 20 }}>Proof ledger</h4>
                  <p style={{ margin: "12px 0 0", color: tokens.textSoft, fontSize: 14, lineHeight: 1.58 }}>
                    Each sealed receipt fills the object and leaves behind portable evidence.
                  </p>
                  <div style={{ display: "grid", gap: 12, marginTop: 14, color: tokens.textSoft, fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle2 size={15} color={tokens.green} />
                      Cost estimate sealed
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <TriangleAlert size={15} color={tokens.amber} />
                      Funding still open
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Circle size={15} color={tokens.textMeta} />
                      Permits unknown
                    </div>
                  </div>
                </Surface>
              </div>
            </div>
          </Surface>
        </section>
      </div>
    </div>
  );
}
