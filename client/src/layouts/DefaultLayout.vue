<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterView, useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/hooks/useTheme';
import { api } from '@/api';
import AppModal from '@/components/AppModal.vue';
import { t } from '@/locale';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { isDark, toggle: toggleTheme } = useTheme();
const sidebarCollapsed = ref(true);   // 默认折叠（移动端友好）
const mobileOpen = ref(false);
const showPwdModal = ref(false);
const pwdOk = ref(false);
const pwdForm = ref({ oldPassword: '', newPassword: '' });
const pwdError = ref('');

const menuRoutes = (router.options.routes.find(r => r.path === '/')?.children || [])
  .filter(r => !r.meta?.hidden);

const activeMenu = computed(() => route.path === '/' ? '/' : '/' + route.path.split('/')[1]);

function go(path: string) { router.push(path); mobileOpen.value = false; }
function logout() { authStore.logout(); router.push('/login'); }

function openPwdModal() { pwdForm.value = { oldPassword: '', newPassword: '' }; pwdError.value = ''; pwdOk.value = false; showPwdModal.value = true; }
async function changePwd() {
  if (!pwdForm.value.oldPassword || !pwdForm.value.newPassword) { pwdError.value = '请填写旧密码和新密码'; return; }
  try { await api.put('/auth/password', pwdForm.value); pwdOk.value = true; pwdError.value = ''; }
  catch (e: any) { pwdError.value = e.response?.data?.error || t.auth.changeFailed; }
}

const icons: Record<string, string> = {
  'speedometer-outline': 'i-mdi-speedometer', 'server-outline': 'i-mdi-server',
  'key-outline': 'i-mdi-key-variant',
  'shield-outline': 'i-mdi-shield-outline', 'pulse-outline': 'i-mdi-pulse',
  'document-text-outline': 'i-mdi-file-document-outline',
};
</script>

<template>
  <div class="min-h-screen flex bg-slate-100 dark:bg-slate-900">

    <!-- Mobile overlay -->
    <div v-if="mobileOpen" class="fixed inset-0 bg-black/40 z-40 lg:hidden" @click="mobileOpen = false" />

    <!-- Sidebar -->
    <aside
      class="fixed left-0 top-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-200 z-50 w-56"
      :class="mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-56'"
    >
      <div class="flex items-center h-14 px-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <span class="i-mdi-router-wireless text-2xl text-blue-600 dark:text-blue-400 shrink-0" />
        <span class="ml-3 font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis text-slate-800 dark:text-slate-100">{{ t.app.name }}</span>
      </div>
      <nav class="flex-1 py-2 overflow-y-auto">
        <button v-for="r in menuRoutes" :key="r.path" @click="go('/' + r.path.replace(/^\/?/, ''))"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
          :class="activeMenu === '/' + r.path.replace(/^\/?/, '')
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold border-r-2 border-blue-600 dark:border-blue-400'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'">
          <span :class="[icons[r.meta?.icon as string] || 'i-mdi-circle-outline', 'text-xl shrink-0']" />
          <span class="whitespace-nowrap overflow-hidden text-ellipsis">{{ r.meta?.title }}</span>
        </button>
      </nav>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col lg:ml-56 min-w-0">
      <header class="sticky top-0 h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 z-30">
        <!-- Hamburger (mobile) -->
        <button class="btn-ghost btn-sm lg:hidden -ml-1" @click="mobileOpen = !mobileOpen">
          <span class="i-mdi-menu text-2xl text-slate-500" />
        </button>
        <h1 class="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate flex-1 ml-2 lg:ml-0">{{ route.meta?.title || '' }}</h1>
        <div class="flex items-center gap-1 sm:gap-3">
          <button class="btn-ghost btn-sm" @click="toggleTheme" :title="t.common.themeToggle">
            <span v-if="isDark" class="i-mdi-white-balance-sunny text-xl text-amber-400" />
            <span v-else class="i-mdi-weather-night text-xl text-slate-500" />
          </button>
          <button class="btn-ghost btn-sm hidden sm:flex" @click="openPwdModal" :title="t.auth.changePassword">
            <span class="i-mdi-lock-outline text-lg text-slate-500 hover:text-slate-600" />
          </button>
          <span class="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">{{ authStore.user?.display_name || t.common.admin }}</span>
          <button class="btn-ghost btn-sm" @click="logout" :title="t.auth.logout"><span class="i-mdi-logout text-xl" /></button>
        </div>
      </header>
      <main class="flex-1 p-4 sm:p-6"><RouterView /></main>

      <!-- Password modal -->
      <AppModal v-model="showPwdModal"><template #title>{{ t.auth.changePassword }}</template>
        <div class="space-y-4">
          <div v-if="pwdError" class="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-sm text-red-600 dark:text-red-400">{{ pwdError }}</div>
          <div v-if="pwdOk" class="px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-sm text-green-600 dark:text-green-400">{{ t.auth.passwordChanged }}</div>
          <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.auth.oldPassword }}</label><input v-model="pwdForm.oldPassword" type="password" class="input" autocomplete="current-password" /></div>
          <div><label class="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{{ t.auth.newPassword }}</label><input v-model="pwdForm.newPassword" type="password" class="input" autocomplete="new-password" /></div>
          <button class="btn-primary w-full" @click="changePwd">{{ t.auth.changePassword }}</button>
        </div>
      </AppModal>
    </div>
  </div>
</template>
