from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.contrib.auth.base_user import BaseUserManager
import uuid


class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    def _create_user(self, email, password=None, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class AdminUser(AbstractUser):
    """Admin user model for authentication and management"""
    username = None
    email = models.EmailField('email address', unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    groups = models.ManyToManyField(
        Group,
        related_name="adminuser_groups",
        blank=True
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="adminuser_permissions",
        blank=True
    )

    def __str__(self):
        return self.email


class Project(models.Model):
    """
    Project model to group experiments and manage API keys
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    api_key = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(max_length=255, blank=True, null=True)
    owner = models.ForeignKey(AdminUser, on_delete=models.CASCADE, related_name='owned_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class ProjectUser(models.Model):
    """
    Represents a user in the context of an A/B testing system.
    Users can be identified by device_id, email, or external_id.
    At least one of these identifiers must be provided.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='users')
    # User identifiers - at least one must be provided
    device_id = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    # User metadata
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    latest_current_url = models.URLField(blank=True, null=True)
    latest_os = models.CharField(max_length=50, blank=True, null=True)
    latest_os_version = models.CharField(max_length=50, blank=True, null=True)
    latest_device_type = models.CharField(max_length=50, blank=True, null=True)
    # Additional properties as JSON
    properties = models.JSONField(default=dict, blank=True)

    class Meta:
        # Ensure that at least one identifier is unique per project
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'device_id'],
                condition=models.Q(device_id__isnull=False),
                name='unique_device_id_per_project'
            ),
            models.UniqueConstraint(
                fields=['project', 'email'],
                condition=models.Q(email__isnull=False),
                name='unique_email_per_project'
            ),
            models.UniqueConstraint(
                fields=['project', 'external_id'],
                condition=models.Q(external_id__isnull=False),
                name='unique_external_id_per_project'
            ),
        ]

    def save(self, *args, **kwargs):
        # Ensure at least one identifier is provided
        if not any([self.device_id, self.email, self.external_id]):
            raise ValueError("At least one identifier (device_id, email, or external_id) must be provided")
        super().save(*args, **kwargs)

    def __str__(self):
        identifiers = []
        if self.device_id:
            identifiers.append(f"device:{self.device_id}")
        if self.email:
            identifiers.append(f"email:{self.email}")
        if self.external_id:
            identifiers.append(f"ext:{self.external_id}")
        return f"{self.project.title} - {', '.join(identifiers)}"


class Experiment(models.Model):
    """
    Defines an A/B test with multiple variants
    """
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("running", "Running"),
        ("completed", "Completed"),
    ]
    TYPE_CHOICES = [
        ("toggle", "Toggle"),
        ("multiple_variant", "Multiple Variant"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="draft")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="toggle")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="experiments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['project', 'key']]

    def save(self, *args, **kwargs):
        """
        Automatically ensures that toggle experiments have exactly one variant called 'enabled'.
        """
        super().save(*args, **kwargs)

        if self.type == "toggle":
            with transaction.atomic():
                self.variants.all().delete()

                # Create the single 'enabled' variant
                Variant.objects.create(
                    experiment=self,
                    key="enabled",
                    rollout=0.5,
                    payload=None
                )

                Variant.objects.create(
                    experiment=self,
                    key="control",
                    rollout=0.5,
                    payload=None
                )

    def __str__(self):
        return f"{self.project.title} - {self.name}"


class Variant(models.Model):
    """
    A specific test condition with a rollout percentage and payload
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=255)
    payload = models.JSONField(null=True, blank=True)
    rollout = models.FloatField()  # Percentage rollout, e.g., 50% = 0.5
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, related_name="variants")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['experiment', 'key']]

    def clean(self):
        """
        Ensures that if the experiment is of type 'toggle', it has exactly two variants:
        'enabled' and 'control', and no other variants.
        """
        if self.experiment.type == "toggle":
            allowed_keys = {"enabled", "control"}

            # Ensure the variant key is either "enabled" or "control"
            if self.key not in allowed_keys:
                raise ValidationError(f"Toggle experiment variants must be 'enabled' or 'control', not '{self.key}'.")

            # Count existing variants, excluding the current one (for updates)
            existing_variants = self.experiment.variants.exclude(id=self.id)
            existing_keys = set(existing_variants.values_list("key", flat=True))

            # Ensure we don't exceed the required two variants
            if len(existing_keys) >= 2 and self.key not in existing_keys:
                raise ValidationError("Toggle experiments can only have 'enabled' and 'control' variants.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.experiment.name} - {self.key}"


class Distribution(models.Model):
    """
    Maps a user to a specific variant in an experiment
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(ProjectUser, on_delete=models.CASCADE, related_name="distributions")
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, related_name="distributions")
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name="distributions")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["user", "experiment"]]

    def __str__(self):
        return f"{self.user} -> {self.experiment.name}: {self.variant.key}"