from rest_framework import serializers
from core.models import Draft, ApprovedResponse, Source


class DraftSerializer(serializers.ModelSerializer):
    question = serializers.CharField(source="query.question", read_only=True)
    media_kind = serializers.CharField(source="query.media_kind", read_only=True)
    contact_email = serializers.EmailField(source="query.contact_email", read_only=True)
    organisation = serializers.CharField(source="query.organisation", read_only=True)

    class Meta:
        model = Draft
        fields = ["id", "query", "question", "media_kind", "contact_email", "organisation",
                  "draft_text", "final_text", "reject_reason", "status",
                  "reviewed_by", "reviewed_at", "created_at"]


class MemorySerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = ApprovedResponse
        fields = ["id", "kind", "kind_display", "title", "question",
                  "response_text", "tags", "created_at"]

class SourceSerializer(serializers.ModelSerializer):
    chunk_count = serializers.IntegerField(source="chunks.count", read_only=True)

    class Meta:
        model = Source
        fields = ["id", "title", "publication_code", "category", "publication_date",
                  "source_url", "status", "chunk_count", "created_at"]