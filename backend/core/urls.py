from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from core import views

urlpatterns = [
    path("public-query/", views.public_query),
    path("media-query/", views.media_query),
    path("review/queue/", views.ReviewQueue.as_view()),
    path("review/<int:pk>/action/", views.ReviewAction.as_view()),
    path("review/<int:pk>/suggestions/", views.DraftSuggestions.as_view()),
    path("compose/", views.Compose.as_view()),
    path("memory/", views.MemoryList.as_view()),
    path("stats/", views.Stats.as_view()),
    path("audit/", views.AuditTrail.as_view()),
    path("sources/", views.SourceList.as_view()),
    path("sources/<int:pk>/action/", views.SourceAction.as_view()),
    path("translate/", views.translate),
    path("auth/token/", obtain_auth_token),
]