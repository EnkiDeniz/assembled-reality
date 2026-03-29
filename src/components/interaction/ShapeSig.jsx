import { SHAPES } from "../../constants";

export default function ShapeSig({ sid, sigs, onSig, reader }) {
  const s = sigs[sid] || {};

  return (
    <div className="flex gap-1.5 flex-wrap">
      {SHAPES.map(({ key, sym, label, color }) => {
        const v = s[key] || [];
        const me = v.includes(reader);
        return (
          <button key={key} onClick={() => onSig(sid, key)} title={v.join(", ") || "No signals yet"}
            className="flex items-center gap-1 py-1 px-2.5 text-sm rounded-sm cursor-pointer font-medium transition-all duration-100 min-h-[30px]"
            style={{
              background: me ? "#111" : "transparent",
              border: `1px solid ${me ? "#111" : "#D4D4D4"}`,
              color: me ? "#fff" : "#777",
            }}>
            <span className="text-md" style={{ color: me ? "#fff" : color }}>{sym}</span>
            <span className="hidden md:inline">{label}</span>
            {v.length > 0 && <span className="text-xs opacity-70">{v.length}</span>}
          </button>
        );
      })}
    </div>
  );
}
