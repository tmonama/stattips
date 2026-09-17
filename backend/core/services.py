from django.conf import settings
from core.models import Query, Draft, AuditLog
from core.rag.retrieval import retrieve, find_reuse
from core.rag.prompt import build_prompt
from core.llm.factory import get_provider

REFUSAL = "INSUFFICIENT_SOURCES"


def _u(user):
    return user if getattr(user, "is_authenticated", False) else None


def log(actor, action, obj=None, **meta):
    AuditLog.objects.create(
        actor=_u(actor), action=action,
        object_type=obj.__class__.__name__ if obj else "",
        object_id=getattr(obj, "id", None), metadata=meta,
    )


def _citations(chunks):
    return [{"n": i + 1, "code": c.source.publication_code, "title": c.source.title,
             "page": c.page_number, "url": c.source.source_url}
            for i, c in enumerate(chunks)]


def _reuse_payload(match):
    if not match:
        return None
    return {"id": match.id, "question": match.question, "response": match.response_text}


def answer_public(question, user=None):
    reuse = find_reuse(question)
    retrieved = retrieve(question)
    top = retrieved[0]["similarity"] if retrieved else 0.0

    if not retrieved or top < settings.CONFIDENCE_THRESHOLD:
        Query.objects.create(user=_u(user), question=question,
                             query_type=Query.Type.PUBLIC, confidence=top,
                             status=Query.Status.REFUSED)
        return {"status": "refused", "confidence": top,
                "message": "No approved Stats SA source covers this question.",
                "reuse": _reuse_payload(reuse)}

    prompt, cited = build_prompt(question, retrieved)
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
            "citations": _citations(cited), "reuse": _reuse_payload(reuse)}


def submit_media(question, user=None):
    retrieved = retrieve(question)
    top = retrieved[0]["similarity"] if retrieved else 0.0
    q = Query.objects.create(user=_u(user), question=question,
                             query_type=Query.Type.MEDIA, confidence=top,
                             status=Query.Status.ESCALATED)
    if retrieved and top >= settings.CONFIDENCE_THRESHOLD:
        prompt, cited = build_prompt(question, retrieved)
        draft_text = get_provider().generate(prompt)
    else:
        draft_text, cited = "", []
    draft = Draft.objects.create(query=q, draft_text=draft_text)
    if cited:
        draft.cited_chunks.set(cited)
    log(user, "draft.created", draft, query_id=q.id)
    return {"status": "escalated", "draft_id": draft.id, "draft": draft_text,
            "citations": _citations(cited),
            "note": "Draft only — requires Stats SA approval before release."}