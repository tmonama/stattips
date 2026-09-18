from django.contrib import admin
from django.utils import timezone
from core.models import (
    Profile, Source, Chunk, Query, Draft, ApprovedResponse, AuditLog,
)


@admin.action(description="Approve selected sources")
def approve_sources(modeladmin, request, queryset):
    queryset.update(status=Source.Status.APPROVED,
                    approved_by=request.user, approved_at=timezone.now())


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ["title", "publication_code", "status", "publication_date", "created_at"]
    list_filter = ["status", "category"]
    search_fields = ["title", "publication_code"]
    actions = [approve_sources]


@admin.register(Chunk)
class ChunkAdmin(admin.ModelAdmin):
    list_display = ["source", "page_number", "chunk_index", "token_count"]
    list_filter = ["source"]
    search_fields = ["text"]


@admin.register(Query)
class QueryAdmin(admin.ModelAdmin):
    list_display = ["question", "query_type", "status", "confidence", "created_at"]
    list_filter = ["query_type", "status"]
    search_fields = ["question"]


@admin.register(Draft)
class DraftAdmin(admin.ModelAdmin):
    list_display = ["id", "query", "status", "reviewed_by", "reviewed_at", "created_at"]
    list_filter = ["status"]


@admin.register(ApprovedResponse)
class ApprovedResponseAdmin(admin.ModelAdmin):
    list_display = ["title", "kind", "question", "approved_by", "created_at"]
    list_filter = ["kind"]
    search_fields = ["question", "response_text"]


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "actor", "object_type", "object_id", "timestamp"]
    list_filter = ["action"]
    readonly_fields = ["actor", "action", "object_type", "object_id", "metadata", "timestamp"]


admin.site.register(Profile)