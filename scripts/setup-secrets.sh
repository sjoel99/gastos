#!/bin/sh
# Gera AUTH_SECRET, CRON_SECRET e VAPID keys e imprime um bloco pronto
# para colar no .env do servidor.
#
# Uso: ./scripts/setup-secrets.sh

set -e

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl não encontrado." >&2
  exit 1
fi

AUTH_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -hex 32)

if command -v npx >/dev/null 2>&1; then
  VAPID=$(npx -y web-push generate-vapid-keys --json 2>/dev/null)
  VAPID_PUBLIC=$(echo "$VAPID" | sed -n 's/.*"publicKey":"\([^"]*\)".*/\1/p')
  VAPID_PRIVATE=$(echo "$VAPID" | sed -n 's/.*"privateKey":"\([^"]*\)".*/\1/p')
else
  echo "[aviso] npx não encontrado — VAPID keys vazias. Gere depois:" >&2
  echo "  npx web-push generate-vapid-keys" >&2
  VAPID_PUBLIC=""
  VAPID_PRIVATE=""
fi

cat <<EOF
# --- copie e cole no .env de produção ---
AUTH_SECRET="$AUTH_SECRET"
CRON_SECRET="$CRON_SECRET"
VAPID_PUBLIC_KEY="$VAPID_PUBLIC"
VAPID_PRIVATE_KEY="$VAPID_PRIVATE"
VAPID_SUBJECT="mailto:seu@email.com"
EOF
