"use client";

import { useState } from "react";
import FirstReadPanel from "@/components/shapelibrary/FirstReadPanel";
import ReceiptCapturePanel from "@/components/shapelibrary/ReceiptCapturePanel";
import PromotionGatePanel from "@/components/shapelibrary/PromotionGatePanel";

export const dynamic = "force-dynamic";

export default function ShapeLibraryPage() {
  const [latestAnalyze, setLatestAnalyze] = useState(null);
  const [receiptDraft, setReceiptDraft] = useState(null);

  return (
    <main className="shape-workbench-page">
      <section className="shape-workbench-shell">
        <header className="shape-workbench-header">
          <h1 className="shape-workbench-title">Shape Library Workbench</h1>
          <p className="shape-workbench-subtitle">
            Operator surface for first reads, receipts, promotion, history, and drift diagnostics.
          </p>
          <p className="shape-workbench-meta">
            Routes: <a href="/shapelibrary">workbench</a> ·{" "}
            <a href="/shapelibrary/history">history</a> ·{" "}
            <a href="/shapelibrary/drift">drift</a>
          </p>
        </header>
        <FirstReadPanel onResult={setLatestAnalyze} />
        <ReceiptCapturePanel
          candidateId={latestAnalyze?.candidateId || ""}
          assemblyClass={latestAnalyze?.assemblyClass || ""}
          onDraftChange={setReceiptDraft}
        />
        {receiptDraft ? (
          <section className="shape-workbench-card">
            <h3>Promotion payload preview</h3>
            <pre className="shape-workbench-pre">
              {JSON.stringify(receiptDraft, null, 2)}
            </pre>
          </section>
        ) : null}
        <PromotionGatePanel draft={receiptDraft} />
      </section>
    </main>
  );
}
