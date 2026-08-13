import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
import django
django.setup()

from apps.knowledge.services.llm.factory import get_llm_gateway
from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO

print("--- TESTING MANUAL GENERATE ---")
gateway = get_llm_gateway()
prompt = PromptContextDTO(
    system_prompt="You are a helpful assistant.",
    user_prompt="Say exactly 'OLLAMA_OK'.",
    context_text="",
    history_text="",
    estimated_tokens=20,
    template_version="v1"
)

response = gateway.generate(prompt)
print(f"Generate response: {response}")

print("\n--- TESTING MANUAL STREAM ---")
for chunk in gateway.stream(prompt):
    print(chunk, end="")
print("\nStream done!")
