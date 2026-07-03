# YAML 模式部署手册 — Proxy Manager

## 目录

1. [快速开始](#1-快速开始)
2. [顶层配置](#2-顶层配置)
3. [代理条目](#3-代理条目)
4. [请求注入](#4-请求注入)
5. [访问控制](#5-访问控制)
6. [热重载](#6-热重载)
7. [Docker 部署](#7-docker-部署)
8. [完整示例](#8-完整示例)

---

## 1. 快速开始

### 本地开发

```bash
# 1. 准备配置文件
cp proxy-server.yaml.example proxy-server.yaml
# 编辑 proxy-server.yaml，填入你的配置

# 2. 启动（使用主入口 --config 参数）
npx tsx server/src/index.ts --config=proxy-server.yaml

# 或使用专用 YAML 入口（更轻量，无 Express/SQLite 依赖）
npx tsx server/src/start-yaml.ts --config=proxy-server.yaml
```

主入口 `index.ts` 启动后仅运行代理引擎，**不启动 Admin API 和管理界面**。如需管理端请不加 `--config` 参数启动。

专用入口 `start-yaml.ts` 体积更小、依赖更少，推荐生产环境使用。

### Docker 快速启动

```bash
# 1. 构建 YAML 模式专用镜像
docker build -f deploy/Dockerfile.yaml -t proxy-server-yaml .

# 2. 准备配置文件和静态资源目录

# 3. 启动容器
docker run -d \
  --name proxy-yaml \
  -p 3000:3000 \
  -v /path/to/config.yaml:/app/config.yaml:ro \
  -v /path/to/www:/app/www:ro \
  -e CONFIG_FILE=/app/config.yaml \
  proxy-server-yaml
```

> Docker 部署详见第 7 节。

---

## 2. 顶层配置

```yaml
port: 3000       # 代理引擎监听端口，默认 3000
log_level: info  # 日志级别: trace | debug | info | warn | error，默认 info
proxies:         # 代理列表，必填
  - ...
```

### 环境变量

启动时自动从项目根目录加载 `.env` 文件（`dotenv` 加载，`override: false`）。

**优先级**：系统环境变量 > `.env` 文件 > 代码默认值

```bash
# .env 示例
PROXY_PORT=3000
LOG_LEVEL=info
TDT_API_KEY=your-tianditu-key
```

> `.env` 中的变量可在注入值中通过 `${VAR}` 语法引用，详见第 4 节。

### 端口说明

| 模式 | 默认端口 | 说明 |
|------|----------|------|
| YAML 纯服务端 | 3000 | 仅代理引擎，支持环境变量 `PROXY_PORT` 覆盖 |

### 日志级别

| 级别 | 说明 |
|------|------|
| `trace` | 最详细，含协议栈调试信息 |
| `debug` | 调试信息，含缓存命中/未命中 |
| `info` | 常规运行信息（默认） |
| `warn` | 警告，如访问被拒绝 |
| `error` | 仅错误 |

---

## 3. 代理条目

每个代理是 `proxies` 数组中的一个元素。以下按功能分类列出所有可配置字段。

### 3.1 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 代理名称，用于日志标识 |
| `path_prefix` | string | 匹配的路径前缀，如 `/tianditu/`，`/` 匹配所有路径 |
| `upstream_url` | string | 上游服务地址，如 `https://t0.tianditu.gov.cn`。静态文件模式可设为空字符串 `""` |

> `upstream_url` 为空时，必须设置 `static_dir`（见 3.5 静态文件服务）。

### 3.2 路由控制

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `hostname` | string | (空) | 按请求 Host 头匹配，不填则匹配所有域名。匹配不区分大小写 |
| `listen_port` | number | (空) | 按代理引擎端口匹配，不填则匹配所有端口。适用于双端口部署时区分流量 |
| `strip_prefix` | boolean | true | 转发时是否剥离路径前缀。例：`/tianditu/vec_w` → `/vec_w` |
| `sort_order` | number | (按 YAML 顺序) | 匹配优先级，数字越小越优先。仅在路径长度相同时生效 |

**匹配优先级**：多个代理匹配同一请求时，按以下顺序确定最终路由：

1. **路径前缀最长者优先** — `/tianditu/` 优先于 `/`
2. **`sort_order`** — 路径长度相同时，数字小的优先
3. **YAML 定义顺序** — 以上均相同时，先定义的优先

**匹配流程**（每个条件均为可选）：

```
请求 Host 匹配 ? → 请求端口匹配 ? → 路径前缀匹配 ? → 命中该代理
```

### 3.3 上游连接

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `upstream_host` | string | (从 URL 提取) | 发送到上游的 Host 头，用于虚拟主机场景 |
| `connect_timeout` | number | 10000 | TCP 连接超时，毫秒 |
| `timeout` | number | 30000 | 请求整体超时，毫秒 |
| `max_body_size` | number | 10485760 | 请求体最大字节数，默认 10 MB。超限返回 413 |
| `allowed_methods` | string | `GET,POST,PUT,DELETE,PATCH,HEAD,OPTIONS` | 允许转发的 HTTP 方法，逗号分隔 |

> 请求体超过 `max_body_size` 时立即拒绝并返回 413 Payload Too Large。

### 3.4 负载均衡（NEW）

当上游需要多节点分发时，使用 `upstream_urls` 替代单 `upstream_url`。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `upstream_urls` | string[] | (空) | 多上游 URL 列表。设置后覆盖 `upstream_url` |
| `lb_strategy` | string | `random` | 负载均衡策略：`random`（随机）或 `rr`（轮询） |

**策略说明**：

| 策略 | 适用场景 | 说明 |
|------|----------|------|
| `random` | 瓦片服务、CDN 回源 | 每次请求随机选取一个上游，各子域名均匀分布 |
| `rr` | API 服务、有状态轮询 | 按请求顺序依次轮询每个上游 |

**示例 — 天地图 t0~t7 多域名负载均衡**：

```yaml
- name: 天地图瓦片（负载均衡）
  path_prefix: /tdt/
  upstream_url: https://t0.tianditu.gov.cn   # 单域名 fallback
  upstream_urls:
    - https://t0.tianditu.gov.cn
    - https://t1.tianditu.gov.cn
    - https://t2.tianditu.gov.cn
    - https://t3.tianditu.gov.cn
    - https://t4.tianditu.gov.cn
    - https://t5.tianditu.gov.cn
    - https://t6.tianditu.gov.cn
    - https://t7.tianditu.gov.cn
  lb_strategy: random
  upstream_host: t0.tianditu.gov.cn
```

> 设置 `upstream_urls` 后 `upstream_url` 不会完全失效——当 `upstream_urls` 数组为空或长度为 0 时，自动回退到 `upstream_url`。

### 3.5 静态文件服务（NEW）

无需上游服务器，直接从本地文件系统响应请求。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `static_dir` | string | (空) | 静态文件根目录的绝对路径。设置后进入静态文件模式 |
| `index` | string | `index.html` | 默认首页文件名。目录访问时自动查找该文件 |

**工作模式**：

```
请求路径 → 映射到文件系统 → 检测 MIME 类型 → 发送文件
```

**核心特性**：

| 特性 | 说明 |
|------|------|
| MIME 类型自动检测 | 支持 .html、.css、.js、.png、.jpg、.svg、.woff2 等 30+ 种格式 |
| ETag / 304 | 自动生成 `ETag` 和 `Last-Modified` 头，支持条件请求 |
| SPA 回退 | 文件不存在时自动尝试返回 `index.html`，适用于 Vue/React 单页应用 |
| 路径穿越防护 | 所有路径经 `resolve()` 标准化后校验，防止 `../` 越权访问 |
| 缓存控制 | 配合 `cache_ttl` 输出 `Cache-Control` 头 |
| 仅 GET/HEAD | 静态文件模式只允许 GET 和 HEAD 方法，其他返回 405 |

**完整示例**：

```yaml
- name: 静态站点
  path_prefix: /
  upstream_url: ""                # 必须为空或省略
  static_dir: /app/www           # 文件系统路径
  index: index.html              # 默认首页（SPA 回退用）
  cache_ttl: 3600                # 浏览器缓存 1 小时
```

**MIME 类型表**（节选）：

| 扩展名 | MIME |
|--------|------|
| .html/.htm | text/html; charset=utf-8 |
| .css | text/css; charset=utf-8 |
| .js/.mjs | application/javascript; charset=utf-8 |
| .json | application/json |
| .svg | image/svg+xml |
| .png/.jpg/.gif/.webp/.avif | image/* |
| .woff2 | font/woff2 |
| .wasm | application/wasm |

### 3.6 TLS / HTTPS

控制代理引擎与上游服务器之间的 TLS 连接行为。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tls_servername` | string | (从 URL 提取) | SNI 主机名，用于 TLS 握手。某些 CDN 需要指定 |
| `tls_ciphers` | string | (Node.js 默认) | OpenSSL 加密套件字符串，用于定制 TLS 指纹 |
| `tls_reject_unauthorized` | boolean | true | 是否拒绝自签名证书。调试内部服务时可设为 false |
| `proxy_type` | string | `reverse` | 代理类型，当前仅支持 `reverse` |

**TLS 加密套件预设**：

| 预设 | 值 |
|------|-----|
| Chrome-like | `ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS` |
| Firefox-like | `ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS:!SHA1` |

> **何时使用**：通过 Node.js 内置 TLS 栈的指纹（JA3）可绕过 CloudWAF 等 DDoS 防护检测。结合自定义 `tls_ciphers` 可进一步模拟浏览器指纹。

**示例 — 自签名上游**：

```yaml
- name: 自签名内部服务
  path_prefix: /internal/
  upstream_url: https://10.0.0.50:8443
  tls_reject_unauthorized: false
  tls_ciphers: "ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:!aNULL:!MD5:!DSS"
```

### 3.7 缓存

内存缓存层，基于 `lru-cache` 实现。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cache_ttl` | number | 0 | 响应缓存时间，秒。0 = 不缓存 |

**缓存行为**：

| 项目 | 说明 |
|------|------|
| 存储引擎 | lru-cache（内存） |
| 最大条目 | 10,000 |
| 最大容量 | 100 MB |
| 缓存键 | `proxy:{id}\|{method}\|{url}` |
| 缓存方法 | 仅缓存 `allowed_methods` 中的方法（默认仅缓存 GET/HEAD） |
| 淘汰策略 | LRU — 条目数超 10,000 或总大小超 100 MB 时淘汰最近最少使用 |

**缓存管理 API**（Web 管理模式可用）：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/cache/stats` | GET | 获取缓存统计：当前条目数、最大条目数、已用容量 |
| `/api/v1/cache/purge` | POST | 清空缓存。可选 `body: { proxyId: 123 }` 仅清除指定代理的缓存 |

> YAML 纯服务端模式不提供管理 API。如需手动清空缓存，需重启进程。

### 3.8 速率限制

令牌桶算法，按客户端 IP 分组。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rate_limit_req` | number | 0 | 窗口内允许的最大请求数。0 = 不限流 |
| `rate_limit_window` | number | 60 | 限流窗口，秒 |

**令牌桶算法说明**：

- 每个 IP 拥有一个令牌桶，初始满额（= `rate_limit_req`）
- 按 `rate_limit_req / rate_limit_window` 速率补充令牌
- 令牌足够时允许请求并消耗 1 个令牌
- 令牌不足时返回 **429 Too Many Requests**
- 超出限制后自动施加惩罚期，响应头 `Retry-After` 指示重试时间
- 闲置桶每 5 分钟自动清理，防止内存泄漏

**示例 — 每分钟 100 请求**：

```yaml
rate_limit_req: 100
rate_limit_window: 60
```

**登录限流**（Web 管理模式内置）：

管理界面登录接口具有独立的限流规则：**每 IP 每分钟最多 10 次尝试**，超限返回 429。

---

## 4. 请求注入

每个代理可配置多个注入规则，按数组顺序执行。注入发生在转发之前，对上游服务器透明。

```yaml
injections:
  - into: query          # query | header，默认 query
    name: tk             # 参数名 / Header 名
    value: "your-key"    # 注入值（支持环境变量展开）
```

### 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `into` | string | `query` | 注入位置：`query` 追加到 URL 参数，`header` 添加到请求头 |
| `name` | string | (必填) | 参数名或 Header 名，如 `tk` 或 `Authorization` |
| `value` | string | (必填) | 注入值，支持环境变量展开（见下文） |

### 环境变量展开（NEW）

`value` 字段支持以下两种语法从环境变量读取值：

| 语法 | 说明 | 示例 |
|------|------|------|
| `${VAR}` | 读取环境变量 `VAR`，未设置则为空字符串 | `${TDT_API_KEY}` |
| `${VAR:-default}` | 读取环境变量 `VAR`，未设置时使用 `default` 作为回退值 | `${TDT_API_KEY:-my-fallback-key}` |

**示例**：

```yaml
injections:
  - into: query
    name: tk
    value: "${TDT_API_KEY}"                # 从环境变量读取

  - into: header
    name: Authorization
    value: "Bearer ${INTERNAL_TOKEN:-default-token}"  # 带回退值
```

**展开机制**：

- 配置加载时执行展开，非运行时
- 优先级：系统环境变量 > `.env` 文件 > `${VAR:-default}` 的回退值
- 文件热重载时重新展开，更新环境变量后保存文件即可生效

### 注入位置

| `into` | 说明 | 示例效果 |
|--------|------|----------|
| `query` | 追加到 URL query string | `/vec_w?x=1&y=2` → `/vec_w?x=1&y=2&tk=your-key` |
| `header` | 添加到请求头 | `X-Internal-Token: secret-token` |

> **安全提示**：YAML 模式的注入值是明文。生产环境请通过文件系统权限保护配置文件（`chmod 600`），或使用环境变量引用敏感值。

---

## 5. 访问控制

每个代理可配置多个访问规则，黑名单优先于白名单。

```yaml
access:
  - type: blacklist      # blacklist | whitelist
    pattern: 1.2.3.4     # 单个 IP 或 CIDR 网段
  - type: whitelist
    pattern: 10.0.0.0/8
```

### 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | string | (必填) | `blacklist` 或 `whitelist` |
| `pattern` | string | (必填) | IP 地址（`192.168.1.1`）或 CIDR 网段（`10.0.0.0/8`） |

### 匹配逻辑

```
1. 是否命中黑名单？
   ├─ 是 → 立即拒绝 (403 Forbidden)
   └─ 否 → 继续
2. 是否配置了白名单？
   ├─ 是且未命中 → 拒绝 (403 Forbidden)
   ├─ 是且命中 → 放行
   └─ 无白名单规则 → 放行
```

**简而言之**：黑名单优先，白名单准入。无规则时全部放行。

### 常见场景

```yaml
# 仅允许内网访问
access:
  - type: whitelist
    pattern: 10.0.0.0/8
  - type: whitelist
    pattern: 172.16.0.0/12
  - type: whitelist
    pattern: 192.168.0.0/16
  - type: whitelist
    pattern: 127.0.0.1

# 封禁恶意 IP，其余全部放行
access:
  - type: blacklist
    pattern: 1.2.3.4
  - type: blacklist
    pattern: 5.6.7.0/24
```

---

## 6. 热重载

修改 `proxy-server.yaml` 保存后，代理引擎自动加载新配置。文件监听基于 `fs.watch`，防抖延迟约 100ms。

### 可以热重载的改动（无需重启）

| 类别 | 可重载字段 |
|------|-----------|
| **代理定义** | 新增 / 删除代理条目 |
| **路由** | `path_prefix`、`hostname`、`listen_port`、`strip_prefix`、`sort_order` |
| **上游** | `upstream_url`、`upstream_urls`、`upstream_host`、`connect_timeout`、`timeout` |
| **TLS** | `tls_servername`、`tls_ciphers`、`tls_reject_unauthorized` |
| **缓存** | `cache_ttl` |
| **限流** | `rate_limit_req`、`rate_limit_window` |
| **注入** | `injections` 数组（增删改均可） |
| **访问控制** | `access` 数组（增删改均可） |
| **静态文件** | `static_dir`、`index` |
| **其他** | `log_level`、`max_body_size`、`allowed_methods`、`proxy_type` |

### 不可热重载的改动（必须重启）

| 配置项 | 原因 |
|--------|------|
| `port` | 监听端口在启动时绑定，无法运行时更改 |

### 热重载流程

```
用户保存 YAML 文件
    ↓
fs.watch 触发变更事件
    ↓
100ms 防抖等待（避免频繁保存多次触发）
    ↓
重新解析 YAML 文件
    ↓
环境变量重新展开
    ↓
原子替换路由表（旧连接不受影响）
    ↓
日志输出 "YAML config hot-reloaded"
```

> 热重载失败不会导致进程崩溃——解析错误会记入日志，路由表保持上一次有效配置。

---

## 7. Docker 部署

### 7.1 两种镜像选择

| 镜像 | Dockerfile | 适用模式 | 基础镜像 | 镜像大小 | 依赖数量 |
|------|-----------|----------|----------|----------|----------|
| **Web 模式** | `deploy/Dockerfile` | Web 管理 | node:22-alpine | ~250 MB | 完整 npm 依赖 |
| **YAML 模式** | `deploy/Dockerfile.yaml` | 纯服务端 | node:22-alpine | ~100 MB | 仅 5 个运行时依赖 |

#### YAML 模式依赖列表

```
tsx       — TypeScript 执行器
js-yaml   — YAML 解析
pino      — 日志
pino-pretty — 日志美化
lru-cache — 缓存
dotenv    — 环境变量加载
```

> YAML 模式镜像无需 `better-sqlite3`（需 native 编译）、`express`、`bcrypt` 等 Web 模式依赖，体积更小、构建更快。

### 7.2 构建

```bash
# YAML 模式专用镜像
docker build -f deploy/Dockerfile.yaml -t proxy-server-yaml .

# Web 模式镜像（也可以运行 YAML 配置）
docker build -f deploy/Dockerfile -t proxy-server-web .
```

### 7.3 运行

```bash
# YAML 模式 — 仅代理引擎
docker run -d \
  --name proxy-yaml \
  -p 3000:3000 \
  -v /host/path/config.yaml:/app/config.yaml:ro \
  -v /host/path/static-site:/app/www:ro \
  -e CONFIG_FILE=/app/config.yaml \
  -e TDT_API_KEY=your-key \
  proxy-server-yaml

# 参数说明：
#   -v config.yaml:ro   — 代理配置文件（只读挂载）
#   -v /app/www:ro      — 静态文件目录（只读挂载，按需）
#   -e CONFIG_FILE=     — 指定配置文件路径，触发 YAML 模式
#   -e TDT_API_KEY=     — 传递给配置文件中的 ${TDT_API_KEY}
```

### 7.4 Docker Compose

```yaml
version: '3.8'

services:
  proxy-yaml:
    build:
      context: .
      dockerfile: deploy/Dockerfile.yaml
    ports:
      - "3007:3007"
    volumes:
      - ./deploy/config.yaml:/app/config.yaml:ro
      - ./static-demo:/app/www:ro
    environment:
      - CONFIG_FILE=/app/config.yaml
      - TDT_API_KEY=${TDT_API_KEY:-}
    restart: unless-stopped
```

### 7.5 多模式共存（Web + YAML 同时运行）

```yaml
version: '3.8'

services:
  # Web 管理模式（管理端 + 代理引擎）
  proxy-server:
    build:
      context: .
      dockerfile: deploy/Dockerfile
    ports:
      - "3005:3005"   # Admin API
      - "3006:3006"   # 代理引擎
    volumes:
      - ./data:/app/data
    environment:
      - ADMIN_PORT=3005
      - PROXY_PORT=3006
    restart: unless-stopped

  # YAML 纯服务端模式（独立的代理实例）
  proxy-yaml:
    build:
      context: .
      dockerfile: deploy/Dockerfile.yaml
    ports:
      - "3007:3007"
    volumes:
      - ./deploy/config.yaml:/app/config.yaml:ro
      - ./static-demo:/app/www:ro
    environment:
      - CONFIG_FILE=/app/config.yaml
    restart: unless-stopped
```

### 7.6 目录挂载参考

| 挂载路径 | 用途 | 是否必须 |
|----------|------|----------|
| `/app/config.yaml` | 代理配置文件 | 是（YAML 模式） |
| `/app/www` | 静态文件根目录 | 仅静态文件模式需要 |
| `/app/data` | 运行时数据（Web 模式） | 仅 Web 模式需要 |

---

## 8. 完整示例

以下是一个综合配置，展示所有新特性的实际用法：

```yaml
# ═══════════════════════════════════════════════════
# proxy-server.yaml — 完整功能示例
# ═══════════════════════════════════════════════════
port: 3000
log_level: info

proxies:
  # ────────────────────────────────────────────────
  # 1. 静态站点 — SPA 单页应用服务
  #    从 /app/www 提供文件，SPA 回退到 index.html
  # ────────────────────────────────────────────────
  - name: 静态站点（SPA）
    path_prefix: /
    upstream_url: ""                   # 无上游，仅静态文件
    static_dir: /app/www              # 文件系统路径
    index: index.html                 # SPA 回退文件
    cache_ttl: 3600                   # 浏览器缓存 1 小时

  # ────────────────────────────────────────────────
  # 2. 天地图瓦片代理（负载均衡 + 环境变量注入）
  #    t0~t7 八域名随机分发，API Key 通过环境变量注入
  # ────────────────────────────────────────────────
  - name: 天地图瓦片
    path_prefix: /tianditu/
    upstream_url: https://t0.tianditu.gov.cn    # 单域名 fallback
    upstream_urls:                               # 多域名负载均衡
      - https://t0.tianditu.gov.cn
      - https://t1.tianditu.gov.cn
      - https://t2.tianditu.gov.cn
      - https://t3.tianditu.gov.cn
      - https://t4.tianditu.gov.cn
      - https://t5.tianditu.gov.cn
      - https://t6.tianditu.gov.cn
      - https://t7.tianditu.gov.cn
    lb_strategy: random               # 瓦片服务：随机分发
    upstream_host: t0.tianditu.gov.cn
    strip_prefix: true
    cache_ttl: 3600                   # 瓦片缓存 1 小时
    rate_limit_req: 200               # 每 IP 每分钟 200 次
    rate_limit_window: 60
    injections:
      - into: query
        name: tk
        value: "${TDT_API_KEY}"       # 从环境变量读取，不硬编码
    access:
      - type: whitelist
        pattern: 10.0.0.0/8
      - type: whitelist
        pattern: 127.0.0.1

  # ────────────────────────────────────────────────
  # 3. 内网 API 代理 — Header 注入 + 无缓存
  #     转发到内网服务，注入认证令牌
  # ────────────────────────────────────────────────
  - name: 内网 API
    path_prefix: /api/
    upstream_url: http://192.168.1.100:8080
    upstream_host: api.internal.local
    strip_prefix: false
    cache_ttl: 0                      # 不缓存
    connect_timeout: 5000             # 内网：短超时
    timeout: 15000
    injections:
      - into: header
        name: X-Internal-Token
        value: "${INTERNAL_API_TOKEN:-default-token}"  # 带回退值
    access:
      - type: blacklist
        pattern: 0.0.0.0/0           # 禁止外网访问
      - type: whitelist
        pattern: 10.0.0.0/8

  # ────────────────────────────────────────────────
  # 4. HTTPS 自签名上游 — 自定义 TLS 套件
  #     用于内部自签名证书服务 + 自定义加密套件
  # ────────────────────────────────────────────────
  - name: 自签名内部服务
    path_prefix: /internal/
    upstream_url: https://10.0.0.50:8443
    tls_reject_unauthorized: false    # 接受自签名证书
    tls_ciphers: "ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:!aNULL:!MD5:!DSS"
    tls_servername: internal-service.local
    timeout: 30000

  # ────────────────────────────────────────────────
  # 5. 基于 Hostname 的反向代理
  #     仅当请求 Host 为 app.example.com 时匹配
  # ────────────────────────────────────────────────
  - name: 站点反代
    path_prefix: /
    hostname: app.example.com
    upstream_url: http://localhost:8080
    upstream_host: app.example.com
    cache_ttl: 300
    rate_limit_req: 500
    rate_limit_window: 60
```

### 配套 .env 文件

```bash
# .env（与 proxy-server.yaml 同目录）
TDT_API_KEY=b20a5cf27754495fb3f572f39a0c0a9c
INTERNAL_API_TOKEN=my-secret-token
```

### 启动命令

```bash
# 本地
npx tsx server/src/start-yaml.ts --config=proxy-server.yaml

# Docker
docker run -d \
  --name proxy-yaml \
  -p 3000:3000 \
  -v $(pwd)/proxy-server.yaml:/app/config.yaml:ro \
  -v $(pwd)/www:/app/www:ro \
  --env-file .env \
  -e CONFIG_FILE=/app/config.yaml \
  proxy-server-yaml
```
