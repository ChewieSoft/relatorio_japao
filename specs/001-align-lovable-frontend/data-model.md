# Data Model: Alinhar Frontend Lovable

**Branch**: `001-align-lovable-frontend` | **Date**: 2026-03-15

> Este data model define as interfaces TypeScript do frontend e o formato esperado das respostas da API Django REST. O backend (modelos Django, serializers) será definido na Spec 002.

## API Response Format (DRF PageNumberPagination)

```typescript
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
```

## Entities

### Collaborator

**API response (snake_case)**:

| Field | Type | Description |
|-------|------|-------------|
| id | number | Identificador único |
| name | string | Nome completo do colaborador |
| domain_user | string | Usuário de domínio Windows |
| department | string | Departamento na empresa |
| status | boolean | true = ativo, false = inativo |
| fired | boolean | Se foi demitido |
| has_server_access | boolean | Permissão de acesso ao servidor |
| has_erp_access | boolean | Permissão de acesso ao ERP |
| has_internet_access | boolean | Permissão de acesso à internet |
| has_cellphone | boolean | Possui celular corporativo |
| email | string | Email corporativo |

**Frontend interface (camelCase)**:

```typescript
interface Collaborator {
  id: number
  name: string
  domainUser: string
  department: string
  status: boolean
  fired: boolean
  hasServerAccess: boolean
  hasErpAccess: boolean
  hasInternetAccess: boolean
  hasCellphone: boolean
  email: string
}
```

**Mapping notes**: O Lovable usou `domain: string` e `status: "active" | "inactive"`. Será alinhado para `domainUser` (match com campo Django `domain_user`) e `status: boolean` (match com modelo Django).

### Machine

**API response (snake_case)**:

| Field | Type | Description |
|-------|------|-------------|
| id | number | Identificador único |
| hostname | string | Nome da máquina na rede |
| model | string | Modelo do equipamento |
| service_tag | string | Service tag Dell |
| ip | string | Endereço IP |
| mac_address | string | Endereço MAC |
| operational_system | string | Sistema operacional |
| encrypted | boolean | Criptografia de disco ativada |
| antivirus | boolean | Antivírus instalado |
| collaborator_id | number \| null | FK para colaborador atribuído |
| collaborator_name | string | Nome do colaborador (read-only, via serializer) |
| machine_type | "desktop" \| "notebook" | Tipo do equipamento |

**Frontend interface (camelCase)**:

```typescript
interface Machine {
  id: number
  hostname: string
  model: string
  serviceTag: string
  ip: string
  macAddress: string
  operationalSystem: string
  encrypted: boolean
  antivirus: boolean
  collaboratorId: number | null
  collaboratorName: string
  machineType: "desktop" | "notebook"
}
```

**Mapping notes**: Lovable usou `os` (renomear para `operationalSystem`), `mac` (renomear para `macAddress`), `type` (renomear para `machineType`).

### Software

**API response (snake_case)**:

| Field | Type | Description |
|-------|------|-------------|
| id | number | Identificador único |
| software_name | string | Nome do software |
| license_key | string | Chave de licença |
| license_type | "perpetual" \| "subscription" \| "oem" | Tipo da licença |
| quantity | number | Quantidade total de licenças |
| in_use | number | Licenças em uso |
| expires_at | string \| null | Data de expiração (ISO 8601) |

**Frontend interface (camelCase)**:

```typescript
interface Software {
  id: number
  softwareName: string
  licenseKey: string
  licenseType: "perpetual" | "subscription" | "oem"
  quantity: number
  inUse: number
  expiresAt: string | null
}
```

**Mapping notes**: Lovable usou `name` (renomear para `softwareName` para alinhar com campo Django `software_name`).

### Report

**API response (snake_case)**:

| Field | Type | Description |
|-------|------|-------------|
| id | number | Identificador único |
| number | string | Número do relatório (ex: "08", "09") |
| name | string | Nome em português |
| name_jp | string | Nome em japonês |
| category | string | Categoria (Pessoal, Equipamentos, Acesso, etc.) |
| last_generated | string \| null | Data da última geração (ISO 8601) |
| status | "pending" \| "generated" \| "sent" | Status atual |

**Frontend interface (camelCase)**:

```typescript
interface Report {
  id: number
  number: string
  name: string
  nameJp: string
  category: string
  lastGenerated: string | null
  status: "pending" | "generated" | "sent"
}
```

**Mapping notes**: Lovable não incluía campo `number` (usava `id` sequencial). O campo `number` é necessário para mapear aos 19 relatórios reais (08, 09, 13, 15, 17, 19-26, 28, 29, 31, 33-35, 37).

### Auth (User)

**API response**:

| Field | Type | Description |
|-------|------|-------------|
| id | number | Identificador do usuário |
| username | string | Nome de usuário |
| email | string | Email do usuário |
| is_staff | boolean | Se é administrador |

**Frontend interface**:

```typescript
interface User {
  id: number
  username: string
  email: string
  isStaff: boolean
}
```

### Auth Tokens

```typescript
interface TokenPair {
  access: string
  refresh: string
}
```

### Dashboard Stats

**API response (snake_case)**:

| Field | Type | Description |
|-------|------|-------------|
| active_collaborators | number | Contagem de colaboradores ativos |
| total_collaborators | number | Total de colaboradores |
| total_machines | number | Total de máquinas |
| total_software | number | Total de licenças |
| pending_reports | number | Relatórios pendentes |
| total_reports | number | Total de relatórios |
| machines_without_encryption | string[] | Hostnames sem criptografia |

**Frontend interface (camelCase)**:

```typescript
interface DashboardStats {
  activeCollaborators: number
  totalCollaborators: number
  totalMachines: number
  totalSoftware: number
  pendingReports: number
  totalReports: number
  machinesWithoutEncryption: string[]
}
```

## State Transitions

### Report Status

```text
pending → generated → sent
```

- `pending`: Relatório nunca foi gerado ou dados mudaram desde a última geração.
- `generated`: Relatório gerado com sucesso, disponível para download.
- `sent`: Relatório enviado para a matriz japonesa.

## Relationships (Read-only nesta spec)

```text
Collaborator 1──N Machine     (via collaborator_id em Machine)
Collaborator 1──N Email       (fora do escopo desta spec)
Collaborator 1──N Cellphone   (fora do escopo desta spec)
Software     N──N Collaborator (fora do escopo desta spec)
```

As entidades dependentes (Email, Cellphone, Wifi, AntiVirus, Server, ServerAccess, etc.) não são exibidas nas páginas atuais do Lovable e estão fora do escopo desta spec.
