#!/bin/sh
set -e
cd /app

LOCK_HASH="$(sha256sum package-lock.json 2>/dev/null | cut -d' ' -f1 || true)"
STORED=""
if [ -f node_modules/.docker-lock-hash ]; then
  STORED="$(cat node_modules/.docker-lock-hash)"
fi

if [ "$LOCK_HASH" != "$STORED" ] || [ ! -d node_modules/@tailwindcss/vite ]; then
  echo "[frontend] Syncing node_modules (volume or lockfile changed)…"
  npm ci
  if [ -n "$LOCK_HASH" ]; then
    echo "$LOCK_HASH" > node_modules/.docker-lock-hash
  fi
fi

exec "$@"
