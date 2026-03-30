import { useState, useRef } from "react";
import { SHAPES } from "../../constants";

export default function SelectionPopover({ pos, onHighlight, onUnderline, onComment, onClose }) {
  const [showShapes, setShowShapes] = useState(false);
  const ref = useRef(null);

  if (!pos) return null;

  return (
    <div
      ref={ref}
      data-selection-popover
      className="absolute z-[200] flex -translate-x-1/2 -translate-y-full gap-1 rounded-full border border-border-dark/70 bg-paper-soft/96 px-2 py-1 text-base shadow-[0_14px_32px_rgba(27,24,21,0.12)] backdrop-blur-md animate-fade-in"
      style={{ top: pos.top, left: pos.left }}
    >
      {showShapes ? (
        <>
          {SHAPES.map(({ key, sym }) => (
            <button key={key} onClick={() => { onHighlight(key); setShowShapes(false); onClose(); }} title={key}
              className="flex min-h-8 items-center gap-0.5 rounded-full border-none bg-transparent px-2.5 py-1.5 font-serif text-[1rem] whitespace-nowrap text-ink">{sym}</button>
          ))}
          <button onClick={() => setShowShapes(false)} className="flex min-h-8 items-center gap-0.5 whitespace-nowrap rounded-full border-none bg-transparent px-2.5 py-1.5 text-base font-medium text-ink-tertiary">&times;</button>
        </>
      ) : (
        <>
          <button onClick={() => setShowShapes(true)} className="flex min-h-8 items-center gap-0.5 whitespace-nowrap rounded-full border-none bg-transparent px-2.5 py-1.5 font-sans text-sm font-medium text-ink" title="Highlight">Highlight</button>
          <div className="my-1 w-px bg-border" />
          <button onClick={() => { onUnderline(); onClose(); }} className="flex min-h-8 items-center gap-0.5 whitespace-nowrap rounded-full border-none bg-transparent px-2.5 py-1.5 font-sans text-sm font-medium text-ink" title="Carry">Carry</button>
          <div className="my-1 w-px bg-border" />
          <button onClick={() => { onComment(); onClose(); }} className="flex min-h-8 items-center gap-0.5 whitespace-nowrap rounded-full border-none bg-transparent px-2.5 py-1.5 font-sans text-sm font-medium text-ink" title="Comment">Comment</button>
        </>
      )}
    </div>
  );
}
