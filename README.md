# Relatorio JRC Brasil

Sistema web de compliance de TI para a JRC Brasil — gera e gerencia relatorios de auditoria de seguranca da informacao exigidos anualmente pela matriz japonesa.

**Disciplina:** Laboratorio de Desenvolvimento de Software
**Status:** Em desenvolvimento

## Problema

A JRC Brasil precisa enviar anualmente para a matriz no Japao uma serie de relatorios sobre seus ativos de TI: computadores, usuarios, licencas de software, acessos a servidores/ERP, antivirus, criptografia, celulares corporativos, entre outros. Hoje esse processo e manual e propenso a erros. Este sistema automatiza a geracao desses 19 relatorios a partir de um cadastro centralizado.

## Arquitetura

```
React SPA (:3000)  <-->  Django REST API (:8000)  <-->  PostgreSQL (:5432)
```

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 4.2 + Django REST Framework |
| Frontend | React 18 + React Router + Axios + Bootstrap 5 |
| Autenticacao | JWT (djangorestframework-simplejwt) |
| Banco de Dados | PostgreSQL |
| Deploy | Docker Compose (3 containers) |

## Estrutura do Projeto

```
relatorio_japao/
├── README.md
├── CLAUDE.md
├── ANALISE.md                 # Analise das versoes originais
├── PLANO_IMPLEMENTACAO.md     # Plano de 7 fases
├── docker-compose.yml
├── .env
├── docs/
│   ├── BACKEND.md             # Referencia Django/DRF
│   ├── FRONTEND.md            # Referencia React SPA
│   └── INFRA.md               # Docker e deploy
├── backend/
│   ├── config/                # Settings, URLs, WSGI
│   ├── accounts/              # Auth JWT
│   ├── core/                  # 14 modelos + Controllers/Services/Repositories
│   └── reports/               # 19 relatorios + Controllers/Services/Repositories/Exporters
└── frontend/
    └── src/
        ├── api/               # Cliente Axios
        ├── auth/              # Contexto JWT
        ├── components/        # Componentes reutilizaveis
        └── pages/             # Paginas da aplicacao
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
cd frontend
npm install
npm start
```

## Dominio de Negocio

O sistema gerencia 3 entidades principais e 11 dependentes:

- **Collaborator** — funcionarios da JRC (nome, dominio, status, permissoes)
- **Machine** — computadores e notebooks (modelo, service tag, IP, MAC, criptografia)
- **Software** — licencas (nome, chave, tipo, uso)

A partir desses cadastros, sao gerados **19 relatorios de auditoria** cobrindo: contatos internos, computadores, usuarios de dominio, acesso a servidor/internet/ERP, licencas, criptografia, celulares, destruicao de dados, emails, pendrives, antivirus, atualizacoes de seguranca, WiFi e backup.

## Documentacao

| Documento | Descricao |
|-----------|-----------|
| [ANALISE.md](ANALISE.md) | Analise das 2 versoes originais (Node.js + Django) |
| [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md) | 7 fases de implementacao com checklists |
| [docs/BACKEND.md](docs/BACKEND.md) | Referencia completa do backend Django/DRF |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Referencia completa do frontend React |
| [docs/INFRA.md](docs/INFRA.md) | Docker, deploy e troubleshooting |

## Contexto

Este projeto parte de duas implementacoes parciais pre-existentes (uma em Node.js/Express e outra em Django com templates) que estao sendo unificadas em uma arquitetura moderna de API REST + SPA. A analise completa das versoes originais esta em [ANALISE.md](ANALISE.md).
