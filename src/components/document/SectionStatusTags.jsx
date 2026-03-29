import { STATUS_TAGS, READERS } from "../../constants";

export default function SectionStatusTags({ sectionId, statusTags, toggleStatusTag, reader }) {
  const tags = statusTags[sectionId] || {};
  const sealVoters = tags["ready-seal"] || [];
  const isSealed = sealVoters.length >= 4;

  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
      {STATUS_TAGS.map(({ key, label, color }) => {
        const voters = tags[key] || [];
        const voted = voters.includes(reader);
        const count = voters.length;
        const isSeal = key === "ready-seal" && isSealed;

        return (
          <button
            key={key}
            onClick={() => toggleStatusTag(sectionId, key)}
            title={voters.length > 0 ? voters.join(", ") : "No votes yet"}
            style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "4px 10px", fontSize: "0.54rem",
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase",
              background: isSeal ? "#2A5A6B" : voted ? color + "14" : "transparent",
              color: isSeal ? "#F7F4EF" : voted ? color : "#8A877F",
              border: `1px solid ${isSeal ? "#2A5A6B" : voted ? color : "#D6D1C8"}`,
              borderRadius: 12, cursor: "pointer",
              transition: "all 0.15s",
              minHeight: 36,
            }}
          >
            {label}
            {count > 0 && (
              <span style={{
                fontSize: "0.5rem", fontWeight: 700,
                background: isSeal ? "rgba(255,255,255,0.2)" : "transparent",
                padding: "0 3px", borderRadius: 4,
              }}>
                {count}/{READERS.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
