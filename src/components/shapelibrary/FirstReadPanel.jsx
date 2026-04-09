"use client";

import { useState } from "react";
import { analyzeShape } from "@/lib/shapelibrary-client";
import {
  pickPrimaryCandidate,
  translateAnalyzeStatus,
  translateAssemblyClass,
} from "@/lib/shapelibrary-transformers";
import StatusBadge from "@/components/shapelibrary/StatusBadge";

export default function FirstReadPanel({ onResult }) {
  const [text, setText] = useState(
    "A single approval lane slows delivery while backlog keeps growing.",
  );
  const [windowText, setWindowText] = useState("2 weeks");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleAnalyze(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        runType: "single",
        inputMode: "human",
        mode: "standard",
        intentLayer: "behavior",
        assumptionStatus: "explicit",
        observables: ["work is delayed", "queue grows"],
        timescale: { horizon: "short", window: windowText || "2 weeks" },
        constraints: ["single approval lane"],
        resourceBudget: { time: windowText || "2 weeks", money: "low", attention: "high", other: [] },
        operationalFailure: "delivery queue grows faster than it clears",
        invariant: text,
        granularity: "primitive",
        assemblyClass: "path_dependent",
        joinPattern: "request->review->approve->ship",
        falsifier: "add reviewer parallel lane and compare queue depth",
        transferPrediction: "queue depth should drop after lane split",
      };
      const response = await analyzeShape(payload);
      const value = response?.value || null;
      const next = {
        ...value,
        exportedTo: response?.exportedTo || null,
        candidateId: pickPrimaryCandidate(value),
      };
      setResult(next);
      if (typeof onResult === "function") onResult(next);
    } catch (err) {
      setError(err.message || "Analyze failed.");
    } finally {
      setLoading(false);
    }
  }

  const statusText = translateAnalyzeStatus(result);
  const assemblyText = translateAssemblyClass(result?.assemblyClass);

  return (
    <section className="shape-workbench-panel">
      <h2>First Read</h2>
      <p className="shape-workbench-muted">
        Submit one situation and get a disciplined first read before any promotion action.
      </p>
      <form onSubmit={handleAnalyze} className="shape-workbench-grid">
        <label className="shape-workbench-label">
          <span>Situation (one sentence)</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            className="terminal-textarea"
          />
        </label>
        <label className="shape-workbench-label">
          <span>Observation window</span>
          <input
            value={windowText}
            onChange={(event) => setWindowText(event.target.value)}
            className="terminal-input"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="terminal-button is-primary"
        >
          {loading ? "Reading..." : "Run first read"}
        </button>
      </form>

      {error ? (
        <p className="shape-workbench-error">{error}</p>
      ) : null}

      {result ? (
        <div className="shape-workbench-grid">
          <div className="shape-workbench-row">
            <StatusBadge value={result} text={statusText} />
            {result.resultType ? (
              <span className="shape-workbench-meta">Result: {result.resultType}</span>
            ) : null}
          </div>
          <p className="shape-workbench-kv">
            <strong>Assembly class:</strong> {assemblyText}
          </p>
          <p className="shape-workbench-kv">
            <strong>Main gap:</strong> {result.mainGap || "No main gap reported."}
          </p>
          <p className="shape-workbench-kv">
            <strong>Next lawful move:</strong>{" "}
            {result.nextLawfulMove || "No next move reported."}
          </p>
          <p className="shape-workbench-kv">
            <strong>Receipt condition:</strong>{" "}
            {result.receiptCondition
              ? `${result.receiptCondition.receiptType} when ${result.receiptCondition.validWhen}`
              : "No receipt condition reported."}
          </p>
          <p className="shape-workbench-kv">
            <strong>Possible disconfirmation:</strong>{" "}
            {result.possibleDisconfirmation || "No disconfirmation specified."}
          </p>
          {result.exportedTo ? (
            <p className="shape-workbench-meta">
              Export: {result.exportedTo}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
