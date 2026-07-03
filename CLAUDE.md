# Proxy Server — YAML 驱动的反向代理服务器

基于 Node.js 内置 TLS 栈绕过 WAF 指纹检测的通用反向代理引擎，支持静态文件服务和上游转发。

## 核心能力

- **TLS 指纹绕过** — Node.js 内置 `http`/`https` 模块的 TLS 指纹被识别为浏览器流量，可绕过华为 CloudWAF 等 JA3 检测
- **请求注入** — YAML 配置中定义 query/header 注入规则，支持 `${VAR}` 和 `${VAR:-default}` 环境变量替换
- **静态文件服务** — 支持本地目录静态文件托管（类似 nginx `root`），含 MIME 识别、ETag/304、SPA fallback、路径遍历防护
- **负载均衡** — 支持 `upstream_urls` 多域名随机/轮询分流，适合天地图等瓦片服务
- **热重载** — 修改 YAML 配置后自动 fs.watch 触发路由表原子替换，无需重启
- **代理中间件管道** — Router → AccessGuard → RateLimiter → CacheCheck → Injector/StaticFile → Forwarder → Auditor
- **零外部依赖** — 无 SQLite、无 Express，仅 6 个 npm 依赖

## 技术栈

| 层 | 选型 |
|---|------|
| 运行时 | Node.js + TypeScript + tsx |
| 代理引擎 | Node.js 内置 `http`/`https`/`tls` 模块 |
| 配置 | YAML (js-yaml) |
| 缓存 | lru-cache (内存) |
| 日志 | Pino |

## 快速开始

```bash
# 安装依赖
cd server && npm install

# 启动
npx tsx server/src/index.ts --config=config.yaml
```

代理引擎默认监听 `:3000`（可通过 `PROXY_PORT` 环境变量或 YAML `port` 字段修改）。

## 项目结构

```
proxy-server/
├── server/                     # 后端
│   └── src/
│       ├── index.ts            # 入口：代理引擎
│       ├── config.ts           # 环境变量加载
│       ├── types.ts            # ProxyConfig 类型定义
│       ├── logger.ts           # Pino 日志
│       ├── proxy-engine/       # 代理引擎核心
│       │   ├── index.ts        # 请求处理管道
│       │   ├── router.ts       # 路由表匹配（host + path + port）
│       │   ├── forwarder.ts    # HTTP/HTTPS 转发 + 静态文件服务
│       │   ├── injector.ts     # 请求参数 / Header 注入
│       │   ├── access-guard.ts # IP 访问控制（CIDR 匹配）
│       │   ├── rate-limiter.ts # 令牌桶算法（per-proxy 内嵌参数）
│       │   ├── cache-handler.ts # lru-cache 缓存（per-proxy TTL）
│       │   └── auditor.ts      # 异步批量日志写入（500ms / 50 条）
│       ├── yaml-config/        # YAML 配置加载 + fs.watch 热重载
│       │   └── loader.ts
│       └── utils/
│           ├── ip.ts           # IP/CIDR 匹配
│           ├── url.ts          # URL 拼接 / 上游解析
│           └── file-logger.ts  # 轮转文件日志
├── config.yaml                 # YAML 配置示例
├── static-demo/                # 静态文件服务 Demo
├── deploy/                     # Docker + PM2 部署配置
└── .env                        # 环境变量
```

## YAML 配置示例

```yaml
# config.yaml
port: 3000

proxies:
  # 静态站点
  - name: 前端 SPA
    path_prefix: /
    upstream_url: ""
    static_dir: ./static-demo
    index: index.html
    cache_ttl: 3600

  # 天地图 — 负载均衡 8 个子域名
  - name: 天地图瓦片
    path_prefix: /tdt/
    upstream_urls:
      - https://t0.tianditu.gov.cn
      - https://t1.tianditu.gov.cn
      # ... t2 ~ t7
    lb_strategy: random
    upstream_host: t0.tianditu.gov.cn
    strip_prefix: true
    cache_ttl: 3600
    injections:
      - into: query
        name: tk
        value: "${TDT_API_KEY}"
```

## YAML 配置字段

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `name` | string | — | 代理名称 |
| `path_prefix` | string | — | 路径前缀 |
| `upstream_url` | string | — | 上游地址（单域名，静态模式可留空） |
| `upstream_host` | string | — | 上游 Host header |
| `upstream_urls` | string[] | — | 多上游负载均衡地址 |
| `lb_strategy` | string | `random` | 负载均衡策略：`random` 或 `rr` |
| `strip_prefix` | bool | `true` | 转发时剥离路径前缀 |
| `static_dir` | string | — | 静态文件目录（设置后忽略 upstream_url） |
| `index` | string | `index.html` | 默认首页，也作为 SPA fallback |
| `cache_ttl` | number | `0` | 缓存秒数，0=不缓存 |
| `rate_limit_req` | number | `0` | 速率限制请求数，0=不限 |
| `rate_limit_window` | number | `60` | 速率限制窗口秒数 |
| `injections` | array | — | 请求注入规则（支持 `${VAR}` 和 `${VAR:-default}`） |
| `access` | array | — | IP 访问控制 |
| `tls_ciphers` | string | — | 自定义 TLS 密码套件 |
| `tls_servername` | string | — | TLS SNI |
| `hostname` | string | — | 按 Host 匹配（虚拟主机） |
| `listen_port` | number | — | 按端口匹配 |

## Docker 部署

```bash
# 构建镜像
docker build -f deploy/Dockerfile.yaml -t proxy-server .

# 运行
docker run -d --name proxy \
  -p 3000:3000 \
  -v ./config.yaml:/app/config.yaml:ro \
  -v ./static-demo:/app/www:ro \
  -e CONFIG_FILE=/app/config.yaml \
  proxy-server

# Compose 一键启动
cd deploy && docker-compose up -d
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PROXY_PORT` | 3000 | 代理引擎端口 |
| `NODE_ENV` | development | 生产设 `production`（影响日志级别和错误详情） |
| `LOG_DIR` | ./data/logs | 日志目录 |
| `LOG_RETENTION_DAYS` | 30 | 日志保留天数 |
| `DATA_DIR` | ./data | 数据目录 |
| `TDT_API_KEY` | — | 天地图 API 密钥（YAML 中引用 `${TDT_API_KEY}`） |

环境变量加载优先级：**系统环境变量 > `.env` 文件 > 代码默认值**。

## 安全特性

| 特性 | 说明 |
|------|------|
| 请求体限制 | 代理转发默认上限 10 MB，超限返回 413 |
| 路径遍历防护 | 静态文件服务拒绝 `../` 等路径穿越攻击 |
| Header 注入防护 | 注入值自动过滤 `\r\n` 控制字符 |
| 错误信息 | 生产环境 (`NODE_ENV=production`) 不暴露内部错误详情 |
| 信号处理 | SIGINT/SIGTERM 优雅关闭：drain 连接 → flush 日志 |
