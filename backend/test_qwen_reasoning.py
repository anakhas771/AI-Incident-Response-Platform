import requests
import json
import sys

base_url = "http://host.docker.internal:11434/api/chat"

payload = {
    "model": "qwen3:4b",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the capital of France?"}
    ],
    "stream": False,
    "options": {}
}

print("Testing raw Ollama API...")
try:
    response = requests.post(base_url, json=payload, timeout=10)
    print("Response status:", response.status_code)
    print("Keys in response:", list(response.json().keys()))
    print("Message keys:", list(response.json().get("message", {}).keys()))
    print("Content:", response.json().get("message", {}).get("content"))
except Exception as e:
    print(f"Error: {e}")
