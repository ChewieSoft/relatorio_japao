# Implementation Plan: Frontend CRUD para Entidades Principais

**Branch**: `003-frontend-crud-entities` | **Date**: 2026-04-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/003-frontend-crud-entities/spec.md`

## Summary

Expandir o frontend React SPA para suportar CRUD completo (Create, Read, Update, Delete) das 3 entidades principais (Collaborators, Machines, Software). O frontend atualmente opera em modo somente leitura com tabelas paginadas. O backend Django já possui endpoints CRUD completos (spec 002). Esta spec adiciona: formulários de criação/edição (Dialog para Collaborator/Software, Sheet para Machine), coluna de ações nas tabelas (editar/excluir), busca textual server-side, confirmação de exclusão, validação client-side com zod, mutations via React Query e expansão dos handlers MSW.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend React 18)
**Primary Dependencies**: React 18, React Query (@tanstack/react-query), Axios, react-hook-form 7.61, zod 3.25, shadcn/ui (Radix UI)
**Storage**: N/A (frontend consome API REST)
**Testing**: Vitest (frontend), MSW para mocks de desenvolvimento
**Target Platform**: Browser (SPA servida via Vite dev server :8080)
**Project Type**: Web application (frontend SPA)
**Performance Goals**: Listagem reflete mudanças em < 2s após mutação (SC-005)
**Constraints**: Sem mudanças no backend Django. Formulários enviam dados em snake_case (nomes do modelo). Dashboard stats invalidado após mutações.
**Scale/Scope**: 3 entidades, ~6 novos componentes, ~3 hooks expandidos, ~3 MSW handlers expandidos

## Constitution Check

*GATE: Constituição não configurada (template padrão). Sem gates bloqueantes.*

Princípios do CLAUDE.md verificados:
- [x] Lei de Demeter: Componentes chamam hooks, hooks chamam API client. Sem cadeias.
- [x] Tell, Don't Ask: Formulários recebem callbacks (onSave, onCancel), não consultam estado externo.
- [x] SOLID/SRP: Cada componente de form é responsável por uma entidade. Hooks separam queries de mutations.
- [x] DRY: DeleteConfirmDialog reutilizado para as 3 entidades. Padrão de mutation hook reutilizado.
- [x] KISS: Dialog/Sheet nativos do shadcn/ui. Sem abstrações prematuras.

## Project Structure

### Documentation (this feature)

```text
specs/003-frontend-crud-entities/
├── plan.md              # Este arquivo
├── spec.md              # Especificação funcional (com clarifications)
├── research.md          # Decisões técnicas e mapeamento de campos
├── data-model.md        # Tipos e validações dos formulários
├── quickstart.md        # Guia rápido de desenvolvimento
├── contracts/
│   └── api-crud.md      # Contratos da API REST (create/update/delete)
├── checklists/
│   └── requirements.md  # Checklist de qualidade da spec
└── tasks.md             # (gerado por /speckit.tasks)
```

### Source Code (repository root)

```text
packages/frontend/src/
├── types/
│   └── entities.ts          # MODIFICAR: adicionar tipos FormData + schemas zod
├── hooks/
│   ├── useCollaborators.ts  # MODIFICAR: adicionar useCreateCollaborator, useUpdateCollaborator, useDeleteCollaborator, search param
│   ├── useMachines.ts       # MODIFICAR: adicionar mutations + search
│   └── useSoftware.ts       # MODIFICAR: adicionar mutations + search
├── pages/
│   ├── Collaborators.tsx    # MODIFICAR: botão Novo, coluna Ações, integrar Dialog/form, busca
│   ├── Machines.tsx         # MODIFICAR: botão Novo, coluna Ações, integrar Sheet/form, busca
│   └── SoftwarePage.tsx     # MODIFICAR: botão Novo, coluna Ações, integrar Dialog/form, busca
├── components/
│   ├── CollaboratorForm.tsx    # NOVO: formulário em Dialog (create/edit)
│   ├── MachineForm.tsx         # NOVO: formulário em Sheet (create/edit)
│   ├── SoftwareForm.tsx        # NOVO: formulário em Dialog (create/edit)
│   ├── DeleteConfirmDialog.tsx # NOVO: dialog de confirmação reutilizável
│   └── SearchInput.tsx         # NOVO: campo de busca com debounce reutilizável
└── mocks/handlers/
    ├── collaborators.ts     # MODIFICAR: adicionar POST, PUT, DELETE handlers
    ├── machines.ts          # MODIFICAR: adicionar POST, PUT, DELETE handlers
    └── software.ts          # MODIFICAR: adicionar POST, PUT, DELETE handlers
```

**Structure Decision**: Componentes de form ficam em `src/components/` (não em subpastas) seguindo o padrão existente (PageHeader.tsx, StatusBadge.tsx, TableStates.tsx). Schemas zod ficam junto dos tipos em `types/` para coesão. Hooks de mutation são adicionados nos arquivos de hook existentes (não criar novos arquivos).

## Design Decisions

### D1: Form components — um por entidade

Cada entidade tem seu próprio componente de formulário (`CollaboratorForm`, `MachineForm`, `SoftwareForm`). O mesmo componente serve para create e edit, recebendo `initialData` como prop (undefined = create, preenchido = edit).

**Justificativa**: As 3 entidades têm campos muito diferentes — abstrair em um formulário genérico seria complexidade prematura e violaria KISS.

### D2: Mapeamento camelCase ↔ snake_case no hook

A transformação de nomes de campo (camelCase do form → snake_case da API) acontece no hook de mutation, NÃO no componente de form. Isso mantém a separação de responsabilidades: form trabalha com camelCase, hook é o boundary layer que converte.

**Justificativa**: Mesmo padrão já usado nos hooks de listagem (useCollaborators, useMachines, useSoftware) que convertem snake_case → camelCase na resposta.

### D3: Retrieve antes de editar

Quando o usuário clica em "Editar", o frontend busca o registro completo via `GET /api/{entity}/{id}/` (detail serializer) para popular o formulário. Não reutiliza os dados da listagem porque o list serializer tem aliases e campos computed que não correspondem aos campos do modelo.

**Justificativa**: O list serializer retorna `name` (alias de `full_name`), `department` (alias de `office`), etc. O formulário precisa dos nomes reais dos campos para enviar de volta ao backend.

### D4: DeleteConfirmDialog reutilizável

Um único componente `DeleteConfirmDialog` serve as 3 entidades, recebendo props: `open`, `onConfirm`, `onCancel`, `entityName` (ex: "o colaborador João da Silva"), `isLoading`.

**Justificativa**: DRY — o comportamento de confirmação de exclusão é idêntico para as 3 entidades.

### D5: SearchInput com debounce reutilizável

Um componente `SearchInput` com debounce de 400ms, reutilizado nas 3 páginas de listagem. O valor debounced é passado como parâmetro `search` para o hook de listagem.

**Justificativa**: DRY — busca funciona igual nas 3 listagens. Debounce evita requisições excessivas (FR-012).

### D6: Dashboard stats invalidation

Após qualquer mutação (create, update, delete), invalidar `['dashboard-stats']` além da query da entidade. Contagens de active_collaborators, total_machines, total_software mudam com create/delete.

### D7: Campos condicionais no formulário

Campos condicionais (date_fired, date_sold_out, expires_at) são renderizados dinamicamente com `watch()` do react-hook-form. Quando o campo controlador muda (fired→false), o campo condicional é limpo e escondido.

## Complexity Tracking

Nenhuma violação de constituição identificada. Sem justificativas necessárias.
