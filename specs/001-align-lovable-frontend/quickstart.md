# Quickstart: Alinhar Frontend Lovable

**Branch**: `001-align-lovable-frontend` | **Date**: 2026-03-15

## Pré-requisitos

- Node.js 18+
- npm ou bun

## Setup

```bash
cd packages/frontend
npm install
```

## Desenvolvimento (com MSW)

```bash
npm run dev
```

O MSW será ativado automaticamente em modo desenvolvimento, interceptando chamadas à API com dados mock. Acesse `http://localhost:8080`.

**Credenciais mock**: `admin` / `admin123`

## Estrutura de arquivos novos

```text
packages/frontend/src/
├── api/
│   └── client.ts              # Axios instance + JWT interceptors
├── auth/
│   ├── AuthContext.tsx         # Provider de autenticação JWT
│   └── ProtectedRoute.tsx     # Wrapper para rotas autenticadas
├── hooks/
│   ├── useCollaborators.ts    # useQuery para colaboradores
│   ├── useMachines.ts         # useQuery para máquinas
│   ├── useSoftware.ts         # useQuery para software
│   ├── useReports.ts          # useQuery + useMutation para relatórios
│   └── useDashboardStats.ts   # useQuery para KPIs do dashboard
├── mocks/
│   ├── browser.ts             # MSW worker setup
│   ├── handlers.ts            # Barrel export de handlers
│   ├── data/
│   │   └── fixtures.ts        # Dados mock (ex-mockData.ts)
│   └── handlers/
│       ├── auth.ts            # Handlers de autenticação
│       ├── collaborators.ts   # Handlers de colaboradores
│       ├── machines.ts        # Handlers de máquinas
│       ├── software.ts        # Handlers de software
│       └── reports.ts         # Handlers de relatórios + dashboard
└── types/
    ├── api.ts                 # PaginatedResponse, TokenPair
    └── entities.ts            # Collaborator, Machine, Software, Report, User
```

## Arquivos modificados

```text
packages/frontend/src/
├── main.tsx                   # Bootstrap condicional MSW
├── App.tsx                    # AuthProvider + ProtectedRoute nas rotas
├── pages/
│   ├── Login.tsx              # Integrar com AuthContext.login()
│   ├── Dashboard.tsx          # Substituir mockData por useDashboardStats
│   ├── Collaborators.tsx      # Substituir mockData por useCollaborators
│   ├── Machines.tsx           # Substituir mockData por useMachines
│   ├── SoftwarePage.tsx       # Substituir mockData por useSoftware
│   └── Reports.tsx            # Substituir mockData por useReports
└── components/
    └── AppSidebar.tsx         # Integrar logout com AuthContext
```

## Arquivos removidos

```text
packages/frontend/src/
├── integrations/supabase/     # Diretório inteiro (client.ts + types.ts)
└── data/mockData.ts           # Migrado para mocks/data/fixtures.ts
```

## Testes

```bash
npm run test           # Vitest
npm run test:watch     # Vitest watch mode
```

## Build de produção

```bash
npm run build
```

O MSW **não** é incluído no build de produção. Em produção, o frontend espera a API Django real em `VITE_API_URL`.

## Variáveis de ambiente

```env
# Desenvolvimento
VITE_API_URL=http://localhost:8000/api

# Produção (com nginx proxy reverso)
VITE_API_URL=/api
```
