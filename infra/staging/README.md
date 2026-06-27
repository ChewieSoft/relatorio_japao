# Staging — djr.jrcbrasil.net

Ambiente de staging do Relatorio JRC, hospedado no host **kratos (192.168.0.6)**,
atras do **nginx-proxy + acme-companion** compartilhado (TLS Let's Encrypt automatico).

| Servico | URL / container | Imagem |
|---------|-----------------|--------|
| Frontend (SPA) | `https://djr.jrcbrasil.net` / `jrc-staging-djr-frontend` | `ghcr.io/chewiesoft/relatorio-japao-frontend` |
| Backend (API) | `https://api.djr.jrcbrasil.net` / `jrc-staging-djr-backend` | `ghcr.io/chewiesoft/relatorio-japao-backend` |
| Banco | interno `postgres-djr:5432` / `jrc-staging-djr-postgres` | `postgres:16-alpine` |
| Runner CI/CD | `jrc-staging-djr-runner` (label `staging`) | `myoung34/github-runner` (custom) |

## Pipeline

- **CI** (`.github/workflows/ci.yml`): PR para `staging`/`main` e push para `main` — lint, build e testes (backend pytest + frontend vitest).
- **CD** (`.github/workflows/cd-staging.yml`): push para `staging` — gate (CI) -> build/push GHCR -> deploy no runner self-hosted (migracao one-off, smoke, rollback).

## Pre-requisitos (uma vez)

1. **DNS**: `djr.jrcbrasil.net` e `api.djr.jrcbrasil.net` -> `177.124.232.146` (A records).
2. **PAT** (web UI; `gh` nao cunha PAT): escopo `repo` (ou fine-grained 1-repo com `Administration:R/W` + `Actions`) para `ChewieSoft/relatorio_japao`.
3. **GitHub** (repo): secrets `POSTGRES_DJR_PASSWORD`, `DJANGO_SECRET_KEY`; variables `NGINX_PROXY_NETWORK=nginx-proxy_default`, `VITE_API_URL=https://api.djr.jrcbrasil.net/api`.

## Bring-up do runner (uma vez, no host)

```bash
# no host kratos
git clone https://github.com/ChewieSoft/relatorio_japao /opt/jrc/relatorio_japao
cd /opt/jrc/relatorio_japao && git checkout staging
cd infra/staging

# .env PERSISTENTE do host (chmod 600) — vive so aqui, nunca no git nem em GH secret
cat > .env <<'EOF'
IMAGE_TAG=latest
NGINX_PROXY_NETWORK=nginx-proxy_default
POSTGRES_DJR_PASSWORD=<senha-do-banco>
DJANGO_SECRET_KEY=<secret-key-django>
RUNNER_ACCESS_TOKEN=<PAT>
EOF
chmod 600 .env

docker compose up -d --build runner     # registra o runner (label staging)
gh api repos/ChewieSoft/relatorio_japao/actions/runners --jq '.runners[]|{name,status,labels:[.labels[].name]}'
```

> O `RUNNER_ACCESS_TOKEN` (PAT) e duravel: a imagem `myoung34` gera um registration
> token fresco a cada start (cicd §7 — sem o crashloop de token estatico de 1h).

## Operacao

```bash
cd /opt/jrc/relatorio_japao/infra/staging

# Seed inicial (rodar UMA vez apos o 1o deploy): admin + fixtures
docker compose --env-file .env run --rm -e VIRTUAL_HOST= -e LETSENCRYPT_HOST= backend \
  sh -c "python manage.py loaddata fixtures/sample_data.json --ignorenonexistent; \
         python manage.py createsuperuser --noinput --username admin --email it@jrcbrasil.com || true"
# (defina DJANGO_SUPERUSER_PASSWORD no ambiente do comando para a senha do admin)

# Logs / estado
docker compose --env-file .env ps
docker logs --tail 50 jrc-staging-djr-backend

# Rollback manual para uma tag anterior
export IMAGE_TAG=sha-<sha7-anterior>
docker compose --env-file .env pull backend frontend && docker compose --env-file .env up -d backend frontend
```

## Migracao futura para JRC-Brasil (privado)

Re-registrar o runner (novo `REPO_URL` + novo PAT), repontar o owner do GHCR e os nomes
de imagem (sao derivados de `github.repository_owner` no CD). Registros de runner **nao**
transferem com o repo.
