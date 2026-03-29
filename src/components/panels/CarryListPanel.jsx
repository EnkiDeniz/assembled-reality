import { useState, useEffect } from "react";
import { READERS, SECTIONS } from "../../constants";

export default function CarryListPanel({ carryList, reader, onRemove, onClose, onExport }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 85, background: "rgba(0,0,0,0.12)" }} />
      <div
        className={isMobile ? "sidebar-right" : undefined}
        style={{
          position: "fixed", top: 38, right: 0,
          width: isMobile ? "100%" : 320,
          bottom: 0, zIndex: 90,
          background: "#EDE9E1", borderLeft: isMobile ? "none" : "1px solid #D6D1C8",
          overflowY: "auto", WebkitOverflowScrolling: "touch",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{
          padding: "8px 14px", borderBottom: "1px solid #D6D1C8",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.54rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A877F" }}>Carry List</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {onExport && (
              <button onClick={onExport} style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: "0.52rem", fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
                padding: isMobile ? "6px 12px" : "2px 8px",
                background: "#1A1917", color: "#F7F4EF",
                border: "none", borderRadius: 3, cursor: "pointer",
                minHeight: 32,
              }}>
                Export .md
              </button>
            )}
            {isMobile && (
              <button onClick={onClose} style={{
                background: "none", border: "1px solid #D6D1C8", borderRadius: 4,
                padding: "6px 14px", fontSize: "0.62rem", fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600, color: "#5C5A55", cursor: "pointer",
              }}>Close</button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "10px 14px" }}>
          {READERS.map(r => {
            const items = carryList[r] || [];
            if (items.length === 0 && r !== reader) return null;
            const isMe = r === reader;
            return (
              <div key={r} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.54rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: isMe ? "#B84C2A" : "#8A877F", marginBottom: 4 }}>
                  {r}{isMe ? " (you)" : ""}
                </div>
                {items.length === 0 ? (
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.68rem", color: "#8A877F", fontStyle: "italic" }}>No lines carried yet.</div>
                ) : (
                  items.map((item, i) => {
                    const section = SECTIONS.find(s => s.id === item.anchor?.sectionId);
                    return (
                      <div key={item.id || i} style={{
                        padding: isMobile ? "8px 0" : "5px 0",
                        borderBottom: i < items.length - 1 ? "1px solid #D6D1C8" : "none",
                        display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6,
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "0.82rem", lineHeight: 1.4, textDecoration: "underline", textDecorationColor: "#B84C2A40", textUnderlineOffset: "3px" }}>
                            "{item.text.length > 120 ? item.text.slice(0, 120) + "\u2026" : item.text}"
                          </p>
                          {section && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.52rem", color: "#8A877F" }}>{section.num} &middot; {section.title}</span>}
                        </div>
                        {isMe && (
                          <button onClick={() => onRemove(item.id)} style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#8A877F", fontSize: "0.8rem",
                            padding: "4px 8px", flexShrink: 0,
                            minHeight: 36, minWidth: 36,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }} title="Remove">&times;</button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
