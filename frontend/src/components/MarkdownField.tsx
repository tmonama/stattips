import { useState } from "react";
import Markdown from "./Markdown";

export default function MarkdownField({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  return (
    <div className="mdfield">
      <div className="mdfield-tabs">
        <button type="button" className={tab === "write" ? "on" : ""} onClick={() => setTab("write")}>Write</button>
        <button type="button" className={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}>Preview</button>
      </div>
      {tab === "write" ? (
        <textarea className="mdfield-textarea" value={value} placeholder={placeholder}
                  onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="mdfield-preview"><Markdown text={value || "*Nothing to preview yet.*"} /></div>
      )}
    </div>
  );
}