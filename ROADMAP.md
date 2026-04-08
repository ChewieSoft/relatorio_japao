# Roadmap — Relatório JRC Brasil

Estado atual do projeto, fases de implementação e próximos passos.

## Estado Atual

Três specs já foram concluídas e mescladas na `main`:

- **001 — Align Lovable Frontend**: frontend React alinhado à arquitetura (Axios + React Query + JWT + MSW).
- **002 — Django Backend API**: backend Django REST completo (14 modelos, JWT, 12 CRUDs, dashboard, relatórios).
- **003 — Frontend CRUD for Main Entities**: CRUD frontend com formulários para Colaboradores, Máquinas e Software.

O sistema roda ponta-a-ponta via Docker Compose com autenticação, CRUD completo para as entidades principais, soft delete, busca, paginação e testes automatizados em ambas as camadas.

## O que está pronto

### Backend Django (`packages/backend/`)

- 14 modelos herdando de `BaseModel` com soft delete e `SoftDeleteManager`.
- Autenticação JWT (`/api/auth/login`, `refresh`, `logout`, `me`, `register`) com blacklist de refresh.
- 12 endpoints CRUD (`collaborators`, `machines`, `software`, `emails`, `cellphones`, `wifi`, `antivirus`, `servers`, `server-access`, `erp-access`, `data-destroyed`, `pen-drives`) com paginação (20/página), filtros e busca.
- Endpoint de dashboard (`/api/dashboard/stats/`) com agregações de colaboradores, máquinas, software e máquinas sem criptografia.
- Listagem dos 19 relatórios e marcação de geração.
- Django Admin configurado para todos os modelos.
- Migrations e seed automáticos via `entrypoint.sh`.

### Frontend React (`packages/frontend/`)

- 6 páginas: Login, Dashboard, Colaboradores, Máquinas, Software, Relatórios.
- CRUD completo com formulários (Dialog/Sheet), validação Zod + React Hook Form.
- Busca server-side com debounce, paginação, confirmação de exclusão, toasts e erros server-side.
- MSW para desenvolvimento desconectado do backend.
- 106 testes Vitest (hooks, componentes, páginas de integração) passando.

### Infraestrutura

- `docker-compose.yml` com 3 serviços: `db` (Postgres), `backend` (Django), `frontend` (Vite).
- Auto-setup do banco, superuser de dev e seed via entrypoint.
- Credenciais de dev e setup documentados no README.

## Como Usar

### Opção 1 — Stack completa via Docker

```bash
docker-compose up --build
```

- Frontend: `http://localhost:8080`
- API: `http://localhost:8000/api/`
- Admin Django: `http://localhost:8000/admin/`

### Opção 2 — Frontend isolado (MSW)

```bash
cd packages/frontend
npm install
npm run dev
```

Acesse `http://localhost:8080`. Dados são servidos pelo MSW em memória.

### Credenciais de dev

| Campo   | Valor      |
|---------|------------|
| Usuário | `admin`    |
| Senha   | `admin123` |

## Páginas e Funcionalidades

| Página        | Rota             | CRUD                            |
|---------------|------------------|---------------------------------|
| Login         | `/login`         | Autenticação JWT                |
| Dashboard     | `/dashboard`     | KPIs agregados e alertas        |
| Colaboradores | `/collaborators` | Create / Read / Update / Delete (soft) + busca |
| Máquinas      | `/machines`      | Create / Read / Update / Delete (soft) + busca |
| Software      | `/software`      | Create / Read / Update / Delete (soft) + busca |
| Relatórios    | `/reports`       | Listagem e marcação de geração  |

## Fases do Projeto

| # | Fase                 | Status      | Observações |
|---|----------------------|-------------|-------------|
| 1 | Setup do Projeto     | ✅ Concluída | Frontend (Vite + React + Tailwind + shadcn/ui) e backend (Django 4.2 + DRF + Postgres) configurados. |
| 2 | Modelos Django       | ✅ Concluída | 14 modelos + `BaseModel` com soft delete, migrations e seed (spec 002). |
| 3 | Autenticação JWT     | ✅ Concluída | Backend com `simplejwt` e blacklist; frontend com `AuthContext`, `ProtectedRoute` e interceptor Axios (specs 001 + 002). |
| 4 | CRUD API REST        | ✅ Concluída | 12 endpoints no backend + formulários completos no frontend para as 3 entidades principais (specs 002 + 003). |
| 5 | 19 Relatórios        | ⚠️ Parcial   | Listagem e marcação de geração prontas; **falta exportação PDF/XLSX**. |
| 6 | Integração Frontend  | ✅ Concluída | Axios apontando para a API real; MSW mantido como fallback de desenvolvimento (specs 001 + 003). |
| 7 | Finalização          | ⚠️ Parcial   | Docker Compose pronto; faltam testes E2E, pipeline de produção e documentação final. |

## Specs Concluídas

- [`specs/001-align-lovable-frontend`](specs/001-align-lovable-frontend) — Alinhamento do frontend Lovable com a arquitetura do projeto (Axios, React Query, JWT, MSW).
- [`specs/002-django-backend-api`](specs/002-django-backend-api) — Backend Django REST completo (14 modelos, JWT, 12 CRUDs, dashboard, relatórios).
- [`specs/003-frontend-crud-entities`](specs/003-frontend-crud-entities) — CRUD frontend para Colaboradores, Máquinas e Software.

## Próximos Passos

1. **Exportação de Relatórios (PDF/XLSX)** — implementar os 19 relatórios de auditoria no backend (ReportLab + openpyxl) e o download no frontend.
2. **CRUD de entidades dependentes** — Email, Cellphone, Wifi, AntiVirus, Server, ServerAccess, ServerErpAccess, DataDestroyed, PenDrive (hoje acessíveis apenas via Django Admin).
3. **RBAC / Permissões** — controle de acesso baseado em perfis (admin vs. usuário comum).
4. **Testes E2E** — Playwright ou Cypress cobrindo fluxos críticos (login, CRUD, geração de relatório).
5. **Pipeline CI/CD de produção** — build, testes e deploy (a CD Staging já existe).
6. **Auditoria** — log de quem alterou o quê e quando para compliance.
