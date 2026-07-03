<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { api } from '@/api';
import AppTable from '@/components/AppTable.vue';
import AppModal from '@/components/AppModal.vue';
import { t } from '@/locale';

const rules = ref<any[]>([]);
const proxies = ref<any[]>([]);
const showModal = ref(false);
const formError = ref('');
const formOk = ref('');
const form = ref({ name: '', key_value: '', inject_into: 'query', inject_name: '', proxy_id: '' });
const showValueId = ref<number | null>(null);

const proxyNameMap = ref<Record<number, string>>({});

const cols = [
  { key: 'name', title: t.injectionRule.name, width: '130px' },
  { key: 'inject_into', title: t.injectionRule.injectInto, width: '90px', render: (r: any) => h('span', { class: 'badge-default' }, r.inject_into) },
  { key: 'inject_name', title: t.injectionRule.injectName, width: '120px' },
  { key: 'proxy_id', title: t.injectionRule.proxyId, width: '120px', render: (r: any) => r.proxy_id ? (proxyNameMap.value[r.proxy_id] || `#${r.proxy_id}`) : t.injectionRule.allProxies },
  { key: 'enabled', title: t.proxy.enabled, width: '60px', render: (r: any) => h('span', { class: r.enabled ? 'badge-success' : 'badge-default' }, r.enabled ? t.injectionRule.yes : t.injectionRule.no) },
  { key: 'key_value', title: t.injectionRule.value, width: '100px', render: (r: any) => showValueId.value === r.id ? h('span', { class: 'text-sm font-mono text-slate-700 dark:text-slate-200' }, r.key_value) : h('button', { class: 'btn-ghost btn-sm text-xs', onClick: () => { showValueId.value = r.id; setTimeout(() => showValueId.value = null, 5000); } }, t.injectionRule.showValue || '显示') },
  { key: 'actions', title: '操作', width: '60px', render: (r: any) => h('button', { class: 'btn-ghost btn-sm', onClick: () => remove(r.id) }, h('span', { class: 'i-mdi-delete text-base text-red-500' })) },
];

async function load() {
  try {
    const [k, p] = await Promise.all([api.get('/injection-rules'), api.get('/proxies')]);
    rules.value = k.data.data;
    proxies.value = p.data.data || [];
    proxyNameMap.value = {};
    for (const px of proxies.value) proxyNameMap.value[px.id] = px.name;
  } catch (e: any) { console.error('Injection rules load failed:', e); }
}
async function remove(id: number) {
  try { await api.delete(`/injection-rules/${id}`); load(); }
  catch (e: any) { console.error('Delete injection rule failed:', e); }
}

function openModal() {
  form.value = { name: '', key_value: '', inject_into: 'query', inject_name: '', proxy_id: '' };
  formError.value = ''; formOk.value = '';
  showModal.value = true;
}

async function create() {
  formError.value = ''; formOk.value = '';
  if (!form.value.name || !form.value.key_value || !form.value.inject_name) { formError.value = t.injectionRule.fillAll; return; }
  try {
    const r = await api.post('/injection-rules', form.value);
    formOk.value = t.injectionRule.created + r.data.data.key_value + '\n（' + t.injectionRule.createdNote + '）';
    setTimeout(() => { showModal.value = false; load(); }, 2000);
  }
  catch (e: any) { formError.value = e.response?.data?.error || t.injectionRule.createFailed; }
}
onMounted(load);
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ t.injectionRule.list }}</h2>
      <button class="btn-primary" @click="openModal"><span class="i-mdi-plus text-lg" /> {{ t.injectionRule.createBtn }}</button>
    </div>
    <AppTable :columns="cols" :data="rules" />
    <AppModal v-model="showModal"><template #title>{{ t.injectionRule.create }}</template>
      <div class="space-y-4">
        <div v-if="formError" class="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-sm text-red-600 dark:text-red-400">{{ formError }}</div>
        <div v-if="formOk" class="px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-sm text-green-600 dark:text-green-400 whitespace-pre-wrap">{{ formOk }}</div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.injectionRule.name }} <span class="text-red-500">{{ t.common.required }}</span></label><input v-model="form.name" class="input" :placeholder="t.injectionRule.namePlaceholder" /></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.injectionRule.value }} <span class="text-red-500">{{ t.common.required }}</span></label><input v-model="form.key_value" class="input" type="password" :placeholder="t.injectionRule.valuePlaceholder" /></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.injectionRule.injectInto }}</label><select v-model="form.inject_into" class="input"><option value="query">{{ t.injectionRule.queryParam }}</option><option value="header">{{ t.injectionRule.header }}</option></select></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.injectionRule.injectName }} <span class="text-red-500">{{ t.common.required }}</span></label><input v-model="form.inject_name" class="input" :placeholder="t.injectionRule.injectNamePlaceholder" /></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.injectionRule.proxyId }}</label>
          <select v-model="form.proxy_id" class="input">
            <option value="">{{ t.injectionRule.allProxies }}</option>
            <option v-for="p in proxies" :key="p.id" :value="String(p.id)">{{ p.name }} (#{{ p.id }})</option>
          </select>
        </div>
        <button class="btn-primary w-full" @click="create">{{ t.injectionRule.create }}</button>
      </div>
    </AppModal>
  </div>
</template>
