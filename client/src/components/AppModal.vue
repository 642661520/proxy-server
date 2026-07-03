<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>();
function close() { emit('update:modelValue', false); }
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="close">
      <div class="absolute inset-0 bg-black/50" />
      <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100"><slot name="title" /></h3>
          <button class="btn-ghost btn-sm" @click="close"><span class="i-mdi-close text-xl" /></button>
        </div>
        <div class="px-6 py-4 text-slate-700 dark:text-slate-200 overflow-y-auto flex-1"><slot /></div>
      </div>
    </div>
  </Teleport>
</template>
