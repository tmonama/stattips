import { useEffect, useState } from "react";
import { getAudit, type AuditEntry } from "../lib/api";

function actionClass(a: string) {
  if (a.includes("approve")) return "ok";
  if (a.includes("reject")) return "bad";
  return "";
}

export default function AuditTrail() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => { getAudit().then(setRows).catch(() => setErr("Couldn't load the audit trail.")); }, []);

  return (
    <>
      <div className="pagehead">
        <h1>Audit trail</h1>
        <p>Every source approval, draft creation, and review decision — newest first, append-only.</p>
      </div>
      {err && <div className="card error">{err}</div>}
      {!err && rows.length === 0 && <div className="empty"><h3>No activity yet</h3>Actions appear here as they happen.</div>}
      {rows.length > 0 && (
        <div className="audit-table">
          <div className="audit-head"><span>When</span><span>Actor</span><span>Action</span><span>Object</span></div>
          {rows.map((r) => (
            <div className="audit-row" key={r.id}>
              <span className="audit-when">{new Date(r.timestamp).toLocaleString()}</span>
              <span className="audit-actor">{r.actor}</span>
              <span><span className={`audit-action ${actionClass(r.action)}`}>{r.action}</span></span>
              <span className="audit-obj">{r.object_type}{r.object_id ? ` #${r.object_id}` : ""}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}