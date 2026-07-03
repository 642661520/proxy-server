#!/bin/sh
# Docker entrypoint — YAML 纯服务端模式
set -e

CONFIG="${CONFIG_FILE:-/app/config.yaml}"
echo "[entrypoint] Starting proxy server with config: $CONFIG"
exec npx tsx src/index.ts --config="$CONFIG"
