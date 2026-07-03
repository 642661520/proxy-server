<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api';
import { t } from '@/locale';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const form = ref({ username: 'admin', password: '' });
const error = ref('');
const loading = ref(false);

async function login() {
  if (!form.value.username || !form.value.password) { error.value = t.auth.emptyFields; return; }
  loading.value = true; error.value = '';
  try { await auth.login(form.value.username, form.value.password); const redirect = route.query.redirect as string; router.push(redirect || '/'); }
  catch (e: any) { error.value = e.response?.data?.error || t.auth.loginFailed; }
  finally { loading.value = false; }
}
</script>

<template>
  <div class="card w-full max-w-sm mx-auto">
    <div class="text-center mb-6">
      <span class="i-mdi-router-wireless text-5xl text-blue-600 dark:text-blue-400" />
      <h2 class="text-xl font-bold mt-2 text-slate-800 dark:text-slate-100">{{ t.app.name }}</h2>
      <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">{{ t.app.subtitle }}</p>
    </div>
    <div v-if="error" class="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{{ error }}</div>
    <form @submit.prevent="login" class="space-y-4">
      <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.auth.username }}</label><input v-model="form.username" class="input" :placeholder="t.auth.enterUsername" autocomplete="username" /></div>
      <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.auth.password }}</label><input v-model="form.password" type="password" class="input" :placeholder="t.auth.enterPassword" autocomplete="current-password" @keyup.enter="login" /></div>
      <button type="submit" class="btn-primary w-full py-2.5" :disabled="loading">{{ loading ? t.auth.loggingIn : t.auth.login }}</button>
    </form>
  </div>
</template>
