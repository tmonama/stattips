from django.conf import settings
import re
import os
from core.models import Query, Draft, AuditLog
from core.rag.retrieval import retrieve, find_reuse
from core.rag.prompt import build_prompt, build_compose_prompt
from core.llm.factory import get_provider
from core.notifications import send_email, confirmation_email_html
import requests as _rq

REFUSAL = "INSUFFICIENT_SOURCES"
CITE_THRESHOLD = 0.5

COMPOSE_FORMATS = {
    "press_release": "a concise official press release with a short headline and two or three brief paragraphs",
    "statement": "a short official statement of one or two paragraphs",
    "faq": "a clear FAQ answer in plain language",
    "media_response": "a direct, quotable media response for a journalist",
    "other": "a short official communication",
}

LANG_NAMES = {"en": "English", "af": "Afrikaans", "zu": "isiZulu", "xh": "isiXhosa"}

def _u(user):
    return user if getattr(user, "is_authenticated", False) else None


def log(actor, action, obj=None, **meta):
    AuditLog.objects.create(
        actor=_u(actor), action=action,
        object_type=obj.__class__.__name__ if obj else "",
        object_id=getattr(obj, "id", None), metadata=meta,
    )

def _used_citations(raw, chunks):
    nums = sorted({int(n) for n in re.findall(r"\[(\d+)\]", raw)})
    used = [chunks[n - 1] for n in nums if 1 <= n <= len(chunks)]
    return used or chunks[:1]


def _citations(chunks):
    return [{"n": i + 1, "code": c.source.publication_code, "title": c.source.title,
             "page": c.page_number, "url": c.source.source_url}
            for i, c in enumerate(chunks)]


def _reuse_payload(match):
    if not match:
        return None
    return {"id": match.id, "question": match.question, "response": match.response_text}


def answer_public(question, user=None, lang="en"):
    candidates = [question]
    if lang and lang != "en":
        try:
            candidates.append(translate_query_for_search(question, source=lang))
        except Exception:
            pass
    best = max((retrieve(c) for c in candidates),
               key=lambda rs: rs[0]["similarity"] if rs else 0)
    retrieved = best
    reuse = find_reuse(candidates[-1])
    strong = [r for r in retrieved if r["similarity"] >= CITE_THRESHOLD][:3] or retrieved[:3]
    top = retrieved[0]["similarity"] if retrieved else 0.0

    search_q = candidates[-1]

    if not retrieved or top < settings.CONFIDENCE_THRESHOLD:
        Query.objects.create(user=_u(user), question=question,
                             query_type=Query.Type.PUBLIC, confidence=top,
                             status=Query.Status.REFUSED)
        return {"status": "refused", "confidence": top,
                "message": "No approved Stats SA source covers this question.",
                "reuse": _reuse_payload(reuse)}

    prompt, cited = build_prompt(search_q, strong)
    raw = get_provider().generate(prompt)

    if REFUSAL in raw:
        Query.objects.create(user=_u(user), question=question,
                             query_type=Query.Type.PUBLIC, confidence=top,
                             status=Query.Status.REFUSED)
        return {"status": "refused", "confidence": top,
                "message": "The approved sources do not answer this.",
                "reuse": _reuse_payload(reuse)}

    Query.objects.create(user=_u(user), question=question,
                         query_type=Query.Type.PUBLIC, confidence=top,
                         status=Query.Status.ANSWERED, answer_text=raw)
    return {"status": "answered", "confidence": top, "answer": raw,
            "citations": _citations(_used_citations(raw, cited)),
            "reuse": _reuse_payload(reuse)}


def submit_media(question, email="", org="", media_kind="media_response", user=None):
    retrieved = retrieve(question)
    strong = [r for r in retrieved if r["similarity"] >= CITE_THRESHOLD][:3] or retrieved[:3]
    top = retrieved[0]["similarity"] if retrieved else 0.0
    q = Query.objects.create(user=_u(user), question=question,
                             query_type=Query.Type.MEDIA, confidence=top,
                             status=Query.Status.ESCALATED,
                             contact_email=email, organisation=org)
    cited = []
    if retrieved and top >= settings.CONFIDENCE_THRESHOLD:
        prompt, built = build_prompt(question, strong)
        raw = get_provider().generate(prompt)
        if REFUSAL in raw:
            draft_text, gap = "", True
        else:
            draft_text, cited, gap = raw, _used_citations(raw, built), False
    else:
        draft_text, gap = "", True
    draft = Draft.objects.create(query=q, draft_text=draft_text)
    if cited:
        draft.cited_chunks.set(cited)
    log(user, "draft.created", draft, query_id=q.id, gap_flagged=gap, email=email)
    send_email(
        email,
        "Your enquiry to Stats SA has been received",
        f"Thank you for your enquiry:\n\n\"{question}\"\n\n"
        "A communications official will review a source-checked response and reply to you "
        "directly. Media responses are reviewed by a human before release.\n\n"
        "— StatTips (prototype)",
        html=confirmation_email_html(question),
    )
    return {"status": "escalated", "draft_id": draft.id, "draft": draft_text,
            "gap_flagged": gap, "citations": _citations(cited),
            "note": "Draft only — requires Stats SA approval before release."}


def create_memory_item(kind, title, question, response_text, tags, user):
    from core.models import ApprovedResponse
    from core.rag.embeddings import embed
    topic = " ".join(t for t in [title, question, response_text[:300]] if t).strip()
    item = ApprovedResponse.objects.create(
        kind=kind or "other", title=title, question=question,
        response_text=response_text, tags=tags,
        embedding=embed(topic or response_text[:300]), approved_by=_u(user),
    )
    log(user, "memory.created", item, kind=kind)
    return item

def compose_draft(instruction, kind="press_release", user=None):
    retrieved = retrieve(instruction)
    strong = [r for r in retrieved if r["similarity"] >= CITE_THRESHOLD][:4] or retrieved[:4]
    top = retrieved[0]["similarity"] if retrieved else 0.0
    fmt = COMPOSE_FORMATS.get(kind, COMPOSE_FORMATS["other"])
    prompt, cited = build_compose_prompt(instruction, strong, fmt)
    text = get_provider().generate(prompt, max_tokens=700)
    grounded = bool(strong) and top >= settings.CONFIDENCE_THRESHOLD
    log(user, "compose.generated", None, kind=kind, grounded=grounded)
    return {
        "kind": kind, "text": text, "grounded": grounded,
        "confidence": top, "citations": _citations(_used_citations(text, cited)),
    }

def translate_text(text, target, source="en"):
    if not text.strip() or target == source:
        return text
    if os.environ.get("TRANSLATOR_ENABLED") == "1":
        try:
            r = _rq.post(
                f'{os.environ.get("TRANSLATOR_URL", "http://127.0.0.1:5001")}/translate',
                json={"text": text, "source": source, "target": target},
                timeout=30,
            )
            r.raise_for_status()
            return r.json()["text"]
        except Exception as e:
            print(f"[translate] NLLB unavailable, falling back to original: {e}")
    return text


def translate_query_for_search(question, source):
    """Translate a question to English with a domain hint, then strip the hint.
    Used ONLY to build the retrieval query — never shown to the user."""
    if source == "en":
        return question
    hinted = f"This is a question about official statistics: {question}"
    out = translate_text(hinted, "en", source=source)
    # strip the hint prefix if NLLB carried it through
    for marker in ["official statistics:", "statistics:", "question:"]:
        idx = out.lower().find(marker)
        if idx != -1:
            return out[idx + len(marker):].strip()
    return out