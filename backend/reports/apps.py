"""Configuracao do app reports."""
from django.apps import AppConfig


class ReportsConfig(AppConfig):
    """Configuracao do app de relatorios de compliance."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reports'
