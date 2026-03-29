"""Modelo de metadados dos relatorios de compliance.

Report armazena informacoes sobre os 19 relatorios de auditoria.
NAO herda BaseModel — registros sao fixos e nao precisam de soft delete.
"""
from django.db import models


class Report(models.Model):
    """Metadados de um relatorio de compliance.

    Cada registro representa um dos 19 relatorios exigidos pela
    matriz japonesa. Armazena nome, categoria e status de geracao.
    Nao armazena dados do relatorio em si.

    Attributes:
        number: Numero identificador do relatorio (unique, ex: '08', '13').
        name: Nome do relatorio em portugues.
        name_jp: Nome do relatorio em japones.
        category: Categoria do relatorio.
        status: Estado atual (pending/generated/sent).
        last_generated: Data/hora da ultima geracao.
    """

    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('generated', 'Gerado'),
        ('sent', 'Enviado'),
    ]

    number = models.CharField(max_length=2, unique=True)
    name = models.CharField(max_length=200)
    name_jp = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    last_generated = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"Report {self.number} - {self.name}"
