# Data Model: Backend Django REST API

**Feature**: 002-django-backend-api | **Date**: 2026-03-29

## Entity Relationship Diagram

```text
┌──────────────┐     1:N     ┌──────────┐
│ Collaborator │────────────>│  Email   │
│              │────────────>│Cellphone │
│              │────────────>│  Wifi    │
│              │────────────>│ServerAccess│
│              │────────────>│ServerErpAccess│
│              │────────────>│ PenDrive │
│              │             └──────────┘
│              │     N:N     ┌──────────┐
│              │<───────────>│ Software │
│              │  (CollaboratorSoftware)
│              │     N:N     ┌──────────┐
│              │<───────────>│ Machine  │
└──────────────┘  (CollaboratorMachine)
                             │ Machine  │
                             │          │────1:N──>│AntiVirus │
                             │          │────1:N──>│ Server   │
                             │          │────1:N──>│DataDestroyed│
                             └──────────┘

┌──────────┐
│  Report  │  (standalone — 19 registros fixos)
└──────────┘
```

## BaseModel (abstrato)

| Campo | Tipo | Notas |
|-------|------|-------|
| `created_at` | DateTimeField | auto_now_add=True |
| `updated_at` | DateTimeField | auto_now=True |
| `deleted_at` | DateTimeField | null=True, blank=True |

**Managers**: `objects` = SoftDeleteManager (filtra deleted_at=None), `all_objects` = Manager padrão
**Métodos**: `soft_delete()`, `restore()`

---

## Entidades Principais

### Collaborator

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `full_name` | CharField(255) | unique=True |
| `domain_user` | CharField(255) | unique=True |
| `status` | BooleanField | default=True |
| `perm_acess_internet` | BooleanField | default=False |
| `date_hired` | DateTimeField | |
| `fired` | BooleanField | default=False |
| `date_fired` | DateTimeField | null=True, blank=True |
| `acess_wifi` | BooleanField | default=False |
| `admin_privilege` | BooleanField | default=False |
| `office` | CharField(100) | |

**Herda**: BaseModel
**Relações**: 1:N com Email, Cellphone, Wifi, ServerAccess, ServerErpAccess, PenDrive. N:N com Software (via CollaboratorSoftware), Machine (via CollaboratorMachine).

### Machine

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `hostname` | CharField(255) | blank=True, default='' (campo NOVO) |
| `model` | CharField(255) | |
| `type` | CharField(50) | "desktop", "notebook" |
| `service_tag` | CharField(100) | unique=True |
| `operacional_system` | CharField(100) | |
| `ram_memory` | CharField(50) | |
| `disk_memory` | CharField(50) | |
| `ip` | CharField(45) | unique=True |
| `mac_address` | CharField(17) | unique=True |
| `administrator` | CharField(255) | |
| `cod_jdb` | CharField(50) | |
| `date_purchase` | DateTimeField | |
| `quantity` | IntegerField | default=1 |
| `crypto_disk` | BooleanField | default=False |
| `crypto_usb` | BooleanField | default=False |
| `crypto_memory_card` | BooleanField | default=False |
| `sold_out` | BooleanField | default=False |
| `date_sold_out` | DateTimeField | null=True, blank=True |

**Herda**: BaseModel
**Relações**: 1:N com AntiVirus, Server, DataDestroyed. N:N com Collaborator (via CollaboratorMachine).

### Software

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `software_name` | CharField(255) | null=True, blank=True |
| `key` | CharField(255) | |
| `quantity` | IntegerField | default=0 |
| `type_licence` | CharField(50) | |
| `quantity_purchase` | IntegerField | default=0 |
| `last_purchase_date` | DateTimeField | |
| `on_use` | IntegerField | default=0 |
| `departament` | CharField(100) | |
| `observation` | TextField | blank=True |
| `expires_at` | DateTimeField | null=True, blank=True (campo NOVO) |

**Herda**: BaseModel
**Relações**: N:N com Collaborator (via CollaboratorSoftware).

---

## Entidades Dependentes

### Email (FK → Collaborator)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `collaborator` | ForeignKey | on_delete=CASCADE, related_name='emails' |
| `email` | CharField(255) | |
| `remark` | CharField(255) | blank=True |
| `email_creation` | DateTimeField | |
| `until` | DateTimeField | null=True, blank=True |

### Cellphone (FK → Collaborator)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `collaborator` | ForeignKey | on_delete=CASCADE, related_name='cellphones' |
| `model` | CharField(255) | |
| `operacional_system` | CharField(100) | |
| `phone_number` | CharField(20) | |
| `status` | BooleanField | default=True |
| `approved` | BooleanField | default=False |
| `have_password` | BooleanField | default=False |
| `first_sinc` | CharField(255) | blank=True |
| `device_id` | CharField(255) | blank=True |

### Wifi (FK → Collaborator)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `collaborator` | ForeignKey | on_delete=CASCADE, related_name='wifi_records' |
| `wifi_name` | CharField(100) | |
| `protection` | CharField(100) | |
| `january` | BooleanField | default=False |
| `february` | BooleanField | default=False |
| `march` | BooleanField | default=False |
| `april` | BooleanField | default=False |
| `may` | BooleanField | default=False |
| `june` | BooleanField | default=False |
| `july` | BooleanField | default=False |
| `august` | BooleanField | default=False |
| `september` | BooleanField | default=False |
| `october` | BooleanField | default=False |
| `november` | BooleanField | default=False |
| `december` | BooleanField | default=False |
| `year` | IntegerField | |

### AntiVirus (FK → Machine)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `machine` | ForeignKey | on_delete=CASCADE, related_name='antivirus_records' |
| `january_updated` .. `december_updated` | BooleanField x12 | default=False |
| `january_check` .. `december_check` | BooleanField x12 | default=False |
| `year` | IntegerField | |

### Server (FK → Machine)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `machine` | ForeignKey | on_delete=CASCADE, related_name='servers' |
| `have_backup` | BooleanField | default=False |
| `backup_date` | DateTimeField | null=True, blank=True |

### ServerAccess (FK → Collaborator)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `collaborator` | ForeignKey | on_delete=CASCADE, related_name='server_accesses' |
| `level01` .. `level06` | BooleanField x6 | default=False |

### ServerErpAccess (FK → Collaborator)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `collaborator` | ForeignKey | on_delete=CASCADE, related_name='erp_accesses' |
| `purchase` | BooleanField | default=False |
| `sale` | BooleanField | default=False |
| `production_control` | BooleanField | default=False |
| `service` | BooleanField | default=False |

### DataDestroyed (FK → Machine)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `machine` | ForeignKey | on_delete=CASCADE, related_name='data_destroyed_records' |
| `when_data_is_destroyed` | DateTimeField | |
| `i_can_destroy_data` | BooleanField | default=False |

### PenDrive (FK → Collaborator)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `collaborator` | ForeignKey | on_delete=CASCADE, related_name='pen_drives' |
| `checked_date` | DateTimeField | |
| `have_virus` | BooleanField | default=False |

---

## Tabelas de Junção (N:N)

### CollaboratorSoftware

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `collaborator` | ForeignKey | on_delete=CASCADE |
| `software` | ForeignKey | on_delete=CASCADE |

**Herda**: BaseModel
**Constraint**: unique_together = ('collaborator', 'software')

### CollaboratorMachine

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `collaborator` | ForeignKey | on_delete=CASCADE |
| `machine` | ForeignKey | on_delete=CASCADE |

**Herda**: BaseModel
**Constraint**: unique_together = ('collaborator', 'machine')

---

## Report (standalone — app reports)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `number` | CharField(2) | unique=True |
| `name` | CharField(200) | |
| `name_jp` | CharField(200) | |
| `category` | CharField(100) | |
| `status` | CharField(20) | choices: pending, generated, sent. default='pending' |
| `last_generated` | DateTimeField | null=True, blank=True |

**NÃO herda BaseModel** — registros fixos de configuração, não precisam de soft delete.

---

## Validation Rules

- Collaborator: `full_name` e `domain_user` são unique — tentativa de duplicação retorna 400
- Machine: `service_tag`, `ip`, `mac_address` são unique
- CollaboratorSoftware/CollaboratorMachine: unique_together previne duplicação de relação
- Soft delete: SoftDeleteManager filtra deleted_at=None em todas as queries padrão
- Report.status: validado por choices (apenas "pending", "generated", "sent")
- Report.number: validado por unique constraint

## State Transitions

### Report.status

```text
pending ──[POST /generate/]──> generated ──[manual/admin]──> sent
```

- `pending` → `generated`: via endpoint POST `/api/reports/:number/generate/`
- `generated` → `sent`: via Django Admin (não implementado como endpoint nesta spec)
- Não há transição reversa (generated → pending)

### Soft Delete Lifecycle (todas as entidades BaseModel)

```text
active (deleted_at=null) ──[DELETE endpoint]──> soft-deleted (deleted_at=timestamp)
                                                      │
                                                      └──[restore() via admin]──> active
```
