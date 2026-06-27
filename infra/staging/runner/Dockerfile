# syntax=docker/dockerfile:1.7
#
# Runner self-hosted conteinerizado do Relatorio JRC (staging).
# Espelha o runner canonico do jrc-staging-sq.
#
# Base: myoung34/github-runner pinada por digest (imutabilidade do base image).
# O binario do runner se mantem atual via AUTO-UPDATE em runtime (NAO definimos
# DISABLE_AUTO_UPDATE no compose) — evita o crashloop de versao deprecada
# (cicd §8a). Para bumpar a base: ver releases em
# https://github.com/myoung34/docker-github-actions-runner/releases.
FROM myoung34/github-runner:2.319.1-ubuntu-jammy@sha256:147a7ee3fe2a2df69251ed12fed7906552b050a91bf0a4ee7b78c7a312cf5bf2

# docker-cli + compose plugin via socket-mount (sem docker-in-docker).
# Usa keyring .asc direto (evita `gpg --dearmor`, que falha em buildkit non-tty — cicd §4).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        jq \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu jammy stable" \
        > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        docker-ce-cli \
        docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/jrc-entrypoint.sh
RUN chmod +x /usr/local/bin/jrc-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/jrc-entrypoint.sh"]

# CRITICO: definir ENTRYPOINT zera o CMD herdado da imagem base.
# Sem isto, o runner configura -> exit 0 -> restart loop (cicd §1).
CMD ["./bin/Runner.Listener", "run", "--startuptype", "service"]
