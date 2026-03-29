import { useState } from "react";
import { parseMentions } from "../../utils/mentionParser";
import MentionInput from "./MentionInput";

function MentionText({ text }) {
  const segments = parseMentions(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "mention" ? (
          <span key={i} className="text-ink font-semibold text-md">@{seg.name}</span>
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
    <div className="mt-1.5">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 py-1 text-base font-medium bg-transparent border-none cursor-pointer min-h-8" style={{ color: items.length > 0 ? "#111" : "#BBB" }}>
        {open ? "\u25BE" : "\u25B8"} {items.length > 0 ? `${items.length} annotation${items.length > 1 ? "s" : ""}` : "Annotate"}
      </button>
      {open && (
        <div className="mt-1 py-2.5 px-3 bg-surface-raised border border-border rounded-sm">
          {items.map((a, i) => (
            <div key={i} className="mb-2 pb-2" style={{ borderBottom: i < items.length - 1 ? "1px solid #E5E5E5" : "none" }}>
              <div className="flex justify-between mb-0.5">
                <span className="text-base font-semibold text-ink-secondary">{a.author}</span>
                <span className="text-sm text-ink-muted">{a.time}</span>
              </div>
              <p className="text-[0.875rem] leading-normal m-0"><MentionText text={a.text} /></p>
            </div>
          ))}
          <MentionInput value={txt} onChange={setTxt} placeholder="Add annotation... (@name to mention)" rows={2} />
          <button onClick={() => { if (txt.trim()) { onAdd(sid, txt.trim()); setTxt(""); } }} disabled={!txt.trim()}
            className="mt-1 py-1.5 px-3.5 text-base font-medium border-none rounded-sm cursor-pointer min-h-8"
            style={{
              background: txt.trim() ? "#111" : "#D4D4D4",
              color: txt.trim() ? "#fff" : "#999",
              cursor: txt.trim() ? "pointer" : "default",
            }}>Add</button>
        </div>
      )}
    </div>
  );
}
