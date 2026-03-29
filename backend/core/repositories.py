"""Repositorios de acesso a dados para os modelos de negocio.

BaseRepository fornece operacoes CRUD padrao com soft delete.
Repositorios especificos herdam e adicionam queries customizadas.
"""
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


class BaseRepository:
    """Repositorio base com operacoes CRUD e soft delete.

    Encapsula todo acesso ao ORM Django. Controllers e services
    nunca acessam o ORM diretamente — sempre via repository.

    Attributes:
        model: Modelo Django gerenciado por este repositorio.
    """

    model = None

    def get_all(self):
        """Retorna todos os registros ativos (soft delete filtrado).

        Returns:
            QuerySet: Registros com deleted_at IS NULL.
        """
        return self.model.objects.all()

    def get_by_id(self, pk):
        """Retorna um registro pelo ID.

        Args:
            pk: Chave primaria do registro.

        Returns:
            Model: Instancia do modelo.

        Raises:
            Model.DoesNotExist: Se o registro nao existe ou foi soft-deleted.
        """
        return self.model.objects.get(pk=pk)

    def create(self, **data):
        """Cria um novo registro.

        Args:
            **data: Campos do modelo como keyword arguments.

        Returns:
            Model: Instancia criada.
        """
        return self.model.objects.create(**data)

    def update(self, instance, **data):
        """Atualiza campos de um registro existente.

        Args:
            instance: Instancia do modelo a atualizar.
            **data: Campos a atualizar como keyword arguments.

        Returns:
            Model: Instancia atualizada.
        """
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save(update_fields=list(data.keys()) + ['updated_at'])
        return instance

    def soft_delete(self, instance):
        """Marca um registro como deletado (soft delete).

        Args:
            instance: Instancia do modelo a deletar.
        """
        instance.soft_delete()

    def filter(self, **kwargs):
        """Filtra registros por campos arbitrarios.

        Args:
            **kwargs: Filtros do ORM Django.

        Returns:
            QuerySet: Registros filtrados.
        """
        return self.model.objects.filter(**kwargs)


# =============================================================================
# Repositorios das 3 Entidades Principais
# =============================================================================


class CollaboratorRepository(BaseRepository):
    """Repositorio de acesso a dados de colaboradores.

    Encapsula queries ao modelo Collaborator, incluindo
    filtros por status e prefetch de relacoes.

    Attributes:
        model: Modelo Collaborator.
    """

    model = Collaborator

    def get_active(self):
        """Retorna colaboradores ativos e nao demitidos.

        Returns:
            QuerySet[Collaborator]: Colaboradores com status=True e fired=False.
        """
        return self.model.objects.filter(status=True, fired=False)

    def get_with_emails(self, pk):
        """Retorna colaborador com emails pre-carregados.

        Args:
            pk: Chave primaria do colaborador.

        Returns:
            Collaborator: Instancia com emails prefetched.
        """
        return self.model.objects.prefetch_related('emails').get(pk=pk)

    def get_domain_users(self):
        """Retorna lista de usuarios de dominio.

        Returns:
            QuerySet: Valores de full_name, domain_user, status.
        """
        return self.model.objects.values('full_name', 'domain_user', 'status')


class MachineRepository(BaseRepository):
    """Repositorio de acesso a dados de maquinas.

    Override de get_all() com prefetch_related para evitar N+1
    nos campos computed (antivirus, collaborator_id/name).

    Attributes:
        model: Modelo Machine.
    """

    model = Machine

    def get_all(self):
        """Retorna todas as maquinas com relacoes pre-carregadas.

        Prefetch de collaborator_machines e antivirus_records
        para evitar N+1 nos SerializerMethodFields.

        Returns:
            QuerySet[Machine]: Maquinas com relacoes prefetched.
        """
        return self.model.objects.prefetch_related(
            'collaborator_machines__collaborator',
            'antivirus_records',
        )


class SoftwareRepository(BaseRepository):
    """Repositorio de acesso a dados de software.

    Herda CRUD padrao de BaseRepository sem customizacoes.

    Attributes:
        model: Modelo Software.
    """

    model = Software


# =============================================================================
# Repositorios das 9 Entidades Dependentes
# =============================================================================


class EmailRepository(BaseRepository):
    """Repositorio de acesso a dados de e-mails."""

    model = Email


class CellphoneRepository(BaseRepository):
    """Repositorio de acesso a dados de celulares."""

    model = Cellphone


class WifiRepository(BaseRepository):
    """Repositorio de acesso a dados de WiFi."""

    model = Wifi


class AntiVirusRepository(BaseRepository):
    """Repositorio de acesso a dados de antivirus."""

    model = AntiVirus


class ServerRepository(BaseRepository):
    """Repositorio de acesso a dados de servidores."""

    model = Server


class ServerAccessRepository(BaseRepository):
    """Repositorio de acesso a dados de acesso a servidor."""

    model = ServerAccess


class ServerErpAccessRepository(BaseRepository):
    """Repositorio de acesso a dados de acesso ERP."""

    model = ServerErpAccess


class DataDestroyedRepository(BaseRepository):
    """Repositorio de acesso a dados de destruicao de dados."""

    model = DataDestroyed


class PenDriveRepository(BaseRepository):
    """Repositorio de acesso a dados de pendrives."""

    model = PenDrive


class CollaboratorSoftwareRepository(BaseRepository):
    """Repositorio de acesso a dados de relacao colaborador-software."""

    model = CollaboratorSoftware


class CollaboratorMachineRepository(BaseRepository):
    """Repositorio de acesso a dados de relacao colaborador-maquina."""

    model = CollaboratorMachine
