"""Controllers REST para relatorios de compliance.

ReportListController lista os 19 relatorios.
ReportGenerateView atualiza status de um relatorio para 'generated'.
Endpoint de exportacao PDF/Excel retorna 501 (implementacao na spec 003).
"""
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ReportSerializer
from .services import ReportService


class ReportListController(ListAPIView):
    """Controller de listagem dos 19 relatorios de compliance.

    Endpoint: GET /api/reports/
    Permissoes: IsAuthenticated.
    Retorna todos os relatorios com metadados.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ReportSerializer

    def __init__(self, **kwargs):
        """Inicializa controller com ReportService."""
        super().__init__(**kwargs)
        self.service = ReportService()

    def get_queryset(self):
        """Retorna todos os relatorios via service.

        Returns:
            QuerySet[Report]: Todos os 19 relatorios.
        """
        return self.service.list()


class ReportGenerateView(APIView):
    """Controller para geracao de um relatorio.

    Endpoint: POST /api/reports/<number>/generate/
    Permissoes: IsAuthenticated.
    Atualiza status para 'generated' e define last_generated.
    """

    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        """Inicializa controller com ReportService."""
        super().__init__(**kwargs)
        self.service = ReportService()

    def post(self, request, number):
        """Gera (marca como gerado) um relatorio especifico.

        Args:
            request: Request HTTP.
            number: Numero do relatorio (ex: '08').

        Returns:
            Response: Status e last_generated atualizados.
        """
        report = self.service.generate(number)
        return Response({
            'status': report.status,
            'last_generated': report.last_generated,
        })


class ReportExportView(APIView):
    """Placeholder para exportacao de relatorio em PDF/Excel.

    Endpoint: GET /api/reports/<number>/
    Sera implementado na spec 003 (reports-export).
    Retorna 501 Not Implemented por enquanto.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, number):
        """Retorna 501 — exportacao sera implementada na spec 003.

        Args:
            request: Request HTTP com query param 'format'.
            number: Numero do relatorio.

        Returns:
            Response: 501 Not Implemented.
        """
        export_format = request.query_params.get('format')
        if export_format in ('pdf', 'xlsx'):
            return Response(
                {'detail': f'Export {export_format} not implemented yet. See spec 003.'},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )
        return Response(
            {'detail': 'Use ?format=pdf or ?format=xlsx'},
            status=status.HTTP_400_BAD_REQUEST,
        )
