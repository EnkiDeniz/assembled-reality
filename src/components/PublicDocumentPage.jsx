import Link from "next/link";
import { ShapeNav, buildStaticShapeNav } from "@/components/LoegosSystem";
import PublicFooterLinks from "@/components/PublicFooterLinks";
import { publicSite } from "@/lib/public-site";

function SectionItems({ items }) {
  return (
    <ul className="loegos-public-document__list">
      {items.map((item) => (
        <li key={item.title} className="loegos-public-document__item">
          <span className="loegos-public-document__item-title">{item.title}</span>
          <p>{item.body}</p>
        </li>
      ))}
    </ul>
  );
}

function SectionBullets({ bullets }) {
  return (
    <ul className="loegos-public-document__bullets">
      {bullets.map((bullet) => (
        <li key={bullet}>{bullet}</li>
      ))}
    </ul>
  );
}

export default function PublicDocumentPage({ page, jsonLd = null }) {
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
                {publicSite.mark} <span className="loegos-wordmark__sub">public documents</span>
              </Link>
              <span className="loegos-thesis">Navigate by shape. Act by verb.</span>
            </div>

            <div className="loegos-public-document__hero">
              <span className="loegos-kicker">{page.label}</span>
              <h1 className="loegos-display">{page.title}</h1>
              <p className="loegos-public-document__lede">{page.lede}</p>
              {page.notice ? <p className="loegos-public-document__callout">{page.notice}</p> : null}
            </div>
          </div>

          <ShapeNav items={buildStaticShapeNav("seal")} activeShape="seal" compact />

          <div className="loegos-public-document__body">
            {(page.sections || []).map((section) => (
              <section
                key={section.title || section.paragraphs?.[0] || section.callout}
                className="loegos-public-document__section"
              >
                {section.title ? <h2>{section.title}</h2> : null}
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items?.length ? <SectionItems items={section.items} /> : null}
                {section.bullets?.length ? <SectionBullets bullets={section.bullets} /> : null}
                {section.callout ? <p className="loegos-public-document__callout">{section.callout}</p> : null}
              </section>
            ))}
          </div>

          <footer className="loegos-public-document__footer">
            <p>{publicSite.actionLine}</p>
            <PublicFooterLinks align="start" />
          </footer>
        </section>
      </section>
    </main>
  );
}
