import { useEffect, useState } from "react";
import { getQueue, reviewAction, draftSuggestions, composeDraft, type Draft, type MemoryItem } from "../lib/api";
import MarkdownField from "../components/MarkdownField";
import Markdown from "../components/Markdown";
import RejectModal from "../components/RejectModal";

type StatusFilter = "all" | "pending" | "approved" | "rejected";
type DateFilter = "all" | "today" | "7d" | "30d";

const GEN_KINDS = [
  { v: "media_response", l: "Media response" },
  { v: "statement", l: "Statement" },
  { v: "press_release", l: "Press release" },
];

function withinDate(iso: string, f: DateFilter) {
  if (f === "all") return true;
  const t = new Date(iso).getTime();
  const now = Date.now();
  const day = 86400000;
  if (f === "today") { const d = new Date(); d.setHours(0, 0, 0, 0); return t >= d.getTime(); }
  if (f === "7d") return t >= now - 7 * day;
  if (f === "30d") return t >= now - 30 * day;
  return true;
}

export default function ReviewQueue() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [sug, setSug] = useState<Record<number, MemoryItem[]>>({});
  const [sugOpen, setSugOpen] = useState<Record<number, boolean>>({});
  const [genKind, setGenKind] = useState<Record<number, string>>({});
  const [genBusy, setGenBusy] = useState<number | null>(null);

  async function load() {
    try { setDrafts(await getQueue()); setErr(""); }
    catch { setErr("Couldn't load the queue. Check you're signed in and the API is running."); }
  }
  useEffect(() => { load(); }, []);

  async function approve(id: number) {
    setBusy(id);
    try { await reviewAction(id, "approve", edits[id]); await load(); }
    catch { setErr("Action failed."); }
    finally { setBusy(null); }
  }

  async function confirmReject() {
    if (rejectId == null) return;
    const id = rejectId;
    setBusy(id);
    try {
      await reviewAction(id, "reject", undefined, rejectReason.trim());
      setRejectId(null); setRejectReason(""); await load();
    } catch { setErr("Action failed."); }
    finally { setBusy(null); }
  }

  async function loadSug(id: number) {
    setSugOpen((s) => ({ ...s, [id]: !s[id] }));
    if (!sug[id]) {
      try {
        const results = await draftSuggestions(id);
        setSug((s) => ({ ...s, [id]: results }));
      } catch { /* non-blocking */ }
    }
  }

  async function generate(d: Draft) {
    setGenBusy(d.id); setErr("");
    try {
      const r = await composeDraft(d.question, genKind[d.id] || d.media_kind || "media_response");
      setEdits((s) => ({ ...s, [d.id]: r.text }));
    } catch {
      setErr("Generation failed — the model may be slow or still loading. Pre-warm Ollama and try again.");
    } finally { setGenBusy(null); }
  }

  const filtered = drafts.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (!withinDate(d.created_at, dateFilter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hay = `${d.question ?? ""} ${d.contact_email ?? ""} ${d.organisation ?? ""} ${d.draft_text ?? ""} ${d.final_text ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <>
      <div className="pagehead">
        <h1>Media review</h1>
        <p>Media enquiries and their drafts. Nothing is sent automatically — generate or edit the wording, then approve to release and store as an approved response, or reject with a reason.</p>
      </div>

      <div className="review-toolbar">
        <input className="review-search" placeholder="Search enquiries, email, organisation…"
               value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="review-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="review-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
          <option value="all">Any time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      {err && <div className="card error">{err}</div>}
      {!err && filtered.length === 0 && <div className="empty"><h3>Nothing to show</h3>No media requests match these filters.</div>}

      <div className="review-list">
        {filtered.map((d) => (
          <div key={d.id} className="review-card">
            <div className="review-top">
              <span className={`badge kind-${d.media_kind}`}>{d.media_kind.replace("_", " ")}</span>
              <span className="badge badge-ai">Draft #{d.id}</span>
              <span className={`badge badge-${d.status}`}>{d.status}</span>
              {!d.draft_text && d.status === "pending" && <span className="badge badge-gap">Gap — no source coverage</span>}
              <span className="review-date">{new Date(d.created_at).toLocaleString()}</span>
            </div>

            <div className="review-enquiry">
              <span className="review-label">Media enquiry</span>
              <p className="review-question">{d.question}</p>
              <p className="review-contact">
                Reply to <a href={`mailto:${d.contact_email}`}>{d.contact_email}</a>
                {d.organisation ? ` · ${d.organisation}` : ""}
              </p>
            </div>

            {d.status === "pending" ? (
              <>
                <div className="gen-row">
                  <select className="review-select" value={genKind[d.id] || d.media_kind || "media_response"}
                          onChange={(e) => setGenKind((s) => ({ ...s, [d.id]: e.target.value }))}>
                    {GEN_KINDS.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}
                  </select>
                  <button className="btn-ghost" disabled={genBusy === d.id} onClick={() => generate(d)}>
                    {genBusy === d.id ? "Generating…" : "Generate with AI"}
                  </button>
                </div>

                <label className="review-label">Response (editable before approval)</label>
                <MarkdownField
                  value={edits[d.id] ?? d.draft_text}
                  onChange={(v) => setEdits((s) => ({ ...s, [d.id]: v }))}
                  placeholder={d.draft_text ? "" : "No AI draft yet — generate above, or write the official response."}
                />
                <div className="review-actions">
                  <button className="btn-approve" disabled={busy === d.id} onClick={() => approve(d.id)}>
                    {busy === d.id ? "…" : "Approve & release"}
                  </button>
                  <button className="btn-reject" disabled={busy === d.id} onClick={() => { setRejectId(d.id); setRejectReason(""); }}>
                    Reject
                  </button>
                </div>

                <div className="sug">
                  <button className="sug-toggle" onClick={() => loadSug(d.id)}>
                    {sugOpen[d.id] ? "Hide" : "Find"} similar approved responses
                  </button>
                  {sugOpen[d.id] && (
                    <div className="sug-list">
                      {(sug[d.id] ?? []).length === 0 && <p className="sug-empty">No similar approved responses found.</p>}
                      {(sug[d.id] ?? []).map((m) => (
                        <div key={m.id} className="sug-item">
                          <div className="sug-head">
                            <span className={`badge kind-${m.kind}`}>{m.kind_display}</span>
                            {m.similarity != null && <span className="repo-sim">{Math.round(m.similarity * 100)}% match</span>}
                          </div>
                          <div className="sug-text"><Markdown text={m.response_text} /></div>
                          <button className="sug-use" onClick={() => setEdits((s) => ({ ...s, [d.id]: m.response_text }))}>Use this wording</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="review-final">
                <span className="review-label">{d.status === "approved" ? "Released response" : "Draft (not released)"}</span>
                <div className="review-finaltext"><Markdown text={d.final_text || d.draft_text || "—"} /></div>
                {d.status === "rejected" && d.reject_reason && (
                  <p className="review-reason"><strong>Reason sent to enquirer:</strong> {d.reject_reason}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {rejectId != null && (
        <RejectModal
          busy={busy === rejectId}
          reason={rejectReason}
          setReason={setRejectReason}
          onCancel={() => setRejectId(null)}
          onConfirm={confirmReject}
        />
      )}
    </>
  );
}