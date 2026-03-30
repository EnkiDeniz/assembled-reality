import { SHAPES } from "../../constants";

export default function ShapeSig({ sid, sigs, onSig, reader }) {
  const s = sigs[sid] || {};

  return (
    <div className="flex flex-wrap gap-2">
      {SHAPES.map(({ key, sym, label, color }) => {
        const v = s[key] || [];
        const me = v.includes(reader);
        return (
          <button key={key} onClick={() => onSig(sid, key)} title={v.join(", ") || "No signals yet"}
            className="flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150"
            style={{
              background: me ? `${color}18` : "rgba(255,255,255,0.42)",
              border: `1px solid ${me ? color : "var(--color-border-dark)"}`,
              color: me ? "var(--color-ink)" : "var(--color-ink-tertiary)",
            }}>
            <span className="font-serif text-[1.25rem]" style={{ color }}>{sym}</span>
            <span className="hidden md:inline">{label}</span>
            {v.length > 0 && <span className="font-mono text-[0.68rem] uppercase tracking-[0.12em] opacity-70">{v.length}</span>}
          </button>
        );
      })}
    </div>
  );
}
