# API Endpoint Contracts

**Branch**: `001-align-lovable-frontend` | **Date**: 2026-03-15

> Define os endpoints que o frontend espera da API Django REST. O backend (Spec 002) deve implementar estes contratos.

## Base URL

```text
VITE_API_URL=http://localhost:8000/api
```

## Authentication

### POST /api/auth/login/

**Request**:

```json
{
  "username": "string",
  "password": "string"
}
```

**Response 200**:

```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

**Response 401**:

```json
{
  "detail": "No active account found with the given credentials"
}
```

### POST /api/auth/refresh/

**Request**:

```json
{
  "refresh": "eyJ..."
}
```

**Response 200**:

```json
{
  "access": "eyJ..."
}
```

**Response 401**:

```json
{
  "detail": "Token is invalid or expired"
}
```

### GET /api/auth/me/

**Headers**: `Authorization: Bearer <access_token>`

**Response 200**:

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@jrcbrasil.com",
  "is_staff": true
}
```

### POST /api/auth/logout/

**Headers**: `Authorization: Bearer <access_token>`

**Request**:

```json
{
  "refresh": "eyJ..."
}
```

**Response 200**: `{}` (empty body)

## Collaborators

### GET /api/collaborators/?page={page}

**Headers**: `Authorization: Bearer <access_token>`

**Response 200**:

```json
{
  "count": 50,
  "next": "http://localhost:8000/api/collaborators/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Carlos Tanaka",
      "domain_user": "ctanaka",
      "department": "Engenharia",
      "status": true,
      "fired": false,
      "has_server_access": true,
      "has_erp_access": true,
      "has_internet_access": true,
      "has_cellphone": true,
      "email": "ctanaka@jrcbrasil.com"
    }
  ]
}
```

## Machines

### GET /api/machines/?page={page}

**Headers**: `Authorization: Bearer <access_token>`

**Response 200**:

```json
{
  "count": 30,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "hostname": "JRC-ENG-001",
      "model": "Dell OptiPlex 7090",
      "service_tag": "ABCD1234",
      "ip": "192.168.1.10",
      "mac_address": "AA:BB:CC:DD:EE:01",
      "operational_system": "Windows 11 Pro",
      "encrypted": true,
      "antivirus": true,
      "collaborator_id": 1,
      "collaborator_name": "Carlos Tanaka",
      "machine_type": "desktop"
    }
  ]
}
```

## Software

### GET /api/software/?page={page}

**Headers**: `Authorization: Bearer <access_token>`

**Response 200**:

```json
{
  "count": 20,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "software_name": "Microsoft Office 365",
      "license_key": "XXXXX-XXXXX-XXXXX-XXXXX",
      "license_type": "subscription",
      "quantity": 50,
      "in_use": 38,
      "expires_at": "2026-12-31"
    }
  ]
}
```

## Reports

### GET /api/reports/

**Headers**: `Authorization: Bearer <access_token>`

**Response 200**:

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
      "name_jp": "社内連絡先一覧",
      "category": "Pessoal",
      "last_generated": "2025-11-15T00:00:00Z",
      "status": "sent"
    }
  ]
}
```

### POST /api/reports/{number}/generate/

**Headers**: `Authorization: Bearer <access_token>`

**Response 200**:

```json
{
  "status": "generated",
  "last_generated": "2026-03-15T10:30:00Z"
}
```

### GET /api/reports/{number}/?format=pdf

**Headers**: `Authorization: Bearer <access_token>`

**Response 200**: Binary blob (`application/pdf`)

**Response Headers**: `Content-Disposition: attachment; filename="relatorio_08.pdf"`

### GET /api/reports/{number}/?format=xlsx

**Headers**: `Authorization: Bearer <access_token>`

**Response 200**: Binary blob (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

**Response Headers**: `Content-Disposition: attachment; filename="relatorio_08.xlsx"`

## Dashboard

### GET /api/dashboard/stats/

**Headers**: `Authorization: Bearer <access_token>`

**Response 200**:

```json
{
  "active_collaborators": 7,
  "total_collaborators": 8,
  "total_machines": 6,
  "total_software": 6,
  "pending_reports": 7,
  "total_reports": 14,
  "machines_without_encryption": ["JRC-RH-004"]
}
```

## Common Error Responses

### 401 Unauthorized

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden

```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found

```json
{
  "detail": "Not found."
}
```

## Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Número da página |
| page_size | int | 20 | Itens por página (fixo) |
