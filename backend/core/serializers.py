"""Serializers base e especificos para os modelos de negocio.

BaseSerializer fornece configuracao padrao. Serializers de listagem
mapeiam campos do modelo para o contrato do frontend (snake_case).
Serializers de detalhe incluem relacoes aninhadas.
"""
from django.utils import timezone
from rest_framework import serializers

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


class BaseSerializer(serializers.ModelSerializer):
    """Serializer base para todos os modelos do app core.

    Define campos de auditoria como somente leitura e
    inclui todos os campos do modelo por padrao.
    """

    class Meta:
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at']


# =============================================================================
# Serializers de Listagem (mapeamento frontend ↔ model)
# =============================================================================


class CollaboratorListSerializer(serializers.ModelSerializer):
    """Serializer de listagem de colaboradores para o frontend.

    Mapeia campos do modelo para o contrato MSW:
    name←full_name, department←office, has_internet_access←perm_acess_internet.
    Campos computed: has_server_access, has_erp_access, has_cellphone, email.
    """

    name = serializers.CharField(source='full_name', read_only=True)
    department = serializers.CharField(source='office', read_only=True)
    has_internet_access = serializers.BooleanField(source='perm_acess_internet', read_only=True)
    has_server_access = serializers.SerializerMethodField()
    has_erp_access = serializers.SerializerMethodField()
    has_cellphone = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = Collaborator
        fields = [
            'id', 'name', 'domain_user', 'department', 'status', 'fired',
            'has_server_access', 'has_erp_access', 'has_internet_access',
            'has_cellphone', 'email',
        ]

    def get_has_server_access(self, obj):
        """Verifica se colaborador tem acesso ao servidor de arquivos.

        Usa relacao prefetched para evitar N+1 queries.
        """
        return obj.server_accesses.all().exists()

    def get_has_erp_access(self, obj):
        """Verifica se colaborador tem acesso ao ERP.

        Usa relacao prefetched para evitar N+1 queries.
        """
        return obj.erp_accesses.all().exists()

    def get_has_cellphone(self, obj):
        """Verifica se colaborador tem celular corporativo.

        Usa relacao prefetched para evitar N+1 queries.
        """
        return obj.cellphones.all().exists()

    def get_email(self, obj):
        """Retorna o primeiro e-mail do colaborador ou None.

        Usa relacao prefetched para evitar N+1 queries.
        """
        emails = obj.emails.all()
        return emails[0].email if emails else None


class MachineListSerializer(serializers.ModelSerializer):
    """Serializer de listagem de maquinas para o frontend.

    Mapeia: operational_system←operacional_system, machine_type←type.
    Campos computed: encrypted, antivirus, collaborator_id, collaborator_name.
    CRITICO: Requer prefetch_related no controller para evitar N+1.
    """

    operational_system = serializers.CharField(source='operacional_system', read_only=True)
    machine_type = serializers.CharField(source='type', read_only=True)
    encrypted = serializers.SerializerMethodField()
    antivirus = serializers.SerializerMethodField()
    collaborator_id = serializers.SerializerMethodField()
    collaborator_name = serializers.SerializerMethodField()

    class Meta:
        model = Machine
        fields = [
            'id', 'hostname', 'model', 'service_tag', 'ip', 'mac_address',
            'operational_system', 'encrypted', 'antivirus',
            'collaborator_id', 'collaborator_name', 'machine_type',
        ]

    def get_encrypted(self, obj):
        """Verifica se a maquina tem alguma criptografia ativa."""
        return obj.crypto_disk or obj.crypto_usb or obj.crypto_memory_card

    def get_antivirus(self, obj):
        """Verifica se a maquina tem registro de antivirus no ano corrente.

        Usa relacao prefetched e filtra em Python para evitar N+1.
        """
        current_year = timezone.now().year
        return any(r.year == current_year for r in obj.antivirus_records.all())

    def get_collaborator_id(self, obj):
        """Retorna ID do primeiro colaborador associado ou None.

        Usa relacao prefetched para evitar N+1 queries.
        """
        rels = obj.collaborator_machines.all()
        return rels[0].collaborator_id if rels else None

    def get_collaborator_name(self, obj):
        """Retorna nome do primeiro colaborador associado ou None.

        Usa relacao prefetched para evitar N+1 queries.
        """
        rels = obj.collaborator_machines.all()
        return rels[0].collaborator.full_name if rels else None


class SoftwareListSerializer(serializers.ModelSerializer):
    """Serializer de listagem de software para o frontend.

    Mapeia: license_key←key, license_type←type_licence, in_use←on_use.
    expires_at e campo direto (novo no modelo).
    """

    license_key = serializers.CharField(source='key', read_only=True)
    license_type = serializers.CharField(source='type_licence', read_only=True)
    in_use = serializers.IntegerField(source='on_use', read_only=True)

    class Meta:
        model = Software
        fields = [
            'id', 'software_name', 'license_key', 'license_type',
            'quantity', 'in_use', 'expires_at',
        ]


# =============================================================================
# Serializers de Detalhe (com relacoes aninhadas)
# =============================================================================


class EmailSerializer(BaseSerializer):
    """Serializer para Email."""

    class Meta(BaseSerializer.Meta):
        model = Email


class CellphoneSerializer(BaseSerializer):
    """Serializer para Cellphone."""

    class Meta(BaseSerializer.Meta):
        model = Cellphone


class CollaboratorDetailSerializer(serializers.ModelSerializer):
    """Serializer completo de colaborador com relacoes aninhadas.

    Inclui emails e cellphones aninhados (leitura).
    Aceita software_ids e machine_ids para gerenciar relacoes N:N.
    """

    emails = EmailSerializer(many=True, read_only=True)
    cellphones = CellphoneSerializer(many=True, read_only=True)
    software_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )
    machine_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )

    class Meta:
        model = Collaborator
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at']


class CollaboratorCreateSerializer(serializers.ModelSerializer):
    """Serializer de criacao de colaborador com nested emails.

    Aceita lista de emails para criacao atomica via service.
    Aceita software_ids e machine_ids para relacoes N:N.
    """

    emails = EmailSerializer(many=True, required=False)
    software_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )
    machine_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )

    class Meta:
        model = Collaborator
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at']


class MachineDetailSerializer(BaseSerializer):
    """Serializer completo de maquina."""

    class Meta(BaseSerializer.Meta):
        model = Machine


class MachineCreateSerializer(BaseSerializer):
    """Serializer de criacao de maquina."""

    class Meta(BaseSerializer.Meta):
        model = Machine


class SoftwareDetailSerializer(BaseSerializer):
    """Serializer completo de software."""

    class Meta(BaseSerializer.Meta):
        model = Software


class SoftwareCreateSerializer(BaseSerializer):
    """Serializer de criacao de software."""

    class Meta(BaseSerializer.Meta):
        model = Software


# =============================================================================
# Serializers das 9 Entidades Dependentes
# =============================================================================


class WifiSerializer(BaseSerializer):
    """Serializer para Wifi."""

    class Meta(BaseSerializer.Meta):
        model = Wifi


class AntiVirusSerializer(BaseSerializer):
    """Serializer para AntiVirus."""

    class Meta(BaseSerializer.Meta):
        model = AntiVirus


class ServerSerializer(BaseSerializer):
    """Serializer para Server."""

    class Meta(BaseSerializer.Meta):
        model = Server


class ServerAccessSerializer(BaseSerializer):
    """Serializer para ServerAccess."""

    class Meta(BaseSerializer.Meta):
        model = ServerAccess


class ServerErpAccessSerializer(BaseSerializer):
    """Serializer para ServerErpAccess."""

    class Meta(BaseSerializer.Meta):
        model = ServerErpAccess


class DataDestroyedSerializer(BaseSerializer):
    """Serializer para DataDestroyed."""

    class Meta(BaseSerializer.Meta):
        model = DataDestroyed


class PenDriveSerializer(BaseSerializer):
    """Serializer para PenDrive."""

    class Meta(BaseSerializer.Meta):
        model = PenDrive


class CollaboratorSoftwareSerializer(BaseSerializer):
    """Serializer para CollaboratorSoftware."""

    class Meta(BaseSerializer.Meta):
        model = CollaboratorSoftware


class CollaboratorMachineSerializer(BaseSerializer):
    """Serializer para CollaboratorMachine."""

    class Meta(BaseSerializer.Meta):
        model = CollaboratorMachine
