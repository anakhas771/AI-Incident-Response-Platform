import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

import django
try:
    django.setup()
    from django.test import Client
    from apps.users.models import User
    from apps.knowledge.models import ChatSession
except Exception as e:
    print("Setup Error:", e)
    sys.exit(1)

c = Client()
user = User.objects.first()
c.force_login(user)

session = ChatSession.objects.first()
print(f"Using session: {session.id} user: {user.email}")

response = c.post(
    '/api/v1/copilot/stream/',
    {'session_id': str(session.id), 'message': 'hello'},
    content_type='application/json'
)

print(f"Status: {response.status_code}")
print(f"Content-Type: {response.get('Content-Type')}")

if hasattr(response, 'streaming_content'):
    print("Is streaming!")
    for chunk in response.streaming_content:
        print(repr(chunk))
else:
    print("Not streaming!")
    print(response.content)
