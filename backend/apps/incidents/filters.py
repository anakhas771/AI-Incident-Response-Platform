import django_filters
from django.db.models import Q

from .models import Category, Incident, Severity, Status


class IncidentFilter(django_filters.FilterSet):
    """
    FilterSet for querying Incidents by severity, status, category, assignee, date ranges, and search.
    """

    severity = django_filters.ChoiceFilter(choices=Severity.choices)
    status = django_filters.ChoiceFilter(choices=Status.choices)
    category = django_filters.ChoiceFilter(choices=Category.choices)

    assigned_to = django_filters.UUIDFilter(field_name="assigned_to__id")
    created_by = django_filters.UUIDFilter(field_name="created_by__id")

    created_at = django_filters.DateFromToRangeFilter(field_name="created_at")
    created_at_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_at_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )

    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Incident
        fields = [
            "severity",
            "status",
            "category",
            "assigned_to",
            "created_by",
            "created_at",
            "created_at_after",
            "created_at_before",
            "search",
        ]

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(title__icontains=value) | Q(description__icontains=value)
        )
