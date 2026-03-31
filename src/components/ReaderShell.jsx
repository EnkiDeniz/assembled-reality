"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import ReaderMarksPanel from "./ReaderMarksPanel";
import SelectionMenu from "./SelectionMenu";
import SevenPanel from "./SevenPanel";
import {
  addHighlight,
  addNote,
  deleteBookmark,
  deleteHighlight,
  deleteNote,
  getRenderableMarksByBlock,
  hasSectionBookmark,
  toggleSectionBookmark,
  updateNote,
} from "../lib/annotations";
import { EMPTY_READER_ANNOTATIONS } from "../lib/reader-store";
import { clearBrowserSelection, getSelectionAnchor } from "../lib/selection";
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

function BookmarkIcon({ filled }) {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M6 3.75h8a1.25 1.25 0 0 1 1.25 1.25v11.4l-5.25-3.2-5.25 3.2V5A1.25 1.25 0 0 1 6 3.75Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarksIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4.5 5.75h11M4.5 10h7.5M4.5 14.25h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14.5 8.2 15 9.65l1.45.5-1.45.5-.5 1.45-.5-1.45-1.45-.5 1.45-.5.5-1.45Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SevenIcon() {
  return <span className="reader-seven-icon" aria-hidden="true">7</span>;
}

export default function ReaderShell({
  documentData,
  preferences,
  setPreferences,
  initialReaderAnnotations = EMPTY_READER_ANNOTATIONS,
  initialReadingProgress = null,
  profile = null,
  sessionUser = null,
  getReceiptsConnection = null,
  sevenTextEnabled = false,
  sevenVoiceEnabled = false,
  sevenTextProvider = null,
  sevenVoiceProvider = null,
}) {
  const initialHash =
    typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
  const [tocOpen, setTocOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);
  const [sevenOpen, setSevenOpen] = useState(false);
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(
    initialHash || initialReadingProgress?.sectionSlug || "beginning",
  );
  const [progress, setProgress] = useState(
    typeof initialReadingProgress?.progressPercent === "number"
      ? initialReadingProgress.progressPercent / 100
      : 0,
  );
  const [readerAnnotations, setReaderAnnotations] = useState(
    () => initialReaderAnnotations || EMPTY_READER_ANNOTATIONS,
  );
  const [selectionState, setSelectionState] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [selectionNotice, setSelectionNotice] = useState("");
  const [receiptNotice, setReceiptNotice] = useState("");
  const [creatingReceipt, setCreatingReceipt] = useState(false);
  const [activeMarkId, setActiveMarkId] = useState(null);
  const [focusedSectionSlug, setFocusedSectionSlug] = useState(null);
  const scrollIntentRef = useRef(false);
  const noticeTimeoutRef = useRef(null);
  const focusTimeoutRef = useRef(null);
  const hasHydratedMarksRef = useRef(false);
  const hasHydratedProgressRef = useRef(false);

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
    if (typeof window === "undefined") return undefined;

    const scrollToHash = () => {
      const targetSlug =
        window.location.hash.replace("#", "") ||
        initialReadingProgress?.sectionSlug ||
        "beginning";
      const target = document.getElementById(targetSlug);
      if (!target) return;

      scrollIntentRef.current = true;
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "start", behavior: "auto" });
        window.setTimeout(() => {
          scrollIntentRef.current = false;
        }, 120);
      });
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [initialReadingProgress?.sectionSlug]);

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
    const nextUrl = nextHash ? `/read${nextHash}` : "/read";
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [activeSlug]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      setTocOpen(false);
      setAppearanceOpen(false);
      setMarksOpen(false);
      setSevenOpen(false);
      setMemberMenuOpen(false);
      setSelectionState(null);
      setNoteDraft("");
      clearBrowserSelection();
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
  const currentLabel = currentEntry.number
    ? `${currentEntry.number} · ${currentEntry.title}`
    : currentEntry.title;
  const memberName =
    profile?.displayName ||
    sessionUser?.readerName ||
    sessionUser?.name ||
    sessionUser?.email ||
    "Reader";
  const memberEmail = sessionUser?.email || "";
  const membershipLabel = "Reader";
  const receiptsStatusLabel =
    getReceiptsConnection?.status === "CONNECTED"
      ? "GetReceipts connected"
      : "GetReceipts not connected";
  const memberInitial = memberName.trim().charAt(0).toUpperCase() || "R";
  const currentBookmarked = hasSectionBookmark(readerAnnotations, currentEntry.slug);
  const hasFloatingPanel = tocOpen || appearanceOpen || marksOpen || sevenOpen || memberMenuOpen;
  const sortedBookmarks = useMemo(
    () =>
      readerAnnotations.bookmarks.toSorted(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
      ),
    [readerAnnotations.bookmarks],
  );
  const sortedHighlights = useMemo(
    () =>
      readerAnnotations.highlights.toSorted(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
      ),
    [readerAnnotations.highlights],
  );
  const sortedNotes = useMemo(
    () =>
      readerAnnotations.notes.toSorted(
        (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
      ),
    [readerAnnotations.notes],
  );
  const marksByBlock = useMemo(
    () => getRenderableMarksByBlock(readerAnnotations),
    [readerAnnotations],
  );

  const clearFocusState = useCallback(() => {
    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }

    setActiveMarkId(null);
    setFocusedSectionSlug(null);
  }, []);

  const closeReaderPanels = useCallback(() => {
    setTocOpen(false);
    setAppearanceOpen(false);
    setMarksOpen(false);
    setSevenOpen(false);
    setMemberMenuOpen(false);
  }, []);

  const openMemberMenu = useCallback(() => {
    setTocOpen(false);
    setAppearanceOpen(false);
    setMarksOpen(false);
    setSevenOpen(false);
    setMemberMenuOpen((current) => !current);
  }, []);

  const openSettingsPanel = useCallback(() => {
    setTocOpen(false);
    setMarksOpen(false);
    setSevenOpen(false);
    setMemberMenuOpen(false);
    setAppearanceOpen(true);
  }, []);

  const openContentsPanel = useCallback(() => {
    setAppearanceOpen(false);
    setMarksOpen(false);
    setSevenOpen(false);
    setMemberMenuOpen(false);
    setTocOpen(true);
  }, []);

  const toggleMarksPanel = useCallback(() => {
    setTocOpen(false);
    setAppearanceOpen(false);
    setSevenOpen(false);
    setMemberMenuOpen(false);
    setMarksOpen((current) => !current);
  }, []);

  const toggleSevenPanel = useCallback(() => {
    setTocOpen(false);
    setAppearanceOpen(false);
    setMarksOpen(false);
    setMemberMenuOpen(false);
    setSevenOpen((current) => !current);
  }, []);

  const toggleAppearancePanel = useCallback(() => {
    setTocOpen(false);
    setMarksOpen(false);
    setSevenOpen(false);
    setMemberMenuOpen(false);
    setAppearanceOpen((current) => !current);
  }, []);

  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  const showSelectionNotice = useCallback((message) => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }

    setSelectionNotice(message);
    noticeTimeoutRef.current = window.setTimeout(() => {
      setSelectionNotice("");
      noticeTimeoutRef.current = null;
    }, 1800);
  }, []);

  const showReceiptNotice = useCallback((message) => {
    setReceiptNotice(message);
    window.setTimeout(() => {
      setReceiptNotice("");
    }, 2600);
  }, []);

  const jumpTo = useCallback(
    (slug) => {
      const target = document.getElementById(slug);
      if (!target) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollIntentRef.current = true;
      closeReaderPanels();
      setSelectionState(null);
      setNoteDraft("");
      clearBrowserSelection();
      clearFocusState();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      window.setTimeout(() => {
        scrollIntentRef.current = false;
      }, prefersReducedMotion ? 60 : 320);
    },
    [clearFocusState, closeReaderPanels],
  );

  const jumpToMark = useCallback(
    (mark) => {
      const selector =
        mark.blockId && typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? `[data-block-id="${CSS.escape(mark.blockId)}"]`
          : null;
      const target =
        (selector ? document.querySelector(selector) : null) ||
        document.getElementById(mark.sectionSlug);

      if (!target) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollIntentRef.current = true;
      closeReaderPanels();
      setSelectionState(null);
      setNoteDraft("");
      clearBrowserSelection();
      clearFocusState();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      setActiveMarkId(mark.id);
      setFocusedSectionSlug(mark.sectionSlug);
      focusTimeoutRef.current = window.setTimeout(() => {
        setActiveMarkId(null);
        setFocusedSectionSlug(null);
        focusTimeoutRef.current = null;
      }, 1800);

      window.setTimeout(() => {
        scrollIntentRef.current = false;
      }, prefersReducedMotion ? 60 : 320);
    },
    [clearFocusState, closeReaderPanels],
  );

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
        setMarksOpen(false);
        setAppearanceOpen(false);
        setSevenOpen(false);
        setMemberMenuOpen(false);
        setTocOpen((current) => !current);
      }

      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        setTocOpen(false);
        setAppearanceOpen(false);
        setMemberMenuOpen(false);
        setMarksOpen((current) => !current);
        setSevenOpen(false);
      }

      if (event.key.toLowerCase() === "7") {
        event.preventDefault();
        setTocOpen(false);
        setAppearanceOpen(false);
        setMarksOpen(false);
        setMemberMenuOpen(false);
        setSevenOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleReaderKeys);
    return () => window.removeEventListener("keydown", handleReaderKeys);
  }, [jumpTo, nextEntry, previousEntry]);

  useEffect(() => {
    const syncSelection = () => {
      const anchor = getSelectionAnchor();

      if (!anchor) {
        setSelectionState((current) => (current?.mode === "note" ? current : null));
        return;
      }

      if (anchor.reason === "multi-block") {
        setSelectionState(null);
        showSelectionNotice("Select within one paragraph or list item.");
        return;
      }

      closeReaderPanels();
      setSelectionState({
        mode: "actions",
        anchor,
        point: anchor.point,
      });
    };

    const handleSelectionChange = () => {
      window.requestAnimationFrame(syncSelection);
    };

    const dismissSelectionUi = () => {
      setSelectionState((current) => (current?.mode === "note" ? current : null));
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("scroll", dismissSelectionUi, { passive: true });
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("scroll", dismissSelectionUi);
    };
  }, [closeReaderPanels, showSelectionNotice]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
      if (focusTimeoutRef.current) window.clearTimeout(focusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedMarksRef.current) {
      hasHydratedMarksRef.current = true;
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/reader/marks", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(readerAnnotations),
          signal: controller.signal,
        });
      } catch {
        // Keep local state responsive; retry on the next mutation.
      }
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [readerAnnotations]);

  useEffect(() => {
    if (!hasHydratedProgressRef.current) {
      hasHydratedProgressRef.current = true;
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/reader/progress", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sectionSlug: activeSlug,
            progressPercent,
          }),
          signal: controller.signal,
        });
      } catch {
        // Progress saves are best effort.
      }
    }, 320);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeSlug, progressPercent]);

  const handleToggleBookmark = () => {
    setReaderAnnotations((current) =>
      toggleSectionBookmark(current, {
        sectionSlug: currentEntry.slug,
        label: currentLabel,
        excerpt: currentEntry.title,
      }),
    );
  };

  const handleCreateHighlight = () => {
    if (!selectionState?.anchor) return;

    setReaderAnnotations((current) => addHighlight(current, selectionState.anchor));
    setSelectionState(null);
    setNoteDraft("");
    clearBrowserSelection();
  };

  const handleStartNote = () => {
    if (!selectionState?.anchor) return;

    setSelectionState((current) =>
      current
        ? {
            ...current,
            mode: "note",
          }
        : current,
    );
  };

  const handleSaveNote = () => {
    if (!selectionState?.anchor || !noteDraft.trim()) return;

    setReaderAnnotations((current) => addNote(current, selectionState.anchor, noteDraft));
    setSelectionState(null);
    setNoteDraft("");
    clearBrowserSelection();
  };

  const handleCreateReceipt = async () => {
    const currentSectionSlug =
      activeSlug === "beginning" ? documentData.sections[0]?.slug || "beginning" : activeSlug;
    const sourceMarks = [
      ...readerAnnotations.highlights.filter((mark) => mark.sectionSlug === currentSectionSlug),
      ...readerAnnotations.notes.filter((mark) => mark.sectionSlug === currentSectionSlug),
    ];

    setCreatingReceipt(true);
    try {
      const response = await fetch("/api/reader/receipts/from-reading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceSections: currentSectionSlug === "beginning" ? [] : [currentSectionSlug],
          sourceMarkIds: sourceMarks.map((mark) => mark.id),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not create receipt draft.");
      }

      if (payload?.remoteReceipt?.id) {
        showReceiptNotice("Receipt draft created in GetReceipts.");
      } else if (payload?.remoteError) {
        showReceiptNotice("Saved local draft. GetReceipts handoff needs attention.");
      } else {
        showReceiptNotice("Saved local reading draft.");
      }
    } catch (error) {
      showReceiptNotice(error instanceof Error ? error.message : "Could not create receipt draft.");
    } finally {
      setCreatingReceipt(false);
    }
  };

  return (
    <div
      className={`reader-shell text-size-${preferences.textSize} page-width-${preferences.pageWidth} ${hasFloatingPanel ? "has-floating-panel" : ""} ${sevenOpen ? "has-seven-open" : ""}`}
      data-theme={preferences.theme}
    >
      <header className="reader-topbar">
        <div className="reader-topbar__primary">
          <button type="button" className="reader-chrome-button" onClick={openContentsPanel}>
            <span className="reader-button-icon">☰</span>
            <span>Contents</span>
          </button>
          <div className="reader-topbar__center">
            <div className="reader-topbar__title">{documentData.title}</div>
            <div className="reader-topbar__section">{currentLabel}</div>
          </div>
          <div className="reader-topbar__actions">
            <button
              type="button"
              className={`reader-chrome-button reader-chrome-button--icon ${currentBookmarked ? "is-active" : ""}`}
              onClick={handleToggleBookmark}
              aria-label={currentBookmarked ? "Remove bookmark" : "Add bookmark"}
              title={currentBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <span className="reader-button-icon">
                <BookmarkIcon filled={currentBookmarked} />
              </span>
            </button>
            <button
              type="button"
              className={`reader-chrome-button reader-chrome-button--icon ${marksOpen ? "is-active" : ""}`}
              onClick={toggleMarksPanel}
              aria-label={marksOpen ? "Close marks" : "Open marks"}
              title={marksOpen ? "Close marks" : "Open marks"}
            >
              <span className="reader-button-icon">
                <MarksIcon />
              </span>
            </button>
            <button
              type="button"
              className={`reader-chrome-button reader-chrome-button--seven ${sevenOpen ? "is-active" : ""}`}
              onClick={toggleSevenPanel}
              aria-label={sevenOpen ? "Close Seven" : "Open Seven"}
              title={sevenOpen ? "Close Seven" : "Open Seven"}
            >
              <span className="reader-button-icon">
                <SevenIcon />
              </span>
              <span>{sevenOpen ? "Close Seven" : "Ask Seven"}</span>
            </button>
            <button
              type="button"
              className={`reader-chrome-button reader-chrome-button--icon ${appearanceOpen ? "is-active" : ""}`}
              onClick={toggleAppearancePanel}
              aria-label="Reader appearance"
              title="Reader appearance"
            >
              Aa
            </button>
            <button
              type="button"
              className={`reader-chrome-button ${memberMenuOpen ? "is-active" : ""}`}
              data-mobile-hidden="true"
              onClick={openMemberMenu}
              aria-label={memberMenuOpen ? "Close account menu" : "Open account menu"}
              aria-expanded={memberMenuOpen}
            >
              <span className="reader-member-chip" aria-hidden="true">
                {memberInitial}
              </span>
              <span>{memberName}</span>
            </button>
          </div>
        </div>
      </header>

      {memberMenuOpen ? (
        <div className="reader-member-menu" role="dialog" aria-label="Account menu">
          <div className="reader-member-menu__header">
            <p className="reader-member-menu__eyebrow">Signed in</p>
            <h2 className="reader-member-menu__name">{memberName}</h2>
            {memberEmail ? <p className="reader-member-menu__email">{memberEmail}</p> : null}
            <div className="reader-member-menu__meta">
              <span>{membershipLabel}</span>
              <span>{receiptsStatusLabel}</span>
            </div>
          </div>
          <div className="reader-member-menu__actions">
            <Link
              href="/account"
              className="reader-member-menu__action"
              onClick={() => setMemberMenuOpen(false)}
            >
              Account
            </Link>
            <button type="button" className="reader-member-menu__action" onClick={openSettingsPanel}>
              Reading settings
            </button>
            <button type="button" className="reader-member-menu__action" onClick={handleSignOut}>
              Log out
            </button>
          </div>
        </div>
      ) : null}

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

      <div
        className={`reader-overlay ${tocOpen || appearanceOpen || marksOpen || sevenOpen || memberMenuOpen ? "is-visible" : ""}`}
        onClick={closeReaderPanels}
      />

      <aside className={`reader-toc ${tocOpen ? "is-open" : ""}`}>
        <div className="reader-toc__header">
          <div>
            <p className="reader-toc__eyebrow">Contents</p>
            <h2 className="reader-toc__title">{documentData.title}</h2>
            <p className="reader-toc__status">
              {currentLabel}
              <span>{progressPercent}% read</span>
            </p>
          </div>
          <button
            type="button"
            className="reader-chrome-button reader-chrome-button--icon"
            onClick={() => setTocOpen(false)}
            aria-label="Close contents"
          >
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
          <div className="reader-toc__utility">
            <button
              type="button"
              className="reader-toc__utility-action"
              onClick={() => {
                setTocOpen(false);
                setAppearanceOpen(false);
                setSevenOpen(false);
                setMemberMenuOpen(false);
                setMarksOpen(true);
              }}
            >
              Reading Marks
            </button>
            <button
              type="button"
              className="reader-toc__utility-action"
              onClick={() => {
                handleToggleBookmark();
                setTocOpen(false);
              }}
            >
              {currentBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            </button>
            <button
              type="button"
              className="reader-toc__utility-action"
              onClick={openSettingsPanel}
            >
              Reading Settings
            </button>
            <button
              type="button"
              className="reader-toc__utility-action"
              onClick={handleCreateReceipt}
              disabled={creatingReceipt}
            >
              {creatingReceipt
                ? "Creating Receipt"
                : getReceiptsConnection?.status === "CONNECTED"
                  ? "Create Receipt"
                  : "Save Reading Draft"}
            </button>
            <button
              type="button"
              className="reader-toc__utility-action"
              onClick={openMemberMenu}
            >
              Account
            </button>
            <button type="button" className="reader-toc__utility-action" onClick={handleSignOut}>
              Log Out
            </button>
          </div>
        </nav>
      </aside>

      <ReaderMarksPanel
        open={marksOpen}
        currentLabel={currentLabel}
        progressPercent={progressPercent}
        bookmarks={sortedBookmarks}
        highlights={sortedHighlights}
        notes={sortedNotes}
        onClose={() => setMarksOpen(false)}
        onJumpToBookmark={jumpToMark}
        onJumpToMark={jumpToMark}
        onDeleteBookmark={(bookmarkId) =>
          setReaderAnnotations((current) => deleteBookmark(current, bookmarkId))
        }
        onDeleteHighlight={(highlightId) =>
          setReaderAnnotations((current) => deleteHighlight(current, highlightId))
        }
        onDeleteNote={(noteId) =>
          setReaderAnnotations((current) => deleteNote(current, noteId))
        }
        onUpdateNote={(noteId, nextText) =>
          setReaderAnnotations((current) => updateNote(current, noteId, nextText))
        }
      />

      <SevenPanel
        open={sevenOpen}
        textEnabled={sevenTextEnabled}
        voiceEnabled={sevenVoiceEnabled}
        textProvider={sevenTextProvider}
        preferredVoiceProvider={sevenVoiceProvider}
        documentData={documentData}
        activeSlug={activeSlug}
        currentLabel={currentLabel}
        onClose={() => setSevenOpen(false)}
      />

      <main className="reader-main">
        <div className="reader-column">
          <article className="reader-book">
            <section
              id="beginning"
              data-section-slug="beginning"
              data-section-title="Beginning"
              className={`reader-beginning ${focusedSectionSlug === "beginning" ? "is-focused-source" : ""}`}
            >
              <p className="reader-beginning__eyebrow">Reading instrument</p>
              <h1 className="reader-beginning__title">{documentData.title}</h1>
              <p className="reader-beginning__subtitle">{documentData.subtitle}</p>
              <MarkdownRenderer
                markdown={documentData.introMarkdown}
                sectionSlug="beginning"
                className="reader-front-matter"
                marksByBlock={marksByBlock}
                activeMarkId={activeMarkId}
              />
            </section>

            {documentData.sections.map((section) => (
              <section
                id={section.slug}
                key={section.slug}
                data-section-slug={section.slug}
                data-section-title={section.title}
                className={`reader-section ${focusedSectionSlug === section.slug ? "is-focused-source" : ""}`}
              >
                <div className="reader-section__divider" />
                <div className="reader-section__meta">
                  <span className="reader-section__number">{section.number}</span>
                  <span className="reader-section__label">{section.title}</span>
                </div>
                <h2 className="reader-section__title">{section.title}</h2>
                <MarkdownRenderer
                  markdown={section.markdown}
                  sectionSlug={section.slug}
                  marksByBlock={marksByBlock}
                  activeMarkId={activeMarkId}
                />
              </section>
            ))}
          </article>
        </div>
      </main>

      <SelectionMenu
        selection={selectionState}
        noteDraft={noteDraft}
        onHighlight={handleCreateHighlight}
        onStartNote={handleStartNote}
        onChangeNoteDraft={setNoteDraft}
        onSaveNote={handleSaveNote}
        onCancel={() => {
          setSelectionState(null);
          setNoteDraft("");
          clearBrowserSelection();
        }}
      />

      {selectionNotice ? <div className="reader-toast">{selectionNotice}</div> : null}
      {receiptNotice ? <div className="reader-toast is-receipt">{receiptNotice}</div> : null}

      <footer className="reader-bottomrail">
        <div className="reader-bottomrail__progress">
          <div
            className="reader-bottomrail__progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="reader-bottomrail__nav">
          <button
            type="button"
            className="reader-bottomrail__button"
            onClick={() => previousEntry && jumpTo(previousEntry.slug)}
            disabled={!previousEntry}
            aria-label={previousEntry ? `Go to ${previousEntry.title}` : "No previous section"}
          >
            <span className="reader-bottomrail__button-icon" aria-hidden="true">
              ‹
            </span>
            <span className="reader-bottomrail__button-label">Previous</span>
          </button>
          <div className="reader-bottomrail__current">
            <span className="reader-bottomrail__current-compact">
              {currentEntry.number ? `${currentEntry.number} · ${progressPercent}% read` : `${progressPercent}% read`}
            </span>
            <span className="reader-bottomrail__current-title">{currentLabel}</span>
            <span className="reader-bottomrail__current-progress">{progressPercent}% read</span>
            <button
              type="button"
              className="reader-bottomrail__receipt"
              onClick={handleCreateReceipt}
              disabled={creatingReceipt}
            >
              {creatingReceipt
                ? "Creating receipt"
                : getReceiptsConnection?.status === "CONNECTED"
                  ? "Create receipt"
                  : "Save reading draft"}
            </button>
          </div>
          <button
            type="button"
            className="reader-bottomrail__button"
            onClick={() => nextEntry && jumpTo(nextEntry.slug)}
            disabled={!nextEntry}
            aria-label={nextEntry ? `Go to ${nextEntry.title}` : "No next section"}
          >
            <span className="reader-bottomrail__button-label">Next</span>
            <span className="reader-bottomrail__button-icon" aria-hidden="true">
              ›
            </span>
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
