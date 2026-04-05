import Link from "next/link";
import AssemblyLane from "@/components/AssemblyLane";
import PublicFooterLinks from "@/components/PublicFooterLinks";
import { publicSite } from "@/lib/public-site";

function SeedCard({ title, body }) {
  return (
    <article className="self-assembly-seed-card">
      <span className="self-assembly-seed-card__label">{title}</span>
      <p>{body}</p>
    </article>
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
    <main className="self-assembly-page">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      <section className="self-assembly-page__shell">
        <div className="self-assembly-page__topbar">
          <Link href="/" className="self-assembly-page__home-link">
            {publicSite.mark}
          </Link>
        </div>

        <header className="self-assembly-page__preface">
          <span className="self-assembly-page__label">{page.label}</span>
          <h1 className="self-assembly-page__title">{page.title}</h1>
          <p className="self-assembly-page__lede">
            {page.lede} The seven-image chronology stays primary, and imported Git history remains a
            corroborating witness beneath the same lane grammar.
          </p>
        </header>

        <section className="self-assembly-section">
          <div className="self-assembly-section__header">
            <span>Seed of seeds</span>
            <strong>Current live assembly shape</strong>
          </div>
          <div className="self-assembly-seed-grid">
            {seedCards.map((card) => (
              <SeedCard key={card.title} title={card.title} body={card.body} />
            ))}
          </div>
        </section>

        <section className="self-assembly-section">
          <div className="self-assembly-section__header">
            <span>Assembly lane</span>
            <strong>One lane, one box, one truth grammar</strong>
          </div>
          <p className="self-assembly-section__lede">
            The public demo now renders the same lane entry shape and certainty grammar as the
            workspace. The chronology stays curated, but the box is described in the same evidence language.
          </p>
          <AssemblyLane viewModel={demo.assemblyLane} />
        </section>

        <section className="self-assembly-section">
          <div className="self-assembly-section__header">
            <span>History adapters</span>
            <strong>Imported exports first, live connectors later</strong>
          </div>
          <p className="self-assembly-section__lede">
            This demo implements the shared normalization contract through Git history now and
            keeps the same shape ready for future email, chat, calendar, task, and revision exports.
          </p>
          <AdapterGrid adapters={demo.history.supportedExports} />
          {demo.history.unclusteredCount > 0 ? (
            <p className="self-assembly-history-footnote">
              {demo.history.unclusteredCount} commits remain outside the curated public clusters and
              stay in the underlying history source rather than flattening the page into a raw log.
            </p>
          ) : null}
        </section>

        <section className="self-assembly-section">
          <div className="self-assembly-section__header">
            <span>Source library</span>
            <strong>Grouped by role inside the box</strong>
          </div>
          <p className="self-assembly-section__lede">
            The demo keeps narrative evidence, theory, product spec, and platform history in the
            same box while preserving provenance and trust hints for each source.
          </p>
          <div className="self-assembly-groups">
            {demo.sourceGroups.map((group) => (
              <SourceGroup key={group.id} group={group} />
            ))}
          </div>
        </section>

        <footer className="self-assembly-footer">
          <p className="self-assembly-footer__line">{publicSite.actionLine}</p>
          <PublicFooterLinks align="start" />
        </footer>
      </section>
    </main>
  );
}
