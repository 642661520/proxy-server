<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { api } from '@/api';
import AppTable from '@/components/AppTable.vue';
import AppModal from '@/components/AppModal.vue';
import { t } from '@/locale';

const rules = ref<any[]>([]); const show = ref(false); const form = ref({ rule_type: 'blacklist', pattern: '', proxy_id: '' });
const cols = [
  { key: 'rule_type', title: t.access.type, width: '90px', render: (r: any) => h('span', { class: r.rule_type === 'whitelist' ? 'badge-success' : 'badge-error' }, r.rule_type === 'whitelist' ? t.access.whitelist : t.access.blacklist) },
  { key: 'pattern', title: t.access.ipCidr }, { key: 'proxy_id', title: t.access.proxyId, width: '80px' },
  { key: 'actions', title: '操作', width: '60px', render: (r: any) => h('button', { class: 'btn-ghost btn-sm', onClick: () => remove(r.id) }, h('span', { class: 'i-mdi-delete text-base text-red-500' })) },
];
async function load() { try { rules.value = (await api.get('/access-rules')).data.data; } catch (e: any) { console.error('Access rules load failed:', e); } }
async function remove(id: number) { try { await api.delete(`/access-rules/${id}`); load(); } catch (e: any) { console.error('Delete access rule failed:', e); } }
async function create() { try { await api.post('/access-rules', form.value); show.value = false; load(); } catch (e: any) { console.error('Create access rule failed:', e); } }
onMounted(load);
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ t.access.list }}</h2>
      <button class="btn-primary" @click="show = true"><span class="i-mdi-plus text-lg" /> {{ t.access.createBtn }}</button>
    </div>
    <AppTable :columns="cols" :data="rules" />
    <AppModal v-model="show"><template #title>{{ t.access.create }}</template>
      <div class="space-y-4">
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.access.type }}</label><select v-model="form.rule_type" class="input"><option value="blacklist">{{ t.access.blacklist }}</option><option value="whitelist">{{ t.access.whitelist }}</option></select></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.access.ipCidr }} <span class="text-red-500">{{ t.common.required }}</span></label><input v-model="form.pattern" class="input" :placeholder="t.access.ipPlaceholder" /></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.access.proxyId }}</label><input v-model="form.proxy_id" class="input" :placeholder="t.access.proxyIdPlaceholder" /></div>
        <button class="btn-primary w-full" @click="create">{{ t.access.create }}</button>
      </div>
    </AppModal>
  </div>
</template>
