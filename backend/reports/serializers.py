"""Serializer para metadados de relatorios de compliance."""
from rest_framework import serializers

from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    """Serializer de leitura para Report.

    Retorna campos conforme contrato do frontend:
    id, number, name, name_jp, category, last_generated, status.
    """

    class Meta:
        model = Report
        fields = ['id', 'number', 'name', 'name_jp', 'category', 'last_generated', 'status']
