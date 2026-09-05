#!/usr/bin/env bash
# Atualiza o site na VPS: git pull + rebuild. Rodar de qualquer lugar.
#   ssh vps '~/contaleve-site/deploy/vps/update.sh'
set -euo pipefail
cd "$(dirname "$0")"
git -C ../.. pull --ff-only
docker compose up -d --build
docker image prune -f >/dev/null
echo "✔ atualizado: $(git -C ../.. log --oneline -1)"
