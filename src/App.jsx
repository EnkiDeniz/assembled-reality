import { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
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
import LandingPage from "./pages/LandingPage";
import { exportCarryList } from "./utils/markdownExport";

export default function App() {
  const store = useStore();
  const [rightPanel, setRightPanel] = useState(null);
  const isDesktop = useMediaQuery("(min-width: 769px)");
  const [navOpen, setNavOpen] = useState(false);
  const nav = navOpen;

  // Session tracking
  const tracker = useSessionTracker(store.reader);

  // Track reading position changes into session
  const currentSectionId = store.readingPositions?.[store.reader]?.sectionId;
  const { recordSectionVisit, recordAction, duration, session, getActionCounts, getUniqueSectionsVisited, resetSession } = tracker;
  useEffect(() => {
    if (currentSectionId) recordSectionVisit(currentSectionId);
  }, [currentSectionId, recordSectionVisit]);

  const wrappedStore = useMemo(() => ({
    ...store,
    onSig: (sid, key) => {
      store.onSig(sid, key);
      recordAction("signal", { sectionId: sid, shape: key });
    },
    onAnn: (sid, txt) => {
      store.onAnn(sid, txt);
      recordAction("annotation", { sectionId: sid });
    },
    addHighlight: (hl) => {
      store.addHighlight(hl);
      recordAction("highlight", { sectionId: hl.anchor?.sectionId, text: hl.anchor?.textContent?.slice(0, 80) });
    },
    addCarryItem: (item) => {
      store.addCarryItem(item);
      recordAction("carry", { sectionId: item.anchor?.sectionId, text: item.text?.slice(0, 80) });
    },
    addInlineComment: (comment) => {
      store.addInlineComment(comment);
      recordAction("comment", {});
    },
    toggleStatusTag: (sectionId, tagKey) => {
      store.toggleStatusTag(sectionId, tagKey);
      recordAction("status_tag", { sectionId, tag: tagKey });
    },
    toggleReaction: (bqId, emojiKey) => {
      store.toggleReaction(bqId, emojiKey);
      recordAction("reaction", { emoji: emojiKey });
    },
  }), [store, recordAction]);

  const tA = Object.values(store.anns).reduce((s, a) => s + a.length, 0);
  const tS = Object.values(store.sigs).reduce((s, x) => s + SHAPES.reduce((s2, { key }) => s2 + ((x[key] || []).length), 0), 0);
  const currentSection = SECTIONS.find(s => s.id === currentSectionId) || null;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              store.phase === "pass"
                ? <PassGate onPass={store.onPass} />
                : <LandingPage phase={store.phase} reader={store.reader} />
            }
          />
          <Route
            path="/document"
            element={
              <DocumentRoute
                store={store}
                wrappedStore={wrappedStore}
                nav={nav}
                setNav={setNavOpen}
                isDesktop={isDesktop}
                rightPanel={rightPanel}
                setRightPanel={setRightPanel}
                currentSection={currentSection}
                currentSectionId={currentSectionId}
                tA={tA}
                tS={tS}
                duration={duration}
                session={session}
                getActionCounts={getActionCounts}
                getUniqueSectionsVisited={getUniqueSectionsVisited}
                resetSession={resetSession}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function DocumentRoute({
  store,
  wrappedStore,
  nav,
  setNav,
  isDesktop,
  rightPanel,
  setRightPanel,
  currentSection,
  currentSectionId,
  tA,
  tS,
  duration,
  session,
  getActionCounts,
  getUniqueSectionsVisited,
  resetSession,
}) {
  if (store.phase === "loading") {
    return <div className="min-h-screen bg-paper" />;
  }

  if (store.phase === "pass") {
    return <PassGate onPass={store.onPass} />;
  }

  if (store.phase === "name") {
    return <NameGate onSelect={store.onName} />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_rgba(255,255,255,0.62),_rgba(255,255,255,0.1)),radial-gradient(circle_at_top_left,_rgba(180,90,56,0.05),_transparent_22%),var(--color-paper)] font-sans text-ink leading-[1.75] text-body">
      <TopBar
        reader={store.reader}
        tS={tS}
        tA={tA}
        nav={nav}
        setNav={setNav}
        pulse={rightPanel === "pulse"}
        setPulse={(v) => setRightPanel(v ? "pulse" : null)}
        carry={rightPanel === "carry"}
        setCarry={(v) => setRightPanel(v ? "carry" : null)}
        currentSection={currentSection}
        sessionDuration={duration}
      />

      {nav && (
        <NavSidebar
          anns={store.anns}
          sigs={store.sigs}
          readingPositions={store.readingPositions}
          onClose={() => setNav(false)}
          currentSectionId={currentSectionId}
        />
      )}
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
          session={session}
          duration={duration}
          actionCounts={getActionCounts()}
          uniqueSections={getUniqueSectionsVisited()}
          onClose={() => setRightPanel(null)}
          onSave={(receipt) => {
            store.saveSessionReceipt({ ...receipt, sessionId: session?.id });
            resetSession();
            setRightPanel(null);
          }}
        />
      )}

      <DocumentView store={wrappedStore} nav={nav} isDesktop={isDesktop} />
    </div>
  );
}
