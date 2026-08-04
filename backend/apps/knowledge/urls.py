"""
URL routing for Enterprise RAG Knowledge Base API endpoints.
"""

from django.urls import path

from apps.knowledge.api.views import (
    KnowledgeChatView,
    KnowledgeDocumentDetailView,
    KnowledgeDocumentListView,
    KnowledgeDocumentStatusView,
    KnowledgeDocumentUploadView,
    KnowledgeSearchView,
)

app_name = "knowledge"

urlpatterns = [
    path("upload/", KnowledgeDocumentUploadView.as_view(), name="knowledge-upload"),
    path("", KnowledgeDocumentListView.as_view(), name="knowledge-list"),
    path(
        "<uuid:pk>/",
        KnowledgeDocumentDetailView.as_view(),
        name="knowledge-detail",
    ),
    path("search/", KnowledgeSearchView.as_view(), name="knowledge-search"),
    path("chat/", KnowledgeChatView.as_view(), name="knowledge-chat"),
    path(
        "status/<uuid:pk>/",
        KnowledgeDocumentStatusView.as_view(),
        name="knowledge-status",
    ),
]
