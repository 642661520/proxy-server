<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import AppTable from '@/components/AppTable.vue';
import { t } from '@/locale';

const router = useRouter();
const proxies = ref<any[]>([]);
const search = ref('');
let searchTimer: ReturnType<typeof setTimeout> | null = null;

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => load(), 300);
}

const columns = [
  { key: 'id', title: 'ID', width: '50px' },
  { key: 'name', title: t.proxy.name, width: '140px' },
  { key: 'upstream_url', title: t.proxy.upstreamUrl, width: '200px' },
  { key: 'path_prefix', title: t.proxy.pathPrefix, width: '100px' },
  { key: 'enabled', title: t.proxy.enabled, width: '70px', render: (r: any) => h('span', { class: r.enabled ? 'badge-success' : 'badge-default' }, r.enabled ? t.proxy.enabled : t.proxy.disabled) },
  { key: 'created_at', title: '创建时间', width: '150px' },
  { key: 'actions', title: '操作', width: '150px',
    render: (row: any) => h('div', { class: 'flex gap-2' }, [
      h('button', { class: 'btn-ghost btn-sm', onClick: () => router.push(`/proxies/${row.id}/edit`), title: t.proxy.editBtn }, h('span', { class: 'i-mdi-pencil text-base' })),
      h('button', { class: 'btn-ghost btn-sm', onClick: () => toggle(row), title: row.enabled ? t.proxy.stop : t.proxy.start }, h('span', { class: row.enabled ? 'i-mdi-pause text-base' : 'i-mdi-play text-base' })),
      h('button', { class: 'btn-ghost btn-sm', onClick: () => remove(row.id), title: t.proxy.deleteBtn }, h('span', { class: 'i-mdi-delete text-base text-red-500' })),
    ]),
  },
];

async function load() {
  try {
    const r = await api.get('/proxies', { params: { search: search.value || undefined } });
    proxies.value = r.data.data || [];
  } catch (e: any) {
    console.error('Proxy list load failed:', e);
    proxies.value = [];
  }
}
async function toggle(row: any) {
  try { await api.patch(`/proxies/${row.id}/toggle`); load(); }
  catch (e: any) { console.error('Toggle proxy failed:', e); }
}
async function remove(id: number) {
  if (confirm(t.proxy.deleteConfirm)) {
    try { await api.delete(`/proxies/${id}`); load(); }
    catch (e: any) { console.error('Delete proxy failed:', e); }
  }
}
onMounted(load);
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ t.proxy.list }}</h2>
      <div class="flex flex-wrap gap-3 w-full sm:w-auto">
        <input v-model="search" class="input w-full sm:w-48" :placeholder="t.proxy.search" @input="onSearchInput" />
        <button class="btn-primary whitespace-nowrap" @click="router.push('/proxies/create')"><span class="i-mdi-plus text-lg" /> {{ t.proxy.newProxy }}</button>
      </div>
    </div>
    <AppTable :columns="columns" :data="proxies" />
  </div>
</template>
