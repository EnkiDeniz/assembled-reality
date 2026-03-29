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
      <section id={id} className={`mb-12 pb-6 ${isSealed ? "bg-surface-guide py-3.5 px-4 rounded-sm border border-border" : "border-b border-divider"}`}>
        <h2 className="text-lg font-bold mb-2.5 leading-[1.3] flex items-baseline gap-1.5">
          <span className="font-mono text-sm text-ink-muted font-normal">{num}</span>
          {title}
          {isSealed && <span className="text-xs font-semibold tracking-[0.06em] uppercase text-seal">Sealed</span>}
        </h2>
        {children}

        {/* Interaction footer -- collapsed by default */}
        <div className="mt-2.5 border-t border-divider pt-1.5">
          {!showTools && !hasActivity ? (
            <button
              onClick={() => setShowTools(true)}
              className="bg-transparent border-none cursor-pointer text-sm text-ink-muted py-1 min-h-8 tracking-[0.02em]"
            >
              Signal · Tag · Discuss
            </button>
          ) : (
            <>
              <div className="mb-2">
                <div className="text-2xs font-semibold tracking-[0.08em] uppercase text-ink-faint mb-1">How does this section land?</div>
                <ShapeSig sid={id} sigs={sigs} onSig={onSig} reader={reader} />
              </div>
              {!isReaderNote && statusTags && toggleStatusTag && (
                <div className="mb-2">
                  <div className="text-2xs font-semibold tracking-[0.08em] uppercase text-ink-faint mb-1">Section status</div>
                  <SectionStatusTags sectionId={id} statusTags={statusTags} toggleStatusTag={toggleStatusTag} reader={reader} />
                </div>
              )}
              <div>
                <div className="text-2xs font-semibold tracking-[0.08em] uppercase text-ink-faint mb-1 mt-1">Discussion</div>
                <AnnThread sid={id} anns={anns} reader={reader} onAdd={onAnn} />
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
