# CONTEXT — Datas de calendário e o off-by-one de timezone

> Sessão: 2026-07-23 · Ticket: DJR-176 · Branch: `DJR-176_fix_data_off_by_one_timezone`

Glossário e decisões de domínio geradas ao corrigir o bug da data de
contratação, que recuava um dia a cada salvamento.

## Glossário

- **Data de calendário**: valor de dia sem hora (ex.: data de contratação).
  Modelada como `DateField` no backend e `YYYY-MM-DD` puro na API.
- **date_hired / date_fired**: data de contratação e de demissão do colaborador.
- **date_purchase / date_sold_out**: data de compra e de venda/descarte da máquina.
- **last_purchase_date / expires_at**: data da última compra e de expiração da licença de software.
- **created_at / updated_at / deleted_at**: timestamps reais de auditoria
  (`DateTimeField`), distintos das datas de calendário — não mudaram.
- **Off-by-one de timezone**: recuo de um dia causado por armazenar/serializar
  uma data como instante em UTC−3 e depois reduzi-la a data em outro contexto de timezone.
- **USE_TZ / TIME_ZONE**: `True` e `America/Sao_Paulo` (UTC−3), em `config/settings.py`.

## Fluxo (antes → depois)

**Antes:** `2026-07-23` → front envia `2026-07-23T00:00:00Z` → banco grava
`2026-07-23T03:00:00Z` → API devolve `2026-07-22T21:00:00-03:00` → front
`.slice(0,10)` → `2026-07-22` (−1 dia; acumula a cada save).

**Depois:** `2026-07-23` → front envia `2026-07-23` → `DateField` → API devolve
`2026-07-23` → `.slice(0,10)` = identidade → `2026-07-23` (estável).

## Decisões resolvidas

- **Corrigir na raiz**: `DateTimeField → DateField` nos 6 campos + frontend envia
  data pura. Ver [ADR 0001](docs/adr/0001-datas-de-calendario-como-datefield.md).
- **Escopo**: os 6 campos de data de calendário (Collaborator, Machine, Software).
- **Testes**: round-trip real no backend (pytest, `core/tests/test_date_fields.py`)
  + round-trip dos transforms no frontend (vitest, `src/types/entities.test.ts`)
  + mock MSW alinhado a `YYYY-MM-DD` (para não esconder mais a classe do bug).

## 🚩 Open Questions

- **Reparo de dados históricos** já deslocados pelo bug: não feito (staging
  `djr`, baixo volume). Avaliar se algum registro em uso precisa de correção manual.
- **Sprint do DJR-176**: não atribuída automaticamente (MCP atlassian não
  conectado nesta sessão e `acli` não escreve custom fields); adicionar à sprint
  ativa (id 33) manualmente no Jira.
