"""
DTO representing Server-Sent Events (SSE) streaming events for Enterprise AI Copilot.
"""

from dataclasses import dataclass, field
from typing import Any

from django.utils import timezone


@dataclass
class StreamEventDTO:
    """
    Generic DTO representing an event in Server-Sent Events (SSE) streaming.
    """

    event_id: int
    event_type: str
    payload: Any
    timestamp: str = field(default_factory=lambda: timezone.now().isoformat())
