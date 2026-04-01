"use client";

import Link from "next/link";
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

const URL_SYNC_SURFACES = new Set(["contents", "notebook", "seven"]);

function getSyncedSurfaceFromUrl() {
  if (typeof window === "undefined") return null;

  const panel = new URLSearchParams(window.location.search).get("panel");
  return URL_SYNC_SURFACES.has(panel) ? panel : null;
}

function syncReaderUrl({ panel = null, hash = undefined, historyMode = "replace" } = {}) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (panel && URL_SYNC_SURFACES.has(panel)) {
    url.searchParams.set("panel", panel);
  } else {
    url.searchParams.delete("panel");
  }

  if (typeof hash === "string") {
    url.hash = hash ? `#${hash}` : "";
  }

  const method = historyMode === "push" ? "pushState" : "replaceState";
  window.history[method](window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

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

function NotebookIcon() {
  return (
    <svg className="reader-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4.75 4.25h9.5A1.75 1.75 0 0 1 16 6v8a1.75 1.75 0 0 1-1.75 1.75h-9.5A1.75 1.75 0 0 1 3 14V6a1.75 1.75 0 0 1 1.75-1.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.8 7.25h5.9M6.8 10h5.9M6.8 12.75h3.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function SevenIcon() {
  return (
    <span className="reader-seven-icon" aria-hidden="true">
      7
    </span>
  );
}

export default function ReaderShell({
  documentData,
  preferences,
  setPreferences,
  initialReaderAnnotations = EMPTY_READER_ANNOTATIONS,
  initialReadingProgress = null,
  initialConversationThread = null,
  initialEvidenceSet = null,
  profile = null,
  sessionUser = null,
  getReceiptsConnection: _getReceiptsConnection = null,
  sevenTextEnabled = false,
  sevenVoiceEnabled = false,
  sevenTextProvider = null,
  sevenVoiceProvider = null,
}) {
  const initialHash =
    typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
  const [activeSurface, setActiveSurface] = useState(() => getSyncedSurfaceFromUrl());
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
  const [evidenceItems, setEvidenceItems] = useState(() => initialEvidenceSet?.items || []);
  const [sevenView, setSevenView] = useState("chat");
  const [activeMarkId, setActiveMarkId] = useState(null);
  const [focusedSectionSlug, setFocusedSectionSlug] = useState(null);
  const [notebookScope, setNotebookScope] = useState("section");
  const scrollIntentRef = useRef(false);
  const noticeTimeoutRef = useRef(null);
  const focusTimeoutRef = useRef(null);
  const hasHydratedMarksRef = useRef(false);
  const hasHydratedProgressRef = useRef(false);
  const surfaceTriggerRef = useRef(null);

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
  const memberInitial = memberName.trim().charAt(0).toUpperCase() || "R";
  const currentBookmarked = hasSectionBookmark(readerAnnotations, currentEntry.slug);
  const hasFloatingPanel = activeSurface !== null;
  const contentsOpen = activeSurface === "contents";
  const notebookOpen = activeSurface === "notebook";
  const sevenOpen = activeSurface === "seven";
  const appearanceOpen = activeSurface === "appearance";

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

  const matchesNotebookScope = useCallback(
    (mark) => notebookScope === "all" || mark.sectionSlug === activeSlug,
    [activeSlug, notebookScope],
  );

  const visibleBookmarks = useMemo(
    () => sortedBookmarks.filter(matchesNotebookScope),
    [matchesNotebookScope, sortedBookmarks],
  );
  const visibleHighlights = useMemo(
    () => sortedHighlights.filter(matchesNotebookScope),
    [matchesNotebookScope, sortedHighlights],
  );
  const visibleNotes = useMemo(
    () => sortedNotes.filter(matchesNotebookScope),
    [matchesNotebookScope, sortedNotes],
  );
  const evidenceMarkIds = useMemo(
    () => evidenceItems.map((item) => item.sourceMarkId).filter(Boolean),
    [evidenceItems],
  );

  const clearFocusState = useCallback(() => {
    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }

    setActiveMarkId(null);
    setFocusedSectionSlug(null);
  }, []);

  const restoreSurfaceFocus = useCallback(() => {
    window.setTimeout(() => {
      surfaceTriggerRef.current?.focus();
    }, 0);
  }, []);

  const closeSurface = useCallback(
    ({ restoreFocus = true, historyMode = "replace" } = {}) => {
      if (activeSurface && URL_SYNC_SURFACES.has(activeSurface)) {
        syncReaderUrl({ panel: null, historyMode });
      }

      setActiveSurface(null);

      if (restoreFocus) {
        restoreSurfaceFocus();
      }
    },
    [activeSurface, restoreSurfaceFocus],
  );

  const toggleSurface = useCallback(
    (surface, trigger = null) => {
      if (trigger?.currentTarget instanceof HTMLElement) {
        surfaceTriggerRef.current = trigger.currentTarget;
      }

      if (activeSurface === surface) {
        closeSurface();
        return;
      }

      setSelectionState(null);
      setNoteDraft("");
      clearBrowserSelection();

      if (URL_SYNC_SURFACES.has(surface)) {
        syncReaderUrl({
          panel: surface,
          historyMode:
            activeSurface && URL_SYNC_SURFACES.has(activeSurface) ? "replace" : "push",
        });
      } else if (activeSurface && URL_SYNC_SURFACES.has(activeSurface)) {
        syncReaderUrl({ panel: null, historyMode: "replace" });
      }

      setActiveSurface(surface);
    },
    [activeSurface, closeSurface],
  );

  const dismissSurfacesWithoutFocus = useCallback(() => {
    if (!activeSurface) return;
    closeSurface({ restoreFocus: false });
  }, [activeSurface, closeSurface]);

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
      dismissSurfacesWithoutFocus();
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
    [clearFocusState, dismissSurfacesWithoutFocus],
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
      dismissSurfacesWithoutFocus();
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
    [clearFocusState, dismissSurfacesWithoutFocus],
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
    syncReaderUrl({
      panel: URL_SYNC_SURFACES.has(activeSurface) ? activeSurface : null,
      hash: activeSlug === "beginning" ? "" : activeSlug,
      historyMode: "replace",
    });
  }, [activeSlug, activeSurface]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (selectionState?.mode === "note") {
        setSelectionState(null);
        setNoteDraft("");
        clearBrowserSelection();
        return;
      }

      if (activeSurface) {
        closeSurface({ restoreFocus: false });
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeSurface, closeSurface, selectionState?.mode]);

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
        toggleSurface("contents");
      }

      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleSurface("notebook");
      }

      if (event.key.toLowerCase() === "7") {
        event.preventDefault();
        toggleSurface("seven");
      }
    };

    window.addEventListener("keydown", handleReaderKeys);
    return () => window.removeEventListener("keydown", handleReaderKeys);
  }, [jumpTo, nextEntry, previousEntry, toggleSurface]);

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

      dismissSurfacesWithoutFocus();
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
  }, [dismissSurfacesWithoutFocus, showSelectionNotice]);

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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePopState = () => {
      const panel = getSyncedSurfaceFromUrl();
      setActiveSurface((current) => {
        if (current && !URL_SYNC_SURFACES.has(current)) {
          return current;
        }

        return panel;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    if (!activeSurface) {
      document.body.style.removeProperty("overflow");
      return undefined;
    }

    document.body.style.setProperty("overflow", "hidden");
    return () => document.body.style.removeProperty("overflow");
  }, [activeSurface]);

  const handleToggleBookmark = useCallback(() => {
    setReaderAnnotations((current) =>
      toggleSectionBookmark(current, {
        sectionSlug: currentEntry.slug,
        label: currentLabel,
        excerpt: currentEntry.title,
      }),
    );
  }, [currentEntry.slug, currentEntry.title, currentLabel]);

  const handleCreateHighlight = useCallback(() => {
    if (!selectionState?.anchor) return;

    setReaderAnnotations((current) => addHighlight(current, selectionState.anchor));
    setSelectionState(null);
    setNoteDraft("");
    clearBrowserSelection();
  }, [selectionState?.anchor]);

  const handleStartNote = useCallback(() => {
    if (!selectionState?.anchor) return;

    setSelectionState((current) =>
      current
        ? {
            ...current,
            mode: "note",
          }
        : current,
    );
  }, [selectionState?.anchor]);

  const handleSaveNote = useCallback(() => {
    if (!selectionState?.anchor || !noteDraft.trim()) return;

    setReaderAnnotations((current) => addNote(current, selectionState.anchor, noteDraft));
    setSelectionState(null);
    setNoteDraft("");
    clearBrowserSelection();
  }, [noteDraft, selectionState?.anchor]);

  const addEvidenceItem = useCallback(
    async (input, successMessage = "Added to evidence.") => {
      try {
        const response = await fetch("/api/reader/evidence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentKey: documentData.documentKey,
            ...input,
          }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.ok || !payload?.item) {
          throw new Error(payload?.error || "Could not add to evidence.");
        }

        setEvidenceItems((current) => {
          const existingIndex = current.findIndex((item) => item.id === payload.item.id);
          if (existingIndex === -1) {
            return [...current, payload.item];
          }

          const next = [...current];
          next[existingIndex] = payload.item;
          return next;
        });
        showReceiptNotice(successMessage);
        return payload.item;
      } catch (error) {
        showReceiptNotice(error instanceof Error ? error.message : "Could not add to evidence.");
        return null;
      }
    },
    [documentData.documentKey, showReceiptNotice],
  );

  const removeEvidenceItem = useCallback(
    async (itemId, successMessage = "Removed from evidence.") => {
      try {
        const response = await fetch("/api/reader/evidence", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Could not remove from evidence.");
        }

        setEvidenceItems((current) => current.filter((item) => item.id !== itemId));
        showReceiptNotice(successMessage);
        return true;
      } catch (error) {
        showReceiptNotice(error instanceof Error ? error.message : "Could not remove from evidence.");
        return false;
      }
    },
    [showReceiptNotice],
  );

  const handleAddSelectionToEvidence = useCallback(() => {
    if (!selectionState?.anchor) return;

    void addEvidenceItem(
      {
        origin: "reader",
        sourceType: "passage",
        sectionSlug: selectionState.anchor.sectionSlug,
        sectionTitle: selectionState.anchor.sectionTitle,
        blockId: selectionState.anchor.blockId,
        startOffset: selectionState.anchor.startOffset,
        endOffset: selectionState.anchor.endOffset,
        quote: selectionState.anchor.quote,
        excerpt: selectionState.anchor.quote,
      },
      "Added passage to evidence.",
    );
    setSevenView("evidence");
    setSelectionState(null);
    setNoteDraft("");
    clearBrowserSelection();
  }, [addEvidenceItem, selectionState?.anchor]);

  const handleToggleMarkEvidence = useCallback(
    (mark) => {
      const existing = evidenceItems.find((item) => item.sourceMarkId === mark.id);
      if (existing) {
        void removeEvidenceItem(existing.id, "Removed mark from evidence.");
        return;
      }

      void addEvidenceItem(
        {
          origin: "reader",
          sourceType: mark.type === "note" ? "note" : "highlight",
          sectionSlug: mark.sectionSlug,
          sectionTitle: mark.sectionTitle,
          blockId: mark.blockId || null,
          startOffset: mark.startOffset,
          endOffset: mark.endOffset,
          quote: mark.quote || mark.excerpt,
          excerpt: mark.excerpt || mark.quote,
          noteText: mark.noteText || "",
          sourceMarkId: mark.id,
        },
        mark.type === "note" ? "Added note to evidence." : "Added highlight to evidence.",
      );
      setSevenView("evidence");
    },
    [addEvidenceItem, evidenceItems, removeEvidenceItem],
  );

  const handleDeleteHighlight = useCallback(
    (highlightId) => {
      setReaderAnnotations((current) => deleteHighlight(current, highlightId));
      const existing = evidenceItems.find((item) => item.sourceMarkId === highlightId);
      if (existing) {
        void removeEvidenceItem(existing.id, "Removed highlight from evidence.");
      }
    },
    [evidenceItems, removeEvidenceItem],
  );

  const handleDeleteNote = useCallback(
    (noteId) => {
      setReaderAnnotations((current) => deleteNote(current, noteId));
      const existing = evidenceItems.find((item) => item.sourceMarkId === noteId);
      if (existing) {
        void removeEvidenceItem(existing.id, "Removed note from evidence.");
      }
    },
    [evidenceItems, removeEvidenceItem],
  );

  const handleUpdateNote = useCallback(
    (noteId, nextText) => {
      let nextNote = null;
      setReaderAnnotations((current) => {
        const updated = updateNote(current, noteId, nextText);
        nextNote = updated.notes.find((note) => note.id === noteId) || null;
        return updated;
      });

      const existing = evidenceItems.find((item) => item.sourceMarkId === noteId);
      if (existing && nextNote) {
        void addEvidenceItem(
          {
            origin: "reader",
            sourceType: "note",
            sectionSlug: nextNote.sectionSlug,
            sectionTitle: nextNote.sectionTitle,
            blockId: nextNote.blockId || null,
            startOffset: nextNote.startOffset,
            endOffset: nextNote.endOffset,
            quote: nextNote.quote || nextNote.excerpt,
            excerpt: nextNote.excerpt || nextNote.quote,
            noteText: nextNote.noteText || "",
            sourceMarkId: nextNote.id,
          },
          "Updated note in evidence.",
        );
      }
    },
    [addEvidenceItem, evidenceItems],
  );

  const handleOpenSevenEvidence = useCallback(
    (trigger = null) => {
      setSevenView("evidence");
      toggleSurface("seven", trigger);
    },
    [toggleSurface],
  );

  return (
    <div
      className={`reader-shell text-size-${preferences.textSize} page-width-${preferences.pageWidth} ${hasFloatingPanel ? "has-floating-panel" : ""} ${sevenOpen ? "has-seven-open" : ""}`}
      data-theme={preferences.theme}
    >
      <header className="reader-topbar">
        <div className="reader-topbar__primary">
          <button
            type="button"
            className={`reader-chrome-button reader-chrome-button--nav ${
              contentsOpen ? "is-active" : ""
            }`}
            onClick={(event) => toggleSurface("contents", event)}
            aria-label={contentsOpen ? "Close contents" : "Open contents"}
            aria-expanded={contentsOpen}
            title={contentsOpen ? "Close contents" : "Open contents"}
          >
            <span className="reader-button-icon" aria-hidden="true">
              ☰
            </span>
          </button>

          <div className="reader-topbar__center">
            <div className="reader-topbar__title">{documentData.title}</div>
            <div className="reader-topbar__section">{currentLabel}</div>
          </div>

          <div className="reader-topbar__actions">
            <button
              type="button"
              className={`reader-chrome-button reader-chrome-button--desktop-only reader-chrome-button--icon ${
                currentBookmarked ? "is-active" : ""
              }`}
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
              className={`reader-chrome-button ${notebookOpen ? "is-active" : ""}`}
              onClick={(event) => toggleSurface("notebook", event)}
              aria-label={notebookOpen ? "Close notebook" : "Open notebook"}
              aria-expanded={notebookOpen}
              title={notebookOpen ? "Close notebook" : "Open notebook"}
            >
              <span className="reader-button-icon">
                <NotebookIcon />
              </span>
            </button>

            <button
              type="button"
              className={`reader-chrome-button reader-chrome-button--seven ${
                sevenOpen ? "is-active" : ""
              }`}
              onClick={(event) => toggleSurface("seven", event)}
              aria-label={sevenOpen ? "Close Seven" : "Open Seven"}
              aria-expanded={sevenOpen}
              title={sevenOpen ? "Close Seven" : "Open Seven"}
            >
              <span className="reader-button-icon">
                <SevenIcon />
              </span>
            </button>

            <button
              type="button"
              className={`reader-chrome-button reader-chrome-button--desktop-only ${
                appearanceOpen ? "is-active" : ""
              }`}
              onClick={(event) => toggleSurface("appearance", event)}
              aria-label="Reader appearance"
              title="Reader appearance"
            >
              <span className="reader-button-icon" aria-hidden="true">
                Aa
              </span>
            </button>

            <Link
              href="/account"
              className="reader-chrome-button reader-chrome-button--desktop-only reader-account-link"
              aria-label="Account"
              title="Account"
            >
              <span className="reader-member-chip" aria-hidden="true">
                {memberInitial}
              </span>
            </Link>
          </div>
        </div>

        <div className="reader-topbar__progress" aria-hidden="true">
          <div
            className="reader-topbar__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {appearanceOpen ? (
        <div className="reader-appearance-menu" role="dialog" aria-label="Reader appearance">
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
      ) : null}

      <div
        className={`reader-overlay ${hasFloatingPanel ? "is-visible" : ""}`}
        onClick={() => closeSurface({ restoreFocus: false })}
      />

      <aside className={`reader-toc ${contentsOpen ? "is-open" : ""}`} aria-hidden={!contentsOpen}>
        <div className="reader-toc__header">
          <div className="reader-toc__header-copy">
            <p className="reader-toc__eyebrow">Contents</p>
            <h2 className="reader-toc__title">{documentData.title}</h2>
            <p className="reader-toc__status">
              <span>{currentLabel}</span>
              <span>{progressPercent}% read</span>
            </p>
          </div>

          <div className="reader-toc__header-actions">
            <Link
              href="/account"
              className="reader-toc__account"
              onClick={() => closeSurface({ restoreFocus: false })}
            >
              <span className="reader-member-chip" aria-hidden="true">
                {memberInitial}
              </span>
              <span>Account</span>
            </Link>
            <button
              type="button"
              className="reader-chrome-button reader-chrome-button--icon"
              onClick={() => closeSurface()}
              aria-label="Close contents"
            >
              ×
            </button>
          </div>
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

      <ReaderMarksPanel
        open={notebookOpen}
        currentLabel={currentLabel}
        progressPercent={progressPercent}
        scope={notebookScope}
        onScopeChange={setNotebookScope}
        currentBookmarked={currentBookmarked}
        onToggleBookmark={handleToggleBookmark}
        bookmarks={visibleBookmarks}
        highlights={visibleHighlights}
        notes={visibleNotes}
        evidenceMarkIds={evidenceMarkIds}
        onToggleMarkEvidence={handleToggleMarkEvidence}
        onOpenSeven={handleOpenSevenEvidence}
        onClose={() => closeSurface()}
        onJumpToBookmark={jumpToMark}
        onJumpToMark={jumpToMark}
        onDeleteBookmark={(bookmarkId) =>
          setReaderAnnotations((current) => deleteBookmark(current, bookmarkId))
        }
        onDeleteHighlight={handleDeleteHighlight}
        onDeleteNote={handleDeleteNote}
        onUpdateNote={handleUpdateNote}
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
        view={sevenView}
        onChangeView={setSevenView}
        initialThread={initialConversationThread}
        evidenceItems={evidenceItems}
        onAddEvidenceItem={addEvidenceItem}
        onRemoveEvidenceItem={removeEvidenceItem}
        onShowNotice={showReceiptNotice}
        onNavigateSection={jumpTo}
        onClose={() => closeSurface()}
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
              <p className="reader-beginning__eyebrow">Reading Instrument</p>
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

            {documentData.sections.map((section) => {
              return (
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
              );
            })}
          </article>
        </div>
      </main>

      <SelectionMenu
        selection={selectionState}
        noteDraft={noteDraft}
        onHighlight={handleCreateHighlight}
        onAddToEvidence={handleAddSelectionToEvidence}
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
              {currentEntry.number
                ? `${currentEntry.number} · ${progressPercent}% read`
                : `${progressPercent}% read`}
            </span>
            <span className="reader-bottomrail__current-title">{currentLabel}</span>
            <span className="reader-bottomrail__current-progress">{progressPercent}% read</span>
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
