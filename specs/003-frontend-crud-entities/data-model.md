# Data Model: Frontend CRUD para Entidades Principais

**Feature**: 003-frontend-crud-entities | **Date**: 2026-04-05

> Este data model cobre apenas a camada **frontend** — tipos TypeScript, schemas de validação e mapeamento para a API. O data model do backend está em `specs/002-django-backend-api/data-model.md`.

## Entidades do Formulário (Frontend → API)

### CollaboratorFormData

Dados enviados para `POST /api/collaborators/` e `PUT /api/collaborators/{id}/`.

| Campo frontend (camelCase) | Campo API (snake_case) | Tipo | Obrigatório | Validação |
|---------------------------|------------------------|------|-------------|-----------|
| fullName | full_name | string | Sim | min 1 char, max 255 |
| domainUser | domain_user | string | Sim | min 1, max 255, unique (server) |
| office | office | string | Sim | min 1, max 100 |
| status | status | boolean | Não | default: true |
| fired | fired | boolean | Não | default: false |
| dateHired | date_hired | ISO datetime | Sim | data válida |
| dateFired | date_fired | ISO datetime | Condicional | obrigatório se fired=true |
| permAcessInternet | perm_acess_internet | boolean | Não | default: false |
| acessWifi | acess_wifi | boolean | Não | default: false |
| adminPrivilege | admin_privilege | boolean | Não | default: false |

### MachineFormData

Dados enviados para `POST /api/machines/` e `PUT /api/machines/{id}/`.

| Campo frontend (camelCase) | Campo API (snake_case) | Tipo | Obrigatório | Validação |
|---------------------------|------------------------|------|-------------|-----------|
| hostname | hostname | string | Não | max 255, default: '' |
| model | model | string | Sim | min 1, max 255 |
| type | type | string | Sim | enum: 'desktop', 'notebook' |
| serviceTag | service_tag | string | Sim | min 1, max 100, unique (server) |
| operacionalSystem | operacional_system | string | Sim | min 1, max 100 |
| ramMemory | ram_memory | string | Sim | min 1, max 50 |
| diskMemory | disk_memory | string | Sim | min 1, max 50 |
| ip | ip | string | Sim | max 45, formato IP válido, unique (server) |
| macAddress | mac_address | string | Sim | max 17, formato MAC, unique (server) |
| administrator | administrator | string | Sim | min 1, max 255 |
| codJdb | cod_jdb | string | Sim | min 1, max 50 |
| datePurchase | date_purchase | ISO datetime | Sim | data válida |
| quantity | quantity | integer | Não | default: 1, min: 1 |
| cryptoDisk | crypto_disk | boolean | Não | default: false |
| cryptoUsb | crypto_usb | boolean | Não | default: false |
| cryptoMemoryCard | crypto_memory_card | boolean | Não | default: false |
| soldOut | sold_out | boolean | Não | default: false |
| dateSoldOut | date_sold_out | ISO datetime | Condicional | obrigatório se sold_out=true |

### SoftwareFormData

Dados enviados para `POST /api/software/` e `PUT /api/software/{id}/`.

| Campo frontend (camelCase) | Campo API (snake_case) | Tipo | Obrigatório | Validação |
|---------------------------|------------------------|------|-------------|-----------|
| softwareName | software_name | string | Não | max 255 (nullable) |
| key | key | string | Sim | min 1, max 255 |
| typeLicence | type_licence | string | Sim | min 1, max 50 |
| quantity | quantity | integer | Não | default: 0, min: 0 |
| quantityPurchase | quantity_purchase | integer | Não | default: 0, min: 0 |
| onUse | on_use | integer | Não | default: 0, min: 0 |
| departament | departament | string | Sim | min 1, max 100 |
| lastPurchaseDate | last_purchase_date | ISO datetime | Sim | data válida |
| expiresAt | expires_at | ISO datetime | Condicional | obrigatório se type_licence='subscription' |
| observation | observation | string | Não | default: '' |

## Mapeamento List Serializer ↔ Model Field

> IMPORTANTE: Os list serializers usam aliases. Os create/update serializers usam nomes do modelo.

| Entidade | Campo List (o que a listagem exibe) | Campo Model (o que o form envia) |
|----------|-------------------------------------|-----------------------------------|
| Collaborator | `name` | `full_name` |
| Collaborator | `department` | `office` |
| Collaborator | `has_internet_access` | `perm_acess_internet` |
| Machine | `operational_system` | `operacional_system` |
| Machine | `machine_type` | `type` |
| Machine | `encrypted` | `crypto_disk`, `crypto_usb`, `crypto_memory_card` (3 campos separados) |
| Machine | `antivirus` | computed (relação AntiVirus — fora do escopo do form) |
| Machine | `collaborator_id` / `collaborator_name` | computed (relação CollaboratorMachine — fora do escopo) |
| Software | `license_key` | `key` |
| Software | `license_type` | `type_licence` |
| Software | `in_use` | `on_use` |

## Retrieve Endpoint (GET detail para edição)

Para preencher o formulário de edição, usar `GET /api/{entity}/{id}/` que retorna o detail serializer com **todos os campos do modelo** nos nomes originais (sem aliases).

- `GET /api/collaborators/{id}/` → `CollaboratorDetailSerializer` (fields: `__all__` + emails, cellphones read-only)
- `GET /api/machines/{id}/` → `MachineDetailSerializer` (fields: `__all__`)
- `GET /api/software/{id}/` → `SoftwareDetailSerializer` (fields: `__all__`)

## Campos Condicionais (visibilidade dinâmica)

| Entidade | Campo controlador | Campo condicional | Regra |
|----------|------------------|-------------------|-------|
| Collaborator | `fired` | `date_fired` | Visível e obrigatório quando fired=true |
| Machine | `sold_out` | `date_sold_out` | Visível e obrigatório quando sold_out=true |
| Software | `type_licence` | `expires_at` | Visível e obrigatório quando type_licence='subscription' |

## Validação Unique (Server-side)

Erros de uniqueness retornados pela API em formato DRF:

```json
{
  "full_name": ["collaborator com este full name já existe."],
  "domain_user": ["collaborator com este domain user já existe."],
  "service_tag": ["machine com este service tag já existe."],
  "ip": ["machine com este ip já existe."],
  "mac_address": ["machine com este mac address já existe."]
}
```

O frontend deve mapear `field_name` (snake_case) → campo do formulário (camelCase) e exibir via `setError` do react-hook-form.
