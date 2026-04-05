import { useCallback, useEffect, useRef, useState } from "react";

export default function Popover({
  trigger,
  open: controlledOpen,
  onOpenChange,
  align = "start",
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const wrapperRef = useRef(null);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next) => {
      if (isControlled) {
        onOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen]);

  return (
    <div ref={wrapperRef} className="assembler-popover-wrapper">
      <div onClick={() => setOpen(!open)}>{trigger}</div>

      {open ? (
        <div
          className={`assembler-popover ${
            align === "end" ? "is-end" : align === "center" ? "is-center" : ""
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
