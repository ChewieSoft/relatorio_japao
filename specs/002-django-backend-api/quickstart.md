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

# 2. Subir todos os serviços
docker-compose up --build

# 3. Criar superusuário (em outro terminal)
docker-compose exec backend python manage.py createsuperuser

# 4. Carregar dados de teste
docker-compose exec backend python manage.py loaddata fixtures/sample_data.json
```

## Acessos

| Serviço | URL | Notas |
|---------|-----|-------|
| Frontend React | http://localhost:8080 | SPA com React Query |
| Backend Django API | http://localhost:8000/api/ | DRF Browsable API |
| Django Admin | http://localhost:8000/admin/ | Superusuário criado acima |
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
