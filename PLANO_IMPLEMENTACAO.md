# Plano de Implementação - Relatório JRC Brasil

## Arquitetura Proposta

**Monorepo: Django REST Framework + React SPA**

```text
Cliente (React SPA)  <-->  API REST (Django + DRF)  <-->  PostgreSQL
     :3000                      :8000                       :5432
```

- **Backend:** Django 4.2 + Django REST Framework + PostgreSQL
- **Frontend:** React 18 + React Router + Axios + Tailwind CSS + shadcn/ui + React Query
- **Auth:** JWT via djangorestframework-simplejwt
- **Deploy:** Docker Compose (3 containers)

---

## Estrutura de Diretórios do Produto Final

```text
relatorio_japao/
├── docs/                           (documentação do projeto)
│   ├── ANALISE.md
│   └── PLANO_IMPLEMENTACAO.md
├── docker-compose.yml              (orquestração dos 3 serviços)
├── .env                            (variáveis de ambiente)
├── .gitignore
├── README.md
│
├── backend/                        (Django REST API)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/                     (projeto Django - settings, urls, wsgi)
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── accounts/                   (app: autenticação JWT)
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── controllers.py         (HTTP layer)
│   │   ├── services.py            (lógica de auth)
│   │   ├── urls.py
│   │   └── tests.py
│   ├── core/                       (app: modelos de negócio + CRUDs)
│   │   ├── models.py              (14 modelos + BaseModel)
│   │   ├── serializers.py
│   │   ├── controllers.py         (HTTP layer - substitui views.py)
│   │   ├── services.py            (lógica de negócio)
│   │   ├── repositories.py        (acesso a dados ORM)
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── filters.py
│   │   └── tests/
│   │       ├── test_controllers.py
│   │       ├── test_services.py
│   │       └── test_repositories.py
│   ├── reports/                    (app: 19 relatórios de compliance)
│   │   ├── serializers.py
│   │   ├── controllers.py         (HTTP layer + format negotiation)
│   │   ├── services.py            (gera dados, delega export)
│   │   ├── repositories.py        (queries específicas por relatório)
│   │   ├── urls.py
│   │   ├── exporters.py           (geração PDF/Excel)
│   │   └── tests/
│   └── fixtures/                   (dados de teste)
│       └── sample_data.json
│
├── frontend/                       (React SPA)
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── api/                   (configuração Axios)
│   │   │   └── client.js
│   │   ├── auth/                  (contexto de autenticação)
│   │   │   ├── AuthContext.js
│   │   │   └── ProtectedRoute.js
│   │   ├── components/            (componentes reutilizáveis)
│   │   │   ├── Navbar.js
│   │   │   ├── Card.js
│   │   │   ├── SearchBar.js
│   │   │   └── DataTable.js
│   │   ├── pages/                 (páginas da aplicação)
│   │   │   ├── Login.js
│   │   │   ├── Home.js
│   │   │   ├── Cadastro.js
│   │   │   ├── Relatorios.js
│   │   │   └── ReportView.js
│   │   └── routes/
│   │       └── Routes.js
│   └── nginx.conf                 (servir build em produção)
│
└── avaliacaoA2/                    (código original - referência)
└── relatorio-jrc-main/             (código original - referência)
```

---

## Fases de Implementação

### Fase 1: Setup do Projeto e Dependências

**Objetivo:** Criar a estrutura base do monorepo com Django e React configurados.

**Backend - Dependências (requirements.txt):**

```text
Django==4.2.7
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.1
django-filter==23.3
psycopg2-binary==2.9.9
python-decouple==3.8
gunicorn==21.2.0
reportlab==4.0.8
openpyxl==3.1.2
```

**Frontend - Dependências (package.json):**

```text
react: ^18.3.0
react-dom: ^18.3.0
react-router-dom: ^6.11.1
axios: ^1.6.0
@tanstack/react-query: ^5.28.0
@tanstack/react-query-devtools: ^5.28.0
tailwindcss: ^3.4.13
autoprefixer: ^10.4.20
postcss: ^8.4.47
@radix-ui/react-dialog: ^1.1.2
@radix-ui/react-dropdown-menu: ^2.1.2
@radix-ui/react-label: ^2.1.0
@radix-ui/react-select: ^2.1.2
@radix-ui/react-slot: ^1.1.0
@radix-ui/react-toast: ^1.2.2
class-variance-authority: ^0.7.0
clsx: ^2.1.1
tailwind-merge: ^2.5.3
lucide-react: ^0.441.0
```

**Docker Compose:**

```yaml
services:
  db:
    image: postgres:13.5
    environment:
      POSTGRES_DB: relatoriojapao
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    ports:
      - "8000:8000"
    depends_on:
      - db
    env_file:
      - .env

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

**Tarefas:**

- [ ] Criar estrutura de pastas conforme diagrama acima
- [ ] Inicializar projeto Django (`django-admin startproject config .`)
- [ ] Criar apps: `accounts`, `core`, `reports`
- [ ] Inicializar React app (`npx create-react-app frontend`)
- [ ] Configurar `settings.py` (database PostgreSQL, CORS, REST Framework)
- [ ] Configurar Docker Compose
- [ ] Testar `docker-compose up` (todos os serviços sobem)

**Entregável:** Projeto base rodando com página inicial "Hello World" em ambos frontend e backend.

---

### Fase 2: Modelos Django (14 Modelos)

**Objetivo:** Converter todos os 14 modelos do Prisma para Django ORM.

**Tabela completa de modelos a implementar:**

| # | Modelo | Campos | Tipo | FK/Relação |
|---|--------|--------|------|------------|
| 1 | **Collaborator** | full_name (CharField unique), domain_user (CharField unique), status (Bool), perm_acess_internet (Bool), date_hired (DateTimeField), fired (Bool), date_fired (DateTimeField null), acess_wifi (Bool), admin_privilege (Bool), office (CharField) | Principal | - |
| 2 | **Machine** | model (CharField), type (CharField), service_tag (CharField unique), operacional_system (CharField), ram_memory (CharField), disk_memory (CharField), ip (CharField unique), mac_address (CharField unique), administrator (CharField), cod_jdb (CharField), date_purchase (DateTimeField), quantity (IntField), crypto_disk (Bool), crypto_usb (Bool), crypto_memory_card (Bool), sold_out (Bool), date_sold_out (DateTimeField null) | Principal | - |
| 3 | **Software** | software_name (CharField null), key (CharField), quantity (IntField), type_licence (CharField), quantity_purchase (IntField), last_purchase_date (DateTimeField), on_use (IntField), departament (CharField), observation (TextField) | Principal | - |
| 4 | **Email** | email (CharField), remark (CharField), email_creation (DateTimeField), until (DateTimeField null) | Dependente | FK -> Collaborator |
| 5 | **Cellphone** | model (CharField), operacional_system (CharField), phone_number (CharField), status (Bool), approved (Bool), have_password (Bool), first_sinc (CharField), device_id (CharField) | Dependente | FK -> Collaborator |
| 6 | **Wifi** | wifi_name (CharField), protection (CharField), january..december (BoolField x12), year (IntField) | Dependente | FK -> Collaborator |
| 7 | **AntiVirus** | january_updated..december_updated (Bool x12), january_check..december_check (Bool x12), year (IntField) | Dependente | FK -> Machine |
| 8 | **Server** | have_backup (Bool), backup_date (DateTimeField null) | Dependente | FK -> Machine |
| 9 | **ServerAccess** | level01..level06 (Bool x6) | Dependente | FK -> Collaborator |
| 10 | **ServerErpAccess** | purchase (Bool), sale (Bool), production_control (Bool), service (Bool) | Dependente | FK -> Collaborator |
| 11 | **DataDestroyed** | when_data_is_destroyed (DateTimeField), i_can_destroy_data (Bool) | Dependente | FK -> Machine |
| 12 | **PenDrive** | checked_date (DateTimeField), have_virus (Bool) | Dependente | FK -> Collaborator |
| 13 | **CollaboratorSoftware** | - | Junção N:N | FK -> Collaborator, FK -> Software |
| 14 | **CollaboratorMachine** | - | Junção N:N | FK -> Collaborator, FK -> Machine |

> **Modelo base (abstrato):** Todos os modelos herdam campos `created_at`, `updated_at`, `deleted_at` (soft delete).

**Tarefas:**

- [ ] Criar classe abstrata `BaseModel` com campos de auditoria
- [ ] Criar `BaseRepository` com métodos get_all, get_by_id, create, update, soft_delete
- [ ] Implementar os 3 modelos principais (Collaborator, Machine, Software)
- [ ] Implementar os 9 modelos dependentes (Email, Cellphone, Wifi, etc.)
- [ ] Implementar as 2 tabelas de junção (CollaboratorSoftware, CollaboratorMachine)
- [ ] Criar e aplicar migrações (`makemigrations` + `migrate`)
- [ ] Registrar todos os modelos no Django Admin
- [ ] Criar fixtures com dados de teste (pelo menos 5 registros por modelo)
- [ ] Validar relacionamentos no shell do Django

**Entregável:** Banco de dados populado, Admin Panel funcional com CRUD de todos os modelos.

---

### Fase 3: Autenticação JWT

**Objetivo:** Implementar autenticação baseada em token JWT para a SPA React.

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login/` | Gera access + refresh token |
| POST | `/api/auth/refresh/` | Renova access token |
| POST | `/api/auth/register/` | Cria novo usuário |
| GET | `/api/auth/me/` | Retorna dados do usuário logado |
| POST | `/api/auth/logout/` | Invalida refresh token |

**Configuração DRF (settings.py):**

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
}
```

**Frontend - AuthContext:**

- Armazenar tokens no localStorage
- Interceptor Axios para incluir token em todas as requisições
- Redirect automático para login quando token expira
- Componente `ProtectedRoute` para rotas autenticadas

**Tarefas:**

- [ ] Instalar e configurar `djangorestframework-simplejwt`
- [ ] Criar controllers e services de auth no app `accounts`
- [ ] Criar serializer de registro de usuário
- [ ] Implementar `AuthContext` no React
- [ ] Implementar interceptor Axios (adicionar Bearer token)
- [ ] Criar página de Login no React
- [ ] Criar componente `ProtectedRoute`
- [ ] Testar fluxo completo: registro -> login -> acesso -> refresh -> logout

**Entregável:** Usuário pode registrar, logar, e acessar rotas protegidas.

---

### Fase 4: API REST (Endpoints CRUD)

**Objetivo:** Criar endpoints CRUD completos para todos os modelos usando arquitetura em camadas (Controller → Service → Repository).

**Endpoints por recurso:**

| Recurso | List | Create | Retrieve | Update | Delete |
|---------|------|--------|----------|--------|--------|
| `/api/collaborators/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/machines/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/software/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/emails/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/cellphones/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/wifi/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/antivirus/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/servers/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/server-access/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/erp-access/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/data-destroyed/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |
| `/api/pen-drives/` | GET | POST | GET /:id | PUT /:id | DELETE /:id |

**Funcionalidades da API:**

- Paginação (PageNumberPagination, 20 itens por página)
- Filtros (django-filter para busca por campos)
- Ordenação (OrderingFilter)
- Busca textual (SearchFilter)
- Soft delete (marcar `deleted_at` ao invés de remover)
- Nested serializers (Collaborator retorna emails, cellphones, etc.)

**Tarefas:**

- [ ] Criar serializers para todos os 14 modelos
- [ ] Criar Repositories para cada modelo (herdando de `BaseRepository`)
- [ ] Criar Services para cada modelo (herdando de `BaseService`)
- [ ] Criar Controllers com `ModelViewSet` (herdando de `BaseController`)
- [ ] Configurar Router para gerar URLs automaticamente
- [ ] Implementar filtros e busca por modelo
- [ ] Implementar soft delete no `BaseRepository`
- [ ] Implementar nested creation no `CollaboratorService` (Collaborator + Email + Cellphone em 1 request)
- [ ] Testar todos os endpoints via DRF Browsable API
- [ ] Documentar API (django-rest-framework gera docs automaticamente)

**Entregável:** API completa com CRUD de todos os modelos, testável via browser.

---

### Fase 5: 19 Relatórios de Compliance

**Objetivo:** Implementar os 19 relatórios como endpoints REST que retornam dados formatados.

**Endpoints:**

| Rota | Relatório | Query Principal |
|------|-----------|----------------|
| `GET /api/reports/08/` | Lista de Contatos | Collaborator + Email + Cellphone |
| `GET /api/reports/09/` | Lista de Computadores | Machine (todos os campos) |
| `GET /api/reports/13/` | Usuários de Domínio | Collaborator.domain_user + status |
| `GET /api/reports/15/` | Acesso Servidor Arquivos | ServerAccess + Collaborator |
| `GET /api/reports/17/` | Permissão Internet | Collaborator.perm_acess_internet |
| `GET /api/reports/19/` | Licenças Software | Software (licença, quantidade, uso) |
| `GET /api/reports/20/` | Notebooks Criptografia | Machine (crypto_disk/usb/memory_card) + notebooks |
| `GET /api/reports/21/` | Celulares Ativados | Cellphone + Collaborator (status=True) |
| `GET /api/reports/22/` | Destruição de Dados | DataDestroyed + Machine |
| `GET /api/reports/23/` | Acesso ERP | ServerErpAccess + Collaborator |
| `GET /api/reports/24/` | Lista de E-mails | Email + Collaborator |
| `GET /api/reports/25/` | Vírus em Pendrives | PenDrive + Collaborator |
| `GET /api/reports/26/` | Padrão Antivirus | AntiVirus (updated mensais) + Machine |
| `GET /api/reports/28/` | Uso de Software | CollaboratorSoftware + Collaborator + Software |
| `GET /api/reports/29/` | Atualizações Segurança | AntiVirus (check mensais) + Machine |
| `GET /api/reports/31/` | Verificação Antivirus | AntiVirus + Machine (scan mensal) |
| `GET /api/reports/33/` | Acesso WiFi | Wifi + Collaborator |
| `GET /api/reports/34/` | Troca Senha WiFi | Wifi (protection, meses) |
| `GET /api/reports/35/` | Backup Servidores | Server + Machine (backup_date) |
| `GET /api/reports/37/` | Usuários Domínio | Collaborator.domain_user (detalhado) |

**Funcionalidades:**

- Filtro por ano (`?year=2024`)
- Filtro por mês (`?month=6`)
- Exportação JSON (padrão)
- Exportação PDF (via query param `?format=pdf`)
- Exportação Excel (via query param `?format=xlsx`)

**Tarefas:**

- [ ] Criar app `reports` com controllers, services e repositories para cada relatório
- [ ] Criar repositories com QuerySets otimizados (select_related, prefetch_related)
- [ ] Criar serializers específicos para cada relatório
- [ ] Implementar filtros por ano/mês nos repositories
- [ ] Criar `exporters.py` com template base para exportação PDF (usando ReportLab)
- [ ] Adaptar templates HTML japoneses da pasta `Tabelas/` para PDF
- [ ] Implementar exportação Excel em `exporters.py` (openpyxl)
- [ ] Testar cada relatório com dados de teste

**Entregável:** 19 endpoints de relatórios funcionais com exportação JSON/PDF/Excel.

---

### Fase 6: Integração Frontend React

**Objetivo:** Conectar o frontend React a API Django, implementando todas as telas.
Seguir tokens e padroes visuais definidos em [.interface-design/system.md](.interface-design/system.md).

**Páginas a implementar:**

| Página | Rota React | Funcionalidade |
|--------|-----------|----------------|
| Login | `/login` | Formulário de login -> JWT |
| Home/Dashboard | `/` | Cards com resumo e links para relatórios |
| Cadastro | `/cadastro` | Formulários para Collaborator, Machine, Software |
| Relatórios | `/relatórios` | Lista dos 19 relatórios com busca |
| Visualizar Relatório | `/relatórios/:id` | Tabela com dados do relatório selecionado |
| Editar | `/editar/:tipo/:id` | Formulário de edição de registros |

**Componentes reutilizáveis:**

- `Navbar` - Navegação com logo JRC, links, logout
- `Card` - Card de relatório com título, descrição, botão de download
- `SearchBar` - Campo de busca com filtros
- `DataTable` - Tabela genérica com paginação e ordenação
- `FormField` - Campo de formulário reutilizável
- `Alert` - Mensagens de sucesso/erro
- `Loading` - Spinner de carregamento
- `PDFButton` - Botão para download de PDF

**Integração API (Axios):**

```javascript
// api/client.js
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Interceptor para JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor para refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      // Tentar refresh token
    }
    return Promise.reject(error);
  }
);
```

**Tarefas:**

- [ ] Configurar Axios com interceptors (auth + refresh)
- [ ] Implementar página de Login
- [ ] Implementar Dashboard (Home) com cards de relatórios
- [ ] Implementar formulário de Cadastro (Collaborator, Machine, Software)
- [ ] Implementar lista de Relatórios com busca
- [ ] Implementar visualização de relatório individual (tabela)
- [ ] Implementar formulário de Edição
- [ ] Implementar botão de download PDF/Excel
- [ ] Implementar feedback visual (loading, erros, sucesso)
- [ ] Testar fluxo completo end-to-end

**Entregável:** SPA React funcional com todas as telas conectadas a API.

---

### Fase 7: Finalização (Docker, Testes, PDF, Admin)

**Objetivo:** Preparar o projeto para entrega final com testes, Docker e documentação.

**7.1 Docker (produção)**

```yaml
# docker-compose.prod.yml
services:
  db:
    image: postgres:13.5
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    environment:
      - DEBUG=False

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    # nginx serve o build React e faz proxy para /api
    ports:
      - "80:80"
```

**7.2 Testes**

| Tipo | Ferramenta | Escopo |
|------|-----------|--------|
| Unitários (backend) | pytest + pytest-django | Repositories, services, controllers |
| Integração (backend) | DRF APITestCase | Endpoints, auth, permissões |
| Unitários (frontend) | Jest + React Testing Library | Componentes, hooks |
| E2E | Cypress ou Playwright | Fluxos completos |

**7.3 Django Admin customizado**

- Registrar todos os 14 modelos com list_display, search_fields, list_filter
- Inline forms (Email, Cellphone dentro de Collaborator)
- Actions em massa (ativar/desativar colaboradores)

**7.4 Geração de PDF**

- Usar ReportLab para gerar PDFs dos 19 relatórios
- Layout baseado nos templates HTML japoneses existentes (`Tabelas/`)
- Cabeçalho com logo JRC Brasil
- Tabelas formatadas com dados do banco
- Rodapé com data de geração e número de página

**Tarefas:**

- [ ] Criar Dockerfile para backend (Python + gunicorn)
- [ ] Criar Dockerfile para frontend (Node build + nginx)
- [ ] Criar docker-compose.prod.yml
- [ ] Escrever testes unitários por camada (repositories, services)
- [ ] Escrever testes de integração para controllers
- [ ] Escrever testes para componentes React
- [ ] Customizar Django Admin para todos os modelos
- [ ] Implementar geração de PDF com ReportLab
- [ ] Criar README.md final com instruções de instalação e uso
- [ ] Testar deploy com `docker-compose up` em máquina limpa

**Entregável:** Projeto completo, testado, dockerizado e documentado.

---

## Arquivos de Referência Importantes

### Do projeto Node.js (avaliacaoA2)

| Arquivo | O que contém | Como usar |
|---------|-------------|-----------|
| `Back-end/prisma/schema.prisma` | Definição dos 14 modelos | Base para criar `core/models.py` |
| `Back-end/src/controller/views/ViewReports.ts` | 19 queries SQL dos relatórios | Base para QuerySets no app `reports` |
| `Back-end/src/controller/inserts/` | Lógica de criação de registros | Referência para serializers |
| `Back-end/src/routes/` | Estrutura de rotas | Referência para `urls.py` |
| `Back-end/DevOps/postgres/docker-compose.yml` | Config Docker PostgreSQL | Base para docker-compose final |
| `Front-end/relatoriojapao/src/Components/` | Componentes React | Reaproveitar/adaptar |
| `Front-end/relatoriojapao/src/Pages/` | Páginas React | Reaproveitar/adaptar |
| `Tabelas/*.html` | Templates HTML dos relatórios japoneses | Base para layout PDF |

### Do projeto Django (relatorio-jrc-main)

| Arquivo | O que contém | Como usar |
|---------|-------------|-----------|
| `controle/settings.py` | Configuração Django | Referência para `config/settings.py` |
| `accounts/views.py` | Lógica de auth | Referência para auth JWT |
| `accounts/forms.py` | Forms de usuário | Referência para serializers |
| `reports/models.py` | Modelo Reports | Exemplo de modelo Django |
| `reports/templates/` | Templates HTML | Referência de UX/layout |

---

## Verificação e Testes

### Checklist de validação por fase

**Fase 1 - Setup:**

- [ ] `docker-compose up` inicia os 3 serviços sem erro
- [ ] `http://localhost:8000/admin/` mostra Django Admin
- [ ] `http://localhost:3000` mostra app React

**Fase 2 - Modelos:**

- [ ] `python manage.py migrate` executa sem erro
- [ ] Todos os 14 modelos aparecem no Admin
- [ ] CRUD funciona no Admin para cada modelo
- [ ] Relacionamentos FK funcionam corretamente

**Fase 3 - Auth:**

- [ ] POST `/api/auth/login/` retorna access + refresh token
- [ ] GET `/api/auth/me/` retorna usuário com token válido
- [ ] Rotas protegidas retornam 401 sem token
- [ ] Refresh token renova access token

**Fase 4 - API:**

- [ ] Todos os 12 endpoints CRUD respondem corretamente
- [ ] Paginação funciona (20 itens por página)
- [ ] Filtros e busca funcionam
- [ ] Soft delete marca `deleted_at` sem remover registro

**Fase 5 - Relatórios:**

- [ ] Todos os 19 endpoints de relatório retornam dados corretos
- [ ] Filtro por ano funciona
- [ ] Download PDF gera arquivo válido
- [ ] Download Excel gera arquivo válido

**Fase 6 - Frontend:**

- [ ] Login funciona e redireciona para Dashboard
- [ ] Cadastro cria registros via API
- [ ] Lista de relatórios mostra todos os 19
- [ ] Visualização de relatório mostra tabela com dados
- [ ] Download de PDF funciona pelo botão

**Fase 7 - Finalização:**

- [ ] `docker-compose -f docker-compose.prod.yml up` funciona
- [ ] Testes passam: `pytest` (backend) e `npm test` (frontend)
- [ ] README.md contém instruções claras de instalação

---

## Cronograma Sugerido (por fase)

| Fase | Descrição | Dependência |
|------|-----------|-------------|
| 1 | Setup do Projeto | - |
| 2 | Modelos Django | Fase 1 |
| 3 | Autenticação JWT | Fase 1 |
| 4 | API REST CRUD | Fase 2 |
| 5 | 19 Relatórios | Fase 4 |
| 6 | Frontend React | Fase 3 + Fase 4 |
| 7 | Finalização | Fase 5 + Fase 6 |

> **Nota:** Fases 2 e 3 podem ser executadas em paralelo. Fase 6 depende de Fases 3 e 4.
