import { ref, onMounted } from 'vue';
import { api } from '@/api';
import AppTable from '@/components/AppTable.vue';
import { t } from '@/locale';
const logs = ref([]);
const page = ref(1);
const total = ref(0);
const filters = ref({ method: '', statusCode: '', proxyId: '' });
let filterTimer = null;
function onFilterInput() {
    if (filterTimer)
        clearTimeout(filterTimer);
    filterTimer = setTimeout(() => { page.value = 1; load(); }, 300);
}
const cols = [
    { key: 'proxy_id', title: '代理', width: '50px' }, { key: 'request_method', title: t.logs.method, width: '60px' },
    { key: 'request_path', title: '路径', width: '180px' }, { key: 'status_code', title: t.logs.statusCode, width: '60px' },
    { key: 'response_time_ms', title: '耗时', width: '70px' }, { key: 'cache_hit', title: '缓存', width: '50px', render: (r) => r.cache_hit ? '✓' : '✗' },
    { key: 'client_ip', title: 'IP', width: '130px' }, { key: 'created_at', title: '时间', width: '160px' }, { key: 'error_message', title: '错误', width: '120px' },
];
async function load() {
    try {
        const p = { page: page.value, pageSize: 50 };
        if (filters.value.method)
            p.method = filters.value.method;
        if (filters.value.statusCode)
            p.statusCode = filters.value.statusCode;
        if (filters.value.proxyId)
            p.proxyId = filters.value.proxyId;
        const r = await api.get('/logs', { params: p });
        logs.value = r.data.data;
        total.value = r.data.total;
    }
    catch (e) {
        console.error('Logs load failed:', e);
    }
}
function onPageChange(p) { page.value = p; load(); }
function exportCsv() {
    const p = new URLSearchParams();
    if (filters.value.proxyId)
        p.set('proxyId', filters.value.proxyId);
    const token = localStorage.getItem('token');
    if (token)
        p.set('token', token);
    window.open(`/api/v1/logs/export?${p.toString()}`, '_blank');
}
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between mb-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-xl font-bold text-slate-800 dark:text-slate-100" },
});
(__VLS_ctx.t.logs.list);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.exportCsv) },
    ...{ class: "btn-secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
    ...{ class: "i-mdi-download text-lg" },
});
(__VLS_ctx.t.logs.exportCsv);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex gap-3 mb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (__VLS_ctx.onFilterInput) },
    ...{ class: "input w-24" },
    placeholder: (__VLS_ctx.t.logs.method),
});
(__VLS_ctx.filters.method);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (__VLS_ctx.onFilterInput) },
    ...{ class: "input w-24" },
    placeholder: (__VLS_ctx.t.logs.statusCode),
});
(__VLS_ctx.filters.statusCode);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (__VLS_ctx.onFilterInput) },
    ...{ class: "input w-24" },
    placeholder: (__VLS_ctx.t.logs.proxyId),
});
(__VLS_ctx.filters.proxyId);
/** @type {[typeof AppTable, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppTable, new AppTable({
    ...{ 'onUpdate:pagination': {} },
    columns: (__VLS_ctx.cols),
    data: (__VLS_ctx.logs),
    pagination: ({ page: __VLS_ctx.page, pageSize: 50, total: __VLS_ctx.total }),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onUpdate:pagination': {} },
    columns: (__VLS_ctx.cols),
    data: (__VLS_ctx.logs),
    pagination: ({ page: __VLS_ctx.page, pageSize: 50, total: __VLS_ctx.total }),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    'onUpdate:pagination': ((p) => __VLS_ctx.onPageChange(p.page))
};
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['i-mdi-download']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['w-24']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['w-24']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['w-24']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppTable: AppTable,
            t: t,
            logs: logs,
            page: page,
            total: total,
            filters: filters,
            onFilterInput: onFilterInput,
            cols: cols,
            onPageChange: onPageChange,
            exportCsv: exportCsv,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
