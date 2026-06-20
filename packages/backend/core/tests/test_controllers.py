"""Testes de controllers do app core.

Valida respostas HTTP, paginacao, campos corretos
e autenticacao para endpoints CRUD.
"""
import pytest
from django.utils import timezone

from core.models import (
    Collaborator,
    CollaboratorMachine,
    Email,
    Machine,
    ServerAccess,
)


def _machine_payload(collaborator_id=None):
    """Monta um payload válido de criação/edição de máquina.

    Args:
        collaborator_id: PK do colaborador a vincular, ou None para
            omitir o campo do payload.

    Returns:
        dict: Dados snake_case aceitos por /api/machines/.
    """
    payload = {
        'model': 'Dell New',
        'type': 'desktop',
        'service_tag': 'NEW0001',
        'operacional_system': 'Windows 11',
        'ram_memory': '16GB',
        'disk_memory': '512GB',
        'ip': '192.168.50.1',
        'mac_address': 'AA:AA:AA:AA:AA:01',
        'administrator': 'TI',
        'cod_jdb': 'JDBN01',
        'date_purchase': timezone.now().isoformat(),
        'quantity': 1,
    }
    if collaborator_id is not None:
        payload['collaborator_id'] = collaborator_id
    return payload


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

    def test_create_machine_with_collaborator(self, api_client, collaborator):
        """Verifica que POST com collaborator_id cria a maquina e o vinculo."""
        response = api_client.post(
            '/api/machines/', _machine_payload(collaborator_id=collaborator.id), format='json'
        )
        assert response.status_code == 201
        machine = Machine.objects.get(service_tag='NEW0001')
        assert CollaboratorMachine.objects.filter(
            machine=machine, collaborator=collaborator
        ).count() == 1
        list_response = api_client.get('/api/machines/')
        item = next(m for m in list_response.data['results'] if m['service_tag'] == 'NEW0001')
        assert item['collaborator_id'] == collaborator.id
        assert item['collaborator_name'] == collaborator.full_name

    def test_create_machine_without_collaborator(self, api_client):
        """Verifica que POST sem collaborator_id nao cria nenhum vinculo."""
        response = api_client.post('/api/machines/', _machine_payload(), format='json')
        assert response.status_code == 201
        machine = Machine.objects.get(service_tag='NEW0001')
        assert machine.collaborator_machines.count() == 0

    def test_create_machine_invalid_collaborator_returns_400(self, api_client):
        """Verifica que collaborator_id inexistente retorna erro de validacao."""
        response = api_client.post(
            '/api/machines/', _machine_payload(collaborator_id=99999), format='json'
        )
        assert response.status_code == 400
        assert 'collaborator_id' in response.data

    def test_update_machine_reassigns_collaborator(self, api_client, machine, collaborator):
        """Verifica que PUT troca o colaborador: antigo removido, novo ativo."""
        CollaboratorMachine.objects.create(machine=machine, collaborator=collaborator)
        other = Collaborator.objects.create(
            full_name='Other User', domain_user='other.user', status=True,
            date_hired=timezone.now(), fired=False, office='TI',
        )
        payload = _machine_payload(collaborator_id=other.id)
        payload.update(
            service_tag=machine.service_tag, ip=machine.ip, mac_address=machine.mac_address
        )
        response = api_client.put(f'/api/machines/{machine.id}/', payload, format='json')
        assert response.status_code == 200
        assert CollaboratorMachine.objects.filter(
            machine=machine, collaborator=other
        ).count() == 1
        assert CollaboratorMachine.objects.filter(
            machine=machine, collaborator=collaborator
        ).count() == 0

    def test_update_machine_removes_collaborator(self, api_client, machine, collaborator):
        """Verifica que PUT com collaborator_id null remove o vinculo."""
        CollaboratorMachine.objects.create(machine=machine, collaborator=collaborator)
        payload = _machine_payload()
        payload['collaborator_id'] = None
        payload.update(
            service_tag=machine.service_tag, ip=machine.ip, mac_address=machine.mac_address
        )
        response = api_client.put(f'/api/machines/{machine.id}/', payload, format='json')
        assert response.status_code == 200
        assert machine.collaborator_machines.count() == 0

    def test_update_machine_restores_soft_deleted_link(self, api_client, machine, collaborator):
        """Verifica que re-atribuir um par soft-deleted nao duplica nem viola constraint."""
        CollaboratorMachine.objects.create(machine=machine, collaborator=collaborator)
        payload = _machine_payload()
        payload.update(
            service_tag=machine.service_tag, ip=machine.ip, mac_address=machine.mac_address
        )
        payload['collaborator_id'] = None
        api_client.put(f'/api/machines/{machine.id}/', payload, format='json')
        payload['collaborator_id'] = collaborator.id
        response = api_client.put(f'/api/machines/{machine.id}/', payload, format='json')
        assert response.status_code == 200
        assert CollaboratorMachine.objects.filter(
            machine=machine, collaborator=collaborator
        ).count() == 1
        assert CollaboratorMachine.all_objects.filter(
            machine=machine, collaborator=collaborator
        ).count() == 1

    def test_detail_returns_collaborator_fields(self, api_client, machine, collaborator):
        """Verifica que o endpoint detail expoe collaborator_id e collaborator_name."""
        CollaboratorMachine.objects.create(machine=machine, collaborator=collaborator)
        response = api_client.get(f'/api/machines/{machine.id}/')
        assert response.status_code == 200
        assert response.data['collaborator_id'] == collaborator.id
        assert response.data['collaborator_name'] == collaborator.full_name


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
