# Relatório JRC Brasil

Sistema web de compliance de TI para a JRC Brasil — gera e gerencia relatórios de auditoria de segurança da informação exigidos anualmente pela matriz japonesa.

**Disciplina:** Laboratório de Desenvolvimento de Software
**Status:** Em desenvolvimento

## Problema

A JRC Brasil precisa enviar anualmente para a matriz no Japão uma série de relatórios sobre seus ativos de TI: computadores, usuários, licenças de software, acessos a servidores/ERP, antivírus, criptografia, celulares corporativos, entre outros. Hoje esse processo é manual e propenso a erros. Este sistema automatiza a geração desses relatórios a partir de um cadastro centralizado.

## Arquitetura

```text
React SPA (:8080)  <-->  Django REST API (:8000)  <-->  PostgreSQL (:5432)
```

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 4.2 + Django REST Framework |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Autenticação | JWT (djangorestframework-simplejwt) |
| Banco de Dados | PostgreSQL |
| Deploy | Docker Compose (3 containers) |

## Estrutura do Projeto

```text
relatorio_japao/
├── README.md
├── CLAUDE.md
├── ANALISE.md                 # Analise das versões originais
├── PLANO_IMPLEMENTACAO.md     # Plano de 7 fases
├── docker-compose.yml
├── .env.example              # Variáveis de ambiente (copiar para .env)
├── docs/
│   ├── BACKEND.md             # Referência Django/DRF
│   ├── FRONTEND.md            # Referência React SPA
│   └── INFRA.md               # Docker e deploy
└── packages/
    ├── backend/
    │   ├── config/                # Settings, URLs, WSGI
    │   ├── accounts/              # Auth JWT
    │   ├── core/                  # 14 modelos + Controllers/Services/Repositories
    │   └── reports/               # relatórios + Controllers/Services/Repositories/Exporters
    └── frontend/
        └── src/
            ├── api/               # Cliente Axios + JWT
            ├── auth/              # AuthContext, ProtectedRoute
            ├── types/             # Interfaces TypeScript
            ├── hooks/             # React Query hooks
            ├── mocks/             # MSW (Mock Service Worker)
            ├── components/        # Componentes reutilizáveis
            └── pages/             # Páginas da aplicação
```

## Como Executar

### 1. Configurar variáveis de ambiente

Copie os arquivos de exemplo e ajuste se necessário:

```bash
cp .env.example .env
cp packages/frontend/.env.example packages/frontend/.env
```

> **Importante:** Nunca commite o `.env` real. Os `.example` já contêm valores padrão para desenvolvimento local.

### 2a. Com Docker (recomendado)

```bash
docker-compose up --build
```

O entrypoint do backend executa automaticamente:
1. Aguarda o PostgreSQL ficar pronto
2. Aplica migrações (`migrate`)
3. Carrega dados de teste (53 objetos: colaboradores, máquinas, software, 19 relatórios)
4. Cria superusuário de desenvolvimento (se não existir)

**Credenciais de desenvolvimento:**

| Credencial | Valor |
|------------|-------|
| Username | `admin` |
| Password | `admin123` |
| E-mail | `admin@jrc.com` |

> **Nota:** Essas credenciais são apenas para desenvolvimento local. Em produção (`DEBUG=False`), `SECRET_KEY` e `DB_PASSWORD` são obrigatórios via `.env` — o servidor não inicia sem eles.

**Acessos:**

| Serviço | URL | Login |
|---------|-----|-------|
| Frontend | `http://localhost:8080` | admin / admin123 |
| Backend API | `http://localhost:8000/api/` | Bearer token via login |
| Django Admin | `http://localhost:8000/admin/` | admin / admin123 |
| PostgreSQL | `localhost:5432` | DB: relatoriojapao |

### 2b. Sem Docker

**Backend:**

```bash
cd packages/backend
python -m venv venv && source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata fixtures/sample_data.json
python manage.py createsuperuser  # ou: python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@jrc.com', 'admin123')"
python manage.py runserver
```

> Sem Docker, ajuste `DB_HOST=localhost` no `.env` (em vez de `db`).

**Frontend:**

```bash
cd packages/frontend
npm install
npm run dev
```

Acesse: `http://localhost:8080` — Login: admin / admin123

### Conectar frontend ao backend real

Por padrão o frontend usa MSW (Mock Service Worker) para simular a API. Para usar o backend real:

```bash
# No arquivo packages/frontend/.env, altere:
VITE_API_URL=http://localhost:8000/api
VITE_ENABLE_MSW=false
```

## Domínio de Negócio

O sistema gerencia 3 entidades principais e 11 dependentes:

- **Collaborator** — funcionários da JRC (nome, domínio, status, permissões)
- **Machine** — computadores e notebooks (modelo, service tag, IP, MAC, criptografia)
- **Software** — licenças (nome, chave, tipo, uso)

A partir desses cadastros, são gerados **relatórios de auditoria** cobrindo: contatos internos, computadores, usuários de domínio, acesso a servidor/internet/ERP, licenças, criptografia, celulares, destruição de dados, emails, pendrives, antivírus, atualizações de segurança, WiFi e backup.

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [ANALISE.md](ANALISE.md) | Análise das 2 versões originais (Node.js + Django) |
| [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md) | 7 fases de implementação com checklists |
| [docs/BACKEND.md](docs/BACKEND.md) | Referência completa do backend Django/DRF |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Referência completa do frontend React |
| [docs/INFRA.md](docs/INFRA.md) | Docker, deploy e troubleshooting |
| [ROADMAP.md](ROADMAP.md) | Estado atual, fases do projeto e como usar |

## Contexto

Este projeto parte de duas implementações parciais pré-existentes (uma em Node.js/Express e outra em Django com templates) que estão sendo unificadas em uma arquitetura moderna de API REST + SPA. A análise completa das versões originais está em [ANALISE.md](ANALISE.md).
