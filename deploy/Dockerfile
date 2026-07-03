# ─── Stage 1: 构建前端 ───
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ─── Stage 2: 运行镜像 ───
FROM node:22-alpine

# Build deps for better-sqlite3 native compilation on Alpine
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install server dependencies (include tsx as production dep for YAML mode)
COPY server/package.json server/package-lock.json* ./
RUN npm ci --production && npm install tsx

# Copy server source
COPY server/src/ ./src/
COPY server/tsconfig.json ./

# Copy built client from stage 1
COPY --from=client-builder /app/client/dist/ ./public/

# Copy entrypoint
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create data directory (Web mode)
RUN mkdir -p /app/data/logs

EXPOSE 3000 3001

# CONFIG_FILE env var switches to YAML mode
ENTRYPOINT ["/entrypoint.sh"]
