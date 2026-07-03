import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import BlankLayout from '@/layouts/BlankLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: BlankLayout,
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/views/login/LoginView.vue'),
      },
    ],
  },
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '仪表盘', icon: 'speedometer-outline' },
      },
      {
        path: 'proxies',
        name: 'Proxies',
        component: () => import('@/views/proxies/ProxyListView.vue'),
        meta: { title: '代理管理', icon: 'server-outline' },
      },
      {
        path: 'proxies/create',
        name: 'ProxyCreate',
        component: () => import('@/views/proxies/ProxyFormView.vue'),
        meta: { title: '创建代理', hidden: true },
      },
      {
        path: 'proxies/:id/edit',
        name: 'ProxyEdit',
        component: () => import('@/views/proxies/ProxyFormView.vue'),
        meta: { title: '编辑代理', hidden: true },
      },
      {
        path: 'injection-rules',
        name: 'InjectionRules',
        component: () => import('@/views/injection-rules/InjectionRuleView.vue'),
        meta: { title: '请求注入', icon: 'key-outline' },
      },
      {
        path: 'access',
        name: 'Access',
        component: () => import('@/views/access/AccessControlView.vue'),
        meta: { title: '访问控制', icon: 'shield-outline' },
      },
      {
        path: 'health',
        name: 'Health',
        component: () => import('@/views/health/HealthCheckView.vue'),
        meta: { title: '健康检查', icon: 'pulse-outline' },
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/logs/LogViewer.vue'),
        meta: { title: '请求日志', icon: 'document-text-outline' },
      },

    ],
  },
  {
    path: '/:pathMatch(.*)*',
    component: BlankLayout,
    children: [
      {
        path: '',
        name: 'NotFound',
        component: () => import('@/views/error/NotFoundView.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const isLoggedIn = !!authStore.token;

  if (to.name !== 'Login' && !isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.name === 'Login' && isLoggedIn) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
