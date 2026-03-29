"""Controllers de autenticacao do app accounts.

UserView retorna dados do usuario logado.
RegisterView cria novos usuarios (restrito a staff/admin).
Login, refresh e logout usam views built-in do simplejwt.
"""
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, UserSerializer
from .services import AuthService


class UserView(APIView):
    """Controller para dados do usuario logado.

    Endpoint: GET /api/auth/me/
    Permissoes: IsAuthenticated.
    Retorna id, username, email, is_staff.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retorna dados do usuario autenticado.

        Args:
            request: Request HTTP com usuario autenticado.

        Returns:
            Response: Dados do usuario serializado.
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class RegisterView(APIView):
    """Controller para registro de novos usuarios.

    Endpoint: POST /api/auth/register/
    Permissoes: IsAdminUser (somente staff pode criar usuarios).
    Delega criacao ao AuthService.
    """

    permission_classes = [IsAdminUser]

    def __init__(self, **kwargs):
        """Inicializa controller com AuthService."""
        super().__init__(**kwargs)
        self.service = AuthService()

    def post(self, request):
        """Cria novo usuario via AuthService.

        Args:
            request: Request HTTP com dados do usuario.

        Returns:
            Response: Dados do usuario criado (201) ou erros de validacao (400).
        """
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.service.register(serializer.validated_data)
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )
