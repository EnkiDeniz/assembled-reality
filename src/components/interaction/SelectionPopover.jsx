import { useState, useRef, useEffect } from "react";
import { SHAPES } from "../../constants";

export default function SelectionPopover({ pos, onHighlight, onUnderline, onComment, onClose }) {
  const [showShapes, setShowShapes] = useState(false);
  const ref = useRef(null);

  // Viewport-aware positioning
  const [adjustedPos, setAdjustedPos] = useState(null);

  useEffect(() => {
    if (!pos || !ref.current) {
      setAdjustedPos(null);
      return;
    }
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;

    let left = pos.left;
    let top = pos.top;

    // Clamp horizontal: ensure popover stays within viewport
    const halfWidth = rect.width / 2;
    if (left - halfWidth < 8) left = halfWidth + 8;
    if (left + halfWidth > vw - 8) left = vw - halfWidth - 8;

    // If too close to top, show below selection instead
    if (rect.height > pos.top - 8) {
      top = pos.top + 30; // below selection
    }

    setAdjustedPos({ top, left });
  }, [pos]);

  if (!pos) return null;

  const finalPos = adjustedPos || pos;

  return (
    <div
      ref={ref}
      data-selection-popover
      style={{
        position: "absolute",
        top: finalPos.top,
        left: finalPos.left,
        transform: "translate(-50%, -100%)",
        zIndex: 200,
        display: "flex",
        gap: 2,
        padding: "4px 6px",
        background: "#1A1917",
        borderRadius: 6,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        fontFamily: "'DM Sans',sans-serif",
        fontSize: "0.62rem",
        animation: "fadeIn 0.15s ease",
      }}
    >
      {showShapes ? (
        <>
          {SHAPES.map(({ key, sym, color }) => (
            <button
              key={key}
              onClick={() => { onHighlight(key); setShowShapes(false); onClose(); }}
              title={key}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                padding: "6px 8px",
                color,
                borderRadius: 3,
                minHeight: 36,
                minWidth: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {sym}
            </button>
          ))}
          <button
            onClick={() => setShowShapes(false)}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "#8A877F", fontSize: "0.7rem",
              padding: "6px 8px", minHeight: 36, minWidth: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            &times;
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => setShowShapes(true)}
            style={btnStyle}
            title="Highlight"
          >
            <span style={{ fontSize: "0.72rem" }}>&#9653;</span> Highlight
          </button>
          <div style={{ width: 1, background: "rgba(255,255,255,0.15)", margin: "2px 0" }} />
          <button
            onClick={() => { onUnderline(); onClose(); }}
            style={btnStyle}
            title="Add to carry list"
          >
            <span style={{ textDecoration: "underline" }}>&#95;</span> Carry
          </button>
          <div style={{ width: 1, background: "rgba(255,255,255,0.15)", margin: "2px 0" }} />
          <button
            onClick={() => { onComment(); onClose(); }}
            style={btnStyle}
            title="Add comment"
          >
            <span style={{ fontSize: "0.72rem" }}>&#9998;</span> Comment
          </button>
        </>
      )}
    </div>
  );
}

const btnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "#F7F4EF",
  fontFamily: "'DM Sans',sans-serif",
  fontSize: "0.6rem",
  fontWeight: 500,
  padding: "6px 8px",
  borderRadius: 3,
  display: "flex",
  alignItems: "center",
  gap: 3,
  whiteSpace: "nowrap",
  minHeight: 36,
};
