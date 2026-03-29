"""Repositorio de acesso a dados de relatorios.

ReportRepository NAO herda BaseRepository pois Report
nao herda BaseModel (nao tem soft delete).
"""
from .models import Report


class ReportRepository:
    """Repositorio standalone para metadados de relatorios.

    Report nao herda BaseModel (registros fixos de configuracao),
    portanto este repositorio nao estende BaseRepository.

    Attributes:
        model: Modelo Report.
    """

    model = Report

    def get_all(self):
        """Retorna todos os relatorios ordenados por numero.

        Returns:
            QuerySet[Report]: Todos os 19 relatorios.
        """
        return self.model.objects.all()

    def get_by_number(self, number):
        """Retorna um relatorio pelo numero identificador.

        Args:
            number: Numero do relatorio (ex: '08', '13').

        Returns:
            Report: Instancia do relatorio.

        Raises:
            Report.DoesNotExist: Se o relatorio nao existe.
        """
        return self.model.objects.get(number=number)

    def update_status(self, instance, status, last_generated):
        """Atualiza status e data de geracao de um relatorio.

        Args:
            instance: Instancia do Report.
            status: Novo status ('pending', 'generated', 'sent').
            last_generated: Data/hora da geracao.

        Returns:
            Report: Instancia atualizada.
        """
        instance.status = status
        instance.last_generated = last_generated
        instance.save(update_fields=['status', 'last_generated'])
        return instance
