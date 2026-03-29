"""Controllers REST para os modelos de negocio do app core.

BaseController fornece CRUD HTTP completo via ModelViewSet.
Controllers especificos configuram service, serializers, filtros e busca.
DashboardStatsView fornece endpoint de estatisticas agregadas.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import (
    AntiVirusFilter,
    CellphoneFilter,
    CollaboratorFilter,
    DataDestroyedFilter,
    EmailFilter,
    MachineFilter,
    PenDriveFilter,
    ServerAccessFilter,
    ServerErpAccessFilter,
    ServerFilter,
    SoftwareFilter,
    WifiFilter,
)
from .models import (
    AntiVirus,
    Cellphone,
    Collaborator,
    CollaboratorMachine,
    CollaboratorSoftware,
    DataDestroyed,
    Email,
    Machine,
    PenDrive,
    Server,
    ServerAccess,
    ServerErpAccess,
    Software,
    Wifi,
)
from .serializers import (
    AntiVirusSerializer,
    CellphoneSerializer,
    CollaboratorCreateSerializer,
    CollaboratorDetailSerializer,
    CollaboratorListSerializer,
    CollaboratorMachineSerializer,
    CollaboratorSoftwareSerializer,
    DataDestroyedSerializer,
    EmailSerializer,
    MachineCreateSerializer,
    MachineDetailSerializer,
    MachineListSerializer,
    PenDriveSerializer,
    ServerAccessSerializer,
    ServerErpAccessSerializer,
    ServerSerializer,
    SoftwareCreateSerializer,
    SoftwareDetailSerializer,
    SoftwareListSerializer,
    WifiSerializer,
)
from .services import (
    AntiVirusService,
    CellphoneService,
    CollaboratorService,
    DashboardService,
    DataDestroyedService,
    EmailService,
    MachineService,
    PenDriveService,
    ServerAccessService,
    ServerErpAccessService,
    ServerService,
    SoftwareService,
    WifiService,
)


class BaseController(viewsets.ModelViewSet):
    """Controller base com CRUD completo e autenticacao obrigatoria.

    Delega create, update e destroy ao service correspondente.
    Nunca acessa o ORM diretamente — sempre via service.

    Attributes:
        service: Instancia do service gerenciado.
    """

    permission_classes = [IsAuthenticated]
    service = None

    def perform_create(self, serializer):
        """Delega criacao ao service."""
        self.service.create(serializer.validated_data)

    def perform_update(self, serializer):
        """Delega atualizacao ao service."""
        self.service.update(self.get_object().pk, serializer.validated_data)

    def perform_destroy(self, instance):
        """Delega soft delete ao service."""
        self.service.delete(instance.pk)


# =============================================================================
# Controllers das 3 Entidades Principais
# =============================================================================


class CollaboratorController(BaseController):
    """Controller REST para o recurso Collaborator.

    Endpoint: /api/collaborators/
    Permissoes: IsAuthenticated (todas as acoes).
    Delega logica de negocio para CollaboratorService.
    """

    queryset = Collaborator.objects.prefetch_related(
        'emails', 'cellphones', 'server_accesses', 'erp_accesses'
    )
    service = CollaboratorService()
    filterset_class = CollaboratorFilter
    search_fields = ['full_name', 'domain_user']
    ordering_fields = ['full_name', 'date_hired']
    ordering = ['full_name']

    def get_serializer_class(self):
        """Retorna serializer adequado por acao.

        Returns:
            Serializer: List para listagem, Detail para retrieve,
                Create para create/update.
        """
        if self.action == 'list':
            return CollaboratorListSerializer
        if self.action == 'retrieve':
            return CollaboratorDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return CollaboratorCreateSerializer
        return CollaboratorListSerializer


class MachineController(BaseController):
    """Controller REST para o recurso Machine.

    Endpoint: /api/machines/
    Permissoes: IsAuthenticated.
    CRITICO: get_queryset usa prefetch_related para evitar N+1.
    """

    service = MachineService()
    filterset_class = MachineFilter
    search_fields = ['hostname', 'model', 'service_tag', 'ip']
    ordering_fields = ['model', 'date_purchase']
    ordering = ['model']

    def get_queryset(self):
        """Retorna queryset com relacoes pre-carregadas para evitar N+1."""
        return Machine.objects.prefetch_related(
            'collaborator_machines__collaborator',
            'antivirus_records',
        )

    def get_serializer_class(self):
        """Retorna serializer adequado por acao."""
        if self.action == 'list':
            return MachineListSerializer
        if self.action == 'retrieve':
            return MachineDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return MachineCreateSerializer
        return MachineListSerializer


class SoftwareController(BaseController):
    """Controller REST para o recurso Software.

    Endpoint: /api/software/
    Permissoes: IsAuthenticated.
    """

    queryset = Software.objects.all()
    service = SoftwareService()
    filterset_class = SoftwareFilter
    search_fields = ['software_name', 'key']
    ordering_fields = ['software_name']
    ordering = ['software_name']

    def get_serializer_class(self):
        """Retorna serializer adequado por acao."""
        if self.action == 'list':
            return SoftwareListSerializer
        if self.action == 'retrieve':
            return SoftwareDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return SoftwareCreateSerializer
        return SoftwareListSerializer


# =============================================================================
# Controllers das 9 Entidades Dependentes
# =============================================================================


class EmailController(BaseController):
    """Controller REST para o recurso Email."""

    queryset = Email.objects.all()
    serializer_class = EmailSerializer
    service = EmailService()
    filterset_class = EmailFilter
    search_fields = ['email']
    ordering = ['email']


class CellphoneController(BaseController):
    """Controller REST para o recurso Cellphone."""

    queryset = Cellphone.objects.all()
    serializer_class = CellphoneSerializer
    service = CellphoneService()
    filterset_class = CellphoneFilter
    search_fields = ['phone_number']
    ordering = ['model']


class WifiController(BaseController):
    """Controller REST para o recurso Wifi."""

    queryset = Wifi.objects.all()
    serializer_class = WifiSerializer
    service = WifiService()
    filterset_class = WifiFilter
    search_fields = ['wifi_name']
    ordering = ['year']


class AntiVirusController(BaseController):
    """Controller REST para o recurso AntiVirus."""

    queryset = AntiVirus.objects.all()
    serializer_class = AntiVirusSerializer
    service = AntiVirusService()
    filterset_class = AntiVirusFilter
    ordering = ['year']


class ServerController(BaseController):
    """Controller REST para o recurso Server."""

    queryset = Server.objects.all()
    serializer_class = ServerSerializer
    service = ServerService()
    filterset_class = ServerFilter
    ordering = ['backup_date']


class ServerAccessController(BaseController):
    """Controller REST para o recurso ServerAccess."""

    queryset = ServerAccess.objects.all()
    serializer_class = ServerAccessSerializer
    service = ServerAccessService()
    filterset_class = ServerAccessFilter


class ServerErpAccessController(BaseController):
    """Controller REST para o recurso ServerErpAccess."""

    queryset = ServerErpAccess.objects.all()
    serializer_class = ServerErpAccessSerializer
    service = ServerErpAccessService()
    filterset_class = ServerErpAccessFilter


class DataDestroyedController(BaseController):
    """Controller REST para o recurso DataDestroyed."""

    queryset = DataDestroyed.objects.all()
    serializer_class = DataDestroyedSerializer
    service = DataDestroyedService()
    filterset_class = DataDestroyedFilter
    ordering = ['when_data_is_destroyed']


class PenDriveController(BaseController):
    """Controller REST para o recurso PenDrive."""

    queryset = PenDrive.objects.all()
    serializer_class = PenDriveSerializer
    service = PenDriveService()
    filterset_class = PenDriveFilter
    ordering = ['checked_date']


# =============================================================================
# Dashboard Stats
# =============================================================================


class DashboardStatsView(APIView):
    """Controller para estatisticas agregadas do dashboard.

    Endpoint: GET /api/dashboard/stats/
    Permissoes: IsAuthenticated.
    Delega logica de negocio para DashboardService.
    """

    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        """Inicializa controller com DashboardService."""
        super().__init__(**kwargs)
        self.service = DashboardService()

    def get(self, request):
        """Retorna KPIs agregados para o dashboard do frontend.

        Returns:
            Response: DashboardStats com contagens e lista de hostnames.
        """
        return Response(self.service.get_stats())
