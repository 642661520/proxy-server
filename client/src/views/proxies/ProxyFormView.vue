<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '@/api';
import { t } from '@/locale';

const router = useRouter();
const route = useRoute();
const isEdit = !!route.params.id;
const loading = ref(false);
const form = ref({ name: '', description: '', path_prefix: '/tianditu/', upstream_url: 'https://t0.tianditu.gov.cn', upstream_host: '', enabled: true, strip_prefix: true, tls_ciphers: '', tls_servername: '', tls_reject_unauthorized: true, connect_timeout: 10000, timeout: 30000, allowed_methods: 'GET,POST,PUT,DELETE,PATCH,HEAD,OPTIONS', cache_ttl: 0, rate_limit_req: 0, rate_limit_window: 60 });
const tlsPresets = [{ label: t.proxy.tlsDefault, value: '' },{ label: t.proxy.tlsChrome, value: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS' },{ label: t.proxy.tlsFirefox, value: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS:!SHA1' }];

onMounted(async () => { if (isEdit) { try { const p = (await api.get(`/proxies/${route.params.id}`)).data.data; form.value = { ...form.value, ...p, enabled: !!p.enabled, strip_prefix: !!p.strip_prefix, tls_reject_unauthorized: !!p.tls_reject_unauthorized }; } catch (e: any) { console.error('Load proxy failed:', e); } } });
async function submit() {
  loading.value = true;
  try { const d = { ...form.value, enabled: form.value.enabled ? 1 : 0, strip_prefix: form.value.strip_prefix ? 1 : 0, tls_reject_unauthorized: form.value.tls_reject_unauthorized ? 1 : 0 }; isEdit ? await api.put(`/proxies/${route.params.id}`, d) : await api.post('/proxies', d); router.push('/proxies'); }
  catch (e: any) { alert(e.response?.data?.error || t.proxy.saveFailed); }
  finally { loading.value = false; }
}
</script>

<template>
  <div class="max-w-2xl">
    <button class="btn-ghost btn-sm mb-4 text-slate-500 dark:text-slate-400" @click="router.push('/proxies')"><span class="i-mdi-arrow-left text-lg" /> {{ t.proxy.back }}</button>
    <h2 class="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">{{ isEdit ? t.proxy.edit : t.proxy.create }}</h2>
    <form @submit.prevent="submit" class="card space-y-5">
      <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.name }} <span class="text-red-500">{{ t.common.required }}</span></label><input v-model="form.name" class="input" :placeholder="t.proxy.namePlaceholder" required /></div>
      <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.desc }}</label><textarea v-model="form.description" class="input" rows="2" :placeholder="t.proxy.descPlaceholder" /></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.pathPrefix }} <span class="text-red-500">{{ t.common.required }}</span></label><input v-model="form.path_prefix" class="input" :placeholder="t.proxy.pathPrefixPlaceholder" required /></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.upstreamUrl }} <span class="text-red-500">{{ t.common.required }}</span></label><input v-model="form.upstream_url" class="input" :placeholder="t.proxy.upstreamUrlPlaceholder" required /></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.upstreamHost }}</label><input v-model="form.upstream_host" class="input" :placeholder="t.proxy.upstreamHostPlaceholder" /></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.tlsPreset }}</label><select v-model="form.tls_ciphers" class="input"><option v-for="p in tlsPresets" :key="p.value" :value="p.value">{{ p.label }}</option></select></div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.connectTimeout }}</label><input v-model.number="form.connect_timeout" type="number" class="input" /></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.requestTimeout }}</label><input v-model.number="form.timeout" type="number" class="input" /></div>
      </div>
      <div class="flex items-center gap-6">
        <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.enabled" type="checkbox" class="w-4 h-4 rounded" /><span class="text-sm text-slate-600 dark:text-slate-300">{{ t.proxy.enabled }}</span></label>
        <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.strip_prefix" type="checkbox" class="w-4 h-4 rounded" /><span class="text-sm text-slate-600 dark:text-slate-300">{{ t.proxy.stripPrefix }}</span></label>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.cacheTtl }}</label><input v-model.number="form.cache_ttl" type="number" class="input" placeholder="0" min="0" /><p class="text-xs text-slate-500 mt-1">0 = 不缓存</p></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.rateLimitReq }}</label><input v-model.number="form.rate_limit_req" type="number" class="input" placeholder="0" min="0" /><p class="text-xs text-slate-500 mt-1">0 = 不限流</p></div>
        <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.proxy.rateLimitWindow }}</label><input v-model.number="form.rate_limit_window" type="number" class="input" placeholder="60" min="1" /></div>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? t.proxy.saving : t.proxy.save }}</button>
        <button type="button" class="btn-secondary" @click="router.push('/proxies')">{{ t.proxy.cancel }}</button>
      </div>
    </form>
  </div>
</template>
