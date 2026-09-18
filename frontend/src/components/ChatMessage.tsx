import { useEffect, useState } from "react";
import type { PublicAnswer } from "../lib/api";
import { translateText } from "../lib/api";
import { isSupported, langName, bcp47 } from "../lib/languages";
import { t } from "../lib/i18n";
import Markdown from "./Markdown";
import ReadAloud from "./ReadAloud";

export interface Turn { id: number; question: string; loading?: boolean; result?: PublicAnswer; error?: string; }

export default function ChatMessage({ turn, lang }: { turn: Turn; lang: string }) {
  const { question, loading, result, error } = turn;
  return (
    <div className="turn">
      <div className="msg-user">{question}</div>
      {loading && <div className="msg-ai loading" role="status">{t(lang, "consulting")}</div>}
      {error && <div className="msg-ai"><p style={{ color: "var(--sa-red)", margin: 0 }}>{error}</p></div>}
      {result && <Assistant result={result} lang={lang} />}
    </div>
  );
}

function Assistant({ result, lang }: { result: PublicAnswer; lang: string }) {
  const { status, confidence, answer, message, citations, reuse } = result;
  const original = status === "refused" ? (message ?? "") : (answer ?? "");
  const wantTranslate = isSupported(lang) && lang !== "en";
  const [translated, setTranslated] = useState("");
  const [translating, setTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTranslated(""); setShowOriginal(false);
    if (wantTranslate && original) {
      setTranslating(true);
      translateText(original, lang)
        .then((tx) => { if (!cancelled) setTranslated(tx); })
        .catch(() => { if (!cancelled) setTranslated(""); })
        .finally(() => { if (!cancelled) setTranslating(false); });
    }
    return () => { cancelled = true; };
  }, [lang, original, wantTranslate]);

  const showingTranslation = wantTranslate && translated && !showOriginal;
  const display = showingTranslation ? translated : original;

  return (
    <div className="msg-ai">
      <div className="answer-header">
        <span className={`badge ${status === "refused" ? "badge-gap" : "badge-ai"}`}>
          {status === "refused" ? t(lang, "outside") : t(lang, "grounded")}
        </span>
        {wantTranslate && <span className="badge badge-lang">{langName(lang)} · {t(lang, "machine_assisted")}</span>}
      </div>

      {translating && <p className="hint" role="status">{t(lang, "translating")}</p>}
      <div className="answer-text"><Markdown text={display} /></div>

      <div className="answer-tools">
        <ReadAloud text={display} lang={showingTranslation ? bcp47(lang) : "en-ZA"}
                   listenLabel={t(lang, "listen")} stopLabel={t(lang, "stop")} />
        {wantTranslate && translated && (
          <button className="lang-orig" onClick={() => setShowOriginal((s) => !s)}>
            {showOriginal ? `${t(lang, "show_original").replace("original English", langName(lang))}` : t(lang, "show_original")}
          </button>
        )}
      </div>

      {status === "refused" ? (
        <p className="hint">{t(lang, "refuse_hint")}</p>
      ) : (
        <div className="confidence">
          <span className="confidence-label">{t(lang, "source_match")} {Math.round(confidence * 100)}%</span>
          <div className="confidence-bar" role="img" aria-label={`${t(lang, "source_match")} ${Math.round(confidence * 100)}%`}>
            <span style={{ width: `${Math.round(confidence * 100)}%` }} />
          </div>
        </div>
      )}

      {citations && citations.length > 0 && (
        <div className="citations">
          <h4>{t(lang, "sources")}</h4>
          <ol>
            {citations.map((c) => (
              <li key={c.n}><a href={c.url} target="_blank" rel="noreferrer">{c.code} — {c.title}{c.page ? `, p.${c.page}` : ""}</a></li>
            ))}
          </ol>
        </div>
      )}

      {reuse && (
        <div className="reuse-note">
          <span className="badge badge-official">Previously approved response</span>
          <p>{reuse.response}</p>
        </div>
      )}
    </div>
  );
}