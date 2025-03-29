from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from experiments.models import Variant, Distribution
from experiments.services.variant_service import recalculate_experiment_distributions


@receiver(post_save, sender=Variant)
def variant_saved(sender, instance, created, **kwargs):
    """
    When a variant is created or updated, trigger recalculation of distributions
    for the associated experiment.
    """
    # Use transaction.on_commit to ensure this runs after the current transaction completes
    if instance.experiment_id:  # Check if it exists before deletion
        transaction.on_commit(lambda: handle_variant_change(instance, created))


@receiver(post_delete, sender=Variant)
def variant_deleted(sender, instance, **kwargs):
    """
    When a variant is deleted, trigger recalculation of distributions
    for the associated experiment.
    """
    # Use transaction.on_commit to ensure this runs after the current transaction completes
    if instance.experiment_id:  # Check if it exists before deletion
        experiment_id = instance.experiment_id  # Store the ID before deleting
        transaction.on_commit(lambda: handle_variant_change(experiment_id, False))


def handle_variant_change(variant, created):
    """
    Handle variant changes by recalculating distributions if needed.
    """
    # Get the experiment associated with this variant
    experiment = getattr(variant, 'experiment', None)

    if not experiment:
        return

    # Only recalculate if the experiment is running
    if experiment.status == "running":
        # Log that recalculation is happening
        action = "created" if created else "updated or deleted"
        print(f"Variant {variant.key} was {action}. Recalculating distributions for experiment {experiment.key}.")

        # Recalculate distributions
        changed_count = recalculate_experiment_distributions(experiment)
        print(f"Updated {changed_count} distributions for experiment {experiment.key}.")


@receiver(post_save, sender=Variant)
def variant_saved_websocket(sender, instance, created, **kwargs):
    """
    When a variant is updated, send notification via WebSocket.
    """
    experiment = instance.experiment

    # Only send notifications if the experiment is running
    if experiment.status == "running":
        channel_layer = get_channel_layer()

        # Format the variant data
        variant_data = {
            'id': str(instance.id),
            'key': instance.key,
            'payload': instance.payload
        }

        # Format the experiment data
        experiment_data = {
            'id': str(experiment.id),
            'key': experiment.key,
            'name': experiment.name,
            'status': experiment.status,
            'type': experiment.type,
        }

        # Send notification to the experiment's channel group
        async_to_sync(channel_layer.group_send)(
            f"experiment_{str(experiment.id)}",
            {
                'type': 'experiment_update',
                'experiment': experiment_data,
                'variant': variant_data
            }
        )

        # # Also send notification to the project channel group
        # async_to_sync(channel_layer.group_send)(
        #     f"project_{str(experiment.project.id)}",
        #     {
        #         'type': 'experiment_update',
        #         'experiment': experiment_data,
        #         'variant': variant_data
        #     }
        # )


@receiver(post_save, sender=Distribution)
def distribution_saved_websocket(sender, instance, created, **kwargs):
    """
    When a distribution is updated, send notification to the specific user.
    """
    experiment = instance.experiment

    # Only send notifications if the experiment is running
    if experiment.status == "running":
        channel_layer = get_channel_layer()

        # Format the variant data
        variant_data = {
            'id': str(instance.variant.id),
            'key': instance.variant.key,
            'payload': instance.variant.payload
        }

        # Format the experiment data
        experiment_data = {
            'id': str(experiment.id),
            'key': experiment.key,
            'name': experiment.name,
            'status': experiment.status,
            'type': experiment.type,
        }

        # Send notification to the user's channel group
        async_to_sync(channel_layer.group_send)(
            f"user_{str(instance.user.id)}",
            {
                'type': 'distribution_update',
                'experiment': experiment_data,
                'variant': variant_data
            }
        )