#!/bin/sh
set -e

echo "[fintech-core] Esperando base de datos y aplicando migraciones..."
pnpm exec prisma migrate deploy

echo "[fintech-core] Iniciando API..."
exec node dist/server.js
