import { useState, useRef, useEffect } from "react";
import { askPublic } from "../lib/api";
import { t } from "../lib/i18n";
import ChatMessage, { type Turn } from "./ChatMessage";

const QUICK = [
  { label: "Inflation rate", q: "What is South Africa's current inflation rate?" },
  { label: "Contributors to inflation", q: "What were the main contributors to inflation?" },
  { label: "Unemployment", q: "What is the unemployment rate?" },
  { label: "Population", q: "What is South Africa's population?" },
];

export default function PublicAssistant({ lang }: { lang: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const active = turns.length > 0;

  useEffect(() => { if (active) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, active]);

  async function run(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    const id = nextId.current++;
    setQ(""); setBusy(true);
    setTurns((s) => [...s, { id, question: text, loading: true }]);
    try {
      const result = await askPublic(text, lang);
      setTurns((s) => s.map((x) => (x.id === id ? { ...x, loading: false, result } : x)));
    } catch {
      setTurns((s) => s.map((x) => (x.id === id ? { ...x, loading: false, error: "Couldn't reach the assistant. Is the API running on port 8000?" } : x)));
    } finally { setBusy(false); }
  }

  return (
    <div className={`assistant ${active ? "is-active" : "is-hero"}`}>
      {!active && (
        <div className="hero">
          <span className="hero-asterisk" aria-hidden="true">✳</span>
          <h1 className="hero-title">{t(lang, "hero_title")}</h1>
        </div>
      )}

      {active && (
        <div className="chat" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation">
          {turns.map((tn) => <ChatMessage key={tn.id} turn={tn} lang={lang} />)}
          <div ref={endRef} />
        </div>
      )}

      <div className="composer">
        <div className="composer-panel">
          <div className="composer-inner">
            <textarea className="composer-textarea" value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(q); } }}
              placeholder={t(lang, "composer_placeholder")} aria-label="Ask a question" rows={2} />
            <div className="composer-bottom">
              <div className="composer-left">
                <span className="btn-pill-action"><span className="status-dot" />{t(lang, "corpus")}</span>
              </div>
              <button className="composer-submit-btn" onClick={() => run(q)} disabled={busy || !q.trim()}>
                {busy ? t(lang, "asking") : t(lang, "ask")}
              </button>
            </div>
          </div>
        </div>
        {!active && (
          <div className="quick-options">
            {QUICK.map((c) => <button key={c.label} className="quick-pill" onClick={() => run(c.q)}>{c.label}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}