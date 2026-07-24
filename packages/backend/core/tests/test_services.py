"""Testes de services do app core.

Valida nested creation atomica e soft delete via service.
"""
import pytest
from django.utils import timezone

from core.models import Collaborator, Email
from core.services import CollaboratorService


service = CollaboratorService()


@pytest.mark.django_db
class TestCollaboratorService:
    """Testes do CollaboratorService."""

    def test_create_with_emails(self):
        """Verifica nested creation de colaborador com emails."""
        data = {
            'full_name': 'Service Test User',
            'domain_user': 'service.test',
            'status': True,
            'date_hired': timezone.now(),
            'office': 'TI',
            'emails': [
                {
                    'email': 'service@jrc.com',
                    'remark': 'Test',
                    'email_creation': timezone.now(),
                },
            ],
        }
        collab = service.create(data)
        assert collab.pk is not None
        assert collab.emails.count() == 1

    def test_nested_creation_atomic_rollback(self):
        """Verifica que falha na criacao de email reverte o colaborador."""
        data = {
            'full_name': 'Atomic Test User',
            'domain_user': 'atomic.test',
            'status': True,
            'date_hired': timezone.now(),
            'office': 'TI',
            'emails': [
                {
                    'email': 'atomic@jrc.com',
                    'remark': 'Test',
                    # email_creation ausente — deve causar erro
                },
            ],
        }
        with pytest.raises(Exception):
            service.create(data)
        assert Collaborator.objects.filter(domain_user='atomic.test').count() == 0

    def test_soft_delete_via_service(self, collaborator):
        """Verifica que delete via service faz soft delete."""
        service.delete(collaborator.pk)
        collaborator.refresh_from_db()
        assert collaborator.deleted_at is not None
        assert Collaborator.objects.filter(pk=collaborator.pk).count() == 0

    def test_create_fired_forces_inactive(self):
        """Verifica que criar colaborador desligado grava status inativo.

        Mesmo com status=True no payload, um colaborador com fired=True deve
        ser persistido como inativo (invariante de negocio: desligado e inativo).
        """
        data = {
            'full_name': 'Fired On Create',
            'domain_user': 'fired.create',
            'status': True,
            'fired': True,
            'date_hired': timezone.now(),
            'office': 'TI',
        }
        collab = service.create(data)
        collab.refresh_from_db()
        assert collab.fired is True
        assert collab.status is False

    def test_update_fired_forces_inactive(self, collaborator):
        """Verifica que desligar via update forca status inativo e persiste.

        Envia apenas 'fired' no payload (update parcial) e confirma que o
        campo status vai para False e e efetivamente gravado no banco.
        """
        assert collaborator.status is True
        service.update(collaborator.pk, {'fired': True})
        collaborator.refresh_from_db()
        assert collaborator.fired is True
        assert collaborator.status is False

    def test_update_not_fired_preserves_status(self, collaborator):
        """Verifica que update sem desligamento preserva o status enviado."""
        service.update(collaborator.pk, {'fired': False, 'status': True})
        collaborator.refresh_from_db()
        assert collaborator.fired is False
        assert collaborator.status is True

    def test_update_status_only_cannot_reactivate_fired(self):
        """Verifica que update parcial de status nao reativa colaborador desligado.

        Reproduz o cenario de update parcial (PATCH) que envia apenas 'status'
        sem 'fired': para um colaborador ja desligado, a invariante deve recorrer
        ao 'fired' persistido na instancia e manter status=False, fechando a
        brecha em que um status-only reativava um desligado (DJR-177).
        """
        collab = service.create({
            'full_name': 'Fired Persisted',
            'domain_user': 'fired.persisted',
            'status': True,
            'fired': True,
            'date_hired': timezone.now().date(),
            'office': 'TI',
        })
        collab.refresh_from_db()
        assert collab.fired is True
        assert collab.status is False
        service.update(collab.pk, {'status': True})
        collab.refresh_from_db()
        assert collab.fired is True
        assert collab.status is False
