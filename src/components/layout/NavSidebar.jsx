import { SECTIONS, PART_NAMES, SHAPES, READERS } from "../../constants";
import useMediaQuery from "../../hooks/useMediaQuery";

const READER_COLORS = ["#DC2626", "#0369A1", "#B45309", "#7C3AED", "#059669", "#BE185D", "#1D4ED8"];

export default function NavSidebar({ anns, sigs, highlights = [], readingPositions = {}, onClose }) {
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
        className={`fixed top-10 left-0 bottom-0 bg-surface overflow-y-auto overscroll-contain
          w-full md:w-[260px]
          z-90 md:z-50
          border-r-0 md:border-r md:border-border
          p-3 px-4 md:p-3 md:px-3.5
          ${!isDesktop ? "sidebar-left" : ""}`}
      >
        {!isDesktop && (
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="bg-transparent border border-border rounded-[3px] px-3.5 py-1.5 text-base font-medium text-ink-tertiary cursor-pointer">Close</button>
          </div>
        )}

        {/* Reading positions */}
        <div className="mb-2.5 pb-2 border-b border-border">
          <div className="text-xs font-semibold tracking-[0.06em] uppercase text-ink-muted mb-1">Last seen</div>
          <div className="flex flex-wrap gap-1">
            {READERS.map((r, i) => {
              const pos = readingPositions[r];
              const sec = pos ? SECTIONS.find(s => s.id === pos.sectionId) : null;
              return (
                <span
                  key={r}
                  className="py-0.5 px-1.5 md:py-0.5 md:px-1.5 text-sm font-medium rounded-[3px]"
                  style={{
                    padding: !isDesktop ? "3px 8px" : "2px 6px",
                    background: pos ? READER_COLORS[i] + "10" : "transparent",
                    color: pos ? READER_COLORS[i] : "#D4D4D4",
                    border: `1px solid ${pos ? READER_COLORS[i] + "30" : "#E5E5E5"}`,
                  }}
                  title={sec ? `${r}: §${sec.num}` : `${r}: Not started`}
                >
                  {r}{sec ? ` ·${sec.num}` : ""}
                </span>
              );
            })}
          </div>
        </div>

        {[1, 2, 3].map(p => (
          <div key={p}>
            <div className={`text-xs font-semibold tracking-[0.06em] uppercase text-ink-muted mb-[3px] ${p > 1 ? "mt-2.5 pt-2 border-t border-border" : ""}`}>
              {PART_NAMES[p]}
            </div>
            {SECTIONS.filter(s => s.part === p || (p === 1 && s.part === 0)).map(s => {
              const ac = (anns[s.id] || []).length;
              const sc = SHAPES.reduce((sum, { key }) => sum + ((sigs[s.id] || {})[key]?.length || 0), 0);
              const readersHere = readersAtSection[s.id] || [];

              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={onClose}
                  className="flex justify-between items-center text-md md:text-base text-ink-secondary no-underline py-2 px-1 md:py-[3px] md:px-0.5 leading-[1.3] rounded-sm min-h-10 md:min-h-auto"
                >
                  <span className="flex items-center gap-1">
                    {readersHere.length > 0 && (
                      <span className="flex gap-0.5">
                        {readersHere.map(r => {
                          const idx = READERS.indexOf(r);
                          return <span key={r} className="w-1.5 h-1.5 rounded-full" style={{ background: READER_COLORS[idx] || "#999" }} title={r} />;
                        })}
                      </span>
                    )}
                    <span className="font-mono text-xs text-ink-faint">{s.num}</span>
                    {s.title}
                  </span>
                  {(sc > 0 || ac > 0) && (
                    <span className="text-xs text-ink-muted font-medium">
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
