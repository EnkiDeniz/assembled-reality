import { useEffect, useRef, useMemo } from "react";
import { deserializeRange, getTextNodesInRange } from "../../utils/rangeSerializer";
import { SHAPES } from "../../constants";

const SHAPE_COLORS = Object.fromEntries(SHAPES.map(s => [s.key, s.color]));

export default function TextHighlighter({ highlights, reader }) {
  const marksRef = useRef([]);

  // Group highlights by section for efficiency
  const bySectionId = useMemo(() => {
    const map = {};
    highlights.forEach(h => {
      if (!map[h.anchor.sectionId]) map[h.anchor.sectionId] = [];
      map[h.anchor.sectionId].push(h);
    });
    return map;
  }, [highlights]);

  useEffect(() => {
    // Clear previous marks
    marksRef.current.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
    marksRef.current = [];

    // Apply highlights
    // Process sections in reverse document order to avoid position shifting
    const sectionIds = Object.keys(bySectionId);
    for (const sectionId of sectionIds) {
      const sectionHighlights = bySectionId[sectionId];
      // Apply in reverse order to maintain positions
      for (let i = sectionHighlights.length - 1; i >= 0; i--) {
        const h = sectionHighlights[i];
        const range = deserializeRange(h.anchor);
        if (!range) continue;

        const color = SHAPE_COLORS[h.shape] || "#B84C2A";
        const textNodes = getTextNodesInRange(range);

        for (const { node, start, end } of textNodes) {
          try {
            const markRange = document.createRange();
            markRange.setStart(node, start);
            markRange.setEnd(node, end);

            const mark = document.createElement("mark");
            mark.style.cssText = `background: ${color}18; border-bottom: 2px solid ${color}40; padding: 0 1px; border-radius: 2px; cursor: pointer;`;
            mark.dataset.highlightId = h.id;
            mark.dataset.reader = h.reader;
            mark.dataset.shape = h.shape;
            mark.dataset.time = new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            mark.title = `${h.reader} — ${SHAPES.find(s => s.key === h.shape)?.label || h.shape}`;

            markRange.surroundContents(mark);
            marksRef.current.push(mark);
          } catch {
            // surroundContents fails if range splits an element — skip gracefully
          }
        }
      }
    }

    return () => {
      marksRef.current.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent), mark);
          parent.normalize();
        }
      });
      marksRef.current = [];
    };
  }, [bySectionId, reader]);

  return null;
}
