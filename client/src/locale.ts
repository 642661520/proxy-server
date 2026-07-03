// 全局字典 — 所有界面文案统一管理
export const t = {
  app: { name: 'Proxy Manager', subtitle: '代理管理系统' },
  auth: { login: '登录', loggingIn: '登录中...', username: '用户名', password: '密码', enterUsername: '请输入用户名', enterPassword: '请输入密码', loginFailed: '用户名或密码错误', emptyFields: '请输入用户名和密码', logout: '退出', changePassword: '修改密码', oldPassword: '旧密码', newPassword: '新密码', passwordChanged: '密码修改成功', changeFailed: '修改失败' },

  menu: { dashboard: '仪表盘', proxies: '代理管理', injectionRules: '请求注入', access: '访问控制', health: '健康检查', logs: '请求日志' },

  proxy: { list: '代理管理', create: '创建代理', edit: '编辑代理', enabled: '启用', disabled: '禁用', start: '启用', stop: '停用', editBtn: '编辑', deleteBtn: '删除', deleteConfirm: '确定删除此代理？', search: '搜索...', newProxy: '新建代理', back: '返回列表', save: '保存', saving: '保存中...', cancel: '取消', saveFailed: '保存失败',
    name: '名称', namePlaceholder: '如：天地图瓦片', desc: '描述', descPlaceholder: '代理用途说明', pathPrefix: '代理路径前缀', pathPrefixPlaceholder: '/tianditu/', upstreamUrl: '上游URL', upstreamUrlPlaceholder: 'https://t0.tianditu.gov.cn', upstreamHost: '上游 Host 头', upstreamHostPlaceholder: '留空从URL提取', tlsPreset: 'TLS 预设', connectTimeout: '连接超时 (ms)', requestTimeout: '请求超时 (ms)', stripPrefix: '剥离路径前缀',
    tlsDefault: '系统默认', tlsChrome: 'Chrome-like', tlsFirefox: 'Firefox-like',
    cacheTtl: '缓存 TTL (秒)', rateLimitReq: '限流 (请求数)', rateLimitWindow: '限流窗口 (秒)',
  },

  injectionRule: { list: '请求注入', create: '创建注入规则', createBtn: '新建规则', name: '名称', namePlaceholder: '如：天地图 tk', value: '注入值', valuePlaceholder: '需要注入的明文值', showValue: '显示', injectInto: '注入位置', injectName: '参数名', injectNamePlaceholder: '如 tk / X-API-Key', proxyId: '关联代理', proxyIdPlaceholder: '留空匹配所有代理', queryParam: 'Query 参数', header: 'Header', created: '注入规则创建成功！注入值：', createdNote: '此值仅显示一次，请立即保存', fillAll: '请填写完整信息', createFailed: '创建失败', deleteFailed: '删除失败', yes: '是', no: '否', allProxies: '所有代理' },

  access: { list: '访问控制', create: '创建访问规则', createBtn: '新建规则', type: '类型', blacklist: '黑名单', whitelist: '白名单', ipCidr: 'IP/CIDR', ipPlaceholder: '如 192.168.1.0/24', proxyId: '关联代理ID', proxyIdPlaceholder: '留空全局生效' },

  health: { list: '健康检查', healthy: '正常', unhealthy: '异常', error: '错误', unknown: '未知', responseTime: '响应时间', lastCheck: '最近检查', noData: '暂无健康检查数据' },

  logs: { list: '请求日志', exportCsv: '导出 CSV', method: '方法', statusCode: '状态码', proxyId: '代理ID' },


  dashboard: { title: '仪表盘', activeProxies: '活跃代理', todayRequests: '今日请求', cacheHitRate: '缓存命中率', errorRate: '错误率', health: '代理健康状态', recentLogs: '最近请求', noData: '暂无数据' },

  common: { noData: '暂无数据', total: '共', records: '条', confirm: '确定', required: '*', loading: '加载中...', backHome: '返回首页', notFound: '页面未找到', themeToggle: '切换主题', lightMode: '浅色模式', darkMode: '深色模式', admin: '管理员' },
};
