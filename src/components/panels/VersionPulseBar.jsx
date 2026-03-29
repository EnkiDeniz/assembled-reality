import { DOCUMENT_VERSION, CHANGELOG } from "../../constants";

export default function VersionPulseBar({ versionPulse, reader, onDismiss }) {
  const lastSeen = versionPulse?.lastSeen?.[reader];
  if (lastSeen === DOCUMENT_VERSION) return null;

  const latestChange = CHANGELOG[CHANGELOG.length - 1];
  if (!latestChange) return null;

  return (
    <div style={{
      maxWidth: 660, margin: "0 auto", padding: "0 22px",
    }}>
      <div style={{
        marginTop: 8, padding: "8px 14px",
        background: "#2A5A6B0E", border: "1px solid #2A5A6B30",
        borderRadius: 4,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "'DM Sans',sans-serif", fontSize: "0.62rem",
        color: "#2A5A6B",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.52rem" }}>
            v{DOCUMENT_VERSION}
          </span>
          <span style={{ color: "#5C5A55" }}>{latestChange.summary}</span>
        </div>
        <button
          onClick={() => onDismiss(DOCUMENT_VERSION)}
          style={{
            background: "transparent", border: "none",
            color: "#8A877F", padding: "4px 8px", borderRadius: 3,
            cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            fontSize: "0.56rem", fontWeight: 500,
          }}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
