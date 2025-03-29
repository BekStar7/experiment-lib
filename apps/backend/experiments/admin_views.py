import secrets

from django.db import transaction
from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from experiments.models import Project, Experiment, Variant, ProjectUser, Distribution
from experiments.serializers import (
    ProjectSerializer,
    ExperimentSerializer,
    VariantSerializer,
    ProjectUserSerializer,
    DistributionSerializer, BulkVariantUpdateSerializer,
)
from experiments.services.variant_service import (
    calculate_distribution_stats,
    recalculate_experiment_distributions
)


class AdminViewSetMixin:
    """
    Mixin for admin viewsets to set authentication and permission classes.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Restrict all admin viewsets to only show objects owned by the current user.
        """
        queryset = super().get_queryset()

        # If the model has an owner field, filter by it
        if hasattr(self.get_serializer().Meta.model, 'owner'):
            return queryset.filter(owner=self.request.user)

        # If the model has a project field that has an owner field, filter by it
        if hasattr(self.get_serializer().Meta.model, 'project'):
            return queryset.filter(project__owner=self.request.user)

        if hasattr(self.get_serializer().Meta.model, 'experiment'):
            return queryset.filter(experiment__project__owner=self.request.user)

        # Otherwise, return an empty queryset for safety
        return self.get_serializer().Meta.model.objects.none()


class AdminProjectViewSet(AdminViewSetMixin, viewsets.ModelViewSet):
    """
    Admin API endpoint for managing projects.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def perform_create(self, serializer):
        # Set the owner to the current user
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def regenerate_api_key(self, request, pk=None):
        """Regenerate the API key for a specific project."""
        project = self.get_object()
        project.api_key = secrets.token_hex(16)
        project.save(update_fields=['api_key'])
        return Response({'api_key': project.api_key}, status=status.HTTP_200_OK)


class AdminExperimentViewSet(AdminViewSetMixin, viewsets.ModelViewSet):
    """
    Admin API endpoint for managing experiments.
    """
    queryset = Experiment.objects.all()
    serializer_class = ExperimentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by project if provided
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        # Filter by status if provided
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def update(self, request, *args, **kwargs):
        partial = True  # Force partial updates
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get distribution statistics for an experiment."""
        experiment = self.get_object()
        stats = calculate_distribution_stats(experiment)
        return Response({
            'experiment': {
                'id': str(experiment.id),
                'key': experiment.key,
                'name': experiment.name
            },
            'stats': stats
        })

    @action(detail=True, methods=['post'])
    def recalculate(self, request, pk=None):
        """Trigger recalculation of variant distributions for an experiment."""
        experiment = self.get_object()

        # Perform recalculation
        changes_count = recalculate_experiment_distributions(experiment)

        # Get updated stats
        stats = calculate_distribution_stats(experiment)

        return Response({
            'message': f"Recalculation completed. Updated {changes_count} distributions.",
            'experiment': {
                'id': str(experiment.id),
                'key': experiment.key,
                'name': experiment.name
            },
            'stats': stats
        })

    @action(detail=True, methods=['post'])
    def bulk_update_variants(self, request, pk=None):
        """
        Bulk update variants for an experiment.
        This allows updating multiple variants in a single request.
        """
        experiment = self.get_object()

        # Validate incoming data
        serializer = BulkVariantUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        variants_data = serializer.validated_data['variants']
        updated_variants = []
        errors = []

        with transaction.atomic():
            # Process each variant update
            for variant_data in variants_data:
                variant_id = variant_data.pop('id')
                try:
                    variant = Variant.objects.get(id=variant_id, experiment=experiment)

                    # Update allowed fields
                    for field in ['key', 'payload', 'rollout']:
                        if field in variant_data:
                            setattr(variant, field, variant_data[field])

                    variant.save()
                    updated_variants.append(VariantSerializer(variant).data)
                except Variant.DoesNotExist:
                    errors.append(f"Variant with id {variant_id} does not exist in this experiment")
                except Exception as e:
                    errors.append(f"Error updating variant {variant_id}: {str(e)}")

        # If there were errors, return them
        if errors:
            return Response({
                "errors": errors,
                "updated_variants": updated_variants
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "experiment": {
                "id": str(experiment.id),
                "key": experiment.key,
                "name": experiment.name
            },
            "updated_variants": updated_variants,
        })


class AdminVariantViewSet(AdminViewSetMixin, viewsets.ModelViewSet):
    """
    Admin API endpoint for managing variants.
    """
    queryset = Variant.objects.all()
    serializer_class = VariantSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by experiment if provided
        experiment_id = self.request.query_params.get('experiment_id')
        if experiment_id:
            queryset = queryset.filter(experiment_id=experiment_id)

        return queryset

    @staticmethod
    def validate_rollout(experiment, instance, new_rollout):
        """
        Ensure the total rollout for an experiment does not exceed 1.
        """
        total_rollout = (
            Variant.objects.filter(experiment=experiment)
            .exclude(id=instance.id if instance else None)
            .aggregate(total=Sum("rollout"))["total"] or 0
        )

        if total_rollout + new_rollout > 1.0:
            raise ValidationError(
                f"Total rollout for experiment {experiment.name} cannot exceed 1.0."
            )

    def perform_create(self, serializer):
        experiment = serializer.validated_data["experiment"]
        rollout = serializer.validated_data["rollout"]

        self.validate_rollout(experiment, None, rollout)
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        experiment = instance.experiment
        new_rollout = serializer.validated_data.get("rollout", instance.rollout)

        self.validate_rollout(experiment, instance, new_rollout)
        serializer.save()


class AdminProjectUserViewSet(AdminViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """
    Admin API endpoint for viewing project users.
    Read-only since users are created via the library endpoints.
    """
    queryset = ProjectUser.objects.all()
    serializer_class = ProjectUserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by project if provided
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        # Filter by identifiers if provided
        device_id = self.request.query_params.get('device_id')
        if device_id:
            queryset = queryset.filter(device_id=device_id)

        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email=email)

        external_id = self.request.query_params.get('external_id')
        if external_id:
            queryset = queryset.filter(external_id=external_id)

        return queryset

    @action(detail=True, methods=['get'])
    def distributions(self, request, pk=None):
        """Get all experiment distributions for a user."""
        user = self.get_object()

        # Get all distributions for this user
        distributions = Distribution.objects.filter(user=user).select_related('experiment', 'variant')

        # Format the response
        data = []
        for dist in distributions:
            data.append({
                'experiment': {
                    'id': str(dist.experiment.id),
                    'key': dist.experiment.key,
                    'name': dist.experiment.name
                },
                'variant': {
                    'id': str(dist.variant.id),
                    'key': dist.variant.key,
                    'payload': dist.variant.payload
                }
            })

        return Response(data)


class AdminDistributionViewSet(AdminViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """
    Admin API endpoint for viewing distributions.
    Read-only since distributions are managed by the library logic.
    """
    queryset = Distribution.objects.all()
    serializer_class = DistributionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by experiment if provided
        experiment_id = self.request.query_params.get('experiment_id')
        if experiment_id:
            queryset = queryset.filter(experiment_id=experiment_id)

        # Filter by user if provided
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Filter by variant if provided
        variant_id = self.request.query_params.get('variant_id')
        if variant_id:
            queryset = queryset.filter(variant_id=variant_id)

        return queryset