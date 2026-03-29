"""Service de autenticacao do app accounts.

Encapsula logica de registro de usuario.
Login, refresh e logout sao delegados ao simplejwt.
"""
from django.contrib.auth.models import User


class AuthService:
    """Servico de logica de autenticacao.

    Responsavel pelo registro de novos usuarios.
    Endpoints de login/refresh/logout usam views built-in do simplejwt.
    """

    def register(self, data):
        """Cria novo usuario com senha hasheada.

        Args:
            data: Dicionario com username, email e password.

        Returns:
            User: Instancia do usuario criado.
        """
        return User.objects.create_user(
            username=data['username'],
            email=data.get('email', ''),
            password=data['password'],
        )
