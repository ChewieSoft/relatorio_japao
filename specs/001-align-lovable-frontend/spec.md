# Feature Specification: Alinhar Frontend Lovable com Arquitetura do Projeto

**Feature Branch**: `001-align-lovable-frontend`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "Alinhar o frontend gerado pelo Lovable com a arquitetura do projeto, atualizar docs/FRONTEND.md, e especificar a integração com o backend Django REST API que ainda não existe."

## Contexto

O Lovable gerou uma interface funcional em `packages/frontend/` com React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui. Porém, essa interface opera inteiramente com dados mock e possui divergências significativas em relação à arquitetura definida no projeto:

| Aspecto | Arquitetura Planejada | Frontend Lovable |
|---------|----------------------|-----------------|
| Diretório | `frontend/` | `packages/frontend/` |
| Linguagem | JavaScript (JSX) | TypeScript (TSX) |
| Build tool | CRA (react-scripts) | Vite |
| API client | Axios com interceptors JWT | Supabase client (não utilizado) |
| Dados | React Query + Django REST API | Mock data hardcoded |
| Autenticação | JWT (djangorestframework-simplejwt) | Demo mode (sem validação) |
| Rotas protegidas | ProtectedRoute com AuthContext | Todas públicas |
| Formulários | Não especificado | react-hook-form + zod (instalados, não usados) |

**O backend Django ainda não existe.** Esta spec cobre o alinhamento do frontend e a camada de integração com a API. A construção do backend será uma spec separada. Durante o desenvolvimento, MSW (Mock Service Worker) será usado para interceptar chamadas de rede no navegador, com handlers mockados baseados nos dados de exemplo já existentes no `mockData.ts` do Lovable. Isso permite desenvolver e testar toda a camada Axios + React Query sem depender de um servidor real.

## Clarifications

### Session 2026-03-15

- Q: Estratégia de desenvolvimento sem backend → A: MSW (Mock Service Worker) com dados mock derivados do mockData.ts do Lovable.
- Q: Escopo de formulários CRUD → A: Somente leitura (listagem paginada + relatórios). Formulários CRUD ficam para uma spec futura.
- Q: Atualização de CLAUDE.md e README → A: Atualizar CLAUDE.md, README.md e docs/FRONTEND.md — manter tudo sincronizado.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acessar o sistema com credenciais reais (Priority: P1)

Um colaborador da JRC Brasil acessa a URL do sistema, vê a tela de login, insere seu usuário e senha. O sistema autentica via JWT contra a API Django, armazena os tokens e redireciona ao dashboard. Todas as páginas subsequentes são protegidas — sem token válido, o usuário é redirecionado ao login.

**Why this priority**: Sem autenticação funcional, nenhuma outra funcionalidade pode operar de forma segura. É a base para todo o sistema.

**Independent Test**: Pode ser testado com um mock server que responde aos endpoints JWT (`/api/auth/login/`, `/api/auth/me/`, `/api/auth/refresh/`). O fluxo de login → dashboard → logout funciona end-to-end.

**Acceptance Scenarios**:

1. **Given** o usuário não está autenticado, **When** acessa qualquer rota protegida (`/dashboard`, `/collaborators`, etc.), **Then** é redirecionado para `/login`.
2. **Given** o formulário de login está visível, **When** o usuário insere credenciais válidas e submete, **Then** o sistema obtém tokens JWT, armazena em localStorage e redireciona para `/dashboard`.
3. **Given** o usuário está autenticado, **When** clica em "Sair" na sidebar, **Then** os tokens são removidos, o refresh token é invalidado na API e o usuário é redirecionado para `/login`.
4. **Given** o access token expirou, **When** o usuário faz uma requisição, **Then** o interceptor Axios renova o token automaticamente via refresh e re-executa a requisição original.

---

### User Story 2 - Visualizar dados reais de colaboradores, máquinas e software (Priority: P2)

O administrador de TI acessa as páginas de listagem (Colaboradores, Máquinas, Software) e vê dados reais vindos da API Django, com paginação server-side, busca e ordenação. Os dados mockados são substituídos por chamadas via React Query.

**Why this priority**: A visualização de dados é o valor central do sistema — sem dados reais, a interface é apenas um protótipo.

**Independent Test**: Pode ser testado apontando o frontend para a API Django com dados seed. As tabelas exibem dados da API com paginação funcional.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado, **When** acessa `/collaborators`, **Then** vê a tabela de colaboradores com dados vindos de `GET /api/collaborators/` com paginação de 20 itens.
2. **Given** a lista de máquinas está carregando, **When** a API ainda não respondeu, **Then** o usuário vê um indicador de carregamento (skeleton ou spinner).
3. **Given** a API retorna erro, **When** a requisição falha, **Then** o usuário vê uma mensagem de erro amigável com opção de tentar novamente.
4. **Given** o usuário está na lista de software, **When** navega para a página 2, **Then** o sistema busca `GET /api/software/?page=2` e atualiza a tabela sem recarregar a página.

---

### User Story 3 - Gerar e baixar relatórios de auditoria (Priority: P3)

O administrador acessa a página de relatórios, vê os 19 relatórios de auditoria com seus status (pendente, gerado, enviado), pode gerar um relatório e baixá-lo em PDF ou Excel.

**Why this priority**: Relatórios são o produto final do sistema, mas dependem dos cadastros (P2) para terem dados.

**Independent Test**: Pode ser testado com a API de relatórios ativa. O usuário seleciona um relatório, clica em gerar, e faz download do arquivo.

**Acceptance Scenarios**:

1. **Given** o usuário está na página de relatórios, **When** a página carrega, **Then** os 19 relatórios são listados com nome, nome em japonês, categoria e status atual, vindos de `GET /api/reports/`.
2. **Given** um relatório tem status "gerado", **When** o usuário clica em "PDF", **Then** o sistema faz download via `GET /api/reports/{numero}/?format=pdf` com `responseType: blob`.
3. **Given** um relatório tem status "pendente", **When** o usuário clica em "Gerar", **Then** o sistema envia `POST /api/reports/{numero}/generate/` e atualiza o status via invalidação de cache React Query.

---

### User Story 4 - Dashboard com indicadores reais (Priority: P4)

O administrador vê no dashboard os KPIs reais: total de colaboradores, máquinas, software e status dos relatórios, alimentados pela API.

**Why this priority**: Dashboard é a visão consolidada, mas depende de todas as outras integrações.

**Independent Test**: Pode ser testado com a API de dashboard/stats ativa. Os cards exibem números reais.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado, **When** acessa `/dashboard`, **Then** vê cards com contagem real de colaboradores ativos, máquinas, licenças e relatórios pendentes.
2. **Given** os dados do dashboard estão em cache, **When** o usuário navega para outra página e volta, **Then** os dados são exibidos do cache (staleTime de 5 minutos) sem nova requisição.

---

### Edge Cases

- O que acontece quando o backend está offline? O frontend deve exibir mensagem de erro de conectividade, não uma tela em branco.
- O que acontece quando o token expira durante uma operação de download de relatório? O interceptor deve renovar o token e re-tentar o download.
- O que acontece quando o usuário abre o sistema em duas abas e faz logout em uma? A outra aba deve redirecionar ao login na próxima requisição que receber 401.
- O que acontece quando a API retorna paginação com 0 resultados? A tabela deve exibir mensagem "Nenhum registro encontrado" em vez de tabela vazia.

## Requirements *(mandatory)*

### Functional Requirements

#### Integração API (Axios + JWT)

- **FR-001**: O sistema DEVE substituir o Supabase client por um Axios client configurado com base URL apontando para a API Django (`/api/`).
- **FR-002**: O Axios client DEVE incluir interceptor de request que adiciona `Authorization: Bearer <token>` em todas as requisições autenticadas.
- **FR-003**: O Axios client DEVE incluir interceptor de response que renova automaticamente o access token via refresh endpoint quando receber HTTP 401, e re-executar a requisição original.
- **FR-004**: Em caso de falha no refresh, o sistema DEVE limpar os tokens e redirecionar o usuário para `/login`.

#### Autenticação

- **FR-005**: O sistema DEVE implementar um AuthContext que gerencie estado de autenticação (user, loading) e exponha funções `login()` e `logout()`.
- **FR-006**: O sistema DEVE implementar um componente ProtectedRoute que redireciona para `/login` se o usuário não está autenticado.
- **FR-007**: A tela de Login DEVE validar credenciais contra `POST /api/auth/login/` e armazenar access e refresh tokens em localStorage.
- **FR-008**: O logout DEVE invalidar o refresh token via `POST /api/auth/logout/` e limpar o localStorage.

#### Data Fetching (React Query)

- **FR-009**: Todas as operações de leitura (GET) DEVEM usar `useQuery` do React Query com query keys padronizadas por domínio.
- **FR-010**: Operações de escrita (login, logout, geração de relatório) DEVEM usar `useMutation` com invalidação automática das queries relacionadas. Formulários CRUD de entidades (criar, editar, excluir) estão fora do escopo desta spec.
- **FR-011**: O sistema DEVE substituir importações diretas de `mockData.ts` por hooks de React Query que chamam a API via Axios. Os dados de `mockData.ts` serão reaproveitados como fixtures dos handlers MSW para desenvolvimento sem backend.
- **FR-012**: O QueryClient global DEVE ter configuração de `staleTime` (5 min), `gcTime` (10 min), `retry: 1` e `refetchOnWindowFocus: false`.

#### Mock Service Worker (Desenvolvimento)

- **FR-020**: O sistema DEVE configurar MSW com handlers que simulam todos os endpoints da API Django (auth, CRUD de entidades, relatórios), usando como dados base os exemplos do `mockData.ts` do Lovable.
- **FR-021**: O MSW DEVE ser ativado apenas em ambiente de desenvolvimento, sem impacto no build de produção.

#### Páginas e Rotas

- **FR-013**: O sistema DEVE proteger as rotas `/dashboard`, `/collaborators`, `/machines`, `/software` e `/reports` com ProtectedRoute. A rota `/` (Login) permanece pública. Usuários não autenticados que acessem rotas protegidas são redirecionados para `/login`.
- **FR-014**: As tabelas de listagem DEVEM suportar paginação server-side, exibindo controles de navegação entre páginas.
- **FR-015**: As tabelas DEVEM exibir estados de carregamento (skeleton/spinner) e estados de erro com opção de retry.

#### Download de Relatórios

- **FR-016**: O sistema DEVE suportar download de relatórios nos formatos PDF e Excel via requisição com `responseType: blob`.
- **FR-017**: O arquivo baixado DEVE ter nome descritivo no formato `relatorio_{numero}.{formato}`.

#### Documentação

- **FR-018**: Os arquivos `docs/FRONTEND.md`, `CLAUDE.md` e `README.md` DEVEM ser atualizados para refletir a stack real (Vite, TypeScript, react-hook-form, zod, diretório `packages/frontend/`, novos componentes).
- **FR-019**: A documentação DEVE incluir a estrutura de diretórios atualizada, lista de dependências, rotas, e padrões de integração com a API. Referências a `frontend/`, CRA e JavaScript devem ser corrigidas em todos os documentos.

### Key Entities

- **Collaborator**: Funcionário da JRC com nome, domínio Windows, departamento, status (ativo/inativo), flags de acesso (servidor, ERP, internet), email, celular.
- **Machine**: Computador ou notebook com hostname, modelo, service tag, IP, MAC, SO, flags de criptografia e antivírus, tipo (desktop/notebook), colaborador associado.
- **Software**: Licença de software com nome, chave, tipo (perpétua/assinatura/OEM), quantidade total, em uso, data de expiração.
- **Report**: Relatório de auditoria com número, nome (PT-BR e JP), categoria, data da última geração, status (pendente/gerado/enviado).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das páginas exibem dados vindos da API (zero dependência de dados mock).
- **SC-002**: O fluxo completo de login → navegação → logout funciona end-to-end sem intervenção manual.
- **SC-003**: O usuário consegue navegar entre páginas de listagem paginadas sem recarregar o navegador, com dados atualizados em menos de 2 segundos por página.
- **SC-004**: O download de relatórios em PDF/Excel é concluído com sucesso e gera arquivo válido.
- **SC-005**: O documento `docs/FRONTEND.md` reflete com precisão 100% da stack, estrutura e padrões atuais do frontend.
- **SC-006**: Todas as rotas protegidas redirecionam corretamente para login quando o usuário não está autenticado.

## Assumptions

- O backend Django REST API será construído em uma spec separada (Spec 002) com os endpoints necessários para esta integração.
- O diretório `packages/frontend/` será mantido (não será movido para `frontend/`) dado que já está funcional e a mudança de diretório é ortogonal à integração.
- TypeScript será mantido como linguagem do frontend (upgrade em relação ao JavaScript originalmente planejado), já que traz benefícios de type safety.
- Vite será mantido como build tool (upgrade em relação ao CRA originalmente planejado), já que é mais rápido e moderno.
- react-hook-form + zod serão adotados para validação de formulários (já instalados pelo Lovable).
- A integração com Supabase será removida (o projeto usa Django REST API como backend, não Supabase).

## Sugestão de Segunda Spec

**Spec 002 - Backend Django REST API**: Construção completa do backend incluindo:
- Setup do projeto Django com config/, accounts/, core/, reports/
- 14 modelos com BaseModel (soft delete)
- Repositories, Services e Controllers para cada entidade
- Serializers com validação
- Endpoints de autenticação JWT
- Endpoints CRUD para todas as entidades
- Endpoints de geração e exportação de relatórios (PDF/Excel)
- Docker Compose com PostgreSQL
- Fixtures com dados de exemplo
