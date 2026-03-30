import { Link } from "react-router-dom";

const protocolSteps = [
  {
    step: "01",
    title: "Declare",
    body: "Start from a real position, not a narrative mood. The document exists to clarify the move you are actually making.",
  },
  {
    step: "02",
    title: "Read the shape",
    body: "Triangle, square, and circle distinguish aim, evidence, and context so interpretation does not masquerade as proof.",
  },
  {
    step: "03",
    title: "Force return",
    body: "A claim remains provisional until the world, another witness, or a receipt interrupts it from the outside.",
  },
  {
    step: "04",
    title: "Seal carefully",
    body: "Nothing is locked for style. Sections become stable only after multiple readers judge them ready to survive contact.",
  },
];

const instrumentRows = [
  {
    name: "GetReceipts",
    role: "Return signal",
    detail: "Proof that the vector touched reality and came back with consequence still attached.",
  },
  {
    name: "Box7",
    role: "Reading instrument",
    detail: "Makes aim, evidence, and context visible at once so position becomes legible before action compounds.",
  },
  {
    name: "PromiseMe",
    role: "Declared aim",
    detail: "The commitment layer. A direction is only real once someone is willing to carry it long enough for return.",
  },
  {
    name: "The Signet",
    role: "Somatic witness",
    detail: "The body as authenticated signal rather than aura, performance, or borrowed certainty.",
  },
];

const roomModes = [
  {
    title: "Declaration",
    body: "The front door should feel like the threshold to a doctrine, not the intro screen to a SaaS product.",
  },
  {
    title: "Evidence",
    body: "Every supporting surface has to justify its existence. Ornament only stays if it clarifies the protocol.",
  },
  {
    title: "Return",
    body: "The room keeps the reader close to consequence: identity, signals, carry, annotations, and seal-readiness.",
  },
];

const roomNotes = [
  "Passphrase-gated entry.",
  "Named reading, not anonymous browsing.",
  "Signals, tags, and discussion attached to sections.",
  "A document that can be argued with before it is sealed.",
];

const shapeLegend = [
  { label: "Triangle", symbol: "△", tone: "Strengthens aim", color: "var(--color-triangle)" },
  { label: "Square", symbol: "□", tone: "Needs evidence", color: "var(--color-square)" },
  { label: "Circle", symbol: "○", tone: "Needs context", color: "var(--color-circle)" },
];

export default function LandingPage({ phase, reader }) {
  const returningReader = phase === "doc" && reader;

  return (
    <main className="bg-paper text-ink-secondary">
      <section className="relative overflow-hidden border-b border-border-warm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,_rgba(180,90,56,0.13),_transparent_26%),radial-gradient(circle_at_82%_18%,_rgba(84,108,119,0.09),_transparent_24%),linear-gradient(135deg,_rgba(255,255,255,0.78),_rgba(255,255,255,0.18)_48%,_rgba(232,220,203,0.5))]" />
        <div className="absolute inset-y-0 left-0 w-[46%] bg-[linear-gradient(90deg,_rgba(255,255,255,0.24),_transparent)]" />
        <div className="absolute right-[-12rem] top-20 h-[28rem] w-[28rem] rounded-full border border-border-warm/70 opacity-70" />

        <div className="relative mx-auto max-w-[1480px] px-5 pb-14 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8 md:pb-18 md:pt-8 xl:px-14 xl:pb-22">
          <header className="flex items-center justify-between border-b border-border-warm/90 pb-5 md:pb-6">
            <div>
              <div className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-ink-muted">
                Lakin.ai
              </div>
              <div className="mt-1 font-sans text-[0.96rem] tracking-[0.01em] text-ink-secondary">
                Assembled Reality
              </div>
            </div>

            <nav className="hidden items-center gap-7 md:flex">
              <a href="#claim" className="font-sans text-[0.8rem] uppercase tracking-[0.2em] text-ink-muted transition-colors duration-150 hover:text-ink">
                Claim
              </a>
              <a href="#protocol" className="font-sans text-[0.8rem] uppercase tracking-[0.2em] text-ink-muted transition-colors duration-150 hover:text-ink">
                Protocol
              </a>
              <a href="#instruments" className="font-sans text-[0.8rem] uppercase tracking-[0.2em] text-ink-muted transition-colors duration-150 hover:text-ink">
                Instruments
              </a>
              <Link
                to="/document"
                className="inline-flex min-h-11 items-center rounded-full border border-border-dark bg-paper-soft/90 px-5 font-sans text-[0.8rem] font-medium uppercase tracking-[0.18em] text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-ink hover:bg-paper-soft"
              >
                {returningReader ? `Return as ${reader}` : "Open document"}
              </Link>
            </nav>
          </header>

          <div className="grid gap-10 pt-10 md:gap-14 md:pt-14 xl:grid-cols-[minmax(0,1.05fr)_500px] xl:items-start">
            <div className="max-w-[820px]">
              <div className="max-w-[14rem] font-sans text-[0.82rem] font-semibold uppercase tracking-[0.28em] text-triangle md:max-w-none">
                Founding document of Lakin.ai
              </div>

              <h1 className="mt-5 max-w-[10ch] font-serif text-[clamp(4.5rem,10vw,8.6rem)] leading-[0.86] tracking-[-0.055em] text-ink">
                Assembled Reality
              </h1>

              <p className="mt-5 max-w-[18ch] font-serif text-[clamp(1.65rem,2.8vw,2.5rem)] leading-[1.08] text-ink-secondary">
                The process by which Lakin.ai coordinates intelligence.
              </p>

              <p className="mt-6 max-w-[38rem] text-[1.05rem] leading-[1.9] text-ink-tertiary md:text-[1.12rem]">
                This should not read like a startup homepage. It is the threshold to a private reading room where declaration, evidence, story, and return are held on the same surface long enough to be tested.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/document"
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-ink px-8 font-sans text-[0.88rem] font-medium uppercase tracking-[0.22em] text-paper-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(20,17,15,0.22)]"
                >
                  Enter the Reading Room
                </Link>
                <a
                  href="#claim"
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-border-dark bg-paper-soft/70 px-8 font-sans text-[0.92rem] font-medium text-ink transition-colors duration-150 hover:border-ink hover:bg-paper-soft"
                >
                  Read the founding claim
                </a>
              </div>

              <dl className="mt-8 grid gap-0 overflow-hidden rounded-[1.7rem] border border-border-dark/65 bg-paper-soft/92 shadow-[0_16px_42px_rgba(27,24,21,0.05)] md:grid-cols-2 xl:grid-cols-4">
                <Meta label="Status" value="Founding document · v1.0" />
                <Meta label="Mode" value="Private reading instrument" />
                <Meta label="Audience" value="Partners and invited team" />
                <Meta label="Return" value={returningReader ? `Welcome back, ${reader}` : "Passphrase required"} />
              </dl>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {roomModes.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[1.5rem] border border-border-warm bg-white/35 px-5 py-5 shadow-[0_12px_32px_rgba(27,24,21,0.03)] backdrop-blur-sm"
                  >
                    <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                      {item.title}
                    </div>
                    <p className="mt-3 text-[0.98rem] leading-[1.75] text-ink-secondary">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="xl:pt-2">
              <div className="rounded-[2rem] border border-border-dark/75 bg-paper-soft/96 p-5 shadow-[0_32px_100px_rgba(27,24,21,0.08)] md:p-7">
                <div className="flex items-start justify-between gap-4 border-b border-border-warm pb-4">
                  <div>
                    <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                      Reading dossier
                    </div>
                    <div className="mt-2 max-w-[16rem] font-serif text-[1.8rem] leading-[1.02] text-ink">
                      The document is the instrument. The interface should behave like one.
                    </div>
                  </div>
                  <div className="hidden rounded-full border border-border px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-muted md:block">
                    Private room
                  </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_188px] xl:grid-cols-1">
                  <div className="rounded-[1.7rem] border border-border-warm bg-[linear-gradient(180deg,_rgba(255,255,255,0.7),_rgba(237,226,211,0.55))] p-5">
                    <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-triangle">
                      Founding claim
                    </div>
                    <p className="mt-4 max-w-[15ch] font-serif text-[2.4rem] leading-[0.96] tracking-[-0.03em] text-ink">
                      Coherence without contact is the failure mode.
                    </p>
                    <p className="mt-4 max-w-[24rem] text-[0.98rem] leading-[1.8] text-ink-tertiary">
                      The system is built so the story does not get the last word before reality, witness, or cost arrives.
                    </p>
                  </div>

                  <div className="grid gap-5 lg:content-start xl:grid-cols-[minmax(0,1fr)_188px]">
                    <ShapeField />

                    <div className="rounded-[1.6rem] border border-border-warm bg-surface/70 p-5">
                      <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                        Shape legend
                      </div>
                      <div className="mt-4 space-y-3">
                        {shapeLegend.map((shape) => (
                          <div key={shape.label} className="border-b border-border-warm pb-3 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <span className="font-serif text-[1.4rem]" style={{ color: shape.color }}>
                                {shape.symbol}
                              </span>
                              <span className="font-serif text-[1.2rem] leading-none text-ink">
                                {shape.label}
                              </span>
                            </div>
                            <div className="mt-1 font-sans text-[0.8rem] uppercase tracking-[0.18em] text-ink-muted">
                              {shape.tone}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.6rem] border border-border-dark/60 bg-ink px-5 py-5 text-paper-soft">
                  <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-paper-deep/70">
                    What happens inside
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {roomNotes.map((note) => (
                      <div key={note} className="flex items-start gap-3">
                        <span className="mt-[0.42rem] h-1.5 w-1.5 rounded-full bg-triangle" />
                        <p className="text-[0.96rem] leading-[1.7] text-paper-deep">
                          {note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="claim" className="px-5 py-18 md:px-8 md:py-22 xl:px-14">
        <div className="mx-auto grid max-w-[1360px] gap-10 xl:grid-cols-[minmax(0,1.1fr)_380px] xl:gap-16">
          <div>
            <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-triangle">
              Founding claim
            </div>
            <blockquote className="mt-5 max-w-[12ch] font-serif text-[clamp(3rem,5.5vw,6rem)] leading-[0.92] tracking-[-0.04em] text-ink">
              The universal failure mode of coordinating intelligences is coherence without contact.
            </blockquote>
          </div>

          <div className="flex flex-col justify-end gap-5 border-t border-border-warm pt-6 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
            <p className="text-[1.03rem] leading-[1.9] text-ink-tertiary">
              Fluency can hide drift. Agreement can hide delusion. This architecture is designed so reality returns before elegance hardens into false closure.
            </p>
            <p className="text-[1.03rem] leading-[1.9] text-ink-tertiary">
              The human declares, chooses, and interprets. The AI structures, compares, remembers, and audits. Reality closes.
            </p>
            <div className="rounded-[1.4rem] border border-border-dark/65 bg-paper-soft px-5 py-4">
              <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                Reader stance
              </div>
              <p className="mt-2 font-serif text-[1.45rem] leading-[1.2] text-ink">
                Wipe the story. Keep the receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="protocol" className="border-y border-border-warm bg-surface-warm px-5 py-18 md:px-8 md:py-22 xl:px-14">
        <div className="mx-auto max-w-[1360px]">
          <div className="max-w-[760px]">
            <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-square">
              Protocol snapshot
            </div>
            <h2 className="mt-4 max-w-[12ch] font-serif text-[clamp(2.6rem,4.8vw,5rem)] leading-[0.95] tracking-[-0.04em] text-ink">
              A move only matters after the world answers back.
            </h2>
          </div>

          <div className="mt-12 grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-16">
            <ol className="grid gap-0">
              {protocolSteps.map((item) => (
                <li
                  key={item.step}
                  className="grid gap-3 border-b border-border-warm py-5 md:grid-cols-[82px_minmax(0,1fr)] md:gap-6"
                >
                  <div className="font-mono text-[0.82rem] uppercase tracking-[0.18em] text-ink-muted">
                    {item.step}
                  </div>
                  <div>
                    <div className="font-serif text-[1.85rem] leading-none text-ink">
                      {item.title}
                    </div>
                    <p className="mt-3 max-w-[41rem] text-[1rem] leading-[1.85] text-ink-tertiary">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <aside className="rounded-[1.8rem] border border-border-dark/65 bg-paper-soft/88 p-6 shadow-[0_18px_45px_rgba(27,24,21,0.06)]">
              <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                Inside the room
              </div>
              <div className="mt-4 space-y-4">
                <ProtocolNote
                  title="Signals"
                  body="Readers mark sections with triangle, square, or circle to show where the text strengthens, weakens, or needs witness."
                />
                <ProtocolNote
                  title="Tags"
                  body="Sections can be marked load-bearing, needs work, open for debate, or ready to seal. Seal requires multiple witnesses."
                />
                <ProtocolNote
                  title="Carry"
                  body="Passages worth keeping move into a carry list so the reading room produces durable lines rather than ambient sentiment."
                />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="instruments" className="px-5 py-18 md:px-8 md:py-22 xl:px-14">
        <div className="mx-auto max-w-[1360px]">
          <div className="flex flex-col gap-5 border-b border-border-warm pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-circle">
                Four instruments
              </div>
              <h2 className="mt-4 max-w-[11ch] font-serif text-[clamp(2.6rem,4.8vw,5rem)] leading-[0.95] tracking-[-0.04em] text-ink">
                Different surfaces. One protocol.
              </h2>
            </div>
            <p className="max-w-[30rem] text-[1rem] leading-[1.85] text-ink-tertiary">
              The vocabulary can stay hidden. The architecture should still be felt in the experience: declare, test, return, revise.
            </p>
          </div>

          <div className="grid gap-0 md:grid-cols-2 2xl:grid-cols-4">
            {instrumentRows.map((row, index) => (
              <article
                key={row.name}
                className={`border-border-warm py-8 md:py-10 2xl:px-7 ${
                  index > 0 ? "border-t md:border-t-0" : ""
                } ${index % 2 === 1 ? "md:border-l md:pl-8" : ""} ${index > 1 ? "md:border-t md:pt-10 2xl:border-t-0" : ""} ${index > 0 && index < 4 ? "2xl:border-l 2xl:pl-8" : ""}`}
              >
                <div className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-ink-muted">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="mt-3 font-serif text-[1.9rem] leading-none text-ink">
                  {row.name}
                </div>
                <div className="mt-3 font-sans text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                  {row.role}
                </div>
                <p className="mt-4 max-w-[22rem] text-[1rem] leading-[1.85] text-ink-tertiary">
                  {row.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border-dark/70 bg-surface-night px-5 py-18 text-paper-soft md:px-8 md:py-22 xl:px-14">
        <div className="mx-auto grid max-w-[1360px] gap-10 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
          <div>
            <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-paper-deep/65">
              Invitation to read
            </div>
            <h2 className="mt-5 max-w-[10ch] font-serif text-[clamp(2.8rem,5vw,5.8rem)] leading-[0.94] tracking-[-0.04em] text-paper-soft">
              Enter the room where the document can answer back.
            </h2>
            <p className="mt-6 max-w-[38rem] text-[1.04rem] leading-[1.9] text-paper-deep">
              Access is passphrase-gated. Reader identity stays attached to signals, annotations, and carried passages. This is collaborative reading with consequence, not anonymous consumption.
            </p>
          </div>

          <div className="rounded-[1.8rem] border border-white/12 bg-white/4 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-paper-deep/60">
              Entry
            </div>
            <div className="mt-3 font-serif text-[1.85rem] leading-[1.04] text-paper-soft">
              Begin at the threshold, then move into the reading room.
            </div>
            <div className="mt-6 space-y-3">
              <Link
                to="/document"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-paper-soft px-7 font-sans text-[0.88rem] font-medium uppercase tracking-[0.22em] text-ink transition-transform duration-150 hover:-translate-y-0.5"
              >
                Enter the Reading Room
              </Link>
              <div className="font-sans text-sm text-paper-deep/72">
                {returningReader ? `Reader recognized: ${reader}` : "Passphrase required on arrival"}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Meta({ label, value }) {
  return (
    <div className="border-t border-border-warm px-5 py-4 first:border-t-0 md:border-t-0 md:border-l md:first:border-l-0 md:px-6">
      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-2 text-[0.98rem] leading-[1.65] text-ink-secondary">
        {value}
      </dd>
    </div>
  );
}

function ProtocolNote({ title, body }) {
  return (
    <div className="border-b border-border-warm pb-4 last:border-b-0 last:pb-0">
      <div className="font-serif text-[1.35rem] leading-none text-ink">
        {title}
      </div>
      <p className="mt-2 text-[0.98rem] leading-[1.75] text-ink-tertiary">
        {body}
      </p>
    </div>
  );
}

function ShapeField() {
  return (
    <div className="relative min-h-[270px] overflow-hidden rounded-[1.6rem] border border-border-warm bg-[linear-gradient(180deg,_rgba(255,255,255,0.66),_rgba(243,235,223,0.78))] p-5">
      <div className="absolute left-[8%] top-[10%] h-[70%] w-[70%] rounded-full border border-border-dark/45" />
      <div className="absolute left-[18%] top-[18%] h-[34%] w-[34%] rotate-[18deg] border border-square/65 bg-square/6" />
      <div className="absolute bottom-[16%] left-[16%] h-0 w-0 border-l-[74px] border-r-[74px] border-b-[128px] border-l-transparent border-r-transparent border-b-triangle/20 md:border-l-[82px] md:border-r-[82px] md:border-b-[142px]" />
      <div className="absolute right-[14%] top-[26%] h-[26%] w-[26%] rounded-full border border-circle/75 bg-circle/7" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
              Geometry
            </div>
            <p className="mt-2 max-w-[14rem] font-serif text-[1.25rem] leading-[1.25] text-ink">
              Declaration, evidence, and context held in tension on the same field.
            </p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-4">
          <p className="max-w-[14rem] font-sans text-[0.78rem] uppercase tracking-[0.2em] text-ink-muted">
            Triangle · Square · Circle
          </p>
          <div className="text-right font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-muted">
            <div>Declaration</div>
            <div>Return</div>
            <div>Seal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
