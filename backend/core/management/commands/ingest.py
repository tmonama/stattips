from datetime import date
from django.core.management.base import BaseCommand
from pypdf import PdfReader
from core.models import Source, Chunk
from core.rag.chunking import chunk_text
from core.rag.embeddings import embed_many


class Command(BaseCommand):
    help = "Ingest a PDF into a Source with embedded chunks."

    def add_arguments(self, parser):
        parser.add_argument("pdf_path")
        parser.add_argument("--title", required=True)
        parser.add_argument("--code", default="")
        parser.add_argument("--url", default="")
        parser.add_argument("--approve", action="store_true")

    def handle(self, *args, **o):
        reader = PdfReader(o["pdf_path"])
        source = Source.objects.create(
            title=o["title"], publication_code=o["code"], source_url=o["url"],
            status=Source.Status.APPROVED if o["approve"] else Source.Status.PENDING,
            approved_at=date.today() if o["approve"] else None,
        )
        idx = 0
        for page_no, page in enumerate(reader.pages, start=1):
            chunks = chunk_text(page.extract_text() or "")
            if not chunks:
                continue
            vectors = embed_many(chunks)
            rows = []
            for t, v in zip(chunks, vectors):
                idx += 1
                rows.append(Chunk(source=source, text=t, page_number=page_no,
                                  chunk_index=idx, token_count=len(t) // 4, embedding=v))
            Chunk.objects.bulk_create(rows)
        self.stdout.write(self.style.SUCCESS(
            f"Ingested {source} with {source.chunks.count()} chunks."))