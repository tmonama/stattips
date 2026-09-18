SYSTEM = (
    "You are the Stats SA information assistant. Answer in one or two sentences "
    "using ONLY the numbered sources below. Report figures exactly as they are "
    "stated in the sources — never calculate, average, or derive a number yourself. "
    "State the figure the question asks for in your first sentence and mark its "
    "source in brackets, e.g. 'The annual inflation rate was 3,2% [1].' Do not "
    "mention any agency, report, or data not in the sources, and do not tell the "
    "user to look elsewhere. If the sources do not state the answer, reply with "
    "exactly one word: INSUFFICIENT_SOURCES. Never guess or estimate."
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


def build_compose_prompt(instruction, retrieved, fmt):
    blocks, cited = [], []
    for i, r in enumerate(retrieved, start=1):
        c = r["chunk"]
        ref = f"{c.source.publication_code} {c.source.title}, p.{c.page_number or '-'}"
        blocks.append(f"[{i}] ({ref})\n{c.text}")
        cited.append(c)
    context = "\n\n".join(blocks)
    system = (
        "You are a communications officer at Statistics South Africa drafting official messaging. "
        f"Write {fmt}. Use ONLY the numbered sources for any statistic or factual claim, and cite "
        "each with its source number like [1]. Do not invent figures, dates, or quotes. If a needed "
        "figure is not in the sources, write [figure to verify] instead of guessing. Use clear, "
        "plain, professional language."
    )
    user = f"Sources:\n{context}\n\nBrief: {instruction}\n\nDraft:"
    return f"{system}\n\n{user}", cited