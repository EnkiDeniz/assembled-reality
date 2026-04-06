import Link from "next/link";
import AssemblyLane from "@/components/AssemblyLane";
import {
  AssembledCard,
  BoxMetric,
  ConvergenceBar,
  OperatorBlock,
  ShapeNav,
  buildStaticShapeNav,
} from "@/components/LoegosSystem";
import PublicFooterLinks from "@/components/PublicFooterLinks";
import { publicSite } from "@/lib/public-site";

function SeedCard({ title, body }) {
  const normalizedTitle = String(title || "").trim().toLowerCase();
  const shapeKey =
    normalizedTitle === "aim"
      ? "aim"
      : normalizedTitle === "sealed"
        ? "seal"
        : "reality";

  return (
    <OperatorBlock shapeKey={shapeKey} label={title} body={body} />
  );
}

function SourceGroup({ group }) {
  return (
    <section className="self-assembly-group" key={group.id}>
      <header className="self-assembly-group__header">
        <span className="self-assembly-group__label">{group.label}</span>
        <strong>{group.sources.length} sources</strong>
      </header>

      <div className="self-assembly-source-grid">
        {group.sources.map((source) => (
          <article key={source.id} className="self-assembly-source-card">
            <div className="self-assembly-source-card__topline">
              <h3>{source.title}</h3>
              <span>{source.sectionCount} sections</span>
            </div>
            <p>{source.excerpt}</p>
            <div className="self-assembly-source-card__meta">
              {source.sourceClassificationLabel ? (
                <span>{source.sourceClassificationLabel}</span>
              ) : null}
              <span>{source.evidenceBasisLabel}</span>
              <span>{source.chronologyAuthorityLabel}</span>
              {source.historyKind ? <span>{source.historyKind}</span> : null}
            </div>
            <p className="self-assembly-source-card__path">{source.relativePath}</p>
            <p className="self-assembly-source-card__trust">{source.trustProfile.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdapterGrid({ adapters = [] }) {
  return (
    <div className="self-assembly-adapter-grid">
      {adapters.map((adapter) => (
        <article key={adapter.historyKind} className="self-assembly-adapter-card">
          <div className="self-assembly-adapter-card__topline">
            <h3>{adapter.label}</h3>
            <span>{adapter.status}</span>
          </div>
          <p>{adapter.description}</p>
          <p className="self-assembly-adapter-card__meta">
            {adapter.historyKind} · {adapter.platform}
          </p>
        </article>
      ))}
    </div>
  );
}

export default function SelfAssemblyPage({ page, demo, jsonLd = null }) {
  const seedCards = [
    { title: "Aim", body: demo.seed.aim },
    { title: "What's here", body: demo.seed.whatsHere },
    { title: "The gap", body: demo.seed.gap },
    { title: "Sealed", body: demo.seed.sealed },
  ];

  return (
    <main className="loegos-public-document">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      <section className="loegos-public-document__shell">
        <section className="loegos-public-document__panel">
          <div className="loegos-public-document__masthead">
            <div className="loegos-public-document__brandline">
              <Link href="/" className="loegos-wordmark">
                {publicSite.mark} <span className="loegos-wordmark__sub">self assembly</span>
              </Link>
              <span className="loegos-thesis">Navigate by shape. Act by verb.</span>
            </div>
            <div className="loegos-public-document__hero">
              <span className="loegos-kicker">{page.label}</span>
              <h1 className="loegos-display">{page.title}</h1>
              <p className="loegos-public-document__lede">
                {page.lede} The seven-image chronology stays primary, and imported Git history
                remains a corroborating witness beneath the same lane grammar.
              </p>
            </div>
          </div>

          <ShapeNav items={buildStaticShapeNav("seal")} activeShape="seal" compact />

          <section className="loegos-public-document__section">
            <div className="loegos-workspace-panel__head">
              <div className="loegos-workspace-panel__copy">
                <span className="loegos-workspace-panel__eyebrow">Seed of seeds</span>
                <h2 className="loegos-workspace-panel__title">Current live assembly shape</h2>
              </div>
              <ConvergenceBar left={2} middle={3} right={4} />
            </div>
            <div className="self-assembly-seed-grid">
              {seedCards.map((card) => (
                <SeedCard key={card.title} title={card.title} body={card.body} />
              ))}
            </div>
          </section>

          <section className="loegos-public-document__section">
            <div className="loegos-workspace-panel__head">
              <div className="loegos-workspace-panel__copy">
                <span className="loegos-workspace-panel__eyebrow">Assembly lane</span>
                <h2 className="loegos-workspace-panel__title">One lane, one box, one truth grammar</h2>
              </div>
            </div>
            <p className="loegos-workspace-panel__body">
              The public demo now renders the same lane entry shape and certainty grammar as the
              workspace. The chronology stays curated, but the box is described in the same
              evidence language.
            </p>
            <AssemblyLane viewModel={demo.assemblyLane} />
          </section>

          <section className="loegos-public-document__section">
            <div className="loegos-workspace-panel__head">
              <div className="loegos-workspace-panel__copy">
                <span className="loegos-workspace-panel__eyebrow">History adapters</span>
                <h2 className="loegos-workspace-panel__title">Imported exports first, live connectors later</h2>
              </div>
            </div>
            <p className="loegos-workspace-panel__body">
              This demo implements the shared normalization contract through Git history now and
              keeps the same shape ready for future email, chat, calendar, task, and revision
              exports.
            </p>
            <AdapterGrid adapters={demo.history.supportedExports} />
            {demo.history.unclusteredCount > 0 ? (
              <p className="loegos-workspace-panel__body">
                {demo.history.unclusteredCount} commits remain outside the curated public clusters
                and stay in the underlying history source rather than flattening the page into a
                raw log.
              </p>
            ) : null}
          </section>

          <section className="loegos-public-document__section">
            <div className="loegos-workspace-panel__head">
              <div className="loegos-workspace-panel__copy">
                <span className="loegos-workspace-panel__eyebrow">Source library</span>
                <h2 className="loegos-workspace-panel__title">Grouped by role inside the box</h2>
              </div>
            </div>
            <p className="loegos-workspace-panel__body">
              The demo keeps narrative evidence, theory, product spec, and platform history in the
              same box while preserving provenance and trust hints for each source.
            </p>
            <div className="loegos-box-home__metrics">
              <BoxMetric
                label="Source groups"
                value={demo.sourceGroups.length}
                detail="Narrative, theory, product, and platform history stay distinct."
              />
              <BoxMetric
                label="Supported exports"
                value={demo.history.supportedExports.length}
                detail="The adapter model is shared across future imports."
              />
              <BoxMetric
                label="Chronology"
                value="7"
                detail="The seven-image chronology stays primary."
              />
              <BoxMetric
                label="Settlement"
                value="Proof"
                detail="Proof remains visible as proof, not as decoration."
              />
            </div>
            <div className="self-assembly-groups">
              {demo.sourceGroups.map((group) => (
                <SourceGroup key={group.id} group={group} />
              ))}
            </div>
          </section>

          <section className="loegos-public-document__section">
            <AssembledCard
              shapeKey="seal"
              label="Public proof"
              title="The demo bridges philosophy to product behavior."
              body="This route is not marketing copy with a different skin. It shows the same object grammar the authenticated workspace uses when it turns sources into portable proof."
              detail="Public routes and app routes now share the same token, shape, signal, and settlement logic."
              signal="Verified"
              signalTone="clear"
              stageCount={6}
              footer="Self assembly demo"
            />
          </section>
          <footer className="loegos-public-document__footer">
            <p>{publicSite.actionLine}</p>
            <PublicFooterLinks align="start" />
          </footer>
        </section>
      </section>
    </main>
  );
}
