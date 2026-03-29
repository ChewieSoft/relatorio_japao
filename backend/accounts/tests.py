"""Testes de autenticacao do app accounts.

Valida login, refresh, me, logout e register (admin only).
"""
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestAuthEndpoints:
    """Testes dos 5 endpoints de autenticacao JWT."""

    def test_login_returns_tokens(self):
        """Verifica que login retorna access e refresh tokens."""
        User.objects.create_user(username='loginuser', password='pass12345')
        client = APIClient()
        response = client.post('/api/auth/login/', {
            'username': 'loginuser',
            'password': 'pass12345',
        }, format='json')
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_me_returns_user(self, api_client, user):
        """Verifica que /me/ retorna dados do usuario logado."""
        response = api_client.get('/api/auth/me/')
        assert response.status_code == 200
        assert response.data['username'] == user.username
        assert response.data['email'] == user.email
        assert 'id' in response.data
        assert 'is_staff' in response.data

    def test_refresh_returns_new_access(self):
        """Verifica que refresh retorna novo access token."""
        User.objects.create_user(username='refreshuser', password='pass12345')
        client = APIClient()
        login_response = client.post('/api/auth/login/', {
            'username': 'refreshuser',
            'password': 'pass12345',
        }, format='json')
        refresh_token = login_response.data['refresh']

        response = client.post('/api/auth/refresh/', {
            'refresh': refresh_token,
        }, format='json')
        assert response.status_code == 200
        assert 'access' in response.data

    def test_logout_blacklists_token(self):
        """Verifica que logout invalida o refresh token."""
        User.objects.create_user(username='logoutuser', password='pass12345')
        client = APIClient()
        login_response = client.post('/api/auth/login/', {
            'username': 'logoutuser',
            'password': 'pass12345',
        }, format='json')
        refresh_token = login_response.data['refresh']

        response = client.post('/api/auth/logout/', {
            'refresh': refresh_token,
        }, format='json')
        assert response.status_code == 200

        # Tentar usar o refresh token blacklisted deve falhar
        response = client.post('/api/auth/refresh/', {
            'refresh': refresh_token,
        }, format='json')
        assert response.status_code == 401

    def test_register_admin_only(self, api_client, admin_user):
        """Verifica que register requer staff e cria usuario."""
        # Usuario normal nao pode registrar
        normal_client = APIClient()
        normal_user = User.objects.create_user(
            username='normal', password='pass12345'
        )
        normal_client.force_authenticate(user=normal_user)
        response = normal_client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'new@jrc.com',
            'password': 'newpass12345',
        }, format='json')
        assert response.status_code == 403

        # Admin pode registrar
        admin_client = APIClient()
        admin_client.force_authenticate(user=admin_user)
        response = admin_client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'new@jrc.com',
            'password': 'newpass12345',
        }, format='json')
        assert response.status_code == 201
        assert response.data['username'] == 'newuser'

    def test_protected_route_without_token_returns_401(self):
        """Verifica que rotas protegidas retornam 401 sem token."""
        client = APIClient()
        response = client.get('/api/collaborators/')
        assert response.status_code == 401
