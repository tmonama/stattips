from pgvector.django import CosineDistance
from core.models import Chunk, Source, ApprovedResponse
from core.rag.embeddings import embed


def retrieve(question, k=6):
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