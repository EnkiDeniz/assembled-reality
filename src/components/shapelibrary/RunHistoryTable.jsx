"use client";

function formatTime(ms = 0) {
  if (!ms) return "Unknown";
  return new Date(ms).toISOString();
}

export default function RunHistoryTable({ rows = [], selectedId = "", onSelect }) {
  return (
    <section className="shape-workbench-panel">
      <h2>Run history</h2>
      <div className="shape-workbench-table-wrap">
        <table className="shape-workbench-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Kind</th>
              <th>Status</th>
              <th>Assembly</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect?.(row.id)}
                className={`is-clickable ${selectedId === row.id ? "is-selected" : ""}`}
              >
                <td>{formatTime(row.timestamp)}</td>
                <td>{row.kind}</td>
                <td>{row.status}</td>
                <td>{row.assemblyClass || "-"}</td>
                <td>{row.resultType || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
