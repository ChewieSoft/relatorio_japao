# Feature Specification: Backend Django REST API

**Feature Branch**: `002-django-backend-api`
**Created**: 2026-03-29
**Status**: Draft
**Input**: Backend Django REST API — modelos, repositories, services, controllers, serializers, JWT auth, endpoints CRUD, Docker Compose + PostgreSQL.

## Contexto e Alinhamento

### O que já existe (pós spec 001-align-lovable-frontend)

O frontend React SPA em `packages/frontend/` está completo com:

- **6 páginas funcionais**: Login, Dashboard, Collaborators, Machines, Software, Reports
- **Axios client** com JWT interceptors (auto-refresh de token, Bearer header)
- **React Query hooks**: `useCollaborators`, `useMachines`, `useSoftware`, `useDashboardStats`, `useReportsList`, `useGenerateReport`, `downloadReport`
- **MSW (Mock Service Worker)** simulando toda a API em desenvolvimento
- **TypeScript types** definindo contratos de dados (Collaborator, Machine, Software, Report, User, DashboardStats)
- **AuthContext** com fluxo completo (login → token storage → profile fetch → protected routes)
- **Docker Compose** (`docker-compose.yml`) com 3 serviços definidos (db, backend, frontend) — porém backend ainda não existe
- **`.env.example`** com variáveis de ambiente para Django, PostgreSQL e CORS

### O que falta (escopo desta spec)

O diretório `backend/` **não existe**. Esta spec cobre a construção completa da API Django REST que o frontend já consome via MSW mocks, garantindo compatibilidade total com os contratos de dados estabelecidos.

### Contratos de API já definidos pelo frontend (MSW mocks)

Os endpoints e formatos de resposta abaixo são **fixos** — o backend deve implementá-los exatamente como o frontend espera:

| Endpoint                                 | Método | Formato de Resposta                                                    |
|------------------------------------------|--------|------------------------------------------------------------------------|
| `/api/auth/login/`                       | POST   | `{ access, refresh }`                                                  |
| `/api/auth/refresh/`                     | POST   | `{ access }`                                                           |
| `/api/auth/me/`                          | GET    | `{ id, username, email, is_staff }`                                    |
| `/api/auth/logout/`                      | POST   | `{}`                                                                   |
| `/api/collaborators/?page=N`             | GET    | DRF `PaginatedResponse<Collaborator>` (count, next, previous, results) |
| `/api/machines/?page=N`                  | GET    | DRF `PaginatedResponse<Machine>`                                       |
| `/api/software/?page=N`                  | GET    | DRF `PaginatedResponse<Software>`                                      |
| `/api/dashboard/stats/`                  | GET    | `DashboardStats` (agregações)                                          |
| `/api/reports/`                          | GET    | `PaginatedResponse<Report>`                                            |
| `/api/reports/:number/generate/`         | POST   | `{ status, last_generated }`                                           |
| `/api/reports/:number/?format=pdf\|xlsx` | GET    | Binary blob (Content-Disposition)                                      |

**Formato padrão de paginação DRF:**

```json
{
  "count": 50,
  "next": "http://localhost:8000/api/collaborators/?page=2",
  "previous": null,
  "results": []
}
```

**Campos retornados pelo frontend (snake_case na API, convertidos para camelCase no hook):**

- **Collaborator**: id, name, domain_user, department, status, fired, has_server_access, has_erp_access, has_internet_access, has_cellphone, email
- **Machine**: id, hostname, model, service_tag, ip, mac_address, operational_system, encrypted, antivirus, collaborator_id, collaborator_name, machine_type
- **Software**: id, software_name, license_key, license_type, quantity, in_use, expires_at
- **Report**: id, number, name, name_jp, category, last_generated, status
- **DashboardStats**: active_collaborators, total_collaborators, total_machines, total_software, pending_reports, total_reports, machines_without_encryption

### Mapeamento Plano de Implementação → Esta Spec

| Fase do Plano                | Cobertura nesta spec                                                     |
|------------------------------|--------------------------------------------------------------------------|
| Fase 1 — Setup do Projeto   | Completa (Dockerfile, manage.py, settings.py, apps)                      |
| Fase 2 — 14 Modelos Django  | Completa (BaseModel, 3 principais, 9 dependentes, 2 junção)             |
| Fase 3 — Autenticação JWT   | Completa (5 endpoints auth, simplejwt config)                            |
| Fase 4 — API REST CRUD      | Completa (12 endpoints CRUD, paginação, filtros, soft delete)            |
| Fase 5 — 19 Relatórios      | **Spec separada** (002 cobre apenas listagem e geração básica)           |
| Fase 7 — Finalização        | Parcial (Dockerfile backend, testes unitários/integração)                |

> **Nota**: A geração completa dos 19 relatórios com exportação PDF/Excel será uma spec separada (`003-reports-export`), pois envolve 19 queries específicas + templates ReportLab + openpyxl. Esta spec cobre a infraestrutura de relatórios (model Report, listagem, endpoint de geração básico) para que o frontend funcione.

---

## User Scenarios & Testing

### User Story 1 — Desenvolvedor sobe o backend com Docker (Priority: P1)

O desenvolvedor clona o repositório, executa `docker-compose up --build` e obtém o backend Django + PostgreSQL funcionando, pronto para receber requisições do frontend.

**Why this priority**: Sem o backend rodando, nenhuma outra funcionalidade pode ser validada. É o alicerce de tudo.

**Independent Test**: Executar `docker-compose up --build`, acessar `http://localhost:8000/admin/` e ver o Django Admin.

**Acceptance Scenarios**:

1. **Given** repositório clonado e `.env` configurado, **When** `docker-compose up --build`, **Then** os 3 serviços (db, backend, frontend) sobem sem erro
2. **Given** backend rodando, **When** acesso `http://localhost:8000/admin/`, **Then** vejo tela de login do Django Admin
3. **Given** backend rodando, **When** executo `python manage.py migrate`, **Then** todas as migrações são aplicadas sem erro
4. **Given** backend rodando, **When** executo `python manage.py createsuperuser`, **Then** consigo criar usuário admin

---

### User Story 2 — Usuário faz login e acessa rotas protegidas (Priority: P1)

O usuário acessa a SPA React, insere credenciais no formulário de login, recebe tokens JWT e navega por todas as páginas protegidas. Quando o access token expira, o refresh automático renova sem interromper a sessão.

**Why this priority**: Autenticação é pré-requisito para todo acesso a dados. O frontend já implementa o fluxo — o backend precisa responder nos contratos esperados.

**Independent Test**: Fazer POST em `/api/auth/login/` com credenciais válidas, usar o access token para acessar `/api/auth/me/`, e validar que rotas sem token retornam 401.

**Acceptance Scenarios**:

1. **Given** usuário registrado, **When** POST `/api/auth/login/` com credenciais corretas, **Then** resposta contém `{ access, refresh }`
2. **Given** access token válido, **When** GET `/api/auth/me/`, **Then** resposta contém `{ id, username, email, is_staff }`
3. **Given** access token expirado + refresh válido, **When** POST `/api/auth/refresh/`, **Then** novo access token é retornado
4. **Given** sem token, **When** GET `/api/collaborators/`, **Then** resposta é 401 Unauthorized
5. **Given** usuário logado, **When** POST `/api/auth/logout/` com refresh token, **Then** refresh token é invalidado (blacklisted)

---

### User Story 3 — Usuário visualiza listas de colaboradores, máquinas e software (Priority: P1)

O usuário autenticado navega pelas páginas de listagem. Os dados vêm paginados (20 por página) com suporte a filtros e busca textual. O frontend já consome esses endpoints via React Query.

**Why this priority**: É a funcionalidade principal da aplicação — visualizar dados de compliance. Sem os endpoints CRUD, a SPA não exibe dados reais.

**Independent Test**: Criar registros via Django Admin ou fixtures, chamar `GET /api/collaborators/?page=1` e verificar formato paginado com campos corretos.

**Acceptance Scenarios**:

1. **Given** 25 colaboradores no banco, **When** GET `/api/collaborators/?page=1`, **Then** resposta contém count=25, 20 resultados, next apontando para page=2
2. **Given** colaboradores no banco, **When** GET `/api/collaborators/?search=João`, **Then** apenas colaboradores com "João" no nome ou domain_user são retornados
3. **Given** máquinas no banco, **When** GET `/api/machines/?page=1`, **Then** resposta contém campos: id, hostname, model, service_tag, ip, mac_address, operational_system, encrypted, antivirus, collaborator_id, collaborator_name, machine_type
4. **Given** software no banco, **When** GET `/api/software/?page=1`, **Then** resposta contém campos: id, software_name, license_key, license_type, quantity, in_use, expires_at

---

### User Story 4 — Usuário cria, edita e remove registros via API (Priority: P2)

O usuário (ou futuro formulário de cadastro) cria novos colaboradores, máquinas e software via POST. Pode editar via PUT/PATCH e remover via DELETE (soft delete).

**Why this priority**: Importante para gestão de dados, mas o frontend atual (spec 001) foca em listagem — formulários de cadastro serão expandidos em spec futura.

**Independent Test**: POST para criar colaborador, PUT para editar, DELETE para soft-delete, verificar que GET não retorna registros deletados.

**Acceptance Scenarios**:

1. **Given** dados válidos de colaborador, **When** POST `/api/collaborators/`, **Then** colaborador é criado e retornado com id
2. **Given** colaborador existente, **When** PUT `/api/collaborators/{id}/` com dados atualizados, **Then** campos são atualizados
3. **Given** colaborador existente, **When** DELETE `/api/collaborators/{id}/`, **Then** `deleted_at` é preenchido (soft delete), registro não aparece em GET
4. **Given** colaborador com emails, **When** POST `/api/collaborators/` com nested emails, **Then** colaborador e emails são criados em transação atômica

---

### User Story 5 — Dashboard exibe estatísticas agregadas (Priority: P2)

O dashboard do frontend exibe KPIs (colaboradores ativos, total de máquinas, software, relatórios pendentes, máquinas sem criptografia). O backend fornece esses dados via endpoint agregado.

**Why this priority**: Dashboard é a primeira tela após login — precisa funcionar para boa experiência, mas depende dos modelos e dados já existirem.

**Independent Test**: Popular banco com dados de teste, chamar `GET /api/dashboard/stats/` e verificar que as contagens batem.

**Acceptance Scenarios**:

1. **Given** 10 colaboradores (8 ativos, 2 demitidos) e 5 máquinas (2 sem criptografia), **When** GET `/api/dashboard/stats/`, **Then** resposta contém active_collaborators=8, total_collaborators=10, total_machines=5, machines_without_encryption com 2 itens
2. **Given** 19 relatórios configurados (3 gerados), **When** GET `/api/dashboard/stats/`, **Then** pending_reports=16, total_reports=19

---

### User Story 6 — Listagem e geração básica de relatórios (Priority: P2)

O frontend lista os 19 relatórios de compliance com nome, nome japonês, categoria e status. O usuário pode disparar a geração de um relatório, que atualiza o status de "pending" para "generated".

**Why this priority**: A página de relatórios já existe no frontend. A geração completa com PDF/Excel será spec separada, mas a infraestrutura (model, listagem, status) precisa existir.

**Independent Test**: GET `/api/reports/` retorna os 19 relatórios. POST `/api/reports/08/generate/` muda status para "generated".

**Acceptance Scenarios**:

1. **Given** 19 relatórios seed no banco, **When** GET `/api/reports/`, **Then** resposta contém 19 relatórios com campos: id, number, name, name_jp, category, last_generated, status
2. **Given** relatório 08 com status "pending", **When** POST `/api/reports/08/generate/`, **Then** status muda para "generated" e last_generated é preenchido
3. **Given** relatório 08 com status "generated", **When** GET `/api/reports/08/?format=pdf`, **Then** retorna placeholder (infraestrutura de export será completada na spec 003)

---

### User Story 7 — Testes validam integridade do backend (Priority: P3)

O desenvolvedor executa `pytest` e todos os testes passam — cobrindo repositories, services e controllers para as entidades principais.

**Why this priority**: Testes garantem que refatorações futuras não quebram funcionalidade, mas a funcionalidade em si é mais urgente.

**Independent Test**: Executar `cd backend && pytest` e verificar que todos os testes passam.

**Acceptance Scenarios**:

1. **Given** backend com testes escritos, **When** `pytest`, **Then** todos os testes passam
2. **Given** testes de repository, **When** executados, **Then** validam create, get_all, get_by_id, soft_delete, filter
3. **Given** testes de controller, **When** executados, **Then** validam respostas HTTP corretas (200, 201, 204, 401)

---

### Edge Cases

- O que acontece quando o frontend envia um campo extra não esperado pelo serializer? Deve ser ignorado silenciosamente.
- Como o sistema lida com tentativa de criar colaborador com domain_user duplicado? Retorna 400 com mensagem clara.
- O que acontece quando DELETE é chamado em registro já soft-deleted? Retorna 404 (SoftDeleteManager filtra automaticamente).
- Como o sistema lida com refresh token já blacklisted? Retorna 401.
- O que acontece quando page=999 (além dos dados)? Retorna lista vazia com count correto.

## Requirements

### Functional Requirements

**Setup e Infraestrutura:**

- **FR-001**: Sistema DEVE inicializar com `docker-compose up --build` sem erros, subindo PostgreSQL, Django e React
- **FR-002**: Sistema DEVE aplicar migrações automaticamente criando todas as 14 tabelas + tabela Report
- **FR-003**: Sistema DEVE disponibilizar Django Admin em `/admin/` com todos os 14 modelos registrados

**Modelos (14 entidades):**

- **FR-004**: Sistema DEVE implementar BaseModel abstrato com campos `created_at`, `updated_at`, `deleted_at` e método `soft_delete()`
- **FR-005**: Sistema DEVE implementar SoftDeleteManager que filtra registros com `deleted_at IS NULL` por padrão
- **FR-006**: Sistema DEVE implementar 3 entidades principais: Collaborator (unique: full_name, domain_user), Machine (unique: service_tag, ip, mac_address), Software
- **FR-007**: Sistema DEVE implementar 9 entidades dependentes com FK correta: Email→Collaborator, Cellphone→Collaborator, Wifi→Collaborator, AntiVirus→Machine, Server→Machine, ServerAccess→Collaborator, ServerErpAccess→Collaborator, DataDestroyed→Machine, PenDrive→Collaborator
- **FR-008**: Sistema DEVE implementar 2 tabelas de junção N:N: CollaboratorSoftware, CollaboratorMachine

**Autenticação JWT:**

- **FR-009**: Sistema DEVE autenticar via JWT com access token (30 min) e refresh token (1 dia)
- **FR-010**: Sistema DEVE implementar 5 endpoints de auth: login, refresh, register (restrito a staff/admin), me, logout
- **FR-011**: Sistema DEVE retornar 401 para qualquer endpoint protegido sem token válido
- **FR-012**: Sistema DEVE invalidar (blacklist) refresh token no logout e rotacionar refresh tokens

**API REST CRUD:**

- **FR-013**: Sistema DEVE implementar endpoints CRUD completo (list, create, retrieve, update, destroy) para todas as 12 entidades, incluindo dependentes (Email, Cellphone, Wifi, etc.), com rotas correspondentes
- **FR-014**: Sistema DEVE paginar respostas de lista com 20 itens por página usando formato DRF padrão (count, next, previous, results)
- **FR-015**: Sistema DEVE suportar filtros por campos, busca textual e ordenação em endpoints de lista
- **FR-016**: Sistema DEVE usar soft delete em todas as operações de remoção (nunca delete físico)
- **FR-017**: Sistema DEVE suportar nested creation (criar colaborador com emails em uma única requisição via transação atômica)
- **FR-017b**: Tabelas de junção N:N (CollaboratorSoftware, CollaboratorMachine) DEVEM ser gerenciadas via campos `software_ids` e `machine_ids` no CollaboratorDetailSerializer — sem endpoints CRUD próprios

**Dashboard:**

- **FR-018**: Sistema DEVE fornecer endpoint `/api/dashboard/stats/` com contagens agregadas: active_collaborators, total_collaborators, total_machines, total_software, pending_reports, total_reports, machines_without_encryption

**Relatórios (infraestrutura):**

- **FR-019**: Sistema DEVE implementar model Report para armazenar metadados dos 19 relatórios (number, name, name_jp, category, status, last_generated)
- **FR-020**: Sistema DEVE seed os 19 relatórios no banco (via fixture ou migration)
- **FR-021**: Sistema DEVE implementar endpoint de listagem e endpoint de geração que atualiza status

**Compatibilidade com Frontend:**

- **FR-022**: Todos os endpoints DEVEM retornar campos em snake_case conforme contratos definidos nas MSW mocks
- **FR-023**: Sistema DEVE configurar CORS para aceitar requisições de `http://localhost:8080`

**Testes:**

- **FR-024**: Sistema DEVE incluir testes por camada: repositories, services e controllers para as 3 entidades principais (Collaborator, Machine, Software)
- **FR-025**: Sistema DEVE incluir testes de autenticação (login, protected routes, refresh)

### Key Entities

- **Collaborator**: Funcionário da JRC com dados de domínio, permissões e status. Entidade principal com mais relações dependentes (Email, Cellphone, Wifi, ServerAccess, ServerErpAccess, PenDrive). Campos computed para o frontend: has_server_access, has_erp_access, has_internet_access, has_cellphone, email.
- **Machine**: Computador/notebook com dados de hardware, rede e criptografia. Tem relações com AntiVirus, Server, DataDestroyed. Campo computed: encrypted (derivado de crypto_disk/usb/memory_card), machine_type (derivado do campo type).
- **Software**: Licença de software com controle de quantidade e uso. Relaciona-se com colaboradores via tabela de junção CollaboratorSoftware.
- **Report**: Metadados dos 19 relatórios de compliance. Não armazena dados do relatório em si — apenas número, nome, categoria e status de geração.
- **User (Django)**: Usuário do sistema de autenticação Django padrão. Usado para login JWT.

## Clarifications

### Session 2026-03-29

- Q: Endpoints CRUD para entidades dependentes (Email, Cellphone, Wifi, etc.) — implementar agora ou adiar? → A: CRUD completo para todas as 12 entidades, incluindo dependentes. Custo marginal baixo via herança de BaseController/BaseService/BaseRepository.
- Q: Endpoint `/api/auth/register/` — aberto, restrito a admins, ou fora do escopo? → A: Incluir register restrito a staff/admin only. Criação de usuários via API segura sem depender do Django Admin.
- Q: Estratégia para campos divergentes entre frontend e modelo (name/full_name, hostname, department/office, expires_at) → A: Manter nomes originais nos modelos Django, serializers mapeiam para o contrato do frontend via field aliases/source. Exceção: `expires_at` é campo NOVO no modelo Software (não é alias de `last_purchase_date` — são semanticamente distintos).
- Q: Deep search gaps (Context7 + MSW cross-check, 2026-03-29) → Resolvidos: (1) logout usa simplejwt TokenBlacklistView built-in (status 200, não 205); (2) hostname é campo novo no model Machine; (3) machines_without_encryption retorna hostname (alinhado com MSW); (4) register endpoint não tem MSW handler (esperado — é admin-only); (5) BLACKLIST_AFTER_ROTATION default é False — configurar explicitamente True; (6) MachineController requer prefetch_related para evitar N+1.

## Assumptions

- O frontend converte snake_case→camelCase no hook boundary layer. O backend retorna tudo em snake_case.
- Campos "computed" do frontend (has_server_access, has_erp_access, etc.) serão campos calculados no serializer ou propriedades do model, derivados das relações existentes.
- O campo `name` do Collaborator no frontend mapeia para `full_name` no model (serializer usa `source='full_name'`).
- O campo `hostname` de Machine é um campo NOVO no modelo (CharField, blank=True). É um dado real de inventário (nome de rede do computador), não derivável dos campos existentes. Confirmado via research.md R7.
- O campo `department` do Collaborator no frontend mapeia para `office` no modelo (serializer usa `source='office'`).
- O campo `expires_at` de Software é um campo NOVO (não existia no Prisma original). O modelo terá ambos: `last_purchase_date` (data da compra, original) e `expires_at` (data de expiração da licença, novo). São semanticamente distintos — `expires_at` é null para licenças perpetual/OEM e preenchido para subscription.
- O model Report é novo (não existia no Prisma schema original) — será criado para atender o frontend.
- Fixtures com dados de teste serão criadas para popular o banco em desenvolvimento.
- A spec 003 (futura) cobrirá: 19 queries específicas de relatório, exportação PDF com ReportLab, exportação Excel com openpyxl.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `docker-compose up --build` inicia os 3 serviços em menos de 3 minutos sem erro
- **SC-002**: Todos os 14 modelos + Report são criados no banco via migrations sem erro
- **SC-003**: Usuário consegue fazer login, acessar dados protegidos e ter token renovado automaticamente sem interrupção
- **SC-004**: Todas as páginas do frontend (Login, Dashboard, Collaborators, Machines, Software, Reports) exibem dados reais do backend ao desabilitar MSW
- **SC-005**: Endpoints de listagem retornam dados paginados no formato exato esperado pelo frontend (validável comparando resposta real vs resposta MSW)
- **SC-006**: Soft delete funciona corretamente — registros deletados não aparecem em listagens
- **SC-007**: `pytest` executa todos os testes com 100% de aprovação
- **SC-008**: Django Admin permite CRUD completo de todos os 14 modelos com filtros e busca

## Scope Boundary — O que NÃO está nesta spec

- Geração real de dados dos 19 relatórios (queries por relatório) → spec 003
- Exportação PDF com ReportLab → spec 003
- Exportação Excel com openpyxl → spec 003
- Formulários de cadastro/edição no frontend → spec futura
- Docker produção (gunicorn, nginx) → spec futura
- Testes E2E (Playwright) → spec futura
- Django Admin customizado com inlines → nice-to-have, não obrigatório

## Lições de Implementação (Post-Mortem)

Problemas encontrados durante implementação e 3 rodadas de code review que a spec original não previa. Documentados aqui para evitar recorrência em specs futuras.

### Arquitetura

| Lição | Impacto | Regra derivada |
|-------|---------|---------------|
| `on_delete=CASCADE` em FKs conflita com soft delete — parent deletado fisicamente cascateia e remove children | CRITICAL | Todas as FKs DEVEM usar `on_delete=PROTECT`. Documentar em data-model.md |
| `unique_together` não considera soft-deleted — re-criar relação após soft delete causa IntegrityError | CRITICAL | Junction tables com soft delete DEVEM usar `UniqueConstraint` com `condition=Q(deleted_at__isnull=True)` |
| Controller com ORM direto (DashboardStatsView) viola Lei de Demeter | HIGH | Mesmo endpoints simples de agregação DEVEM ter Service. Criar `DashboardService.get_stats()` |
| Import cross-app (`from reports.repositories`) viola regra do CLAUDE.md | HIGH | Usar `django.apps.apps.get_model('app', 'Model')` para acessar modelos de outros apps |
| `perform_create/update` sem `serializer.instance` faz DRF retornar validated_data bruto (sem id) | HIGH | BaseController DEVE atribuir `serializer.instance = self.service.create/update(...)` |

### Serializers

| Lição | Impacto | Regra derivada |
|-------|---------|---------------|
| `EmailSerializer` com `fields='__all__'` exige collaborator FK em nested creation — falha com 400 | HIGH | Nested input serializers DEVEM excluir FK do parent. Criar `EmailInputSerializer(exclude=['collaborator'])` |
| `.first()` e `.filter()` em SerializerMethodField bypassa prefetch_related — causa N+1 | CRITICAL | SEMPRE usar `.all()` e indexar `[0]` para acessar relações prefetched |
| `Service.update()` não faz pop de 'emails' — `setattr(instance, 'emails', ...)` gera erro Django | HIGH | Service.update() DEVE extrair campos de relação reversa antes de delegar ao repository |

### Segurança

| Lição | Impacto | Regra derivada |
|-------|---------|---------------|
| `SECRET_KEY` e `DB_PASSWORD` com default hardcoded funcionam em produção se .env está ausente | HIGH | Defaults apenas quando `DEBUG=True`. Em produção (`DEBUG=False`), crash no startup se ausente |

### Infraestrutura Docker

| Lição | Impacto | Regra derivada |
|-------|---------|---------------|
| Frontend sem Dockerfile impede `docker-compose up --build` com 3 serviços | HIGH | Todo serviço no docker-compose DEVE ter Dockerfile |
| `entrypoint.sh` com CRLF (Windows) gera "no such file or directory" no container Linux | CRITICAL | Criar `.gitattributes` com `*.sh eol=lf` no diretório do backend |
| `pg_isready -U admin` sem `-d` faz healthcheck tentar database "admin" (inexistente) | HIGH | Healthcheck DEVE incluir `-d ${POSTGRES_DB}` |
| `version: '3.8'` no docker-compose.yml gera warning — atributo obsoleto | LOW | Remover `version:` do docker-compose.yml |
| Sem auto-seed (loaddata) e auto-createsuperuser, desenvolvedor precisa de passos manuais | MEDIUM | `entrypoint.sh` deve rodar `loaddata` e criar superuser dev automaticamente |

### Documentação

| Lição | Impacto | Regra derivada |
|-------|---------|---------------|
| `collaboratormachine_set` nos exemplos mas `related_name='collaborator_machines'` no código | MEDIUM | Documentação DEVE usar o `related_name` definido no modelo, não o default Django |
| `timezone.timedelta` não existe — gera AttributeError | LOW | Usar `datetime.timedelta` (importar de `datetime`, não de `django.utils.timezone`) |
| Credenciais de dev (admin/admin123) não documentadas — desenvolvedor não sabe como logar | MEDIUM | README e quickstart DEVEM documentar credenciais de desenvolvimento |
