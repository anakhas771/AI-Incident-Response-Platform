import requests

payload = {
    "model": "qwen3:4b",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": False,
}
resp = requests.post("http://host.docker.internal:11434/api/chat", json=payload)
print(resp.text)
