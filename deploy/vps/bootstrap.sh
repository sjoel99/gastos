#!/usr/bin/env bash
# Prepara uma VPS Ubuntu/Debian zerada e sobe o site do ContaLeve.
#
#   curl -fsSL https://raw.githubusercontent.com/sjoel99/gastos/main/deploy/vps/bootstrap.sh | bash -s -- <TUNNEL_TOKEN>
#
# Idempotente: pode rodar de novo pra atualizar. Não precisa de root direto —
# usa sudo quando necessário.
set -euo pipefail

TOKEN="${1:-${TUNNEL_TOKEN:-}}"
REPO_URL="${REPO_URL:-https://github.com/sjoel99/gastos.git}"
APP_DIR="${APP_DIR:-$HOME/contaleve-site}"

# Como root (VPS recém-criada) não há sudo; como usuário comum, usa sudo.
if [[ $EUID -eq 0 ]]; then SUDO=""; else SUDO="sudo"; fi

if [[ -z "$TOKEN" ]]; then
  echo "⚠ sem TUNNEL_TOKEN: sobe só a landing (porta interna 3000). Depois:" >&2
  echo "   echo TUNNEL_TOKEN=... > $APP_DIR/deploy/vps/.env && docker compose -f $APP_DIR/deploy/vps/docker-compose.yml up -d tunnel" >&2
fi

# --- Docker (script oficial; pula se já existir) ---------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "▶ instalando Docker"
  curl -fsSL https://get.docker.com | $SUDO sh
  [[ $EUID -ne 0 ]] && $SUDO usermod -aG docker "$USER"
fi
# `docker compose` (plugin v2) vem junto no pacote docker-ce moderno.
docker compose version >/dev/null

# --- Firewall mínimo: só SSH. O túnel sai da VPS, não entra nada. -----------
if command -v ufw >/dev/null 2>&1 && ! $SUDO ufw status | grep -q "Status: active"; then
  echo "▶ ativando ufw (só 22/tcp)"
  $SUDO ufw allow OpenSSH >/dev/null
  $SUDO ufw --force enable >/dev/null
fi

# --- Código -----------------------------------------------------------------
# SKIP_GIT=1 quando o código foi copiado por rsync (não mexe no checkout).
if [[ "${SKIP_GIT:-0}" == "1" ]]; then
  echo "▶ usando código já presente em $APP_DIR"
elif [[ -d "$APP_DIR/.git" ]]; then
  echo "▶ atualizando $APP_DIR"
  git -C "$APP_DIR" pull --ff-only
else
  echo "▶ clonando em $APP_DIR"
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR/deploy/vps"
if [[ -n "$TOKEN" ]]; then
  printf 'TUNNEL_TOKEN=%s\n' "$TOKEN" > .env
  chmod 600 .env
elif [[ ! -f .env ]]; then
  : > .env
fi

# --- Sobe (usa sg pra não exigir novo login após o usermod) ----------------
SERVICES="app"
grep -q '^TUNNEL_TOKEN=.\+' .env && SERVICES="app tunnel"
echo "▶ build + up ($SERVICES)"
if docker info >/dev/null 2>&1; then
  docker compose up -d --build $SERVICES
else
  sg docker -c "docker compose up -d --build $SERVICES"
fi

echo
echo "✔ pronto. Confira em ~1 min:"
echo "   curl -sI https://contaleve.sjoel99.com/privacy | head -1"
echo "   curl -s  https://contaleve.sjoel99.com/announcements.json"
echo "Logs: docker compose -f $APP_DIR/deploy/vps/docker-compose.yml logs -f"
