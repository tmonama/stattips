import ReactMarkdown from "react-markdown";

export default function Markdown({ text }: { text: string }) {
  return <div className="md"><ReactMarkdown>{text}</ReactMarkdown></div>;
}