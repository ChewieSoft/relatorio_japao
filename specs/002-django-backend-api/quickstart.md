# Quickstart: Backend Django REST API

**Feature**: 002-django-backend-api | **Date**: 2026-03-29

## Pré-requisitos

- Docker e Docker Compose instalados
- Git
- `.env` configurado (copiar de `.env.example`)

## Setup rápido

```bash
# 1. Copiar variáveis de ambiente
cp .env.example .env

# 2. Subir todos os serviços (db + backend + frontend)
docker-compose up --build
```

O entrypoint do backend executa automaticamente:
1. Aguarda PostgreSQL (pg_isready com `-d ${POSTGRES_DB}`)
2. Aplica migrações (`migrate --noinput`)
3. Carrega fixtures (53 objetos: colaboradores, máquinas, software, 19 relatórios)
4. Cria superusuário dev se não existir

**Credenciais de desenvolvimento**: `admin` / `admin123`

> **Windows**: `entrypoint.sh` DEVE ter line endings LF (não CRLF). O arquivo `backend/.gitattributes` garante isso via `*.sh eol=lf`. Se o container falhar com "no such file or directory", execute: `sed -i 's/\r$//' backend/entrypoint.sh`

## Acessos

| Serviço | URL | Notas |
|---------|-----|-------|
| Frontend React | http://localhost:8080 | Login: admin / admin123 |
| Backend Django API | http://localhost:8000/api/ | DRF Browsable API |
| Django Admin | http://localhost:8000/admin/ | admin / admin123 |
| PostgreSQL | localhost:5432 | DB: relatoriojapao, User: admin |

## Testar autenticação

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Usar o access token retornado
curl http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer <access_token>"

# Listar colaboradores
curl http://localhost:8000/api/collaborators/ \
  -H "Authorization: Bearer <access_token>"
```

## Conectar frontend ao backend real

Para desabilitar MSW e usar o backend real, remover ou comentar o bootstrap do MSW em `packages/frontend/src/main.tsx`. O frontend já está configurado para apontar para `VITE_API_URL=http://localhost:8000/api`.

## Rodar testes

```bash
# Testes backend
docker-compose exec backend pytest

# Ou localmente (com venv)
cd backend
pip install -r requirements.txt
pytest
```

## Estrutura de comandos úteis

```bash
# Ver logs do backend
docker-compose logs -f backend

# Abrir shell Django
docker-compose exec backend python manage.py shell

# Criar migrações após mudar models
docker-compose exec backend python manage.py makemigrations

# Aplicar migrações
docker-compose exec backend python manage.py migrate

# Reset do banco (cuidado!)
docker-compose down -v  # Remove volumes
docker-compose up --build
```
