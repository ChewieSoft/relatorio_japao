# Backend - Django REST Framework

> Referencia profunda para trabalho no backend. Para visao geral, ver [../CLAUDE.md](../CLAUDE.md).

## Stack

| Pacote | Versao | Uso |
|--------|--------|-----|
| Django | 4.2.7 | Framework web |
| djangorestframework | 3.14.0 | API REST |
| djangorestframework-simplejwt | 5.3.0 | Auth JWT |
| django-cors-headers | 4.3.1 | CORS para SPA |
| django-filter | 23.3 | Filtros na API |
| psycopg2-binary | 2.9.9 | Driver PostgreSQL |
| python-decouple | 3.8 | Variaveis de ambiente |
| gunicorn | 21.2.0 | Server WSGI (producao) |
| reportlab | 4.0.8 | Geracao de PDF |
| openpyxl | 3.1.2 | Exportacao Excel |
| pytest | - | Testes |
| pytest-django | - | Testes Django |

## Apps Django

| App | Responsabilidade | Arquivos Principais |
|-----|-----------------|---------------------|
| `config` | Projeto Django (settings, urls, wsgi) | `settings.py`, `urls.py` |
| `accounts` | Autenticacao JWT (login, register, refresh) | `models.py`, `serializers.py`, `controllers.py`, `services.py`, `urls.py` |
| `core` | 14 modelos de negocio + CRUD completo | `models.py`, `serializers.py`, `controllers.py`, `services.py`, `repositories.py`, `urls.py`, `filters.py`, `admin.py` |
| `reports` | 19 relatorios de compliance + exportacao | `serializers.py`, `controllers.py`, `services.py`, `repositories.py`, `urls.py`, `exporters.py` |

## BaseModel (Soft Delete)

```python
from django.db import models
from django.utils import timezone


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])
```

## 14 Modelos

### 3 Entidades Principais

| # | Modelo | Campos | Unique |
|---|--------|--------|--------|
| 1 | **Collaborator** | full_name, domain_user, status (Bool), perm_acess_internet (Bool), date_hired (DateTime), fired (Bool), date_fired (DateTime?), acess_wifi (Bool), admin_privilege (Bool), office | full_name, domain_user |
| 2 | **Machine** | hostname (?), model, type, service_tag, operacional_system, ram_memory, disk_memory, ip, mac_address, administrator, cod_jdb, date_purchase (DateTime), quantity (Int), crypto_disk (Bool), crypto_usb (Bool), crypto_memory_card (Bool), sold_out (Bool), date_sold_out (DateTime?) | service_tag, ip, mac_address |
| 3 | **Software** | software_name (?), key, quantity (Int), type_licence, quantity_purchase (Int), last_purchase_date (DateTime), on_use (Int), departament, observation (Text), expires_at (DateTime?) | - |

### 9 Entidades Dependentes

| # | Modelo | Campos | FK |
|---|--------|--------|----|
| 4 | **Email** | email, remark, email_creation (DateTime), until (DateTime?) | Collaborator |
| 5 | **Cellphone** | model, operacional_system, phone_number, status (Bool), approved (Bool), have_password (Bool), first_sinc, device_id | Collaborator |
| 6 | **Wifi** | wifi_name, protection, january..december (Bool x12), year (Int) | Collaborator |
| 7 | **AntiVirus** | january_updated..december_updated (Bool x12), january_check..december_check (Bool x12), year (Int) | Machine |
| 8 | **Server** | have_backup (Bool), backup_date (DateTime?) | Machine |
| 9 | **ServerAccess** | level01..level06 (Bool x6) | Collaborator |
| 10 | **ServerErpAccess** | purchase (Bool), sale (Bool), production_control (Bool), service (Bool) | Collaborator |
| 11 | **DataDestroyed** | when_data_is_destroyed (DateTime), i_can_destroy_data (Bool) | Machine |
| 12 | **PenDrive** | checked_date (DateTime), have_virus (Bool) | Collaborator |

### 2 Tabelas de Juncao (N:N)

| # | Modelo | FKs |
|---|--------|-----|
| 13 | **CollaboratorSoftware** | Collaborator, Software |
| 14 | **CollaboratorMachine** | Collaborator, Machine |

### Relacoes

```
Collaborator -1:N-> Email, Cellphone, Wifi, ServerAccess, ServerErpAccess, PenDrive
Collaborator -N:N-> Software (via CollaboratorSoftware)
Collaborator -N:N-> Machine (via CollaboratorMachine)
Machine      -1:N-> AntiVirus, Server, DataDestroyed
```

## Mapeamento Frontend ↔ Model (Serializer Aliases)

O frontend usa nomes diferentes dos campos do modelo. Serializers mapeiam via `source=`:

### Collaborator

| Campo frontend (snake_case) | Campo model | Serializer strategy |
|-----------------------------|-------------|---------------------|
| `name` | `full_name` | `CharField(source='full_name')` |
| `department` | `office` | `CharField(source='office')` |
| `has_internet_access` | `perm_acess_internet` | `BooleanField(source='perm_acess_internet')` |
| `has_server_access` | — (relacao ServerAccess) | `SerializerMethodField()` |
| `has_erp_access` | — (relacao ServerErpAccess) | `SerializerMethodField()` |
| `has_cellphone` | — (relacao Cellphone) | `SerializerMethodField()` |
| `email` | — (relacao Email) | `SerializerMethodField()` → primeiro email |

### Machine

| Campo frontend | Campo model | Serializer strategy |
|----------------|-------------|---------------------|
| `hostname` | `hostname` | Direto (campo novo no model) |
| `operational_system` | `operacional_system` | `CharField(source='operacional_system')` |
| `encrypted` | — (derivado) | `SerializerMethodField()` → `crypto_disk OR crypto_usb OR crypto_memory_card` |
| `antivirus` | — (relacao AntiVirus) | `SerializerMethodField()` → exists com year=current |
| `collaborator_id` | — (via CollaboratorMachine) | `SerializerMethodField()` |
| `collaborator_name` | — (via CollaboratorMachine) | `SerializerMethodField()` |
| `machine_type` | `type` | `CharField(source='type')` |

> **CRITICO N+1**: MachineController.get_queryset() DEVE usar `prefetch_related('collaborator_machines__collaborator', 'antivirus_records')`.

### Software

| Campo frontend | Campo model | Serializer strategy |
|----------------|-------------|---------------------|
| `license_key` | `key` | `CharField(source='key')` |
| `license_type` | `type_licence` | `CharField(source='type_licence')` |
| `in_use` | `on_use` | `IntegerField(source='on_use')` |
| `expires_at` | `expires_at` | Direto (campo NOVO — distinto de `last_purchase_date`) |

> **Nota**: `expires_at` (data de expiracao da licenca) e `last_purchase_date` (data da ultima compra) sao campos semanticamente distintos. `expires_at` e null para licencas perpetual/OEM.

## Padroes de Serializers

### Base Serializer

```python
class BaseSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at']
```

### Nested Serializer (leitura)

```python
class CollaboratorDetailSerializer(BaseSerializer):
    emails = EmailSerializer(many=True, read_only=True, source='email_set')
    cellphones = CellphoneSerializer(many=True, read_only=True, source='cellphone_set')
    software = SoftwareSerializer(many=True, read_only=True, source='collaboratorsoftware_set')

    class Meta(BaseSerializer.Meta):
        model = Collaborator
```

### Nested Create (escrita)

```python
# Serializer apenas valida — logica de criacao fica no service
class CollaboratorCreateSerializer(BaseSerializer):
    emails = EmailSerializer(many=True, required=False)

    class Meta(BaseSerializer.Meta):
        model = Collaborator
```

## Arquitetura em Camadas

```
Request → urls.py (Route) → Controller → Service → Repository → Model/DB
                                |
                           Serializer (validacao/formatacao)
```

| Camada | Arquivo | Responsabilidade |
|--------|---------|-----------------|
| Route | `urls.py` | Mapeamento URL → Controller |
| Controller | `controllers.py` | HTTP request/response, permissoes, chama service |
| Service | `services.py` | Logica de negocio, orquestracao entre repositories |
| Repository | `repositories.py` | Acesso a dados (ORM), soft delete, queries |
| Entity/Model | `models.py` | Definicao de campos, BaseModel |
| Serializer | `serializers.py` | Validacao de input, formatacao de output |

### BaseRepository

```python
# core/repositories.py
from django.utils import timezone


class BaseRepository:
    model = None

    def get_all(self):
        return self.model.objects.all()

    def get_by_id(self, pk):
        return self.model.objects.get(pk=pk)

    def create(self, **data):
        return self.model.objects.create(**data)

    def update(self, instance, **data):
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save(update_fields=list(data.keys()) + ['updated_at'])
        return instance

    def soft_delete(self, instance):
        instance.soft_delete()

    def filter(self, **kwargs):
        return self.model.objects.filter(**kwargs)
```

### Repository Especifico

```python
class CollaboratorRepository(BaseRepository):
    model = Collaborator

    def get_active(self):
        return self.model.objects.filter(status=True, fired=False)

    def get_with_emails(self, pk):
        return self.model.objects.prefetch_related('email_set').get(pk=pk)

    def get_domain_users(self):
        return self.model.objects.values('full_name', 'domain_user', 'status')
```

### BaseService

```python
# core/services.py

class BaseService:
    repository = None

    def list(self):
        return self.repository.get_all()

    def get(self, pk):
        return self.repository.get_by_id(pk)

    def create(self, data):
        return self.repository.create(**data)

    def update(self, pk, data):
        instance = self.repository.get_by_id(pk)
        return self.repository.update(instance, **data)

    def delete(self, pk):
        instance = self.repository.get_by_id(pk)
        self.repository.soft_delete(instance)
```

### Service com Logica de Negocio

```python
class CollaboratorService(BaseService):
    repository = CollaboratorRepository()
    email_repository = EmailRepository()

    def create(self, data):
        """Nested creation: Collaborator + Emails em uma transacao."""
        emails_data = data.pop('emails', [])
        collaborator = self.repository.create(**data)
        for email_data in emails_data:
            self.email_repository.create(collaborator=collaborator, **email_data)
        return collaborator
```

### BaseController

```python
# core/controllers.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated


class BaseController(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    service = None

    def perform_create(self, serializer):
        self.service.create(serializer.validated_data)

    def perform_update(self, serializer):
        self.service.update(self.get_object().pk, serializer.validated_data)

    def perform_destroy(self, instance):
        self.service.delete(instance.pk)
```

### Controller com Filtros

```python
class CollaboratorController(BaseController):
    queryset = Collaborator.objects.all()
    serializer_class = CollaboratorSerializer
    service = CollaboratorService()
    filterset_fields = ['status', 'fired', 'office', 'admin_privilege']
    search_fields = ['full_name', 'domain_user']
    ordering_fields = ['full_name', 'date_hired']
    ordering = ['full_name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CollaboratorDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CollaboratorCreateSerializer
        return CollaboratorSerializer
```

## Endpoints de Auth (app `accounts`)

| Metodo | Rota | View | Descricao |
|--------|------|------|-----------|
| POST | `/api/auth/login/` | simplejwt `TokenObtainPairView` | Retorna {access, refresh} |
| POST | `/api/auth/refresh/` | simplejwt `TokenRefreshView` | Retorna {access} |
| POST | `/api/auth/register/` | Custom `RegisterView` (IsAdminUser) | Cria usuario (staff only) |
| GET | `/api/auth/me/` | Custom `UserView` | Retorna dados do usuario |
| POST | `/api/auth/logout/` | simplejwt `TokenBlacklistView` | Blacklist do refresh token (retorna 200) |

## Dashboard Stats

Endpoint agregado que alimenta o dashboard do frontend.

**GET `/api/dashboard/stats/`** (IsAuthenticated)

```python
# Resposta esperada:
{
    "active_collaborators": 8,       # Collaborator(status=True, fired=False).count()
    "total_collaborators": 10,       # Collaborator.objects.count()
    "total_machines": 5,             # Machine.objects.count()
    "total_software": 6,             # Software.objects.count()
    "pending_reports": 16,           # Report(status='pending').count()
    "total_reports": 19,             # Report.objects.count()
    "machines_without_encryption": [  # Machine(crypto_disk=False, crypto_usb=False,
        "PC-TI-001", "PC-ADM-003"   #   crypto_memory_card=False).values_list('hostname')
    ]
}
```

> **Nota**: `machines_without_encryption` retorna lista de `hostname` (alinhado com MSW mock do frontend).

## 19 Relatorios

### Padrao de Implementacao (Arquitetura em Camadas)

```
Request → urls.py → ReportController → ReportService → ReportRepository → Model/DB
                          |                  |
                     Serializer          Exporters (PDF/Excel)
```

#### ReportBaseRepository

```python
# reports/repositories.py

class ReportBaseRepository:
    """Queries otimizadas para cada relatorio."""
    base_queryset = None

    def get_data(self, year=None, month=None):
        qs = self.base_queryset
        if year:
            qs = qs.filter(year=int(year))
        if month:
            qs = qs.filter(month=int(month))
        return qs


class Report08Repository(ReportBaseRepository):
    """Lista de Contatos Internos."""
    base_queryset = Collaborator.objects.prefetch_related('email_set', 'cellphone_set')
```

#### ReportBaseService

```python
# reports/services.py
from .exporters import render_pdf, render_excel


class ReportBaseService:
    repository = None
    serializer_class = None
    report_title = ''
    report_columns = []

    def get_data(self, year=None, month=None):
        return self.repository.get_data(year=year, month=month)

    def export_pdf(self, queryset):
        return render_pdf(queryset, self.report_title, self.report_columns)

    def export_excel(self, queryset):
        return render_excel(queryset, self.report_title, self.report_columns)
```

#### ReportBaseController

```python
# reports/controllers.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class ReportBaseController(APIView):
    permission_classes = [IsAuthenticated]
    service = None

    def get(self, request, *args, **kwargs):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.service.get_data(year=year, month=month)

        format_type = request.query_params.get('format', 'json')
        if format_type == 'pdf':
            return self.service.export_pdf(queryset)
        elif format_type == 'xlsx':
            return self.service.export_excel(queryset)

        serializer = self.service.serializer_class(queryset, many=True)
        return Response(serializer.data)
```

### Tabela dos 19 Relatorios

| Rota | # | Nome | Query Principal |
|------|---|------|-----------------|
| `/api/reports/08/` | 08 | Lista de Contatos Internos | Collaborator + Email + Cellphone |
| `/api/reports/09/` | 09 | Lista de Computadores JDB | Machine (todos os campos) |
| `/api/reports/13/` | 13 | Usuarios de Dominio | Collaborator.domain_user + status |
| `/api/reports/15/` | 15 | Acesso Servidor de Arquivos | ServerAccess + Collaborator |
| `/api/reports/17/` | 17 | Permissao de Acesso a Internet | Collaborator.perm_acess_internet |
| `/api/reports/19/` | 19 | Licencas de Software | Software (licenca, quantidade, uso) |
| `/api/reports/20/` | 20 | Notebooks com Criptografia | Machine (crypto_*) filtrado notebooks |
| `/api/reports/21/` | 21 | Celulares Corporativos Ativados | Cellphone + Collaborator (status=True) |
| `/api/reports/22/` | 22 | Destruicao de Dados | DataDestroyed + Machine |
| `/api/reports/23/` | 23 | Acesso ao ERP | ServerErpAccess + Collaborator |
| `/api/reports/24/` | 24 | Lista de E-mails | Email + Collaborator |
| `/api/reports/25/` | 25 | Verificacao de Virus em Pendrives | PenDrive + Collaborator |
| `/api/reports/26/` | 26 | Padrao de Arquivos Antivirus | AntiVirus (updated mensais) + Machine |
| `/api/reports/28/` | 28 | Permissao de Uso de Software | CollaboratorSoftware + Collaborator + Software |
| `/api/reports/29/` | 29 | Atualizacoes de Seguranca | AntiVirus (check mensais) + Machine |
| `/api/reports/31/` | 31 | Verificacao de Antivirus | AntiVirus + Machine (scan mensal) |
| `/api/reports/33/` | 33 | Acesso WiFi | Wifi + Collaborator |
| `/api/reports/34/` | 34 | Troca de Senha WiFi | Wifi (protection, meses) |
| `/api/reports/35/` | 35 | Backup de Servidores | Server + Machine (backup_date) |
| `/api/reports/37/` | 37 | Usuarios de Dominio (detalhado) | Collaborator.domain_user |

### Exportacao PDF/Excel (`exporters.py`)

```python
# reports/exporters.py

# PDF com ReportLab
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

def render_pdf(queryset, title, columns):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    # ... montar tabela com dados
    doc.build(elements)
    return FileResponse(buffer, as_attachment=True, filename=f'{title}.pdf')

# Excel com openpyxl
from openpyxl import Workbook

def render_excel(queryset, title, columns):
    wb = Workbook()
    ws = wb.active
    ws.title = title
    # ... preencher linhas
    buffer = BytesIO()
    wb.save(buffer)
    return FileResponse(buffer, as_attachment=True, filename=f'{title}.xlsx')
```

## Configuracao settings.py

### Database

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='relatoriojapao'),
        'USER': config('DB_USER', default='admin'),
        'PASSWORD': config('DB_PASSWORD', default='admin'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}
```

### CORS

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # DEVE ser antes de CommonMiddleware
    # ...
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
]
```

### DRF

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}
```

### JWT

```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,        # OBRIGATORIO: cada refresh gera novo token
    'BLACKLIST_AFTER_ROTATION': True,      # OBRIGATORIO: invalida refresh antigo (default e False!)
}
# ATENCAO: BLACKLIST_AFTER_ROTATION default do simplejwt e False.
# Sem essa config, refresh tokens antigos continuam validos apos rotation.
# Requer 'rest_framework_simplejwt.token_blacklist' em INSTALLED_APPS.
```

## Testes Backend

Testes sao organizados por camada (repository, service, controller) em cada app.

```bash
# Rodar todos os testes
cd packages/backend && pytest

# Testes por camada
pytest core/tests/test_repositories.py
pytest core/tests/test_services.py
pytest core/tests/test_controllers.py
pytest reports/tests/

# Com cobertura
pytest --cov=. --cov-report=html
```

### Teste de Repository

```python
# core/tests/test_repositories.py
import pytest
from core.repositories import CollaboratorRepository

repo = CollaboratorRepository()

@pytest.mark.django_db
def test_create_collaborator():
    collab = repo.create(
        full_name='Test User', domain_user='test.user',
        status=True, date_hired=timezone.now(),
    )
    assert collab.pk is not None

@pytest.mark.django_db
def test_soft_delete(collaborator):
    repo.soft_delete(collaborator)
    collaborator.refresh_from_db()
    assert collaborator.deleted_at is not None
    assert repo.get_all().count() == 0
```

### Teste de Service

```python
# core/tests/test_services.py
import pytest
from core.services import CollaboratorService

service = CollaboratorService()

@pytest.mark.django_db
def test_create_with_emails():
    data = {
        'full_name': 'Test User', 'domain_user': 'test.user',
        'status': True, 'date_hired': timezone.now(),
        'emails': [{'email': 'test@jrc.com', 'remark': '', 'email_creation': timezone.now()}],
    }
    collab = service.create(data)
    assert collab.email_set.count() == 1
```

### Teste de Controller (integracao)

```python
# core/tests/test_controllers.py
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    user = User.objects.create_user(username='test', password='test123')
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.mark.django_db
def test_list_collaborators(api_client, collaborator):
    response = api_client.get('/api/collaborators/')
    assert response.status_code == 200
    assert len(response.data['results']) == 1

@pytest.mark.django_db
def test_soft_delete_via_api(api_client, collaborator):
    response = api_client.delete(f'/api/collaborators/{collaborator.id}/')
    assert response.status_code == 204
    collaborator.refresh_from_db()
    assert collaborator.deleted_at is not None
```
