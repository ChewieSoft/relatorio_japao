# Research: Frontend CRUD para Entidades Principais

**Feature**: 003-frontend-crud-entities | **Date**: 2026-04-05

## R1: Mapeamento de campos frontend ↔ backend (Create/Update)

**Decision**: Formulários enviam dados nos nomes de campo do modelo Django (snake_case), NÃO nos aliases usados pelo list serializer.

**Rationale**: Os serializers de criação (`CollaboratorCreateSerializer`, `MachineCreateSerializer`, `SoftwareCreateSerializer`) herdam de `BaseSerializer` com `fields = '__all__'` e usam os nomes originais do modelo. Os aliases (name→full_name, department→office) existem apenas nos list serializers para o contrato de listagem.

**Mapeamento completo (frontend camelCase → API model field):**

### Collaborator

| Campo no formulário (camelCase) | Campo na API (snake_case) | Tipo | Obrigatório |
|--------------------------------|--------------------------|------|-------------|
| fullName | full_name | string | Sim (unique) |
| domainUser | domain_user | string | Sim (unique) |
| office | office | string | Sim |
| status | status | boolean | Não (default: true) |
| fired | fired | boolean | Não (default: false) |
| dateHired | date_hired | datetime | Sim |
| dateFired | date_fired | datetime | Não (condicional: fired=true) |
| permAcessInternet | perm_acess_internet | boolean | Não (default: false) |
| acessWifi | acess_wifi | boolean | Não (default: false) |
| adminPrivilege | admin_privilege | boolean | Não (default: false) |

### Machine

| Campo no formulário (camelCase) | Campo na API (snake_case) | Tipo | Obrigatório |
|--------------------------------|--------------------------|------|-------------|
| hostname | hostname | string | Não (default: '') |
| model | model | string | Sim |
| type | type | string (desktop/notebook) | Sim |
| serviceTag | service_tag | string | Sim (unique) |
| operacionalSystem | operacional_system | string | Sim |
| ramMemory | ram_memory | string | Sim |
| diskMemory | disk_memory | string | Sim |
| ip | ip | string | Sim (unique) |
| macAddress | mac_address | string | Sim (unique) |
| administrator | administrator | string | Sim |
| codJdb | cod_jdb | string | Sim |
| datePurchase | date_purchase | datetime | Sim |
| quantity | quantity | integer | Não (default: 1) |
| cryptoDisk | crypto_disk | boolean | Não (default: false) |
| cryptoUsb | crypto_usb | boolean | Não (default: false) |
| cryptoMemoryCard | crypto_memory_card | boolean | Não (default: false) |
| soldOut | sold_out | boolean | Não (default: false) |
| dateSoldOut | date_sold_out | datetime | Não (condicional: sold_out=true) |

### Software

| Campo no formulário (camelCase) | Campo na API (snake_case) | Tipo | Obrigatório |
|--------------------------------|--------------------------|------|-------------|
| softwareName | software_name | string | Não (nullable) |
| key | key | string | Sim |
| typeLicence | type_licence | string | Sim |
| quantity | quantity | integer | Não (default: 0) |
| quantityPurchase | quantity_purchase | integer | Não (default: 0) |
| onUse | on_use | integer | Não (default: 0) |
| departament | departament | string | Sim |
| lastPurchaseDate | last_purchase_date | datetime | Sim |
| expiresAt | expires_at | datetime | Não (condicional: subscription) |
| observation | observation | string | Não (blank) |

**Alternatives considered**: Criar serializers de criação com aliases (license_key→key, etc.) para que o frontend use os mesmos nomes camelCase do list serializer. Rejeitado porque: (1) requer mudanças no backend (fora do escopo desta spec), (2) cria divergência entre o serializer e o modelo, (3) o mapeamento camelCase↔snake_case já existe no hook boundary layer.

## R2: Padrão de mutações com React Query

**Decision**: Usar `useMutation` do React Query com invalidação de queries após sucesso.

**Rationale**: Já é o padrão do projeto (ver `useGenerateReport` em useReports.ts). React Query fornece estados de loading, error e success, além de invalidação automática de cache.

**Padrão por operação:**

- **Create**: `useMutation` → `POST /api/{entity}/` → `invalidateQueries(['{entity}'])` + `invalidateQueries(['dashboard-stats'])`
- **Update**: `useMutation` → `PUT /api/{entity}/{id}/` → `invalidateQueries(['{entity}'])` + `invalidateQueries(['dashboard-stats'])`
- **Delete**: `useMutation` → `DELETE /api/{entity}/{id}/` → `invalidateQueries(['{entity}'])` + `invalidateQueries(['dashboard-stats'])`

Dashboard stats devem ser invalidados porque create/delete altera contagens (active_collaborators, total_machines, total_software).

## R3: Validação client-side com zod

**Decision**: Usar zod para validação de schemas com integração via @hookform/resolvers.

**Rationale**: zod (v3.25) já está instalado no projeto. @hookform/resolvers (v3.10) também está instalado (verificar package.json). react-hook-form (v7.61) já instalado. A integração padrão é: `zodResolver(schema)` passado para `useForm({ resolver: zodResolver(schema) })`.

**Schemas a criar**: 1 por entidade (collaboratorSchema, machineSchema, softwareSchema) com validações de campos obrigatórios, formatos (IP, MAC address) e campos condicionais (date_fired required when fired=true).

## R4: Padrão de UX — Dialog vs Sheet

**Decision**: Dialog para Collaborator (10 campos) e Software (10 campos). Sheet para Machine (18 campos).

**Rationale**: Definido na sessão de clarificação. Dialog é modal centrado, ideal para formulários até ~12 campos. Sheet é painel lateral deslizante, melhor para formulários densos que precisam de scroll vertical sem perder contexto da listagem.

**Componentes shadcn/ui disponíveis**: Dialog (dialog.tsx), Sheet (sheet.tsx), AlertDialog (alert-dialog.tsx para confirmação de exclusão). Todos baseados em Radix UI com acessibilidade built-in.

## R5: Busca server-side

**Decision**: Usar parâmetro `?search=` já suportado pelo backend (SearchFilter do DRF).

**Rationale**: O backend já configura `search_fields` em cada controller:
- Collaborator: `['full_name', 'domain_user']`
- Machine: `['hostname', 'model', 'service_tag', 'ip']`
- Software: `['software_name', 'key']`

O frontend precisa apenas adicionar o parâmetro `search` na query string e aplicar debounce (300-500ms).

## R6: Tratamento de erros da API

**Decision**: Erros de validação do DRF retornam HTTP 400 com body no formato `{ "field_name": ["error message"] }`. O frontend deve mapear esses erros para os campos do formulário via `setError` do react-hook-form.

**Rationale**: Formato padrão do DRF. Erros de unique constraint (domain_user, service_tag, ip, mac_address) retornam 400 com mensagem descritiva. Erros de FK (PROTECT) retornam 400/409.

**Mapeamento de erro**: API field name (snake_case) → form field name (camelCase) → exibir abaixo do campo correspondente.

## R7: Retrieve endpoint para edição

**Decision**: Para editar, o frontend precisa buscar o registro completo via `GET /api/{entity}/{id}/` que retorna o detail serializer (todos os campos do modelo). O list serializer só retorna campos de exibição.

**Rationale**: O list serializer de Collaborator retorna `name`, `department` (aliases), mas o formulário de edição precisa dos campos reais do modelo (`full_name`, `office`). O detail serializer retorna `fields = '__all__'` com nomes originais.

**Implicação**: Cada hook de mutação precisa de um `useQuery` adicional para GET detail quando o formulário de edição abre, OU o formulário pode receber os dados diretamente do detail endpoint.
