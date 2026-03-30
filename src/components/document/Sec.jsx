import { useState } from "react";
import ShapeSig from "../interaction/ShapeSig";
import AnnThread from "../interaction/AnnThread";
import SectionStatusTags from "./SectionStatusTags";

export default function Sec({ id, num, title, children, sigs, anns, reader, onSig, onAnn, ph, statusTags, toggleStatusTag }) {
  const [showTools, setShowTools] = useState(false);
  const sealVoters = (statusTags?.[id]?.["ready-seal"]) || [];
  const isSealed = sealVoters.length >= 4;
  const isReaderNote = id === "reader-note";
  const annCount = (anns[id] || []).length;
  const sigCount = Object.values(sigs[id] || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  const tagCount = Object.values(statusTags?.[id] || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  const hasActivity = annCount > 0 || sigCount > 0 || tagCount > 0;

  return (
    <>
      {ph}
      <section id={id} className={`scroll-mt-28 mb-14 pb-8 ${isSealed ? "rounded-[1.75rem] border border-border-dark/70 bg-surface-guide px-5 py-6 md:px-6" : "border-b border-border-warm"}`}>
        <h2 className="mt-1 mb-4 flex flex-wrap items-baseline gap-2 leading-[1.1]">
          <span className="font-mono text-[0.76rem] uppercase tracking-[0.16em] text-ink-muted">{num}</span>
          <span className="font-serif text-[2rem] text-ink md:text-[2.35rem]">{title}</span>
          {isSealed && <span className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-seal">Sealed</span>}
        </h2>
        {children}

        <div className="mt-5 border-t border-border-warm pt-3">
          {!showTools && !hasActivity ? (
            <button
              onClick={() => setShowTools(true)}
              className="min-h-8 cursor-pointer border-none bg-transparent py-1 font-sans text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink-muted underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-ink"
            >
              Signal &middot; Tag &middot; Discuss
            </button>
          ) : (
            <>
              <div className="mb-4">
                <div className="mb-2 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-ink-faint">How does this section land?</div>
                <ShapeSig sid={id} sigs={sigs} onSig={onSig} reader={reader} />
              </div>
              {!isReaderNote && statusTags && toggleStatusTag && (
                <div className="mb-4">
                  <div className="mb-2 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-ink-faint">Section status</div>
                  <SectionStatusTags sectionId={id} statusTags={statusTags} toggleStatusTag={toggleStatusTag} reader={reader} />
                </div>
              )}
              <div>
                <div className="mt-1 mb-2 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-ink-faint">Discussion</div>
                <AnnThread sid={id} anns={anns} onAdd={onAnn} />
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
