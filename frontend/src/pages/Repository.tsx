import { useEffect, useState } from "react";
import { searchMemory, createMemory, type MemoryItem } from "../lib/api";
import Markdown from "../components/Markdown";

const KINDS = [
  { v: "media_response", l: "Media response" },
  { v: "press_release", l: "Press release" },
  { v: "statement", l: "Official statement" },
  { v: "faq", l: "FAQ" },
  { v: "other", l: "Other messaging" },
];

export default function Repository() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);

  const [nk, setNk] = useState("press_release");
  const [nt, setNt] = useState("");
  const [nq, setNq] = useState("");
  const [nr, setNr] = useState("");
  const [ntags, setNtags] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try { setItems(await searchMemory(q, kind || undefined)); setErr(""); }
    catch { setErr("Couldn't load the repository."); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [kind]);

  async function save() {
    if (!nr.trim() || saving) return;
    setSaving(true);
    try {
      await createMemory({ kind: nk, title: nt.trim(), question: nq.trim(), response_text: nr.trim(), tags: ntags.trim() });
      setNt(""); setNq(""); setNr(""); setNtags(""); setAdding(false);
      await load();
    } catch { setErr("Couldn't save the item."); }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className="pagehead">
        <h1>Communication repository</h1>
        <p>Approved media responses, press releases, statements and FAQs. Search by meaning — the assistant draws on this same repository when drafting.</p>
      </div>

      <div className="review-toolbar">
        <input className="review-search" placeholder="Search the repository by meaning…"
               value={q} onChange={(e) => setQ(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && load()} />
        <select className="review-select" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">All types</option>
          {KINDS.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}
        </select>
        <button className="btn-approve" onClick={load}>Search</button>
        <button className="btn-ghost" onClick={() => setAdding((a) => !a)}>{adding ? "Close" : "Add item"}</button>
      </div>

      {adding && (
        <div className="repo-add">
          <div className="media-row">
            <div className="media-field">
              <label>Type</label>
              <select className="review-select" value={nk} onChange={(e) => setNk(e.target.value)}>
                {KINDS.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}
              </select>
            </div>
            <div className="media-field">
              <label>Title</label>
              <input className="media-input" value={nt} onChange={(e) => setNt(e.target.value)} placeholder="e.g. Q2 2026 unemployment statement" />
            </div>
          </div>
          <div className="media-field">
            <label>Topic / typical question <span className="opt">(helps matching)</span></label>
            <input className="media-input" value={nq} onChange={(e) => setNq(e.target.value)} placeholder="e.g. youth unemployment trends" />
          </div>
          <div className="media-field">
            <label>Approved text</label>
            <textarea className="media-textarea" value={nr} onChange={(e) => setNr(e.target.value)} placeholder="The approved wording…" />
          </div>
          <div className="media-field">
            <label>Tags <span className="opt">(comma-separated)</span></label>
            <input className="media-input" value={ntags} onChange={(e) => setNtags(e.target.value)} placeholder="labour, QLFS" />
          </div>
          <button className="btn-approve" disabled={!nr.trim() || saving} onClick={save}>{saving ? "Saving…" : "Save to repository"}</button>
        </div>
      )}

      {err && <div className="card error">{err}</div>}
      {!err && items.length === 0 && <div className="empty"><h3>Nothing yet</h3>Approve a media draft, or add an item above.</div>}

      <div className="repo-list">
        {items.map((it) => (
          <div key={it.id} className="repo-item">
            <div className="repo-top">
              <span className={`badge kind-${it.kind}`}>{it.kind_display}</span>
              {it.similarity != null && <span className="repo-sim">{Math.round(it.similarity * 100)}% match</span>}
              <span className="review-date">{new Date(it.created_at).toLocaleDateString()}</span>
            </div>
            {it.title && <p className="repo-title">{it.title}</p>}
            {it.question && <p className="repo-q">{it.question}</p>}
            <div className="repo-body"><Markdown text={it.response_text} /></div>
            {it.tags && <p className="repo-tags">{it.tags}</p>}
          </div>
        ))}
      </div>
    </>
  );
}