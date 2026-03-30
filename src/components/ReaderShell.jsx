import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import MarkdownRenderer from "./MarkdownRenderer";
import { saveReaderPreferences } from "../lib/storage";

const TEXT_SIZE_LABELS = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const PAGE_WIDTH_LABELS = {
  standard: "Standard",
  wide: "Wide",
};

const THEME_LABELS = {
  paper: "Paper",
  dark: "Dark",
};

export default function ReaderShell({ documentData, preferences, setPreferences }) {
  const location = useLocation();
  const [tocOpen, setTocOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(location.hash.replace("#", "") || "beginning");
  const [progress, setProgress] = useState(0);
  const scrollIntentRef = useRef(false);

  const entries = useMemo(
    () => [
      { slug: "beginning", label: "Beginning", title: "Beginning", number: null },
      ...documentData.sections.map((section) => ({
        slug: section.slug,
        label: `${section.number} · ${section.title}`,
        title: section.title,
        number: section.number,
      })),
    ],
    [documentData.sections],
  );

  useEffect(() => {
    document.body.classList.remove("is-lock-screen");
  }, []);

  useEffect(() => {
    saveReaderPreferences(preferences);
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences]);

  useEffect(() => {
    const targetSlug = location.hash.replace("#", "") || "beginning";
    const target = document.getElementById(targetSlug);
    if (!target) return;

    scrollIntentRef.current = true;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start", behavior: "auto" });
      window.setTimeout(() => {
        scrollIntentRef.current = false;
      }, 120);
    });
  }, [location.hash]);

  useEffect(() => {
    const handleProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollable <= 0 ? 0 : Math.min(window.scrollY / scrollable, 1);
      setProgress(nextProgress);
    };

    handleProgress();
    window.addEventListener("scroll", handleProgress, { passive: true });
    window.addEventListener("resize", handleProgress);
    return () => {
      window.removeEventListener("scroll", handleProgress);
      window.removeEventListener("resize", handleProgress);
    };
  }, []);

  useEffect(() => {
    const observed = entries
      .map((entry) => document.getElementById(entry.slug))
      .filter(Boolean);

    if (observed.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (items) => {
        const visible = items
          .filter((item) => item.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (!visible[0]) return;
        setActiveSlug(visible[0].target.id);
      },
      {
        rootMargin: "-18% 0px -58% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75],
      },
    );

    observed.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [entries]);

  useEffect(() => {
    if (scrollIntentRef.current) return;
    const nextHash = activeSlug === "beginning" ? "" : `#${activeSlug}`;
    const nextUrl = `${location.pathname}${nextHash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [activeSlug, location.pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      setTocOpen(false);
      setAppearanceOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const currentIndex = Math.max(
    0,
    entries.findIndex((entry) => entry.slug === activeSlug),
  );
  const currentEntry = entries[currentIndex] || entries[0];
  const previousEntry = currentIndex > 0 ? entries[currentIndex - 1] : null;
  const nextEntry = currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null;
  const progressPercent = Math.round(progress * 100);

  const jumpTo = useCallback((slug) => {
    const target = document.getElementById(slug);
    if (!target) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollIntentRef.current = true;
    setTocOpen(false);
    setAppearanceOpen(false);
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      scrollIntentRef.current = false;
    }, prefersReducedMotion ? 60 : 320);
  }, []);

  useEffect(() => {
    document.title = `${documentData.title} · ${currentEntry.title}`;
  }, [currentEntry.title, documentData.title]);

  useEffect(() => {
    const handleReaderKeys = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName));

      if (isEditable) return;

      if ((event.key === "ArrowRight" || event.key === "j") && nextEntry) {
        event.preventDefault();
        jumpTo(nextEntry.slug);
      }

      if ((event.key === "ArrowLeft" || event.key === "k") && previousEntry) {
        event.preventDefault();
        jumpTo(previousEntry.slug);
      }

      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        setAppearanceOpen(false);
        setTocOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleReaderKeys);
    return () => window.removeEventListener("keydown", handleReaderKeys);
  }, [jumpTo, nextEntry, previousEntry]);

  return (
    <div
      className={`reader-shell text-size-${preferences.textSize} page-width-${preferences.pageWidth}`}
      data-theme={preferences.theme}
    >
      <header className="reader-topbar">
        <button type="button" className="reader-chrome-button" onClick={() => setTocOpen(true)}>
          <span className="reader-button-icon">☰</span>
          <span>Contents</span>
        </button>
        <div className="reader-topbar__center">
          <div className="reader-topbar__title">{documentData.title}</div>
          <div className="reader-topbar__section">
            {currentEntry.number ? `${currentEntry.number} · ${currentEntry.title}` : "Beginning"}
          </div>
        </div>
        <button
          type="button"
          className="reader-chrome-button reader-chrome-button--icon"
          onClick={() => setAppearanceOpen((current) => !current)}
          aria-label="Reader appearance"
        >
          Aa
        </button>
      </header>

      {appearanceOpen && (
        <div className="reader-appearance-menu">
          <PreferenceGroup
            title="Text size"
            value={preferences.textSize}
            options={TEXT_SIZE_LABELS}
            onChange={(value) => setPreferences((current) => ({ ...current, textSize: value }))}
          />
          <PreferenceGroup
            title="Reading width"
            value={preferences.pageWidth}
            options={PAGE_WIDTH_LABELS}
            onChange={(value) => setPreferences((current) => ({ ...current, pageWidth: value }))}
          />
          <PreferenceGroup
            title="Theme"
            value={preferences.theme}
            options={THEME_LABELS}
            onChange={(value) => setPreferences((current) => ({ ...current, theme: value }))}
          />
        </div>
      )}

      <div className={`reader-overlay ${tocOpen || appearanceOpen ? "is-visible" : ""}`} onClick={() => { setTocOpen(false); setAppearanceOpen(false); }} />

      <aside className={`reader-toc ${tocOpen ? "is-open" : ""}`}>
        <div className="reader-toc__header">
          <div>
            <p className="reader-toc__eyebrow">Contents</p>
            <h2 className="reader-toc__title">{documentData.title}</h2>
            <p className="reader-toc__status">
              {currentEntry.number ? `${currentEntry.number} · ${currentEntry.title}` : "Beginning"}
              <span>{progressPercent}% read</span>
            </p>
          </div>
          <button type="button" className="reader-chrome-button reader-chrome-button--icon" onClick={() => setTocOpen(false)}>
            ×
          </button>
        </div>
        <nav className="reader-toc__nav" aria-label="Table of contents">
          {entries.map((entry) => (
            <button
              key={entry.slug}
              type="button"
              className={`reader-toc__item ${entry.slug === activeSlug ? "is-active" : ""}`}
              onClick={() => jumpTo(entry.slug)}
            >
              <span className="reader-toc__item-label">{entry.title}</span>
              <span className="reader-toc__item-meta">{entry.number ?? "0"}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="reader-main">
        <div className="reader-column">
          <article className="reader-book">
            <section id="beginning" className="reader-beginning">
              <p className="reader-beginning__eyebrow">Private reading instrument</p>
              <h1 className="reader-beginning__title">{documentData.title}</h1>
              <p className="reader-beginning__subtitle">{documentData.subtitle}</p>
              <MarkdownRenderer
                markdown={documentData.introMarkdown}
                sectionSlug="beginning"
                className="reader-front-matter"
              />
            </section>

            {documentData.sections.map((section) => (
              <section id={section.slug} key={section.slug} className="reader-section">
                <div className="reader-section__divider" />
                <div className="reader-section__meta">
                  <span className="reader-section__number">{section.number}</span>
                  <span className="reader-section__label">{section.title}</span>
                </div>
                <h2 className="reader-section__title">{section.title}</h2>
                <MarkdownRenderer markdown={section.markdown} sectionSlug={section.slug} />
              </section>
            ))}
          </article>
        </div>
      </main>

      <footer className="reader-bottomrail">
        <div className="reader-bottomrail__progress">
          <div className="reader-bottomrail__progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="reader-bottomrail__nav">
          <button
            type="button"
            className="reader-bottomrail__button"
            onClick={() => previousEntry && jumpTo(previousEntry.slug)}
            disabled={!previousEntry}
            aria-label={previousEntry ? `Go to ${previousEntry.title}` : "No previous section"}
          >
            Previous
          </button>
          <div className="reader-bottomrail__current">
            <span className="reader-bottomrail__current-title">
              {currentEntry.number ? `${currentEntry.number} · ${currentEntry.title}` : currentEntry.title}
            </span>
            <span className="reader-bottomrail__current-progress">{progressPercent}% read</span>
          </div>
          <button
            type="button"
            className="reader-bottomrail__button"
            onClick={() => nextEntry && jumpTo(nextEntry.slug)}
            disabled={!nextEntry}
            aria-label={nextEntry ? `Go to ${nextEntry.title}` : "No next section"}
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}

function PreferenceGroup({ title, value, options, onChange }) {
  return (
    <div className="reader-pref-group">
      <div className="reader-pref-group__title">{title}</div>
      <div className="reader-pref-group__options">
        {Object.entries(options).map(([optionValue, label]) => (
          <button
            key={optionValue}
            type="button"
            className={`reader-pref-option ${value === optionValue ? "is-active" : ""}`}
            onClick={() => onChange(optionValue)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
