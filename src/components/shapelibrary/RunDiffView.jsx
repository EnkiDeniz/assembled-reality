"use client";

function toComparable(entry = null) {
  const value = entry?.payload?.value || {};
  return {
    status: value.status || value.resultType || "",
    assemblyClass: value.assemblyClass || "",
    mainGap: value.mainGap || "",
    nextLawfulMove: value.nextLawfulMove || "",
    resultType: value.resultType || "",
    releaseGatePass: value.releaseGatePass ?? null,
    maturationScore: value.maturationScore ?? null,
    approved: value.approved ?? null,
    rationale: value.rationale || "",
  };
}

function renderChange(key, currentValue, previousValue) {
  const changed = JSON.stringify(currentValue) !== JSON.stringify(previousValue);
  return (
    <tr key={key}>
      <td className="shape-workbench-meta">{key}</td>
      <td className={changed ? "shape-workbench-success" : ""}>
        {String(currentValue ?? "-")}
      </td>
      <td>{String(previousValue ?? "-")}</td>
    </tr>
  );
}

export default function RunDiffView({ current = null, previous = null }) {
  const currentComparable = toComparable(current);
  const previousComparable = toComparable(previous);
  const keys = Object.keys(currentComparable);

  return (
    <section className="shape-workbench-panel">
      <h2>Consecutive diff</h2>
      {!current ? (
        <p className="shape-workbench-muted">Select a run to inspect differences.</p>
      ) : (
        <table className="shape-workbench-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Current</th>
              <th>Previous</th>
            </tr>
          </thead>
          <tbody>{keys.map((key) => renderChange(key, currentComparable[key], previousComparable[key]))}</tbody>
        </table>
      )}
    </section>
  );
}
