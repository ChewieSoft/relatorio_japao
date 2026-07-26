# Pipeline Agentic (PO → Tech Dev → QA)

Automação de desenvolvimento baseada em agentes do Claude Code rodando como GitHub Actions.
Uma feature request vira estórias de usuário, vira issues técnicas, vira Pull Request revisado —
com o dono do produto controlando cada portão de aprovação.

> Adaptado do pipeline do `enrich-ai/products`.

---

## 1. Pré-requisitos de configuração

### 1.1 GitHub App

Os workflows **não** usam o `GITHUB_TOKEN` padrão. Eles geram um token de instalação via
[`actions/create-github-app-token@v2`](https://github.com/actions/create-github-app-token),
porque eventos disparados pelo `GITHUB_TOKEN` padrão não acionam outros workflows — o que
quebraria o encadeamento (`po:approved` → planejamento → `story` → implementação → PR → QA).

Crie um GitHub App na organização (Settings > Developer settings > GitHub Apps > New GitHub App) com:

| Permissão (Repository) | Nível        | Por quê |
|------------------------|--------------|---------|
| Contents               | Read & write | Criar branches e commits das stories |
| Issues                 | Read & write | Criar/editar/comentar/fechar issues e aplicar labels |
| Pull requests          | Read & write | Abrir PRs, comentar e aplicar labels de QA |
| Metadata               | Read-only    | Obrigatório pelo GitHub |
| Workflows              | Read & write | Só se os agentes precisarem alterar arquivos em `.github/workflows/` |

Depois: **Install App** no repositório `ChewieSoft/relatorio_japao` e gere uma **private key** (arquivo `.pem`).

### 1.2 Secrets do repositório

Settings > Secrets and variables > Actions > **New repository secret**:

| Secret | Conteúdo | Onde é usado |
|--------|----------|--------------|
| `AUTOMATION_APP_ID` | ID numérico do GitHub App (aba *General* do App) | Todos os 6 workflows |
| `AUTOMATION_APP_PRIVATE_KEY` | Conteúdo **completo** do `.pem`, incluindo as linhas `-----BEGIN...` e `-----END...` | Todos os 6 workflows |
| `CLAUDE_CODE_OAUTH_TOKEN` | OAuth token do Claude Code (gere com `claude setup-token`) | Todos os 6 workflows |

> ⚠️ **Atenção ao nome exato:** os workflows referenciam `secrets.CLAUDE_CODE_OAUTH_TOKEN`
> (com underscore entre `CLAUDE` e `CODE`). Um secret criado como `CLAUDECODE_OAUTH_TOKEN`
> resolve para string vazia e a action falha na autenticação sem mensagem clara.

**Alternativa com API key:** para usar `ANTHROPIC_API_KEY` em vez do OAuth token, crie o secret
com esse nome e troque a linha em cada workflow:

```yaml
# de:
claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
# para:
anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 1.3 Ajustar `allowed_bots` (obrigatório antes do primeiro uso)

Cinco workflows ainda trazem o valor herdado do repositório de origem:

```yaml
allowed_bots: 'enrich-claude[bot]'
```

Esse campo diz à `claude-code-action` de quais bots ela aceita eventos. Como o encadeamento do
pipeline depende de um agente reagir a labels/comentários aplicados por outro agente (todos sob a
identidade do GitHub App), o valor **precisa ser o slug do App instalado neste repositório**, no
formato `<slug-do-app>[bot]`.

Descubra o slug com:

```bash
gh api /repos/ChewieSoft/relatorio_japao/installation --jq '.app_slug'
```

E aplique nos workflows afetados (`po-planning.yml`, `techdev-planning.yml`,
`techdev-implement.yml`, `techdev-fix.yml`, `qa-review.yml`):

```bash
sed -i "s/enrich-claude\[bot\]/<slug-do-app>[bot]/" .github/workflows/*.yml
```

### 1.4 Permitir que Actions crie Pull Requests

Settings > Actions > General > *Workflow permissions* → marcar
**"Allow GitHub Actions to create and approve pull requests"**. Sem isso, o Tech Dev Implement
consegue commitar mas falha ao rodar `gh pr create`.

### 1.5 Labels

O arquivo [`labels.yml`](labels.yml) descreve as 6 labels do pipeline, mas é **apenas
documentação** — nenhum workflow o aplica automaticamente. Sincronize uma vez, manualmente:

```bash
gh label create "feature-request"        --repo ChewieSoft/relatorio_japao --color 0E8A16 --description "Pedido de nova feature — dispara o agente de PO" --force
gh label create "product:relatorio-japao" --repo ChewieSoft/relatorio_japao --color 5319E7 --description "Feature relacionada ao Relatório JRC Brasil" --force
gh label create "po:approved"            --repo ChewieSoft/relatorio_japao --color 1D76DB --description "Estórias de usuário aprovadas pelo dono do produto — dispara o planejamento técnico" --force
gh label create "story"                  --repo ChewieSoft/relatorio_japao --color FBCA04 --description "Issue técnica de uma estória de usuário — dispara a implementação automática" --force
gh label create "qa:ready"               --repo ChewieSoft/relatorio_japao --color 0E8A16 --description "PR revisado e aprovado pelo agente de QA" --force
gh label create "qa:changes-requested"   --repo ChewieSoft/relatorio_japao --color D93F0B --description "PR com mudanças solicitadas pelo agente de QA" --force
```

> `gh label clone <origem>` copia labels **de outro repositório para o atual** — não lê o
> `labels.yml`. Só serve se você já tiver um repositório-modelo com essas labels criadas
> (ex.: `gh label clone ChewieSoft/relatorio_japao --force`, rodado de dentro de um repo novo).

**As labels precisam existir antes do primeiro uso.** Um `gh issue edit --add-label "po:approved"`
falha se a label não existir, travando o pipeline no gate de aprovação.

---

## 2. Fluxo do pipeline

```text
  Humano                          Agentes                                Resultado
  ──────                          ───────                                ─────────
  Abre issue com
  feature-request      ──────►  PO Planning ─────────────────────────►  Comentário com
  + product:relatorio-japao      (po-planning.yml)                       user stories

  Comenta
  "@claude approve"    ──────►  PO Gate ─────────────────────────────►  Label po:approved
                                (po-gate.yml)
                                     │
                                     ▼
                                TechDev Planning ────────────────────►  N issues com
                                (techdev-planning.yml)                  label story
                                     │
                                     ▼
                                TechDev Implement ───────────────────►  Branch story/*
                                (techdev-implement.yml)                 + Pull Request
                                     │
                                     ▼
                                QA Review ───────────────────────────►  qa:ready ou
                                (qa-review.yml)                         qa:changes-requested
                                     │
                                     ▼ (se changes-requested)
                                TechDev Fix ─────────────────────────►  Novos commits
                                (techdev-fix.yml)                       na mesma branch

  Faz o merge          ◄──────  (nunca automático)
```

### 2.1 Etapas em detalhe

| # | Workflow | Gatilho | O que faz | Persona |
|---|----------|---------|-----------|---------|
| 1 | `po-planning.yml` | Issue aberta ou rotulada com `feature-request` **e** alguma label `product:*` | Quebra a feature request em estórias de usuário e publica num comentário `<details>` | `agents/po-agent-prompt.md` |
| 2 | `po-gate.yml` | Comentário em issue começando com `@claude approve` / `@claude reject` / `@claude ask` | `approve` → aplica `po:approved`; `reject` → fecha a issue; `ask` → replaneja as estórias | `agents/po-agent-prompt.md` |
| 3 | `techdev-planning.yml` | Label `po:approved` aplicada | Cria uma issue técnica (label `story`) por estória, com especificação e todo-list | `agents/techdev-planning-prompt.md` |
| 4 | `techdev-implement.yml` | Label `story` aplicada | Cria branch `story/*` a partir de `staging`, implementa, roda os checks e abre PR com `Closes #<issue>` | `agents/techdev-implement-prompt.md` |
| 5 | `qa-review.yml` | PR aberto ou atualizado (`synchronize`) | Revisa o diff contra os critérios de aceite e aplica `qa:ready` ou `qa:changes-requested` | `agents/qa-agent-prompt.md` |
| 6 | `techdev-fix.yml` | Label `qa:changes-requested` no PR, **ou** comentário `@claude ask` num PR | Aplica as correções na própria branch do PR (não abre PR novo) | `agents/techdev-implement-prompt.md` |

### 2.2 Comandos do dono do produto

Só funcionam para quem tem `author_association` igual a `OWNER`, `MEMBER` ou `COLLABORATOR`.

| Comando | Onde | Efeito |
|---------|------|--------|
| `@claude approve` | Comentário na issue de feature request | Aplica `po:approved` e dispara o planejamento técnico |
| `@claude reject [motivo]` | Comentário na issue de feature request | Fecha a issue reconhecendo o motivo |
| `@claude ask <feedback>` | Comentário na issue de feature request | Replaneja as estórias com base no feedback |
| `@claude ask <feedback>` | Comentário num Pull Request | Aplica o ajuste pedido na branch do PR |

### 2.3 O que os agentes **não** fazem

- **Não fazem merge.** O merge é sempre manual, feito por um humano.
- **Não aprovam formalmente PRs** (`gh pr review --approve`). O QA usa `gh pr comment` + label,
  porque o GitHub bloqueia review formal na identidade que abriu o PR — o veredito oficial é a label.
- **Não editam escopo** de uma story sem comentar a dúvida antes.

---

## 3. Branch base: `staging`

O branch base deste projeto é **`staging`**, não `main`. Isso está refletido em:

- `agents/techdev-implement-prompt.md` — instrui a criar a branch a partir de `staging` e abrir o PR contra `staging`.
- `workflows/techdev-implement.yml` — reforça a regra no prompt da tarefa.
- `.jira-project` — `BASE_BRANCH=staging`.

Ao revisar um PR aberto pelo agente, confirme que a base é `staging`. `main` recebe apenas
merges promovidos a partir de `staging`.

---

## 4. Relação com o CI existente

O pipeline agentic é **independente** do CI de qualidade:

| Workflow | Papel | Independente? |
|----------|-------|---------------|
| `ci.yml` | Gate de qualidade — `manage.py check` + `pytest` (backend), lint + build + testes (frontend). Roda em PRs para `staging`/`main` e em push direto para `main` | Sim — roda com ou sem os agentes |
| `cd-staging.yml` | Deploy para `djr.jrcbrasil.net` via runner self-hosted, usando `ci.yml` como gate | Sim |
| `po-*`, `techdev-*`, `qa-review` | Pipeline agentic | Sim |

Os dois convivem no mesmo PR: o CI roda os testes de verdade, o QA Agent revisa a lógica e a
aderência aos critérios de aceite. **CI verde é necessário, mas não suficiente** — a persona de
QA é explícita em não aprovar apenas porque o CI passou.

O agente de implementação também roda os mesmos checks localmente antes de abrir o PR
(`python manage.py check`, `pytest -q`, `npm run lint`, `npm run build`, `npm run test`),
então o CI funciona como confirmação independente, não como primeira descoberta.

---

## 5. Custos e limites

- Cada etapa consome tokens da conta Claude associada ao `CLAUDE_CODE_OAUTH_TOKEN`.
  A implementação (etapa 4) é de longe a mais cara.
- `po-planning.yml` e `techdev-planning.yml` usam `concurrency` com `cancel-in-progress: true`
  por issue — reaplicar uma label não dispara duas execuções simultâneas.
- `po-planning.yml` tem um guard extra: se já existe um comentário com o marcador
  `<!-- po-agent:plan -->`, ele não replaneja.
- **`qa-review.yml` roda em todo Pull Request**, inclusive os abertos por humanos e os que não
  vieram do pipeline. Para limitá-lo às branches dos agentes, adicione ao job:

  ```yaml
  if: startsWith(github.event.pull_request.head.ref, 'story/')
  ```

---

## 6. Checklist de setup

- [ ] GitHub App criado com as permissões da seção 1.1 e instalado no repositório
- [ ] Secrets `AUTOMATION_APP_ID`, `AUTOMATION_APP_PRIVATE_KEY` e `CLAUDE_CODE_OAUTH_TOKEN` criados
- [ ] `allowed_bots` trocado de `enrich-claude[bot]` para o slug do App deste repositório (seção 1.3)
- [ ] "Allow GitHub Actions to create and approve pull requests" habilitado
- [ ] As 6 labels criadas no repositório (seção 1.5)
- [ ] Teste ponta-a-ponta: abrir uma issue com `feature-request` + `product:relatorio-japao` e conferir
      se o PO Agent responde com as estórias

---

## 7. Troubleshooting

| Sintoma | Causa provável | Correção |
|---------|----------------|----------|
| Workflow não dispara ao abrir a issue | Falta a label `product:relatorio-japao` (o `if` do `po-planning` exige `feature-request` **e** uma label `product:*`) | Aplicar as duas labels |
| Falha em `create-github-app-token` | `AUTOMATION_APP_ID` errado, private key truncada, ou App não instalado no repo | Recriar os secrets; conferir a instalação do App |
| Claude Code falha na autenticação | Secret com nome errado (`CLAUDECODE_...`) ou token expirado | Conferir o nome exato `CLAUDE_CODE_OAUTH_TOKEN`; regerar com `claude setup-token` |
| `gh issue edit --add-label` falha | Label não existe no repositório | Rodar os `gh label create` da seção 1.5 |
| PO Agent aprova mas o TechDev Planning não roda | `po:approved` aplicada pelo `GITHUB_TOKEN` padrão em vez do App | Confirmar que o step usa `steps.app-token.outputs.token` |
| `gh pr create` falha por permissão | "Allow GitHub Actions to create and approve pull requests" desmarcado | Habilitar em Settings > Actions > General |
| Agente ignora eventos de outro agente | `allowed_bots` com o slug errado | Ver seção 1.3 |
| PR aberto contra `main` | Prompt/persona alterados | Reapontar para `staging` (seção 3) |

---

## 8. Arquivos do pipeline

```text
.github/
├── AUTOMATION.md                       # este documento
├── labels.yml                          # descrição das 6 labels (referência; sincronização manual)
├── agents/
│   ├── po-agent-prompt.md              # persona do PO (planning + gate)
│   ├── techdev-planning-prompt.md      # persona do Tech Dev (quebra em issues técnicas)
│   ├── techdev-implement-prompt.md     # persona do Tech Dev (implementação + fix)
│   └── qa-agent-prompt.md              # persona do QA
└── workflows/
    ├── po-planning.yml                 # 1. feature-request → user stories
    ├── po-gate.yml                     # 2. @claude approve/reject/ask
    ├── techdev-planning.yml            # 3. po:approved → issues de story
    ├── techdev-implement.yml           # 4. story → branch + PR
    ├── qa-review.yml                   # 5. PR → qa:ready | qa:changes-requested
    ├── techdev-fix.yml                 # 6. qa:changes-requested → correções
    ├── ci.yml                          # gate de qualidade (independente)
    └── cd-staging.yml                  # deploy staging (independente)
```

As personas em `agents/` são carregadas em tempo de execução (`cat` para `$GITHUB_OUTPUT`) e
injetadas no prompt. **Editar um `.md` de persona muda o comportamento do agente sem tocar no
workflow** — é o ponto de ajuste preferencial quando um agente erra de forma recorrente.
