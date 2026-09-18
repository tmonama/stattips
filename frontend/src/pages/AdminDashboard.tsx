import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats, type Stats } from "../lib/api";

export default function AdminDashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { getStats().then(setS).catch(() => setErr("Couldn't load stats.")); }, []);

  return (
    <>
      <div className="pagehead">
        <h1>Governance console</h1>
        <p>Review media drafts, inspect the audit trail, and manage approved sources. Every media response is human-approved before release.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card pending">
          <span className="stat-num">{s ? s.pending : "—"}</span>
          <span className="stat-label">Pending review</span>
        </div>
        <div className="stat-card approved">
          <span className="stat-num">{s ? s.approved : "—"}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-card rejected">
          <span className="stat-num">{s ? s.rejected : "—"}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>
      {err && <div className="card error">{err}</div>}

      <div className="tiles">
        <Link className="tile g" to="/admin/review" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="chip">QUEUE</span>
          <div className="name">Media review</div>
          <div className="go">Open the queue →</div>
        </Link>
        <Link className="tile b" to="/admin/audit" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="chip">LOG</span>
          <div className="name">Audit trail</div>
          <div className="go">View activity →</div>
        </Link>
        <Link className="tile y" to="/admin/sources" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="chip">SRC</span>
          <div className="name">Sources</div>
          <div className="go">Manage &amp; approve →</div>
        </Link>
      </div>
    </>
  );
}