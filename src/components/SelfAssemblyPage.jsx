import Link from "next/link";
import PublicFooterLinks from "@/components/PublicFooterLinks";
import { publicSite } from "@/lib/public-site";

function MetricPill({ label, value }) {
  return (
    <div className="self-assembly-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SeedCard({ title, body }) {
  return (
    <article className="self-assembly-seed-card">
      <span className="self-assembly-seed-card__label">{title}</span>
      <p>{body}</p>
    </article>
  );
}

function StageList({ items = [] }) {
  if (!items.length) {
    return <p className="self-assembly-muted">No selected blocks resolved for this step.</p>;
  }

  return (
    <div className="self-assembly-stage-list">
      {items.map((item) => (
        <article key={`${item.blockId || item.label}-${item.text}`} className="self-assembly-stage-item">
          <span className="self-assembly-stage-item__label">{item.label || "Selected"}</span>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  );
}

function HistoryClusterList({ clusters = [] }) {
  if (!clusters.length) return null;

  return (
    <div className="self-assembly-history-list">
      {clusters.map((cluster) => (
        <article key={cluster.id} className="self-assembly-history-card">
          <div className="self-assembly-history-card__topline">
            <span>{cluster.title}</span>
            <strong>{cluster.commitCount} commits</strong>
          </div>
          <p>{cluster.description}</p>
          {cluster.rangeLabel ? (
            <p className="self-assembly-history-card__range">{cluster.rangeLabel}</p>
          ) : null}
          {cluster.sampleTitles?.length ? (
            <ul className="self-assembly-history-card__samples">
              {cluster.sampleTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
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

        <header className="self-assembly-hero">
          <span className="self-assembly-hero__eyebrow">{page.label}</span>
          <h1>{page.title}</h1>
          <p className="self-assembly-hero__lede">{page.lede}</p>
          <div className="self-assembly-hero__metrics">
            <MetricPill label="Curated sources" value={demo.sources.length} />
            <MetricPill label="Assembly milestones" value={demo.milestones.length} />
            <MetricPill label="Normalized commits" value={demo.history.commitCount} />
          </div>
          <p className="self-assembly-hero__note">
            The seven-image chronology stays primary. Git history sits underneath it as a
            corroborating software-evolution witness.
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
            <span>Assembly path</span>
            <strong>Seven curated milestones from naming to seal</strong>
          </div>

          <ol className="self-assembly-timeline">
            {demo.milestones.map((milestone) => (
              <li key={milestone.id} className="self-assembly-milestone">
                <article className="self-assembly-milestone__card">
                  <header className="self-assembly-milestone__header">
                    <span>{milestone.label}</span>
                    <h2>{milestone.title}</h2>
                  </header>

                  <div className="self-assembly-milestone__narrative">
                    <span className="self-assembly-milestone__subhead">Narrative source section</span>
                    <p>{milestone.narrativeSection.excerpt}</p>
                    <p className="self-assembly-milestone__path">
                      {milestone.narrativeSection.relativePath}
                    </p>
                  </div>

                  <div className="self-assembly-flow-grid">
                    <section className="self-assembly-flow-card">
                      <span className="self-assembly-flow-card__label">Selected</span>
                      <StageList items={milestone.selected} />
                    </section>

                    <section className="self-assembly-flow-card">
                      <span className="self-assembly-flow-card__label">Staged</span>
                      <p>{milestone.stagedSummary}</p>
                    </section>

                    <section className="self-assembly-flow-card">
                      <span className="self-assembly-flow-card__label">Advanced</span>
                      <article className="self-assembly-stage-item is-advanced">
                        <span className="self-assembly-stage-item__label">
                          {milestone.advanced.label}
                        </span>
                        <p>{milestone.advanced.text}</p>
                      </article>
                    </section>

                    <section className="self-assembly-flow-card">
                      <span className="self-assembly-flow-card__label">Sealed</span>
                      <p>{milestone.sealedSummary}</p>
                    </section>
                  </div>

                  {milestone.supportingSources?.length ? (
                    <div className="self-assembly-support">
                      <span className="self-assembly-milestone__subhead">Supporting sources</span>
                      <div className="self-assembly-support__chips">
                        {milestone.supportingSources.map((source) => (
                          <span key={source.id} className="self-assembly-support__chip">
                            {source.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {milestone.historyClusters?.length ? (
                    <div className="self-assembly-support">
                      <span className="self-assembly-milestone__subhead">
                        Corroborating Git history cluster
                      </span>
                      <HistoryClusterList clusters={milestone.historyClusters} />
                    </div>
                  ) : null}
                </article>
              </li>
            ))}
          </ol>
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
