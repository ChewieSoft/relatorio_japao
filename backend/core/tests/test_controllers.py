"""Testes de controllers do app core.

Valida respostas HTTP, paginacao, campos corretos
e autenticacao para endpoints CRUD.
"""
import pytest
from django.utils import timezone

from core.models import Collaborator, Email, Machine, ServerAccess


@pytest.mark.django_db
class TestCollaboratorController:
    """Testes do endpoint /api/collaborators/."""

    def test_list_collaborators_paginated(self, api_client, collaborator):
        """Verifica que listagem retorna formato paginado DRF."""
        response = api_client.get('/api/collaborators/')
        assert response.status_code == 200
        assert 'count' in response.data
        assert 'results' in response.data
        assert response.data['count'] == 1

    def test_list_returns_correct_field_names(self, api_client, collaborator):
        """Verifica que campos retornados batem com contrato frontend."""
        response = api_client.get('/api/collaborators/')
        item = response.data['results'][0]
        expected_fields = {
            'id', 'name', 'domain_user', 'department', 'status', 'fired',
            'has_server_access', 'has_erp_access', 'has_internet_access',
            'has_cellphone', 'email',
        }
        assert set(item.keys()) == expected_fields

    def test_list_field_mapping(self, api_client, collaborator):
        """Verifica que aliases de campo mapeiam corretamente."""
        response = api_client.get('/api/collaborators/')
        item = response.data['results'][0]
        assert item['name'] == collaborator.full_name
        assert item['department'] == collaborator.office
        assert item['has_internet_access'] == collaborator.perm_acess_internet

    def test_create_collaborator(self, api_client):
        """Verifica que POST cria colaborador."""
        data = {
            'full_name': 'New User',
            'domain_user': 'new.user',
            'status': True,
            'date_hired': timezone.now().isoformat(),
            'office': 'TI',
        }
        response = api_client.post('/api/collaborators/', data, format='json')
        assert response.status_code == 201

    def test_soft_delete_via_api(self, api_client, collaborator):
        """Verifica que DELETE faz soft delete."""
        response = api_client.delete(f'/api/collaborators/{collaborator.id}/')
        assert response.status_code == 204
        collaborator.refresh_from_db()
        assert collaborator.deleted_at is not None

    def test_unauthenticated_returns_401(self, unauthenticated_client):
        """Verifica que requisicao sem token retorna 401."""
        response = unauthenticated_client.get('/api/collaborators/')
        assert response.status_code == 401

    def test_search_filter(self, api_client, collaborator):
        """Verifica que busca textual funciona."""
        response = api_client.get(f'/api/collaborators/?search={collaborator.full_name[:4]}')
        assert response.status_code == 200
        assert response.data['count'] >= 1

    def test_has_server_access_computed(self, api_client, collaborator):
        """Verifica campo computed has_server_access."""
        response = api_client.get('/api/collaborators/')
        item = response.data['results'][0]
        assert item['has_server_access'] is False

        ServerAccess.objects.create(
            collaborator=collaborator,
            level01=True,
        )
        response = api_client.get('/api/collaborators/')
        item = response.data['results'][0]
        assert item['has_server_access'] is True


@pytest.mark.django_db
class TestMachineController:
    """Testes do endpoint /api/machines/."""

    def test_list_machines_computed_fields(self, api_client, machine):
        """Verifica campos computed encrypted e antivirus."""
        response = api_client.get('/api/machines/')
        assert response.status_code == 200
        item = response.data['results'][0]
        assert item['encrypted'] is True  # machine fixture has crypto_disk=True
        assert item['antivirus'] is False  # no AntiVirus record
        assert item['machine_type'] == 'notebook'

    def test_list_returns_correct_field_names(self, api_client, machine):
        """Verifica que campos retornados batem com contrato frontend."""
        response = api_client.get('/api/machines/')
        item = response.data['results'][0]
        expected_fields = {
            'id', 'hostname', 'model', 'service_tag', 'ip', 'mac_address',
            'operational_system', 'encrypted', 'antivirus',
            'collaborator_id', 'collaborator_name', 'machine_type',
        }
        assert set(item.keys()) == expected_fields


@pytest.mark.django_db
class TestSoftwareController:
    """Testes do endpoint /api/software/."""

    def test_list_returns_correct_field_names(self, api_client, software):
        """Verifica que campos retornados batem com contrato frontend."""
        response = api_client.get('/api/software/')
        item = response.data['results'][0]
        expected_fields = {
            'id', 'software_name', 'license_key', 'license_type',
            'quantity', 'in_use', 'expires_at',
        }
        assert set(item.keys()) == expected_fields

    def test_field_mapping(self, api_client, software):
        """Verifica que aliases de campo mapeiam corretamente."""
        response = api_client.get('/api/software/')
        item = response.data['results'][0]
        assert item['license_key'] == software.key
        assert item['license_type'] == software.type_licence
        assert item['in_use'] == software.on_use
