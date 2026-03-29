"""Serializers base e especificos para os modelos de negocio.

BaseSerializer fornece configuracao padrao herdada por todos os
serializers do app core. Serializers especificos por modelo
serao adicionados nas fases seguintes (US3, US4).
"""
from rest_framework import serializers


class BaseSerializer(serializers.ModelSerializer):
    """Serializer base para todos os modelos do app core.

    Define campos de auditoria como somente leitura e
    inclui todos os campos do modelo por padrao.
    """

    class Meta:
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at']
