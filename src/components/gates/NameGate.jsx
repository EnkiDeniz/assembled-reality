import { useState, useEffect } from "react";
import { READERS } from "../../constants";

export default function NameGate({ onSelect }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 50); }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F4EF", opacity: vis ? 1 : 0, transition: "opacity 0.6s" }}>
      <div style={{ textAlign: "center", maxWidth: 360, width: "100%", padding: "2rem 1.2rem" }}>
        <div style={{ fontSize: "0.6rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A877F", marginBottom: 28 }}>Arrive</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {READERS.map(n => (
            <button key={n} onClick={() => onSelect(n)}
              style={{
                padding: "14px 24px", fontSize: "1.12rem",
                fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 500,
                background: "transparent", border: "1px solid #D6D1C8",
                borderRadius: 4, cursor: "pointer", color: "#1A1917",
                transition: "all 0.15s", minHeight: 48,
              }}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
