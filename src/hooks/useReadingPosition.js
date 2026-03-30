import { useEffect, useRef } from "react";
import { SECTIONS } from "../constants";

export default function useReadingPosition(reader, updateReadingPosition) {
  const observerRef = useRef(null);
  const currentSectionRef = useRef(null);

  useEffect(() => {
    if (!reader) return;

    const sectionElements = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean);
    if (sectionElements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let mostVisible = null;
        let maxRatio = 0;

        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisible = entry.target;
          }
        });

        if (mostVisible && mostVisible.id !== currentSectionRef.current) {
          currentSectionRef.current = mostVisible.id;
          updateReadingPosition(mostVisible.id);
        }
      },
      { threshold: [0.1, 0.3, 0.5, 0.7], rootMargin: "-88px 0px 0px 0px" }
    );

    sectionElements.forEach(el => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [reader, updateReadingPosition]);
}
