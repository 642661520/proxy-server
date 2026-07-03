#!/bin/sh
# Docker entrypoint — routes to Web mode or YAML mode based on CONFIG_FILE env var
set -e

if [ -n "$CONFIG_FILE" ]; then
  echo "[entrypoint] YAML mode: $CONFIG_FILE"
  exec npx tsx src/start-yaml.ts --config="$CONFIG_FILE"
else
  echo "[entrypoint] Web mode"
  exec npx tsx src/index.ts
fi
