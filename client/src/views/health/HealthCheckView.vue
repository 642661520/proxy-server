<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';
import { t } from '@/locale';

const statuses = ref<any[]>([]);
onMounted(async () => { try { statuses.value = (await api.get('/health/status')).data.data || []; } catch (e: any) { console.error('Health check load failed:', e); } });
const statusLabel = (s: string) => (t.health as any)[s] || s;
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">{{ t.health.list }}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="s in statuses" :key="s.proxyId" class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm text-slate-700 dark:text-slate-200">{{ s.name }}</h3>
          <span :class="s.status === 'healthy' ? 'badge-success' : s.status === 'unhealthy' ? 'badge-error' : 'badge-default'">{{ statusLabel(s.status) }}</span>
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <div>{{ t.health.responseTime }}: {{ s.responseTimeMs ? s.responseTimeMs + 'ms' : '-' }}</div>
          <div>{{ t.health.lastCheck }}: {{ s.lastChecked || '-' }}</div>
        </div>
      </div>
    </div>
    <div v-if="statuses.length === 0" class="text-center py-12 text-slate-500 dark:text-slate-400">{{ t.health.noData }}</div>
  </div>
</template>
