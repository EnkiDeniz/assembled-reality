import { useState, useEffect, useCallback, useRef } from "react";
import { serializeRange } from "../utils/rangeSerializer";

export default function useTextSelection(contentRef) {
  const [selection, setSelection] = useState(null);
  const [popoverPos, setPopoverPos] = useState(null);
  const selectionTimeoutRef = useRef(null);

  const handleMouseUp = useCallback((e) => {
    // Don't trigger on button clicks or interactive elements
    if (e.target.closest("button, textarea, input, [role='button']")) {
      return;
    }

    // Small delay to let the selection finalize
    if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
    selectionTimeoutRef.current = setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setSelection(null);
        setPopoverPos(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const text = range.toString().trim();
      if (!text || text.length < 2) {
        setSelection(null);
        setPopoverPos(null);
        return;
      }

      // Make sure selection is within the content area
      if (contentRef?.current && !contentRef.current.contains(range.startContainer)) {
        setSelection(null);
        setPopoverPos(null);
        return;
      }

      const serialized = serializeRange(range);
      if (!serialized) {
        setSelection(null);
        setPopoverPos(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setPopoverPos({
        top: rect.top + window.scrollY - 8,
        left: rect.left + rect.width / 2,
      });
      setSelection(serialized);
    }, 10);
  }, [contentRef]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setPopoverPos(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    const ref = contentRef?.current;
    if (!ref) return;
    ref.addEventListener("mouseup", handleMouseUp);
    return () => ref.removeEventListener("mouseup", handleMouseUp);
  }, [contentRef, handleMouseUp]);

  // Clear on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest("[data-selection-popover]")) return;
      if (selection && !window.getSelection()?.toString().trim()) {
        clearSelection();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selection, clearSelection]);

  return { selection, popoverPos, clearSelection };
}
