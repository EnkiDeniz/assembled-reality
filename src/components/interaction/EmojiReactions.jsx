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
      className="flex gap-1 flex-wrap items-center overflow-hidden transition-all duration-150"
      style={{
        marginTop: hasAny ? 6 : 0,
        minHeight: visible ? 24 : 0,
        opacity: visible ? 1 : 0,
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
            className="flex items-center gap-0.5 py-0.5 px-2 text-base rounded-sm cursor-pointer transition-all duration-100 min-h-7"
            style={{
              background: voted ? "#F5F5F4" : "transparent",
              border: `1px solid ${voted ? "#D4D4D4" : "#E5E5E5"}`,
            }}
          >
            <span>{emoji}</span>
            <span className="text-sm font-medium text-ink-tertiary">{voters.length}</span>
          </button>
        );
      })}

      {visible && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="py-0.5 px-2 text-base bg-transparent rounded-sm cursor-pointer text-ink-faint min-h-7 min-w-7 flex items-center justify-center"
            style={{ border: `1px solid ${showPicker ? "#D4D4D4" : "transparent"}` }}
          >
            +
          </button>
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-1 flex gap-0.5 py-1 px-1.5 bg-white border border-border rounded shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-50">
              {EMOJI_REACTIONS.map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => { toggleReaction(bqId, key); setShowPicker(false); }}
                  title={label}
                  className="py-1.5 px-2 text-[1rem] bg-transparent border-none cursor-pointer rounded-sm min-w-9 min-h-9 flex items-center justify-center"
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
