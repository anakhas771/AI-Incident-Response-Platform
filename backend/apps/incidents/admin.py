from django.contrib import admin

from .models import Attachment, Comment, Incident, IncidentEvent


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    readonly_fields = ("created_at",)


class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 0
    readonly_fields = ("uploaded_at",)


class IncidentEventInline(admin.TabularInline):
    model = IncidentEvent
    extra = 0
    readonly_fields = ("user", "event_type", "message", "metadata", "created_at")
    can_delete = False


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "organization",
        "severity",
        "status",
        "category",
        "created_by",
        "assigned_to",
        "created_at",
    )
    list_filter = (
        "severity",
        "status",
        "category",
        "organization",
        "created_at",
    )
    search_fields = ("title", "description")
    raw_id_fields = ("created_by", "assigned_to")
    inlines = [CommentInline, AttachmentInline, IncidentEventInline]


@admin.register(IncidentEvent)
class IncidentEventAdmin(admin.ModelAdmin):
    list_display = ("incident", "event_type", "user", "created_at")
    list_filter = ("event_type", "created_at")
    search_fields = ("incident__title", "message")
    readonly_fields = (
        "incident",
        "user",
        "event_type",
        "message",
        "metadata",
        "created_at",
    )


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("incident", "author", "created_at")
    search_fields = ("incident__title", "message", "author__email")
    readonly_fields = ("created_at",)


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("filename", "incident", "uploaded_by", "uploaded_at")
    search_fields = ("filename", "incident__title", "uploaded_by__email")
    readonly_fields = ("uploaded_at",)
