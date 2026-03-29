# Research: Backend Django REST API

**Feature**: 002-django-backend-api | **Date**: 2026-03-29

## R1: Field Mapping — Collaborator (frontend ↔ model)

**Decision**: Serializer aliases via `source=` parameter.

**Mapeamento completo**:

| Frontend field | Model field | Serializer strategy |
|----------------|-------------|---------------------|
| `name` | `full_name` | `CharField(source='full_name')` |
| `domain_user` | `domain_user` | Direct |
| `department` | `office` | `CharField(source='office')` |
| `status` | `status` | Direct |
| `fired` | `fired` | Direct |
| `has_server_access` | — (relação ServerAccess) | `SerializerMethodField()` → `ServerAccess.objects.filter(collaborator=obj).exists()` |
| `has_erp_access` | — (relação ServerErpAccess) | `SerializerMethodField()` → `ServerErpAccess.objects.filter(collaborator=obj).exists()` |
| `has_internet_access` | `perm_acess_internet` | `BooleanField(source='perm_acess_internet')` |
| `has_cellphone` | — (relação Cellphone) | `SerializerMethodField()` → `Cellphone.objects.filter(collaborator=obj).exists()` |
| `email` | — (relação Email) | `SerializerMethodField()` → primeiro email do colaborador |

**Rationale**: Manter nomes originais do Prisma schema nos modelos preserva compatibilidade com documentação existente (ANALISE.md, PLANO_IMPLEMENTACAO.md, docs/BACKEND.md). A transformação fica isolada na camada de serialização (SRP).

**Alternatives considered**: Renomear campos no model → rejeitado por quebrar consistência com toda a documentação.

## R2: Field Mapping — Machine (frontend ↔ model)

**Decision**: Serializer aliases + `SerializerMethodField` para campos computed.

**Mapeamento completo**:

| Frontend field | Model field | Serializer strategy |
|----------------|-------------|---------------------|
| `hostname` | — (não existe) | `SerializerMethodField()` → `f"{obj.model}-{obj.service_tag}"` ou adicionar campo `hostname` ao model |
| `model` | `model` | Direct |
| `service_tag` | `service_tag` | Direct |
| `ip` | `ip` | Direct |
| `mac_address` | `mac_address` | Direct |
| `operational_system` | `operacional_system` | `CharField(source='operacional_system')` |
| `encrypted` | — (derivado) | `SerializerMethodField()` → `obj.crypto_disk or obj.crypto_usb or obj.crypto_memory_card` |
| `antivirus` | — (relação AntiVirus) | `SerializerMethodField()` → verifica se há AntiVirus atualizado |
| `collaborator_id` | — (via CollaboratorMachine) | `SerializerMethodField()` → primeiro colaborador associado |
| `collaborator_name` | — (via CollaboratorMachine) | `SerializerMethodField()` → nome do primeiro colaborador |
| `machine_type` | `type` | `CharField(source='type')` |

**Decision on `hostname`**: Adicionar campo `hostname` (CharField, nullable) ao modelo Machine. Motivo: é um campo real de inventário (nome de rede do computador), não um dado derivado. O Prisma schema original não tinha, mas o frontend precisa e faz sentido no domínio.

**Rationale**: Campos computed (encrypted, antivirus, collaborator_*) devem usar `select_related`/`prefetch_related` no repository para evitar N+1.

## R3: Field Mapping — Software (frontend ↔ model)

**Decision**: Serializer aliases + campo novo `expires_at`.

**Mapeamento completo**:

| Frontend field | Model field | Serializer strategy |
|----------------|-------------|---------------------|
| `software_name` | `software_name` | Direct |
| `license_key` | `key` | `CharField(source='key')` |
| `license_type` | `type_licence` | `CharField(source='type_licence')` |
| `quantity` | `quantity` | Direct |
| `in_use` | `on_use` | `IntegerField(source='on_use')` |
| `expires_at` | `expires_at` (NOVO) | Direct — campo novo no model |

**Rationale**: `expires_at` é semanticamente distinto de `last_purchase_date`. Ambos existirão no modelo. `expires_at` é null para licenças perpetual/OEM.

## R4: Report Model (novo)

**Decision**: Criar modelo Report no app `reports` com status tracking.

**Campos**:

| Campo | Tipo | Notas |
|-------|------|-------|
| `number` | CharField(max_length=2, unique=True) | "08", "09", "13", etc. |
| `name` | CharField(max_length=200) | Nome em PT-BR |
| `name_jp` | CharField(max_length=200) | Nome em japonês |
| `category` | CharField(max_length=100) | Categoria do relatório |
| `status` | CharField(choices) | "pending", "generated", "sent" |
| `last_generated` | DateTimeField(null=True) | Última geração |

**Seed**: 19 registros via fixture JSON, todos com status="pending" e last_generated=null.

**Rationale**: Report NÃO herda de BaseModel (não precisa de soft delete — são registros fixos de configuração). Alternativa considerada: data migration em vez de fixture → rejeitada por ser mais difícil de manter.

## R5: Dashboard Stats Endpoint

**Decision**: View dedicada (APIView) no app core, sem service/repository separados.

**Queries**:

```text
active_collaborators = Collaborator.objects.filter(status=True, fired=False).count()
total_collaborators = Collaborator.objects.count()
total_machines = Machine.objects.count()
total_software = Software.objects.count()
pending_reports = Report.objects.filter(status='pending').count()
total_reports = Report.objects.count()
machines_without_encryption = Machine.objects.filter(
    crypto_disk=False, crypto_usb=False, crypto_memory_card=False
).values_list('service_tag', flat=True)
```

**Rationale**: Endpoint simples de agregação. Criar service/repository apenas para isso violaria KISS. Se crescer em complexidade na spec 003, extrair para camadas.

**Alternative considered**: Incluir no app reports → rejeitado porque dashboard agrega dados de múltiplos domínios (core + reports).

## R6: Docker Backend Setup

**Decision**: Dockerfile baseado em python:3.11-slim com entrypoint que roda migrate automaticamente.

**Entrypoint script** (`entrypoint.sh`):

```text
1. wait-for-it db:5432 (ou loop simples com pg_isready)
2. python manage.py migrate --noinput
3. exec python manage.py runserver 0.0.0.0:8000 (dev)
```

**Rationale**: Resolve FR-002 (migrações automáticas) e evita que o desenvolvedor precise rodar migrate manualmente após cada rebuild.

## R7: Hostname Field Decision

**Decision**: Adicionar campo `hostname` (CharField, max_length=255, blank=True, default='') ao modelo Machine.

**Rationale**: `hostname` é um dado real de inventário (nome de rede/NetBIOS do computador). Não é derivável dos campos existentes (model, service_tag são dados de hardware, não de rede). O frontend já espera este campo. Adicionar ao modelo é mais limpo que fabricá-lo no serializer.

**Alternative considered**: SerializerMethodField derivando de model+service_tag → rejeitado porque hostname é um dado independente no domínio de TI.

---

## Decisões Pós-Implementação (Code Review)

As decisões abaixo foram tomadas durante 3 rodadas de code review automatizado.

## R8: on_delete=PROTECT em todas as ForeignKeys

**Decision**: Todas as FKs usam `on_delete=models.PROTECT` em vez de CASCADE.

**Rationale**: CASCADE faz delete físico em cascata se o parent for removido fisicamente (via admin, management command, ou DB). Isso conflita com o padrão soft delete — children seriam perdidos permanentemente. PROTECT impede delete físico do parent, forçando uso do caminho soft delete.

## R9: UniqueConstraint parcial para junction tables

**Decision**: `CollaboratorSoftware` e `CollaboratorMachine` usam `UniqueConstraint` com `condition=Q(deleted_at__isnull=True)` em vez de `unique_together`.

**Rationale**: Com soft delete, `unique_together` bloqueia re-criação da mesma relação após soft delete (o registro deletado ainda existe no DB). O partial unique index permite re-criar relações ativas enquanto mantém unicidade.

## R10: DashboardService obrigatório

**Decision**: DashboardStatsView delega para `DashboardService.get_stats()`. Controller nunca acessa ORM diretamente.

**Rationale**: Mesmo para endpoints simples de agregação, a regra "Controllers chamando ORM diretamente" do CLAUDE.md se aplica. Usar `apps.get_model('reports', 'Report')` no service para evitar import cross-app.

## R11: EmailInputSerializer para nested creation

**Decision**: Criar `EmailInputSerializer` separado (sem campo `collaborator`) para uso em `CollaboratorCreateSerializer`.

**Rationale**: `EmailSerializer` usa `fields='__all__'` que inclui `collaborator` como campo obrigatório. Em nested creation, o collaborator é atribuído pelo service, não pelo cliente. Sem serializer separado, o POST falha com 400 exigindo collaborator em cada email.

## R12: Prefetch — usar .all() não .filter()/.first()

**Decision**: SerializerMethodFields que acessam relações prefetched devem usar `obj.relation.all()` e indexar com `[0]`, nunca `.filter()` ou `.first()`.

**Rationale**: `.filter()` e `.first()` emitem novas queries ao DB, ignorando o cache do prefetch_related. Isso transforma prefetch em N+1. `.all()` usa o cache prefetched.

## R13: Service.update() deve extrair campos de relação reversa

**Decision**: `CollaboratorService.update()` faz `data.pop('emails', None)` antes de delegar ao repository.

**Rationale**: Se o cliente enviar `emails` no PUT/PATCH, `BaseRepository.update()` tenta `setattr(instance, 'emails', ...)` que falha porque `emails` é uma relação reversa do Django, não um campo editável.

## R14: perform_create/update deve setar serializer.instance

**Decision**: `BaseController.perform_create()` atribui `serializer.instance = self.service.create(...)`.

**Rationale**: Sem `serializer.instance`, o DRF retorna `validated_data` bruto na resposta — sem `id`, `created_at`, ou qualquer campo gerado pelo banco. perform_update usa `serializer.instance.pk` (já disponível) em vez de `self.get_object().pk` (query duplicada).
