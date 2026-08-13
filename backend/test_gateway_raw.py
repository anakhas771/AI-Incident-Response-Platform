import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django

django.setup()
from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO
from apps.knowledge.services.llm.factory import get_llm_gateway

gateway = get_llm_gateway()
prompt = PromptContextDTO(
    system_prompt="You are a helpful assistant.",
    context_text="",
    history_text="",
    user_prompt='Hello, this is a test. Please output exactly "Hello" and nothing else. No thinking.',
    template_version="1.0",
    estimated_tokens=100,
)

payload = {
    "model": gateway.model,
    "messages": gateway._build_messages(prompt),
    "stream": False,
    "think": False,
    "options": {
        "temperature": gateway.temperature,
        "num_predict": gateway.max_tokens,
        "think": False,
    },
}

import requests

resp = requests.post(f"{gateway.base_url}/api/chat", json=payload)
print(repr(resp.json().get("message", {}).get("content", "")))
