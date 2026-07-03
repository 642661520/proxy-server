<script setup lang="ts">
import { computed } from 'vue';
import { t } from '@/locale';

const props = withDefaults(defineProps<{
  columns: { key: string; title: string; width?: string; render?: (row: any) => any }[];
  data: any[];
  pagination?: { page: number; pageSize: number; total: number } | false;
}>(), { pagination: false });

const emit = defineEmits<{ 'update:pagination': [p: { page: number; pageSize: number }] }>();

function onPageChange(p: number) {
  if (props.pagination) emit('update:pagination', { page: p, pageSize: props.pagination.pageSize });
}

// Truncate pagination: show first, last, current +/- 1
const pageNumbers = computed(() => {
  if (!props.pagination) return [];
  const total = Math.ceil(props.pagination.total / props.pagination.pageSize) || 1;
  const current = props.pagination.page;
  const pages: (number | '...')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }
  return pages;
});
</script>

<template>
  <div class="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
    <div class="min-w-full inline-block align-middle">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th v-for="col in columns" :key="col.key" :style="col.width ? { minWidth: col.width } : {}" class="table-th">
              {{ col.title }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
          <tr v-for="(row, i) in data" :key="i" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <td v-for="col in columns" :key="col.key" class="table-td">
              <component v-if="col.render" :is="() => col.render!(row)" />
              <template v-else>{{ row[col.key] }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="data.length === 0" class="py-12 text-center text-sm text-slate-500 dark:text-slate-400">{{ t.common.noData }}</div>
  </div>
  <div v-if="pagination" class="flex flex-wrap items-center justify-between gap-2 mt-4 text-sm text-slate-500 dark:text-slate-400">
    <span>{{ t.common.total }} {{ pagination.total }} {{ t.common.records }}</span>
    <div class="flex gap-1 flex-wrap">
      <button
        v-for="p in pageNumbers"
        :key="p"
        :disabled="p === '...'"
        class="w-8 h-8 rounded-lg text-sm font-medium transition-colors disabled:cursor-default"
        :class="p === pagination.page ? 'bg-blue-600 text-white' : p === '...' ? 'text-slate-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'"
        @click="typeof p === 'number' && onPageChange(p)"
      >{{ p }}</button>
    </div>
  </div>
</template>
