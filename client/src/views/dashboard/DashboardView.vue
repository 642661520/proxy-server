<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';
import AppTable from '@/components/AppTable.vue';
import { t } from '@/locale';

const summary = ref({ activeProxies: 0, totalProxies: 0, todayRequests: 0, totalRequests: 0, errorRate: 0, cacheHitRate: 0 });
const healthStatus = ref<any[]>([]);
const recentLogs = ref<any[]>([]);

onMounted(async () => {
  try {
    const [s, h, l] = await Promise.all([
      api.get('/stats/summary'),
      api.get('/health/status'),
      api.get('/logs', { params: { pageSize: 5 } })
    ]);
    summary.value = s.data.data;
    healthStatus.value = h.data.data || [];
    recentLogs.value = l.data.data || [];
  } catch (e: any) {
    console.error('Dashboard load failed:', e);
  }
});
const statusLabel = (s: string) => (t.health as any)[s] || s;


const logCols = [
  { key: 'proxy_id', title: '代理', width: '60px' },{ key: 'request_method', title: '方法', width: '60px' },
  { key: 'request_path', title: '路径', width: '180px' },{ key: 'status_code', title: '状态', width: '60px' },
  { key: 'response_time_ms', title: '耗时', width: '70px' },{ key: 'client_ip', title: 'IP', width: '130px' },{ key: 'created_at', title: '时间', width: '160px' },
];

const stats = computed(() => [
  { label: t.dashboard.activeProxies, value: `${summary.value.activeProxies} / ${summary.value.totalProxies}`, cls: 'text-blue-600 dark:text-blue-400' },
  { label: t.dashboard.todayRequests, value: summary.value.todayRequests.toLocaleString(), cls: 'text-emerald-600 dark:text-emerald-400' },
  { label: t.dashboard.cacheHitRate, value: `${summary.value.cacheHitRate}%`, cls: 'text-amber-600 dark:text-amber-400' },
  { label: t.dashboard.errorRate, value: `${summary.value.errorRate}%`, cls: summary.value.errorRate > 5 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
]);
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">{{ t.dashboard.title }}</h2>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div v-for="st in stats" :key="st.label" class="card"><p class="text-sm text-slate-500 dark:text-slate-400 mb-1">{{ st.label }}</p><p class="text-2xl font-bold" :class="st.cls">{{ st.value }}</p></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="font-semibold mb-4 text-slate-700 dark:text-slate-200">{{ t.dashboard.health }}</h3>
        <div v-if="healthStatus.length === 0" class="text-slate-500 text-sm">{{ t.dashboard.noData }}</div>
        <div v-for="h in healthStatus" :key="h.proxyId" class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
          <span class="text-sm text-slate-700 dark:text-slate-200">{{ h.name }}</span>
          <span :class="h.status === 'healthy' ? 'badge-success' : h.status === 'unhealthy' ? 'badge-error' : 'badge-default'">{{ statusLabel(h.status) }}</span>
        </div>
      </div>
      <div class="card"><h3 class="font-semibold mb-4 text-slate-700 dark:text-slate-200">{{ t.dashboard.recentLogs }}</h3><AppTable :columns="logCols" :data="recentLogs" /></div>
    </div>
  </div>
</template>
