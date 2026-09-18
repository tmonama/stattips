import { useState } from "react";
import PublicAssistant from "../components/PublicAssistant";
import MediaEnquiry from "../components/MediaEnquiry";
import A11yMenu from "../components/A11yMenu";
import { LANGUAGES } from "../lib/languages";
import { t } from "../lib/i18n";

export default function PublicSite() {
  const [mode, setMode] = useState<"public" | "media">("public");
  const [lang, setLang] = useState("en");

  return (
    <div className="public-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="public-topbar">
        <div className="pt-inner">
          <div className="brand pt-left">
            <span className="brand-symbol" aria-hidden="true">✳</span>
            <span className="brand-text">Stat<span>Tips</span></span>
          </div>

          <nav className="pt-center" aria-label="Mode">
            <div className="seg" role="tablist">
              <button role="tab" aria-selected={mode === "public"} className={mode === "public" ? "on" : ""} onClick={() => setMode("public")}>{t(lang, "public")}</button>
              <button role="tab" aria-selected={mode === "media"} className={mode === "media" ? "on" : ""} onClick={() => setMode("media")}>{t(lang, "media")}</button>
            </div>
          </nav>

          <div className="pt-right">
            {mode === "public" && (
              <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Answer language">
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} disabled={!l.supported}>
                    {l.name}{l.supported ? "" : ` (${l.note})`}
                  </option>
                ))}
              </select>
            )}
            <A11yMenu />
          </div>
        </div>
      </header>

      <main className="public-main" id="main">
        {mode === "public" ? <PublicAssistant lang={lang} /> : <MediaEnquiry />}
      </main>

      <footer className="public-footer">
        <p>{t(lang, "footer")}</p>
      </footer>
    </div>
  );
}