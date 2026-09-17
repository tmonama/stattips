from django.urls import path
from core import views

urlpatterns = [
    path("public-query/", views.public_query),
    path("media-query/", views.media_query),
    path("review/queue/", views.ReviewQueue.as_view()),
    path("review/<int:pk>/action/", views.ReviewAction.as_view()),
]