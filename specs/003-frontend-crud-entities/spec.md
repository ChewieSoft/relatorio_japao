# Feature Specification: CRUD Frontend para Entidades Principais

**Feature Branch**: `003-frontend-crud-entities`
**Created**: 2026-04-05
**Status**: Draft
**Input**: Expandir o frontend para suportar o ciclo completo de CRUD (Create, Read, Update, Delete) para as entidades Collaborators, Machines e Software, alinhando com a API Django já funcional construída na spec 002.

## Contexto

O frontend (spec 001) opera em modo somente leitura: exibe tabelas paginadas de colaboradores, máquinas e software vindas da API via React Query, mas não possui formulários de cadastro, edição ou exclusão. O backend (spec 002) já implementa endpoints CRUD completos para todas as 14 entidades, incluindo soft delete, validação e nested creation.

**Estado atual do frontend:**

| Capacidade | Status Atual | Objetivo desta spec |
|------------|-------------|---------------------|
| Listagem paginada | Implementado (GET) | Manter + adicionar busca/filtro |
| Criação de registros | Não existe | Formulários de cadastro |
| Edição de registros | Não existe | Formulários de atualização |
| Exclusão de registros | Não existe | Exclusão com confirmação |
| Feedback ao usuário | Parcial (erro/loading) | Toasts de sucesso/erro em mutações |

**Dependências já resolvidas:**
- API REST com CRUD completo (spec 002)
- Componentes de formulário instalados mas não utilizados (Dialog, Sheet, Form, Input, Select, Switch)
- Bibliotecas de validação instaladas mas não utilizadas (react-hook-form, zod)
- Autenticação JWT funcional com interceptors
- MSW configurado para desenvolvimento (apenas handlers GET)

**Escopo de entidades:**
- **Dentro do escopo**: Collaborators, Machines, Software (3 entidades principais)
- **Fora do escopo**: Reports (spec futura), entidades dependentes (Email, Cellphone, Wifi, AntiVirus, Server, ServerAccess, ServerErpAccess, DataDestroyed, PenDrive — spec futura)

## Clarifications

### Session 2026-04-05

- Q: Padrão de UX para formulários de criação/edição (Dialog, Sheet, página dedicada)? → A: Dialog para Collaborator e Software; Sheet (painel lateral) para Machine (formulário mais denso com 15+ campos).
- Q: Formulários devem incluir todos os campos do modelo ou apenas o subconjunto exibido na listagem? → A: Todos os campos do modelo. Campos condicionais (ex: date_fired quando fired=true) aparecem dinamicamente.
- Q: Como o usuário acessa edição e exclusão a partir da listagem? → A: Coluna de ações no final de cada linha com botões de ícone (editar, excluir).
- Q: Como o frontend deve registrar erros inesperados (não-validação) para debugging? → A: Console.error apenas. Toast já cobre feedback ao usuário (FR-004/FR-014). Sem infraestrutura de logging adicional.
- Q: Qual o timeout de requisições HTTP quando a rede está indisponível? → A: 10 segundos (Axios request timeout). Formulário permanece aberto com dados preservados após timeout.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cadastrar novo registro (Priority: P1)

O administrador de TI da JRC Brasil precisa cadastrar um novo colaborador, uma nova máquina ou um novo software no sistema. Hoje, essa operação exige acesso ao Django Admin ou inserção manual no banco de dados. Com esta funcionalidade, o administrador acessa a página de listagem da entidade, clica em um botão "Novo", preenche o formulário com os dados obrigatórios, submete e vê o novo registro aparecer na tabela.

**Why this priority**: Sem a capacidade de criar registros pela interface, o sistema é apenas um visualizador de dados — o valor real está em permitir gestão completa sem dependência de ferramentas técnicas.

**Independent Test**: O administrador acessa a página de colaboradores, clica em "Novo Colaborador", preenche nome, domínio e departamento, salva e confirma que o registro aparece na listagem.

**Acceptance Scenarios**:

1. **Given** o usuário está na página de listagem de colaboradores, **When** clica no botão "Novo Colaborador", **Then** um formulário de cadastro é exibido com os campos obrigatórios da entidade.
2. **Given** o formulário de cadastro está visível, **When** o usuário preenche todos os campos obrigatórios e submete, **Then** o registro é criado na API, a listagem é atualizada automaticamente e uma notificação de sucesso é exibida.
3. **Given** o formulário de cadastro está visível, **When** o usuário submete com campos obrigatórios vazios ou dados inválidos, **Then** mensagens de validação são exibidas nos campos com erro, sem enviar requisição à API.
4. **Given** o formulário foi submetido, **When** a API retorna erro de validação (ex: domain_user duplicado), **Then** o erro é exibido ao usuário de forma compreensível.
5. **Given** o usuário está preenchendo o formulário, **When** clica em "Cancelar" ou fecha o formulário, **Then** os dados não são salvos e o formulário é fechado.

---

### User Story 2 — Editar registro existente (Priority: P2)

O administrador de TI precisa corrigir ou atualizar dados de um colaborador, máquina ou software existente. Ele acessa a listagem, seleciona o registro desejado, vê o formulário preenchido com os dados atuais, faz as alterações necessárias e salva.

**Why this priority**: Dados de compliance mudam frequentemente (IP de máquina, status de colaborador, licenças de software). Sem edição pela interface, correções exigem acesso direto ao banco.

**Independent Test**: O administrador acessa a página de máquinas, clica em uma máquina existente, altera o IP, salva e confirma que a listagem reflete a mudança.

**Acceptance Scenarios**:

1. **Given** o usuário está na página de listagem, **When** clica no botão de editar (ícone) na coluna de ações do registro, **Then** o formulário de edição é exibido com todos os campos preenchidos com os dados atuais do registro.
2. **Given** o formulário de edição está visível com dados preenchidos, **When** o usuário altera um ou mais campos e submete, **Then** o registro é atualizado na API, a listagem reflete as mudanças e uma notificação de sucesso é exibida.
3. **Given** o formulário de edição está visível, **When** o usuário não faz alterações e clica em "Cancelar", **Then** nenhuma requisição é enviada e o formulário é fechado.
4. **Given** a API retorna erro durante a atualização (ex: IP duplicado), **Then** o erro é exibido ao usuário e o formulário permanece aberto para correção.

---

### User Story 3 — Excluir registro (Priority: P3)

O administrador de TI precisa remover um colaborador demitido, uma máquina descomissionada ou um software descontinuado. A exclusão deve exigir confirmação explícita para evitar remoções acidentais. A operação é um soft delete — o registro não aparece mais nas listagens, mas permanece no banco para integridade de relatórios.

**Why this priority**: Exclusão é menos frequente que criação/edição, e o impacto de um erro é maior — por isso requer confirmação e é prioridade menor.

**Independent Test**: O administrador acessa a página de software, clica no botão de excluir de um software, confirma a ação no diálogo de confirmação, e verifica que o software não aparece mais na listagem.

**Acceptance Scenarios**:

1. **Given** o usuário está na listagem, **When** clica no botão de excluir (ícone) na coluna de ações do registro, **Then** um diálogo de confirmação é exibido com o nome/identificador do registro a ser excluído.
2. **Given** o diálogo de confirmação está visível, **When** o usuário confirma a exclusão, **Then** o registro é removido via API (soft delete), a listagem é atualizada e uma notificação de sucesso é exibida.
3. **Given** o diálogo de confirmação está visível, **When** o usuário cancela, **Then** nenhuma ação é executada e o diálogo é fechado.
4. **Given** a exclusão falha na API (ex: registro possui dependências que impedem remoção), **Then** uma mensagem de erro clara é exibida ao usuário.

---

### User Story 4 — Buscar e filtrar registros na listagem (Priority: P4)

O administrador de TI precisa encontrar rapidamente um colaborador, máquina ou software específico entre dezenas ou centenas de registros. A listagem atual só permite navegar por paginação — sem busca textual ou filtros. Com esta funcionalidade, o administrador digita um termo de busca e a tabela filtra os resultados correspondentes.

**Why this priority**: Busca melhora significativamente a usabilidade, mas o CRUD funcional (P1-P3) é pré-requisito para o sistema ter valor operacional.

**Independent Test**: O administrador acessa a página de colaboradores, digita "João" no campo de busca e vê apenas os colaboradores cujo nome contém "João".

**Acceptance Scenarios**:

1. **Given** o usuário está na página de listagem, **When** digita um termo no campo de busca, **Then** a tabela exibe apenas registros que correspondem ao termo (busca server-side via parâmetro `?search=`).
2. **Given** o usuário digitou um termo de busca, **When** apaga o termo, **Then** a listagem completa é exibida novamente.
3. **Given** a busca retorna zero resultados, **Then** a mensagem "Nenhum registro encontrado" é exibida.
4. **Given** o usuário digita rapidamente vários caracteres, **Then** o sistema aguarda uma breve pausa antes de enviar a requisição (debounce), evitando requisições excessivas.

---

### Edge Cases

- O que acontece quando o usuário tenta criar um registro e a sessão JWT expirou? O interceptor Axios renova o token automaticamente e re-executa a requisição de criação.
- O que acontece quando o usuário submete um formulário e perde conexão com a internet? Após 10 segundos de timeout (FR-023), uma mensagem de erro de conectividade é exibida. O formulário permanece aberto com os dados preenchidos.
- O que acontece quando dois usuários editam o mesmo registro simultaneamente? O último a salvar sobrescreve (last-write-wins) — não há controle de concorrência nesta versão.
- O que acontece quando o usuário tenta excluir um colaborador que possui relações dependentes (emails, celulares, etc.) e o backend retorna erro 400/409? O frontend exibe a mensagem de erro do backend de forma compreensível.
- O que acontece quando o formulário de criação de máquina não preenche o campo "hostname" (opcional)? O registro é criado com hostname vazio — o campo não é obrigatório.

## Requirements *(mandatory)*

### Functional Requirements

**Criação de Registros:**

- **FR-001**: O sistema DEVE permitir que o usuário autenticado crie novos registros de colaboradores, máquinas e software através de formulários na interface.
- **FR-002**: Os formulários de criação DEVEM validar campos obrigatórios e formatos antes de enviar a requisição à API (validação client-side).
- **FR-003**: Após criação bem-sucedida, a listagem da entidade DEVE ser atualizada automaticamente para exibir o novo registro.
- **FR-004**: O sistema DEVE exibir notificação de sucesso após criação bem-sucedida e notificação de erro em caso de falha.

**Edição de Registros:**

- **FR-005**: O sistema DEVE permitir que o usuário autenticado edite registros existentes de colaboradores, máquinas e software.
- **FR-006**: O formulário de edição DEVE ser preenchido automaticamente com os dados atuais do registro selecionado.
- **FR-007**: Após edição bem-sucedida, a listagem DEVE refletir as alterações imediatamente.

**Exclusão de Registros:**

- **FR-008**: O sistema DEVE permitir que o usuário autenticado exclua registros de colaboradores, máquinas e software.
- **FR-009**: Toda exclusão DEVE exigir confirmação explícita do usuário antes de ser executada, exibindo o nome ou identificador do registro.
- **FR-010**: Após exclusão bem-sucedida, o registro DEVE desaparecer da listagem imediatamente.

**Busca e Filtro:**

- **FR-011**: Cada página de listagem DEVE ter um campo de busca textual que filtra registros via parâmetro de busca na API.
- **FR-012**: A busca DEVE aplicar debounce para evitar requisições excessivas durante a digitação.

**Validação e Feedback:**

- **FR-013**: O sistema DEVE exibir mensagens de validação junto aos campos com erro quando o formulário é submetido com dados inválidos.
- **FR-014**: Erros retornados pela API (campos duplicados, validação server-side) DEVEM ser exibidos ao usuário de forma compreensível.
- **FR-015**: O sistema DEVE exibir estados de carregamento (loading) durante operações de criação, edição e exclusão para indicar que a ação está em andamento.

**Observabilidade e Resiliência:**

- **FR-022**: Erros inesperados (não-validação) nas operações de mutação DEVEM ser registrados via `console.error` para debugging. Nenhuma infraestrutura de logging adicional é necessária.
- **FR-023**: Requisições HTTP do Axios DEVEM ter um timeout de 10 segundos. Quando o timeout é atingido, o formulário DEVE permanecer aberto com os dados preservados e uma mensagem de erro de conectividade DEVE ser exibida.

**Campos por Entidade:**

- **FR-016**: O formulário de Collaborator DEVE incluir os campos: nome completo, usuário de domínio, departamento, status (ativo/inativo), demitido, data de contratação, data de demissão (condicional: visível quando demitido=true), permissão de acesso à internet, acesso WiFi, privilégio de administrador.
- **FR-017**: O formulário de Machine DEVE incluir os campos: hostname, modelo, tipo (desktop/notebook), service tag, sistema operacional, memória RAM, disco, IP, endereço MAC, administrador, código JDB, quantidade, data de compra, criptografia de disco/USB/cartão de memória, baixa patrimonial (sold_out), data de baixa (condicional: visível quando sold_out=true).
- **FR-018**: O formulário de Software DEVE incluir os campos: nome do software, chave de licença, tipo de licença (perpétua/assinatura/OEM), quantidade comprada, quantidade total, em uso, departamento, data da última compra, data de expiração (condicional: visível quando tipo=assinatura), observação.

**Tabela de Listagem:**

- **FR-020**: Cada tabela de listagem DEVE ter uma coluna "Ações" no final de cada linha com botões de ícone para editar e excluir o registro.

**MSW (Desenvolvimento):**

- **FR-021**: Os handlers MSW DEVEM ser expandidos para suportar POST, PUT/PATCH e DELETE para as 3 entidades, permitindo desenvolvimento e teste sem backend real.

### Key Entities

- **Collaborator**: Funcionário da JRC Brasil com dados de domínio Windows, departamento, status ativo/inativo, flags de permissão (internet, WiFi, admin) e status de demissão. Relaciona-se com múltiplas entidades dependentes (emails, celulares, etc.) que estão fora do escopo desta spec.
- **Machine**: Computador ou notebook do inventário com hostname, modelo, service tag, dados de rede (IP, MAC), sistema operacional, flags de criptografia (disco, USB, cartão de memória) e informações de compra. Pode estar associado a um colaborador.
- **Software**: Licença de software com nome, chave, tipo de licença, quantidades (compradas, em uso), departamento responsável e data de expiração. Relaciona-se com colaboradores via tabela de junção (fora do escopo desta spec).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O administrador de TI consegue cadastrar um novo colaborador, máquina ou software em menos de 2 minutos, sem precisar acessar o Django Admin ou banco de dados.
- **SC-002**: 100% das operações de CRUD (criar, ler, editar, excluir) para as 3 entidades principais são realizáveis exclusivamente pela interface web.
- **SC-003**: Toda operação de exclusão exige confirmação explícita do usuário antes de ser executada.
- **SC-004**: Erros de validação (client-side e server-side) são exibidos ao usuário de forma compreensível em 100% dos casos.
- **SC-005**: Após qualquer operação de escrita (criar, editar, excluir), a listagem reflete a mudança em menos de 2 segundos, sem necessidade de recarregar a página.
- **SC-006**: O administrador consegue localizar um registro específico por nome ou identificador em menos de 10 segundos usando a busca textual.
- **SC-007**: Eliminar 100% da necessidade de inserção, edição ou exclusão manual de dados de colaboradores, máquinas e software via Django Admin ou acesso direto ao banco de dados.

## Assumptions

- O backend já implementa todos os endpoints CRUD necessários (spec 002) — esta spec não requer mudanças no backend.
- A exclusão é transparentemente soft delete no backend — o frontend apenas chama DELETE e o backend trata o soft delete internamente.
- Não há controle de acesso por perfil (RBAC) — qualquer usuário autenticado tem acesso completo ao CRUD. Se RBAC for necessário no futuro, será uma spec separada.
- As entidades dependentes (Email, Cellphone, Wifi, etc.) serão gerenciadas em spec futura — esta spec cobre apenas as 3 entidades principais.
- As relações N:N (CollaboratorSoftware, CollaboratorMachine) estão fora do escopo — serão tratadas junto com as entidades dependentes.
- Formulários de Collaborator e Software usam Dialog (modal). Formulário de Machine usa Sheet (painel lateral) devido à quantidade de campos (15+). Migração futura de Machine para página dedicada pode ser considerada em spec separada.

## Scope Boundary — O que NÃO está nesta spec

- Formulários para entidades dependentes (Email, Cellphone, Wifi, AntiVirus, Server, ServerAccess, ServerErpAccess, DataDestroyed, PenDrive)
- Gestão de relações N:N (associar software a colaborador, associar máquina a colaborador)
- Funcionalidades de relatórios (listagem, geração, exportação PDF/Excel) — spec futura
- Controle de acesso por perfil (RBAC) — spec futura
- Importação/exportação em massa de dados (CSV, Excel)
- Auditoria de alterações (log de quem alterou o quê)
- Testes E2E (Playwright)
- Alterações no backend Django
- Migração do formulário de Machine de Sheet para página dedicada com rota própria (avaliar em spec futura se a densidade de campos justificar)
