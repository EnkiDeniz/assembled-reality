import { useState, useEffect, useRef } from "react";
import { READERS, SECTIONS } from "../../constants";

const READER_COLORS = ["#B84C2A", "#2A5A6B", "#6B5A2A", "#5A2A6B", "#2A6B3A", "#6B2A4A", "#2A4A6B"];

export default function ReadingPresenceDots({ readingPositions, currentReader }) {
  const [dots, setDots] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const rafRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
        const section = SECTIONS.find(s => s.id === pos.sectionId);

        newDots.push({
          reader,
          color: READER_COLORS[idx] || "#8A877F",
          top,
          sectionTitle: section?.title || "",
          sectionNum: section?.num || "",
        });
      });

      // Group dots at similar positions (within 30px)
      const grouped = [];
      newDots.sort((a, b) => a.top - b.top);
      for (const dot of newDots) {
        const existing = grouped.find(g => Math.abs(g.top - dot.top) < 30);
        if (existing) {
          existing.readers.push({ reader: dot.reader, color: dot.color });
        } else {
          grouped.push({
            top: dot.top,
            sectionTitle: dot.sectionTitle,
            sectionNum: dot.sectionNum,
            readers: [{ reader: dot.reader, color: dot.color }],
          });
        }
      }

      setDots(grouped);
    };

    updateDots();

    // Update on scroll (throttled via rAF)
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateDots);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Also update periodically for position changes by other readers
    const interval = setInterval(updateDots, 3000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearInterval(interval);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [readingPositions, currentReader]);

  if (dots.length === 0) return null;

  // On mobile: don't show floating dots (too intrusive on small screens)
  if (isMobile) return null;

  return (
    <div style={{ position: "absolute", top: 0, right: -48, width: 40, pointerEvents: "none" }}>
      {dots.map((group, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: group.top - 10,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
            pointerEvents: "auto",
          }}
          title={group.readers.map(r => r.reader).join(", ") + ` · ${group.sectionNum}`}
        >
          <div style={{ display: "flex", gap: 3 }}>
            {group.readers.map(({ reader, color }) => (
              <div
                key={reader}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                  border: "1.5px solid #F7F4EF",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  transition: "top 0.5s ease",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
