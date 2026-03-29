import { useState, useRef, useEffect } from "react";
import { SHAPES } from "../../constants";

export default function SelectionPopover({ pos, onHighlight, onUnderline, onComment, onClose }) {
  const [showShapes, setShowShapes] = useState(false);
  const ref = useRef(null);
  const [adjustedPos, setAdjustedPos] = useState(null);

  useEffect(() => {
    if (!pos || !ref.current) { setAdjustedPos(null); return; }
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    let left = pos.left;
    let top = pos.top;
    const halfWidth = rect.width / 2;
    if (left - halfWidth < 8) left = halfWidth + 8;
    if (left + halfWidth > vw - 8) left = vw - halfWidth - 8;
    if (rect.height > pos.top - 8) top = pos.top + 30;
    setAdjustedPos({ top, left });
  }, [pos]);

  if (!pos) return null;
  const finalPos = adjustedPos || pos;

  return (
    <div
      ref={ref}
      data-selection-popover
      className="absolute -translate-x-1/2 -translate-y-full z-[200] flex gap-px py-0.5 px-1 bg-ink rounded shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-base animate-fade-in"
      style={{ top: finalPos.top, left: finalPos.left }}
    >
      {showShapes ? (
        <>
          {SHAPES.map(({ key, sym }) => (
            <button key={key} onClick={() => { onHighlight(key); setShowShapes(false); onClose(); }} title={key}
              className="bg-transparent border-none cursor-pointer text-white text-body font-medium py-1.5 px-2.5 rounded-sm flex items-center gap-0.5 whitespace-nowrap min-h-8">{sym}</button>
          ))}
          <button onClick={() => setShowShapes(false)} className="bg-transparent border-none cursor-pointer text-ink-tertiary text-base font-medium py-1.5 px-2.5 rounded-sm flex items-center gap-0.5 whitespace-nowrap min-h-8">&times;</button>
        </>
      ) : (
        <>
          <button onClick={() => setShowShapes(true)} className="bg-transparent border-none cursor-pointer text-white text-base font-medium py-1.5 px-2.5 rounded-sm flex items-center gap-0.5 whitespace-nowrap min-h-8" title="Highlight">Highlight</button>
          <div className="w-px bg-white/12 my-1" />
          <button onClick={() => { onUnderline(); onClose(); }} className="bg-transparent border-none cursor-pointer text-white text-base font-medium py-1.5 px-2.5 rounded-sm flex items-center gap-0.5 whitespace-nowrap min-h-8" title="Carry">Carry</button>
          <div className="w-px bg-white/12 my-1" />
          <button onClick={() => { onComment(); onClose(); }} className="bg-transparent border-none cursor-pointer text-white text-base font-medium py-1.5 px-2.5 rounded-sm flex items-center gap-0.5 whitespace-nowrap min-h-8" title="Comment">Comment</button>
        </>
      )}
    </div>
  );
}
