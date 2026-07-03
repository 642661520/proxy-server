import { ref, onMounted, h } from 'vue';
import { api } from '@/api';
import AppTable from '@/components/AppTable.vue';
import AppModal from '@/components/AppModal.vue';
import { t } from '@/locale';
const rules = ref([]);
const proxies = ref([]);
const showModal = ref(false);
const form = ref({ name: '', key_value: '', inject_into: 'query', inject_name: '', proxy_id: '' });
const proxyNameMap = ref({});
const cols = [
    { key: 'name', title: t.injectionRule.name, width: '130px' },
    { key: 'inject_into', title: t.injectionRule.injectInto, width: '90px', render: (r) => h('span', { class: 'badge-default' }, r.inject_into) },
    { key: 'inject_name', title: t.injectionRule.injectName, width: '120px' },
    { key: 'proxy_id', title: t.injectionRule.proxyId, width: '120px', render: (r) => r.proxy_id ? (proxyNameMap.value[r.proxy_id] || `#${r.proxy_id}`) : t.injectionRule.allProxies },
    { key: 'enabled', title: t.proxy.enabled, width: '60px', render: (r) => h('span', { class: r.enabled ? 'badge-success' : 'badge-default' }, r.enabled ? t.injectionRule.yes : t.injectionRule.no) },
    { key: 'actions', title: '操作', width: '60px', render: (r) => h('button', { class: 'btn-ghost btn-sm', onClick: () => remove(r.id) }, h('span', { class: 'i-mdi-delete text-base text-red-500' })) },
];
async function load() {
    try {
        const [k, p] = await Promise.all([api.get('/injection-rules'), api.get('/proxies')]);
        rules.value = k.data.data;
        proxies.value = p.data.data || [];
        proxyNameMap.value = {};
        for (const px of proxies.value)
            proxyNameMap.value[px.id] = px.name;
    }
    catch (e) {
        console.error('Injection rules load failed:', e);
    }
}
async function remove(id) {
    try {
        await api.delete(`/injection-rules/${id}`);
        load();
    }
    catch (e) {
        console.error('Delete injection rule failed:', e);
    }
}
function openModal() {
    form.value = { name: '', key_value: '', inject_into: 'query', inject_name: '', proxy_id: '' };
    showModal.value = true;
}
async function create() {
    if (!form.value.name || !form.value.key_value || !form.value.inject_name) {
        alert(t.injectionRule.fillAll);
        return;
    }
    try {
        const r = await api.post('/injection-rules', form.value);
        alert(t.injectionRule.created + r.data.data.key_value + '\n（' + t.injectionRule.createdNote + '）');
        showModal.value = false;
        load();
    }
    catch (e) {
        alert(e.response?.data?.error || t.injectionRule.createFailed);
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
(__VLS_ctx.t.injectionRule.list);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openModal) },
    ...{ class: "btn-primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
    ...{ class: "i-mdi-plus text-lg" },
});
(__VLS_ctx.t.injectionRule.createBtn);
/** @type {[typeof AppTable, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppTable, new AppTable({
    columns: (__VLS_ctx.cols),
    data: (__VLS_ctx.rules),
}));
const __VLS_1 = __VLS_0({
    columns: (__VLS_ctx.cols),
    data: (__VLS_ctx.rules),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {[typeof AppModal, typeof AppModal, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(AppModal, new AppModal({
    modelValue: (__VLS_ctx.showModal),
}));
const __VLS_4 = __VLS_3({
    modelValue: (__VLS_ctx.showModal),
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
__VLS_5.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_5.slots;
    (__VLS_ctx.t.injectionRule.create);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300" },
});
(__VLS_ctx.t.injectionRule.name);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-red-500" },
});
(__VLS_ctx.t.common.required);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "input" },
    placeholder: (__VLS_ctx.t.injectionRule.namePlaceholder),
});
(__VLS_ctx.form.name);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300" },
});
(__VLS_ctx.t.injectionRule.value);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-red-500" },
});
(__VLS_ctx.t.common.required);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "input" },
    type: "password",
    placeholder: (__VLS_ctx.t.injectionRule.valuePlaceholder),
});
(__VLS_ctx.form.key_value);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300" },
});
(__VLS_ctx.t.injectionRule.injectInto);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.inject_into),
    ...{ class: "input" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "query",
});
(__VLS_ctx.t.injectionRule.queryParam);
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "header",
});
(__VLS_ctx.t.injectionRule.header);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300" },
});
(__VLS_ctx.t.injectionRule.injectName);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-red-500" },
});
(__VLS_ctx.t.common.required);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "input" },
    placeholder: (__VLS_ctx.t.injectionRule.injectNamePlaceholder),
});
(__VLS_ctx.form.inject_name);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300" },
});
(__VLS_ctx.t.injectionRule.proxyId);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.proxy_id),
    ...{ class: "input" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
(__VLS_ctx.t.injectionRule.allProxies);
for (const [p] of __VLS_getVForSourceType((__VLS_ctx.proxies))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (p.id),
        value: (String(p.id)),
    });
    (p.name);
    (p.id);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.create) },
    ...{ class: "btn-primary w-full" },
});
(__VLS_ctx.t.injectionRule.create);
var __VLS_5;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['i-mdi-plus']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-300']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-300']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppTable: AppTable,
            AppModal: AppModal,
            t: t,
            rules: rules,
            proxies: proxies,
            showModal: showModal,
            form: form,
            cols: cols,
            openModal: openModal,
            create: create,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
