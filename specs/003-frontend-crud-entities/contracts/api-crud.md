# API Contracts: CRUD Frontend ↔ Backend

**Feature**: 003-frontend-crud-entities | **Date**: 2026-04-05

> Contratos da API já implementada no backend (spec 002). O frontend deve consumir esses endpoints exatamente como documentados.

## Autenticação

Todas as requisições requerem header `Authorization: Bearer <access_token>`. O Axios interceptor já adiciona automaticamente.

## Collaborator CRUD

### Create

```text
POST /api/collaborators/
Content-Type: application/json
```

**Request Body:**

```json
{
  "full_name": "João da Silva",
  "domain_user": "joao.silva",
  "office": "TI",
  "status": true,
  "fired": false,
  "date_hired": "2026-01-15T00:00:00Z",
  "perm_acess_internet": true,
  "acess_wifi": false,
  "admin_privilege": false
}
```

**Response 201:**

```json
{
  "id": 9,
  "full_name": "João da Silva",
  "domain_user": "joao.silva",
  "office": "TI",
  "status": true,
  "fired": false,
  "date_hired": "2026-01-15T00:00:00Z",
  "date_fired": null,
  "perm_acess_internet": true,
  "acess_wifi": false,
  "admin_privilege": false,
  "created_at": "2026-04-05T10:00:00Z",
  "updated_at": "2026-04-05T10:00:00Z",
  "deleted_at": null,
  "emails": [],
  "cellphones": [],
  "software_ids": [],
  "machine_ids": []
}
```

**Response 400 (validação):**

```json
{
  "full_name": ["collaborator com este full name já existe."],
  "domain_user": ["Este campo é obrigatório."]
}
```

### Retrieve (para edição)

```text
GET /api/collaborators/{id}/
```

**Response 200:** Mesmo formato da resposta 201 do create (CollaboratorDetailSerializer).

### Update

```text
PUT /api/collaborators/{id}/
Content-Type: application/json
```

**Request Body:** Mesmo formato do create (todos os campos).

**Response 200:** Registro atualizado.

### Delete (soft delete)

```text
DELETE /api/collaborators/{id}/
```

**Response 204:** No content. Registro soft-deleted (deleted_at preenchido).

**Response 400/409:** Se houver dependências que impeçam a remoção.

### List com busca

```text
GET /api/collaborators/?page=1&search=João
```

**Response 200:** Formato paginado DRF (count, next, previous, results) com CollaboratorListSerializer.

---

## Machine CRUD

### Create

```text
POST /api/machines/
Content-Type: application/json
```

**Request Body:**

```json
{
  "hostname": "PC-TI-001",
  "model": "Dell OptiPlex 7090",
  "type": "desktop",
  "service_tag": "ABC1234",
  "operacional_system": "Windows 11 Pro",
  "ram_memory": "16GB",
  "disk_memory": "512GB SSD",
  "ip": "192.168.1.100",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "administrator": "TI",
  "cod_jdb": "JDB-001",
  "date_purchase": "2025-06-15T00:00:00Z",
  "quantity": 1,
  "crypto_disk": true,
  "crypto_usb": false,
  "crypto_memory_card": false,
  "sold_out": false
}
```

**Response 201:** MachineDetailSerializer (todos os campos do modelo).

**Response 400:**

```json
{
  "service_tag": ["machine com este service tag já existe."],
  "ip": ["machine com este ip já existe."]
}
```

### Retrieve / Update / Delete

Mesmos padrões de Collaborator:
- `GET /api/machines/{id}/` → 200 (MachineDetailSerializer)
- `PUT /api/machines/{id}/` → 200
- `DELETE /api/machines/{id}/` → 204

### List com busca

```text
GET /api/machines/?page=1&search=Dell
```

Campos de busca: hostname, model, service_tag, ip.

---

## Software CRUD

### Create

```text
POST /api/software/
Content-Type: application/json
```

**Request Body:**

```json
{
  "software_name": "Microsoft Office 365",
  "key": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
  "type_licence": "subscription",
  "quantity": 50,
  "quantity_purchase": 50,
  "on_use": 42,
  "departament": "TI",
  "last_purchase_date": "2026-01-01T00:00:00Z",
  "expires_at": "2027-01-01T00:00:00Z",
  "observation": ""
}
```

**Response 201:** SoftwareDetailSerializer (todos os campos do modelo).

**Response 400:**

```json
{
  "key": ["Este campo é obrigatório."],
  "type_licence": ["Este campo é obrigatório."]
}
```

### Retrieve / Update / Delete

- `GET /api/software/{id}/` → 200 (SoftwareDetailSerializer)
- `PUT /api/software/{id}/` → 200
- `DELETE /api/software/{id}/` → 204

### List com busca

```text
GET /api/software/?page=1&search=Office
```

Campos de busca: software_name, key.

---

## Códigos de Resposta

| Código | Significado | Quando |
|--------|------------|--------|
| 200 | OK | GET retrieve, PUT update |
| 201 | Created | POST create |
| 204 | No Content | DELETE (soft delete) |
| 400 | Bad Request | Validação falhou (campos obrigatórios, uniqueness) |
| 401 | Unauthorized | Token inválido ou expirado |
| 404 | Not Found | Registro não existe ou já foi soft-deleted |
| 409 | Conflict | Dependência impede exclusão (PROTECT) |

## Invalidação de Cache

Após qualquer mutação (create, update, delete), invalidar:

| Operação | Queries a invalidar |
|----------|-------------------|
| Create/Update/Delete Collaborator | `['collaborators']`, `['dashboard-stats']` |
| Create/Update/Delete Machine | `['machines']`, `['dashboard-stats']` |
| Create/Update/Delete Software | `['software']`, `['dashboard-stats']` |
