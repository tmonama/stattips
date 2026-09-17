import os
from functools import lru_cache
from sentence_transformers import SentenceTransformer

MODEL_NAME = os.environ.get("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")


@lru_cache(maxsize=1)
def _model():
    return SentenceTransformer(MODEL_NAME)


def embed(text):
    return _model().encode(text, normalize_embeddings=True).tolist()


def embed_many(texts):
    return [v.tolist() for v in _model().encode(texts, normalize_embeddings=True)]