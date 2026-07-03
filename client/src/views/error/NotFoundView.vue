<script setup lang="ts">
import { useRouter } from 'vue-router';
import { t } from '@/locale';
const router = useRouter();
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
    <div class="text-center">
      <span class="i-mdi-alert-circle-outline text-7xl text-slate-300 dark:text-slate-500" />
      <h1 class="text-6xl font-bold text-slate-300 dark:text-slate-500 mt-2 mb-4">404</h1>
      <p class="text-slate-500 dark:text-slate-400 mb-6">{{ t.common.notFound }}</p>
      <button class="btn-primary" @click="router.push('/')">{{ t.common.backHome }}</button>
    </div>
  </div>
</template>
