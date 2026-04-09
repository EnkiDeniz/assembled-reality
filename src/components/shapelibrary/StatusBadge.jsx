"use client";

import { isConfirmedState, isHypothesisState } from "@/lib/shapelibrary-transformers";

function resolveTone(value) {
  const key = String(value?.status || value?.resultType || "").trim();
  if (isConfirmedState(value)) return "confirmed";
  if (isHypothesisState(value)) return "hypothesis";
  if (key === "rejection") return "blocked";
  return "neutral";
}

export default function StatusBadge({ value, text }) {
  const tone = resolveTone(value);
  return (
    <span className={`shape-workbench-chip is-${tone}`}>
      {text || "No status"}
    </span>
  );
}
