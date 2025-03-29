from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from experiments.admin_views import (
    AdminProjectViewSet,
    AdminExperimentViewSet,
    AdminVariantViewSet,
    AdminProjectUserViewSet,
    AdminDistributionViewSet
)
from experiments.library_views import (
    ExperimentVariantAPIView,
    UserExperimentsAPIView, UserIdentifyAPIView
)
from experiments.token_views import CustomTokenObtainPairView

# Create a router for admin viewsets
admin_router = DefaultRouter()
admin_router.register(r'projects', AdminProjectViewSet)
admin_router.register(r'experiments', AdminExperimentViewSet)
admin_router.register(r'variants', AdminVariantViewSet)
admin_router.register(r'users', AdminProjectUserViewSet)
admin_router.register(r'distributions', AdminDistributionViewSet)

urlpatterns = [
    # Admin API endpoints (JWT protected)
    path('admin/', include(admin_router.urls)),

    # JWT authentication endpoints
    path('admin/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('admin/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path(
        'admin/experiments/<pk>/variants/',
        AdminExperimentViewSet.as_view({'put': 'bulk_update_variants'}),
        name='admin-experiment-bulk-update-variants'
    ),

    # Library API endpoints (API key protected)
    path(
        'experiments/<str:experiment_key>/variant',
        ExperimentVariantAPIView.as_view(),
        name='experiment_variant'
    ),
    path(
        'experiments',
        UserExperimentsAPIView.as_view(),
        name='user_experiments'
    ),
    path(
        'users/identify',
        UserIdentifyAPIView.as_view(),
        name='user_identify'
    ),
]