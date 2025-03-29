from django.apps import apps
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Print all models
for app_config in apps.get_app_configs():
    print(f"App: {app_config.label}")
    for model in app_config.get_models():
        print(f"  - {model.__name__}")

print("\nChecking for AdminUser model:")
try:
    AdminUser = apps.get_model('experiments', 'AdminUser')
    print(f"Found AdminUser model: {AdminUser}")
except LookupError as e:
    print(f"Error: {e}")