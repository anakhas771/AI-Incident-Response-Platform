from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class KnowledgeConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.knowledge"
    verbose_name = _("Enterprise RAG Knowledge Base")
