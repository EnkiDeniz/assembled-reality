import { useState, useEffect, useRef } from "react";
import { READERS, SECTIONS } from "../../constants";

const READER_COLORS = ["#DC2626", "#0369A1", "#B45309", "#7C3AED", "#059669", "#BE185D", "#1D4ED8"];

export default function ReadingPresenceDots({ readingPositions, currentReader }) {
  const [dots, setDots] = useState([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const updateDots = () => {
      const newDots = [];
      READERS.forEach((reader, idx) => {
        if (reader === currentReader) return;
        const pos = readingPositions[reader];
        if (!pos?.sectionId) return;
        const el = document.getElementById(pos.sectionId);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY + rect.height / 2;
        newDots.push({ reader, color: READER_COLORS[idx] || "#999", top });
      });

      const grouped = [];
      newDots.sort((a, b) => a.top - b.top);
      for (const dot of newDots) {
        const existing = grouped.find(g => Math.abs(g.top - dot.top) < 30);
        if (existing) { existing.readers.push({ reader: dot.reader, color: dot.color }); }
        else { grouped.push({ top: dot.top, readers: [{ reader: dot.reader, color: dot.color }] }); }
      }
      setDots(grouped);
    };

    updateDots();
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateDots);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const interval = setInterval(updateDots, 3000);
    return () => { window.removeEventListener("scroll", onScroll); clearInterval(interval); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [readingPositions, currentReader]);

  if (dots.length === 0) return null;

  return (
    <div className="hidden md:block absolute top-0 -right-11 w-9 pointer-events-none">
      {dots.map((group, i) => (
        <div
          key={i}
          className="absolute right-0 flex gap-[3px] pointer-events-auto"
          style={{ top: group.top - 8 }}
          title={group.readers.map(r => r.reader).join(", ")}
        >
          {group.readers.map(({ reader, color }) => (
            <div
              key={reader}
              className="w-1.5 h-1.5 rounded-full border border-surface transition-[top] duration-400 ease-in-out"
              style={{ background: color }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
