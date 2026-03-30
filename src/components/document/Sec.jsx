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
      <section id={id} className={`scroll-mt-32 mb-16 pb-8 ${isSealed ? "rounded-[1.9rem] border border-border-dark/70 bg-surface-guide px-5 py-6 shadow-[0_18px_40px_rgba(20,17,15,0.05)] md:px-6" : "border-b border-border-warm"}`}>
        <h2 className="mb-4 mt-1 flex flex-wrap items-baseline gap-3 leading-[1.05]">
          <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ink-muted">{num}</span>
          <span className="font-serif text-[2.05rem] text-ink md:text-[2.45rem]">{title}</span>
          {isSealed && <span className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-seal">Sealed</span>}
        </h2>
        {children}

        <div className="mt-6 rounded-[1.5rem] border border-border-warm bg-surface/42 px-4 py-4">
          {!showTools && !hasActivity ? (
            <button
              onClick={() => setShowTools(true)}
              className="min-h-8 w-full cursor-pointer border-none bg-transparent py-1 text-left font-sans text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors duration-150 hover:text-ink"
            >
              Open section tools: signal, tag, discuss
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
