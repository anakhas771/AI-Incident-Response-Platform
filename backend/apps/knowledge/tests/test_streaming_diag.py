import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.knowledge.models import ChatSession
from apps.accounts.models import Organization

@pytest.mark.django_db(transaction=True)
def test_streaming_endpoint_diagnostic():
    User = get_user_model()
    org = Organization.objects.create(name='Test Org')
    user = User.objects.create_user(username='testdiag', email='test@example.com', password='pwd', organization=org)
    session = ChatSession.objects.create(user=user, organization=org, title='Test')
    client = APIClient()
    client.force_authenticate(user=user)

    url = '/api/v1/copilot/stream/'
    response = client.post(url, {'session_id': str(session.id), 'message': 'Hello'}, format='json')

    print(f'\n--- DIAGNOSTIC RESULTS ---')
    print(f'Status Code: {response.status_code}')
    print(f'Content-Type: {response.headers.get("Content-Type")}')
    print(f'Streaming: {response.streaming}')
    print(f'Cache-Control: {response.headers.get("Cache-Control")}')
    print(f'X-Accel-Buffering: {response.headers.get("X-Accel-Buffering")}')

    if response.streaming:
        import asyncio
        async def get_content():
            chunks = []
            async for chunk in response.streaming_content:
                chunks.append(chunk)
            return b''.join(chunks)
        content = asyncio.run(get_content())
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
    print(f'--- END DIAGNOSTIC RESULTS ---\n')
