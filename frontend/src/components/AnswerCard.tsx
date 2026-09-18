import type { PublicAnswer } from "../lib/api";

export default function AnswerCard({ result }: { result: PublicAnswer }) {
  const { status, confidence, answer, message, citations, reuse } = result;

  if (status === "refused") {
    return (
      <div className="card refusal">
        <span className="badge badge-gap">Outside approved sources</span>
        <p className="answer-text">{message}</p>
        <p className="hint">
          The assistant only answers from approved Stats SA publications. Try rephrasing,
          or ask about inflation, unemployment, GDP, or population.
        </p>
        {reuse && <ReuseNote reuse={reuse} />}
      </div>
    );
  }

  return (
    <div className="card answer">
      <span className="badge badge-ai">AI-generated · grounded in cited sources</span>
      <p className="answer-text">{answer}</p>
      <div className="confidence">
        <span className="confidence-label">Source match {Math.round(confidence * 100)}%</span>
        <div className="confidence-bar"><span style={{ width: `${Math.round(confidence * 100)}%` }} /></div>
      </div>
      {citations && citations.length > 0 && (
        <div className="citations">
          <h3>Sources</h3>
          <ol>
            {citations.map((c) => (
              <li key={c.n}>
                <a href={c.url} target="_blank" rel="noreferrer">
                  {c.code} — {c.title}{c.page ? `, p.${c.page}` : ""}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
      {reuse && <ReuseNote reuse={reuse} />}
    </div>
  );
}

function ReuseNote({ reuse }: { reuse: NonNullable<PublicAnswer["reuse"]> }) {
  return (
    <div className="reuse">
      <span className="badge badge-official">Previously approved response</span>
      <p>{reuse.response}</p>
    </div>
  );
}