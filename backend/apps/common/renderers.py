"""
Custom Django REST Framework renderers for specialized media types.
"""

from rest_framework.renderers import BaseRenderer


class ServerSentEventRenderer(BaseRenderer):
    """
    Custom DRF renderer for Server-Sent Events (SSE) streaming.
    Allows DRF content negotiation to satisfy requests with `Accept: text/event-stream`.
    """

    media_type = "text/event-stream"
    format = "event-stream"
    charset = None

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is None:
            return ""
        if isinstance(data, bytes):
            return data
        if isinstance(data, str):
            return data.encode(self.charset or "utf-8")
        return str(data).encode(self.charset or "utf-8")
