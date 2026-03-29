import { useState } from "react";

export default function ToggleDepth({ label, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ margin: "0.8rem 0" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 0", fontSize: "0.68rem",
          fontFamily: "'DM Sans',sans-serif", fontWeight: 500,
          background: "none", border: "none", cursor: "pointer",
          color: "#2A5A6B",
        }}
      >
        <span style={{ fontSize: "0.6rem", transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0)" }}>{"\u25B8"}</span>
        {label || "Go deeper"}
      </button>
      {open && (
        <div style={{
          marginTop: 6, padding: "12px 16px",
          background: "#F0ECE4", borderLeft: "2px solid #2A5A6B",
          borderRadius: "0 4px 4px 0",
          animation: "slideDown 0.2s ease",
          fontSize: "0.88rem", lineHeight: 1.6,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
