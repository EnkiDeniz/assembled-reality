import { READERS, SECTIONS } from "../../constants";

export default function CarryListPanel({ carryList, reader, onRemove, onClose, onExport }) {
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-85 bg-black/8" />
      <div className="sidebar-right md:sidebar-right-none fixed top-10 right-0 bottom-0 z-90 bg-surface overflow-y-auto overscroll-contain w-full md:w-[300px] border-l-0 md:border-l md:border-border flex flex-col">
        <div className="px-3.5 py-2 border-b border-border flex justify-between items-center">
          <span className="text-sm font-semibold tracking-[0.04em] uppercase text-ink-muted">Carry List</span>
          <div className="flex gap-1.5 items-center">
            {onExport && (
              <button onClick={onExport} className="text-sm font-medium px-2.5 py-1 bg-ink text-white border-none rounded-[3px] cursor-pointer min-h-7">
                Export
              </button>
            )}
            <button onClick={onClose} className="md:hidden bg-transparent border border-border rounded-[3px] px-3.5 py-1.5 text-base font-medium text-ink-tertiary cursor-pointer">Close</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 px-3.5">
          {READERS.map(r => {
            const items = carryList[r] || [];
            if (items.length === 0 && r !== reader) return null;
            const isMe = r === reader;
            return (
              <div key={r} className="mb-3.5">
                <div className={`text-sm font-semibold tracking-[0.04em] uppercase mb-1 ${isMe ? "text-ink" : "text-ink-muted"}`}>
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
                        className={`py-2 md:py-1.5 flex justify-between items-start gap-1.5 ${i < items.length - 1 ? "border-b border-divider" : ""}`}
                      >
                        <div className="flex-1">
                          <p className="m-0 text-md leading-[1.4] border-b border-border pb-px inline">
                            {item.text.length > 120 ? item.text.slice(0, 120) + "\u2026" : item.text}
                          </p>
                          {section && <div className="text-sm text-ink-muted mt-0.5">§{section.num} {section.title}</div>}
                        </div>
                        {isMe && (
                          <button
                            onClick={() => onRemove(item.id)}
                            className="bg-transparent border-none cursor-pointer text-ink-faint text-[0.875rem] p-1 px-2 shrink-0 min-h-8 min-w-8 flex items-center justify-center"
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
