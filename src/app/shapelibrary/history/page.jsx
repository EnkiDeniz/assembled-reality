"use client";

import { useEffect, useMemo, useState } from "react";
import RunHistoryTable from "@/components/shapelibrary/RunHistoryTable";
import RunDiffView from "@/components/shapelibrary/RunDiffView";

export const dynamic = "force-dynamic";

export default function ShapeLibraryHistoryPage() {
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setError("");
      try {
        const response = await fetch("/api/shapelibrary/history", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || payload?.ok === false) throw new Error("History fetch failed");
        if (!active) return;
        const nextRows = Array.isArray(payload?.value) ? payload.value : [];
        setRows(nextRows);
        if (nextRows[0]?.id) setSelectedId(nextRows[0].id);
      } catch (err) {
        if (active) setError(err.message || "Could not load history.");
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const selectedIndex = rows.findIndex((row) => row.id === selectedId);
  const selected = selectedIndex >= 0 ? rows[selectedIndex] : null;
  const previous = selectedIndex >= 0 ? rows[selectedIndex + 1] || null : null;

  const counts = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc[row.kind] = (acc[row.kind] || 0) + 1;
        return acc;
      },
      { analyze: 0, evaluate: 0, promote: 0 },
    );
  }, [rows]);

  return (
    <main className="shape-workbench-page">
      <section className="shape-workbench-shell">
        <header className="shape-workbench-header">
          <h1 className="shape-workbench-title">Shape Library Run History</h1>
          <p className="shape-workbench-subtitle">
            Analyze/evaluate/promote exports in one ledger with quick consecutive diff.
          </p>
          <p className="shape-workbench-meta">
            Counts — analyze: {counts.analyze}, evaluate: {counts.evaluate}, promote: {counts.promote}
          </p>
        </header>

        {error ? <p className="shape-workbench-error">{error}</p> : null}

        <RunHistoryTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
        <RunDiffView current={selected} previous={previous} />
      </section>
    </main>
  );
}
