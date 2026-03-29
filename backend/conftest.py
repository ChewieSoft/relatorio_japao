"""Fixtures compartilhadas para testes do backend.

Fornece api_client autenticado e factories para
as 3 entidades principais (Collaborator, Machine, Software).
"""
from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Collaborator, Machine, Software


@pytest.fixture
def user(db):
    """Cria usuario de teste.

    Returns:
        User: Usuario com username='testuser' e password='testpass123'.
    """
    return User.objects.create_user(
        username='testuser',
        email='test@jrc.com',
        password='testpass123',
    )


@pytest.fixture
def admin_user(db):
    """Cria usuario admin de teste.

    Returns:
        User: Superusuario com username='admin' e password='admin123'.
    """
    return User.objects.create_superuser(
        username='admin',
        email='admin@jrc.com',
        password='admin123',
    )


@pytest.fixture
def api_client(user):
    """Cria APIClient autenticado com usuario de teste.

    Args:
        user: Fixture de usuario de teste.

    Returns:
        APIClient: Cliente autenticado via force_authenticate.
    """
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def unauthenticated_client():
    """Cria APIClient sem autenticacao.

    Returns:
        APIClient: Cliente nao autenticado.
    """
    return APIClient()


@pytest.fixture
def collaborator(db):
    """Cria colaborador de teste.

    Returns:
        Collaborator: Colaborador ativo com dados minimos.
    """
    return Collaborator.objects.create(
        full_name='Test User',
        domain_user='test.user',
        status=True,
        perm_acess_internet=True,
        date_hired=timezone.now(),
        fired=False,
        office='TI',
    )


@pytest.fixture
def machine(db):
    """Cria maquina de teste.

    Returns:
        Machine: Maquina com dados minimos e criptografia parcial.
    """
    return Machine.objects.create(
        hostname='PC-TEST-001',
        model='Dell Test',
        type='notebook',
        service_tag='TST0001',
        operacional_system='Windows 11',
        ram_memory='16GB',
        disk_memory='512GB',
        ip='192.168.99.1',
        mac_address='FF:FF:FF:FF:FF:01',
        administrator='Test Admin',
        cod_jdb='JDBT01',
        date_purchase=timezone.now(),
        crypto_disk=True,
        crypto_usb=False,
        crypto_memory_card=False,
    )


@pytest.fixture
def software(db):
    """Cria software de teste.

    Returns:
        Software: Licenca de software com dados minimos.
    """
    return Software.objects.create(
        software_name='Test Software',
        key='XXXXX-TEST-KEY',
        quantity=10,
        type_licence='subscription',
        quantity_purchase=10,
        last_purchase_date=timezone.now(),
        on_use=5,
        departament='TI',
        expires_at=timezone.now() + timedelta(days=365),
    )
