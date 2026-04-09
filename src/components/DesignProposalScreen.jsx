import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
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
import styles from "@/components/DesignProposalScreen.module.css";

const systemPillars = [
  {
    eyebrow: "Object",
    title: "One box, one seed, one changing shape",
    body:
      "The seed is not a note beside the work. It is the work becoming legible to itself across phone capture, desktop assembly, and proof.",
  },
  {
    eyebrow: "Language",
    title: "Words behave like assembled parts",
    body:
      "Operator sentences are small enough to carry, but strong enough to change what the user does next.",
  },
  {
    eyebrow: "Proof",
    title: "Settlement earns solidity",
    body:
      "Receipts do more than log history. They turn wireframe intention into something the box can stand on.",
  },
];

const competitionEdges = [
  "Blue stays brand and action. Trust never steals the accent.",
  "Assembly depth moves through solidity, not a rainbow token ladder.",
  "Operator blocks become a native UI primitive, not just copy inside a paragraph.",
  "The seed, Operate, and receipts read as the same object from different angles.",
  "Phone capture and desktop assembly share one navigation grammar.",
];

const objectStates = [
  {
    name: "Declared",
    stage: "declared",
    summary: "Wireframe seed",
    detail: "Aim exists. The object is visible, but reality has not answered yet.",
    metric: "0 receipts",
    tone: "unknown",
  },
  {
    name: "Grounded",
    stage: "grounded",
    summary: "Partial solidity",
    detail: "Sources and early returns give the shape weight without pretending it is finished.",
    metric: "3 receipts",
    tone: "partial",
  },
  {
    name: "Sealed",
    stage: "sealed",
    summary: "Object becoming real",
    detail: "Receipts have filled enough of the shape that the next move can be made honestly.",
    metric: "14 receipts",
    tone: "verified",
  },
];

const operatorBlocks = [
  {
    label: "Aim block",
    sentence: "Open a sourdough bakery in Cobble Hill by Q1.",
    role: "Issues the invoice. It names what reality would have to answer.",
    tone: "action",
    icon: Target,
  },
  {
    label: "Ground block",
    sentence: "Lease research for 3 locations. Cost estimate verified.",
    role: "Adds material with provenance instead of vague context around the goal.",
    tone: "verified",
    icon: Layers3,
  },
  {
    label: "Bridge block",
    sentence: "Funding gap remains $40K. Next move: lender shortlist.",
    role: "Turns diagnosis into a runnable next move rather than another discussion loop.",
    tone: "partial",
    icon: MoveRight,
  },
  {
    label: "Seal block",
    sentence: "Startup cost estimate verified. Receipt sealed Mar 8.",
    role: "Marks the point where a claim survived contact and earned solidity.",
    tone: "verified",
    icon: ReceiptText,
  },
];

const settlementFlow = [
  {
    step: "01",
    title: "Invoice",
    body: "A declaration opens an account with reality. The system frames what would count.",
  },
  {
    step: "02",
    title: "Move",
    body: "The user acts. The box should preserve intention, cost, and chosen direction.",
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
    body: "Trust is earned only after settlement. The object becomes more solid here.",
  },
];

const foundationPalette = [
  {
    token: "Canvas",
    hex: "#0d0e10",
    use: "Whole-app ground and negative space.",
  },
  {
    token: "Shell",
    hex: "#121315",
    use: "Main workbench plane and structural surfaces.",
  },
  {
    token: "Raised",
    hex: "#1b1f24",
    use: "Focused work regions that need separation, not decoration.",
  },
  {
    token: "Action blue",
    hex: "#5ea7ff",
    use: "Identity, active states, selected controls, and the one primary action.",
  },
  {
    token: "Verified",
    hex: "#7fd9a0",
    use: "Settlement succeeded and the proof can bear weight.",
  },
  {
    token: "Partial",
    hex: "#f0bf69",
    use: "Promising, cooling down, or still awaiting stronger contact.",
  },
];

const foundationRules = [
  "Assembly depth is shown through fill, density, and seal marks.",
  "Green, amber, and red never become brand language.",
  "Monoline icons stay in a 16 to 18 px band for routine controls.",
  "Mono is for tags and proof metadata. Sans is for the work itself.",
];

const devicePostures = [
  {
    device: "Phone",
    title: "Field capture and fast orientation",
    cue: "capture -> file -> glance -> move",
    body:
      "The phone should be immediate enough to pull out on the road, take a photo, drop a voice note, and see the current seed without friction.",
  },
  {
    device: "Desktop",
    title: "Deep assembly and proof work",
    cue: "compare -> rewrite -> operate -> inspect",
    body:
      "Desktop earns its density by letting the user compare sources, shape the seed, run Operate, and inspect receipts with more context at once.",
  },
  {
    device: "Shared laws",
    title: "One object across both",
    cue: "same nouns -> same signals -> same box",
    body:
      "The box, seed, receipts, and trust signals should not rename themselves between devices. The posture changes, not the product language.",
  },
];

const navigationSteps = [
  {
    phase: "Capture",
    title: "Take in the world",
    cue: "see -> capture -> file to box",
    body:
      "Phone intake should be immediate and low-friction. A photo, voice note, or pasted link enters the same object the desktop later shapes.",
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

const sourceRows = [
  {
    title: "Roadside storefront photo",
    meta: "captured on phone · image source",
    tone: "unknown",
    signal: "Open",
  },
  {
    title: "Voice memo from the car",
    meta: "speak note · audio source",
    tone: "partial",
    signal: "Queued",
  },
  {
    title: "Operator Sentences",
    meta: "95 blocks · text source",
    tone: "verified",
    signal: "Verified",
  },
  {
    title: "Seed of seeds",
    meta: "working seed · current box",
    tone: "partial",
    signal: "Active",
  },
];

function SignalChip({ tone, children }) {
  return <span className={`${styles.signalChip} ${styles[`signalChip${tone}`]}`}>{children}</span>;
}

function ObjectStateCard({ name, stage, summary, detail, metric, tone }) {
  return (
    <article className={styles.objectStateCard}>
      <div className={styles.objectStateFigure}>
        <div className={`${styles.objectShape} ${styles[`objectShape${stage}`]}`}>
          <div className={`${styles.objectFill} ${styles[`objectFill${stage}`]}`} />
          <div className={styles.objectCore} />
        </div>
      </div>
      <div className={styles.objectStateCopy}>
        <div className={styles.objectStateTop}>
          <span className={styles.kicker}>{name}</span>
          <SignalChip tone={tone}>{metric}</SignalChip>
        </div>
        <h3>{summary}</h3>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function PrimitiveCard({ label, sentence, role, tone, icon: Icon }) {
  return (
    <article className={`${styles.primitiveCard} ${styles[`primitiveCard${tone}`]}`}>
      <div className={styles.primitiveHead}>
        <div className={styles.primitiveIcon}>
          <Icon size={17} />
        </div>
        <span className={styles.kicker}>{label}</span>
      </div>
      <strong>{sentence}</strong>
      <p>{role}</p>
    </article>
  );
}

export default function DesignProposalScreen() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.label}>Proposal v0.2 · code-aware</span>
            <h1>Meaning assembles here.</h1>
            <p>
              A competition-ready Loegos system built from the live code, the intro anchor, and
              the real product theory: operator blocks, settlement logic, and a seed that becomes
              real.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link href="/intro" className={styles.secondaryAction}>
              <ArrowLeft size={16} />
              Back to intro
            </Link>
            <Link href="/workspace" className={styles.primaryAction}>
              Open workspace
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroPoster}>
            <div className={styles.posterTopline}>
              <span>Loegos</span>
              <span>desktop-first</span>
              <span>assembly system</span>
            </div>

            <div className={styles.posterBody}>
              <div className={styles.posterStatement}>
                <span className={styles.kicker}>System thesis</span>
                <h2>Less dashboard. More object.</h2>
                <p>
                  The workspace should not feel like files plus chrome. It should feel like one
                  assembled object gaining reality as sources, operator blocks, and receipts press
                  it into form.
                </p>
                <div className={styles.ruleList}>
                  <span>seed as object</span>
                  <span>blocks as primitives</span>
                  <span>solidity over rainbow state</span>
                  <span>settlement earns trust</span>
                </div>
              </div>

              <div className={styles.posterObjectPanel}>
                <span className={styles.panelEyebrow}>Object preview</span>
                <div className={styles.heroObjectStack}>
                  {objectStates.map((state) => (
                    <ObjectStateCard key={state.name} {...state} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className={styles.heroAside}>
            <div className={styles.asideCard}>
              <span className={styles.kicker}>Competition edge</span>
              <ul className={styles.bulletList}>
                {competitionEdges.map((edge) => (
                  <li key={edge}>{edge}</li>
                ))}
              </ul>
            </div>

            <div className={styles.asideCard}>
              <span className={styles.kicker}>Working sentence</span>
              <h3>Think in the box. Create the assembly. Operate on reality.</h3>
              <p>
                The system should make that loop visible without dragging the deeper coordinate
                system in front of the user, and it should begin out in the world when the user
                captures something worth assembling.
              </p>
            </div>
          </aside>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>System pillars</span>
            <h2>The product only wins if the theory stays visible in the interface</h2>
          </div>

          <div className={styles.pillarGrid}>
            {systemPillars.map((pillar) => (
              <article key={pillar.title} className={styles.pillarCard}>
                <span className={styles.kicker}>{pillar.eyebrow}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>Operator blocks</span>
            <h2>Language becomes a native interaction material</h2>
            <p className={styles.sectionSupport}>
              In Loegos, sentences are not garnish. They are small assembled parts that can be
              carried, staged, rewritten, and pressure-tested.
            </p>
          </div>

          <div className={styles.primitiveGrid}>
            {operatorBlocks.map((block) => (
              <PrimitiveCard key={block.label} {...block} />
            ))}
          </div>

          <div className={styles.chainStrip}>
            <div className={styles.chainHeader}>
              <span className={styles.kicker}>Operator chain</span>
              <Workflow size={16} />
            </div>
            <div className={styles.chainRow}>
              {["Aim", "Ground", "Bridge", "Seal"].map((item, index) => (
                <div key={item} className={styles.chainNode}>
                  <span>{item}</span>
                  {index < 3 ? <MoveRight size={15} /> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>Settlement</span>
            <h2>Trust is a settlement outcome, not a decorative state</h2>
            <p className={styles.sectionSupport}>
              The shell shows compact signals. Rich trust only appears where the user expects proof:
              Operate, receipts, and the seed&apos;s solidifying edge.
            </p>
          </div>

          <div className={styles.settlementGrid}>
            {settlementFlow.map((item) => (
              <article key={item.step} className={styles.settlementCard}>
                <span className={styles.settlementStep}>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>Foundations</span>
            <h2>One visual system, with clear jobs for color, type, and motion</h2>
          </div>

          <div className={styles.foundationGrid}>
            <article className={styles.foundationCard}>
              <span className={styles.kicker}>Palette</span>
              <div className={styles.paletteList}>
                {foundationPalette.map((swatch) => (
                  <div key={swatch.token} className={styles.paletteRow}>
                    <span
                      className={styles.paletteSwatch}
                      style={{ backgroundColor: swatch.hex }}
                      aria-hidden="true"
                    />
                    <div className={styles.paletteCopy}>
                      <strong>{swatch.token}</strong>
                      <p>{swatch.use}</p>
                    </div>
                    <span className={styles.paletteHex}>{swatch.hex}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.foundationCard}>
              <span className={styles.kicker}>System laws</span>
              <ul className={styles.ruleBulletList}>
                {foundationRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </article>

            <article className={styles.foundationCard}>
              <span className={styles.kicker}>Control family</span>
              <div className={styles.controlStack}>
                <div className={styles.buttonRow}>
                  <button type="button" className={styles.primaryButton}>
                    <Sparkles size={16} />
                    Run Operate
                  </button>
                  <button type="button" className={styles.secondaryButton}>
                    <ReceiptText size={16} />
                    Open receipts
                  </button>
                </div>

                <label className={styles.controlLabel}>
                  <span>Seed prompt</span>
                  <input
                    className={styles.inputMock}
                    readOnly
                    value="State the next proof move in one sentence."
                  />
                </label>

                <div className={styles.chipRow}>
                  <SignalChip tone="verified">Verified</SignalChip>
                  <SignalChip tone="partial">Cooling down</SignalChip>
                  <SignalChip tone="unknown">Open</SignalChip>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>Navigation grammar</span>
            <h2>The tool should navigate the way assembly itself moves</h2>
            <p className={styles.sectionSupport}>
              Navigation is not a separate decoration layer. It should follow the same phase logic
              as the work, getting louder or quieter depending on what the user is assembling from
              the first field capture to the sealed receipt.
            </p>
          </div>

          <div className={styles.navigationGrid}>
            {navigationSteps.map(({ phase, title, cue, body, icon: Icon }) => (
              <article key={phase} className={styles.navigationCard}>
                <div className={styles.navigationHead}>
                  <div className={styles.primitiveIcon}>
                    <Icon size={17} />
                  </div>
                  <span className={styles.kicker}>{phase}</span>
                </div>
                <h3>{title}</h3>
                <span className={styles.navigationCue}>{cue}</span>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>Cross-device posture</span>
            <h2>Mobile and desktop should feel equally good, not merely compatible</h2>
            <p className={styles.sectionSupport}>
              Equal quality does not mean identical screens. It means each device gets the right
              version of the assembler tool while preserving one shared object model.
            </p>
          </div>

          <div className={styles.deviceGrid}>
            {devicePostures.map((item) => (
              <article key={item.device} className={styles.deviceCard}>
                <span className={styles.kicker}>{item.device}</span>
                <h3>{item.title}</h3>
                <span className={styles.navigationCue}>{item.cue}</span>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>Workspace proposition</span>
            <h2>The shell should frame the object instead of burying it</h2>
          </div>

          <div className={styles.mockShell}>
            <aside className={styles.mockRail}>
              <div className={styles.mockRailHead}>
                <span className={styles.kicker}>Think</span>
                <button type="button" className={styles.smallButton}>
                  <PanelLeft size={15} />
                  Sources
                </button>
              </div>

              <div className={styles.sourceList}>
                {sourceRows.map((source) => (
                  <article key={source.title} className={styles.sourceRow}>
                    <div>
                      <strong>{source.title}</strong>
                      <p>{source.meta}</p>
                    </div>
                    <SignalChip tone={source.tone}>{source.signal}</SignalChip>
                  </article>
                ))}
              </div>
            </aside>

            <section className={styles.mockCenter}>
              <div className={styles.centerHeader}>
                <div>
                  <span className={styles.kicker}>Create</span>
                  <h3>Current seed</h3>
                </div>
                <button type="button" className={styles.primaryButton}>
                  <NotebookPen size={16} />
                  Refine seed
                </button>
              </div>

              <div className={styles.seedPanel}>
                <div className={styles.seedPanelMeta}>
                  <span>One object, multiple views</span>
                  <SignalChip tone="partial">3 receipts sealed</SignalChip>
                </div>

                <div className={styles.seedPanelBody}>
                  <div className={styles.seedText}>
                    <h4>Open a sourdough bakery in Cobble Hill by Q1.</h4>
                    <p>
                      Lease research for three locations is sealed. Cost estimate verified. Funding
                      gap remains open. The next move is a lender shortlist.
                    </p>
                  </div>

                  <div className={styles.seedObjectMini}>
                    <div className={`${styles.objectShape} ${styles.objectShapegrounded}`}>
                      <div className={`${styles.objectFill} ${styles.objectFillgrounded}`} />
                      <div className={styles.objectCore} />
                    </div>
                  </div>
                </div>

                <div className={styles.seedBlockRow}>
                  <div className={`${styles.inlineBlock} ${styles.inlineBlockaction}`}>
                    <Target size={14} />
                    Aim
                  </div>
                  <div className={`${styles.inlineBlock} ${styles.inlineBlockverified}`}>
                    <Blocks size={14} />
                    Ground
                  </div>
                  <div className={`${styles.inlineBlock} ${styles.inlineBlockpartial}`}>
                    <MoveRight size={14} />
                    Bridge
                  </div>
                </div>
              </div>
            </section>

            <aside className={styles.mockInspector}>
              <div className={styles.inspectorCard}>
                <span className={styles.kicker}>Operate</span>
                <h4>Honest read</h4>
                <p>Show Aim, Ground, Bridge, convergence, and next move without turning it into chat.</p>
                <SignalChip tone="partial">Retry after cooldown</SignalChip>
              </div>

              <div className={styles.inspectorCard}>
                <span className={styles.kicker}>Receipts</span>
                <h4>Proof ledger</h4>
                <p>Each sealed receipt fills the object and leaves behind portable evidence.</p>
                <div className={styles.ledgerRow}>
                  <CheckCircle2 size={15} />
                  Cost estimate sealed
                </div>
                <div className={styles.ledgerRow}>
                  <TriangleAlert size={15} />
                  Funding still open
                </div>
                <div className={styles.ledgerRow}>
                  <Circle size={15} />
                  Permits unknown
                </div>
              </div>
            </aside>
          </div>
        </section>

        <footer className={styles.footer}>
          <div>
            <span className={styles.kicker}>Temporary review surface</span>
            <p>
              This hidden pre-login screen is the live proposal board. It should be disposable once
              the real workspace absorbs the system.
            </p>
          </div>
          <div className={styles.footerActions}>
            <Link href="/intro" className={styles.secondaryAction}>
              View intro
            </Link>
            <Link href="/workspace" className={styles.primaryAction}>
              Back to product
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
