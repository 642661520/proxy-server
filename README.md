# Proxy Server

YAML 驱动的反向代理服务器 — 基于 Node.js 内置 TLS 栈绕过 WAF 指纹检测，支持静态文件服务和上游转发。

## 为什么用它

传统反向代理（Nginx、Caddy）的 TLS 指纹（JA3/JA4）容易被云 WAF 识别和拦截。Node.js 内置 `http`/`https` 模块的 TLS 指纹与浏览器一致，可绕过华为 CloudWAF 等 JA3 检测。

## 快速开始

```bash
# 安装
cd server && npm install

# 启动
npx tsx server/src/index.ts --config=config.yaml
```

代理引擎默认监听 `:3000`（可通过 `PROXY_PORT` 环境变量或 YAML `port` 字段修改）。

## 配置示例

```yaml
# config.yaml
port: 3000

proxies:
  # 静态站点 — 类似 nginx root
  - name: 前端 SPA
    path_prefix: /
    static_dir: ./static-demo
    index: index.html
    cache_ttl: 3600

  # 天地图瓦片 — 负载均衡 8 个子域名绕过浏览器并发限制
  - name: 天地图
    path_prefix: /tdt/
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
    strip_prefix: true
    cache_ttl: 3600
    injections:
      - into: query
        name: tk
        value: "${TDT_API_KEY}"
```

## 配置字段

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `name` | string | — | 代理名称 |
| `path_prefix` | string | — | 路径前缀 |
| `upstream_url` | string | — | 上游地址（静态模式可留空） |
| `upstream_host` | string | — | 上游 Host header |
| `upstream_urls` | string[] | — | 多上游负载均衡地址 |
| `lb_strategy` | string | `random` | 负载策略：`random` / `rr` |
| `strip_prefix` | bool | `true` | 转发时剥离路径前缀 |
| `static_dir` | string | — | 静态文件目录 |
| `index` | string | `index.html` | 默认首页 + SPA fallback |
| `cache_ttl` | number | `0` | 缓存秒数，0=不缓存 |
| `rate_limit_req` | number | `0` | 限流请求数，0=不限 |
| `rate_limit_window` | number | `60` | 限流窗口秒数 |
| `injections` | array | — | 请求注入规则 |
| `access` | array | — | IP 访问控制（CIDR） |
| `hostname` | string | — | 按 Host 匹配虚拟主机 |
| `listen_port` | number | — | 按端口匹配 |
| `tls_ciphers` | string | — | 自定义 TLS 密码套件 |
| `tls_servername` | string | — | TLS SNI |

## 核心能力

- **TLS 指纹绕过** — Node.js 内置模块指纹同浏览器，绕过 JA3 检测
- **请求注入** — YAML 定义 query/header 注入，支持 `${VAR}` 和 `${VAR:-default}`
- **静态文件服务** — MIME 识别、ETag/304、SPA fallback、路径遍历防护
- **负载均衡** — 多上游 `random` / `rr` 分流
- **热重载** — `fs.watch` 监听配置变更，原子替换路由表，无需重启
- **请求管道** — Router → AccessGuard → RateLimiter → CacheCheck → Injector/StaticFile → Forwarder → Auditor
- **零重型依赖** — 无 SQLite、无 Express，仅 6 个 npm 包

## 项目结构

```
proxy-server/
├── server/src/
│   ├── index.ts              # 入口
│   ├── config.ts             # 环境变量加载
│   ├── types.ts              # ProxyConfig 类型
│   ├── logger.ts             # Pino 日志
│   ├── proxy-engine/         # 代理引擎核心
│   │   ├── index.ts          # 请求处理管道
│   │   ├── router.ts         # 路由匹配
│   │   ├── forwarder.ts      # HTTP/HTTPS 转发 + 静态文件
│   │   ├── injector.ts       # 请求注入
│   │   ├── access-guard.ts   # IP 访问控制
│   │   ├── rate-limiter.ts   # 令牌桶限流
│   │   ├── cache-handler.ts  # LRU 内存缓存
│   │   └── auditor.ts        # 异步批量日志
│   ├── yaml-config/          # YAML 加载 + 热重载
│   └── utils/                # 工具函数
├── deploy/                   # Docker + PM2 部署
├── config.yaml               # 配置示例
└── static-demo/              # 静态文件 Demo
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PROXY_PORT` | 3000 | 代理引擎端口 |
| `NODE_ENV` | development | `production` 启用文件日志 |
| `DATA_DIR` | ./data | 数据目录 |
| `LOG_DIR` | ./data/logs | 日志目录 |
| `LOG_RETENTION_DAYS` | 30 | 日志保留天数 |
| `TDT_API_KEY` | — | 天地图密钥（YAML 中 `${TDT_API_KEY}`） |

优先级：**系统环境变量 > `.env` 文件 > 默认值**

## Docker 部署

```bash
# 构建
docker build -f deploy/Dockerfile.yaml -t proxy-server .

# 运行
docker run -d --name proxy \
  -p 3000:3000 \
  -v ./config.yaml:/app/config.yaml:ro \
  -v ./static-demo:/app/www:ro \
  -v ./data/logs:/app/data/logs \
  -e NODE_ENV=production \
  -e CONFIG_FILE=/app/config.yaml \
  proxy-server

# Compose
cd deploy && docker-compose up -d

# 查看日志
docker logs -f proxy
tail -f data/logs/access-$(date +%Y-%m-%d).log
```

## 日志

| 日志 | 路径 | 保留 |
|------|------|------|
| 系统日志 | `data/logs/server-YYYY-MM-DD.log` | `LOG_RETENTION_DAYS` 天 |
| 访问日志 | `data/logs/access-YYYY-MM-DD.log` | `LOG_RETENTION_DAYS` 天 |
| 标准输出 | stdout（Docker `docker logs`） | Docker logging driver 管理 |

## 安全特性

| 特性 | 说明 |
|------|------|
| 请求体限制 | 默认上限 10 MB，超限返回 413 |
| 路径遍历防护 | 静态文件拒绝 `../` 等穿越攻击 |
| Header 注入防护 | 注入值自动过滤 `\r\n` 控制字符 |
| 生产模式 | `NODE_ENV=production` 不暴露内部错误详情 |
| 优雅关闭 | SIGINT/SIGTERM → drain 连接 → flush 日志 |

## License

MIT
