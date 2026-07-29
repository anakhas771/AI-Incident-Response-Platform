import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import Organization, Role
from apps.incidents.models import EventType, Status
from apps.incidents.services import IncidentService

User = get_user_model()


@pytest.fixture
def sample_org(db):
    return Organization.objects.create(name="Cyber Ops", slug="cyber-ops")


@pytest.fixture
def creator(db, sample_org):
    return User.objects.create_user(
        email="creator@cyberops.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=sample_org,
    )


@pytest.fixture
def assignee(db, sample_org):
    return User.objects.create_user(
        email="responder@cyberops.com",
        password="Password123!",
        role=Role.RESPONDER,
        organization=sample_org,
    )


@pytest.mark.django_db
class TestIncidentService:
    def test_create_incident_service_logs_event(self, creator, sample_org):
        data = {
            "title": "Unauthorized Access Attempt",
            "description": "Brute force attack detected.",
            "severity": "HIGH",
            "category": "Security",
        }
        incident = IncidentService.create_incident(
            user=creator, organization=sample_org, data=data
        )

        assert incident.title == "Unauthorized Access Attempt"
        assert incident.events.count() == 1
        event = incident.events.first()
        assert event.event_type == EventType.CREATED
        assert event.user == creator

    def test_assign_incident_service_updates_and_logs(self, creator, assignee, sample_org):
        incident = IncidentService.create_incident(
            user=creator,
            organization=sample_org,
            data={"title": "Server Overload", "severity": "MEDIUM"},
        )

        updated_incident = IncidentService.assign_incident(
            incident=incident, assigned_to_user=assignee, performing_user=creator
        )

        assert updated_incident.assigned_to == assignee
        assert incident.events.count() == 2  # CREATED + ASSIGNED
        latest_event = incident.events.last()
        assert latest_event.event_type == EventType.ASSIGNED
        assert latest_event.metadata["assigned_to_id"] == str(assignee.id)

    def test_change_status_service_sets_resolved_at_timestamp(self, creator, sample_org):
        incident = IncidentService.create_incident(
            user=creator,
            organization=sample_org,
            data={"title": "DNS Failover Test", "severity": "LOW"},
        )
        assert incident.resolved_at is None

        updated_incident = IncidentService.change_status(
            incident=incident, new_status=Status.RESOLVED, performing_user=creator
        )

        assert updated_incident.status == Status.RESOLVED
        assert updated_incident.resolved_at is not None
        assert incident.events.filter(event_type=EventType.STATUS_CHANGED).exists()

    def test_change_status_service_sets_closed_at_timestamp(self, creator, sample_org):
        incident = IncidentService.create_incident(
            user=creator,
            organization=sample_org,
            data={"title": "Old Ticket", "severity": "LOW"},
        )

        updated_incident = IncidentService.change_status(
            incident=incident, new_status=Status.CLOSED, performing_user=creator
        )

        assert updated_incident.status == Status.CLOSED
        assert updated_incident.closed_at is not None
        assert updated_incident.resolved_at is not None

    def test_add_comment_service_creates_comment_and_event(self, creator, sample_org):
        incident = IncidentService.create_incident(
            user=creator,
            organization=sample_org,
            data={"title": "Phishing Email", "severity": "HIGH"},
        )

        comment = IncidentService.add_comment(
            incident=incident, author=creator, message="Identified malicious link."
        )

        assert comment.message == "Identified malicious link."
        assert incident.comments.count() == 1
        assert incident.events.filter(event_type=EventType.COMMENT_ADDED).exists()
