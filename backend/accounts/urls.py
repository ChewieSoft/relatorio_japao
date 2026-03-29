"""Configuracao de URLs do app accounts.

5 endpoints de autenticacao JWT:
- login/ e refresh/: views built-in do simplejwt
- register/: RegisterView (staff only)
- me/: UserView (usuario logado)
- logout/: TokenBlacklistView do simplejwt (blacklist refresh token)
"""
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenBlacklistView,
    TokenObtainPairView,
    TokenRefreshView,
)

from .controllers import RegisterView, UserView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', UserView.as_view(), name='user_me'),
    path('logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
]
