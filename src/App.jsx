import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SHAPES, SECTIONS } from "./constants";
import useStore from "./hooks/useStore";
import useMediaQuery from "./hooks/useMediaQuery";
import PassGate from "./components/gates/PassGate";
import NameGate from "./components/gates/NameGate";
import TopBar from "./components/layout/TopBar";
import NavSidebar from "./components/layout/NavSidebar";
import PulseSidebar from "./components/layout/PulseSidebar";
import CarryListPanel from "./components/panels/CarryListPanel";
import DocumentView from "./pages/DocumentView";
import PlaceholderPage from "./pages/PlaceholderPage";
import { exportCarryList } from "./utils/markdownExport";

export default function App() {
  const store = useStore();
  const [rightPanel, setRightPanel] = useState(null);
  const isDesktop = useMediaQuery("(min-width: 769px)");
  const [nav, setNav] = useState(isDesktop);

  useEffect(() => {
    if (!isDesktop) setNav(false);
  }, [isDesktop]);

  if (store.phase === "loading") return <div className="min-h-screen bg-surface" />;
  if (store.phase === "pass") return <PassGate onPass={store.onPass} />;
  if (store.phase === "name") return <NameGate onSelect={store.onName} />;

  const tA = Object.values(store.anns).reduce((s, a) => s + a.length, 0);
  const tS = Object.values(store.sigs).reduce((s, x) => s + SHAPES.reduce((s2, { key }) => s2 + ((x[key] || []).length), 0), 0);
  const currentSectionId = store.readingPositions?.[store.reader]?.sectionId;
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
        />

        {nav && <NavSidebar anns={store.anns} sigs={store.sigs} highlights={store.highlights} readingPositions={store.readingPositions} onClose={() => setNav(false)} />}
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

        <Routes>
          <Route path="/" element={<DocumentView store={store} nav={nav} isDesktop={isDesktop} />} />
          <Route path="/files" element={<PlaceholderPage title="Files" description="Share and collaborate on files with your team." />} />
          <Route path="/notifications" element={<PlaceholderPage title="Notifications" description="Stay updated on team activity and mentions." />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
