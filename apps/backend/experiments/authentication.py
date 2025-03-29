from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils.translation import gettext_lazy as _

from experiments.models import Project


class APIKeyAuthentication(BaseAuthentication):
    """
    Custom authentication class for API key-based authentication.
    This is used for the public library endpoints that client applications use.
    """

    keyword = 'ApiKey'

    def authenticate(self, request):
        # Get the API key from the request header
        api_key = request.META.get('HTTP_X_API_KEY') or request.query_params.get('api_key')

        if not api_key:
            return None  # Authentication was not attempted

        try:
            # Try to find a project with this API key
            project = Project.objects.get(api_key=api_key)

            # Return a tuple of (None, project) to indicate successful authentication
            # We don't return a user since this is API key auth
            return (None, project)

        except Project.DoesNotExist:
            # Invalid API key
            raise AuthenticationFailed(_('Invalid API key'))

    def authenticate_header(self, request):
        # Return the header value that should be used in the WWW-Authenticate header
        return self.keyword


class ProjectAuthMiddleware:
    """
    Middleware to add the authenticated project to the request.
    This is needed because DRF's authentication_classes only authenticates the user,
    but we also need to know which project the API key belongs to.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Process the request before the view is called
        # The project will be set by the APIKeyAuthentication class

        api_key = request.headers.get('X-API-KEY')
        if api_key is not None:
            try:
                project = Project.objects.get(api_key=api_key)
                request.project = project
            except Project.DoesNotExist:
                pass

        response = self.get_response(request)
        return response
