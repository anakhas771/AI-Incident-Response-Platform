import requests

payload = {
    "model": "qwen3:4b",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": True,
}
resp = requests.post(
    "http://host.docker.internal:11434/api/chat", json=payload, stream=True
)
for line in resp.iter_lines():
    print(line.decode("utf-8"))
    break
