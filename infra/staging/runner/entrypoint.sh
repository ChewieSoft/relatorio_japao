#!/usr/bin/env bash
# Entrypoint do runner self-hosted do Relatorio JRC (staging).
#
# Le as env vars exigidas pela imagem upstream (myoung34/github-runner) e forca
# os parametros canonicos de staging: labels fixas (staging,self-hosted,linux,
# x64) e modo ephemeral (re-registra a cada job — JIT runner). Apos validar,
# delega para o entrypoint upstream que faz o registro real via API e inicia
# o agente.
#
# Autenticacao: prefira ACCESS_TOKEN (PAT escopo `repo`) — a imagem upstream
# busca um registration token FRESCO a cada start, entao o JIT ephemeral
# re-registra sem o crashloop `404 runner-registration` do token estatico
# (cicd §7). RUNNER_TOKEN (registration token, vence em ~1h) ainda e aceito
# como fallback manual de bring-up.
#
# `set -e` aborta no primeiro erro; `set -u` falha em var nao definida —
# protege contra credencial vazia ou typo em label.

set -euo pipefail

: "${RUNNER_NAME:?RUNNER_NAME e obrigatorio (ex.: jrc-staging-djr-01)}"
: "${REPO_URL:?REPO_URL e obrigatorio (https://github.com/ChewieSoft/relatorio_japao)}"

if [[ -z "${ACCESS_TOKEN:-}" && -z "${RUNNER_TOKEN:-}" ]]; then
  echo "[jrc-entrypoint] ERRO: defina ACCESS_TOKEN (PAT escopo 'repo', recomendado)" >&2
  echo "[jrc-entrypoint]        OU RUNNER_TOKEN (registration token via gh api, vence em 1h)." >&2
  exit 1
fi

EXPECTED_LABELS="staging,self-hosted,linux,x64"
RUNNER_LABELS="${RUNNER_LABELS:-$EXPECTED_LABELS}"
if [[ "$RUNNER_LABELS" != "$EXPECTED_LABELS" ]]; then
  echo "[jrc-entrypoint] AVISO: RUNNER_LABELS sobrescrito para '$RUNNER_LABELS'."
  echo "[jrc-entrypoint] Esperado canonico: '$EXPECTED_LABELS'."
  echo "[jrc-entrypoint] Confirme intencional — o cd-staging.yml usa runs-on: [self-hosted, staging]."
fi
export RUNNER_LABELS

export EPHEMERAL="${EPHEMERAL:-true}"
export RUNNER_WORKDIR="${RUNNER_WORKDIR:-/runner/_work}"

AUTH_MODE="RUNNER_TOKEN(registration, 1h)"
[[ -n "${ACCESS_TOKEN:-}" ]] && AUTH_MODE="ACCESS_TOKEN(PAT, auto-renew)"

echo "[jrc-entrypoint] Registrando runner: name=$RUNNER_NAME labels=$RUNNER_LABELS ephemeral=$EPHEMERAL auth=$AUTH_MODE repo=$REPO_URL"

# A imagem upstream consome LABELS, nao RUNNER_LABELS (cicd §2).
export LABELS="$RUNNER_LABELS"

# Limpa state residual de ciclos anteriores (restart != recreate; FS layer
# persiste -> "Cannot configure: already configured", cicd §3).
for f in /actions-runner/.runner /actions-runner/.credentials /actions-runner/.credentials_rsaparams; do
  if [[ -f "$f" ]]; then
    echo "[jrc-entrypoint] removendo state residual: $f"
    rm -f "$f"
  fi
done

# Sanity-check do socket Docker (jobs de deploy precisam dele).
if [[ -S /var/run/docker.sock ]]; then
  if docker version --format '{{.Server.Version}}' >/dev/null 2>&1; then
    echo "[jrc-entrypoint] Socket Docker OK ($(docker version --format '{{.Server.Version}}'))"
  else
    echo "[jrc-entrypoint] AVISO: socket /var/run/docker.sock presente mas daemon nao responde."
  fi
else
  echo "[jrc-entrypoint] AVISO: /var/run/docker.sock ausente — jobs de deploy vao falhar."
fi

exec /entrypoint.sh "$@"
