# Implementation Plan: Alinhar Frontend Lovable

**Branch**: `001-align-lovable-frontend` | **Date**: 2026-03-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-align-lovable-frontend/spec.md`

## Summary

Alinhar o frontend gerado pelo Lovable (`packages/frontend/`) com a arquitetura do projeto: substituir Supabase client por Axios + JWT interceptors, implementar AuthContext + ProtectedRoute, migrar dados mock para MSW handlers, integrar React Query para data fetching, e atualizar toda a documentação (FRONTEND.md, CLAUDE.md, README.md).

## Technical Context

**Language/Version**: TypeScript 5.8 + React 18.3
**Primary Dependencies**: Vite 5.4, React Router 6.30, @tanstack/react-query 5.83, Axios (a instalar), MSW 2.x (a instalar), Tailwind CSS 3.4, shadcn/ui (Radix UI)
**Storage**: N/A (frontend-only, dados via API REST)
**Testing**: Vitest 3.2 + @testing-library/react 16 + Playwright 1.57
**Target Platform**: Web browser (SPA)
**Project Type**: Web application (frontend SPA)
**Performance Goals**: < 2 segundos para carregamento de página com dados paginados
**Constraints**: MSW apenas em dev, zero dependência de Supabase em produção
**Scale/Scope**: 6 páginas, 4 entidades, 19 relatórios, ~15 arquivos novos, ~10 arquivos modificados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição não configurada (template vazio). Nenhum gate aplicável. Seguindo princípios do CLAUDE.md:

| Princípio CLAUDE.md | Status | Notas |
|---------------------|--------|-------|
| Lei de Demeter | OK | Componentes chamam hooks, hooks chamam API client. Sem cadeias. |
| Tell, Don't Ask | OK | Componentes recebem dados via hooks, não consultam estado externo. |
| Evitar Acoplamento Temporal | OK | MSW bootstrap é explícito (await antes de render). |
| Clean Code | OK | Nomes descritivos, hooks específicos por domínio. |
| SOLID - SRP | OK | Cada hook tem responsabilidade única (um domínio). |
| DRY | OK | PaginatedResponse genérico, hooks seguem mesmo padrão. |
| KISS | OK | Sem abstrações desnecessárias, solução direta. |

## Project Structure

### Documentation (this feature)

```text
specs/001-align-lovable-frontend/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: decisions & rationale
├── data-model.md        # Phase 1: TypeScript interfaces + API mapping
├── quickstart.md        # Phase 1: setup & dev workflow
├── contracts/
│   └── api-endpoints.md # Phase 1: API endpoint contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/frontend/
├── public/
│   └── mockServiceWorker.js    # MSW service worker (gerado via npx msw init)
├── src/
│   ├── main.tsx                # [MODIFY] Bootstrap MSW condicional
│   ├── App.tsx                 # [MODIFY] AuthProvider + ProtectedRoute
│   ├── api/
│   │   └── client.ts           # [NEW] Axios instance + JWT interceptors
│   ├── auth/
│   │   ├── AuthContext.tsx     # [NEW] Provider JWT
│   │   └── ProtectedRoute.tsx  # [NEW] Guard de rotas
│   ├── types/
│   │   ├── api.ts              # [NEW] PaginatedResponse, TokenPair
│   │   └── entities.ts         # [NEW] Collaborator, Machine, Software, Report, User, DashboardStats
│   ├── hooks/
│   │   ├── useCollaborators.ts # [NEW] useQuery colaboradores
│   │   ├── useMachines.ts      # [NEW] useQuery máquinas
│   │   ├── useSoftware.ts      # [NEW] useQuery software
│   │   ├── useReports.ts       # [NEW] useQuery + useMutation relatórios
│   │   └── useDashboardStats.ts# [NEW] useQuery dashboard KPIs
│   ├── mocks/
│   │   ├── browser.ts          # [NEW] MSW worker setup
│   │   ├── handlers.ts         # [NEW] Barrel export
│   │   ├── data/
│   │   │   └── fixtures.ts     # [NEW] Dados mock (migrados de mockData.ts)
│   │   └── handlers/
│   │       ├── auth.ts         # [NEW] Login/refresh/logout/me handlers
│   │       ├── collaborators.ts# [NEW] GET paginado
│   │       ├── machines.ts     # [NEW] GET paginado
│   │       ├── software.ts     # [NEW] GET paginado
│   │       ├── reports.ts       # [NEW] GET lista + POST generate + GET download
│   │       └── dashboard.ts    # [NEW] GET /api/dashboard/stats/
│   ├── pages/
│   │   ├── Login.tsx           # [MODIFY] Integrar AuthContext
│   │   ├── Dashboard.tsx       # [MODIFY] useDashboardStats
│   │   ├── Collaborators.tsx   # [MODIFY] useCollaborators + paginação
│   │   ├── Machines.tsx        # [MODIFY] useMachines + paginação
│   │   ├── SoftwarePage.tsx    # [MODIFY] useSoftware + paginação
│   │   └── Reports.tsx         # [MODIFY] useReports + download
│   ├── components/
│   │   └── AppSidebar.tsx      # [MODIFY] Logout via AuthContext
│   ├── data/
│   │   └── mockData.ts         # [DELETE] Migrado para mocks/data/fixtures.ts
│   └── integrations/
│       └── supabase/           # [DELETE] Diretório inteiro
├── .env                        # [MODIFY] Trocar VITE_SUPABASE_* por VITE_API_URL
└── package.json                # [MODIFY] +axios, +msw; -@supabase/supabase-js

docs/FRONTEND.md                # [MODIFY] Reescrever para stack real
CLAUDE.md                       # [MODIFY] Atualizar referências frontend
README.md                       # [MODIFY] Atualizar referências frontend
```

**Structure Decision**: Mantém a estrutura `packages/frontend/` criada pelo Lovable. Novos diretórios (`api/`, `auth/`, `types/`, `mocks/`) seguem organização por responsabilidade, alinhada com os padrões documentados em CLAUDE.md.

## Complexity Tracking

Nenhuma violação de constituição a justificar.
