import { useState, useEffect } from "react";
import { READERS } from "../../constants";

export default function NameGate({ onSelect }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 50); }, []);
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-surface transition-opacity duration-500"
      style={{ opacity: vis ? 1 : 0 }}
    >
      <div className="text-center max-w-80 w-full px-5 py-8">
        <div className="text-sm font-semibold tracking-[0.06em] uppercase text-ink-muted mb-6">
          Arrive
        </div>
        <div className="flex flex-col gap-1.5">
          {READERS.map(n => (
            <button
              key={n}
              onClick={() => onSelect(n)}
              className="px-5 py-3 text-body font-medium bg-transparent border border-[#E5E5E5] rounded-sm cursor-pointer text-ink transition-all duration-100 min-h-11"
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
