// PM2 Ecosystem 配置文件
// 生产部署:
//   Web 模式:  pm2 start deploy/pm2.config.cjs
//   YAML 模式: pm2 start deploy/pm2.config.cjs --only proxy-yaml
//
// 构建前端（Web 模式需要）:
//   cd client && npm run build

module.exports = {
  apps: [
    // ─── Web 管理模式 ───
    {
      name: 'proxy-server',
      cwd: './server',
      script: 'node',
      args: '--import tsx src/index.ts',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        ADMIN_PORT: 3001,
        PROXY_PORT: 3000,
      },
      error_file: './data/logs/pm2-error.log',
      out_file: './data/logs/pm2-out.log',
      merge_logs: true,
      max_memory_restart: '512M',
    },

    // ─── YAML 纯服务端模式（按需启用） ───
    {
      name: 'proxy-yaml',
      cwd: './server',
      script: 'node',
      args: '--import tsx src/start-yaml.ts --config=../proxy-server.yaml',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './data/logs/pm2-yaml-error.log',
      out_file: './data/logs/pm2-yaml-out.log',
      merge_logs: true,
      max_memory_restart: '512M',
    },

    // ─── 前端预览（开发/演示用） ───
    {
      name: 'proxy-client',
      cwd: './client',
      script: 'npx',
      args: 'vite preview --port 4173 --host',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
