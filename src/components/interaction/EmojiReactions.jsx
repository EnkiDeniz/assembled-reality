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
            className="flex min-h-8 cursor-pointer items-center gap-1 rounded-full px-2.5 py-0.5 text-base transition-all duration-100"
            style={{
              background: voted ? "rgba(255,255,255,0.46)" : "transparent",
              border: `1px solid ${voted ? "var(--color-border-dark)" : "var(--color-border)"}`,
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
            className="flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded-full bg-transparent px-2 py-0.5 text-base text-ink-faint"
            style={{ border: `1px solid ${showPicker ? "var(--color-border-dark)" : "transparent"}` }}
          >
            +
          </button>
          {showPicker && (
            <div className="absolute bottom-full left-0 z-50 mb-1 flex gap-0.5 rounded-full border border-border bg-paper-soft px-1.5 py-1 shadow-[0_10px_24px_rgba(27,24,21,0.08)]">
              {EMOJI_REACTIONS.map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => { toggleReaction(bqId, key); setShowPicker(false); }}
                  title={label}
                  className="flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-full border-none bg-transparent px-2 py-1.5 text-[1rem]"
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
