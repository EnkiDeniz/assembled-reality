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
      <div className="sidebar-right md:sidebar-right-none fixed top-10 right-0 bottom-0 z-90 bg-surface overflow-y-auto overscroll-contain w-full md:w-[280px] border-l-0 md:border-l md:border-border">
        <div className="px-3.5 py-2 border-b border-border flex justify-between items-center">
          <span className="text-sm font-semibold tracking-[0.04em] uppercase text-ink-muted">Pulse</span>
          <button onClick={onClose} className="md:hidden bg-transparent border border-border rounded-[3px] px-3.5 py-1.5 text-base font-medium text-ink-tertiary cursor-pointer">Close</button>
        </div>
        <div className="p-2.5 px-3.5">
          <div className="mb-3.5">
            <div className="text-sm font-semibold tracking-[0.04em] uppercase text-ink-muted mb-1.5">Readers</div>
            <div className="flex flex-wrap gap-1">
              {READERS.map(r => {
                const a = sigMap[r] > 0 || items.some(i => i.author === r);
                return (
                  <span
                    key={r}
                    className={`py-1 px-2.5 md:py-[3px] md:px-2 text-base rounded-[3px] ${
                      a ? "font-semibold bg-ink text-white border border-ink" : "font-normal bg-transparent text-ink-faint border border-border"
                    }`}
                  >
                    {r}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="text-sm font-semibold tracking-[0.04em] uppercase text-ink-muted mb-1.5">Recent</div>
          {items.length === 0 ? <div className="text-ink-faint text-md">No annotations yet.</div> :
            items.slice(0, 20).map((x, i) => (
              <div
                key={i}
                className={`py-2.5 md:py-1.5 text-md leading-[1.4] ${i < Math.min(items.length, 20) - 1 ? "border-b border-divider" : ""}`}
              >
                <span className="font-semibold text-ink-secondary">{x.author}</span>
                <span className="text-ink-muted"> on {x.section}</span>
                <p className="m-0 mt-0.5 text-ink-tertiary text-md">"{x.text.length > 85 ? x.text.slice(0, 85) + "\u2026" : x.text}"</p>
                <div className="text-sm text-ink-faint mt-px">{x.time}</div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
