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
├── .env
├── docs/
│   ├── BACKEND.md             # Referência Django/DRF
│   ├── FRONTEND.md            # Referência React SPA
│   └── INFRA.md               # Docker e deploy
├── backend/
│   ├── config/                # Settings, URLs, WSGI
│   ├── accounts/              # Auth JWT
│   ├── core/                  # 14 modelos + Controllers/Services/Repositories
│   └── reports/               # relatórios + Controllers/Services/Repositories/Exporters
└── packages/
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

### Com Docker (recomendado)

```bash
docker-compose up --build
```

Acesse: `http://localhost:3000`

### Sem Docker

**Backend:**

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Frontend:**

```bash
cd packages/frontend
npm install
npm run dev
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
