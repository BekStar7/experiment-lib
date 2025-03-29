from django.urls import re_path
from experiments.consumers import ExperimentConsumer

websocket_urlpatterns = [
    re_path(r'ws/experiments/$', ExperimentConsumer.as_asgi()),
]