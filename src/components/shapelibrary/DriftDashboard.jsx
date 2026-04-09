"use client";

function renderKeyValueRows(record = {}) {
  return Object.entries(record).map(([key, value]) => (
    <tr key={key}>
      <td>{key}</td>
      <td>{String(value)}</td>
    </tr>
  ));
}

export default function DriftDashboard({ report }) {
  const driftFlags = Array.isArray(report?.driftFlags) ? report.driftFlags : [];
  const bins = report?.nearMissHistogram?.bins || {};
  const byShape = report?.nearMissHistogram?.byShape || {};
  const basis = report?.matchBasisDistribution || {};

  return (
    <section className="shape-workbench-panel">
      <div>
        <h2>Drift dashboard</h2>
        <p className="shape-workbench-muted">
          Weekly drift view for operator diagnostics.
        </p>
      </div>

      <div className={`shape-workbench-flag-box ${driftFlags.length ? "is-alert" : "is-clear"}`}>
        {driftFlags.length ? (
          <>
            <strong>Drift flags</strong>: {driftFlags.join(", ")}
          </>
        ) : (
          <>
            <strong>System stable.</strong> No drift flags in the latest report.
          </>
        )}
      </div>

      <p className="shape-workbench-kv">
        <strong>Report date:</strong> {report?.reportDate || "unknown"}
      </p>
      <p className="shape-workbench-kv">
        <strong>Release gate pass:</strong> {String(Boolean(report?.releaseGatePass))}
      </p>
      <p className="shape-workbench-kv">
        <strong>Maturation score:</strong> {report?.maturationScore ?? 0}
      </p>

      <section>
        <h3>Match basis distribution</h3>
        <table className="shape-workbench-table">
          <tbody>
            {renderKeyValueRows(basis).length ? (
              renderKeyValueRows(basis)
            ) : (
              <tr>
                <td className="shape-workbench-muted">No basis metrics</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Near-miss histogram (by shape)</h3>
        <table className="shape-workbench-table">
          <tbody>
            {renderKeyValueRows(byShape).length ? (
              renderKeyValueRows(byShape)
            ) : (
              <tr>
                <td className="shape-workbench-muted">No near-miss by-shape data</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Near-miss histogram (bins)</h3>
        <table className="shape-workbench-table">
          <tbody>
            {renderKeyValueRows(bins).length ? (
              renderKeyValueRows(bins)
            ) : (
              <tr>
                <td className="shape-workbench-muted">No bin data</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </section>
  );
}
