import { useState, useEffect } from "react";
import { SECTIONS, PART_NAMES, SHAPES, READERS } from "../../constants";

const READER_COLORS = ["#B84C2A", "#2A5A6B", "#6B5A2A", "#5A2A6B", "#2A6B3A", "#6B2A4A", "#2A4A6B"];

export default function NavSidebar({ anns, sigs, highlights = [], readingPositions = {}, onClose }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const readersAtSection = {};
  Object.entries(readingPositions).forEach(([rdr, pos]) => {
    if (!pos?.sectionId) return;
    if (!readersAtSection[pos.sectionId]) readersAtSection[pos.sectionId] = [];
    readersAtSection[pos.sectionId].push(rdr);
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 85, background: "rgba(0,0,0,0.12)" }} />
      <div
        className={isMobile ? "sidebar-left" : undefined}
        style={{
          position: "fixed", top: 38, left: 0,
          width: isMobile ? "100%" : 260,
          bottom: 0, zIndex: 90,
          background: "#EDE9E1", borderRight: isMobile ? "none" : "1px solid #D6D1C8",
          overflowY: "auto", WebkitOverflowScrolling: "touch",
          padding: isMobile ? "1rem 1.2rem" : "1.2rem 1rem",
        }}
      >
        {/* Mobile close button */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button onClick={onClose} style={{
              background: "none", border: "1px solid #D6D1C8", borderRadius: 4,
              padding: "6px 14px", fontSize: "0.62rem", fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600, color: "#5C5A55", cursor: "pointer",
            }}>Close</button>
          </div>
        )}

        {/* Reading positions legend */}
        <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #D6D1C8" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.48rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A877F", marginBottom: 4 }}>Last seen</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 5 : 3 }}>
            {READERS.map((r, i) => {
              const pos = readingPositions[r];
              const sec = pos ? SECTIONS.find(s => s.id === pos.sectionId) : null;
              return (
                <span key={r} style={{
                  padding: isMobile ? "3px 8px" : "1px 6px",
                  fontSize: isMobile ? "0.58rem" : "0.52rem",
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 500,
                  background: pos ? READER_COLORS[i] + "18" : "transparent",
                  color: pos ? READER_COLORS[i] : "#D6D1C8",
                  border: `1px solid ${pos ? READER_COLORS[i] + "40" : "#D6D1C8"}`,
                  borderRadius: 8,
                }} title={sec ? `${r}: Section ${sec.num}` : `${r}: Not started`}>
                  {r}{sec ? ` \u00B7${sec.num}` : ""}
                </span>
              );
            })}
          </div>
        </div>

        {[1, 2, 3].map(p => (
          <div key={p}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.52rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B84C2A", marginTop: p > 1 ? 12 : 0, marginBottom: 4, paddingTop: p > 1 ? 8 : 0, borderTop: p > 1 ? "1px solid #D6D1C8" : "none" }}>
              {PART_NAMES[p]}
            </div>
            {SECTIONS.filter(s => s.part === p || (p === 1 && s.part === 0)).map(s => {
              const ac = (anns[s.id] || []).length;
              const sc = SHAPES.reduce((sum, { key }) => sum + ((sigs[s.id] || {})[key]?.length || 0), 0);
              const hc = highlights.filter(h => h.anchor?.sectionId === s.id).length;
              const maxHeat = 10;
              const heatPct = Math.min(hc / maxHeat, 1);
              const readersHere = readersAtSection[s.id] || [];

              return (
                <a key={s.id} href={`#${s.id}`} onClick={onClose} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: isMobile ? "0.76rem" : "0.66rem",
                  color: "#5C5A55", textDecoration: "none",
                  padding: isMobile ? "8px 4px" : "2px 2px",
                  lineHeight: 1.3,
                  background: hc > 0 ? `rgba(184, 76, 42, ${heatPct * 0.08})` : "transparent",
                  borderRadius: 2,
                  minHeight: isMobile ? 40 : "auto",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    {readersHere.length > 0 && (
                      <span style={{ display: "flex", gap: 1 }}>
                        {readersHere.map(r => {
                          const idx = READERS.indexOf(r);
                          return <span key={r} style={{ width: isMobile ? 7 : 5, height: isMobile ? 7 : 5, borderRadius: "50%", background: READER_COLORS[idx] || "#8A877F" }} title={r} />;
                        })}
                      </span>
                    )}
                    {s.num} &middot; {s.title}
                  </span>
                  <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    {hc > 0 && <span style={{ fontSize: "0.5rem", color: "#B84C2A", fontWeight: 600 }}>{hc}hl</span>}
                    {(sc > 0 || ac > 0) && <span style={{ fontSize: "0.54rem", color: "#B84C2A", fontWeight: 600, whiteSpace: "nowrap" }}>{sc > 0 && `${sc}\u25B3`}{ac > 0 && ` ${ac}\u270E`}</span>}
                  </span>
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
