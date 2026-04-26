#!/bin/sh
set -e

echo "[entrypoint] aplicando migrations..."
( cd /app/migrator && node migrate.mjs )

echo "[entrypoint] iniciando servidor..."
exec node server.js
