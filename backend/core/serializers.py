from rest_framework import serializers
from core.models import Draft


class DraftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Draft
        fields = ["id", "query", "draft_text", "final_text", "status",
                  "reviewed_by", "reviewed_at", "created_at"]