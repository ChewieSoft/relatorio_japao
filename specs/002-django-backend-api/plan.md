# Implementation Plan: Backend Django REST API

**Branch**: `002-django-backend-api` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-django-backend-api/spec.md`

## Summary

Construir o backend Django REST API completo para o sistema de compliance JRC Brasil. O frontend React SPA já existe com MSW mocks definindo os contratos de API. Esta implementação cobre: projeto Django com 3 apps (config, accounts, core), 14 modelos de negócio + modelo Report, autenticação JWT, 12 endpoints CRUD paginados, endpoint de dashboard agregado, infraestrutura de relatórios, e testes por camada. Arquitetura em camadas (Controller → Service → Repository) conforme CLAUDE.md.

## Technical Context

**Language/Version**: Python 3.11+ (Django 4.2.7)
**Primary Dependencies**: Django 4.2.7, djangorestframework 3.14.0, djangorestframework-simplejwt 5.3.0, django-cors-headers 4.3.1, django-filter 23.3, psycopg2-binary 2.9.9, python-decouple 3.8, gunicorn 21.2.0
**Storage**: PostgreSQL 13.5 (via Docker, psycopg2-binary driver)
**Testing**: pytest + pytest-django + DRF APITestCase
**Target Platform**: Docker container (Linux), development also on Windows
**Project Type**: Web service (REST API backend for SPA frontend)
**Performance Goals**: Development scope — sem metas de performance definidas nesta spec
**Constraints**: Compatibilidade total com contratos MSW do frontend; arquitetura em camadas obrigatória (CLAUDE.md); soft delete obrigatório; docstrings PT-BR obrigatórias
**Scale/Scope**: ~50 arquivos Python, 15 modelos, 12 CRUD endpoints, 5 auth endpoints, 1 dashboard endpoint, 1 reports listing endpoint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file is a blank template. Using CLAUDE.md as governance:

| Princípio CLAUDE.md | Status | Verificação |
|---------------------|--------|-------------|
| Lei de Demeter | PASS | Controller→Service→Repository, sem cadeias |
| Tell, Don't Ask | PASS | BaseModel.soft_delete() encapsula lógica |
| Evitar Acoplamento Temporal | PASS | @transaction.atomic em nested creation |
| Clean Code | PASS | Nomenclatura padronizada (tabela no CLAUDE.md) |
| SOLID (SRP) | PASS | Cada camada com responsabilidade única |
| DRY | PASS | BaseModel, BaseRepository, BaseService, BaseController |
| KISS | PASS | DefaultRouter, herança de classes base |
| Soft Delete obrigatório | PASS | BaseModel + SoftDeleteManager |
| Docstrings PT-BR | PASS | Obrigatório em todo código novo |
| Nunca raw SQL | PASS | Django ORM exclusivo |
| Nunca delete físico | PASS | Sempre soft_delete() via repository |

## Project Structure

### Documentation (this feature)

```text
specs/002-django-backend-api/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── Dockerfile
├── requirements.txt
├── pytest.ini
├── manage.py
├── config/                     # Projeto Django
│   ├── __init__.py
│   ├── settings.py             # DB, CORS, DRF, JWT config
│   ├── urls.py                 # Root URL → app URLs
│   ├── wsgi.py
│   └── asgi.py
├── accounts/                   # App: Autenticação JWT
│   ├── __init__.py
│   ├── controllers.py          # LoginView, RegisterView, MeView, LogoutView
│   ├── services.py             # AuthService (register logic)
│   ├── serializers.py          # LoginSerializer, RegisterSerializer, UserSerializer
│   ├── urls.py
│   └── tests.py
├── core/                       # App: 14 modelos + CRUD
│   ├── __init__.py
│   ├── models.py               # BaseModel + 14 modelos
│   ├── repositories.py         # BaseRepository + 12 repositories
│   ├── services.py             # BaseService + 12 services
│   ├── controllers.py          # BaseController + 12 controllers + DashboardView
│   ├── serializers.py          # BaseSerializer + serializers por modelo
│   ├── filters.py              # FilterSets por modelo
│   ├── urls.py                 # DefaultRouter + dashboard URL
│   ├── admin.py                # Registro dos 14 modelos
│   └── tests/
│       ├── __init__.py
│       ├── test_repositories.py
│       ├── test_services.py
│       └── test_controllers.py
├── reports/                    # App: Infraestrutura de relatórios
│   ├── __init__.py
│   ├── models.py               # Report model
│   ├── repositories.py         # ReportRepository
│   ├── services.py             # ReportService
│   ├── controllers.py          # ReportListController, ReportGenerateController
│   ├── serializers.py          # ReportSerializer
│   ├── urls.py
│   └── admin.py
└── fixtures/
    └── sample_data.json        # Dados de teste (14 modelos + 19 relatórios)
```

**Structure Decision**: Segue exatamente a estrutura definida no PLANO_IMPLEMENTACAO.md e CLAUDE.md. Frontend já existe em `packages/frontend/`. Docker Compose já existe na raiz.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Repository pattern (extra layer) | Exigido pelo CLAUDE.md — Lei de Demeter + SOLID SRP. Controllers não acessam ORM diretamente | Acesso direto ao ORM violaria regras do projeto |
| 12 repositories/services/controllers | DRY via herança (BaseRepository/BaseService/BaseController). Cada herdeiro tem ~5 linhas | Um único viewset genérico não permitiria customizações por entidade |

## Implementation Phases

### Phase A: Project Setup & Configuration (P1 — User Story 1)

**Objetivo**: Backend Django rodando via Docker com banco PostgreSQL.

**Arquivos a criar/modificar**:
- `backend/Dockerfile` — Python 3.11, pip install, expose 8000
- `backend/requirements.txt` — todas as dependências listadas
- `backend/manage.py` — Django manage padrão
- `backend/pytest.ini` — configuração pytest-django
- `backend/config/__init__.py`, `settings.py`, `urls.py`, `wsgi.py`, `asgi.py`
- `backend/accounts/__init__.py` (app vazio inicialmente)
- `backend/core/__init__.py` (app vazio inicialmente)
- `backend/reports/__init__.py` (app vazio inicialmente)

**settings.py deve configurar**:
- DATABASE via python-decouple (lê do .env)
- CORS_ALLOWED_ORIGINS via python-decouple
- REST_FRAMEWORK (JWT auth, pagination 20, filter backends)
- SIMPLE_JWT (access 30min, refresh 1d, rotate=True, blacklist=True)
- INSTALLED_APPS (rest_framework, corsheaders, django_filters, rest_framework_simplejwt.token_blacklist, accounts, core, reports)

**Verificação**: `docker-compose up --build` → 3 serviços sobem, `http://localhost:8000/admin/` acessível.

---

### Phase B: Models & Migrations (P1 — User Story 3 prereq)

**Objetivo**: 14 modelos + Report model criados no banco.

**Arquivos a criar/modificar**:
- `backend/core/models.py` — BaseModel (abstrato) + SoftDeleteManager + 14 modelos
- `backend/core/admin.py` — Registro dos 14 modelos com list_display, search_fields
- `backend/reports/models.py` — Report model
- `backend/reports/admin.py` — Registro do Report
- `backend/fixtures/sample_data.json` — Dados de teste + 19 relatórios seed

**Modelos e suas particularidades**:
- BaseModel: created_at, updated_at, deleted_at, soft_delete(), restore(), SoftDeleteManager, all_objects
- Collaborator: unique full_name, unique domain_user
- Machine: unique service_tag, unique ip, unique mac_address
- Software: novo campo `expires_at` (DateTimeField null) além dos campos originais
- Wifi: 12 campos booleanos (january..december) + year
- AntiVirus: 24 campos booleanos (12 updated + 12 check) + year
- ServerAccess: 6 níveis booleanos
- Report: number (unique), name, name_jp, category, status (choices: pending/generated/sent), last_generated

**Verificação**: `python manage.py makemigrations && python manage.py migrate` sem erros. Admin mostra 15 modelos.

---

### Phase C: Authentication JWT (P1 — User Story 2)

**Objetivo**: 5 endpoints de auth compatíveis com frontend AuthContext.

**Arquivos a criar/modificar**:
- `backend/accounts/serializers.py` — LoginSerializer, RegisterSerializer, UserSerializer
- `backend/accounts/services.py` — AuthService (register com staff check)
- `backend/accounts/controllers.py` — views para login, refresh, register, me, logout
- `backend/accounts/urls.py` — rotas auth
- `backend/config/urls.py` — incluir accounts URLs

**Endpoints**:
- POST `/api/auth/login/` → simplejwt TokenObtainPairView
- POST `/api/auth/refresh/` → simplejwt TokenRefreshView
- POST `/api/auth/register/` → RegisterView (IsAdminUser permission)
- GET `/api/auth/me/` → UserView (retorna {id, username, email, is_staff})
- POST `/api/auth/logout/` → simplejwt `TokenBlacklistView` (built-in, aceita `{ refresh: "..." }`, retorna 200)

**Verificação**: Login retorna tokens, me retorna user, rotas protegidas retornam 401 sem token.

---

### Phase D: Repositories & Services (P1 — User Story 3 prereq)

**Objetivo**: Camada de acesso a dados e lógica de negócio para todas as entidades.

**Arquivos a criar/modificar**:
- `backend/core/repositories.py` — BaseRepository + 12 repositories específicos
- `backend/core/services.py` — BaseService + 12 services específicos

**BaseRepository métodos**: get_all(), get_by_id(pk), create(**data), update(instance, **data), soft_delete(instance), filter(**kwargs)

**BaseService métodos**: list(), get(pk), create(data), update(pk, data), delete(pk)

**Customizações específicas**:
- CollaboratorRepository: get_active(), get_with_emails(pk), get_domain_users()
- CollaboratorService: nested creation com @transaction.atomic (Collaborator + Emails)
- MachineRepository: `get_all()` com `prefetch_related('collaborator_machines__collaborator', 'antivirus_records')` para evitar N+1
- ReportRepository + ReportService em `backend/reports/`

**Verificação**: Testes unitários de repository (create, soft_delete, filter).

---

### Phase E: Serializers & Controllers (P1 — User Stories 3, 4)

**Objetivo**: Endpoints CRUD completos para 12 entidades + dashboard + reports.

**Arquivos a criar/modificar**:
- `backend/core/serializers.py` — BaseSerializer + serializers por modelo (list, detail, create)
- `backend/core/controllers.py` — BaseController + 12 controllers + DashboardStatsView
- `backend/core/filters.py` — FilterSets com campos filtráveis por modelo
- `backend/core/urls.py` — DefaultRouter registrando todos os controllers + dashboard URL
- `backend/reports/serializers.py` — ReportSerializer
- `backend/reports/controllers.py` — ReportListController + ReportGenerateView
- `backend/reports/urls.py` — reports URLs
- `backend/config/urls.py` — incluir core + reports URLs

**Serializers — Mapeamento frontend↔model**:
- CollaboratorListSerializer: name→source='full_name', department→source='office', has_server_access (SerializerMethodField), has_erp_access, has_internet_access→source='perm_acess_internet', has_cellphone, email (primeiro email)
- MachineListSerializer: hostname (campo direto), encrypted (SerializerMethodField: crypto_disk OR crypto_usb OR crypto_memory_card), antivirus (SerializerMethodField: exists AntiVirus year=current), collaborator_id/collaborator_name (SerializerMethodField via CollaboratorMachine prefetched)
- **ATENÇÃO N+1**: MachineController.get_queryset() DEVE usar `prefetch_related('collaborator_machines__collaborator', 'antivirus_records')` para evitar 40+ queries extras por página
- SoftwareListSerializer: license_key→source='key', license_type→source='type_licence', in_use→source='on_use', expires_at (campo novo)

**DashboardStatsView** (GET `/api/dashboard/stats/`):
- Aggregation queries: Count de colaboradores ativos, máquinas, software, relatórios pending
- machines_without_encryption: lista de `hostname` de máquinas onde crypto_disk=False AND crypto_usb=False AND crypto_memory_card=False (alinhado com MSW mock que usa hostname)

**Verificação**: Frontend (sem MSW) exibe dados reais em todas as 6 páginas.

---

### Phase F: Tests (P3 — User Story 7)

**Objetivo**: Testes por camada para as 3 entidades principais + auth.

**Arquivos a criar/modificar**:
- `backend/core/tests/__init__.py`
- `backend/core/tests/test_repositories.py` — CRUD + soft delete + filters
- `backend/core/tests/test_services.py` — nested creation + business logic
- `backend/core/tests/test_controllers.py` — HTTP status codes + pagination + auth
- `backend/accounts/tests.py` — login, refresh, me, logout, register (admin only)

**Verificação**: `cd backend && pytest` — 100% aprovação.

## Risk Assessment

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Field mapping incorreto (frontend espera campo diferente) | Alto — frontend quebra | Comparar resposta real vs MSW mock para cada endpoint antes de dar como concluído |
| 24 campos booleanos em AntiVirus (tedioso, propenso a typo) | Baixo — erros de digitação | Copiar nomes exatos do PLANO_IMPLEMENTACAO.md |
| Nested creation falha sem transação | Médio — dados inconsistentes | @transaction.atomic obrigatório no CollaboratorService |
| Docker compose não sobe na primeira vez | Baixo — config issue | Testar incrementalmente: db primeiro, depois backend |
