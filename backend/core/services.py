"""Services de logica de negocio para os modelos do app core.

BaseService fornece orquestracao padrao entre controller e repository.
Services especificos herdam e adicionam logica de negocio customizada.
"""
from django.db import transaction

from .repositories import (
    AntiVirusRepository,
    CellphoneRepository,
    CollaboratorMachineRepository,
    CollaboratorRepository,
    CollaboratorSoftwareRepository,
    DataDestroyedRepository,
    EmailRepository,
    MachineRepository,
    PenDriveRepository,
    ServerAccessRepository,
    ServerErpAccessRepository,
    ServerRepository,
    SoftwareRepository,
    WifiRepository,
)


class BaseService:
    """Service base com operacoes CRUD delegadas ao repository.

    Cada service orquestra chamadas ao repository correspondente.
    Logica de negocio (validacoes, transacoes) fica no service,
    nunca no controller ou repository.

    Attributes:
        repository: Instancia do repository gerenciado.
    """

    repository = None

    def list(self):
        """Retorna todos os registros ativos.

        Returns:
            QuerySet: Todos os registros via repository.
        """
        return self.repository.get_all()

    def get(self, pk):
        """Retorna um registro pelo ID.

        Args:
            pk: Chave primaria do registro.

        Returns:
            Model: Instancia do modelo.
        """
        return self.repository.get_by_id(pk)

    def create(self, data):
        """Cria um novo registro.

        Args:
            data: Dicionario com campos do modelo.

        Returns:
            Model: Instancia criada.
        """
        return self.repository.create(**data)

    def update(self, pk, data):
        """Atualiza um registro existente.

        Args:
            pk: Chave primaria do registro.
            data: Dicionario com campos a atualizar.

        Returns:
            Model: Instancia atualizada.
        """
        instance = self.repository.get_by_id(pk)
        return self.repository.update(instance, **data)

    def delete(self, pk):
        """Soft-delete de um registro.

        Args:
            pk: Chave primaria do registro a deletar.
        """
        instance = self.repository.get_by_id(pk)
        self.repository.soft_delete(instance)


# =============================================================================
# Services das 3 Entidades Principais
# =============================================================================


class CollaboratorService(BaseService):
    """Servico de logica de negocio para colaboradores.

    Orquestra operacoes entre CollaboratorRepository e EmailRepository.
    Responsavel por nested creation e regras de negocio.
    """

    def __init__(self):
        """Inicializa service com repositories necessarios."""
        self.repository = CollaboratorRepository()
        self.email_repository = EmailRepository()
        self.collaborator_software_repo = CollaboratorSoftwareRepository()
        self.collaborator_machine_repo = CollaboratorMachineRepository()

    @transaction.atomic
    def create(self, data):
        """Cria colaborador com emails e relacoes N:N em uma transacao.

        Args:
            data: Dicionario com campos do colaborador.
                Pode incluir chave 'emails' com lista de dicts de email,
                'software_ids' com lista de PKs de software,
                'machine_ids' com lista de PKs de maquinas.

        Returns:
            Collaborator: Instancia criada com relacoes associadas.
        """
        emails_data = data.pop('emails', [])
        software_ids = data.pop('software_ids', [])
        machine_ids = data.pop('machine_ids', [])
        collaborator = self.repository.create(**data)
        for email_data in emails_data:
            self.email_repository.create(collaborator=collaborator, **email_data)
        for sw_id in software_ids:
            self.collaborator_software_repo.create(
                collaborator=collaborator, software_id=sw_id
            )
        for mc_id in machine_ids:
            self.collaborator_machine_repo.create(
                collaborator=collaborator, machine_id=mc_id
            )
        return collaborator

    @transaction.atomic
    def update(self, pk, data):
        """Atualiza colaborador e relacoes N:N em uma transacao.

        Args:
            pk: Chave primaria do colaborador.
            data: Dicionario com campos a atualizar.

        Returns:
            Collaborator: Instancia atualizada.
        """
        software_ids = data.pop('software_ids', None)
        machine_ids = data.pop('machine_ids', None)
        instance = self.repository.get_by_id(pk)
        self.repository.update(instance, **data)
        if software_ids is not None:
            for rel in self.collaborator_software_repo.filter(collaborator=instance):
                self.collaborator_software_repo.soft_delete(rel)
            for sw_id in software_ids:
                self.collaborator_software_repo.create(
                    collaborator=instance, software_id=sw_id
                )
        if machine_ids is not None:
            for rel in self.collaborator_machine_repo.filter(collaborator=instance):
                self.collaborator_machine_repo.soft_delete(rel)
            for mc_id in machine_ids:
                self.collaborator_machine_repo.create(
                    collaborator=instance, machine_id=mc_id
                )
        return instance


class MachineService(BaseService):
    """Servico de logica de negocio para maquinas."""

    def __init__(self):
        """Inicializa service com MachineRepository."""
        self.repository = MachineRepository()


class SoftwareService(BaseService):
    """Servico de logica de negocio para software."""

    def __init__(self):
        """Inicializa service com SoftwareRepository."""
        self.repository = SoftwareRepository()


# =============================================================================
# Services das 9 Entidades Dependentes
# =============================================================================


class EmailService(BaseService):
    """Servico de logica de negocio para e-mails."""

    def __init__(self):
        """Inicializa service com EmailRepository."""
        self.repository = EmailRepository()


class CellphoneService(BaseService):
    """Servico de logica de negocio para celulares."""

    def __init__(self):
        """Inicializa service com CellphoneRepository."""
        self.repository = CellphoneRepository()


class WifiService(BaseService):
    """Servico de logica de negocio para WiFi."""

    def __init__(self):
        """Inicializa service com WifiRepository."""
        self.repository = WifiRepository()


class AntiVirusService(BaseService):
    """Servico de logica de negocio para antivirus."""

    def __init__(self):
        """Inicializa service com AntiVirusRepository."""
        self.repository = AntiVirusRepository()


class ServerService(BaseService):
    """Servico de logica de negocio para servidores."""

    def __init__(self):
        """Inicializa service com ServerRepository."""
        self.repository = ServerRepository()


class ServerAccessService(BaseService):
    """Servico de logica de negocio para acesso a servidor."""

    def __init__(self):
        """Inicializa service com ServerAccessRepository."""
        self.repository = ServerAccessRepository()


class ServerErpAccessService(BaseService):
    """Servico de logica de negocio para acesso ERP."""

    def __init__(self):
        """Inicializa service com ServerErpAccessRepository."""
        self.repository = ServerErpAccessRepository()


class DataDestroyedService(BaseService):
    """Servico de logica de negocio para destruicao de dados."""

    def __init__(self):
        """Inicializa service com DataDestroyedRepository."""
        self.repository = DataDestroyedRepository()


class PenDriveService(BaseService):
    """Servico de logica de negocio para pendrives."""

    def __init__(self):
        """Inicializa service com PenDriveRepository."""
        self.repository = PenDriveRepository()


# =============================================================================
# Dashboard
# =============================================================================


class DashboardService:
    """Servico de logica de negocio para estatisticas do dashboard.

    Encapsula queries agregadas que alimentam o endpoint
    GET /api/dashboard/stats/. Acessa dados via repositories.
    """

    def __init__(self):
        """Inicializa service com repositories necessarios."""
        self.collaborator_repo = CollaboratorRepository()
        self.machine_repo = MachineRepository()
        self.software_repo = SoftwareRepository()

    def get_stats(self):
        """Retorna KPIs agregados para o dashboard do frontend.

        Returns:
            dict: Contagens de colaboradores, maquinas, software,
                relatorios e lista de maquinas sem criptografia.
        """
        from reports.repositories import ReportRepository
        report_repo = ReportRepository()

        return {
            'active_collaborators': self.collaborator_repo.get_active().count(),
            'total_collaborators': self.collaborator_repo.get_all().count(),
            'total_machines': self.machine_repo.get_all().count(),
            'total_software': self.software_repo.get_all().count(),
            'pending_reports': report_repo.filter_by_status('pending').count(),
            'total_reports': report_repo.get_all().count(),
            'machines_without_encryption': list(
                self.machine_repo.get_without_encryption()
            ),
        }
