import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import AppTable from '@/components/AppTable.vue';
import { t } from '@/locale';
const router = useRouter();
const proxies = ref([]);
const search = ref('');
let searchTimer = null;
function onSearchInput() {
    if (searchTimer)
        clearTimeout(searchTimer);
    searchTimer = setTimeout(() => load(), 300);
}
const columns = [
    { key: 'id', title: 'ID', width: '50px' },
    { key: 'name', title: t.proxy.name, width: '140px' },
    { key: 'upstream_url', title: t.proxy.upstreamUrl, width: '200px' },
    { key: 'path_prefix', title: t.proxy.pathPrefix, width: '100px' },
    { key: 'enabled', title: t.proxy.enabled, width: '70px', render: (r) => h('span', { class: r.enabled ? 'badge-success' : 'badge-default' }, r.enabled ? t.proxy.enabled : t.proxy.disabled) },
    { key: 'created_at', title: '创建时间', width: '150px' },
    { key: 'actions', title: '操作', width: '150px',
        render: (row) => h('div', { class: 'flex gap-2' }, [
            h('button', { class: 'btn-ghost btn-sm', onClick: () => router.push(`/proxies/${row.id}/edit`), title: t.proxy.editBtn }, h('span', { class: 'i-mdi-pencil text-base' })),
            h('button', { class: 'btn-ghost btn-sm', onClick: () => toggle(row), title: row.enabled ? t.proxy.stop : t.proxy.start }, h('span', { class: row.enabled ? 'i-mdi-pause text-base' : 'i-mdi-play text-base' })),
            h('button', { class: 'btn-ghost btn-sm', onClick: () => remove(row.id), title: t.proxy.deleteBtn }, h('span', { class: 'i-mdi-delete text-base text-red-500' })),
        ]),
    },
];
async function load() {
    try {
        const r = await api.get('/proxies', { params: { search: search.value || undefined } });
        proxies.value = r.data.data || [];
    }
    catch (e) {
        console.error('Proxy list load failed:', e);
        proxies.value = [];
    }
}
async function toggle(row) {
    try {
        await api.patch(`/proxies/${row.id}/toggle`);
        load();
    }
    catch (e) {
        console.error('Toggle proxy failed:', e);
    }
}
async function remove(id) {
    if (confirm(t.proxy.deleteConfirm)) {
        try {
            await api.delete(`/proxies/${id}`);
            load();
        }
        catch (e) {
            console.error('Delete proxy failed:', e);
        }
    }
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
(__VLS_ctx.t.proxy.list);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (__VLS_ctx.onSearchInput) },
    ...{ class: "input w-48" },
    placeholder: (__VLS_ctx.t.proxy.search),
});
(__VLS_ctx.search);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/proxies/create');
        } },
    ...{ class: "btn-primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
    ...{ class: "i-mdi-plus text-lg" },
});
(__VLS_ctx.t.proxy.newProxy);
/** @type {[typeof AppTable, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppTable, new AppTable({
    columns: (__VLS_ctx.columns),
    data: (__VLS_ctx.proxies),
}));
const __VLS_1 = __VLS_0({
    columns: (__VLS_ctx.columns),
    data: (__VLS_ctx.proxies),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['w-48']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['i-mdi-plus']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppTable: AppTable,
            t: t,
            router: router,
            proxies: proxies,
            search: search,
            onSearchInput: onSearchInput,
            columns: columns,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
