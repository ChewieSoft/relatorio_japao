"""Serializers de autenticacao do app accounts.

Define serializers para registro de usuario e retorno
de dados do usuario logado (endpoint /api/auth/me/).
"""
from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    """Serializer de leitura para dados do usuario logado.

    Retorna id, username, email e is_staff conforme
    contrato do frontend (GET /api/auth/me/).
    """

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff']
        read_only_fields = ['id', 'username', 'email', 'is_staff']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer de registro de novo usuario.

    Aceita username, email e password (write_only).
    Usado pelo endpoint POST /api/auth/register/ (staff only).
    """

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']
