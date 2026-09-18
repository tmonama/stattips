import { useRef, useState } from "react";
import Markdown from "./Markdown";

type Wrap = { before: string; after: string; placeholder: string };
type LinePrefix = { prefix: string; placeholder: string };

export default function MarkdownField({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const ref = useRef<HTMLTextAreaElement>(null);

  function apply(fn: (v: string, start: number, end: number) => { text: string; selStart: number; selEnd: number }) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const { text, selStart, selEnd } = fn(value, start, end);
    onChange(text);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(selStart, selEnd); });
  }

  const wrap = (w: Wrap) => apply((v, s, e) => {
    const sel = v.slice(s, e) || w.placeholder;
    const text = v.slice(0, s) + w.before + sel + w.after + v.slice(e);
    return { text, selStart: s + w.before.length, selEnd: s + w.before.length + sel.length };
  });

  const line = (l: LinePrefix) => apply((v, s, e) => {
    // find start of the first selected line
    const lineStart = v.lastIndexOf("\n", s - 1) + 1;
    const sel = v.slice(lineStart, e) || l.placeholder;
    const prefixed = sel.split("\n").map((ln) => l.prefix + ln).join("\n");
    const text = v.slice(0, lineStart) + prefixed + v.slice(e);
    return { text, selStart: lineStart, selEnd: lineStart + prefixed.length };
  });

  const linkBtn = () => apply((v, s, e) => {
    const sel = v.slice(s, e) || "link text";
    const md = `[${sel}](url)`;
    const text = v.slice(0, s) + md + v.slice(e);
    // select the "url" placeholder
    const urlStart = s + sel.length + 3;
    return { text, selStart: urlStart, selEnd: urlStart + 3 };
  });

  return (
    <div className="mdfield">
      <div className="mdfield-tabs">
        <button type="button" className={tab === "write" ? "on" : ""} onClick={() => setTab("write")}>Write</button>
        <button type="button" className={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}>Preview</button>
      </div>

      {tab === "write" && (
        <div className="mdfield-toolbar" role="toolbar" aria-label="Formatting">
          <button type="button" title="Bold (Ctrl/Cmd+B)" aria-label="Bold" onClick={() => wrap({ before: "**", after: "**", placeholder: "bold text" })}><b>B</b></button>
          <button type="button" title="Italic (Ctrl/Cmd+I)" aria-label="Italic" onClick={() => wrap({ before: "*", after: "*", placeholder: "italic text" })}><i>I</i></button>
          <span className="mdfield-div" />
          <button type="button" title="Heading" aria-label="Heading" onClick={() => line({ prefix: "## ", placeholder: "Heading" })}>H</button>
          <button type="button" title="Bulleted list" aria-label="Bulleted list" onClick={() => line({ prefix: "- ", placeholder: "List item" })}>• List</button>
          <button type="button" title="Numbered list" aria-label="Numbered list" onClick={() => line({ prefix: "1. ", placeholder: "List item" })}>1. List</button>
          <span className="mdfield-div" />
          <button type="button" title="Link" aria-label="Insert link" onClick={linkBtn}>🔗 Link</button>
        </div>
      )}

      {tab === "write" ? (
        <textarea
          ref={ref}
          className="mdfield-textarea"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); wrap({ before: "**", after: "**", placeholder: "bold text" }); }
            if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); wrap({ before: "*", after: "*", placeholder: "italic text" }); }
          }}
        />
      ) : (
        <div className="mdfield-preview"><Markdown text={value || "*Nothing to preview yet.*"} /></div>
      )}
    </div>
  );
}