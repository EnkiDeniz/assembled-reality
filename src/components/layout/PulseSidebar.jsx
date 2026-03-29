import { useState, useEffect } from "react";
import { READERS, SECTIONS, SHAPES } from "../../constants";

export default function PulseSidebar({ anns, sigs, onClose }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const items = [];
  Object.entries(anns).forEach(([sid, a]) => a.forEach(x => {
    const s = SECTIONS.find(z => z.id === sid);
    items.push({ ...x, section: s?.title, ts: x.timestamp || 0 });
  }));
  items.sort((a, b) => b.ts - a.ts);

  const sigMap = {};
  READERS.forEach(r => { sigMap[r] = 0; });
  Object.values(sigs).forEach(s => SHAPES.forEach(({ key }) => (s[key] || []).forEach(n => { if (sigMap[n] !== undefined) sigMap[n]++; })));

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 85, background: "rgba(0,0,0,0.12)" }} />
      <div
        className={isMobile ? "sidebar-right" : undefined}
        style={{
          position: "fixed", top: 38, right: 0,
          width: isMobile ? "100%" : 280,
          bottom: 0, zIndex: 90,
          background: "#EDE9E1", borderLeft: isMobile ? "none" : "1px solid #D6D1C8",
          overflowY: "auto", WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{
          padding: "8px 14px", borderBottom: "1px solid #D6D1C8",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.54rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A877F" }}>Pulse</span>
          {isMobile && (
            <button onClick={onClose} style={{
              background: "none", border: "1px solid #D6D1C8", borderRadius: 4,
              padding: "6px 14px", fontSize: "0.62rem", fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600, color: "#5C5A55", cursor: "pointer",
            }}>Close</button>
          )}
        </div>
        <div style={{ padding: "10px 14px" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.54rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A877F", marginBottom: 6 }}>Who's reading</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {READERS.map(r => {
                const a = sigMap[r] > 0 || items.some(i => i.author === r);
                return (
                  <span key={r} style={{
                    padding: isMobile ? "4px 12px" : "2px 9px",
                    fontSize: isMobile ? "0.72rem" : "0.66rem",
                    fontFamily: "'DM Sans',sans-serif", fontWeight: a ? 600 : 400,
                    background: a ? "#1A1917" : "transparent",
                    color: a ? "#F7F4EF" : "#8A877F",
                    border: `1px solid ${a ? "#1A1917" : "#D6D1C8"}`, borderRadius: 12,
                  }}>{r}</span>
                );
              })}
            </div>
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.54rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A877F", marginBottom: 6 }}>Recent</div>
          {items.length === 0 ? <div style={{ color: "#8A877F", fontFamily: "'DM Sans',sans-serif", fontSize: "0.72rem" }}>No annotations yet.</div> :
            items.slice(0, 20).map((x, i) => (
              <div key={i} style={{
                padding: isMobile ? "10px 0" : "6px 0",
                borderBottom: i < Math.min(items.length, 20) - 1 ? "1px solid #E8E4DC" : "none",
                fontSize: "0.7rem", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.4,
              }}>
                <span style={{ fontWeight: 600 }}>{x.author}</span><span style={{ color: "#5C5A55" }}> on <em>{x.section}</em></span>
                <p style={{ margin: "2px 0 0", color: "#5C5A55", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "0.82rem" }}>"{x.text.length > 85 ? x.text.slice(0, 85) + "\u2026" : x.text}"</p>
                <div style={{ fontSize: "0.56rem", color: "#8A877F", marginTop: 1 }}>{x.time}</div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
