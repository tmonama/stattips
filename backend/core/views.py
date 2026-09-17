from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from core import services
from core.models import Draft, ApprovedResponse
from core.permissions import IsCommsOfficial
from core.serializers import DraftSerializer
from core.rag.embeddings import embed


@api_view(["POST"])
@permission_classes([AllowAny])
def public_query(request):
    q = (request.data.get("question") or "").strip()
    if not q:
        return Response({"error": "question required"}, status=400)
    return Response(services.answer_public(q, request.user))


@api_view(["POST"])
@permission_classes([AllowAny])
def media_query(request):
    q = (request.data.get("question") or "").strip()
    if not q:
        return Response({"error": "question required"}, status=400)
    return Response(services.submit_media(q, request.user))


class ReviewQueue(APIView):
    permission_classes = [IsCommsOfficial]

    def get(self, request):
        drafts = Draft.objects.filter(status=Draft.Status.PENDING).order_by("created_at")
        return Response(DraftSerializer(drafts, many=True).data)


class ReviewAction(APIView):
    permission_classes = [IsCommsOfficial]

    def post(self, request, pk):
        action = request.data.get("action")
        draft = Draft.objects.get(pk=pk)
        draft.final_text = request.data.get("final_text", draft.draft_text)
        draft.status = (Draft.Status.APPROVED if action == "approve"
                        else Draft.Status.REJECTED)
        draft.reviewed_by = request.user
        draft.reviewed_at = timezone.now()
        draft.save()
        services.log(request.user, f"draft.{action}", draft)
        if action == "approve":
            ApprovedResponse.objects.create(
                question=draft.query.question, response_text=draft.final_text,
                embedding=embed(draft.query.question), source_draft=draft,
                approved_by=request.user,
            )
        return Response(DraftSerializer(draft).data)