import { useState, useEffect } from "react";
import { SECTIONS, PART_NAMES, SHAPES, READERS } from "../../constants";

const READER_COLORS = ["#DC2626", "#0369A1", "#B45309", "#7C3AED", "#059669", "#BE185D", "#1D4ED8"];

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
      {isMobile && <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 85, background: "rgba(0,0,0,0.08)" }} />}
      <div
        className={isMobile ? "sidebar-left" : undefined}
        style={{
          position: "fixed", top: 40, left: 0,
          width: isMobile ? "100%" : 260,
          bottom: 0, zIndex: isMobile ? 90 : 50,
          background: "#FAFAF9", borderRight: isMobile ? "none" : "1px solid #E5E5E5",
          overflowY: "auto", WebkitOverflowScrolling: "touch",
          padding: isMobile ? "12px 16px" : "12px 14px",
        }}
      >
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button onClick={onClose} style={{
              background: "none", border: "1px solid #E5E5E5", borderRadius: 3,
              padding: "6px 14px", fontSize: "0.75rem", fontWeight: 500, color: "#666", cursor: "pointer",
            }}>Close</button>
          </div>
        )}

        {/* Reading positions */}
        <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #E5E5E5" }}>
          <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#999", marginBottom: 4 }}>Last seen</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {READERS.map((r, i) => {
              const pos = readingPositions[r];
              const sec = pos ? SECTIONS.find(s => s.id === pos.sectionId) : null;
              return (
                <span key={r} style={{
                  padding: isMobile ? "3px 8px" : "2px 6px",
                  fontSize: "0.6875rem", fontWeight: 500,
                  background: pos ? READER_COLORS[i] + "10" : "transparent",
                  color: pos ? READER_COLORS[i] : "#D4D4D4",
                  border: `1px solid ${pos ? READER_COLORS[i] + "30" : "#E5E5E5"}`,
                  borderRadius: 3,
                }} title={sec ? `${r}: §${sec.num}` : `${r}: Not started`}>
                  {r}{sec ? ` ·${sec.num}` : ""}
                </span>
              );
            })}
          </div>
        </div>

        {[1, 2, 3].map(p => (
          <div key={p}>
            <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#999", marginTop: p > 1 ? 10 : 0, marginBottom: 3, paddingTop: p > 1 ? 8 : 0, borderTop: p > 1 ? "1px solid #E5E5E5" : "none" }}>
              {PART_NAMES[p]}
            </div>
            {SECTIONS.filter(s => s.part === p || (p === 1 && s.part === 0)).map(s => {
              const ac = (anns[s.id] || []).length;
              const sc = SHAPES.reduce((sum, { key }) => sum + ((sigs[s.id] || {})[key]?.length || 0), 0);
              const readersHere = readersAtSection[s.id] || [];

              return (
                <a key={s.id} href={`#${s.id}`} onClick={onClose} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: isMobile ? "0.8125rem" : "0.75rem",
                  color: "#444", textDecoration: "none",
                  padding: isMobile ? "8px 4px" : "3px 2px",
                  lineHeight: 1.3, borderRadius: 2,
                  minHeight: isMobile ? 40 : "auto",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {readersHere.length > 0 && (
                      <span style={{ display: "flex", gap: 2 }}>
                        {readersHere.map(r => {
                          const idx = READERS.indexOf(r);
                          return <span key={r} style={{ width: 6, height: 6, borderRadius: "50%", background: READER_COLORS[idx] || "#999" }} title={r} />;
                        })}
                      </span>
                    )}
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.625rem", color: "#BBB" }}>{s.num}</span>
                    {s.title}
                  </span>
                  {(sc > 0 || ac > 0) && (
                    <span style={{ fontSize: "0.625rem", color: "#999", fontWeight: 500 }}>
                      {sc > 0 && `${sc}s`}{sc > 0 && ac > 0 && " "}{ac > 0 && `${ac}a`}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
