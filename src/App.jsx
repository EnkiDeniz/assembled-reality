import { useState, useEffect, useCallback, useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SHAPES, SECTIONS } from "./constants";
import useStore from "./hooks/useStore";
import useMediaQuery from "./hooks/useMediaQuery";
import useSessionTracker from "./hooks/useSessionTracker";
import PassGate from "./components/gates/PassGate";
import NameGate from "./components/gates/NameGate";
import TopBar from "./components/layout/TopBar";
import NavSidebar from "./components/layout/NavSidebar";
import PulseSidebar from "./components/layout/PulseSidebar";
import CarryListPanel from "./components/panels/CarryListPanel";
import ReceiptPanel from "./components/panels/ReceiptPanel";
import DocumentView from "./pages/DocumentView";
import PlaceholderPage from "./pages/PlaceholderPage";
import { exportCarryList } from "./utils/markdownExport";

export default function App() {
  const store = useStore();
  const [rightPanel, setRightPanel] = useState(null);
  const isDesktop = useMediaQuery("(min-width: 769px)");
  const [nav, setNav] = useState(isDesktop);

  // Session tracking
  const tracker = useSessionTracker(store.reader);

  useEffect(() => {
    if (!isDesktop) setNav(false);
  }, [isDesktop]);

  // Track reading position changes into session
  const currentSectionId = store.readingPositions?.[store.reader]?.sectionId;
  useEffect(() => {
    if (currentSectionId) tracker.recordSectionVisit(currentSectionId);
  }, [currentSectionId]);

  // Wrapped store callbacks that also record into session tracker
  const wrappedOnSig = useCallback((sid, key) => {
    store.onSig(sid, key);
    tracker.recordAction("signal", { sectionId: sid, shape: key });
  }, [store.onSig, tracker.recordAction]);

  const wrappedOnAnn = useCallback((sid, txt) => {
    store.onAnn(sid, txt);
    tracker.recordAction("annotation", { sectionId: sid });
  }, [store.onAnn, tracker.recordAction]);

  const wrappedAddHighlight = useCallback((hl) => {
    store.addHighlight(hl);
    tracker.recordAction("highlight", { sectionId: hl.anchor?.sectionId, text: hl.anchor?.textContent?.slice(0, 80) });
  }, [store.addHighlight, tracker.recordAction]);

  const wrappedAddCarryItem = useCallback((item) => {
    store.addCarryItem(item);
    tracker.recordAction("carry", { sectionId: item.anchor?.sectionId, text: item.text?.slice(0, 80) });
  }, [store.addCarryItem, tracker.recordAction]);

  const wrappedAddInlineComment = useCallback((comment) => {
    store.addInlineComment(comment);
    tracker.recordAction("comment", {});
  }, [store.addInlineComment, tracker.recordAction]);

  const wrappedToggleStatusTag = useCallback((sectionId, tagKey) => {
    store.toggleStatusTag(sectionId, tagKey);
    tracker.recordAction("status_tag", { sectionId, tag: tagKey });
  }, [store.toggleStatusTag, tracker.recordAction]);

  const wrappedToggleReaction = useCallback((bqId, emojiKey) => {
    store.toggleReaction(bqId, emojiKey);
    tracker.recordAction("reaction", { emoji: emojiKey });
  }, [store.toggleReaction, tracker.recordAction]);

  // Build a wrapped store object for DocumentView
  const wrappedStore = useMemo(() => ({
    ...store,
    onSig: wrappedOnSig,
    onAnn: wrappedOnAnn,
    addHighlight: wrappedAddHighlight,
    addCarryItem: wrappedAddCarryItem,
    addInlineComment: wrappedAddInlineComment,
    toggleStatusTag: wrappedToggleStatusTag,
    toggleReaction: wrappedToggleReaction,
  }), [store, wrappedOnSig, wrappedOnAnn, wrappedAddHighlight, wrappedAddCarryItem, wrappedAddInlineComment, wrappedToggleStatusTag, wrappedToggleReaction]);

  if (store.phase === "loading") return <div className="min-h-screen bg-surface" />;
  if (store.phase === "pass") return <PassGate onPass={store.onPass} />;
  if (store.phase === "name") return <NameGate onSelect={store.onName} />;

  const tA = Object.values(store.anns).reduce((s, a) => s + a.length, 0);
  const tS = Object.values(store.sigs).reduce((s, x) => s + SHAPES.reduce((s2, { key }) => s2 + ((x[key] || []).length), 0), 0);
  const currentSection = SECTIONS.find(s => s.id === currentSectionId) || null;

  return (
    <BrowserRouter>
      <div className="bg-surface min-h-screen font-sans text-ink leading-[1.7] text-body">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

        <TopBar
          reader={store.reader} tS={tS} tA={tA}
          nav={nav} setNav={setNav}
          pulse={rightPanel === "pulse"}
          setPulse={(v) => setRightPanel(v ? "pulse" : null)}
          carry={rightPanel === "carry"}
          setCarry={(v) => setRightPanel(v ? "carry" : null)}
          currentSection={currentSection}
          sessionDuration={tracker.duration}
        />

        {nav && <NavSidebar anns={store.anns} sigs={store.sigs} highlights={store.highlights} readingPositions={store.readingPositions} onClose={() => setNav(false)} currentSectionId={currentSectionId} />}
        {rightPanel === "pulse" && <PulseSidebar anns={store.anns} sigs={store.sigs} onClose={() => setRightPanel(null)} />}
        {rightPanel === "carry" && (
          <CarryListPanel
            carryList={store.carryList}
            reader={store.reader}
            onRemove={store.removeCarryItem}
            onClose={() => setRightPanel(null)}
            onExport={() => exportCarryList(store.reader, store.carryList, store.highlights)}
          />
        )}
        {rightPanel === "receipt" && (
          <ReceiptPanel
            session={tracker.session}
            duration={tracker.duration}
            actionCounts={tracker.getActionCounts()}
            uniqueSections={tracker.getUniqueSectionsVisited()}
            onClose={() => setRightPanel(null)}
            onSave={(receipt) => {
              store.saveSessionReceipt({ ...receipt, sessionId: tracker.session?.id });
              tracker.resetSession();
              setRightPanel(null);
            }}
          />
        )}

        <Routes>
          <Route path="/" element={<DocumentView store={wrappedStore} nav={nav} isDesktop={isDesktop} />} />
          <Route path="/files" element={<PlaceholderPage title="Files" description="Share and collaborate on files with your team." />} />
          <Route path="/notifications" element={<PlaceholderPage title="Notifications" description="Stay updated on team activity and mentions." />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
