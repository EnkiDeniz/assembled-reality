import { useState } from "react";
import { parseMentions } from "../../utils/mentionParser";
import MentionInput from "./MentionInput";

function MentionText({ text }) {
  const segments = parseMentions(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "mention" ? (
          <span key={i} style={{ color: "#B84C2A", fontWeight: 600, fontFamily: "'DM Sans',sans-serif", fontSize: "0.78rem" }}>@{seg.name}</span>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </>
  );
}

export default function AnnThread({ sid, anns, reader, onAdd }) {
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const items = anns[sid] || [];
  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "6px 4px", fontSize: "0.68rem",
        fontFamily: "'DM Sans',sans-serif", fontWeight: 500,
        background: "none", border: "none", cursor: "pointer",
        color: items.length > 0 ? "#B84C2A" : "#8A877F",
        minHeight: 36,
      }}>
        {open ? "\u25BE" : "\u25B8"} {items.length > 0 ? `${items.length} annotation${items.length > 1 ? "s" : ""}` : "Annotate"}
      </button>
      {open && (
        <div style={{ marginTop: 6, padding: "10px 12px", background: "#F0ECE4", border: "1px solid #D6D1C8", borderRadius: 4 }}>
          {items.map((a, i) => (
            <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < items.length - 1 ? "1px solid #D6D1C8" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.64rem", fontWeight: 600, color: "#5C5A55" }}>{a.author}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.56rem", color: "#8A877F" }}>{a.time}</span>
              </div>
              <p style={{ fontSize: "0.84rem", lineHeight: 1.5, margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif" }}><MentionText text={a.text} /></p>
            </div>
          ))}
          <MentionInput value={txt} onChange={setTxt} placeholder="Add a thought, question, or pushback... (use @name)" rows={2} />
          <button onClick={() => { if (txt.trim()) { onAdd(sid, txt.trim()); setTxt(""); } }} disabled={!txt.trim()}
            style={{
              marginTop: 5, padding: "6px 14px", fontSize: "0.58rem",
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
              background: txt.trim() ? "#1A1917" : "#D6D1C8",
              color: txt.trim() ? "#F7F4EF" : "#8A877F",
              border: "none", borderRadius: 3,
              cursor: txt.trim() ? "pointer" : "default",
              minHeight: 36,
            }}>Add</button>
        </div>
      )}
    </div>
  );
}
