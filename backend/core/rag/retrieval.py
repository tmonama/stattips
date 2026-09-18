from pgvector.django import CosineDistance
from core.models import Chunk, Source, ApprovedResponse
from core.rag.embeddings import embed


def retrieve(question, k=8):
    qv = embed(question)
    qs = (
        Chunk.objects.filter(source__status=Source.Status.APPROVED)
        .annotate(distance=CosineDistance("embedding", qv))
        .order_by("distance")[:k]
    )
    return [{"chunk": c, "similarity": 1.0 - float(c.distance)} for c in qs]


def find_reuse(question, threshold=0.85):
    qv = embed(question)
    match = (
        ApprovedResponse.objects
        .annotate(distance=CosineDistance("embedding", qv))
        .order_by("distance")
        .first()
    )
    if match and (1.0 - float(match.distance)) >= threshold:
        return match
    return None


def search_memory(query, kind=None, k=10, threshold=0.0):
    qv = embed(query)
    qs = ApprovedResponse.objects.all()
    if kind:
        qs = qs.filter(kind=kind)
    qs = qs.annotate(distance=CosineDistance("embedding", qv)).order_by("distance")[:k]
    out = []
    for r in qs:
        sim = 1.0 - float(r.distance)
        if sim >= threshold:
            out.append({"item": r, "similarity": sim})
    return out