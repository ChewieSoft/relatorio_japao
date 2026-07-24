# ADR 0001 — Datas de calendário como `DateField` (não `DateTimeField`)

- **Status:** Aceito
- **Data:** 2026-07-23
- **Ticket:** DJR-176

## Contexto

Os campos de data de negócio do sistema — data de contratação e demissão do
colaborador, data de compra e de venda/descarte da máquina, e data da última
compra e de expiração da licença de software — eram modelados como
`models.DateTimeField` (um instante no tempo), embora semanticamente
representem **datas de calendário** (dia, sem hora).

Com `USE_TZ = True` e `TIME_ZONE = 'America/Sao_Paulo'` (UTC−3) em
`config/settings.py`, um dia informado como `2026-07-23` era persistido como o
instante `2026-07-23T03:00:00Z` e devolvido pela API como
`2026-07-22T21:00:00-03:00`. O frontend enviava a data local carimbada como
meia-noite UTC (`T00:00:00Z`) e, ao reabrir, fatiava os 10 primeiros caracteres
do datetime devolvido, lendo `2026-07-22` — um dia antes. Cada ciclo
abrir/salvar recuava a data mais um dia (bug reportado no chamado DJR-176).

## Decisão

Modelar essas datas de calendário como `models.DateField` e trafegá-las na
fronteira da API como `YYYY-MM-DD` puro (o DRF deriva `serializers.DateField`
automaticamente via `fields = '__all__'`, sem alteração nos serializers). O
frontend passa a enviar a data pura, sem o sufixo `T00:00:00Z`.

Campos afetados: `Collaborator.date_hired`, `Collaborator.date_fired`,
`Machine.date_purchase`, `Machine.date_sold_out`, `Software.last_purchase_date`,
`Software.expires_at`.

`created_at` / `updated_at` / `deleted_at` (do `BaseModel`) permanecem
`DateTimeField` — são timestamps reais de auditoria, não datas de calendário.

## Consequências

- Elimina o off-by-one de timezone de forma estrutural: uma data é uma data,
  independente do `TIME_ZONE` do servidor.
- Requer a migração `core/migrations/0003_alter_collaborator_date_fired_and_more.py`,
  que converte as colunas existentes de `timestamptz` para `date` (cast na
  timezone da conexão, UTC sob `USE_TZ`). **Valores já corrompidos** por saves
  anteriores do bug não são reparados retroativamente — congelam no dia
  atualmente gravado.
- Se algum desses campos precisar de hora real no futuro, esta decisão deve ser
  revisitada (voltar a `DateTimeField` e tratar a data explicitamente na
  fronteira da API).

## Alternativas consideradas

- **Correção só no frontend** (remover o `T00:00:00Z` no envio): menor mudança,
  mas frágil — depende do `TIME_ZONE` do servidor permanecer UTC−3 e mantém a
  data como instante (semântica errada).
- **`serializers.DateField(source=...)` mantendo `DateTimeField`**: evita a
  migração, mas mantém o model semanticamente incorreto e o comportamento de
  `.date()` sobre datetime tz-aware é sutil.
