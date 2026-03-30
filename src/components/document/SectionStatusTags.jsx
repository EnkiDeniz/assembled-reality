import { STATUS_TAGS, READERS } from "../../constants";

export default function SectionStatusTags({ sectionId, statusTags, toggleStatusTag, reader }) {
  const tags = statusTags[sectionId] || {};
  const sealVoters = tags["ready-seal"] || [];
  const isSealed = sealVoters.length >= 4;

  return (
    <div className="my-1.5 flex flex-wrap gap-2">
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
            className="flex min-h-10 cursor-pointer items-center gap-1 rounded-full px-3.5 py-1 text-sm font-medium transition-all duration-150"
            style={{
              background: isSeal ? "var(--color-ink)" : voted ? "var(--color-surface-raised)" : "rgba(255,255,255,0.4)",
              color: isSeal ? "var(--color-paper-soft)" : voted ? "var(--color-ink-secondary)" : "var(--color-ink-muted)",
              border: `1px solid ${isSeal ? "var(--color-ink)" : voted ? "var(--color-border-dark)" : "var(--color-border)"}`,
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
