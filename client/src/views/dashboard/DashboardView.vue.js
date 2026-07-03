import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';
import AppTable from '@/components/AppTable.vue';
import { t } from '@/locale';
const summary = ref({ activeProxies: 0, totalProxies: 0, todayRequests: 0, totalRequests: 0, errorRate: 0, cacheHitRate: 0 });
const healthStatus = ref([]);
const recentLogs = ref([]);
onMounted(async () => {
    try {
        const [s, h, l] = await Promise.all([
            api.get('/stats/summary'),
            api.get('/health/status'),
            api.get('/logs', { params: { pageSize: 5 } })
        ]);
        summary.value = s.data.data;
        healthStatus.value = h.data.data || [];
        recentLogs.value = l.data.data || [];
    }
    catch (e) {
        console.error('Dashboard load failed:', e);
    }
});
const statusLabel = (s) => t.health[s] || s;
const logCols = [
    { key: 'proxy_id', title: '代理', width: '60px' }, { key: 'request_method', title: '方法', width: '60px' },
    { key: 'request_path', title: '路径', width: '180px' }, { key: 'status_code', title: '状态', width: '60px' },
    { key: 'response_time_ms', title: '耗时', width: '70px' }, { key: 'client_ip', title: 'IP', width: '130px' }, { key: 'created_at', title: '时间', width: '160px' },
];
const stats = computed(() => [
    { label: t.dashboard.activeProxies, value: `${summary.value.activeProxies} / ${summary.value.totalProxies}`, cls: 'text-blue-600 dark:text-blue-400' },
    { label: t.dashboard.todayRequests, value: summary.value.todayRequests.toLocaleString(), cls: 'text-emerald-600 dark:text-emerald-400' },
    { label: t.dashboard.cacheHitRate, value: `${summary.value.cacheHitRate}%`, cls: 'text-amber-600 dark:text-amber-400' },
    { label: t.dashboard.errorRate, value: `${summary.value.errorRate}%`, cls: summary.value.errorRate > 5 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
]);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-xl font-bold mb-6 text-slate-800 dark:text-slate-100" },
});
(__VLS_ctx.t.dashboard.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" },
});
for (const [st] of __VLS_getVForSourceType((__VLS_ctx.stats))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (st.label),
        ...{ class: "card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs text-slate-400 dark:text-slate-500 mb-1" },
    });
    (st.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-2xl font-bold" },
        ...{ class: (st.cls) },
    });
    (st.value);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "font-semibold mb-4 text-slate-700 dark:text-slate-200" },
});
(__VLS_ctx.t.dashboard.health);
if (__VLS_ctx.healthStatus.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-slate-400 text-sm" },
    });
    (__VLS_ctx.t.dashboard.noData);
}
for (const [h] of __VLS_getVForSourceType((__VLS_ctx.healthStatus))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (h.proxyId),
        ...{ class: "flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-slate-700 dark:text-slate-200" },
    });
    (h.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: (h.status === 'healthy' ? 'badge-success' : h.status === 'unhealthy' ? 'badge-error' : 'badge-default') },
    });
    (__VLS_ctx.statusLabel(h.status));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "font-semibold mb-4 text-slate-700 dark:text-slate-200" },
});
(__VLS_ctx.t.dashboard.recentLogs);
/** @type {[typeof AppTable, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppTable, new AppTable({
    columns: (__VLS_ctx.logCols),
    data: (__VLS_ctx.recentLogs),
}));
const __VLS_1 = __VLS_0({
    columns: (__VLS_ctx.logCols),
    data: (__VLS_ctx.recentLogs),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-slate-700']} */ ;
/** @type {__VLS_StyleScopedClasses['last:border-0']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-700']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-200']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppTable: AppTable,
            t: t,
            healthStatus: healthStatus,
            recentLogs: recentLogs,
            statusLabel: statusLabel,
            logCols: logCols,
            stats: stats,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
