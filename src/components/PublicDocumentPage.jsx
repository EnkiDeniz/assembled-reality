import Link from "next/link";
import PublicFooterLinks from "@/components/PublicFooterLinks";
import { publicSite } from "@/lib/public-site";

function SectionItems({ items }) {
  return (
    <ul className="public-page__items">
      {items.map((item) => (
        <li key={item.title} className="public-page__item">
          <span className="public-page__item-title">{item.title}</span>
          <p>{item.body}</p>
        </li>
      ))}
    </ul>
  );
}

function SectionBullets({ bullets }) {
  return (
    <ul className="public-page__bullets">
      {bullets.map((bullet) => (
        <li key={bullet}>{bullet}</li>
      ))}
    </ul>
  );
}

export default function PublicDocumentPage({ page, jsonLd = null }) {
  return (
    <main className="public-page">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      <section className="public-page__shell">
        <div className="public-page__topbar">
          <Link href="/" className="public-page__home-link">
            {publicSite.mark}
          </Link>
        </div>

        <header className="public-page__hero">
          <span className="public-page__eyebrow">{page.label}</span>
          <h1 className="public-page__title">{page.title}</h1>
          <p className="public-page__lede">{page.lede}</p>
          {page.notice ? <p className="public-page__notice">{page.notice}</p> : null}
        </header>

        <div className="public-page__body">
          {(page.sections || []).map((section) => (
            <section
              key={section.title || section.paragraphs?.[0] || section.callout}
              className="public-page__section"
            >
              {section.title ? <h2>{section.title}</h2> : null}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.items?.length ? <SectionItems items={section.items} /> : null}
              {section.bullets?.length ? <SectionBullets bullets={section.bullets} /> : null}
              {section.callout ? <p className="public-page__callout">{section.callout}</p> : null}
            </section>
          ))}
        </div>

        <footer className="public-page__footer">
          <p className="public-page__footer-line">{publicSite.actionLine}</p>
          <PublicFooterLinks align="start" />
        </footer>
      </section>
    </main>
  );
}
