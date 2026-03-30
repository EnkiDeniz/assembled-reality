import { READERS, SECTIONS, SHAPES } from "../../constants";

export default function PulseSidebar({ anns, sigs, onClose }) {
  const items = [];
  Object.entries(anns).forEach(([sid, a]) => a.forEach(x => {
    const s = SECTIONS.find(z => z.id === sid);
    items.push({ ...x, section: s?.title, ts: x.timestamp || 0 });
  }));
  items.sort((a, b) => b.ts - a.ts);

  const sigMap = {};
  READERS.forEach(r => { sigMap[r] = 0; });
  Object.values(sigs).forEach(s => SHAPES.forEach(({ key }) => (s[key] || []).forEach(n => { if (sigMap[n] !== undefined) sigMap[n]++; })));

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-85 bg-black/8" />
      <div className="sidebar-right md:sidebar-right-none fixed right-0 top-0 bottom-0 z-90 w-full overflow-y-auto overscroll-contain border-l-0 bg-surface/96 pt-[104px] shadow-[-24px_0_80px_rgba(20,17,15,0.1)] backdrop-blur-2xl md:w-[360px] md:border-l md:border-border-dark/65">
        <div className="flex items-center justify-between border-b border-border-warm px-5 py-4 md:px-6">
          <div>
            <div className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">Side annotation</div>
            <span className="mt-2 block font-serif text-[1.75rem] leading-none text-ink">Pulse</span>
          </div>
          <button onClick={onClose} className="rounded-full border border-border-dark/70 bg-paper-soft px-4 py-2 text-sm font-medium text-ink-tertiary transition-colors duration-150 hover:border-ink hover:text-ink md:hidden">Close</button>
        </div>
        <div className="px-5 py-5 md:px-6">
          <div className="mb-6 rounded-[1.5rem] border border-border-warm bg-paper-soft/80 px-4 py-4">
            <div className="mb-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">Readers in the room</div>
            <div className="flex flex-wrap gap-2">
              {READERS.map(r => {
                const a = sigMap[r] > 0 || items.some(i => i.author === r);
                return (
                  <span
                    key={r}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      a ? "border border-ink bg-ink text-paper-soft" : "border border-border bg-white/25 text-ink-faint"
                    }`}
                  >
                    {r}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="mb-3 border-t border-border-warm pt-5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">Recent annotations</div>
          {items.length === 0 ? <div className="text-md text-ink-faint">No annotations yet.</div> :
            items.slice(0, 20).map((x, i) => (
              <div
                key={i}
                className={`rounded-[1.35rem] px-4 py-4 text-md leading-[1.4] ${i < Math.min(items.length, 20) - 1 ? "mb-3" : ""} border border-border-warm bg-paper-soft/75 shadow-[0_10px_24px_rgba(20,17,15,0.04)]`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink-secondary">{x.author}</span>
                  <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-faint">{x.time}</span>
                </div>
                <div className="mt-1 text-sm text-ink-muted">on {x.section}</div>
                <p className="m-0 mt-2 font-serif text-[1.18rem] leading-[1.42] text-ink-tertiary">"{x.text.length > 85 ? x.text.slice(0, 85) + "\u2026" : x.text}"</p>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
