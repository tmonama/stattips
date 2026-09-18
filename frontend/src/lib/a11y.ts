type TextSize = "normal" | "large" | "xlarge";
type Contrast = "normal" | "high";
const TS = "a11y_textsize", CT = "a11y_contrast";

export const getTextSize = (): TextSize => (localStorage.getItem(TS) as TextSize) || "normal";
export const getContrast = (): Contrast => (localStorage.getItem(CT) as Contrast) || "normal";

export function applyA11y() {
  const r = document.documentElement;
  r.setAttribute("data-textsize", getTextSize());
  r.setAttribute("data-contrast", getContrast());
}
export function setTextSize(v: TextSize) { localStorage.setItem(TS, v); applyA11y(); }
export function setContrast(v: Contrast) { localStorage.setItem(CT, v); applyA11y(); }