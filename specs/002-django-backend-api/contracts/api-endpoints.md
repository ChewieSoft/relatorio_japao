# API Contracts: Backend Django REST API

**Feature**: 002-django-backend-api | **Date**: 2026-03-29

Todos os endpoints retornam JSON com campos em snake_case. O frontend converte para camelCase no hook boundary layer.

## Authentication Endpoints

### POST `/api/auth/login/`

**Permission**: AllowAny

**Request**:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response 200**:

```json
{
  "access": "eyJ0eXAiOiJKV1QiLC...",
  "refresh": "eyJ0eXAiOiJKV1QiLC..."
}
```

**Response 401**: `{ "detail": "No active account found with the given credentials" }`

---

### POST `/api/auth/refresh/`

**Permission**: AllowAny

**Request**:

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLC..."
}
```

**Response 200**:

```json
{
  "access": "eyJ0eXAiOiJKV1QiLC..."
}
```

**Response 401**: `{ "detail": "Token is blacklisted", "code": "token_not_valid" }`

---

### GET `/api/auth/me/`

**Permission**: IsAuthenticated

**Response 200**:

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@jrc.com",
  "is_staff": true
}
```

---

### POST `/api/auth/register/`

**Permission**: IsAdminUser (staff only)

**Request**:

```json
{
  "username": "novo.usuario",
  "email": "novo@jrc.com",
  "password": "senhasegura123"
}
```

**Response 201**:

```json
{
  "id": 2,
  "username": "novo.usuario",
  "email": "novo@jrc.com",
  "is_staff": false
}
```

---

### POST `/api/auth/logout/`

**Permission**: IsAuthenticated

**Request**:

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLC..."
}
```

**Response 200**: (empty body — simplejwt `TokenBlacklistView` retorna 200)

---

## CRUD Endpoints

Todos os endpoints CRUD seguem o padrão DRF ModelViewSet:

| Ação | Método | URL | Response Code |
|------|--------|-----|---------------|
| List | GET | `/api/{resource}/` | 200 |
| Create | POST | `/api/{resource}/` | 201 |
| Retrieve | GET | `/api/{resource}/{id}/` | 200 |
| Update | PUT | `/api/{resource}/{id}/` | 200 |
| Partial Update | PATCH | `/api/{resource}/{id}/` | 200 |
| Destroy (soft) | DELETE | `/api/{resource}/{id}/` | 204 |

### Resource URLs

| Resource | URL | Filtros | Busca | Ordenação |
|----------|-----|---------|-------|-----------|
| Collaborator | `/api/collaborators/` | status, fired, office, admin_privilege | full_name, domain_user | full_name, date_hired |
| Machine | `/api/machines/` | type, sold_out, crypto_disk | model, service_tag, ip | model, date_purchase |
| Software | `/api/software/` | type_licence, departament | software_name, key | software_name |
| Email | `/api/emails/` | collaborator | email | email |
| Cellphone | `/api/cellphones/` | collaborator, status | phone_number | model |
| Wifi | `/api/wifi/` | collaborator, year | wifi_name | year |
| AntiVirus | `/api/antivirus/` | machine, year | — | year |
| Server | `/api/servers/` | machine, have_backup | — | backup_date |
| ServerAccess | `/api/server-access/` | collaborator | — | — |
| ServerErpAccess | `/api/erp-access/` | collaborator | — | — |
| DataDestroyed | `/api/data-destroyed/` | machine | — | when_data_is_destroyed |
| PenDrive | `/api/pen-drives/` | collaborator, have_virus | — | checked_date |

### Paginated Response Format (todas as listas)

```json
{
  "count": 50,
  "next": "http://localhost:8000/api/collaborators/?page=2",
  "previous": null,
  "results": [...]
}
```

**Page size**: 20 items

---

## Collaborator List Response

**GET `/api/collaborators/?page=1`**

```json
{
  "count": 25,
  "next": "http://localhost:8000/api/collaborators/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "João Silva",
      "domain_user": "joao.silva",
      "department": "TI",
      "status": true,
      "fired": false,
      "has_server_access": true,
      "has_erp_access": false,
      "has_internet_access": true,
      "has_cellphone": true,
      "email": "joao.silva@jrc.com"
    }
  ]
}
```

**Mapeamento model → response**:
- `name` ← `full_name`
- `department` ← `office`
- `has_internet_access` ← `perm_acess_internet`
- `has_server_access` ← exists(ServerAccess where collaborator=self)
- `has_erp_access` ← exists(ServerErpAccess where collaborator=self)
- `has_cellphone` ← exists(Cellphone where collaborator=self)
- `email` ← first Email.email where collaborator=self

---

## Machine List Response

**GET `/api/machines/?page=1`**

```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "hostname": "PC-TI-001",
      "model": "Dell Latitude 5520",
      "service_tag": "ABC1234",
      "ip": "192.168.1.100",
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "operational_system": "Windows 11 Pro",
      "encrypted": true,
      "antivirus": true,
      "collaborator_id": 1,
      "collaborator_name": "João Silva",
      "machine_type": "notebook"
    }
  ]
}
```

**Mapeamento model → response**:
- `hostname` ← `hostname` (campo direto)
- `operational_system` ← `operacional_system`
- `encrypted` ← `crypto_disk OR crypto_usb OR crypto_memory_card`
- `antivirus` ← exists(AntiVirus where machine=self, year=current_year)
- `collaborator_id` ← first CollaboratorMachine.collaborator.id
- `collaborator_name` ← first CollaboratorMachine.collaborator.full_name
- `machine_type` ← `type`

---

## Software List Response

**GET `/api/software/?page=1`**

```json
{
  "count": 6,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "software_name": "Microsoft Office 365",
      "license_key": "XXXXX-XXXXX-XXXXX",
      "license_type": "subscription",
      "quantity": 50,
      "in_use": 45,
      "expires_at": "2026-12-31"
    }
  ]
}
```

**Mapeamento model → response**:
- `license_key` ← `key`
- `license_type` ← `type_licence`
- `in_use` ← `on_use`
- `expires_at` ← `expires_at` (campo direto, novo)

---

## Dashboard Stats

**GET `/api/dashboard/stats/`**

**Permission**: IsAuthenticated

```json
{
  "active_collaborators": 8,
  "total_collaborators": 10,
  "total_machines": 5,
  "total_software": 6,
  "pending_reports": 16,
  "total_reports": 19,
  "machines_without_encryption": ["PC-TI-001", "PC-ADM-003"]
}
```

---

## Reports Endpoints

### GET `/api/reports/`

**Permission**: IsAuthenticated

```json
{
  "count": 19,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "number": "08",
      "name": "Lista de Contatos Internos",
      "name_jp": "内部連絡先リスト",
      "category": "Pessoal",
      "last_generated": null,
      "status": "pending"
    }
  ]
}
```

### POST `/api/reports/{number}/generate/`

**Permission**: IsAuthenticated

**Response 200**:

```json
{
  "status": "generated",
  "last_generated": "2026-03-29T14:30:00Z"
}
```

### GET `/api/reports/{number}/?format=pdf|xlsx`

**Permission**: IsAuthenticated

**Response 200**: Binary blob with headers:
- `Content-Type: application/pdf` ou `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="relatorio_{number}.{format}"`

**Nota**: Nesta spec (002), retorna placeholder. Implementação real na spec 003.
