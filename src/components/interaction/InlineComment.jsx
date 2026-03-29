import { useState, useEffect, useRef, useMemo } from "react";
import { deserializeRange } from "../../utils/rangeSerializer";
import { parseMentions } from "../../utils/mentionParser";
import MentionInput from "./MentionInput";

function MentionText({ text }) {
  const segments = parseMentions(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "mention" ? (
          <span key={i} style={{ color: "#B84C2A", fontWeight: 600, fontFamily: "'DM Sans',sans-serif", fontSize: "0.78rem" }}>@{seg.name}</span>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </>
  );
}

function CommentCard({ comment, reader, onReply, onClose, isMobile }) {
  const [txt, setTxt] = useState("");

  // On mobile: bottom sheet. On desktop: positioned to the right.
  if (isMobile) {
    return (
      <>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 240, background: "rgba(0,0,0,0.12)" }} />
        <div
          className="bottom-sheet"
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            zIndex: 250, background: "#F7F4EF",
            borderTop: "1px solid #D6D1C8",
            borderRadius: "12px 12px 0 0",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            maxHeight: "70vh", display: "flex", flexDirection: "column",
          }}
        >
          {/* Handle bar */}
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D6D1C8" }} />
          </div>
          <div style={{ padding: "4px 16px 8px", borderBottom: "1px solid #E8E4DC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.56rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A877F" }}>Comment</span>
            <button onClick={onClose} style={{
              background: "none", border: "1px solid #D6D1C8", borderRadius: 4,
              padding: "6px 14px", fontSize: "0.62rem", fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600, color: "#5C5A55", cursor: "pointer",
            }}>Close</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "10px 16px" }}>
            {comment.threads.map((t, i) => (
              <div key={i} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: i < comment.threads.length - 1 ? "1px solid #E8E4DC" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.64rem", fontWeight: 600, color: "#5C5A55" }}>{t.author}</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.54rem", color: "#8A877F" }}>{t.time}</span>
                </div>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.4, margin: 0 }}><MentionText text={t.text} /></p>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid #E8E4DC", paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
            <MentionInput value={txt} onChange={setTxt} placeholder="Reply... (use @name)" rows={2} />
            <button
              onClick={() => { if (txt.trim()) { onReply(comment.id, txt.trim()); setTxt(""); } }}
              disabled={!txt.trim()}
              style={{
                marginTop: 6, padding: "8px 16px", fontSize: "0.58rem",
                fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
                background: txt.trim() ? "#1A1917" : "#D6D1C8",
                color: txt.trim() ? "#F7F4EF" : "#8A877F",
                border: "none", borderRadius: 3, cursor: txt.trim() ? "pointer" : "default",
                width: "100%", minHeight: 40,
              }}
            >Reply</button>
          </div>
        </div>
      </>
    );
  }

  // Desktop: positioned card
  return (
    <div style={{
      position: "absolute", right: -280, top: 0, width: 260,
      background: "#F7F4EF", border: "1px solid #D6D1C8", borderRadius: 4,
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 150,
      fontFamily: "'Cormorant Garamond',Georgia,serif",
    }}>
      <div style={{ padding: "8px 10px", borderBottom: "1px solid #E8E4DC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.52rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A877F" }}>Comment</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A877F", fontSize: "0.8rem", padding: "4px 8px", minHeight: 32 }}>&times;</button>
      </div>
      <div style={{ padding: "8px 10px", maxHeight: 200, overflowY: "auto" }}>
        {comment.threads.map((t, i) => (
          <div key={i} style={{ marginBottom: 8, paddingBottom: 6, borderBottom: i < comment.threads.length - 1 ? "1px solid #E8E4DC" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.6rem", fontWeight: 600, color: "#5C5A55" }}>{t.author}</span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.5rem", color: "#8A877F" }}>{t.time}</span>
            </div>
            <p style={{ fontSize: "0.8rem", lineHeight: 1.4, margin: 0 }}><MentionText text={t.text} /></p>
          </div>
        ))}
      </div>
      <div style={{ padding: "6px 10px", borderTop: "1px solid #E8E4DC" }}>
        <MentionInput value={txt} onChange={setTxt} placeholder="Reply... (use @name)" rows={1} />
        <button
          onClick={() => { if (txt.trim()) { onReply(comment.id, txt.trim()); setTxt(""); } }}
          disabled={!txt.trim()}
          style={{
            marginTop: 4, padding: "3px 10px", fontSize: "0.54rem",
            fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            background: txt.trim() ? "#1A1917" : "#D6D1C8",
            color: txt.trim() ? "#F7F4EF" : "#8A877F",
            border: "none", borderRadius: 3, cursor: txt.trim() ? "pointer" : "default",
          }}
        >Reply</button>
      </div>
    </div>
  );
}

export default function InlineCommentLayer({ comments, reader, addReply, newAnchor, onAddNew, onCancelNew }) {
  const [openId, setOpenId] = useState(null);
  const [newTxt, setNewTxt] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const marksRef = useRef([]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Render comment anchors as subtle marks
  useEffect(() => {
    // Clean up old marks
    marksRef.current.forEach(({ mark }) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
    marksRef.current = [];

    comments.forEach(comment => {
      const range = deserializeRange(comment.anchor);
      if (!range) return;

      try {
        const mark = document.createElement("mark");
        mark.style.cssText = "background: transparent; border-bottom: 1px dashed #B84C2A80; cursor: pointer; padding: 0;";
        mark.dataset.commentId = comment.id;
        mark.addEventListener("click", () => setOpenId(prev => prev === comment.id ? null : comment.id));
        range.surroundContents(mark);
        marksRef.current.push({ mark, comment });
      } catch {
        // Range spans elements, skip gracefully
      }
    });

    return () => {
      marksRef.current.forEach(({ mark }) => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent), mark);
          parent.normalize();
        }
      });
      marksRef.current = [];
    };
  }, [comments]);

  // Comment indicators in the margin
  const commentPositions = useMemo(() => {
    return marksRef.current.map(({ mark, comment }) => {
      const rect = mark.getBoundingClientRect();
      return { comment, top: rect.top + window.scrollY, mark };
    });
  }, [comments, openId]);

  return (
    <>
      {/* Floating comment cards for open threads */}
      {commentPositions.map(({ comment, top }) => {
        if (openId !== comment.id) return null;
        if (isMobile) {
          return (
            <CommentCard
              key={comment.id}
              comment={comment}
              reader={reader}
              onReply={addReply}
              onClose={() => setOpenId(null)}
              isMobile
            />
          );
        }
        return (
          <div key={comment.id} style={{ position: "absolute", top, left: "100%", marginLeft: 8 }}>
            <CommentCard comment={comment} reader={reader} onReply={addReply} onClose={() => setOpenId(null)} isMobile={false} />
          </div>
        );
      })}

      {/* New comment dialog */}
      {newAnchor && (
        <>
          <div onClick={() => { onCancelNew(); setNewTxt(""); }} style={{ position: "fixed", inset: 0, zIndex: 240, background: "rgba(0,0,0,0.12)" }} />
          {isMobile ? (
            <div
              className="bottom-sheet"
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                zIndex: 250, background: "#F7F4EF",
                borderTop: "1px solid #D6D1C8",
                borderRadius: "12px 12px 0 0",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
                padding: "0 16px", paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D6D1C8" }} />
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.56rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A877F", marginBottom: 6 }}>Comment on:</div>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "0.88rem", fontStyle: "italic", color: "#5C5A55", marginBottom: 10, padding: "8px 10px", background: "#F0ECE4", borderRadius: 3 }}>
                "{newAnchor.textContent.length > 60 ? newAnchor.textContent.slice(0, 60) + "\u2026" : newAnchor.textContent}"
              </div>
              <MentionInput value={newTxt} onChange={setNewTxt} placeholder="Your comment... (use @name to mention)" rows={3} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => { onCancelNew(); setNewTxt(""); }} style={{
                  flex: 1, padding: "10px 12px", fontSize: "0.58rem",
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 500,
                  background: "transparent", border: "1px solid #D6D1C8",
                  borderRadius: 3, cursor: "pointer", color: "#5C5A55", minHeight: 40,
                }}>Cancel</button>
                <button
                  onClick={() => { if (newTxt.trim()) { onAddNew({ id: `ic-${Date.now()}`, anchor: newAnchor, sectionId: newAnchor.sectionId, text: newTxt.trim() }); setNewTxt(""); } }}
                  disabled={!newTxt.trim()}
                  style={{
                    flex: 1, padding: "10px 12px", fontSize: "0.58rem",
                    fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    background: newTxt.trim() ? "#1A1917" : "#D6D1C8",
                    color: newTxt.trim() ? "#F7F4EF" : "#8A877F",
                    border: "none", borderRadius: 3, cursor: newTxt.trim() ? "pointer" : "default",
                    minHeight: 40,
                  }}
                >Add</button>
              </div>
            </div>
          ) : (
            <div style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              zIndex: 250, background: "#F7F4EF", border: "1px solid #D6D1C8", borderRadius: 6,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)", padding: "16px", width: 340,
            }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.54rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A877F", marginBottom: 6 }}>Comment on:</div>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "0.88rem", fontStyle: "italic", color: "#5C5A55", marginBottom: 10, padding: "6px 8px", background: "#F0ECE4", borderRadius: 3 }}>
                "{newAnchor.textContent.length > 80 ? newAnchor.textContent.slice(0, 80) + "\u2026" : newAnchor.textContent}"
              </div>
              <MentionInput value={newTxt} onChange={setNewTxt} placeholder="Your comment... (use @name to mention)" rows={2} />
              <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { onCancelNew(); setNewTxt(""); }} style={{ padding: "4px 12px", fontSize: "0.56rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, background: "transparent", border: "1px solid #D6D1C8", borderRadius: 3, cursor: "pointer", color: "#5C5A55" }}>Cancel</button>
                <button
                  onClick={() => { if (newTxt.trim()) { onAddNew({ id: `ic-${Date.now()}`, anchor: newAnchor, sectionId: newAnchor.sectionId, text: newTxt.trim() }); setNewTxt(""); } }}
                  disabled={!newTxt.trim()}
                  style={{
                    padding: "4px 12px", fontSize: "0.56rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    background: newTxt.trim() ? "#1A1917" : "#D6D1C8",
                    color: newTxt.trim() ? "#F7F4EF" : "#8A877F",
                    border: "none", borderRadius: 3, cursor: newTxt.trim() ? "pointer" : "default",
                  }}
                >Add</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
