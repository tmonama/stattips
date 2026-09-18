type Dict = Record<string, string>;

const en: Dict = {
  public: "Public", media: "Media Enquiries",
  hero_title: "Stats at your fingertips",
  composer_placeholder: "How can I help you with official statistics today?",
  ask: "Ask", asking: "Consulting…", corpus: "Stats SA Corpus",
  consulting: "Consulting official sources…", translating: "Translating…",
  sources: "Sources", listen: "Listen", stop: "Stop",
  show_original: "Show original English",
  grounded: "Grounded in cited sources", outside: "Outside approved sources",
  source_match: "Source match", machine_assisted: "machine-assisted",
  refuse_hint: "The assistant only answers from approved Stats SA publications. Try asking about inflation, unemployment, GDP, or population.",
  footer: "Grounded directly in approved Statistics South Africa publications. Non-English answers are machine-assisted; English is authoritative.",
};

const af: Dict = {
  public: "Publiek", media: "Media-navrae",
  hero_title: "Statistiek op jou vingerpunte",
  composer_placeholder: "Hoe kan ek jou vandag met amptelike statistiek help?",
  ask: "Vra", asking: "Besig…", corpus: "Stats SA-korpus",
  consulting: "Raadpleeg amptelike bronne…", translating: "Vertaal tans…",
  sources: "Bronne", listen: "Luister", stop: "Stop",
  show_original: "Wys oorspronklike Engels",
  grounded: "Gegrond op aangehaalde bronne", outside: "Buite goedgekeurde bronne",
  source_match: "Bronpassing", machine_assisted: "masjien-ondersteun",
  refuse_hint: "Die assistent antwoord slegs uit goedgekeurde Stats SA-publikasies. Probeer vra oor inflasie, werkloosheid, BBP of bevolking.",
  footer: "Gegrond op goedgekeurde publikasies van Statistiek Suid-Afrika. Nie-Engelse antwoorde is masjien-ondersteun; Engels is gesaghebbend.",
};

const zu: Dict = {
  public: "Umphakathi", media: "Imibuzo yabezindaba",
  hero_title: "Izibalo eminweni yakho",
  composer_placeholder: "Ngingakusiza kanjani ngezibalo ezisemthethweni namuhla?",
  ask: "Buza", asking: "Iyasebenza…", corpus: "I-Stats SA Corpus",
  consulting: "Ihlola imithombo esemthethweni…", translating: "Iyahumusha…",
  sources: "Imithombo", listen: "Lalela", stop: "Misa",
  show_original: "Bonisa isiNgisi sokuqala",
  grounded: "Kusekelwe emithonjeni ecashuniwe", outside: "Ngaphandle kwemithombo evunyiwe",
  source_match: "Ukuvumelana komthombo", machine_assisted: "kusizwa ngomshini",
  refuse_hint: "Umsizi uphendula kuphela kokushicilelwe okugunyaziwe kwe-Stats SA. Zama ukubuza ngenfleshini, ukungasebenzi, i-GDP, noma inani labantu.",
  footer: "Kusekelwe kokushicilelwe okugunyaziwe kwe-Statistics South Africa. Izimpendulo ezingesona isiNgisi zisizwa ngomshini; isiNgisi yilo elisemthethweni.",
};

const DICTS: Record<string, Dict> = { en, af, zu };
export function t(lang: string, key: string): string {
  return DICTS[lang]?.[key] ?? en[key] ?? key;
}