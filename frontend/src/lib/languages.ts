export interface Lang { code: string; name: string; supported: boolean; note?: string; bcp47: string; }

export const LANGUAGES: Lang[] = [
  { code: "en", name: "English", supported: true },
  { code: "af", name: "Afrikaans", supported: true },
  { code: "zu", name: "isiZulu", supported: true },
  { code: "xh", name: "isiXhosa", supported: false, note: "coming soon" },
  { code: "nso", name: "Sepedi", supported: false, note: "coming soon" },
  { code: "tn", name: "Setswana", supported: false, note: "coming soon" },
  { code: "st", name: "Sesotho", supported: false, note: "coming soon" },
  { code: "ts", name: "Xitsonga", supported: false, note: "coming soon" },
  { code: "ss", name: "siSwati", supported: false, note: "coming soon" },
  { code: "ve", name: "Tshivenda", supported: false, note: "coming soon" },
  { code: "nr", name: "isiNdebele", supported: false, note: "coming soon" },
  { code: "sasl", name: "SA Sign Language", supported: false, note: "visual — not text" },
];

export const langName = (code: string) => LANGUAGES.find((l) => l.code === code)?.name ?? "English";
export const isSupported = (code: string) => !!LANGUAGES.find((l) => l.code === code)?.supported;
export const bcp47 = (code: string) => LANGUAGES.find((l) => l.code === code)?.bcp47 ?? "en-ZA";