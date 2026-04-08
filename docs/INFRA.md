# Infraestrutura - Docker, Deploy, Troubleshooting

> Referencia para Docker, deploy e problemas comuns. Para visao geral, ver [../CLAUDE.md](../CLAUDE.md).

## Containers

| Container | Imagem | Porta | Descricao |
|-----------|--------|-------|-----------|
| `db` | postgres:13.5 | 5432 | Banco de dados PostgreSQL |
| `backend` | Python 3.11 + Django | 8000 | API REST |
| `frontend` | Node 18 (dev) / nginx (prod) | 8080 (dev) / 80 (prod) | React SPA |

## Variaveis de Ambiente (.env)

Template completo para a raiz do projeto:

```env
# Django
SECRET_KEY=sua-secret-key-aqui-mude-em-producao
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Database
DB_NAME=relatoriojapao
DB_USER=admin
DB_PASSWORD=admin
DB_HOST=db
DB_PORT=5432

# PostgreSQL container
POSTGRES_DB=relatoriojapao
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:8080

# JWT
ACCESS_TOKEN_LIFETIME_MINUTES=30
REFRESH_TOKEN_LIFETIME_DAYS=1

# Frontend
VITE_API_URL=http://localhost:8000/api
```

> **IMPORTANTE:** Nunca commite o `.env` real. Mantenha um `.env.example` no repositorio.

## docker-compose.yml (desenvolvimento)

```yaml
version: '3.8'

services:
  db:
    image: postgres:13.5
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./packages/backend
    command: python manage.py runserver 0.0.0.0:8000
    ports:
      - "8000:8000"
    volumes:
      - ./packages/backend:/app
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - .env

  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    volumes:
      - ./packages/frontend/src:/app/src
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:8000/api

volumes:
  postgres_data:
```

## docker-compose.prod.yml (producao)

```yaml
version: '3.8'

services:
  db:
    image: postgres:13.5
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
    depends_on:
      - db
    env_file:
      - .env
    environment:
      - DEBUG=False
    restart: always

  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
```

## Dockerfiles

### Backend (packages/backend/Dockerfile)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### Frontend - Dev (packages/frontend/Dockerfile)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]
```

### Frontend - Prod (packages/frontend/Dockerfile.prod)

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## nginx.conf (packages/frontend/nginx.conf)

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback - todas as rotas redirecionam para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy reverso para API Django
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy para Django Admin
    location /admin/ {
        proxy_pass http://backend:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Arquivos estaticos do Django (admin)
    location /static/ {
        proxy_pass http://backend:8000/static/;
    }

    # Cache de assets estaticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Comandos Docker Uteis

```bash
# Subir todos os servicos
docker-compose up --build

# Subir em background
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Parar tudo
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados do banco)
docker-compose down -v

# Rebuild de um servico especifico
docker-compose build backend
docker-compose up -d backend

# Executar comando no container backend
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py shell

# Producao
docker-compose -f docker-compose.prod.yml up --build -d
```

## Comandos de Banco

```bash
# Migracoes
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py showmigrations

# Fixtures (dados de teste)
docker-compose exec backend python manage.py loaddata fixtures/sample_data.json
docker-compose exec backend python manage.py dumpdata core --indent 2 > packages/backend/fixtures/sample_data.json

# Shell Django
docker-compose exec backend python manage.py shell

# Acesso direto ao PostgreSQL
docker-compose exec db psql -U admin -d relatoriojapao

# Reset do banco (CUIDADO)
docker-compose exec backend python manage.py flush --noinput
```

## Troubleshooting

### Conexao com banco de dados

**Erro:** `django.db.utils.OperationalError: could not connect to server`

**Causas e solucoes:**
1. Container `db` nao iniciou - verificar `docker-compose logs db`
2. `DB_HOST` errado - dentro do Docker deve ser `db` (nome do servico), fora deve ser `localhost`
3. Banco nao esta pronto - o `healthcheck` do docker-compose deve resolver, mas se persistir, aguardar alguns segundos apos `docker-compose up`

### CORS

**Erro:** `Access to XMLHttpRequest blocked by CORS policy`

**Checklist:**
1. `django-cors-headers` esta em `INSTALLED_APPS`?
2. `CorsMiddleware` esta no `MIDDLEWARE` **antes** de `CommonMiddleware`?
3. `CORS_ALLOWED_ORIGINS` inclui `http://localhost:8080`?
4. Frontend esta usando a URL correta da API (sem barra dupla `//api`)?

### Migracoes

**Erro:** `django.db.utils.ProgrammingError: relation "core_collaborator" does not exist`

**Solucao:**
```bash
docker-compose exec backend python manage.py makemigrations core
docker-compose exec backend python manage.py migrate
```

**Migracoes conflitantes:**
```bash
docker-compose exec backend python manage.py makemigrations --merge
docker-compose exec backend python manage.py migrate
```

### JWT / Autenticacao

**Erro:** `401 Unauthorized` em todas as requisicoes

**Checklist:**
1. Token esta sendo enviado no header `Authorization: Bearer <token>`?
2. Token nao expirou? (access = 30 min)
3. `DEFAULT_AUTHENTICATION_CLASSES` em settings.py inclui `JWTAuthentication`?
4. Axios interceptor esta configurado corretamente?

### Frontend nao carrega

**Erro:** Pagina em branco ou erro 404

**Checklist (producao com nginx):**
1. `nginx.conf` tem `try_files $uri $uri/ /index.html`?
2. Build do React foi copiado para `/usr/share/nginx/html`?
3. `VITE_API_URL` foi definido antes do `npm run build`?

### Porta em uso

**Erro:** `Bind for 0.0.0.0:8000 failed: port is already allocated`

```bash
# Identificar processo usando a porta
lsof -i :8000
# ou no Windows
netstat -ano | findstr :8000

# Parar containers antigos
docker-compose down
```
