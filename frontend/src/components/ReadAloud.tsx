import { useEffect, useState } from "react";

export default function ReadAloud({ text, lang = "en-ZA", listenLabel = "Listen", stopLabel = "Stop" }: {
  text: string; lang?: string; listenLabel?: string; stopLabel?: string;
}) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);
  if (!supported) return null;

  function toggle() {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const clean = text.replace(/[#*_>`[\]]/g, "").replace(/\s+/g, " ").trim();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = lang;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang === lang) || voices.find((x) => x.lang.startsWith(lang.split("-")[0]));
    if (v) u.voice = v;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }
  return (
    <button className="readaloud" onClick={toggle} aria-pressed={speaking}
            aria-label={speaking ? "Stop reading answer aloud" : "Read answer aloud"}>
      <span aria-hidden="true">{speaking ? "◼" : "▶"}</span> {speaking ? stopLabel : listenLabel}
    </button>
  );
}