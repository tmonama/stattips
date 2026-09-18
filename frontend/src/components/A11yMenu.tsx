import { useState } from "react";
import { getTextSize, getContrast, setTextSize, setContrast } from "../lib/a11y";

export default function A11yMenu() {
  const [ts, setTs] = useState(getTextSize());
  const [ct, setCt] = useState(getContrast());
  const size = (v: "normal" | "large" | "xlarge") => { setTextSize(v); setTs(v); };
  const contrast = () => { const v = ct === "high" ? "normal" : "high"; setContrast(v); setCt(v); };

  return (
    <details className="a11y">
      <summary aria-label="Accessibility options">♿ Access</summary>
      <div className="a11y-panel" role="group" aria-label="Accessibility settings">
        <div className="a11y-group">
          <h4>Text size</h4>
          <div className="a11y-sizes">
            <button className={ts === "normal" ? "on" : ""} aria-pressed={ts === "normal"} onClick={() => size("normal")}>A</button>
            <button className={ts === "large" ? "on" : ""} aria-pressed={ts === "large"} style={{ fontSize: 17 }} onClick={() => size("large")}>A+</button>
            <button className={ts === "xlarge" ? "on" : ""} aria-pressed={ts === "xlarge"} style={{ fontSize: 19 }} onClick={() => size("xlarge")}>A++</button>
          </div>
        </div>
        <div className="a11y-group">
          <h4>Contrast</h4>
          <button className={`a11y-toggle ${ct === "high" ? "on" : ""}`} aria-pressed={ct === "high"} onClick={contrast}>
            High contrast: {ct === "high" ? "On" : "Off"}
          </button>
        </div>
      </div>
    </details>
  );
}