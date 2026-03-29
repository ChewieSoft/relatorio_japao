"""Modelos de negocio do sistema JRC Brasil.

Define BaseModel (abstrato com soft delete), SoftDeleteManager,
3 entidades principais (Collaborator, Machine, Software),
9 entidades dependentes e 2 tabelas de juncao N:N.
Todos os modelos herdam de BaseModel exceto onde indicado.
"""
from django.db import models
from django.utils import timezone


class SoftDeleteManager(models.Manager):
    """Manager que filtra registros com deleted_at IS NULL por padrao.

    Garante que queries padrao nunca retornem registros soft-deleted.
    Para incluir deletados, usar Model.all_objects.all().
    """

    def get_queryset(self):
        """Retorna queryset filtrado excluindo registros soft-deleted."""
        return super().get_queryset().filter(deleted_at__isnull=True)


class BaseModel(models.Model):
    """Modelo abstrato base com campos de auditoria e soft delete.

    Todos os modelos de negocio herdam desta classe para garantir
    rastreabilidade (created_at, updated_at) e soft delete (deleted_at).

    Attributes:
        created_at: Data/hora de criacao do registro.
        updated_at: Data/hora da ultima atualizacao.
        deleted_at: Data/hora do soft delete (null = ativo).
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def soft_delete(self):
        """Marca o registro como deletado sem remover do banco."""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        """Restaura um registro soft-deleted."""
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])


# =============================================================================
# 3 Entidades Principais
# =============================================================================


class Collaborator(BaseModel):
    """Funcionario da JRC Brasil.

    Representa um colaborador com dados de dominio, status
    e permissoes. Suporta soft delete via BaseModel.

    Attributes:
        full_name: Nome completo do colaborador (unique).
        domain_user: Usuario de dominio Windows (unique).
        status: Se o colaborador esta ativo.
        perm_acess_internet: Permissao de acesso a internet.
        date_hired: Data de contratacao.
        fired: Se o colaborador foi demitido.
        date_fired: Data de demissao (null se ativo).
        acess_wifi: Acesso a rede WiFi.
        admin_privilege: Privilegio de administrador.
        office: Departamento/escritorio do colaborador.
    """

    full_name = models.CharField(max_length=255, unique=True)
    domain_user = models.CharField(max_length=255, unique=True)
    status = models.BooleanField(default=True)
    perm_acess_internet = models.BooleanField(default=False)
    date_hired = models.DateTimeField()
    fired = models.BooleanField(default=False)
    date_fired = models.DateTimeField(null=True, blank=True)
    acess_wifi = models.BooleanField(default=False)
    admin_privilege = models.BooleanField(default=False)
    office = models.CharField(max_length=100)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return self.full_name


class Machine(BaseModel):
    """Computador ou notebook do inventario JRC.

    Armazena dados de hardware, rede e criptografia.
    Campo hostname adicionado para identificacao de rede.

    Attributes:
        hostname: Nome de rede do computador (campo novo).
        model: Modelo do equipamento.
        type: Tipo (desktop/notebook).
        service_tag: Tag de servico do fabricante (unique).
        operacional_system: Sistema operacional instalado.
        ram_memory: Capacidade de memoria RAM.
        disk_memory: Capacidade de armazenamento.
        ip: Endereco IP na rede (unique).
        mac_address: Endereco MAC da placa de rede (unique).
        administrator: Nome do administrador responsavel.
        cod_jdb: Codigo JDB do equipamento.
        date_purchase: Data de compra.
        quantity: Quantidade.
        crypto_disk: Se o disco esta criptografado.
        crypto_usb: Se portas USB estao criptografadas.
        crypto_memory_card: Se cartao de memoria esta criptografado.
        sold_out: Se o equipamento foi vendido/descartado.
        date_sold_out: Data de venda/descarte.
    """

    hostname = models.CharField(max_length=255, blank=True, default='')
    model = models.CharField(max_length=255)
    type = models.CharField(max_length=50)
    service_tag = models.CharField(max_length=100, unique=True)
    operacional_system = models.CharField(max_length=100)
    ram_memory = models.CharField(max_length=50)
    disk_memory = models.CharField(max_length=50)
    ip = models.CharField(max_length=45, unique=True)
    mac_address = models.CharField(max_length=17, unique=True)
    administrator = models.CharField(max_length=255)
    cod_jdb = models.CharField(max_length=50)
    date_purchase = models.DateTimeField()
    quantity = models.IntegerField(default=1)
    crypto_disk = models.BooleanField(default=False)
    crypto_usb = models.BooleanField(default=False)
    crypto_memory_card = models.BooleanField(default=False)
    sold_out = models.BooleanField(default=False)
    date_sold_out = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['model']

    def __str__(self):
        return f"{self.hostname or self.model} ({self.service_tag})"


class Software(BaseModel):
    """Licenca de software gerenciada pela JRC.

    Controla quantidade de licencas compradas, em uso e data de expiracao.
    Campo expires_at e novo (distinto de last_purchase_date).

    Attributes:
        software_name: Nome do software.
        key: Chave de licenca.
        quantity: Quantidade total de licencas.
        type_licence: Tipo de licenca (perpetual/subscription/oem).
        quantity_purchase: Quantidade comprada.
        last_purchase_date: Data da ultima compra.
        on_use: Quantidade em uso.
        departament: Departamento que utiliza.
        observation: Observacoes adicionais.
        expires_at: Data de expiracao da licenca (null para perpetual/OEM).
    """

    software_name = models.CharField(max_length=255, null=True, blank=True)
    key = models.CharField(max_length=255)
    quantity = models.IntegerField(default=0)
    type_licence = models.CharField(max_length=50)
    quantity_purchase = models.IntegerField(default=0)
    last_purchase_date = models.DateTimeField()
    on_use = models.IntegerField(default=0)
    departament = models.CharField(max_length=100)
    observation = models.TextField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['software_name']

    def __str__(self):
        return self.software_name or self.key


# =============================================================================
# 9 Entidades Dependentes
# =============================================================================


class Email(BaseModel):
    """E-mail corporativo de um colaborador.

    Attributes:
        collaborator: Colaborador dono do e-mail.
        email: Endereco de e-mail.
        remark: Observacao sobre o e-mail.
        email_creation: Data de criacao do e-mail.
        until: Data de validade (null se permanente).
    """

    collaborator = models.ForeignKey(
        Collaborator, on_delete=models.PROTECT, related_name='emails'
    )
    email = models.CharField(max_length=255)
    remark = models.CharField(max_length=255, blank=True)
    email_creation = models.DateTimeField()
    until = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.email


class Cellphone(BaseModel):
    """Celular corporativo de um colaborador.

    Attributes:
        collaborator: Colaborador dono do celular.
        model: Modelo do aparelho.
        operacional_system: Sistema operacional do celular.
        phone_number: Numero do telefone.
        status: Se o celular esta ativo.
        approved: Se o celular foi aprovado.
        have_password: Se possui senha configurada.
        first_sinc: Primeira sincronizacao.
        device_id: Identificador do dispositivo.
    """

    collaborator = models.ForeignKey(
        Collaborator, on_delete=models.PROTECT, related_name='cellphones'
    )
    model = models.CharField(max_length=255)
    operacional_system = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    status = models.BooleanField(default=True)
    approved = models.BooleanField(default=False)
    have_password = models.BooleanField(default=False)
    first_sinc = models.CharField(max_length=255, blank=True)
    device_id = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.model} ({self.phone_number})"


class Wifi(BaseModel):
    """Registro mensal de acesso WiFi de um colaborador.

    Cada registro cobre 12 meses de um ano especifico.

    Attributes:
        collaborator: Colaborador associado.
        wifi_name: Nome da rede WiFi.
        protection: Tipo de protecao da rede.
        january..december: Acesso mensal (boolean).
        year: Ano de referencia.
    """

    collaborator = models.ForeignKey(
        Collaborator, on_delete=models.PROTECT, related_name='wifi_records'
    )
    wifi_name = models.CharField(max_length=100)
    protection = models.CharField(max_length=100)
    january = models.BooleanField(default=False)
    february = models.BooleanField(default=False)
    march = models.BooleanField(default=False)
    april = models.BooleanField(default=False)
    may = models.BooleanField(default=False)
    june = models.BooleanField(default=False)
    july = models.BooleanField(default=False)
    august = models.BooleanField(default=False)
    september = models.BooleanField(default=False)
    october = models.BooleanField(default=False)
    november = models.BooleanField(default=False)
    december = models.BooleanField(default=False)
    year = models.IntegerField()

    def __str__(self):
        return f"{self.wifi_name} ({self.year})"


class AntiVirus(BaseModel):
    """Registro mensal de antivirus de uma maquina.

    Rastreia atualizacoes e verificacoes mensais do antivirus.
    24 campos booleanos: 12 para atualizacao + 12 para verificacao.

    Attributes:
        machine: Maquina associada.
        january_updated..december_updated: Atualizacao mensal.
        january_check..december_check: Verificacao mensal.
        year: Ano de referencia.
    """

    machine = models.ForeignKey(
        Machine, on_delete=models.PROTECT, related_name='antivirus_records'
    )
    january_updated = models.BooleanField(default=False)
    february_updated = models.BooleanField(default=False)
    march_updated = models.BooleanField(default=False)
    april_updated = models.BooleanField(default=False)
    may_updated = models.BooleanField(default=False)
    june_updated = models.BooleanField(default=False)
    july_updated = models.BooleanField(default=False)
    august_updated = models.BooleanField(default=False)
    september_updated = models.BooleanField(default=False)
    october_updated = models.BooleanField(default=False)
    november_updated = models.BooleanField(default=False)
    december_updated = models.BooleanField(default=False)
    january_check = models.BooleanField(default=False)
    february_check = models.BooleanField(default=False)
    march_check = models.BooleanField(default=False)
    april_check = models.BooleanField(default=False)
    may_check = models.BooleanField(default=False)
    june_check = models.BooleanField(default=False)
    july_check = models.BooleanField(default=False)
    august_check = models.BooleanField(default=False)
    september_check = models.BooleanField(default=False)
    october_check = models.BooleanField(default=False)
    november_check = models.BooleanField(default=False)
    december_check = models.BooleanField(default=False)
    year = models.IntegerField()

    class Meta:
        verbose_name_plural = 'Anti viruses'

    def __str__(self):
        return f"AntiVirus - Machine {self.machine_id} ({self.year})"


class Server(BaseModel):
    """Informacoes de backup de servidor associado a uma maquina.

    Attributes:
        machine: Maquina que funciona como servidor.
        have_backup: Se possui backup configurado.
        backup_date: Data do ultimo backup.
    """

    machine = models.ForeignKey(
        Machine, on_delete=models.PROTECT, related_name='servers'
    )
    have_backup = models.BooleanField(default=False)
    backup_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Server - Machine {self.machine_id}"


class ServerAccess(BaseModel):
    """Niveis de acesso ao servidor de arquivos de um colaborador.

    6 niveis de acesso representados por campos booleanos.

    Attributes:
        collaborator: Colaborador com acesso.
        level01..level06: Niveis de acesso (boolean).
    """

    collaborator = models.ForeignKey(
        Collaborator, on_delete=models.PROTECT, related_name='server_accesses'
    )
    level01 = models.BooleanField(default=False)
    level02 = models.BooleanField(default=False)
    level03 = models.BooleanField(default=False)
    level04 = models.BooleanField(default=False)
    level05 = models.BooleanField(default=False)
    level06 = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'Server accesses'

    def __str__(self):
        return f"ServerAccess - {self.collaborator}"


class ServerErpAccess(BaseModel):
    """Permissoes de acesso ao sistema ERP de um colaborador.

    Attributes:
        collaborator: Colaborador com acesso ERP.
        purchase: Acesso ao modulo de compras.
        sale: Acesso ao modulo de vendas.
        production_control: Acesso ao controle de producao.
        service: Acesso ao modulo de servicos.
    """

    collaborator = models.ForeignKey(
        Collaborator, on_delete=models.PROTECT, related_name='erp_accesses'
    )
    purchase = models.BooleanField(default=False)
    sale = models.BooleanField(default=False)
    production_control = models.BooleanField(default=False)
    service = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'Server ERP accesses'

    def __str__(self):
        return f"ERPAccess - {self.collaborator}"


class DataDestroyed(BaseModel):
    """Registro de destruicao de dados de uma maquina.

    Attributes:
        machine: Maquina cujos dados foram destruidos.
        when_data_is_destroyed: Data/hora da destruicao.
        i_can_destroy_data: Se ha autorizacao para destruir dados.
    """

    machine = models.ForeignKey(
        Machine, on_delete=models.PROTECT, related_name='data_destroyed_records'
    )
    when_data_is_destroyed = models.DateTimeField()
    i_can_destroy_data = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'Data destroyed'

    def __str__(self):
        return f"DataDestroyed - Machine {self.machine_id}"


class PenDrive(BaseModel):
    """Registro de verificacao de pendrive de um colaborador.

    Attributes:
        collaborator: Colaborador dono do pendrive.
        checked_date: Data da verificacao.
        have_virus: Se foi detectado virus.
    """

    collaborator = models.ForeignKey(
        Collaborator, on_delete=models.PROTECT, related_name='pen_drives'
    )
    checked_date = models.DateTimeField()
    have_virus = models.BooleanField(default=False)

    def __str__(self):
        return f"PenDrive - {self.collaborator} ({self.checked_date})"


# =============================================================================
# 2 Tabelas de Juncao N:N
# =============================================================================


class CollaboratorSoftware(BaseModel):
    """Relacao N:N entre colaborador e software.

    Registra quais softwares cada colaborador utiliza.

    Attributes:
        collaborator: Colaborador que utiliza o software.
        software: Software utilizado.
    """

    collaborator = models.ForeignKey(
        Collaborator, on_delete=models.PROTECT, related_name='collaborator_software'
    )
    software = models.ForeignKey(
        Software, on_delete=models.PROTECT, related_name='collaborator_software'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['collaborator', 'software'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_active_collaborator_software',
            ),
        ]

    def __str__(self):
        return f"{self.collaborator} - {self.software}"


class CollaboratorMachine(BaseModel):
    """Relacao N:N entre colaborador e maquina.

    Registra quais maquinas cada colaborador utiliza.

    Attributes:
        collaborator: Colaborador que utiliza a maquina.
        machine: Maquina utilizada.
    """

    collaborator = models.ForeignKey(
        Collaborator, on_delete=models.PROTECT, related_name='collaborator_machines'
    )
    machine = models.ForeignKey(
        Machine, on_delete=models.PROTECT, related_name='collaborator_machines'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['collaborator', 'machine'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_active_collaborator_machine',
            ),
        ]

    def __str__(self):
        return f"{self.collaborator} - {self.machine}"
