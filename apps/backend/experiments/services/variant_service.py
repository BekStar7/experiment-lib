from typing import Optional, Dict, Any, List
import hashlib
from django.db import transaction
from django.db.models import Q

from ..models import ProjectUser, Experiment, Variant, Distribution, Project


def get_hash_number(user_id: str, experiment_id: str) -> float:
    """
    Create a deterministic hash between 0 and 1 based on user_id and experiment_id.
    This ensures consistent variant assignment for the same user-experiment pair.
    """
    combined = f"{user_id}:{experiment_id}"
    hash_digest = hashlib.md5(combined.encode()).hexdigest()
    hash_int = int(hash_digest, 16)
    return (hash_int % 10000) / 10000  # Value between 0 and 1


def assign_variant(user: ProjectUser, experiment: Experiment) -> Variant:
    """
    Assign a variant to a user for a specific experiment based on rollout percentages.
    """
    variants = list(experiment.variants.all().order_by('id'))

    if not variants:
        raise ValueError(f"Experiment {experiment.key} has no variants")

    # Calculate total rollout percentage
    total_rollout = sum(variant.rollout for variant in variants)
    print(f"Total Rollout: {total_rollout}")

    nonzero_variants = [variant for variant in variants if variant.rollout > 0]
    if len(nonzero_variants) == 1:
        print(f"Only one active variant: {nonzero_variants[0].id}")
        return nonzero_variants[0]

    # Normalize rollout percentages if they don't sum to 1
    normalized_variants = []
    accumulated = 0

    for variant in variants:
        normalized_rollout = variant.rollout / total_rollout
        normalized_variants.append((variant, accumulated, accumulated + normalized_rollout))
        accumulated += normalized_rollout

    # Get a deterministic value between 0 and 1 for this user-experiment pair
    hash_value = get_hash_number(str(user.id), str(experiment.id))
    print(f"Hash value for user {user.id}: {hash_value}")

    # Find which variant's range contains this hash value
    for variant, range_start, range_end in normalized_variants:
        print(f"Checking variant {variant.id}: range ({range_start}, {range_end})")
        if range_start <= hash_value < range_end:
            print(f"User assigned to Variant {variant.id}")
            return variant

    # Fallback to the last variant if something goes wrong
    return variants[-1]


def merge_users(users: List[ProjectUser]) -> ProjectUser:
    """Merge multiple users into one, preserving all relevant data."""
    if not users:
        raise ValueError("No users to merge")

    primary_user = users[0]  # Use the first user as the primary one

    for user in users[1:]:
        # Merge identifiers if missing in primary
        if not primary_user.device_id and user.device_id:
            primary_user.device_id = user.device_id
        if not primary_user.email and user.email:
            primary_user.email = user.email
        if not primary_user.external_id and user.external_id:
            primary_user.external_id = user.external_id

        # Merge optional fields
        for field in ['latest_current_url', 'latest_os', 'latest_os_version', 'latest_device_type']:
            if getattr(user, field, None) and not getattr(primary_user, field, None):
                setattr(primary_user, field, getattr(user, field))

        # Merge properties
        primary_user.properties = {**user.properties, **primary_user.properties}

        # Delete merged user
        user.delete()

    primary_user.save()
    return primary_user


def get_or_create_user(project: Project, identifier_data: Dict[str, Any]) -> ProjectUser:
    """
    Get or create a user based on the provided identifiers.

    Args:
        project: The project the user belongs to.
        identifier_data: Dictionary containing user identifiers (device_id, email, external_id).

    Returns:
        ProjectUser: The retrieved or created user.

    Raises:
        ValueError: If no valid identifier is provided or if multiple users match different identifiers.
    """
    user_id = identifier_data.get("id")
    device_id = identifier_data.get('device_id')
    email = identifier_data.get('email')
    external_id = identifier_data.get('external_id')

    # Ensure at least one identifier is provided
    if not any([user_id, device_id, email, external_id]):
        raise ValueError("At least one identifier (device_id, email, or external_id) must be provided")

    # Build query to find existing users
    query = Q(project=project)
    conditions = []
    if user_id:
        conditions.append(Q(id=user_id))
    if device_id:
        conditions.append(Q(device_id=device_id))
    if email:
        conditions.append(Q(email=email))
    if external_id:
        conditions.append(Q(external_id=external_id))

    # Combine conditions with OR
    query &= conditions[0]
    for condition in conditions[1:]:
        query |= condition

    # Fetch matching users
    matching_users = list(ProjectUser.objects.filter(query))

    optional_fields = ['latest_current_url', 'latest_os', 'latest_os_version', 'latest_device_type']

    if not matching_users:
        # No matching user found, create a new one
        user_data = {
            'project': project,
            'device_id': device_id,
            'email': email,
            'external_id': external_id,
        }

        # Add optional fields if provided
        for field in optional_fields:
            if field in identifier_data:
                user_data[field] = identifier_data[field]

        # Merge properties if provided
        user_data['properties'] = identifier_data.get('properties', {})

        return ProjectUser.objects.create(**user_data)

    elif len(matching_users) == 1:
        # Exactly one user found, update fields if necessary
        user = matching_users[0]
        updated = False

        # Update missing identifiers
        if device_id and not user.device_id:
            user.device_id = device_id
            updated = True
        if email and not user.email:
            user.email = email
            updated = True
        if external_id and not user.external_id:
            user.external_id = external_id
            updated = True

        # Update optional fields if provided
        for field in optional_fields:
            if field in identifier_data:
                setattr(user, field, identifier_data[field])
                updated = True

        # Merge properties
        if 'properties' in identifier_data:
            user.properties = {**user.properties, **identifier_data.get('properties', {})}
            updated = True

        if updated:
            user.save()

        return user
    else:
        return merge_users(matching_users)


def get_or_create_distribution(user: ProjectUser, experiment: Experiment) -> Distribution:
    """
    Get existing distribution or create a new one if it doesn't exist.
    """
    try:
        # Try to get existing distribution
        return Distribution.objects.get(user=user, experiment=experiment)
    except Distribution.DoesNotExist:
        # Assign a variant and create distribution
        variant = assign_variant(user, experiment)
        distribution = Distribution(user=user, experiment=experiment, variant=variant)
        distribution.save()
        return distribution


def recalculate_experiment_distributions(experiment: Experiment) -> int:
    """
    Recalculate all distributions for an experiment when variant rollouts change.
    Returns the number of distributions that were updated.
    """
    changes_count = 0

    with transaction.atomic():
        # Get all distributions for this experiment
        distributions = Distribution.objects.filter(experiment=experiment)

        # For each distribution, calculate what the variant should be now
        for distribution in distributions:
            expected_variant = assign_variant(distribution.user, experiment)

            # If the variant has changed, update it
            if distribution.variant.id != expected_variant.id:
                distribution.variant = expected_variant
                distribution.save()
                changes_count += 1

    return changes_count


def calculate_distribution_stats(experiment: Experiment) -> Dict[str, float]:
    """
    Calculate the actual distribution of users across variants.
    Returns a dictionary with variant keys and their distribution percentages.
    """
    # Count distributions by variant
    total_distributions = Distribution.objects.filter(experiment=experiment).count()

    if total_distributions == 0:
        return {}

    stats = {}
    variants = experiment.variants.all()

    for variant in variants:
        variant_count = Distribution.objects.filter(
            experiment=experiment,
            variant=variant
        ).count()

        percentage = (variant_count / total_distributions) * 100
        stats[variant.key] = round(percentage, 2)

    return stats


def get_experiment_by_key(project: Project, experiment_key: str) -> Optional[Experiment]:
    """
    Get an experiment by its key for a specific project.

    Args:
        project: The project to look in
        experiment_key: The experiment key to find

    Returns:
        Experiment or None: The found experiment, or None if not found
    """
    try:
        return Experiment.objects.get(project=project, key=experiment_key)
    except Experiment.DoesNotExist:
        return None