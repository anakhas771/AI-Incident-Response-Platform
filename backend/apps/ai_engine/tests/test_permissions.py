"""
Unit tests for AI Engine organization isolation and RBAC permission classes.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

from apps.accounts.models import Organization, Role
from apps.ai_engine.models import AIIncidentAnalysis
from apps.ai_engine.permissions import (
    CanTriggerAIAnalysis,
    IsAIIncidentOrganizationMember,
)
from apps.incidents.models import Incident, Severity

User = get_user_model()


@pytest.fixture
def org_alpha(db):
    return Organization.objects.create(name="Alpha Corp", slug="alpha-corp")


@pytest.fixture
def org_beta(db):
    return Organization.objects.create(name="Beta Corp", slug="beta-corp")


@pytest.fixture
def user_alpha(db, org_alpha):
    return User.objects.create_user(
        email="alpha@corp.com",
        password="Password123!",
        role=Role.RESPONDER,
        organization=org_alpha,
    )


@pytest.fixture
def user_beta(db, org_beta):
    return User.objects.create_user(
        email="beta@corp.com",
        password="Password123!",
        role=Role.RESPONDER,
        organization=org_beta,
    )


@pytest.fixture
def incident_alpha(db, org_alpha):
    return Incident.objects.create(
        organization=org_alpha,
        title="Alpha Incident",
        description="Alpha issue description",
        severity=Severity.HIGH,
    )


@pytest.fixture
def analysis_alpha(db, incident_alpha):
    return AIIncidentAnalysis.objects.create(
        incident=incident_alpha,
        summary="Alpha summary",
        risk_score=75.0,
    )


@pytest.mark.django_db
class TestAIIncidentOrganizationMemberPermission:
    def test_has_object_permission_same_organization(
        self, user_alpha, incident_alpha, analysis_alpha
    ):
        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = user_alpha

        permission = IsAIIncidentOrganizationMember()
        assert permission.has_object_permission(request, None, incident_alpha) is True
        assert permission.has_object_permission(request, None, analysis_alpha) is True

    def test_has_object_permission_different_organization_denied(
        self, user_beta, incident_alpha, analysis_alpha
    ):
        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = user_beta

        permission = IsAIIncidentOrganizationMember()
        assert permission.has_object_permission(request, None, incident_alpha) is False
        assert permission.has_object_permission(request, None, analysis_alpha) is False

    def test_unauthenticated_user_denied(self, incident_alpha):
        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = None

        permission = IsAIIncidentOrganizationMember()
        assert permission.has_object_permission(request, None, incident_alpha) is False


@pytest.mark.django_db
class TestCanTriggerAIAnalysisPermission:
    @pytest.fixture
    def user_viewer(self, db, org_alpha):
        return User.objects.create_user(
            email="viewer@corp.com",
            password="Password123!",
            role=Role.VIEWER,
            organization=org_alpha,
        )

    @pytest.fixture
    def user_analyst(self, db, org_alpha):
        return User.objects.create_user(
            email="analyst@corp.com",
            password="Password123!",
            role=Role.ANALYST,
            organization=org_alpha,
        )

    def test_viewer_role_denied_on_post(self, user_viewer):
        factory = APIRequestFactory()
        request = factory.post("/api/v1/ai/analyze/")
        request.user = user_viewer

        permission = CanTriggerAIAnalysis()
        assert permission.has_permission(request, None) is False

    def test_viewer_role_allowed_on_get(self, user_viewer):
        factory = APIRequestFactory()
        request = factory.get("/api/v1/ai/incidents/1/analysis/")
        request.user = user_viewer

        permission = CanTriggerAIAnalysis()
        assert permission.has_permission(request, None) is True

    def test_responder_and_analyst_allowed_on_post(self, user_alpha, user_analyst):
        factory = APIRequestFactory()
        permission = CanTriggerAIAnalysis()

        req_resp = factory.post("/api/v1/ai/analyze/")
        req_resp.user = user_alpha
        assert permission.has_permission(req_resp, None) is True

        req_analyst = factory.post("/api/v1/ai/analyze/")
        req_analyst.user = user_analyst
        assert permission.has_permission(req_analyst, None) is True
