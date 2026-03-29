import { SHAPES } from "../../constants";

export default function ShapeSig({ sid, sigs, onSig, reader }) {
  const s = sigs[sid] || {};
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
      {SHAPES.map(({ key, sym, color }) => {
        const v = s[key] || [];
        const me = v.includes(reader);
        return (
          <button key={key} onClick={() => onSig(sid, key)} title={v.join(", ") || "No signals yet"}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 11px", fontSize: "0.76rem",
              fontFamily: "'DM Sans',sans-serif",
              background: me ? color + "14" : "transparent",
              border: `1px solid ${me ? color : "#D6D1C8"}`,
              borderRadius: 20, cursor: "pointer",
              color: me ? color : "#8A877F",
              fontWeight: me ? 600 : 400,
              transition: "all 0.15s",
              minHeight: 36,
            }}>
            <span style={{ fontSize: "0.98rem" }}>{sym}</span>
            {v.length > 0 && <span style={{ fontSize: "0.68rem" }}>{v.join(", ")}</span>}
          </button>
        );
      })}
    </div>
  );
}
