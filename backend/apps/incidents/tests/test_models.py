import uuid

import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import Organization, Role
from apps.incidents.models import (
    Attachment,
    Category,
    Comment,
    EventType,
    Incident,
    IncidentEvent,
    Severity,
    Status,
)

User = get_user_model()


@pytest.fixture
def sample_org(db):
    return Organization.objects.create(name="Security Org", slug="security-org")


@pytest.fixture
def sample_user(db, sample_org):
    return User.objects.create_user(
        email="analyst@security.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=sample_org,
    )


@pytest.mark.django_db
class TestIncidentModels:
    def test_incident_creation_and_defaults(self, sample_org, sample_user):
        incident = Incident.objects.create(
            organization=sample_org,
            title="Database Latency Spike",
            description="High memory usage on DB cluster.",
            severity=Severity.HIGH,
            created_by=sample_user,
        )
        assert isinstance(incident.id, uuid.UUID)
        assert incident.status == Status.OPEN
        assert incident.category == Category.OTHER
        assert incident.is_resolved is False
        assert incident.is_closed is False
        assert str(incident) == f"[{Severity.HIGH}] Database Latency Spike ({Status.OPEN})"

    def test_incident_status_properties(self, sample_org, sample_user):
        incident = Incident.objects.create(
            organization=sample_org,
            title="API Outage",
            severity=Severity.CRITICAL,
            status=Status.RESOLVED,
            created_by=sample_user,
        )
        assert incident.is_resolved is True
        assert incident.is_closed is False

        incident.status = Status.CLOSED
        incident.save()
        assert incident.is_closed is True

    def test_incident_event_creation(self, sample_org, sample_user):
        incident = Incident.objects.create(
            organization=sample_org,
            title="Suspicious Login",
            created_by=sample_user,
        )
        event = IncidentEvent.objects.create(
            incident=incident,
            user=sample_user,
            event_type=EventType.CREATED,
            message="Incident created.",
            metadata={"source": "SIEM"},
        )
        assert isinstance(event.id, uuid.UUID)
        assert event.incident == incident
        assert event.event_type == EventType.CREATED
        assert "Suspicious Login" in str(event)

    def test_comment_creation(self, sample_org, sample_user):
        incident = Incident.objects.create(
            organization=sample_org,
            title="Network Switch Failure",
            created_by=sample_user,
        )
        comment = Comment.objects.create(
            incident=incident,
            author=sample_user,
            message="Rebooting core switch in Rack 4.",
        )
        assert isinstance(comment.id, uuid.UUID)
        assert comment.incident == incident
        assert comment.author == sample_user
        assert str(comment) == f"Comment by {sample_user.email} on Network Switch Failure"

    def test_attachment_creation(self, sample_org, sample_user):
        incident = Incident.objects.create(
            organization=sample_org,
            title="Malware Alert",
            created_by=sample_user,
        )
        attachment = Attachment.objects.create(
            incident=incident,
            uploaded_by=sample_user,
            filename="dump.log",
        )
        assert isinstance(attachment.id, uuid.UUID)
        assert attachment.filename == "dump.log"
        assert "dump.log" in str(attachment)
