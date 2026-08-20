from django.apps import AppConfig


class AiEngineConfig(AppConfig):
    name = "apps.ai_engine"

    def ready(self):
        import apps.ai_engine.signals  # noqa: F401
