from django.test import RequestFactory
from apps.users.models import User
from apps.knowledge.models import ChatSession
from apps.knowledge.api.copilot_views import CopilotStreamView

rf = RequestFactory()
user = User.objects.first()
session = ChatSession.objects.first()

request = rf.post('/api/v1/copilot/stream/', {'session_id': str(session.id), 'message': 'hello'}, content_type='application/json')
request.user = user

view = CopilotStreamView.as_view()
response = view(request)

if hasattr(response, 'streaming_content'):
    print("STREAMING:")
    for chunk in response.streaming_content:
        print(repr(chunk))
else:
    print("NOT STREAMING:", response.content)
