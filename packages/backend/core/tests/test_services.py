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
