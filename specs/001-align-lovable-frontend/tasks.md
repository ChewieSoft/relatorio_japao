# Tasks: Alinhar Frontend Lovable com Arquitetura do Projeto

**Input**: Design documents from `/specs/001-align-lovable-frontend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-endpoints.md, quickstart.md

**Tests**: Not requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, remove Supabase, configure environment

- [x] T001 Install axios and msw as dependencies in packages/frontend/package.json (`npm install axios` and `npm install -D msw`)
- [x] T002 Remove @supabase/supabase-js dependency from packages/frontend/package.json (`npm uninstall @supabase/supabase-js`)
- [x] T003 Delete Supabase integration directory packages/frontend/src/integrations/supabase/ (client.ts + types.ts)
- [x] T004 Update packages/frontend/.env — replace VITE_SUPABASE_* variables with VITE_API_URL=http://localhost:8000/api
- [x] T005 Initialize MSW service worker via `npx msw init packages/frontend/public --save`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Create TypeScript API types in packages/frontend/src/types/api.ts — define PaginatedResponse<T> and TokenPair interfaces per data-model.md
- [x] T007 [P] Create TypeScript entity types in packages/frontend/src/types/entities.ts — define Collaborator, Machine, Software, Report, User, DashboardStats interfaces per data-model.md (camelCase)
- [x] T008 Create Axios client with JWT interceptors in packages/frontend/src/api/client.ts — base URL from VITE_API_URL, request interceptor (Bearer token from localStorage), response interceptor (auto-refresh on 401, redirect to /login on refresh failure) per research.md R2
- [x] T009 Migrate mock data from packages/frontend/src/data/mockData.ts to packages/frontend/src/mocks/data/fixtures.ts — convert existing Lovable interfaces to new entity types, add auth fixtures (mock user, mock tokens), add dashboard stats fixture, wrap in DRF paginated response format
- [x] T010 [P] Create MSW auth handlers in packages/frontend/src/mocks/handlers/auth.ts — POST /api/auth/login/ (validate admin/admin123, return tokens), POST /api/auth/refresh/ (return new access), GET /api/auth/me/ (return mock user), POST /api/auth/logout/ (return 200)
- [x] T011 [P] Create MSW collaborators handler in packages/frontend/src/mocks/handlers/collaborators.ts — GET /api/collaborators/ with page parameter, return PaginatedResponse from fixtures
- [x] T012 [P] Create MSW machines handler in packages/frontend/src/mocks/handlers/machines.ts — GET /api/machines/ with page parameter, return PaginatedResponse from fixtures
- [x] T013 [P] Create MSW software handler in packages/frontend/src/mocks/handlers/software.ts — GET /api/software/ with page parameter, return PaginatedResponse from fixtures
- [x] T014 [P] Create MSW reports handler in packages/frontend/src/mocks/handlers/reports.ts — GET /api/reports/ (list), POST /api/reports/{number}/generate/ (return generated status), GET /api/reports/{number}/?format=pdf|xlsx (return mock blob)
- [x] T015 [P] Create MSW dashboard handler in packages/frontend/src/mocks/handlers/dashboard.ts — GET /api/dashboard/stats/ returning computed stats from fixtures
- [x] T016 Create MSW handlers barrel export in packages/frontend/src/mocks/handlers.ts — import and spread all handlers from handlers/
- [x] T017 Create MSW browser worker setup in packages/frontend/src/mocks/browser.ts — setupWorker(...handlers) with onUnhandledRequest: 'bypass'
- [x] T018 Update packages/frontend/src/main.tsx — add async enableMocking() that conditionally imports mocks/browser in DEV mode, await before ReactDOM.createRoot().render()
- [x] T019 Delete packages/frontend/src/data/mockData.ts after fixtures migration is verified

**Checkpoint**: Foundation ready — MSW intercepts all API calls, Axios client configured, types defined. User story implementation can now begin.

---

## Phase 3: User Story 1 — Autenticação JWT (Priority: P1) 🎯 MVP

**Goal**: Login funcional com JWT, rotas protegidas, logout, auto-refresh de token

**Independent Test**: Acessar /dashboard sem login → redireciona para /login. Fazer login com admin/admin123 → redireciona para /dashboard. Clicar "Sair" → volta para /login.

### Implementation for User Story 1

- [x] T020 [US1] Create AuthContext provider in packages/frontend/src/auth/AuthContext.tsx — state (user, loading), login() calls POST /api/auth/login/ then GET /api/auth/me/, logout() calls POST /api/auth/logout/ and clears localStorage, useEffect checks existing token on mount
- [x] T021 [US1] Create ProtectedRoute component in packages/frontend/src/auth/ProtectedRoute.tsx — if loading show spinner, if !user Navigate to /login, else render children
- [x] T022 [US1] Update packages/frontend/src/App.tsx — wrap routes with AuthProvider (inside BrowserRouter, inside QueryClientProvider), wrap all routes except /login with ProtectedRoute, configure QueryClient with staleTime 5min / gcTime 10min / retry 1 / refetchOnWindowFocus false
- [x] T023 [US1] Update packages/frontend/src/pages/Login.tsx — replace demo navigate with AuthContext.login(username, password), add error state for invalid credentials, add loading state during login request, remove demo credentials hint text
- [x] T024 [US1] Update packages/frontend/src/components/AppSidebar.tsx — replace logout link with button that calls AuthContext.logout(), display logged-in username from AuthContext.user

**Checkpoint**: Login → Dashboard → Logout flow works end-to-end via MSW. All routes protected.

---

## Phase 4: User Story 2 — Listagem de Dados Reais (Priority: P2)

**Goal**: Páginas de colaboradores, máquinas e software exibem dados da API com paginação server-side, loading e error states

**Independent Test**: Navegar para /collaborators → tabela carrega dados via API (MSW). Clicar página 2 → novos dados carregam. Parar MSW → mensagem de erro com botão retry.

### Implementation for User Story 2

- [x] T025 [P] [US2] Create useCollaborators hook in packages/frontend/src/hooks/useCollaborators.ts — useQuery with key ['collaborators', page], GET /api/collaborators/?page={page}, transform snake_case to camelCase
- [x] T026 [P] [US2] Create useMachines hook in packages/frontend/src/hooks/useMachines.ts — useQuery with key ['machines', page], GET /api/machines/?page={page}, transform snake_case to camelCase
- [x] T027 [P] [US2] Create useSoftware hook in packages/frontend/src/hooks/useSoftware.ts — useQuery with key ['software', page], GET /api/software/?page={page}, transform snake_case to camelCase
- [x] T028 [US2] Update packages/frontend/src/pages/Collaborators.tsx — replace mockCollaborators import with useCollaborators(page) hook, add pagination state and controls, add loading skeleton using Skeleton component, add error state with retry button, update table to use new Collaborator type fields (domainUser instead of domain)
- [x] T029 [US2] Update packages/frontend/src/pages/Machines.tsx — replace mockMachines import with useMachines(page) hook, add pagination state and controls, add loading/error states, update table to use new Machine type fields (macAddress, operationalSystem, machineType)
- [x] T030 [US2] Update packages/frontend/src/pages/SoftwarePage.tsx — replace mockSoftware import with useSoftware(page) hook, add pagination state and controls, add loading/error states, update table to use new Software type fields (softwareName)

**Checkpoint**: All three listing pages show data from API (MSW) with pagination, loading states, and error handling.

---

## Phase 5: User Story 3 — Relatórios de Auditoria (Priority: P3)

**Goal**: Página de relatórios lista os 19 relatórios da API, permite gerar relatórios e fazer download em PDF/Excel

**Independent Test**: Navegar para /reports → 19 relatórios listados com status. Clicar "Gerar" em relatório pendente → status muda para "gerado". Clicar "PDF" em relatório gerado → arquivo baixado.

### Implementation for User Story 3

- [x] T031 [US3] Create useReports hook in packages/frontend/src/hooks/useReports.ts — useQuery with key ['reports'] for GET /api/reports/, useMutation for POST /api/reports/{number}/generate/ with invalidateQueries(['reports']) on success, downloadReport function for GET /api/reports/{number}/?format={format} with responseType blob and programmatic download
- [x] T032 [US3] Update packages/frontend/src/pages/Reports.tsx — replace mockReports import with useReports() hook, add "Gerar" button for pending reports (calls generate mutation), add "PDF" and "Excel" download buttons for generated/sent reports (calls downloadReport), add loading/error states, show report number field alongside name

**Checkpoint**: Reports page lists all 19 reports from API, generation and download work via MSW.

---

## Phase 6: User Story 4 — Dashboard com KPIs Reais (Priority: P4)

**Goal**: Dashboard exibe indicadores reais vindos da API em vez de computar a partir de mock data local

**Independent Test**: Navegar para /dashboard → KPI cards mostram números vindos da API. Navegar para outra página e voltar → dados carregam do cache.

### Implementation for User Story 4

- [x] T033 [US4] Create useDashboardStats hook in packages/frontend/src/hooks/useDashboardStats.ts — useQuery with key ['dashboard-stats'], GET /api/dashboard/stats/, transform snake_case to camelCase
- [x] T034 [US4] Update packages/frontend/src/pages/Dashboard.tsx — replace all mockData imports with useDashboardStats() hook, update KPI cards to use DashboardStats fields, update pending/completed reports lists to use useReports() hook (reuse from US3), update security alerts to use machinesWithoutEncryption from stats, add loading/error states

**Checkpoint**: Dashboard shows live KPIs from API. Cache works on re-navigation.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates and cleanup

- [x] T035 [P] Rewrite docs/FRONTEND.md — update to reflect real stack (Vite, TypeScript, shadcn/ui, React Query, Axios, MSW), update directory structure, update dependency table, update route table, update code examples for AuthContext/ProtectedRoute/hooks/Axios client per current implementation
- [x] T036 [P] Update CLAUDE.md — change frontend/ references to packages/frontend/, update "Comandos Rapidos" section (npm run dev instead of npm start, Vite port 8080), update "Estrutura do Monorepo" tree, update Frontend Stack section to mention Vite/TypeScript/MSW, change REACT_APP_API_URL to VITE_API_URL in anti-patterns
- [x] T037 [P] Update README.md — change frontend/ references to packages/frontend/, update "Como Executar" frontend commands (npm run dev, Vite), update architecture table (Vite instead of CRA, TypeScript instead of JavaScript), update project structure tree
- [x] T038 Add JSDoc docstrings in PT-BR to all new files — AuthContext.tsx, ProtectedRoute.tsx, client.ts, all hooks (useCollaborators, useMachines, useSoftware, useReports, useDashboardStats), all types (api.ts, entities.ts), all MSW handlers, browser.ts per CLAUDE.md docstring rules
- [x] T039 Run quickstart.md validation — verify npm install succeeds, npm run dev starts without errors, login flow works, all pages load data, report download triggers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 Auth (Phase 3)**: Depends on Foundational — BLOCKS US2, US3, US4 (routes need auth)
- **US2 Listings (Phase 4)**: Depends on US1 (pages need authenticated Axios client)
- **US3 Reports (Phase 5)**: Depends on US1 (pages need authenticated Axios client), independent of US2
- **US4 Dashboard (Phase 6)**: Depends on US1, can reuse useReports from US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundational → US1 (no other story dependencies)
- **US2 (P2)**: Foundational → US1 → US2 (needs auth working)
- **US3 (P3)**: Foundational → US1 → US3 (needs auth working, independent of US2)
- **US4 (P4)**: Foundational → US1 → US4 (needs auth, can reuse US3 useReports hook if available)

### Within Each User Story

- Types and hooks before page modifications
- Core functionality before polish
- Story complete before moving to next priority

### Parallel Opportunities

- T006 + T007: Types files are independent
- T010 + T011 + T012 + T013 + T014 + T015: All MSW handlers are independent files (after T009 fixtures)
- T025 + T026 + T027: All listing hooks are independent files
- T035 + T036 + T037: All documentation files are independent

---

## Parallel Example: Phase 2 (Foundational)

```text
# Batch 1 — Types (parallel):
T006: Create API types in src/types/api.ts
T007: Create entity types in src/types/entities.ts

# Batch 2 — After types, Axios client:
T008: Create Axios client in src/api/client.ts

# Batch 3 — Fixtures (must complete before handlers):
T009: Migrate fixtures to src/mocks/data/fixtures.ts

# Batch 4 — After fixtures, MSW handlers (parallel):
T010: Auth handlers in src/mocks/handlers/auth.ts
T011: Collaborators handler in src/mocks/handlers/collaborators.ts
T012: Machines handler in src/mocks/handlers/machines.ts
T013: Software handler in src/mocks/handlers/software.ts
T014: Reports handler in src/mocks/handlers/reports.ts
T015: Dashboard handler in src/mocks/handlers/dashboard.ts

# Batch 5 — After handlers:
T016: Handlers barrel export
T017: MSW browser setup
T018: Update main.tsx with MSW bootstrap
T019: Delete old mockData.ts
```

## Parallel Example: Phase 4 (US2 Listings)

```text
# Batch 1 — Hooks (parallel):
T025: useCollaborators hook
T026: useMachines hook
T027: useSoftware hook

# Batch 2 — Pages (sequential, each touches different file but shares pattern):
T028: Update Collaborators.tsx
T029: Update Machines.tsx
T030: Update SoftwarePage.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T019)
3. Complete Phase 3: User Story 1 — Auth (T020-T024)
4. **STOP and VALIDATE**: Login → Dashboard → Logout works via MSW
5. Demo-ready with auth flow

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 Auth → Test login flow → **MVP!**
3. Add US2 Listings → Test data pages → Demo data tables
4. Add US3 Reports → Test generation + download → Demo reports
5. Add US4 Dashboard → Test KPIs → Full feature complete
6. Polish → Documentation updated → Release ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All data flows through MSW in dev mode — same Axios/React Query code works against real Django API
- snake_case → camelCase transformation happens in hooks (boundary layer)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
