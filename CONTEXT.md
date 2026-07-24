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

## Seguimento (2026-07-24) — erro residual do datepicker e exibição BR

- **Sintoma reportado**: ao salvar pelo datepicker, o campo mostrava
  "Formato inválido para data. Use um dos formatos a seguir: YYYY-MM-DD.".
  Essa string é o erro embutido do DRF `DateField` (i18n pt-BR), devolvido em
  `400` e pintado no campo via `serverErrors`. Só dispara quando um valor **com
  hora** (`T…Z`) chega a um `DateField`.
- **Causa-raiz**: o código já commitado envia data pura; o erro vinha de um
  **build antigo do frontend** (ainda carimbava `T00:00:00Z`) rodando contra o
  backend já migrado para `DateField`. Correção do sintoma = **rebuild** do
  frontend.
- **Blindagem de contrato** (`para evitar problemas`): `toApiDate()` em
  `src/types/entities.ts` reduz qualquer valor a `YYYY-MM-DD` puro (ou `null`)
  nos 3 payload builders — impede a recorrência estruturalmente.
- **Exibição brasileira**: `formatDateBR()` em `src/lib/utils.ts` formata como
  `DD/mmm/YYYY` (ex.: `01/dez/2023`), à prova de timezone (parse por split, sem
  `new Date()`). Aplicada na coluna "Contratação" (Colaboradores) e "Expira em"
  (Software). O campo **editável** segue `<input type="date">` nativo (numérico
  `DD/MM/YYYY`, como na foto do chamado). Para expor a data na listagem,
  `CollaboratorListSerializer` passou a incluir `date_hired`.
- **Proxy de dev**: `vite.config.ts` ganhou `server.proxy['/api'] →
  http://localhost:8000` (configurável via `VITE_DEV_API_PROXY`), casando com
  `VITE_API_URL=/api` do `.env` e tornando `npm run dev`/e2e same-origin.
- **Testes adicionados**: `toApiDate`/`formatDateBR` (vitest), rejeição de data
  com hora no backend (`test_date_fields.py`) e **e2e Playwright**
  (`tests/collaborator-date.spec.ts`: login → Leonardo Ribas → `01/dez/2023` →
  salva sem erro → coluna mostra `01/dez/2023` → reabre sem recuar um dia).

## Decisões resolvidas (formato de datas)

- **API/armazenamento**: sempre `YYYY-MM-DD` puro (contrato `DateField`).
- **Entrada (edição)**: `<input type="date">` nativo → exibe `DD/MM/YYYY` em
  pt-BR (nativo não renderiza mês abreviado).
- **Exibição (somente leitura)**: `DD/mmm/YYYY` via `formatDateBR`.

## 🚩 Open Questions

- **Reparo de dados históricos** já deslocados pelo bug: não feito (staging
  `djr`, baixo volume). Avaliar se algum registro em uso precisa de correção manual.
- **Sprint do DJR-176**: não atribuída automaticamente (MCP atlassian não
  conectado nesta sessão e `acli` não escreve custom fields); adicionar à sprint
  ativa (id 33) manualmente no Jira.
