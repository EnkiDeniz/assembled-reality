import { useState } from "react";

export default function ToggleDepth({ label, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="my-2.5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 py-1 text-base font-medium bg-transparent border-none cursor-pointer text-ink-tertiary min-h-7"
      >
        <span
          className="text-xs transition-transform duration-150"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0)" }}
        >
          {"\u25B8"}
        </span>
        {label || "Expand"}
      </button>
      {open && (
        <div className="mt-1 px-3.5 py-2.5 bg-[#F5F5F4] border-l-2 border-border rounded-r-sm text-[0.875rem] leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
