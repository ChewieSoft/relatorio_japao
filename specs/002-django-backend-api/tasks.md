# Tasks: Backend Django REST API

**Input**: Design documents from `/specs/002-django-backend-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-endpoints.md, quickstart.md

**Tests**: Incluídos — spec User Story 7 (P3) solicita testes por camada.

**Organization**: Tasks agrupadas por user story para implementação e testes independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story correspondente (US1..US7)
- Caminhos exatos incluídos em cada task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Projeto Django inicializado, Docker funcional, dependências instaladas.

- [x] T001 Create backend project directory structure: `backend/`, `backend/config/`, `backend/accounts/`, `backend/core/`, `backend/core/tests/`, `backend/reports/`, `backend/fixtures/`
- [x] T002 Create `backend/requirements.txt` with all dependencies (Django==4.2.7, djangorestframework==3.14.0, djangorestframework-simplejwt==5.3.0, django-cors-headers==4.3.1, django-filter==23.3, psycopg2-binary==2.9.9, python-decouple==3.8, gunicorn==21.2.0, reportlab==4.0.8, openpyxl==3.1.2, pytest, pytest-django)
- [x] T003 Create `backend/manage.py` with Django standard manage script pointing to `config.settings`
- [x] T004 Create `backend/config/__init__.py`, `backend/config/wsgi.py`, `backend/config/asgi.py`
- [x] T005 Create `backend/config/settings.py` with: DATABASE (python-decouple from .env), CORS_ALLOWED_ORIGINS, REST_FRAMEWORK (JWTAuthentication, PageNumberPagination PAGE_SIZE=20, DjangoFilterBackend+SearchFilter+OrderingFilter), SIMPLE_JWT (access=30min, refresh=1d, ROTATE_REFRESH_TOKENS=True, BLACKLIST_AFTER_ROTATION=True), INSTALLED_APPS (rest_framework, corsheaders, django_filters, rest_framework_simplejwt.token_blacklist, accounts, core, reports)
- [x] T006 Create `backend/config/urls.py` with root URL configuration (admin, api/ includes for accounts, core, reports)
- [x] T007 Create `backend/Dockerfile` (python:3.11-slim, WORKDIR /app, pip install, expose 8000) and `backend/entrypoint.sh` (wait for db, migrate --noinput, exec runserver)
- [x] T008 Create `backend/pytest.ini` with DJANGO_SETTINGS_MODULE=config.settings and python_files/classes/functions patterns
- [x] T009 [P] Create empty `__init__.py` files for all apps: `backend/accounts/__init__.py`, `backend/core/__init__.py`, `backend/core/tests/__init__.py`, `backend/reports/__init__.py`
- [x] T010 Update existing `docker-compose.yml` backend service to use entrypoint.sh and verify all 3 services (db, backend, frontend) start with `docker-compose up --build`

**Checkpoint**: `docker-compose up --build` starts all 3 services. `http://localhost:8000/admin/` shows Django Admin login.

---

## Phase 2: Foundational (Blocking Prerequisites — Models & Base Classes)

**Purpose**: 14 modelos + Report model + classes base (BaseModel, BaseRepository, BaseService, BaseController, BaseSerializer) que todas as user stories dependem.

**⚠️ CRITICAL**: Nenhuma user story pode começar sem esta fase completa.

- [x] T011 Create BaseModel abstract class and SoftDeleteManager in `backend/core/models.py` (created_at auto_now_add, updated_at auto_now, deleted_at null/blank, soft_delete(), restore(), objects=SoftDeleteManager, all_objects=Manager)
- [x] T012 Create 3 main entity models in `backend/core/models.py`: Collaborator (unique full_name, unique domain_user, all fields from data-model.md), Machine (hostname new field, unique service_tag/ip/mac_address, all fields), Software (expires_at new field, all fields)
- [x] T013 Create 9 dependent entity models in `backend/core/models.py`: Email (FK Collaborator, related_name='emails'), Cellphone (FK Collaborator, related_name='cellphones'), Wifi (12 month booleans + year, FK Collaborator), AntiVirus (12 updated + 12 check booleans + year, FK Machine), Server (FK Machine), ServerAccess (6 level booleans, FK Collaborator), ServerErpAccess (FK Collaborator), DataDestroyed (FK Machine), PenDrive (FK Collaborator)
- [x] T014 Create 2 junction table models in `backend/core/models.py`: CollaboratorSoftware (unique_together collaborator+software), CollaboratorMachine (unique_together collaborator+machine)
- [x] T015 Create Report model in `backend/reports/models.py` (number CharField unique, name, name_jp, category, status with choices pending/generated/sent, last_generated DateTimeField null) — does NOT inherit BaseModel
- [x] T016 Run `python manage.py makemigrations` and `python manage.py migrate` to create all 15 tables (14 core + Report)
- [x] T017 [P] Register all 14 core models in `backend/core/admin.py` with list_display, search_fields, list_filter per model
- [x] T018 [P] Register Report model in `backend/reports/admin.py` with list_display, search_fields
- [x] T019 Create `backend/fixtures/sample_data.json` with test data: at least 5 Collaborators (with emails, cellphones), 5 Machines (with AntiVirus records), 5 Software, 19 Report seeds (all with status='pending'), plus junction table entries. Use model field names (full_name, office, not frontend aliases)
- [x] T020 Create BaseSerializer in `backend/core/serializers.py` (ModelSerializer, fields='__all__', read_only_fields=['id', 'created_at', 'updated_at', 'deleted_at'])
- [x] T021 Create BaseRepository in `backend/core/repositories.py` with methods: get_all(), get_by_id(pk), create(**data), update(instance, **data), soft_delete(instance), filter(**kwargs)
- [x] T022 Create BaseService in `backend/core/services.py` with methods: list(), get(pk), create(data), update(pk, data), delete(pk) — delegates to self.repository
- [x] T023 Create BaseController in `backend/core/controllers.py` (ModelViewSet, IsAuthenticated, perform_create→service.create, perform_update→service.update, perform_destroy→service.delete)

**Checkpoint**: All 15 models in database. Django Admin shows all models. Base classes ready for extension. `python manage.py loaddata fixtures/sample_data.json` loads test data.

---

## Phase 3: User Story 1 — Desenvolvedor sobe o backend com Docker (Priority: P1) 🎯 MVP

**Goal**: Backend Django + PostgreSQL funcionando via Docker Compose, acessível em localhost:8000.

**Independent Test**: `docker-compose up --build` → 3 serviços sobem → `http://localhost:8000/admin/` mostra login → `createsuperuser` funciona → `loaddata` carrega fixtures.

> Nota: Esta story é coberta pelas tasks de Phase 1 e 2. Nenhuma task adicional necessária — a verificação é o checkpoint da Phase 2.

**Checkpoint**: US1 completa ao final da Phase 2.

---

## Phase 4: User Story 2 — Login e rotas protegidas JWT (Priority: P1)

**Goal**: 5 endpoints de autenticação compatíveis com frontend AuthContext.

**Independent Test**: POST `/api/auth/login/` retorna tokens → GET `/api/auth/me/` retorna user → rotas sem token retornam 401.

### Implementation for User Story 2

- [x] T024 [P] [US2] Create UserSerializer (id, username, email, is_staff) and RegisterSerializer (username, email, password with write_only) in `backend/accounts/serializers.py`
- [x] T025 [P] [US2] Create AuthService in `backend/accounts/services.py` with register method (creates user, checks is_staff permission)
- [x] T026 [US2] Create auth views in `backend/accounts/controllers.py`: UserView (GET /me/ → IsAuthenticated, returns UserSerializer), RegisterView (POST → IsAdminUser, uses AuthService)
- [x] T027 [US2] Create `backend/accounts/urls.py` with 5 routes: login/ (TokenObtainPairView), refresh/ (TokenRefreshView), register/ (RegisterView), me/ (UserView), logout/ (TokenBlacklistView from simplejwt)
- [x] T028 [US2] Update `backend/config/urls.py` to include `path('api/auth/', include('accounts.urls'))`
- [x] T029 [US2] Verify auth flow end-to-end: login returns {access, refresh}, me returns user data, refresh returns new access, logout blacklists token, unauthenticated requests get 401

**Checkpoint**: Full JWT auth working. Frontend Login page can authenticate against real backend.

---

## Phase 5: User Story 3 — Listagem de colaboradores, máquinas e software (Priority: P1)

**Goal**: 3 endpoints de listagem paginados (20/página) com campos mapeados exatamente como o frontend espera.

**Independent Test**: GET `/api/collaborators/?page=1` retorna formato paginado DRF com campos name, domain_user, department, status, fired, has_server_access, has_erp_access, has_internet_access, has_cellphone, email.

### Implementation for User Story 3

- [x] T030 [P] [US3] Create CollaboratorRepository in `backend/core/repositories.py` extending BaseRepository: get_active(), get_with_emails(pk), get_domain_users(), model=Collaborator
- [x] T031 [P] [US3] Create MachineRepository in `backend/core/repositories.py` extending BaseRepository: override get_all() with prefetch_related('collaboratormachine_set__collaborator', 'antivirus_records'), model=Machine
- [x] T032 [P] [US3] Create SoftwareRepository in `backend/core/repositories.py` extending BaseRepository: model=Software
- [x] T033 [P] [US3] Create CollaboratorService in `backend/core/services.py` extending BaseService: repository=CollaboratorRepository
- [x] T034 [P] [US3] Create MachineService in `backend/core/services.py` extending BaseService: repository=MachineRepository
- [x] T035 [P] [US3] Create SoftwareService in `backend/core/services.py` extending BaseService: repository=SoftwareRepository
- [x] T036 [US3] Create CollaboratorListSerializer in `backend/core/serializers.py` with field mapping: name(source='full_name'), department(source='office'), has_internet_access(source='perm_acess_internet'), has_server_access(SerializerMethodField), has_erp_access(SerializerMethodField), has_cellphone(SerializerMethodField), email(SerializerMethodField → first email)
- [x] T037 [US3] Create MachineListSerializer in `backend/core/serializers.py` with field mapping: hostname(direct), operational_system(source='operacional_system'), encrypted(SerializerMethodField: crypto_disk OR crypto_usb OR crypto_memory_card), antivirus(SerializerMethodField: exists AntiVirus year=current), collaborator_id/collaborator_name(SerializerMethodField via CollaboratorMachine), machine_type(source='type')
- [x] T038 [US3] Create SoftwareListSerializer in `backend/core/serializers.py` with field mapping: license_key(source='key'), license_type(source='type_licence'), in_use(source='on_use'), expires_at(direct)
- [x] T039 [US3] Create CollaboratorController in `backend/core/controllers.py` extending BaseController: service=CollaboratorService, filterset_fields=[status, fired, office, admin_privilege], search_fields=[full_name, domain_user], ordering_fields=[full_name, date_hired], get_serializer_class returns CollaboratorListSerializer for list action
- [x] T040 [US3] Create MachineController in `backend/core/controllers.py` extending BaseController: service=MachineService, get_queryset with prefetch_related('collaboratormachine_set__collaborator', 'antivirus_records'), filterset_fields=[type, sold_out, crypto_disk], search_fields=[model, service_tag, ip]
- [x] T041 [US3] Create SoftwareController in `backend/core/controllers.py` extending BaseController: service=SoftwareService, filterset_fields=[type_licence, departament], search_fields=[software_name, key]
- [x] T042 [US3] Create FilterSets for Collaborator, Machine, Software in `backend/core/filters.py`
- [x] T043 [US3] Create `backend/core/urls.py` with DefaultRouter registering CollaboratorController('collaborators'), MachineController('machines'), SoftwareController('software')
- [x] T044 [US3] Update `backend/config/urls.py` to include `path('api/', include('core.urls'))`
- [x] T045 [US3] Verify all 3 list endpoints return exact field names and paginated format matching MSW mock responses (compare response shape field-by-field)

**Checkpoint**: Frontend Collaborators, Machines, Software pages display real data from backend (disable MSW to verify).

---

## Phase 6: User Story 4 — CRUD completo via API (Priority: P2)

**Goal**: Create, update, delete (soft) para todas as 12 entidades. Nested creation para Collaborator + Emails.

**Independent Test**: POST cria registro, PUT atualiza, DELETE faz soft delete (deleted_at preenchido, não aparece em GET).

### Implementation for User Story 4

- [x] T046 [P] [US4] Create CollaboratorDetailSerializer and CollaboratorCreateSerializer (with nested emails) in `backend/core/serializers.py`
- [x] T047 [P] [US4] Create MachineDetailSerializer and MachineCreateSerializer in `backend/core/serializers.py`
- [x] T048 [P] [US4] Create SoftwareDetailSerializer and SoftwareCreateSerializer in `backend/core/serializers.py`
- [x] T049 [US4] Update CollaboratorService.create() in `backend/core/services.py` with @transaction.atomic nested creation: pop 'emails' from data, create Collaborator, create Emails with FK
- [x] T050 [US4] Update CollaboratorController.get_serializer_class() in `backend/core/controllers.py` to return Detail for retrieve, Create for create/update actions
- [x] T051 [P] [US4] Create remaining 9 repositories in `backend/core/repositories.py`: EmailRepository, CellphoneRepository, WifiRepository, AntiVirusRepository, ServerRepository, ServerAccessRepository, ServerErpAccessRepository, DataDestroyedRepository, PenDriveRepository (all extend BaseRepository with model assignment)
- [x] T052 [P] [US4] Create remaining 9 services in `backend/core/services.py`: EmailService, CellphoneService, WifiService, AntiVirusService, ServerService, ServerAccessService, ServerErpAccessService, DataDestroyedService, PenDriveService (all extend BaseService with repository assignment)
- [x] T053 [P] [US4] Create serializers for all 9 dependent entities in `backend/core/serializers.py` (EmailSerializer, CellphoneSerializer, WifiSerializer, AntiVirusSerializer, ServerSerializer, ServerAccessSerializer, ServerErpAccessSerializer, DataDestroyedSerializer, PenDriveSerializer) extending BaseSerializer
- [x] T054 [US4] Create controllers for all 9 dependent entities in `backend/core/controllers.py` (EmailController, CellphoneController, etc.) extending BaseController with appropriate service, filterset_fields, search_fields per contracts/api-endpoints.md
- [x] T055 [US4] Update `backend/core/urls.py` to register all 12 controllers in DefaultRouter: emails, cellphones, wifi, antivirus, servers, server-access, erp-access, data-destroyed, pen-drives
- [x] T056 [US4] Verify full CRUD flow: POST creates, GET retrieves, PUT updates, DELETE soft-deletes (deleted_at set, record hidden from list). Verify nested creation of Collaborator + Emails in single request.
- [x] T056b [US4] Add management of N:N junction tables via CollaboratorDetailSerializer: add writable `software_ids` and `machine_ids` fields (list of PKs) that create/update CollaboratorSoftware and CollaboratorMachine entries in CollaboratorService.create() and update() with @transaction.atomic

**Checkpoint**: All 12 CRUD endpoints working. Soft delete verified. Nested creation verified.

---

## Phase 7: User Story 5 — Dashboard com estatísticas agregadas (Priority: P2)

**Goal**: Endpoint `/api/dashboard/stats/` retorna KPIs para o dashboard do frontend.

**Independent Test**: GET `/api/dashboard/stats/` retorna contagens corretas baseadas nos dados do banco.

### Implementation for User Story 5

- [x] T057 [US5] Create DashboardStatsView (APIView, IsAuthenticated) in `backend/core/controllers.py` with aggregation queries: active_collaborators (status=True, fired=False), total_collaborators, total_machines, total_software, pending_reports (status='pending'), total_reports, machines_without_encryption (list of hostname where all crypto_* are False)
- [x] T058 [US5] Add dashboard URL to `backend/core/urls.py`: path('dashboard/stats/', DashboardStatsView.as_view())
- [x] T059 [US5] Verify dashboard response matches exact contract format from contracts/api-endpoints.md — all field names and types correct

**Checkpoint**: Frontend Dashboard page displays real stats from backend.

---

## Phase 8: User Story 6 — Listagem e geração de relatórios (Priority: P2)

**Goal**: Listar 19 relatórios e permitir geração (atualizar status de pending→generated).

**Independent Test**: GET `/api/reports/` retorna 19 relatórios. POST `/api/reports/08/generate/` muda status.

### Implementation for User Story 6

- [x] T060 [P] [US6] Create ReportRepository in `backend/reports/repositories.py` as standalone class (NOT extending BaseRepository — Report não herda BaseModel, não tem soft_delete). Methods: get_all(), get_by_number(number), update_status(instance, status, last_generated)
- [x] T061 [P] [US6] Create ReportService in `backend/reports/services.py` with generate(number) method: find report by number, set status='generated', set last_generated=now()
- [x] T062 [P] [US6] Create ReportSerializer in `backend/reports/serializers.py` (id, number, name, name_jp, category, last_generated, status)
- [x] T063 [US6] Create ReportListController (ListAPIView) and ReportGenerateView (APIView, POST) in `backend/reports/controllers.py`
- [x] T064 [US6] Create `backend/reports/urls.py` with: reports/ (ReportListController), reports/<str:number>/generate/ (ReportGenerateView). Add placeholder for reports/<str:number>/?format=pdf|xlsx (returns 501 Not Implemented for now — spec 003)
- [x] T065 [US6] Update `backend/config/urls.py` to include `path('api/', include('reports.urls'))`
- [x] T066 [US6] Verify: GET /api/reports/ returns 19 reports with correct fields. POST /api/reports/08/generate/ changes status to 'generated' and sets last_generated.

**Checkpoint**: Frontend Reports page displays real report list. Generate button works.

---

## Phase 9: User Story 7 — Testes por camada (Priority: P3)

**Goal**: pytest executa todos os testes com 100% aprovação.

**Independent Test**: `cd backend && pytest` — all pass.

### Implementation for User Story 7

- [x] T067 [P] [US7] Create conftest.py in `backend/` with pytest-django fixtures: api_client (authenticated), collaborator factory, machine factory, software factory
- [ ] T068 [P] [US7] Create repository tests in `backend/core/tests/test_repositories.py`: test_create_collaborator, test_soft_delete, test_get_all_excludes_deleted, test_filter, test_get_by_id, test_machine_prefetch_related
- [ ] T069 [P] [US7] Create service tests in `backend/core/tests/test_services.py`: test_collaborator_nested_creation_with_emails, test_nested_creation_atomic_rollback, test_soft_delete_via_service
- [x] T070 [P] [US7] Create controller tests in `backend/core/tests/test_controllers.py`: test_list_collaborators_paginated, test_list_returns_correct_field_names, test_create_collaborator, test_soft_delete_via_api, test_unauthenticated_returns_401, test_search_filter, test_machine_list_computed_fields
- [x] T071 [P] [US7] Create auth tests in `backend/accounts/tests.py`: test_login_returns_tokens, test_me_returns_user, test_refresh_returns_new_access, test_logout_blacklists_token, test_register_admin_only, test_protected_route_without_token_returns_401
- [x] T072 [US7] Run full test suite: `cd backend && pytest` — verify 100% pass rate

**Checkpoint**: All tests pass. Backend integrity validated.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Validação final, documentação sincronizada, integração frontend-backend.

- [x] T073 [P] Verify all docstrings are in PT-BR (Google Style for Python) across all new files in backend/
- [x] T074 [P] Run `docker-compose up --build` clean test: remove volumes, rebuild, verify all services start, loaddata works
- [x] T075 Disable MSW in frontend (`packages/frontend/src/main.tsx`) and verify all 6 pages work with real backend: Login, Dashboard, Collaborators, Machines, Software, Reports
- [x] T076 Compare each endpoint response against MSW mock response field-by-field for Collaborator, Machine, Software list endpoints
- [x] T077 Run quickstart.md validation: follow all steps from scratch on clean environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — começa imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 — BLOQUEIA todas as user stories
- **US1 (Phase 3)**: Coberta por Phases 1+2
- **US2 (Phase 4)**: Depende de Phase 2 — auth independente de CRUD
- **US3 (Phase 5)**: Depende de Phase 2 — lista endpoints para 3 entidades principais
- **US4 (Phase 6)**: Depende de Phase 5 (reutiliza serializers/controllers) — CRUD completo
- **US5 (Phase 7)**: Depende de Phase 2 (Report model já criado em T015) — dashboard stats
- **US6 (Phase 8)**: Depende de Phase 2 — reports listing e geração
- **US7 (Phase 9)**: Depende de Phases 4-8 — testa tudo
- **Polish (Phase 10)**: Depende de todas as fases anteriores

### User Story Dependencies

- **US1 (Docker setup)**: Sem dependência — completa com Phase 2
- **US2 (Auth JWT)**: Sem dependência de outras stories — pode rodar em paralelo com US3
- **US3 (Listagem)**: Sem dependência de US2 (mas precisa de auth para testar via API)
- **US4 (CRUD)**: Depende de US3 (estende serializers/controllers)
- **US5 (Dashboard)**: Depende de Phase 2 apenas (Report model criado em T015, não depende de US6)
- **US6 (Reports)**: Sem dependência de outras stories
- **US7 (Tests)**: Depende de todas as stories implementadas

### Parallel Opportunities

```text
Phase 2 (após Phase 1):
  T011, T012, T013, T014, T015 → sequencial (mesmo arquivo models.py)
  T017 + T018 → paralelo (admin.py diferentes)
  T020 + T021 + T022 + T023 → paralelo (arquivos diferentes)

Phase 4 (US2) + Phase 5 (US3) → podem rodar em PARALELO após Phase 2

Phase 5 (US3):
  T030 + T031 + T032 → paralelo (repositories.py, mas seções diferentes)
  T033 + T034 + T035 → paralelo (services.py)
  T036 + T037 + T038 → sequencial (serializers.py, mas seções diferentes)

Phase 6 (US4):
  T046 + T047 + T048 → paralelo (serializers por entidade)
  T051 + T052 + T053 → paralelo (repos, services, serializers de dependentes)

Phase 7 (US5) + Phase 8 (US6) → podem rodar em PARALELO

Phase 9 (US7):
  T067 + T068 + T069 + T070 + T071 → todos paralelos (arquivos diferentes)
```

---

## Parallel Example: User Story 3 (Listagem)

```text
# Launch all repositories together:
Task T030: "Create CollaboratorRepository in backend/core/repositories.py"
Task T031: "Create MachineRepository in backend/core/repositories.py"
Task T032: "Create SoftwareRepository in backend/core/repositories.py"

# Then launch all services together:
Task T033: "Create CollaboratorService in backend/core/services.py"
Task T034: "Create MachineService in backend/core/services.py"
Task T035: "Create SoftwareService in backend/core/services.py"

# Then serializers (may need sequential due to same file):
Task T036: "Create CollaboratorListSerializer"
Task T037: "Create MachineListSerializer"
Task T038: "Create SoftwareListSerializer"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Complete Phase 1: Setup → Docker funcional
2. Complete Phase 2: Foundational → Modelos + base classes no banco
3. Complete Phase 4: US2 Auth → Login funcional
4. Complete Phase 5: US3 Listagem → 3 endpoints com dados reais
5. **STOP and VALIDATE**: Frontend exibe dados reais nas 3 páginas de listagem
6. Deploy/demo se necessário

### Incremental Delivery

1. Setup + Foundational → Infraestrutura pronta
2. US2 (Auth) → Login funcional → **Milestone: autenticação end-to-end**
3. US3 (Listagem) → 3 endpoints → **Milestone: frontend com dados reais**
4. US4 (CRUD) → 12 endpoints completos → **Milestone: gestão de dados**
5. US5 + US6 (Dashboard + Reports) → **Milestone: compliance visível**
6. US7 (Tests) → **Milestone: qualidade garantida**
7. Polish → **Milestone: produção-ready**

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências
- [Story] label mapeia task para user story específica
- Cada user story deve ser completável e testável independentemente
- Commit após cada task ou grupo lógico
- Pare em qualquer checkpoint para validar a story
- **ATENÇÃO**: Sempre comparar resposta real vs MSW mock para garantir compatibilidade frontend
- **ATENÇÃO N+1**: MachineController DEVE usar prefetch_related — não pular esta otimização
