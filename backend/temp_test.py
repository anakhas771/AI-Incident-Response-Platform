import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.test')
import django
django.setup()
from django.test.utils import setup_test_environment
setup_test_environment()
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.knowledge.models import ChatSession
from apps.accounts.models import Organization

User = get_user_model()
try:
    user = User.objects.first()
    if not user:
        org = Organization.objects.create(name='Test Org')
        user = User.objects.create_user(username='testdiag', password='pwd', organization=org)
    session = ChatSession.objects.filter(user=user).first()
    if not session:
        session = ChatSession.objects.create(user=user, organization=user.organization, title='Test')

    client = APIClient()
    client.force_authenticate(user=user)

    url = '/api/v1/copilot/stream/'
    response = client.post(url, {'session_id': str(session.id), 'message': 'Hello'}, format='json')

    print(f'Status Code: {response.status_code}')
    print(f'Content-Type: {response.headers.get("Content-Type")}')
    print(f'Streaming: {response.streaming}')
    print(f'Cache-Control: {response.headers.get("Cache-Control")}')
    print(f'X-Accel-Buffering: {response.headers.get("X-Accel-Buffering")}')

    if response.streaming:
        content = b''.join(response.streaming_content)
        print(f'Length: {len(content)}')
        content_str = content.decode('utf-8')
        print(f'Start present: {"event: start" in content_str}')
        print(f'Token present: {"event: token" in content_str}')
        print(f'Done present: {"event: done" in content_str}')
        print(f'Error present: {"event: error" in content_str}')
        lines = content_str.splitlines()
        print('First 10 lines:')
        for line in lines[:10]:
            print(line)
except Exception as e:
    print(f'Error: {e}')
