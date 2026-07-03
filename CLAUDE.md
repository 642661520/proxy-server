# Proxy Manager — 反向代理管理系统

基于 Node.js 内置 TLS 栈绕过 WAF 指纹检测的通用反向代理管理平台，支持 Web 管理界面和 YAML 纯服务端两种模式。

## 运行模式

| 模式 | 启动命令 | 说明 |
|------|----------|------|
| Web 管理 | `npx tsx server/src/index.ts` | Admin API :3001 + Proxy :3000 + Vue SPA |
| YAML 纯服务端 | `npx tsx server/src/index.ts --config=proxy-server.yaml` | 仅代理引擎 :3000，无数据库依赖 |

## 核心能力

- **TLS 指纹绕过** — Node.js 内置 `http`/`https` 模块的 TLS 指纹被识别为浏览器流量，可绕过华为 CloudWAF 等 JA3 检测
- **请求注入** — 敏感值存储于 SQLite，请求时自动注入 query/header，前端请求不暴露原始值；YAML 模式支持 `${VAR}` 和 `${VAR:-default}` 环境变量替换
- **静态文件服务** — YAML 模式支持本地目录静态文件托管（类似 nginx `root`），含 MIME 识别、ETag/304、SPA fallback、路径遍历防护
- **负载均衡** — 支持 `upstream_urls` 多域名随机/轮询分流，适合天地图等瓦片服务
- **热重载** — 修改代理配置后通过 EventEmitter 原子替换路由表，无需重启
- **代理中间件管道** — Router → AccessGuard → RateLimiter → CacheCheck → Injector/StaticFile → Forwarder → Auditor
- **双模式运行** — Web 管理模式（SQLite + Admin UI）和 YAML 纯服务端模式（无数据库依赖）
- **角色访问控制** — `adminOnly` 中间件保护所有管理接口的写操作，普通用户仅可查看

## 技术栈

| 层 | 选型 |
|---|------|
| 后端框架 | Express + TypeScript |
| 代理引擎 | Node.js 内置 `http`/`https`/`tls` 模块 |
| 数据库 | better-sqlite3（零外部进程） |
| 前端 | Vue 3 + UnoCSS + TypeScript |
| 图标 | Material Design Icons（@iconify-json/mdi） |
| 日志 | Pino |
| 认证 | JWT + bcrypt |

## 项目结构

```
proxy-server/
├── server/                     # 后端
│   └── src/
│       ├── index.ts            # 入口：Admin API :3001 + Proxy Engine :3000
│       ├── config.ts           # 环境变量 + 主密钥管理
│       ├── database/
│       │   ├── connection.ts   # better-sqlite3 单例
│       │   ├── migrate.ts      # 迁移执行器
│       │   └── migrations/     # 8 个 SQL 迁移文件
│       ├── modules/            # 功能模块（controller + service + routes）
│       │   ├── auth/           # JWT 登录 / 密码修改
│       │   ├── proxies/        # 代理配置 CRUD + EventEmitter 热重载
│       │   ├── injection-rules/ # 请求注入规则
│       │   ├── access/         # IP 黑白名单（CIDR 匹配）
│       │   ├── health/         # 实时健康检查（HEAD 探测上游）
│       │   ├── logs/           # 请求日志查询 + SSE 实时推送 + CSV 导出
│       │   └── stats/          # 流量统计聚合
│       ├── yaml-config/       # YAML 配置加载 + fs.watch 热重载
│       │   └── loader.ts
│       │   ├── router.ts       # 请求匹配（host + path + port）
│       │   ├── forwarder.ts    # HTTP/HTTPS 转发（可配 TLS ciphers/SNI）
│       │   ├── injector.ts     # 请求参数 / Header 注入
│       │   ├── access-guard.ts # IP 访问控制
│       │   ├── rate-limiter.ts # 令牌桶算法（per-proxy 内嵌参数）
│       │   ├── cache-handler.ts # lru-cache 缓存（per-proxy TTL）
│       │   └── auditor.ts      # 异步批量日志写入（500ms / 50 条）
│       └── utils/
│           ├── ip.ts           # IP/CIDR 匹配
│           └── url.ts          # URL 拼接 / 上游解析
├── client/                     # 前端 SPA
│   ├── src/
│   │   ├── locale.ts           # 全局字典（所有文案统一管理）
│   │   ├── hooks/useTheme.ts   # 深浅主题 composable
│   │   ├── components/         # AppModal, AppTable
│   │   ├── layouts/            # DefaultLayout（侧栏+顶栏）, BlankLayout（登录页）
│   │   └── views/              # 9 个业务页面
│   ├── uno.config.ts           # UnoCSS 配置（shortcuts, dark:class, presetIcons）
│   └── public/map.html         # OpenLayers 天地图测试页面
├── static-demo/                # 静态文件服务 Demo
│   └── index.html              # OpenLayers 四图层地图（OSM/地形/卫星/天地图）
├── config.yaml                 # YAML 模式示例配置（静态 + 代理混合）
├── data/                       # 运行时数据 (gitignored)
│   ├── proxy-server.db         # SQLite 数据库
│   └── logs/
├── deploy/                     # PM2 + Docker 部署配置
└── .env                        # 环境变量（端口、JWT 密钥、主加密密钥）
```

## 双端口架构

| 端口 | 用途 | 认证 |
|------|------|------|
| `:3001` | Admin REST API + Vue SPA 静态文件 | JWT |
| `:3000` | 代理引擎（客户端请求入口） | 无（ACL/限流保护） |

## 数据库核心表

`users` → `proxies` → `injection_rules`, `access_rules`, `health_checks` → `request_logs`

## API 约定

- 前缀 `/api/v1/`
- 除 `/auth/login` 外均需 `Authorization: Bearer <token>`
- POST/PUT/PATCH/DELETE 操作需 `admin` 角色（`adminOnly` 中间件）
- GET 操作所有已认证用户可访问
- 分页参数 `?page=&pageSize=`
- 日志查询支持 `?proxyId=&statusCode=&method=&from=&to=`
- CSV 导出支持 `?token=` 查询参数认证（`window.open` 场景）
- `GET /api/v1/cache/stats` — 缓存状态（条目数、占用大小）
- `POST /api/v1/cache/purge` — 清除缓存（可选 `{ proxyId: N }` 按代理清除）

## 开发

```bash
# 安装依赖
cd server && npm install
cd client && npm install

# 启动（需两个终端）
cd server && npx tsx src/index.ts    # 后端 :3001 + 代理 :3000
cd client && npx vite                # 前端 :5173，API 代理到 :3001

# 默认管理员
admin / admin123

# 生产构建
cd client && npx vite build          # 输出到 client/dist/
cd server && npx tsx src/index.ts    # 单端口提供 API + 静态文件
```

## YAML 纯服务端模式

```bash
# 本地开发
npx tsx server/src/index.ts --config=config.yaml
npx tsx server/src/start-yaml.ts --config=config.yaml   # 精简入口（同效）
```

只启动代理引擎（默认 :3000），无数据库、无 Admin UI。配置通过 YAML 文件定义，修改后自动热重载（fs.watch）。

```yaml
# config.yaml
port: 3000

proxies:
  # 静态站点
  - name: 前端 SPA
    path_prefix: /
    upstream_url: ""
    static_dir: ./static-demo       # 本地开发；Docker 用 /app/www
    index: index.html               # 默认首页 + SPA fallback
    cache_ttl: 3600

  # 天地图 — 负载均衡 8 个子域名
  - name: 天地图瓦片
    path_prefix: /tdt/
    upstream_urls:                  # 多域名随机分流
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
    strip_prefix: true
    cache_ttl: 3600
    injections:
      - into: query
        name: tk
        value: "${TDT_API_KEY}"     # 环境变量，或直接写 key
```

## Docker 部署

```bash
# 构建 YAML 精简镜像
docker build -f deploy/Dockerfile.yaml -t proxy-server-yaml .

# 运行（挂载配置 + 静态文件）
docker run -d --name proxy \
  -p 3007:3007 \
  -v ./config.yaml:/app/config.yaml:ro \
  -v ./static-demo:/app/www:ro \
  proxy-server-yaml

# Compose 一键启动
cd deploy && docker-compose up -d proxy-yaml
```

| 镜像 | 大小 | 说明 |
|------|------|------|
| `Dockerfile` | ~200 MB | Web 全量镜像（SQLite + Express + Vue SPA） |
| `Dockerfile.yaml` | ~120 MB | YAML 精简镜像（仅代理引擎，无 DB） |

核心差异：

| | Web 模式 | YAML 模式 |
|---|---------|----------|
| 配置来源 | SQLite + Admin UI | YAML 文件 |
| 热重载 | EventEmitter (API 触发) | fs.watch (文件变更) |
| 注入规则 | DB 表 + AES-256-GCM 加密 | YAML 内嵌明文，`${VAR}` 环境变量替换 |
| 访问控制 | DB 表 | YAML 内嵌 |
| 静态文件 | 不支持 | `static_dir` + `index` 字段 |
| 日志 | SQLite 批量写 | Pino stdout |
| 依赖 | SQLite | 无外部依赖（dotenv/js-yaml/lru-cache 除外） |

## 安全特性

| 特性 | 说明 |
|------|------|
| 角色控制 | `adminOnly` 中间件保护所有写操作，普通用户仅可 GET 查看 |
| 登录限流 | 每 IP 每分钟最多 10 次登录尝试，超限返回 429 |
| 请求体限制 | 代理转发默认上限 10 MB，超限返回 413 |
| 路径遍历防护 | 静态文件服务拒绝 `../` 等路径穿越攻击 |
| Header 注入防护 | 注入值自动过滤 `\r\n` 控制字符 |
| CSV 注入防护 | 导出字段转义引号，`=`/`+`/`-`/`@` 前缀添加 `\t` |
| 错误信息 | 生产环境 (`NODE_ENV=production`) 不暴露内部错误详情 |
| 信号处理 | SIGINT/SIGTERM 优雅关闭：drain 连接 → flush 日志 → 关闭 DB |

## 环境变量加载

启动时自动从项目根目录加载 `.env` 文件（通过 dotenv）。优先级：**系统环境变量 > `.env` 文件 > 代码默认值**。JWT 密钥等敏感值首次自动生成后持久化到 `data/` 目录。

## YAML 配置字段

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `name` | string | — | 代理名称 |
| `path_prefix` | string | — | 路径前缀 |
| `upstream_url` | string | — | 上游地址（单域名，静态模式可留空） |
| `upstream_host` | string | — | 上游 Host header |
| `upstream_urls` | string[] | — | 多上游负载均衡地址（设置后覆盖 upstream_url） |
| `lb_strategy` | string | `random` | 负载均衡策略：`random`（随机，适合瓦片）或 `rr`（轮询） |
| `strip_prefix` | bool | `true` | 转发时剥离路径前缀 |
| `static_dir` | string | — | 静态文件目录（设置后忽略 upstream_url） |
| `index` | string | `index.html` | 默认首页，也作为 SPA fallback |
| `cache_ttl` | number | `0` | 缓存秒数，0=不缓存 |
| `rate_limit_req` | number | `0` | 速率限制请求数，0=不限 |
| `rate_limit_window` | number | `60` | 速率限制窗口秒数 |
| `upstream_urls` | string[] | — | 多上游负载均衡地址（设置后覆盖 upstream_url） |
| `lb_strategy` | string | `random` | 负载均衡策略：`random`（随机）或 `rr`（轮询） |
| `injections` | array | — | 请求注入规则（支持 `${VAR}` 和 `${VAR:-default}`） |
| `access` | array | — | IP 访问控制 |
| `tls_ciphers` | string | — | 自定义 TLS 密码套件 |
| `tls_servername` | string | — | TLS SNI |

## 配置天地图代理（Web 模式）

1. 登录管理界面 → 代理管理 → 新建代理
   - 路径前缀: `/tianditu/`
   - 上游 URL: `https://t0.tianditu.gov.cn`
   - 上游 Host: `t0.tianditu.gov.cn`
   - 剥离路径前缀: ✅
2. 请求注入 → 新建规则
   - 注入位置: Query 参数
   - 参数名: `tk`
   - 注入值: 你的天地图 key
   - 关联代理: 选择上一步创建的代理

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ADMIN_PORT` | 3001 | 管理 API 端口 |
| `PROXY_PORT` | 3000 | 代理引擎端口 |
| `JWT_SECRET` | 自动生成 | JWT 签名密钥（持久化到 data/.jwt_secret） |
| `JWT_EXPIRES_IN` | 24h | JWT 过期时间 |
| `PROXY_MASTER_KEY` | 自动生成 | API 密钥加密主密钥（持久化到 data/.master_key） |
| `LOG_RETENTION_DAYS` | 30 | 日志保留天数 |
| `ADMIN_DEFAULT_PASSWORD` | admin123 | 首次启动管理员密码 |
| `DATA_DIR` | ./data | 数据目录 |
| `LOG_DIR` | ./data/logs | 日志目录 |
| `NODE_ENV` | development | 生产设 `production`（影响日志级别和错误详情） |
| `CLIENT_DIST` | client/dist | 前端静态文件目录 |
| `TDT_API_KEY` | — | 天地图 API 密钥（YAML 中引用 `${TDT_API_KEY}`） |
