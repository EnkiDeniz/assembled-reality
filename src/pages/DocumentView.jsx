import { useRef, useCallback, useState } from "react";
import useTextSelection from "../hooks/useTextSelection";
import useReadingPosition from "../hooks/useReadingPosition";
import DocContent from "../components/document/DocContent";
import SelectionPopover from "../components/interaction/SelectionPopover";
import TextHighlighter from "../components/interaction/TextHighlighter";
import InlineCommentLayer from "../components/interaction/InlineComment";
import ReadingPresenceDots from "../components/interaction/ReadingPresenceDots";

export default function DocumentView({ store, nav, isDesktop }) {
  const [commentAnchor, setCommentAnchor] = useState(null);
  const contentRef = useRef(null);
  const { selection, popoverPos, clearSelection } = useTextSelection(contentRef);

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

  return (
    <div ref={contentRef} className="relative transition-[margin-left] duration-[250ms] ease-in-out" style={{ marginLeft: (nav && isDesktop) ? 260 : 0 }}>
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
  );
}
