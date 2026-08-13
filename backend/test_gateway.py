import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django

django.setup()
from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO
from apps.knowledge.services.llm.factory import get_llm_gateway

gateway = get_llm_gateway()
print(type(gateway).__name__)
print(gateway.model)
print(gateway.base_url)

prompt = PromptContextDTO(
    system_prompt="You are a helpful assistant.",
    context_text="",
    history_text="",
    user_prompt='Hello, this is a test. Please output exactly "Hello" and nothing else. No thinking.',
    template_version="1.0",
    estimated_tokens=100,
)

response = gateway.generate(prompt)
print("Content:", response.content)
print("Model:", response.model)
print("Latency:", response.latency_ms)
print("Metadata:", response.metadata)
print("Total Tokens:", response.total_tokens)
