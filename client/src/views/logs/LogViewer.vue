<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { api } from '@/api';
import AppTable from '@/components/AppTable.vue';
import { t } from '@/locale';

const logs = ref<any[]>([]); const page = ref(1); const total = ref(0); const filters = ref({ method: '', statusCode: '', proxyId: '' });
let filterTimer: ReturnType<typeof setTimeout> | null = null;

function onFilterInput() {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => { page.value = 1; load(); }, 300);
}
const cols = [
  { key: 'proxy_id', title: '代理', width: '50px' },{ key: 'request_method', title: t.logs.method, width: '60px' },
  { key: 'request_path', title: '路径', width: '180px' },{ key: 'status_code', title: t.logs.statusCode, width: '60px' },
  { key: 'response_time_ms', title: '耗时', width: '70px' },{ key: 'cache_hit', title: '缓存', width: '50px', render: (r: any) => r.cache_hit ? h('span', { class: 'badge-success' }, 'Y') : h('span', { class: 'badge-default' }, 'N') },
  { key: 'client_ip', title: 'IP', width: '130px' },{ key: 'created_at', title: '时间', width: '160px' },{ key: 'error_message', title: '错误', width: '120px' },
];
async function load() {
  try {
    const p: any = { page: page.value, pageSize: 50 };
    if (filters.value.method) p.method = filters.value.method;
    if (filters.value.statusCode) p.statusCode = filters.value.statusCode;
    if (filters.value.proxyId) p.proxyId = filters.value.proxyId;
    const r = await api.get('/logs', { params: p });
    logs.value = r.data.data;
    total.value = r.data.total;
  } catch (e: any) { console.error('Logs load failed:', e); }
}
function onPageChange(p: number) { page.value = p; load(); }
function exportCsv() {
  const p = new URLSearchParams();
  if (filters.value.proxyId) p.set('proxyId', filters.value.proxyId);
  const token = localStorage.getItem('token');
  if (token) p.set('token', token);
  window.open(`/api/v1/logs/export?${p.toString()}`, '_blank');
}
onMounted(load);
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-6">
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ t.logs.list }}</h2>
      <button class="btn-secondary" @click="exportCsv"><span class="i-mdi-download text-lg" /> {{ t.logs.exportCsv }}</button>
    </div>
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="filters.method" class="input w-24 sm:w-28" :placeholder="t.logs.method" aria-label="按方法筛选" @input="onFilterInput" />
      <input v-model="filters.statusCode" class="input w-24 sm:w-28" :placeholder="t.logs.statusCode" aria-label="按状态码筛选" @input="onFilterInput" />
      <input v-model="filters.proxyId" class="input w-24 sm:w-28" :placeholder="t.logs.proxyId" aria-label="按代理ID筛选" @input="onFilterInput" />
    </div>
    <AppTable :columns="cols" :data="logs" :pagination="{ page, pageSize: 50, total }" @update:pagination="(p) => onPageChange(p.page)" />
  </div>
</template>
