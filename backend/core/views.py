from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from core import services
from core.models import Draft, ApprovedResponse, Query, Source, AuditLog, ApprovedResponse, Source
from core.permissions import IsCommsOfficial
from core.serializers import DraftSerializer, MemorySerializer, SourceSerializer
from core.rag.embeddings import embed
from core.notifications import send_email, response_email_html, rejection_email_html
from core.rag.retrieval import search_memory


@api_view(["POST"])
@permission_classes([AllowAny])
def public_query(request):
    q = (request.data.get("question") or "").strip()
    lang = (request.data.get("lang") or "en").strip()
    if not q:
        return Response({"error": "question required"}, status=400)
    return Response(services.answer_public(q, request.user, lang))


@api_view(["POST"])
@permission_classes([AllowAny])
def media_query(request):
    q = (request.data.get("question") or "").strip()
    kind = (request.data.get("media_kind") or "media_response").strip()
    email = (request.data.get("email") or "").strip()
    org = (request.data.get("organisation") or "").strip()
    if not q:
        return Response({"error": "question required"}, status=400)
    if not email:
        return Response({"error": "email required"}, status=400)
    return Response(services.submit_media(q, email, org, kind, request.user))


@api_view(["POST"])
@permission_classes([AllowAny])
def translate(request):
    text = (request.data.get("text") or "").strip()
    language = (request.data.get("language") or "").strip()
    if not text:
        return Response({"error": "text required"}, status=400)
    return Response({"text": services.translate_text(text, language)})


class ReviewQueue(APIView):
    permission_classes = [IsCommsOfficial]

    def get(self, request):
        drafts = Draft.objects.select_related("query").order_by("-created_at")
        return Response(DraftSerializer(drafts, many=True).data)


class ReviewAction(APIView):
    permission_classes = [IsCommsOfficial]

    def post(self, request, pk):
        action = request.data.get("action")
        reason = (request.data.get("reason") or "").strip()
        draft = Draft.objects.get(pk=pk)
        draft.final_text = request.data.get("final_text") or draft.draft_text
        if action == "approve":
            draft.status = Draft.Status.APPROVED
        else:
            draft.status = Draft.Status.REJECTED
            draft.reject_reason = reason
        draft.reviewed_by = request.user
        draft.reviewed_at = timezone.now()
        draft.save()
        services.log(request.user, f"draft.{action}", draft,
                     reason=reason if action == "reject" else "")
        if action == "approve":
            from core.models import ApprovedResponse
            from core.rag.embeddings import embed
            ApprovedResponse.objects.create(
                question=draft.query.question, response_text=draft.final_text,
                embedding=embed(draft.query.question), source_draft=draft,
                approved_by=request.user,
            )
            send_email(
                draft.query.contact_email,
                "Response to your enquiry from Stats SA",
                f"Regarding your enquiry:\n\n\"{draft.query.question}\"\n\n"
                f"{draft.final_text}\n\n— StatTips (prototype)",
                html=response_email_html(draft.query.question, draft.final_text),
            )
        else:
            send_email(
                draft.query.contact_email,
                "Update on your enquiry to Stats SA",
                f"Regarding your enquiry:\n\n\"{draft.query.question}\"\n\n"
                "After review, we're unable to provide an official response at this time.\n"
                f"Reason: {reason}\n\n"
                "You're welcome to rephrase your enquiry or contact the media desk directly.\n\n"
                "— StatTips (prototype)",
                html=rejection_email_html(draft.query.question, reason),
            )
        return Response(DraftSerializer(draft).data)

class Stats(APIView):
    permission_classes = [IsCommsOfficial]

    def get(self, request):
        d = Draft.objects
        return Response({
            "pending": d.filter(status=Draft.Status.PENDING).count(),
            "approved": d.filter(status=Draft.Status.APPROVED).count(),
            "rejected": d.filter(status=Draft.Status.REJECTED).count(),
            "sources": Source.objects.filter(status=Source.Status.APPROVED).count(),
            "queries": Query.objects.count(),
        })


class AuditTrail(APIView):
    permission_classes = [IsCommsOfficial]

    def get(self, request):
        logs = AuditLog.objects.select_related("actor")[:200]
        return Response([{
            "id": l.id,
            "action": l.action,
            "actor": l.actor.username if l.actor else "system",
            "object_type": l.object_type,
            "object_id": l.object_id,
            "metadata": l.metadata,
            "timestamp": l.timestamp.isoformat(),
        } for l in logs])


class MemoryList(APIView):
    permission_classes = [IsCommsOfficial]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        kind = (request.query_params.get("kind") or "").strip() or None
        if q:
            data = []
            for r in search_memory(q, kind=kind, k=20):
                row = MemorySerializer(r["item"]).data
                row["similarity"] = round(r["similarity"], 3)
                data.append(row)
            return Response(data)
        qs = ApprovedResponse.objects.all()
        if kind:
            qs = qs.filter(kind=kind)
        return Response(MemorySerializer(qs.order_by("-created_at")[:100], many=True).data)

    def post(self, request):
        rt = (request.data.get("response_text") or "").strip()
        if not rt:
            return Response({"error": "response_text required"}, status=400)
        item = services.create_memory_item(
            kind=request.data.get("kind", "other"),
            title=(request.data.get("title") or "").strip(),
            question=(request.data.get("question") or "").strip(),
            response_text=rt,
            tags=(request.data.get("tags") or "").strip(),
            user=request.user,
        )
        return Response(MemorySerializer(item).data, status=201)


class DraftSuggestions(APIView):
    permission_classes = [IsCommsOfficial]

    def get(self, request, pk):
        draft = Draft.objects.select_related("query").get(pk=pk)
        data = []
        for r in search_memory(draft.query.question, k=4, threshold=0.6):
            if r["item"].source_draft_id == draft.id:
                continue
            row = MemorySerializer(r["item"]).data
            row["similarity"] = round(r["similarity"], 3)
            data.append(row)
        return Response(data[:2])

class Compose(APIView):
    permission_classes = [IsCommsOfficial]

    def post(self, request):
        instruction = (request.data.get("instruction") or "").strip()
        kind = (request.data.get("kind") or "press_release").strip()
        if not instruction:
            return Response({"error": "instruction required"}, status=400)
        result = services.compose_draft(instruction, kind=kind, user=request.user)
        sugg = []
        for r in search_memory(instruction, k=3, threshold=0.6):
            row = MemorySerializer(r["item"]).data
            row["similarity"] = round(r["similarity"], 3)
            sugg.append(row)
        result["suggestions"] = sugg
        return Response(result)

class SourceList(APIView):
    permission_classes = [IsCommsOfficial]

    def get(self, request):
        qs = Source.objects.order_by("-created_at")
        return Response(SourceSerializer(qs, many=True).data)


class SourceAction(APIView):
    permission_classes = [IsCommsOfficial]

    def post(self, request, pk):
        source = Source.objects.get(pk=pk)
        action = request.data.get("action")
        if action == "approve":
            source.status = Source.Status.APPROVED
            source.approved_by = request.user
            source.approved_at = timezone.now()
        elif action == "archive":
            source.status = Source.Status.ARCHIVED
        source.save()
        services.log(request.user, f"source.{action}", source)
        return Response(SourceSerializer(source).data)