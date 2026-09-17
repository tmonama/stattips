from django.conf import settings
from django.db import models
from pgvector.django import VectorField, HnswIndex

EMBED_DIM = 384


class Profile(models.Model):
    class Role(models.TextChoices):
        PUBLIC = "public"
        COMMS = "comms_official"
        ADMIN = "admin"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PUBLIC)


class Source(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending"
        APPROVED = "approved"
        ARCHIVED = "archived"

    title = models.CharField(max_length=255)
    publication_code = models.CharField(max_length=32, blank=True)
    category = models.CharField(max_length=64, blank=True)
    publication_date = models.DateField(null=True, blank=True)
    source_url = models.URLField(blank=True)
    file_key = models.CharField(max_length=512, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="uploaded_sources")
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="approved_sources")
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Chunk(models.Model):
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name="chunks")
    text = models.TextField()
    page_number = models.IntegerField(null=True, blank=True)
    chunk_index = models.IntegerField(default=0)
    token_count = models.IntegerField(default=0)
    embedding = VectorField(dimensions=EMBED_DIM)

    class Meta:
        indexes = [
            HnswIndex(name="chunk_embedding_hnsw", fields=["embedding"],
                      m=16, ef_construction=64, opclasses=["vector_cosine_ops"]),
        ]


class Query(models.Model):
    class Type(models.TextChoices):
        PUBLIC = "public"
        MEDIA = "media"

    class Status(models.TextChoices):
        ANSWERED = "answered"
        ESCALATED = "escalated"
        REFUSED = "refused"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    question = models.TextField()
    query_type = models.CharField(max_length=16, choices=Type.choices, default=Type.PUBLIC)
    confidence = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices)
    answer_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Draft(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending"
        APPROVED = "approved"
        REJECTED = "rejected"

    query = models.ForeignKey(Query, on_delete=models.CASCADE, related_name="drafts")
    draft_text = models.TextField()
    cited_chunks = models.ManyToManyField(Chunk, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="assigned_drafts")
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="reviewed_drafts")
    final_text = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ApprovedResponse(models.Model):
    question = models.TextField()
    response_text = models.TextField()
    embedding = VectorField(dimensions=EMBED_DIM)
    source_draft = models.ForeignKey(Draft, null=True, blank=True, on_delete=models.SET_NULL)
    tags = models.CharField(max_length=255, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            HnswIndex(name="approved_embedding_hnsw", fields=["embedding"],
                      m=16, ef_construction=64, opclasses=["vector_cosine_ops"]),
        ]


class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=64)
    object_type = models.CharField(max_length=64, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]