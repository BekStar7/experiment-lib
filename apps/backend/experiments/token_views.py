from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that accepts either 'username' or 'email' as the credential field
    """
    username_field = 'email'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Accept 'username' as an alias for 'email'
        if 'username' in self.initial_data and 'email' not in self.initial_data:
            self.initial_data['email'] = self.initial_data['username']


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses our custom serializer
    """
    serializer_class = CustomTokenObtainPairSerializer
