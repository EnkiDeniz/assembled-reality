import { useState, useEffect } from "react";
import { SHAPES } from "../../constants";

export default function ShapeSig({ sid, sigs, onSig, reader }) {
  const s = sigs[sid] || {};
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {SHAPES.map(({ key, sym, label, color }) => {
        const v = s[key] || [];
        const me = v.includes(reader);
        return (
          <button key={key} onClick={() => onSig(sid, key)} title={v.join(", ") || "No signals yet"}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 10px", fontSize: "0.6875rem",
              background: me ? "#111" : "transparent",
              border: `1px solid ${me ? "#111" : "#D4D4D4"}`,
              borderRadius: 3, cursor: "pointer",
              color: me ? "#fff" : "#777",
              fontWeight: 500,
              transition: "all 0.1s",
              minHeight: 30,
            }}>
            <span style={{ fontSize: "0.8125rem", color: me ? "#fff" : color }}>{sym}</span>
            {!isMobile && <span>{label}</span>}
            {v.length > 0 && <span style={{ fontSize: "0.625rem", opacity: 0.7 }}>{v.length}</span>}
          </button>
        );
      })}
    </div>
  );
}
