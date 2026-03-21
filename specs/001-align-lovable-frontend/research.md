# Research: Alinhar Frontend Lovable

**Branch**: `001-align-lovable-frontend` | **Date**: 2026-03-15

## R1 — MSW (Mock Service Worker) com Vite + TypeScript

**Decision**: Usar MSW 2.x com handlers REST para simular a API Django durante desenvolvimento.

**Rationale**: MSW intercepta chamadas no nível de Service Worker, permitindo que o Axios client e React Query funcionem exatamente como em produção. Zero mudança no código de produção — apenas o bootstrap condicional em `main.tsx`.

**Alternatives considered**:
- JSON Server: requer processo separado, não suporta lógica customizada facilmente.
- Manter mockData.ts inline: mistura concerns, não testa a camada HTTP real.

**Implementation pattern**:

```text
src/mocks/
├── browser.ts         # setupWorker(…handlers)
├── handlers.ts        # barrel export de todos os handlers
├── data/
│   └── fixtures.ts    # dados mock (migrados de mockData.ts)
└── handlers/
    ├── auth.ts        # POST /api/auth/login, /refresh, /logout, GET /me
    ├── collaborators.ts  # GET /api/collaborators/ (paginado)
    ├── machines.ts       # GET /api/machines/ (paginado)
    ├── software.ts       # GET /api/software/ (paginado)
    └── reports.ts        # GET /api/reports/, POST /generate, GET /download
```

Bootstrap condicional em `main.tsx`:

```typescript
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}
enableMocking().then(() => { /* render React app */ })
```

## R2 — Axios client com interceptors JWT (substituindo Supabase)

**Decision**: Criar `src/api/client.ts` com Axios instance + interceptors, seguindo o padrão já documentado em `docs/FRONTEND.md`.

**Rationale**: O projeto já definiu este padrão na documentação original. Supabase client será removido completamente.

**Alternatives considered**:
- fetch nativo: menos ergonômico, sem interceptors nativos.
- ky: menos adotado, projeto já tem Axios nas dependências planejadas.

**Key details**:
- Base URL via `import.meta.env.VITE_API_URL` (Vite, não CRA `REACT_APP_*`).
- Interceptor de request: adiciona `Bearer <token>` de localStorage.
- Interceptor de response: renova access token via `/api/auth/refresh/` em 401, retry original.
- Falha no refresh: limpa tokens, `window.location.href = '/login'`.

## R3 — AuthContext + ProtectedRoute

**Decision**: Implementar `AuthContext` com React Context API + `ProtectedRoute` wrapper.

**Rationale**: Padrão simples e bem documentado para apps React com JWT. O projeto já tem esse padrão definido em CLAUDE.md/FRONTEND.md.

**Key details**:
- `AuthProvider` wraps app dentro de `BrowserRouter` e `QueryClientProvider`.
- Estado: `{ user, loading, login, logout }`.
- `login()`: POST `/api/auth/login/` → armazena tokens → GET `/api/auth/me/` → setUser.
- `logout()`: POST `/api/auth/logout/` → limpa tokens → setUser(null).
- `ProtectedRoute`: se `loading` → spinner, se `!user` → `Navigate to /login`, senão → children.

## R4 — React Query hooks por domínio

**Decision**: Criar hooks customizados em `src/hooks/` para cada domínio (collaborators, machines, software, reports, dashboard).

**Rationale**: Encapsula query keys, endpoints e transformações. Componentes ficam limpos e hooks são testáveis.

**Pattern**:

```typescript
// src/hooks/useCollaborators.ts
export function useCollaborators(page = 1) {
  return useQuery({
    queryKey: ['collaborators', page],
    queryFn: () => api.get(`/collaborators/?page=${page}`).then(r => r.data),
  })
}
```

**Query keys padronizadas**:
- `['collaborators', page]`
- `['machines', page]`
- `['software', page]`
- `['reports']`
- `['dashboard-stats']`

## R5 — Mapeamento de tipos: API (snake_case) ↔ Frontend (camelCase)

**Decision**: Definir tipos TypeScript para as respostas da API em snake_case e transformar para camelCase no hook/query. Os componentes usam camelCase.

**Rationale**: Django REST Framework retorna snake_case por padrão. Converter no boundary (hook) mantém o código frontend idiomático sem mudar o backend.

**Alternative considered**: Configurar DRF com CamelCaseRenderer — adiciona dependência e complexidade ao backend. Transformar no frontend é mais simples.

**Implementation**: Usar uma função utilitária `snakeToCamel` genérica ou transformar campos manualmente nos hooks (mais explícito para 4 entidades).

## R6 — Paginação server-side

**Decision**: Usar o formato padrão do DRF PageNumberPagination: `{ count, next, previous, results }`.

**Rationale**: É o padrão do DRF documentado no CLAUDE.md. Os MSW handlers devem retornar este formato.

**Frontend pattern**: O componente de paginação recebe `count` e calcula `totalPages = Math.ceil(count / 20)`. A troca de página altera a query key `['entity', page]`, triggerando novo fetch.

## R7 — Download de relatórios (blob)

**Decision**: Usar Axios com `responseType: 'blob'` e criar link temporário para download.

**Rationale**: Padrão já documentado em FRONTEND.md. Funciona com PDF e Excel.

**MSW limitation**: MSW pode retornar mock blobs para testar o fluxo de download, mas o conteúdo não será um PDF/Excel real — será um blob placeholder. Isso é suficiente para validar o fluxo.
