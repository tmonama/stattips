def chunk_text(text, target_chars=2400, overlap_chars=320):
    paragraphs = [p.strip() for p in text.splitlines() if p.strip()]
    chunks, buf = [], ""
    for p in paragraphs:
        candidate = (buf + " " + p).strip()
        if len(candidate) <= target_chars:
            buf = candidate
        else:
            if buf:
                chunks.append(buf)
            tail = buf[-overlap_chars:] if buf else ""
            buf = (tail + " " + p).strip()
    if buf:
        chunks.append(buf)
    return chunks