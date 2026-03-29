import { STATUS_TAGS, READERS } from "../../constants";

export default function SectionStatusTags({ sectionId, statusTags, toggleStatusTag, reader }) {
  const tags = statusTags[sectionId] || {};
  const sealVoters = tags["ready-seal"] || [];
  const isSealed = sealVoters.length >= 4;

  return (
    <div className="flex gap-1 flex-wrap my-1.5">
      {STATUS_TAGS.map(({ key, label }) => {
        const voters = tags[key] || [];
        const voted = voters.includes(reader);
        const count = voters.length;
        const isSeal = key === "ready-seal" && isSealed;

        return (
          <button
            key={key}
            onClick={() => toggleStatusTag(sectionId, key)}
            title={voters.length > 0 ? voters.join(", ") : "No votes yet"}
            className="flex items-center gap-0.5 px-2 py-0.5 text-sm font-medium rounded-sm cursor-pointer transition-all duration-100 min-h-7"
            style={{
              background: isSeal ? "#111" : voted ? "#F5F5F4" : "transparent",
              color: isSeal ? "#fff" : voted ? "#333" : "#BBB",
              border: `1px solid ${isSeal ? "#111" : voted ? "var(--color-border)" : "#E5E5E5"}`,
            }}
          >
            {label}
            {count > 0 && (
              <span
                className="text-xs font-semibold"
                style={{ color: isSeal ? "rgba(255,255,255,0.7)" : "#999" }}
              >
                {count}/{READERS.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
