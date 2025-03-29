from django.core.management.base import BaseCommand
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import getpass

from experiments.models import AdminUser


class Command(BaseCommand):
    help = 'Create a new admin user'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email address for the admin user')
        parser.add_argument('--password', type=str, help='Password for the admin user (omit for prompt)')
        parser.add_argument('--first-name', type=str, help='First name of the admin user', default='')
        parser.add_argument('--last-name', type=str, help='Last name of the admin user', default='')
        parser.add_argument('--superuser', action='store_true', help='Create a superuser with all permissions')

    def handle(self, *args, **options):
        # Get email
        email = options.get('email')
        while not email:
            email = input("Email address: ")
            try:
                validate_email(email)
            except ValidationError:
                self.stderr.write("Invalid email address. Please try again.")
                email = None

        # Check if user exists
        if AdminUser.objects.filter(email=email).exists():
            self.stderr.write(f"User with email {email} already exists.")
            return

        # Get password
        password = options.get('password')
        if not password:
            while True:
                password = getpass.getpass("Password: ")
                if len(password) < 8:
                    self.stderr.write("Password must be at least 8 characters long.")
                    continue

                password_confirm = getpass.getpass("Confirm password: ")
                if password != password_confirm:
                    self.stderr.write("Passwords do not match. Please try again.")
                    continue

                break

        # Get other fields
        first_name = options.get('first_name', '')
        last_name = options.get('last_name', '')
        is_superuser = options.get('superuser', False)

        # Create the user
        if is_superuser:
            user = AdminUser.objects.create_superuser(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            self.stdout.write(self.style.SUCCESS(f"Superuser {email} created successfully."))
        else:
            user = AdminUser.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_staff=True
            )
            self.stdout.write(self.style.SUCCESS(f"Admin user {email} created successfully."))