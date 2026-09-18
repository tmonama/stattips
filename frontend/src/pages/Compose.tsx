import { useState } from "react";
import { composeDraft, createMemory, type ComposeResult } from "../lib/api";
import MarkdownField from "../components/MarkdownField";

const KINDS = [
  { v: "press_release", l: "Press release" },
  { v: "statement", l: "Official statement" },
  { v: "faq", l: "FAQ answer" },
  { v: "media_response", l: "Media response" },
  { v: "other", l: "Other messaging" },
];

export default function Compose() {
  const [kind, setKind] = useState("press_release");
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<ComposeResult | null>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function generate() {
    const ins = instruction.trim();
    if (!ins || busy) return;
    setBusy(true); setErr(""); setResult(null); setSaved(false);
    try {
      const r = await composeDraft(ins, kind);
      setResult(r); setText(r.text);
    } catch {
      setErr("Couldn't generate. Is the API running and are you signed in?");
    } finally { setBusy(false); }
  }

  async function save() {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await createMemory({ kind, title: title.trim(), question: instruction.trim(), response_text: text.trim(), tags: tags.trim() });
      setSaved(true);
    } catch { setErr("Couldn't save to repository."); }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className="pagehead">
        <h1>Compose communication</h1>
        <p>Generate a grounded draft from approved Stats SA sources. Every figure is cited; unavailable figures are flagged <em>[figure to verify]</em>, never invented. Review and edit before saving to the repository.</p>
      </div>

      <div className="compose-input">
        <div className="media-row">
          <div className="media-field">
            <label>Type</label>
            <select className="review-select" value={kind} onChange={(e) => setKind(e.target.value)}>
              {KINDS.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}
            </select>
          </div>
        </div>
        <div className="media-field">
          <label>Brief — what should this communication cover?</label>
          <textarea className="media-textarea" value={instruction} onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Draft a press release on the Q2 2026 unemployment figures and the main contributing sectors." />
        </div>
        <button className="btn-approve" disabled={!instruction.trim() || busy} onClick={generate}>
          {busy ? "Generating…" : "Generate draft"}
        </button>
      </div>

      {err && <div className="card error">{err}</div>}

      {result && (
        <div className="compose-output">
          <div className="compose-meta">
            {result.grounded
              ? <span className="badge badge-ai">Grounded · {Math.round(result.confidence * 100)}% source match</span>
              : <span className="badge badge-gap">Low source coverage — verify figures manually</span>}
          </div>

          <label className="review-label">Draft (editable)</label>
          <MarkdownField value={text} onChange={setText} placeholder="The generated draft appears here…" />

          {result.citations.length > 0 && (
            <div className="citations">
              <h4>Sources</h4>
              <ol>
                {result.citations.map((c) => (
                  <li key={c.n}><a href={c.url} target="_blank" rel="noreferrer">{c.code} — {c.title}{c.page ? `, p.${c.page}` : ""}</a></li>
                ))}
              </ol>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div className="sug-list">
              <span className="review-label">Similar approved messaging (for consistency)</span>
              {result.suggestions.map((m) => (
                <div key={m.id} className="sug-item">
                  <div className="sug-head">
                    <span className={`badge kind-${m.kind}`}>{m.kind_display}</span>
                    {m.similarity != null && <span className="repo-sim">{Math.round(m.similarity * 100)}% match</span>}
                  </div>
                  <p className="sug-text">{m.response_text}</p>
                  <button className="sug-use" onClick={() => setText(m.response_text)}>Use this wording</button>
                </div>
              ))}
            </div>
          )}

          <div className="compose-save">
            <div className="media-row">
              <div className="media-field">
                <label>Title <span className="opt">(for the repository)</span></label>
                <input className="media-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q2 2026 unemployment press release" />
              </div>
              <div className="media-field">
                <label>Tags <span className="opt">(comma-separated)</span></label>
                <input className="media-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="labour, QLFS" />
              </div>
            </div>
            <button className="btn-approve" disabled={!text.trim() || saving || saved} onClick={save}>
              {saved ? "Saved to repository ✓" : saving ? "Saving…" : "Save to repository"}
            </button>
            {saved && <p className="compose-hint">This draft is now searchable in the repository and available for reuse.</p>}
          </div>
        </div>
      )}
    </>
  );
}