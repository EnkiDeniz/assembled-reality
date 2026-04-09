"use client";

import { useEffect, useState } from "react";
import DriftDashboard from "@/components/shapelibrary/DriftDashboard";

export const dynamic = "force-dynamic";

export default function ShapeLibraryDriftPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setError("");
      try {
        const response = await fetch("/api/shapelibrary/drift", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || payload?.ok === false) throw new Error("Drift fetch failed");
        if (active) setReport(payload.value || null);
      } catch (err) {
        if (active) setError(err.message || "Could not load drift report.");
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="shape-workbench-page">
      <section className="shape-workbench-shell">
        <header className="shape-workbench-header">
          <h1 className="shape-workbench-title">Shape Library Drift</h1>
          <p className="shape-workbench-subtitle">
            Operator-facing stability signals from latest evaluate output.
          </p>
        </header>
        {error ? <p className="shape-workbench-error">{error}</p> : null}
        {report ? <DriftDashboard report={report} /> : <p className="shape-workbench-muted">Loading drift report...</p>}
      </section>
    </main>
  );
}
