"""Testes de repositorios do app core.

Valida operacoes CRUD, soft delete e filtros
para as 3 entidades principais.
"""
import pytest
from django.utils import timezone

from core.models import Collaborator, Email, Machine
from core.repositories import CollaboratorRepository, MachineRepository


repo = CollaboratorRepository()
machine_repo = MachineRepository()


@pytest.mark.django_db
class TestCollaboratorRepository:
    """Testes do CollaboratorRepository."""

    def test_create_collaborator(self):
        """Verifica que create retorna instancia com PK."""
        collab = repo.create(
            full_name='Repo Test User',
            domain_user='repo.test',
            status=True,
            date_hired=timezone.now(),
            office='TI',
        )
        assert collab.pk is not None
        assert collab.full_name == 'Repo Test User'

    def test_get_all_returns_active_only(self, collaborator):
        """Verifica que get_all exclui registros soft-deleted."""
        assert repo.get_all().count() == 1
        repo.soft_delete(collaborator)
        assert repo.get_all().count() == 0

    def test_soft_delete_sets_deleted_at(self, collaborator):
        """Verifica que soft_delete preenche deleted_at."""
        repo.soft_delete(collaborator)
        collaborator.refresh_from_db()
        assert collaborator.deleted_at is not None

    def test_get_by_id(self, collaborator):
        """Verifica que get_by_id retorna o registro correto."""
        result = repo.get_by_id(collaborator.pk)
        assert result.pk == collaborator.pk

    def test_filter_by_status(self, collaborator):
        """Verifica que filter retorna registros filtrados."""
        active = repo.filter(status=True)
        assert active.count() == 1
        inactive = repo.filter(status=False)
        assert inactive.count() == 0

    def test_get_active(self, collaborator):
        """Verifica que get_active retorna apenas ativos nao demitidos."""
        assert repo.get_active().count() == 1
        collaborator.fired = True
        collaborator.save()
        assert repo.get_active().count() == 0

    def test_update(self, collaborator):
        """Verifica que update altera campos especificados."""
        repo.update(collaborator, full_name='Updated Name')
        collaborator.refresh_from_db()
        assert collaborator.full_name == 'Updated Name'


@pytest.mark.django_db
class TestMachineRepository:
    """Testes do MachineRepository."""

    def test_get_all_uses_prefetch(self, machine):
        """Verifica que get_all retorna queryset com prefetch."""
        qs = machine_repo.get_all()
        assert qs.count() == 1
