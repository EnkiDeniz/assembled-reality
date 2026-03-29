import { useState } from "react";
import { EMOJI_REACTIONS } from "../../constants";

export default function EmojiReactions({ bqId, reactions, toggleReaction, reader }) {
  const [showPicker, setShowPicker] = useState(false);
  const [hovered, setHovered] = useState(false);
  const bqReactions = reactions[bqId] || {};
  const hasAny = Object.values(bqReactions).some(v => v.length > 0);

  const visible = hasAny || hovered || showPicker;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (!showPicker) setShowPicker(false); }}
      style={{
        display: "flex", gap: 4, flexWrap: "wrap",
        marginTop: hasAny ? 6 : 0, paddingTop: hasAny ? 4 : 0,
        alignItems: "center",
        minHeight: visible ? 28 : 0,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s, min-height 0.2s",
        overflow: "hidden",
      }}
    >
      {EMOJI_REACTIONS.map(({ key, emoji }) => {
        const voters = bqReactions[key] || [];
        if (voters.length === 0) return null;
        const voted = voters.includes(reader);
        return (
          <button
            key={key}
            onClick={() => toggleReaction(bqId, key)}
            title={voters.join(", ")}
            style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "4px 10px", fontSize: "0.72rem",
              background: voted ? "#1A191710" : "transparent",
              border: `1px solid ${voted ? "#D6D1C8" : "#E8E4DC"}`,
              borderRadius: 12, cursor: "pointer",
              transition: "all 0.15s",
              minHeight: 36, minWidth: 36,
            }}
          >
            <span style={{ fontSize: "0.82rem" }}>{emoji}</span>
            <span style={{ fontSize: "0.58rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, color: "#5C5A55" }}>{voters.length}</span>
          </button>
        );
      })}

      {/* Add reaction — visible on hover/tap or when reactions exist */}
      {visible && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowPicker(!showPicker)}
            style={{
              padding: "4px 10px", fontSize: "0.72rem",
              background: "transparent",
              border: `1px solid ${showPicker ? "#D6D1C8" : "transparent"}`,
              borderRadius: 12, cursor: "pointer", color: "#8A877F",
              minHeight: 36, minWidth: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            +
          </button>
          {showPicker && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, marginBottom: 4,
              display: "flex", gap: 2, padding: "4px 6px",
              background: "#F7F4EF", border: "1px solid #D6D1C8", borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 50,
            }}>
              {EMOJI_REACTIONS.map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => { toggleReaction(bqId, key); setShowPicker(false); }}
                  title={label}
                  style={{
                    padding: "6px 8px", fontSize: "1rem",
                    background: "transparent", border: "none",
                    cursor: "pointer", borderRadius: 4,
                    minWidth: 40, minHeight: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
