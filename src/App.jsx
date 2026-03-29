import { useState, useRef, useCallback, useEffect } from "react";
import { SHAPES, SECTIONS } from "./constants";
import useStore from "./hooks/useStore";
import useTextSelection from "./hooks/useTextSelection";
import useReadingPosition from "./hooks/useReadingPosition";
import PassGate from "./components/gates/PassGate";
import NameGate from "./components/gates/NameGate";
import TopBar from "./components/layout/TopBar";
import NavSidebar from "./components/layout/NavSidebar";
import PulseSidebar from "./components/layout/PulseSidebar";
import DocContent from "./components/document/DocContent";
import SelectionPopover from "./components/interaction/SelectionPopover";
import TextHighlighter from "./components/interaction/TextHighlighter";
import InlineCommentLayer from "./components/interaction/InlineComment";
import ReadingPresenceDots from "./components/interaction/ReadingPresenceDots";
import CarryListPanel from "./components/panels/CarryListPanel";
import { exportCarryList } from "./utils/markdownExport";

export default function App() {
  const store = useStore();
  const [rightPanel, setRightPanel] = useState(null); // "pulse" | "carry" | null
  const initDesktop = typeof window !== "undefined" && window.innerWidth > 768;
  const [nav, setNav] = useState(initDesktop);
  const [isMobile, setIsMobile] = useState(!initDesktop);
  const [commentAnchor, setCommentAnchor] = useState(null);
  const contentRef = useRef(null);
  const { selection, popoverPos, clearSelection } = useTextSelection(contentRef);

  // Track mobile state and auto-close nav when resizing to mobile
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setNav(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Track reading position
  useReadingPosition(store.reader, store.updateReadingPosition);

  const handleHighlight = useCallback((shape) => {
    if (!selection) return;
    store.addHighlight({ id: `hl-${Date.now()}`, shape, anchor: selection });
    clearSelection();
  }, [selection, store, clearSelection]);

  const handleUnderline = useCallback(() => {
    if (!selection) return;
    store.addCarryItem({ id: `cl-${Date.now()}`, anchor: selection, text: selection.textContent });
    clearSelection();
  }, [selection, store, clearSelection]);

  const handleComment = useCallback(() => {
    if (!selection) return;
    setCommentAnchor(selection);
    clearSelection();
  }, [selection, clearSelection]);

  if (store.phase === "loading") return <div style={{ minHeight: "100vh", background: "#FAFAF9" }} />;
  if (store.phase === "pass") return <PassGate onPass={store.onPass} />;
  if (store.phase === "name") return <NameGate onSelect={store.onName} />;

  const tA = Object.values(store.anns).reduce((s, a) => s + a.length, 0);
  const tS = Object.values(store.sigs).reduce((s, x) => s + SHAPES.reduce((s2, { key }) => s2 + ((x[key] || []).length), 0), 0);
  const currentSectionId = store.readingPositions?.[store.reader]?.sectionId;
  const currentSection = SECTIONS.find(s => s.id === currentSectionId) || null;

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: "#111", lineHeight: 1.7, fontSize: "0.9375rem" }}>
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

      <div ref={contentRef} style={{ position: "relative", marginLeft: (nav && !isMobile) ? 260 : 0, transition: "margin-left 0.25s ease" }}>
        <ReadingPresenceDots readingPositions={store.readingPositions} currentReader={store.reader} />
        <TextHighlighter highlights={store.highlights} reader={store.reader} />
        <SelectionPopover
          pos={popoverPos}
          onHighlight={handleHighlight}
          onUnderline={handleUnderline}
          onComment={handleComment}
          onClose={clearSelection}
        />
        <InlineCommentLayer
          comments={store.inlineComments}
          reader={store.reader}
          addReply={store.addCommentReply}
          newAnchor={commentAnchor}
          onAddNew={(c) => { store.addInlineComment(c); setCommentAnchor(null); }}
          onCancelNew={() => setCommentAnchor(null)}
        />
        <DocContent
          sigs={store.sigs} anns={store.anns} reader={store.reader}
          onSig={store.onSig} onAnn={store.onAnn}
          statusTags={store.statusTags}
          toggleStatusTag={store.toggleStatusTag}
          emojiReactions={store.emojiReactions}
          toggleReaction={store.toggleReaction}
          versionPulse={store.versionPulse}
          dismissVersionBanner={store.dismissVersionBanner}
          welcomeDismissed={store.welcomeDismissed}
          dismissWelcome={store.dismissWelcome}
          resetWelcome={store.resetWelcome}
          navOpen={nav}
        />
      </div>
    </div>
  );
}
