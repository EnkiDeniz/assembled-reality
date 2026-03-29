import ShapeSig from "../interaction/ShapeSig";
import AnnThread from "../interaction/AnnThread";
import SectionStatusTags from "./SectionStatusTags";

export default function Sec({ id, num, title, children, sigs, anns, reader, onSig, onAnn, ph, statusTags, toggleStatusTag }) {
  const sealVoters = (statusTags?.[id]?.["ready-seal"]) || [];
  const isSealed = sealVoters.length >= 4;
  const isReaderNote = id === "reader-note";

  return (
    <>
      {ph}
      <section id={id} style={{
        marginBottom: "2.8rem",
        ...(isSealed ? { background: "#E8E4DC", padding: "16px 18px", borderRadius: 4, border: "1px solid #D6D1C8" } : {}),
      }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "1.45rem", fontWeight: 700, marginBottom: "0.9rem", lineHeight: 1.2 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.74rem", color: "#8A877F", marginRight: 5 }}>{num}</span>
          {title}
          {isSealed && <span style={{ marginLeft: 8, fontSize: "0.54rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2A5A6B", verticalAlign: "middle" }}>Sealed</span>}
        </h2>
        {children}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #E8E4DC" }}>
          <ShapeSig sid={id} sigs={sigs} onSig={onSig} reader={reader} />
          {!isReaderNote && statusTags && toggleStatusTag && (
            <SectionStatusTags sectionId={id} statusTags={statusTags} toggleStatusTag={toggleStatusTag} reader={reader} />
          )}
          <AnnThread sid={id} anns={anns} reader={reader} onAdd={onAnn} />
        </div>
      </section>
    </>
  );
}
