import { SECTIONS, PART_NAMES, SHAPES, READERS } from "../../constants";
import useMediaQuery from "../../hooks/useMediaQuery";

const READER_COLORS = ["#DC2626", "#0369A1", "#B45309", "#7C3AED", "#059669", "#BE185D", "#1D4ED8"];

export default function NavSidebar({ anns, sigs, readingPositions = {}, onClose, currentSectionId }) {
  const isDesktop = useMediaQuery("(min-width: 769px)");

  const readersAtSection = {};
  Object.entries(readingPositions).forEach(([rdr, pos]) => {
    if (!pos?.sectionId) return;
    if (!readersAtSection[pos.sectionId]) readersAtSection[pos.sectionId] = [];
    readersAtSection[pos.sectionId].push(rdr);
  });

  return (
    <>
      {!isDesktop && <div onClick={onClose} className="fixed inset-0 z-85 bg-black/8" />}
      <div
        className={`fixed left-0 bottom-0 overflow-y-auto overscroll-contain bg-surface/96 shadow-[24px_0_80px_rgba(20,17,15,0.1)] backdrop-blur-2xl
          top-0 pt-[104px]
          w-full md:w-[320px]
          z-90 md:z-50
          border-r-0 md:border-r md:border-border-dark/65
          p-4 px-5 md:px-6
          ${!isDesktop ? "sidebar-left" : ""}`}
      >
        {!isDesktop && (
          <div className="mb-4 flex justify-end">
            <button onClick={onClose} className="rounded-full border border-border-dark/70 bg-paper-soft px-4 py-2 text-sm font-medium text-ink-tertiary transition-colors duration-150 hover:border-ink hover:text-ink">Close</button>
          </div>
        )}

        <div className="mb-5 rounded-[1.6rem] border border-border-dark/60 bg-paper-soft/85 px-4 py-4 shadow-[0_16px_40px_rgba(20,17,15,0.05)]">
          <div className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">Reading room</div>
          <div className="mt-2 font-serif text-[1.85rem] leading-[0.98] text-ink">Section index</div>
          <p className="mt-3 text-[0.92rem] leading-[1.7] text-ink-tertiary">
            The rail keeps the architecture visible while you read: section order, reader presence, and where the room is active.
          </p>
        </div>

        <div className="mb-6 rounded-[1.4rem] border border-border-warm bg-white/36 px-4 py-4">
          <div className="mb-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">Last seen</div>
          <div className="flex flex-wrap gap-2">
            {READERS.map((r, i) => {
              const pos = readingPositions[r];
              const sec = pos ? SECTIONS.find(s => s.id === pos.sectionId) : null;
              return (
                <span
                  key={r}
                  className="rounded-full px-2.5 py-1 text-sm font-medium shadow-[0_4px_14px_rgba(20,17,15,0.03)]"
                  style={{
                    background: pos ? READER_COLORS[i] + "14" : "transparent",
                    color: pos ? READER_COLORS[i] : "#B5AB9F",
                    border: `1px solid ${pos ? READER_COLORS[i] + "35" : "var(--color-border)"}`,
                  }}
                  title={sec ? `${r}: \u00A7${sec.num}` : `${r}: Not started`}
                >
                  {r}{sec ? ` \u00B7${sec.num}` : ""}
                </span>
              );
            })}
          </div>
        </div>

        {[1, 2, 3].map(p => (
          <div key={p}>
            <div className={`mb-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink-muted ${p > 1 ? "mt-7 border-t border-border-warm pt-5" : ""}`}>
              {PART_NAMES[p]}
            </div>
            {SECTIONS.filter(s => s.part === p || (p === 1 && s.part === 0)).map(s => {
              const ac = (anns[s.id] || []).length;
              const sc = SHAPES.reduce((sum, { key }) => sum + ((sigs[s.id] || {})[key]?.length || 0), 0);
              const readersHere = readersAtSection[s.id] || [];
              const isActive = currentSectionId === s.id;

              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={onClose}
                  className={`mb-1.5 flex min-h-12 items-center justify-between rounded-[1.2rem] px-3 py-2.5 no-underline transition-all duration-150 md:min-h-0
                    ${isActive ? "border border-border-dark/65 bg-paper-soft shadow-[0_10px_28px_rgba(20,17,15,0.06)]" : "border border-transparent hover:border-border hover:bg-white/48"}`}
                >
                  <span className="flex items-center gap-2">
                    {readersHere.length > 0 && (
                      <span className="flex gap-0.5">
                        {readersHere.map(r => {
                          const idx = READERS.indexOf(r);
                          return <span key={r} className="h-1.5 w-1.5 rounded-full" style={{ background: READER_COLORS[idx] || "#999" }} title={r} />;
                        })}
                      </span>
                    )}
                    <span className="font-mono text-[0.76rem] uppercase tracking-[0.16em] text-ink-muted">{s.num}</span>
                    <span className={`text-[0.98rem] leading-[1.3] ${isActive ? "font-semibold text-ink" : "text-ink-secondary"}`}>
                      {s.title}
                    </span>
                  </span>
                  {(sc > 0 || ac > 0) && (
                    <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
                      {sc > 0 && `${sc}s`}{sc > 0 && ac > 0 && " "}{ac > 0 && `${ac}a`}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
