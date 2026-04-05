# Quickstart: Frontend CRUD para Entidades Principais

**Feature**: 003-frontend-crud-entities | **Branch**: `003-frontend-crud-entities`

## Pré-requisitos

- Node.js 18+
- Backend Django rodando (ou MSW ativo para desenvolvimento)
- `npm install` executado em `packages/frontend/`

## Desenvolvimento com MSW (sem backend)

```bash
cd packages/frontend
npm run dev
```

MSW intercepta chamadas à API automaticamente em modo desenvolvimento. Os handlers MSW precisam ser expandidos para suportar POST, PUT e DELETE (parte do escopo desta spec).

## Desenvolvimento com backend real

```bash
# Terminal 1: Backend + DB
docker-compose up db backend

# Terminal 2: Frontend
cd packages/frontend
npm run dev
```

## Credenciais de desenvolvimento

- **Usuário**: admin
- **Senha**: admin123

## Verificação rápida

1. Acessar `http://localhost:8080/login` e fazer login
2. Navegar para `/collaborators`
3. Clicar em "Novo Colaborador" — deve abrir dialog com formulário
4. Preencher campos obrigatórios e salvar — registro deve aparecer na listagem
5. Clicar no ícone de editar — dialog deve abrir com dados preenchidos
6. Alterar um campo e salvar — listagem deve refletir a mudança
7. Clicar no ícone de excluir — dialog de confirmação deve aparecer
8. Confirmar exclusão — registro deve desaparecer da listagem
9. Digitar no campo de busca — tabela deve filtrar resultados
10. Repetir passos 3-9 para Machines (Sheet ao invés de Dialog) e Software (Dialog)

## Arquivos-chave para implementação

```text
packages/frontend/src/
├── types/entities.ts          # Adicionar tipos FormData
├── hooks/
│   ├── useCollaborators.ts    # Adicionar mutations (create, update, delete)
│   ├── useMachines.ts         # Adicionar mutations
│   └── useSoftware.ts         # Adicionar mutations
├── pages/
│   ├── Collaborators.tsx      # Adicionar botão Novo, coluna Ações, integrar Dialog
│   ├── Machines.tsx           # Adicionar botão Novo, coluna Ações, integrar Sheet
│   └── SoftwarePage.tsx       # Adicionar botão Novo, coluna Ações, integrar Dialog
├── components/
│   ├── CollaboratorForm.tsx   # NOVO: formulário create/edit em Dialog
│   ├── MachineForm.tsx        # NOVO: formulário create/edit em Sheet
│   ├── SoftwareForm.tsx       # NOVO: formulário create/edit em Dialog
│   └── DeleteConfirmDialog.tsx # NOVO: dialog de confirmação de exclusão
└── mocks/handlers/
    ├── collaborators.ts       # Expandir: POST, PUT, DELETE
    ├── machines.ts            # Expandir: POST, PUT, DELETE
    └── software.ts            # Expandir: POST, PUT, DELETE
```

## Documentação de referência

- [spec.md](spec.md) — Especificação funcional
- [research.md](research.md) — Decisões técnicas e mapeamento de campos
- [data-model.md](data-model.md) — Tipos e validações dos formulários
- [contracts/api-crud.md](contracts/api-crud.md) — Contratos da API REST
- [../../docs/FRONTEND.md](../../docs/FRONTEND.md) — Referência do frontend
- [../../CLAUDE.md](../../CLAUDE.md) — Convenções e padrões do projeto
