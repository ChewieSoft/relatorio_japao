"""Configuracao do app core."""
from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Configuracao do app de modelos de negocio e CRUD."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
