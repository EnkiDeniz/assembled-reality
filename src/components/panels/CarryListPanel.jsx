import { READERS, SECTIONS } from "../../constants";

export default function CarryListPanel({ carryList, reader, onRemove, onClose, onExport }) {
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-85 bg-black/8" />
      <div className="sidebar-right md:sidebar-right-none fixed right-0 top-0 bottom-0 z-90 flex w-full flex-col overflow-y-auto overscroll-contain border-l-0 bg-paper-soft/95 pt-[88px] shadow-[-18px_0_50px_rgba(27,24,21,0.08)] backdrop-blur-xl md:w-[360px] md:border-l md:border-border-dark/60">
        <div className="flex items-center justify-between border-b border-border-warm px-5 py-4">
          <div>
            <div className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">Side annotation</div>
            <span className="mt-1 block font-serif text-[1.6rem] leading-none text-ink">Carry</span>
          </div>
          <div className="flex gap-1.5 items-center">
            {onExport && (
              <button onClick={onExport} className="min-h-9 rounded-full bg-ink px-4 text-sm font-medium text-paper-soft transition-all duration-150 hover:-translate-y-0.5">
                Export
              </button>
            )}
            <button onClick={onClose} className="rounded-full border border-border-dark/70 px-4 py-2 text-sm font-medium text-ink-tertiary transition-colors duration-150 hover:border-ink hover:text-ink md:hidden">Close</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {READERS.map(r => {
            const items = carryList[r] || [];
            if (items.length === 0 && r !== reader) return null;
            const isMe = r === reader;
            return (
              <div key={r} className="mb-6">
                <div className={`mb-2 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${isMe ? "text-ink" : "text-ink-muted"}`}>
                  {r}{isMe ? " (you)" : ""}
                </div>
                {items.length === 0 ? (
                  <div className="text-md text-ink-faint">No lines carried yet.</div>
                ) : (
                  items.map((item, i) => {
                    const section = SECTIONS.find(s => s.id === item.anchor?.sectionId);
                    return (
                      <div
                        key={item.id || i}
                        className={`flex items-start justify-between gap-3 py-3 ${i < items.length - 1 ? "border-b border-divider" : ""}`}
                      >
                        <div className="flex-1">
                          <p className="m-0 inline border-b border-border-dark/60 pb-px font-serif text-[1.22rem] leading-[1.45] text-ink-secondary">
                            {item.text.length > 120 ? item.text.slice(0, 120) + "\u2026" : item.text}
                          </p>
                          {section && <div className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">§{section.num} {section.title}</div>}
                        </div>
                        {isMe && (
                          <button
                            onClick={() => onRemove(item.id)}
                            className="flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-full border border-transparent p-1 text-[0.875rem] text-ink-faint transition-colors duration-150 hover:border-border hover:text-ink"
                            title="Remove"
                          >&times;</button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
