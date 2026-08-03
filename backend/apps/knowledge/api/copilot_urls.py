"""
URL routing for Enterprise AI Copilot session and message API endpoints.
"""

from django.urls import path

from apps.knowledge.api.copilot_views import (
    ChatMessageListView,
    ChatSessionDetailView,
    ChatSessionListCreateView,
    CopilotChatView,
    CopilotStreamView,
)

app_name = "copilot"

urlpatterns = [
    path(
        "sessions/",
        ChatSessionListCreateView.as_view(),
        name="session-list-create",
    ),
    path(
        "sessions/<uuid:id>/",
        ChatSessionDetailView.as_view(),
        name="session-detail",
    ),
    path(
        "sessions/<uuid:id>/messages/",
        ChatMessageListView.as_view(),
        name="session-messages",
    ),
    path("chat/", CopilotChatView.as_view(), name="copilot-chat"),
    path("stream/", CopilotStreamView.as_view(), name="copilot-stream"),
]
