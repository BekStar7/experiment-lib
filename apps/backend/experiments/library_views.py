from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404

from experiments.authentication import APIKeyAuthentication
from experiments.models import Experiment
from experiments.serializers import UserIdentifierSerializer, ExperimentVariantResponseSerializer, UserResponseSerializer
from experiments.services.variant_service import (
    get_or_create_user,
    get_or_create_distribution,
    get_experiment_by_key
)


class LibraryAPIView(APIView):
    """
    Base class for library-facing API views.
    Uses API key authentication.
    """
    authentication_classes = [APIKeyAuthentication]

    def get_project(self):
        """
        Get the project from the request.
        This is set by the ProjectAuthMiddleware.
        """
        if not hasattr(self.request, 'project') or self.request.project is None:
            raise Http404("Project not found")
        return self.request.project


class ExperimentVariantAPIView(LibraryAPIView):
    """
    API endpoint to get or assign a variant for a user in an experiment.
    This is meant to be used by the client-side library.
    """

    def get(self, request, experiment_key):
        """Get the variant for a user in an experiment."""
        # Get the project from the request (set by APIKeyAuthentication)
        project = self.get_project()

        # Validate user identification data
        user_serializer = UserIdentifierSerializer(data=request.query_params)
        if not user_serializer.is_valid():
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get validated user data
        user_data = user_serializer.validated_data

        try:
            # Find the experiment
            experiment = get_experiment_by_key(project, experiment_key)
            if not experiment:
                return Response(
                    {"error": f"Experiment '{experiment_key}' not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Ensure experiment is running
            if experiment.status != "running":
                return Response({
                    "error": "Experiment is not running",
                    "status": experiment.status
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get or create user
            user = get_or_create_user(project, user_data)

            # Get or create distribution
            distribution = get_or_create_distribution(user, experiment)

            # Prepare response
            response_data = {
                'experiment': experiment,
                'variant': distribution.variant
            }

            serializer = ExperimentVariantResponseSerializer(response_data)
            return Response(serializer.data)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserIdentifyAPIView(LibraryAPIView):
    """
    API endpoint to identify a user based on provided identifiers.
    Returns user information if the user exists, or creates a new user if not.
    """

    def post(self, request):
        """
        Identify a user based on provided identifiers.
        At least one of device_id, email, or external_id must be provided.
        """
        # Get the project from the request
        project = self.get_project()

        # Validate user identification data
        user_serializer = UserIdentifierSerializer(data=request.data)
        if not user_serializer.is_valid():
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get validated user data
        user_data = user_serializer.validated_data

        try:
            # Get or create user
            user = get_or_create_user(project, user_data)

            # Return user data
            response_serializer = UserResponseSerializer(user)
            return Response(response_serializer.data)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserExperimentsAPIView(LibraryAPIView):
    """
    API endpoint to get all experiments and variants for a user.
    This is meant to be used by the client-side library to initialize all experiments at once.
    """

    def get(self, request):
        """Get all experiments and variants for a user."""
        # Get the project from the request
        project = self.get_project()

        # Validate user identification data
        user_serializer = UserIdentifierSerializer(data=request.query_params)
        if not user_serializer.is_valid():
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get validated user data
        user_data = user_serializer.validated_data

        try:
            # Get or create user
            user = get_or_create_user(project, user_data)

            # Get all running experiments for this project
            running_experiments = Experiment.objects.filter(
                project=project,
                status='running'
            )

            # Get or create distributions for each experiment
            experiments_data = []
            for experiment in running_experiments:
                distribution = get_or_create_distribution(user, experiment)

                experiments_data.append({
                    'experiment': {
                        'id': str(experiment.id),
                        'key': experiment.key,
                        'name': experiment.name
                    },
                    'variant': {
                        'id': str(distribution.variant.id),
                        'key': distribution.variant.key,
                        'payload': distribution.variant.payload
                    }
                })

            user_serialized_data = UserResponseSerializer(user).data

            return Response({
                'user': user_serialized_data,
                'experiments': experiments_data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)