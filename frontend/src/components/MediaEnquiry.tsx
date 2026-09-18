import { useState } from "react";
import { askMedia } from "../lib/api";

export default function MediaEnquiry() {
  const [question, setQuestion] = useState("");
  const [kind, setKind] = useState("media_response");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const valid = question.trim().length > 8 && /\S+@\S+\.\S+/.test(email);

  async function submit() {
    if (!valid || busy) return;
    setBusy(true); setErr("");
    try {
      await askMedia(question.trim(), email.trim(), org.trim(), kind);
      setSent(true);
    } catch {
      setErr("Couldn't submit your enquiry. Please try again, or check the API is running.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="media-container">
        <div className="card answer">
          <span className="badge badge-official">Enquiry received</span>
          <p className="answer-text" style={{ fontSize: "17px", margin: "12px 0 8px" }}>
            Thank you — your enquiry has been logged for review.
          </p>
          <p style={{ color: "var(--ink-muted)", fontSize: "14px", lineHeight: "1.55" }}>
            A Statistics South Africa communications official will review a source-checked draft and reply to <strong>{email}</strong>. Media responses are never auto-sent.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="media-container">
      <div className="media-header">
        <h1>Media &amp; press enquiries</h1>
        <p>
          Submit a question for official comment. Unlike the public assistant, media enquiries are never auto-answered — a communications official reviews a source-checked draft and responds to you directly.
        </p>
      </div>

      <div className="media-form">
        <div className="media-field">
          <label htmlFor="enquiry-text">Your enquiry</label>
          <textarea id="enquiry-text" className="media-textarea" value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Can Stats SA comment on youth unemployment trends this quarter?" />
        </div>

        <div className="media-row">
          <div className="media-field">
            <label htmlFor="enquiry-kind">Type of response requested</label>
            <select id="enquiry-kind" className="media-input" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="media_response">Media response</option>
                <option value="statement">Official statement</option>
                <option value="press_release">Press release</option>
                <option value="faq">FAQ</option>
            </select>
            <label htmlFor="enquiry-email">Email for our response</label>
            <input id="enquiry-email" type="email" className="media-input" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@newsroom.co.za" />
          </div>
          <div className="media-field">
            <label htmlFor="enquiry-org">Publication / organisation <span className="opt">(optional)</span></label>
            <input id="enquiry-org" className="media-input" value={org}
              onChange={(e) => setOrg(e.target.value)} placeholder="e.g. Daily Maverick" />
          </div>
        </div>

        <div className="media-actions">
          <button className="media-submit" disabled={!valid || busy} onClick={submit}>
            {busy ? "Submitting…" : "Submit enquiry for review"}
          </button>
          {err && <p className="ms-err" style={{ color: "var(--sa-red)" }}>{err}</p>}
          <p className="media-disclaimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Your enquiry enters the review queue. A human approves the wording before any response is sent.
          </p>
        </div>
      </div>
    </div>
  );
}