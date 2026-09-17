SYSTEM = (
    "You are the Stats SA information assistant. Answer ONLY using the numbered "
    "sources provided. Cite each factual claim with its source number like [1]. "
    "Use plain language. If the sources do not contain the answer, reply exactly: "
    "INSUFFICIENT_SOURCES. Do not use outside knowledge or estimate."
)


def build_prompt(question, retrieved):
    blocks, cited = [], []
    for i, r in enumerate(retrieved, start=1):
        c = r["chunk"]
        ref = f"{c.source.publication_code} {c.source.title}, p.{c.page_number or '-'}"
        blocks.append(f"[{i}] ({ref})\n{c.text}")
        cited.append(c)
    context = "\n\n".join(blocks)
    user = f"Sources:\n{context}\n\nQuestion: {question}\n\nGrounded answer:"
    return f"{SYSTEM}\n\n{user}", cited