import { useState, useEffect, useRef } from "react";
import { deserializeRange } from "../../utils/rangeSerializer";
import { parseMentions } from "../../utils/mentionParser";
import MentionInput from "./MentionInput";
import useMediaQuery from "../../hooks/useMediaQuery";

function MentionText({ text }) {
  const segments = parseMentions(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "mention" ? (
          <span key={i} className="text-ink font-semibold text-md">@{seg.name}</span>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </>
  );
}

function CommentCard({ comment, onReply, onClose, isMobile }) {
  const [txt, setTxt] = useState("");

  if (isMobile) {
    return (
      <>
        <div onClick={onClose} className="fixed inset-0 z-240 bg-black/8" />
        <div className="bottom-sheet fixed bottom-0 left-0 right-0 z-250 bg-surface border-t border-border rounded-t-[10px] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] max-h-[70vh] flex flex-col">
          <div className="flex justify-center py-2 pb-1">
            <div className="w-8 h-[3px] rounded-sm bg-border" />
          </div>
          <div className="px-4 py-1 pb-2 border-b border-divider flex justify-between items-center">
            <span className="text-sm font-semibold text-ink-muted uppercase tracking-[0.04em]">Comment</span>
            <button onClick={onClose} className="bg-transparent border border-border rounded-[3px] px-3.5 py-1.5 text-base font-medium text-ink-tertiary cursor-pointer">Close</button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2.5">
            {comment.threads.map((t, i) => (
              <div key={i} className={`mb-2.5 pb-2 ${i < comment.threads.length - 1 ? "border-b border-divider" : ""}`}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-base font-semibold text-ink-secondary">{t.author}</span>
                  <span className="text-sm text-ink-muted">{t.time}</span>
                </div>
                <p className="text-[0.875rem] leading-[1.4] m-0"><MentionText text={t.text} /></p>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-divider pb-[max(10px,env(safe-area-inset-bottom))]">
            <MentionInput value={txt} onChange={setTxt} placeholder="Reply..." rows={2} />
            <button
              onClick={() => { if (txt.trim()) { onReply(comment.id, txt.trim()); setTxt(""); } }}
              disabled={!txt.trim()}
              className={`mt-1.5 px-4 py-2 text-base font-medium border-none rounded-[3px] w-full min-h-9 ${
                txt.trim() ? "bg-ink text-white cursor-pointer" : "bg-border text-ink-muted cursor-default"
              }`}
            >
              Reply
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="absolute -right-[270px] top-0 w-[250px] bg-surface border border-border rounded-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-150">
      <div className="px-2.5 py-2 border-b border-divider flex justify-between items-center">
        <span className="text-sm font-semibold text-ink-muted uppercase tracking-[0.04em]">Comment</span>
        <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ink-muted text-[0.875rem] p-1 px-2 min-h-7">&times;</button>
      </div>
      <div className="px-2.5 py-2 max-h-[200px] overflow-y-auto">
        {comment.threads.map((t, i) => (
          <div key={i} className={`mb-2 pb-1.5 ${i < comment.threads.length - 1 ? "border-b border-divider" : ""}`}>
            <div className="flex justify-between mb-0.5">
              <span className="text-base font-semibold text-ink-secondary">{t.author}</span>
              <span className="text-sm text-ink-muted">{t.time}</span>
            </div>
            <p className="text-md leading-[1.4] m-0"><MentionText text={t.text} /></p>
          </div>
        ))}
      </div>
      <div className="px-2.5 py-1.5 border-t border-divider">
        <MentionInput value={txt} onChange={setTxt} placeholder="Reply..." rows={1} />
        <button
          onClick={() => { if (txt.trim()) { onReply(comment.id, txt.trim()); setTxt(""); } }}
          disabled={!txt.trim()}
          className={`mt-1 px-2.5 py-1 text-base font-medium border-none rounded-[3px] ${
            txt.trim() ? "bg-ink text-white cursor-pointer" : "bg-border text-ink-muted cursor-default"
          }`}
        >
          Reply
        </button>
      </div>
    </div>
  );
}

export default function InlineCommentLayer({ comments, addReply, newAnchor, onAddNew, onCancelNew }) {
  const [openId, setOpenId] = useState(null);
  const [newTxt, setNewTxt] = useState("");
  const [commentPositions, setCommentPositions] = useState([]);
  const isDesktop = useMediaQuery("(min-width: 769px)");
  const isMobile = !isDesktop;
  const marksRef = useRef([]);

  useEffect(() => {
    marksRef.current.forEach(({ mark }) => {
      const parent = mark.parentNode;
      if (parent) { parent.replaceChild(document.createTextNode(mark.textContent), mark); parent.normalize(); }
    });
    marksRef.current = [];

    comments.forEach(comment => {
      const range = deserializeRange(comment.anchor);
      if (!range) return;
      try {
        const mark = document.createElement("mark");
        mark.style.cssText = "background: transparent; border-bottom: 1px dashed #999; cursor: pointer; padding: 0;";
        mark.dataset.commentId = comment.id;
        mark.addEventListener("click", () => setOpenId(prev => prev === comment.id ? null : comment.id));
        range.surroundContents(mark);
        marksRef.current.push({ mark, comment });
      } catch { /* skip */ }
    });

    return () => {
      marksRef.current.forEach(({ mark }) => {
        const parent = mark.parentNode;
        if (parent) { parent.replaceChild(document.createTextNode(mark.textContent), mark); parent.normalize(); }
      });
      marksRef.current = [];
      setCommentPositions([]);
    };
  }, [comments]);

  useEffect(() => {
    const updatePositions = () => {
      setCommentPositions(
        marksRef.current.map(({ mark, comment }) => {
          const rect = mark.getBoundingClientRect();
          return { comment, top: rect.top + window.scrollY, mark };
        })
      );
    };

    updatePositions();
    window.addEventListener("scroll", updatePositions, { passive: true });
    window.addEventListener("resize", updatePositions);
    return () => {
      window.removeEventListener("scroll", updatePositions);
      window.removeEventListener("resize", updatePositions);
    };
  }, [comments, openId]);

  return (
    <>
      {commentPositions.map(({ comment, top }) => {
        if (openId !== comment.id) return null;
        if (isMobile) return <CommentCard key={comment.id} comment={comment} onReply={addReply} onClose={() => setOpenId(null)} isMobile />;
        return (
          <div key={comment.id} className="absolute ml-2" style={{ top, left: "100%" }}>
            <CommentCard comment={comment} onReply={addReply} onClose={() => setOpenId(null)} isMobile={false} />
          </div>
        );
      })}

      {newAnchor && (
        <>
          <div onClick={() => { onCancelNew(); setNewTxt(""); }} className="fixed inset-0 z-240 bg-black/8" />
          {isMobile ? (
            <div className="bottom-sheet fixed bottom-0 left-0 right-0 z-250 bg-surface border-t border-border rounded-t-[10px] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
              <div className="flex justify-center py-2 pb-1">
                <div className="w-8 h-[3px] rounded-sm bg-border" />
              </div>
              <div className="text-sm font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1.5">Comment on:</div>
              <div className="text-[0.875rem] text-ink-tertiary mb-2.5 px-2.5 py-2 bg-surface-raised rounded-[3px]">
                "{newAnchor.textContent.length > 60 ? newAnchor.textContent.slice(0, 60) + "\u2026" : newAnchor.textContent}"
              </div>
              <MentionInput value={newTxt} onChange={setNewTxt} placeholder="Your comment..." rows={3} />
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => { onCancelNew(); setNewTxt(""); }}
                  className="flex-1 px-3 py-2.5 text-base font-medium bg-transparent border border-border rounded-[3px] cursor-pointer text-ink-tertiary min-h-9"
                >Cancel</button>
                <button
                  onClick={() => { if (newTxt.trim()) { onAddNew({ id: `ic-${Date.now()}`, anchor: newAnchor, sectionId: newAnchor.sectionId, text: newTxt.trim() }); setNewTxt(""); } }}
                  disabled={!newTxt.trim()}
                  className={`flex-1 px-3 py-2.5 text-base font-medium border-none rounded-[3px] min-h-9 ${
                    newTxt.trim() ? "bg-ink text-white cursor-pointer" : "bg-border text-ink-muted cursor-default"
                  }`}
                >Add</button>
              </div>
            </div>
          ) : (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-250 bg-surface border border-border rounded-[4px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] p-4 w-[340px]">
              <div className="text-sm font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1.5">Comment on:</div>
              <div className="text-[0.875rem] text-ink-tertiary mb-2.5 px-2 py-1.5 bg-surface-raised rounded-[3px]">
                "{newAnchor.textContent.length > 80 ? newAnchor.textContent.slice(0, 80) + "\u2026" : newAnchor.textContent}"
              </div>
              <MentionInput value={newTxt} onChange={setNewTxt} placeholder="Your comment..." rows={2} />
              <div className="flex gap-1.5 mt-2 justify-end">
                <button
                  onClick={() => { onCancelNew(); setNewTxt(""); }}
                  className="px-3 py-1.5 text-base font-medium bg-transparent border border-border rounded-[3px] cursor-pointer text-ink-tertiary"
                >Cancel</button>
                <button
                  onClick={() => { if (newTxt.trim()) { onAddNew({ id: `ic-${Date.now()}`, anchor: newAnchor, sectionId: newAnchor.sectionId, text: newTxt.trim() }); setNewTxt(""); } }}
                  disabled={!newTxt.trim()}
                  className={`px-3 py-1.5 text-base font-medium border-none rounded-[3px] ${
                    newTxt.trim() ? "bg-ink text-white cursor-pointer" : "bg-border text-ink-muted cursor-default"
                  }`}
                >Add</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
