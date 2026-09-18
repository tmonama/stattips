import { useEffect, useMemo, useState } from "react";
import { getSources, sourceAction, type SourceItem } from "../lib/api";

export default function Sources() {
  const [items, setItems] = useState<SourceItem[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  async function load() {
    try { setItems(await getSources()); setErr(""); }
    catch { setErr("Couldn't load sources."); }
  }
  useEffect(() => { load(); }, []);

  async function act(id: number, action: "approve" | "archive") {
    setBusy(id);
    try { await sourceAction(id, action); await load(); }
    catch { setErr("Action failed."); }
    finally { setBusy(null); }
  }

  const filtered = useMemo(() => items.filter((s) => {
    if (status !== "all" && s.status !== status) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!`${s.title} ${s.publication_code} ${s.category}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [items, status, search]);

  return (
    <>
      <div className="pagehead">
        <h1>Approved sources</h1>
        <p>Only chunks from <strong>approved</strong> sources are retrievable by the assistant. Archiving retires a source so its content is no longer cited.</p>
      </div>

      <div className="review-toolbar">
        <input className="review-search" placeholder="Search by title, code, category…"
               value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="review-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {err && <div className="card error">{err}</div>}
      {!err && filtered.length === 0 && <div className="empty"><h3>No sources match</h3>Try a different search or filter.</div>}
      <div className="review-list">
        {filtered.map((s) => (
          <div key={s.id} className="review-card">
            <div className="review-top">
              <span className="badge badge-ai">{s.publication_code || "—"}</span>
              <span className={`badge badge-${s.status}`}>{s.status}</span>
              <span className="repo-sim">{s.chunk_count} chunks</span>
              <span className="review-date">{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
            <p className="repo-title">{s.title}</p>
            {s.source_url && <p className="review-contact"><a href={s.source_url} target="_blank" rel="noreferrer">{s.source_url}</a></p>}
            <div className="review-actions">
              {s.status !== "approved" && <button className="btn-approve" disabled={busy === s.id} onClick={() => act(s.id, "approve")}>Approve</button>}
              {s.status !== "archived" && <button className="btn-reject" disabled={busy === s.id} onClick={() => act(s.id, "archive")}>Archive</button>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}