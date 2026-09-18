import { getToken } from "./auth";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Token ${t}` } : {};
}

async function post(path: string, body: unknown, auth = false) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(auth ? authHeaders() : {}) },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function login(username: string, password: string): Promise<string> {
  const r = await fetch(`${BASE}/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) throw new Error("Invalid credentials");
  return (await r.json()).token as string;
}

export interface Citation { n: number; code: string; title: string; page: number | null; url: string; }
export interface PublicAnswer {
  status: "answered" | "refused";
  confidence: number;
  answer?: string;
  message?: string;
  citations?: Citation[];
  reuse?: { id: number; question: string; response: string } | null;
}

export const askPublic = (question: string, lang = "en"): Promise<PublicAnswer> =>
  post("/public-query/", { question, lang });

export interface Draft {
  id: number; query: number; draft_text: string; final_text: string;
  status: string; reviewed_by: number | null; reviewed_at: string | null; created_at: string;
}
export async function getQueue(): Promise<Draft[]> {
  const r = await fetch(`${BASE}/review/queue/`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

export interface MediaResult {
  status: string; draft_id: number; draft: string;
  gap_flagged: boolean; citations: Citation[]; note: string;
}

export const askMedia = (question: string, email: string, organisation: string, media_kind: string): Promise<MediaResult> =>
  post("/media-query/", { question, email, organisation, media_kind });

export interface Draft {
  id: number; query: number; question: string; contact_email: string; organisation: string;
  draft_text: string; final_text: string; status: string;
  reviewed_by: number | null; reviewed_at: string | null; created_at: string;
}

export interface Stats { 
    pending: number; 
    approved: number; 
    rejected: number; 
    sources: number; 
    queries: number; 
}

export async function getStats(): Promise<Stats> {
  const r = await fetch(`${BASE}/stats/`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

export interface AuditEntry {
  id: number; action: string; actor: string;
  object_type: string; object_id: number | null;
  metadata: Record<string, unknown>; timestamp: string;
}

export async function getAudit(): Promise<AuditEntry[]> {
  const r = await fetch(`${BASE}/audit/`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

export interface Draft {
  id: number; query: number; question: string; contact_email: string; organisation: string;
  draft_text: string; final_text: string; reject_reason: string; status: string;
  reviewed_by: number | null; reviewed_at: string | null; created_at: string;
}

export const reviewAction = (
  id: number, action: "approve" | "reject", final_text?: string, reason?: string,
): Promise<Draft> => post(`/review/${id}/action/`, { action, final_text, reason }, true);


export interface MemoryItem {
  id: number; kind: string; kind_display: string; title: string;
  question: string; response_text: string; tags: string; created_at: string;
  similarity?: number;
}

export async function searchMemory(q: string, kind?: string): Promise<MemoryItem[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (kind) params.set("kind", kind);
  const r = await fetch(`${BASE}/memory/?${params.toString()}`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

export function createMemory(item: {
  kind: string; title: string; question: string; response_text: string; tags: string;
}): Promise<MemoryItem> {
  return post("/memory/", item, true);
}

export async function draftSuggestions(id: number): Promise<MemoryItem[]> {
  const r = await fetch(`${BASE}/review/${id}/suggestions/`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

export interface ComposeResult {
  kind: string; text: string; grounded: boolean; confidence: number;
  citations: Citation[]; suggestions: MemoryItem[];
}

export function composeDraft(instruction: string, kind: string): Promise<ComposeResult> {
  return post("/compose/", { instruction, kind }, true);
}

export interface SourceItem {
  id: number; title: string; publication_code: string; category: string;
  publication_date: string | null; source_url: string; status: string;
  chunk_count: number; created_at: string;
}

export async function getSources(): Promise<SourceItem[]> {
  const r = await fetch(`${BASE}/sources/`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

export function sourceAction(id: number, action: "approve" | "archive"): Promise<SourceItem> {
  return post(`/sources/${id}/action/`, { action }, true);
}

export async function translateText(text: string, language: string): Promise<string> {
  const r = await post("/translate/", { text, language });
  return (r as { text: string }).text;
}


