import { useState, useEffect, useCallback } from "react";

export default function TopBar({ reader, tS, tA, nav, setNav, pulse, setPulse, carry, setCarry, currentSection }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onScroll = useCallback(() => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0) setScrollPct(Math.min(1, window.scrollY / h));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const hasActivity = tS > 0 || tA > 0;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
      <div style={{
        background: "rgba(250,250,249,0.92)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid #E5E5E5",
        padding: isMobile ? "0 10px" : "0 18px",
        height: 40, display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: "0.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 14 }}>
          <button onClick={() => setNav(!nav)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.875rem", color: nav && !isMobile ? "#111" : "#333",
            padding: "6px 8px", minHeight: 36, minWidth: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{"\u2630"}</button>
          {isMobile && currentSection && (
            <span style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: "0.625rem", color: "#999", fontWeight: 500,
            }}>
              §{currentSection.num}
            </span>
          )}
          {!isMobile && (
            <span style={{ fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#999", fontSize: "0.6875rem" }}>
              Assembled Reality
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
          {!isMobile && hasActivity && (
            <span style={{ color: "#999", fontSize: "0.6875rem" }}>{tS}s &middot; {tA}a</span>
          )}
          <button onClick={() => setPulse(!pulse)} style={pill(pulse)} title="Team activity">Pulse</button>
          <button onClick={() => setCarry(!carry)} style={pill(carry)} title="Your collected passages">Carry</button>
          <span style={{
            color: "#999", fontSize: "0.6875rem", fontWeight: 500,
            maxWidth: isMobile ? 60 : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{reader}</span>
        </div>
      </div>
      {/* Reading progress bar */}
      <div style={{
        height: 2, background: "transparent", width: "100%",
        position: "relative", marginTop: -1,
      }}>
        <div style={{
          height: "100%",
          width: `${scrollPct * 100}%`,
          background: "#111",
          opacity: 0.15,
          transition: "width 0.1s linear",
        }} />
      </div>
    </div>
  );
}

const pill = (active) => ({
  padding: "4px 10px",
  fontSize: "0.6875rem",
  fontWeight: 500,
  background: active ? "#111" : "transparent",
  color: active ? "#fff" : "#666",
  border: `1px solid ${active ? "#111" : "#D4D4D4"}`,
  borderRadius: 3,
  cursor: "pointer",
  minHeight: 28,
  minWidth: "auto",
  transition: "all 0.1s",
});
