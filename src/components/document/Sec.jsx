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
      <section id={id} style={{
        marginBottom: "3rem",
        paddingBottom: "1.5rem",
        borderBottom: isSealed ? "none" : "1px solid #F0EFED",
        ...(isSealed ? { background: "#F0F0EE", padding: "14px 16px", borderRadius: 3, border: "1px solid #E5E5E5" } : {}),
      }}>
        <h2 style={{
          fontSize: "1.125rem", fontWeight: 700,
          marginBottom: "0.6rem", lineHeight: 1.3,
          display: "flex", alignItems: "baseline", gap: 6,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6875rem", color: "#999", fontWeight: 400 }}>{num}</span>
          {title}
          {isSealed && <span style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0369A1" }}>Sealed</span>}
        </h2>
        {children}

        {/* Interaction footer — collapsed by default */}
        <div style={{ marginTop: 10, borderTop: "1px solid #EBEBEB", paddingTop: 6 }}>
          {!showTools && !hasActivity ? (
            <button
              onClick={() => setShowTools(true)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.6875rem", color: "#999", padding: "4px 0",
                minHeight: 32, letterSpacing: "0.02em",
              }}
            >
              Signal · Tag · Discuss
            </button>
          ) : (
            <>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#BBB", marginBottom: 4 }}>How does this section land?</div>
                <ShapeSig sid={id} sigs={sigs} onSig={onSig} reader={reader} />
              </div>
              {!isReaderNote && statusTags && toggleStatusTag && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#BBB", marginBottom: 4 }}>Section status</div>
                  <SectionStatusTags sectionId={id} statusTags={statusTags} toggleStatusTag={toggleStatusTag} reader={reader} />
                </div>
              )}
              <div>
                <div style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#BBB", marginBottom: 4, marginTop: 4 }}>Discussion</div>
                <AnnThread sid={id} anns={anns} reader={reader} onAdd={onAnn} />
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
