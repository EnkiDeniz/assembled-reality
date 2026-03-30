import { Link } from "react-router-dom";

const protocolSteps = [
  {
    step: "0",
    title: "Arrive",
    body: "Begin from actual position, not narrative momentum. Presence comes before axis selection.",
  },
  {
    step: "1",
    title: "Set shape",
    body: "Name aim, evidence, and story before compute begins. Consent before compute.",
  },
  {
    step: "3",
    title: "Test",
    body: "Force world-return quickly. Five minutes or it is fantasy.",
  },
  {
    step: "5",
    title: "Seal",
    body: "Only lock what survives contact. Agreement without return does not count.",
  },
];

const instruments = [
  {
    name: "GetReceipts",
    role: "Return signal layer",
    detail: "Proof that a vector touched reality. The ledger that authorizes the next move.",
  },
  {
    name: "Box7",
    role: "Reading instrument",
    detail: "Makes aim, story, and reality visible at once so position becomes legible.",
  },
  {
    name: "PromiseMe",
    role: "Declared aim",
    detail: "A commitment you carry long enough for consequence to answer back.",
  },
  {
    name: "The Signet",
    role: "Somatic layer",
    detail: "The body as signal, not oracle. Authentication with consequence still attached.",
  },
];

const shapes = [
  { label: "Triangle", meaning: "Strengthens aim", symbol: "△", color: "var(--color-triangle)" },
  { label: "Square", meaning: "Needs evidence", symbol: "□", color: "var(--color-square)" },
  { label: "Circle", meaning: "Needs context", symbol: "○", color: "var(--color-circle)" },
];

export default function LandingPage({ phase, reader }) {
  const returningReader = phase === "doc" && reader;

  return (
    <main className="bg-paper text-ink-secondary">
      <section className="relative isolate min-h-[100svh] overflow-hidden border-b border-border-warm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(180,90,56,0.16),_transparent_36%),radial-gradient(circle_at_80%_18%,_rgba(84,108,119,0.12),_transparent_30%),radial-gradient(circle_at_68%_78%,_rgba(139,116,66,0.14),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.4),_rgba(255,255,255,0))]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,_rgba(255,255,255,0.62),_transparent)]" />

        <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10 md:py-7 lg:px-14">
          <div>
            <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
              Lakin.ai
            </div>
            <div className="font-sans text-sm text-ink-tertiary">
              Assembled Reality
            </div>
          </div>
          <Link
            to="/document"
            className="inline-flex min-h-11 items-center rounded-full border border-border-dark/70 bg-paper-soft/85 px-5 text-sm font-medium text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-paper-soft"
          >
            Enter the Reading Room
          </Link>
        </header>

        <div className="relative z-10 grid min-h-[calc(100svh-88px)] items-end gap-14 px-6 pb-12 pt-10 md:px-10 md:pb-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.9fr)] lg:px-14 lg:pb-18 lg:pt-4">
          <div className="max-w-[760px]">
            <div className="animate-rise space-y-6">
              <p className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-triangle">
                Founding document of Lakin.ai
              </p>
              <h1 className="max-w-[9ch] font-serif text-[clamp(4.3rem,9vw,8.8rem)] leading-[0.9] tracking-[-0.04em] text-ink">
                Assembled Reality
              </h1>
              <p className="max-w-[33rem] font-serif text-[clamp(1.3rem,2.3vw,2rem)] leading-[1.18] text-ink-secondary">
                The process by which Lakin.ai coordinates intelligence.
              </p>
              <p className="max-w-[34rem] text-[1rem] leading-[1.85] text-ink-tertiary md:text-[1.05rem]">
                A private reading room for partners and invited collaborators. This front door is not a pitch deck. It is the threshold to the document that defines how declaration, evidence, story, and return are held together.
              </p>
            </div>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to="/document"
                className="inline-flex min-h-13 items-center justify-center rounded-full bg-ink px-7 text-sm font-medium tracking-[0.08em] text-paper-soft uppercase transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(27,24,21,0.2)]"
              >
                Enter the Reading Room
              </Link>
              <a
                href="#claim"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-border-dark/80 px-7 text-sm font-medium text-ink transition-colors duration-200 hover:border-ink"
              >
                Read the claim
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-border-warm pt-5">
              <Meta label="Status" value="Founding document · v1.0" />
              <Meta label="Mode" value="Private reading instrument" />
              <Meta label="Audience" value="Partners and invited team" />
              {returningReader && <Meta label="Return" value={`Welcome back, ${reader}`} />}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] pb-4 lg:pb-10">
            <div className="relative aspect-[0.92] animate-fade-in">
              <div className="absolute inset-[6%] rounded-full border border-border-dark/60 bg-[radial-gradient(circle,_rgba(255,255,255,0.42),_rgba(255,255,255,0)_66%)] shadow-[0_0_0_1px_rgba(255,255,255,0.25)] animate-float-slow" />
              <div className="absolute left-[18%] top-[12%] h-[36%] w-[36%] rotate-[14deg] border border-square/55 bg-[linear-gradient(135deg,_rgba(84,108,119,0.1),_rgba(255,255,255,0.02))] shadow-[0_18px_50px_rgba(84,108,119,0.12)] animate-drift" />
              <div className="absolute bottom-[14%] left-[8%] h-0 w-0 border-l-[92px] border-r-[92px] border-b-[160px] border-l-transparent border-r-transparent border-b-triangle/18 drop-shadow-[0_22px_38px_rgba(180,90,56,0.14)] md:border-l-[110px] md:border-r-[110px] md:border-b-[188px]" />
              <div className="absolute right-[10%] top-[20%] h-[27%] w-[27%] rounded-full border border-circle/70 bg-[radial-gradient(circle,_rgba(139,116,66,0.18),_rgba(255,255,255,0)_70%)] animate-float-slow [animation-delay:1.2s]" />
              <div className="absolute inset-x-[14%] bottom-[12%] border-t border-border-dark/60 pt-5">
                <div className="flex items-start justify-between gap-5">
                  <div className="max-w-[15rem]">
                    <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                      Founding claim
                    </p>
                    <p className="mt-2 font-serif text-[1.28rem] leading-[1.25] text-ink">
                      Coherence without contact is the failure mode.
                    </p>
                  </div>
                  <div className="pt-1 text-right font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-muted">
                    <div>Triangle</div>
                    <div>Square</div>
                    <div>Circle</div>
                  </div>
                </div>
              </div>
              <div className="absolute right-0 top-[6%] text-right font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-muted">
                <div>Declaration</div>
                <div>Return</div>
                <div>Seal</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="claim" className="px-6 py-18 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.72fr)] lg:gap-16">
          <div>
            <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-triangle">
              The founding claim
            </div>
            <blockquote className="mt-5 max-w-[14ch] font-serif text-[clamp(2.7rem,5vw,5.5rem)] leading-[0.97] tracking-[-0.03em] text-ink">
              The universal failure mode of coordinating intelligences is coherence without contact.
            </blockquote>
          </div>
          <div className="flex flex-col justify-end gap-5 border-t border-border-warm pt-6 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
            <p className="text-[1rem] leading-[1.9] text-ink-tertiary">
              Fluency can hide drift. Agreement can hide delusion. The architecture is designed so reality returns and interrupts the story before the story hardens into false closure.
            </p>
            <p className="text-[1rem] leading-[1.9] text-ink-tertiary">
              The human declares, chooses, and interprets. The AI structures, compares, remembers, and audits. Reality closes.
            </p>
            <p className="font-sans text-sm uppercase tracking-[0.18em] text-ink-muted">
              Wipe the story. Keep the receipts.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border-warm bg-surface-warm px-6 py-18 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="max-w-[720px]">
            <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-square">
              Protocol snapshot
            </div>
            <h2 className="mt-4 max-w-[12ch] font-serif text-[clamp(2.4rem,4.4vw,4.5rem)] leading-[0.98] tracking-[-0.03em] text-ink">
              A move only matters after the world answers back.
            </h2>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
            <ol className="grid gap-5">
              {protocolSteps.map(({ step, title, body }) => (
                <li key={step} className="grid gap-3 border-b border-border-warm py-4 md:grid-cols-[64px_minmax(0,1fr)] md:gap-6">
                  <div className="font-mono text-[0.78rem] uppercase tracking-[0.18em] text-ink-muted">
                    Step {step}
                  </div>
                  <div>
                    <div className="font-serif text-[1.65rem] leading-none text-ink">
                      {title}
                    </div>
                    <p className="mt-2 max-w-[38rem] text-[1rem] leading-[1.8] text-ink-tertiary">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="space-y-5 border-t border-border-warm pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                The three shapes
              </div>
              {shapes.map((shape) => (
                <div key={shape.label} className="border-b border-border-warm pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-[1.5rem]" style={{ color: shape.color }}>
                      {shape.symbol}
                    </span>
                    <span className="font-serif text-[1.45rem] text-ink">
                      {shape.label}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.96rem] leading-[1.8] text-ink-tertiary">
                    {shape.meaning}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-18 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col gap-5 border-b border-border-warm pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-circle">
                Four instruments
              </div>
              <h2 className="mt-4 max-w-[11ch] font-serif text-[clamp(2.4rem,4.4vw,4.5rem)] leading-[0.98] tracking-[-0.03em] text-ink">
                Different surfaces. One protocol.
              </h2>
            </div>
            <p className="max-w-[28rem] text-[1rem] leading-[1.8] text-ink-tertiary">
              Nobody needs to know the vocabulary to feel the architecture working. Use the instruments long enough and the pattern becomes legible.
            </p>
          </div>

          <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4">
            {instruments.map((instrument, index) => (
              <article
                key={instrument.name}
                className={`py-8 ${index > 0 ? "border-t border-border-warm md:border-t-0" : ""} md:py-10 xl:border-l xl:border-t-0 xl:pl-8 ${index % 2 === 1 ? "md:pl-8" : ""}`}
              >
                <div className="font-serif text-[1.7rem] leading-none text-ink">
                  {instrument.name}
                </div>
                <div className="mt-3 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                  {instrument.role}
                </div>
                <p className="mt-4 max-w-[20rem] text-[1rem] leading-[1.85] text-ink-tertiary">
                  {instrument.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border-warm bg-[linear-gradient(180deg,_rgba(255,255,255,0.58),_rgba(255,255,255,0.18)),linear-gradient(135deg,_rgba(180,90,56,0.08),_rgba(84,108,119,0.05)_45%,_rgba(139,116,66,0.08))] px-6 py-18 md:px-10 md:py-24 lg:px-14">
        <div className="absolute left-[-10%] top-6 h-40 w-40 rounded-full border border-border-warm opacity-60" />
        <div className="absolute bottom-[-6%] right-[8%] h-56 w-56 rotate-12 border border-border-dark/55 opacity-35" />
        <div className="relative mx-auto max-w-[980px] text-center">
          <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
            Invitation to read
          </div>
          <h2 className="mt-5 font-serif text-[clamp(2.6rem,5vw,5rem)] leading-[0.98] tracking-[-0.04em] text-ink">
            Enter the room where the document can answer back.
          </h2>
          <p className="mx-auto mt-6 max-w-[36rem] text-[1.02rem] leading-[1.9] text-ink-tertiary">
            Access is passphrase-gated. Reader identity stays attached to every signal, annotation, and carried passage. This is not anonymous browsing. It is collaborative reading with consequence.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/document"
              className="inline-flex min-h-13 items-center justify-center rounded-full bg-ink px-7 text-sm font-medium tracking-[0.08em] text-paper-soft uppercase transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(27,24,21,0.2)]"
            >
              Enter the Reading Room
            </Link>
            <p className="font-sans text-sm text-ink-muted">
              {returningReader ? `Signed in as ${reader}` : "Passphrase required on arrival"}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </div>
      <div className="mt-1 text-sm text-ink-secondary">
        {value}
      </div>
    </div>
  );
}
