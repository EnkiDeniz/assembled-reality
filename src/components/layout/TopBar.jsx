import { useState, useEffect } from "react";

const pillBtn = (active) => ({
  padding: "3px 9px",
  fontSize: "0.56rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  background: active ? "#1A1917" : "transparent",
  color: active ? "#F7F4EF" : "#5C5A55",
  border: "1px solid #D6D1C8",
  borderRadius: 3,
  cursor: "pointer",
  minHeight: 32,
  minWidth: "auto",
});

export default function TopBar({ reader, tS, tA, nav, setNav, pulse, setPulse, carry, setCarry }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "#EDE9E1ee", backdropFilter: "blur(8px)",
      borderBottom: "1px solid #D6D1C8",
      padding: isMobile ? "6px 10px" : "7px 18px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontFamily: "'DM Sans',sans-serif", fontSize: "0.66rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 12 }}>
        <button onClick={() => setNav(!nav)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "1.05rem", color: "#1A1917",
          padding: "6px 8px", minHeight: 36, minWidth: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{"\u2630"}</button>
        {!isMobile && (
          <span style={{ fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A877F", fontSize: "0.54rem" }}>
            Assembled Reality &middot; v1.0
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 8 }}>
        {!isMobile && (
          <span style={{ color: "#5C5A55", fontSize: "0.62rem" }}>{tS} signals &middot; {tA} annotations</span>
        )}
        <button onClick={() => setPulse(!pulse)} style={pillBtn(pulse)}>Pulse</button>
        <button onClick={() => setCarry(!carry)} style={pillBtn(carry)}>Carry</button>
        <span style={{
          color: "#8A877F", fontSize: isMobile ? "0.56rem" : "0.62rem",
          maxWidth: isMobile ? 60 : "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{reader}</span>
      </div>
    </div>
  );
}
