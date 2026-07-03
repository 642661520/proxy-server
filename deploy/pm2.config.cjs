// PM2 Ecosystem 配置文件
// 生产部署:
//   pm2 start deploy/pm2.config.cjs
//
// 或指定仅启动代理:
//   pm2 start deploy/pm2.config.cjs --only proxy-yaml

module.exports = {
  apps: [
    // ─── YAML 纯服务端模式 ───
    {
      name: 'proxy-yaml',
      cwd: './server',
      script: 'node',
      args: '--import tsx src/index.ts --config=../config.yaml',
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
  ],
};
