# Tasks: Frontend CRUD para Entidades Principais

**Input**: Design documents from `/specs/003-frontend-crud-entities/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Types, schemas and MSW handlers that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Add FormData types, Zod validation schemas and camelCase↔snake_case mapping helpers in `packages/frontend/src/types/entities.ts`
  - `CollaboratorFormData` (10 fields), `MachineFormData` (18 fields), `SoftwareFormData` (10 fields)
  - `collaboratorSchema`, `machineSchema`, `softwareSchema` with conditional fields (dateFired when fired=true, dateSoldOut when soldOut=true, expiresAt when typeLicence='subscription')
  - `toCollaboratorPayload`/`toMachinePayload`/`toSoftwarePayload` + inverse mappers for detail→form
  - Refs: [data-model.md](data-model.md), [research.md](research.md) R1/R3
- [x] T002 [P] Expand MSW handlers for Collaborators with POST, GET detail, PUT, DELETE and `?search=` in `packages/frontend/src/mocks/handlers/collaborators.ts`
  - Detail handler returns model field names (full_name, office), NOT list aliases (name, department)
  - Refs: [contracts/api-crud.md](contracts/api-crud.md), [data-model.md](data-model.md) mapping table
- [x] T003 [P] Expand MSW handlers for Machines with POST, GET detail, PUT, DELETE and `?search=` in `packages/frontend/src/mocks/handlers/machines.ts`
  - Detail handler returns model field names (type, operacional_system), NOT list aliases (machine_type, operational_system)
- [x] T004 [P] Expand MSW handlers for Software with POST, GET detail, PUT, DELETE and `?search=` in `packages/frontend/src/mocks/handlers/software.ts`
  - Detail handler returns model field names (key, type_licence, on_use), NOT list aliases (license_key, license_type, in_use)

**Checkpoint**: Foundation ready — types, schemas and MSW dev environment support full CRUD. User story implementation can now begin.

---

## Phase 2: User Story 1 — Cadastrar novo registro (Priority: P1) 🎯 MVP

**Goal**: O administrador cria novos colaboradores, máquinas e software pela interface web, sem depender do Django Admin

**Independent Test**: Acessar /collaborators, clicar "Novo Colaborador", preencher nome/domínio/departamento, salvar e confirmar que o registro aparece na listagem

### Implementation for User Story 1

- [x] T005 [P] [US1] Add `useCreateCollaborator` mutation hook and `search` param to list query in `packages/frontend/src/hooks/useCollaborators.ts`
  - `useMutation` → POST /api/collaborators/ with camelCase→snake_case transform via `toCollaboratorPayload`
  - On success: `invalidateQueries(['collaborators'])` + `invalidateQueries(['dashboard-stats'])`
  - Add optional `search?: string` param to existing `useCollaborators` query
  - Refs: [research.md](research.md) R2/R5, [contracts/api-crud.md](contracts/api-crud.md) invalidation table
- [x] T006 [P] [US1] Add `useCreateMachine` mutation hook and `search` param to list query in `packages/frontend/src/hooks/useMachines.ts`
  - Same pattern: `toMachinePayload`, invalidate `['machines']` + `['dashboard-stats']`
- [x] T007 [P] [US1] Add `useCreateSoftware` mutation hook and `search` param to list query in `packages/frontend/src/hooks/useSoftware.ts`
  - Same pattern: `toSoftwarePayload`, invalidate `['software']` + `['dashboard-stats']`
- [x] T008 [P] [US1] Create CollaboratorForm component (Dialog, create/edit dual mode) in `packages/frontend/src/components/CollaboratorForm.tsx`
  - `useForm` with `zodResolver(collaboratorSchema)`, 10 fields (FR-016)
  - Conditional: dateFired visible+required when fired=true via `watch('fired')` (D7)
  - Props: `open`, `onOpenChange`, `onSave(data)`, `initialData?`, `isLoading`, `serverErrors?`
  - Server errors mapped via `setError`: snake_case→camelCase (R6)
  - Dialog title: "Novo Colaborador" / "Editar Colaborador"
  - Labels in PT-BR, JSDoc docstrings in PT-BR
  - Refs: [spec.md](spec.md) FR-016, [plan.md](plan.md) D1/D7, [research.md](research.md) R4/R6
- [x] T009 [P] [US1] Create MachineForm component (Sheet, create/edit dual mode) in `packages/frontend/src/components/MachineForm.tsx`
  - Sheet (side panel) for 18 fields (R4), `zodResolver(machineSchema)` (FR-017)
  - Conditional: dateSoldOut visible+required when soldOut=true (D7)
  - type field: Select with desktop/notebook options
  - IP format + MAC format validation in schema
  - Sheet title: "Nova Máquina" / "Editar Máquina"
  - Refs: [spec.md](spec.md) FR-017, [research.md](research.md) R4
- [x] T010 [P] [US1] Create SoftwareForm component (Dialog, create/edit dual mode) in `packages/frontend/src/components/SoftwareForm.tsx`
  - `zodResolver(softwareSchema)`, 10 fields (FR-018)
  - Conditional: expiresAt visible+required when typeLicence='subscription' (D7)
  - typeLicence: Select with perpetual/subscription/OEM options
  - Dialog title: "Novo Software" / "Editar Software"
  - Refs: [spec.md](spec.md) FR-018
- [x] T011 [US1] Integrate create flow into Collaborators page in `packages/frontend/src/pages/Collaborators.tsx`
  - "Novo Colaborador" button in PageHeader area → opens CollaboratorForm in create mode
  - State: `formOpen: boolean`
  - On save: call `useCreateCollaborator` → close form + toast success (FR-003, FR-004)
  - API 400 errors mapped to form fields; network errors as toast (FR-014)
  - Loading: mutation isPending disables submit button (FR-015)
  - Depends on T005, T008
- [x] T012 [P] [US1] Integrate create flow into Machines page in `packages/frontend/src/pages/Machines.tsx`
  - "Nova Máquina" button → opens MachineForm Sheet in create mode
  - Same create/toast/error patterns as T011
  - Depends on T006, T009
- [x] T013 [P] [US1] Integrate create flow into SoftwarePage in `packages/frontend/src/pages/SoftwarePage.tsx`
  - "Novo Software" button → opens SoftwareForm Dialog in create mode
  - Same create/toast/error patterns as T011
  - Depends on T007, T010

**Checkpoint**: User Story 1 complete. O administrador cria registros das 3 entidades pela interface. Listagem atualiza em < 2s (SC-005).

---

## Phase 3: User Story 2 — Editar registro existente (Priority: P2)

**Goal**: O administrador edita dados de colaboradores, máquinas e software existentes pela interface, com formulário pré-preenchido

**Independent Test**: Acessar /machines, clicar editar em uma máquina, alterar o IP, salvar e confirmar que a listagem reflete a mudança

### Implementation for User Story 2

- [x] T014 [P] [US2] Add `useCollaborator(id)` detail query and `useUpdateCollaborator` mutation hook in `packages/frontend/src/hooks/useCollaborators.ts`
  - `useQuery` → GET /api/collaborators/{id}/ (detail serializer) with snake_case→camelCase transform
  - `useMutation` → PUT /api/collaborators/{id}/ with same invalidation pattern
  - Enabled only when id is provided
  - Refs: [research.md](research.md) R7, [plan.md](plan.md) D3
- [x] T015 [P] [US2] Add `useMachine(id)` detail query and `useUpdateMachine` mutation hook in `packages/frontend/src/hooks/useMachines.ts`
- [x] T016 [P] [US2] Add `useSoftwareDetail(id)` detail query and `useUpdateSoftware` mutation hook in `packages/frontend/src/hooks/useSoftware.ts`
- [x] T017 [US2] Integrate edit flow into Collaborators page in `packages/frontend/src/pages/Collaborators.tsx`
  - Add Actions column (last column) with edit icon button (Pencil) per row (FR-020)
  - State: `editingId: number | null` (null=create, number=edit)
  - Edit click → fetch detail via `useCollaborator(id)` → open CollaboratorForm with initialData → on save `useUpdateCollaborator` → close + toast
  - Form reuses CollaboratorForm from T008 (initialData prop switches to edit mode)
  - Depends on T014
- [x] T018 [P] [US2] Integrate edit flow into Machines page in `packages/frontend/src/pages/Machines.tsx`
  - Actions column with edit icon → `useMachine(id)` → MachineForm Sheet with initialData → `useUpdateMachine`
  - Depends on T015
- [x] T019 [P] [US2] Integrate edit flow into SoftwarePage in `packages/frontend/src/pages/SoftwarePage.tsx`
  - Actions column with edit icon → `useSoftwareDetail(id)` → SoftwareForm Dialog with initialData → `useUpdateSoftware`
  - Depends on T016

**Checkpoint**: User Story 2 complete. O administrador edita registros com formulário pré-preenchido via detail endpoint (D3).

---

## Phase 4: User Story 3 — Excluir registro (Priority: P3)

**Goal**: O administrador exclui registros com confirmação explícita. Operação é soft delete transparente.

**Independent Test**: Acessar /software, clicar excluir em um software, confirmar no diálogo, verificar que o software desaparece da listagem

### Implementation for User Story 3

- [x] T020 [US3] Create DeleteConfirmDialog reusable component in `packages/frontend/src/components/DeleteConfirmDialog.tsx`
  - Uses shadcn/ui AlertDialog (Radix-based, accessible)
  - Props: `open`, `onConfirm`, `onCancel`, `entityName: string`, `isLoading: boolean`
  - Text: "Tem certeza que deseja excluir {entityName}?"
  - Confirm: "Excluir" (destructive variant, disabled while isLoading)
  - Cancel: "Cancelar"
  - Refs: [plan.md](plan.md) D4, [spec.md](spec.md) FR-008/FR-009
- [x] T021 [P] [US3] Add `useDeleteCollaborator` mutation hook in `packages/frontend/src/hooks/useCollaborators.ts`
  - `useMutation` → DELETE /api/collaborators/{id}/ → invalidate `['collaborators']` + `['dashboard-stats']`
- [x] T022 [P] [US3] Add `useDeleteMachine` mutation hook in `packages/frontend/src/hooks/useMachines.ts`
- [x] T023 [P] [US3] Add `useDeleteSoftware` mutation hook in `packages/frontend/src/hooks/useSoftware.ts`
- [x] T024 [US3] Integrate delete flow into Collaborators page in `packages/frontend/src/pages/Collaborators.tsx`
  - Add delete icon button (Trash2) to Actions column per row (FR-020)
  - State: `deletingCollaborator: { id: number, name: string } | null`
  - Delete click → open DeleteConfirmDialog with collaborator name → on confirm `useDeleteCollaborator` → close + toast
  - API error (400/409 dependency) shown as toast (FR-014)
  - Depends on T020, T021
- [x] T025 [P] [US3] Integrate delete flow into Machines page in `packages/frontend/src/pages/Machines.tsx`
  - DeleteConfirmDialog shows hostname + service_tag for identification
  - Depends on T020, T022
- [x] T026 [P] [US3] Integrate delete flow into SoftwarePage in `packages/frontend/src/pages/SoftwarePage.tsx`
  - DeleteConfirmDialog shows software name
  - Depends on T020, T023

**Checkpoint**: User Story 3 complete. Exclusão com confirmação explícita (SC-003). Listagem atualiza em < 2s (SC-005).

---

## Phase 5: User Story 4 — Buscar e filtrar registros (Priority: P4)

**Goal**: O administrador encontra rapidamente um registro específico por nome ou identificador usando busca textual com debounce

**Independent Test**: Acessar /collaborators, digitar "João" no campo de busca, ver apenas colaboradores cujo nome contém "João"

### Implementation for User Story 4

- [x] T027 [US4] Create SearchInput component with 400ms debounce in `packages/frontend/src/components/SearchInput.tsx`
  - Uses shadcn/ui Input with Search icon (Lucide) as visual prefix
  - Props: `value: string`, `onChange: (value: string) => void`, `placeholder?: string`
  - Internal state for immediate display, debounced callback for API calls
  - Clearing input restores full listing (FR-011)
  - Refs: [plan.md](plan.md) D5, [spec.md](spec.md) FR-011/FR-012
- [x] T028 [US4] Integrate SearchInput into Collaborators page in `packages/frontend/src/pages/Collaborators.tsx`
  - SearchInput above table, debounced value passed as `search` to `useCollaborators(page, search)`
  - State: `search: string`
  - Refs: search param already added to hook in T005
- [x] T029 [P] [US4] Integrate SearchInput into Machines page in `packages/frontend/src/pages/Machines.tsx`
  - Same pattern with `useMachines(page, search)`
- [x] T030 [P] [US4] Integrate SearchInput into SoftwarePage in `packages/frontend/src/pages/SoftwarePage.tsx`
  - Same pattern with `useSoftware(page, search)`

**Checkpoint**: User Story 4 complete. Busca funcional com debounce nas 3 listagens (SC-006).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation sync

- [x] T031 Verify all components/hooks/functions have PT-BR JSDoc docstrings per CLAUDE.md Docstrings section
- [x] T032 Verify design system compliance per `.interface-design/system.md` (spacing, tokens, patterns)
- [x] T033 Run quickstart.md validation (10-step manual test flow)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. BLOCKS all user stories.
- **US1 Create (Phase 2)**: Depends on Phase 1 completion
- **US2 Edit (Phase 3)**: Depends on Phase 2 (reuses form components from US1)
- **US3 Delete (Phase 4)**: Depends on Phase 2 (needs Actions column from US2 in pages)
- **US4 Search (Phase 5)**: Depends on Phase 2 (search param added to hooks in US1)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 (P2)**: Depends on US1 — reuses form components (dual create/edit mode) and Actions column setup
- **US3 (P3)**: Depends on US2 — adds delete icon to existing Actions column
- **US4 (P4)**: Can start after US1 — search param already in hooks from US1

### Within Each User Story

- Hooks before form components (hooks provide mutation functions)
- Form components before page integration (pages import forms)
- Core implementation before integration

### Parallel Opportunities

- T002, T003, T004 can run in parallel (different MSW handler files)
- T005, T006, T007 can run in parallel (different hook files)
- T008, T009, T010 can run in parallel (different form component files)
- T014, T015, T016 can run in parallel (different hook files)
- T021, T022, T023 can run in parallel (different hook files)

---

## Parallel Example: User Story 1

```bash
# After T001 completes, launch hooks in parallel:
Task T005: "Add useCreateCollaborator + search param in hooks/useCollaborators.ts"
Task T006: "Add useCreateMachine + search param in hooks/useMachines.ts"
Task T007: "Add useCreateSoftware + search param in hooks/useSoftware.ts"

# After hooks complete, launch form components in parallel:
Task T008: "Create CollaboratorForm (Dialog) in components/CollaboratorForm.tsx"
Task T009: "Create MachineForm (Sheet) in components/MachineForm.tsx"
Task T010: "Create SoftwareForm (Dialog) in components/SoftwareForm.tsx"

# After forms complete, launch page integrations in parallel:
Task T011: "Integrate create flow into Collaborators.tsx"
Task T012: "Integrate create flow into Machines.tsx"
Task T013: "Integrate create flow into SoftwarePage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (types, schemas, MSW handlers)
2. Complete Phase 2: User Story 1 — Create
3. **STOP and VALIDATE**: Test create flow for all 3 entities per quickstart.md steps 3-4
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Dev environment supports full CRUD via MSW
2. Add US1 (Create) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Edit) → Test independently → Deploy/Demo
4. Add US3 (Delete) → Test independently → Deploy/Demo
5. Add US4 (Search) → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Sequential Strategy (Single Developer)

1. Phase 1: Foundational (T001-T004) — ~1 session
2. Phase 2: US1 Create (T005-T013) — ~2 sessions
3. Phase 3: US2 Edit (T014-T019) — ~1 session
4. Phase 4: US3 Delete (T020-T026) — ~1 session
5. Phase 5: US4 Search (T027-T030) — ~1 session
6. Phase 6: Polish (T031-T033) — ~1 session

---

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 33 |
| Phase 1 (Foundational) | 4 tasks |
| Phase 2 (US1 Create) | 9 tasks |
| Phase 3 (US2 Edit) | 6 tasks |
| Phase 4 (US3 Delete) | 7 tasks |
| Phase 5 (US4 Search) | 4 tasks |
| Phase 6 (Polish) | 3 tasks |
| Parallel opportunities | 5 groups of parallel tasks |
| MVP scope | Phase 1 + Phase 2 (13 tasks) |

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [US] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All labels/messages in PT-BR, all code naming in English
- Follow design system in `.interface-design/system.md`
- No tests included — not requested in spec
