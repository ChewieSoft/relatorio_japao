"""Service de logica de negocio para relatorios de compliance.

ReportService gerencia listagem e geracao de relatorios.
A geracao real dos dados (queries, PDF, Excel) sera implementada na spec 003.
"""
from django.utils import timezone

from .repositories import ReportRepository


class ReportService:
    """Servico de logica de negocio para relatorios.

    Responsavel por listagem de relatorios e atualizacao de status
    no fluxo de geracao. Queries especificas por relatorio serao
    adicionadas na spec 003 (reports-export).
    """

    def __init__(self):
        """Inicializa service com ReportRepository."""
        self.repository = ReportRepository()

    def list(self):
        """Retorna todos os 19 relatorios.

        Returns:
            QuerySet[Report]: Todos os relatorios ordenados por numero.
        """
        return self.repository.get_all()

    def generate(self, number):
        """Marca um relatorio como gerado.

        Atualiza status para 'generated' e define last_generated
        com a data/hora atual.

        Args:
            number: Numero do relatorio (ex: '08').

        Returns:
            Report: Instancia atualizada com status='generated'.
        """
        report = self.repository.get_by_number(number)
        return self.repository.update_status(
            instance=report,
            status='generated',
            last_generated=timezone.now(),
        )
