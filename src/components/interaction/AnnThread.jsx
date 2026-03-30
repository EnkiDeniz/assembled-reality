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

export default function AnnThread({ sid, anns, onAdd }) {
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const items = anns[sid] || [];
  return (
    <div className="mt-1.5">
      <button onClick={() => setOpen(!open)} className="flex min-h-8 items-center gap-1 border-none bg-transparent py-1 font-sans text-[0.76rem] font-medium uppercase tracking-[0.18em] cursor-pointer" style={{ color: items.length > 0 ? "var(--color-ink)" : "var(--color-ink-faint)" }}>
        {open ? "\u25BE" : "\u25B8"} {items.length > 0 ? `${items.length} annotation${items.length > 1 ? "s" : ""}` : "Annotate"}
      </button>
      {open && (
        <div className="mt-2 rounded-[1.25rem] border border-border bg-surface-raised/85 px-4 py-4 shadow-[0_12px_28px_rgba(27,24,21,0.04)]">
          {items.map((a, i) => (
            <div key={i} className="mb-3 pb-3" style={{ borderBottom: i < items.length - 1 ? "1px solid var(--color-divider)" : "none" }}>
              <div className="mb-1 flex justify-between gap-3">
                <span className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink-secondary">{a.author}</span>
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ink-muted">{a.time}</span>
              </div>
              <p className="m-0 font-serif text-[1.08rem] leading-[1.55] text-ink-secondary"><MentionText text={a.text} /></p>
            </div>
          ))}
          <MentionInput value={txt} onChange={setTxt} placeholder="Add annotation... (@name to mention)" rows={2} />
          <button onClick={() => { if (txt.trim()) { onAdd(sid, txt.trim()); setTxt(""); } }} disabled={!txt.trim()}
            className="mt-3 min-h-10 rounded-full border-none px-4 py-2 text-sm font-medium uppercase tracking-[0.12em]"
            style={{
              background: txt.trim() ? "var(--color-ink)" : "var(--color-border)",
              color: txt.trim() ? "var(--color-paper-soft)" : "var(--color-ink-muted)",
              cursor: txt.trim() ? "pointer" : "default",
            }}>Add</button>
        </div>
      )}
    </div>
  );
}
