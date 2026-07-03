import { ref, onMounted, h } from 'vue';
import { api } from '@/api';
import AppTable from '@/components/AppTable.vue';
import AppModal from '@/components/AppModal.vue';
import { t } from '@/locale';
const rules = ref([]);
const show = ref(false);
const form = ref({ rule_type: 'blacklist', pattern: '', proxy_id: '' });
const cols = [
    { key: 'rule_type', title: t.access.type, width: '90px', render: (r) => h('span', { class: r.rule_type === 'whitelist' ? 'badge-success' : 'badge-error' }, r.rule_type === 'whitelist' ? t.access.whitelist : t.access.blacklist) },
    { key: 'pattern', title: t.access.ipCidr }, { key: 'proxy_id', title: t.access.proxyId, width: '80px' },
    { key: 'actions', title: '操作', width: '60px', render: (r) => h('button', { class: 'btn-ghost btn-sm', onClick: () => remove(r.id) }, h('span', { class: 'i-mdi-delete text-base text-red-500' })) },
];
async function load() { try {
    rules.value = (await api.get('/access-rules')).data.data;
}
catch (e) {
    console.error('Access rules load failed:', e);
} }
async function remove(id) { try {
    await api.delete(`/access-rules/${id}`);
    load();
}
catch (e) {
    console.error('Delete access rule failed:', e);
} }
async function create() { try {
    await api.post('/access-rules', form.value);
    show.value = false;
    load();
}
catch (e) {
    console.error('Create access rule failed:', e);
} }
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
(__VLS_ctx.t.access.list);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.show = true;
        } },
    ...{ class: "btn-primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
    ...{ class: "i-mdi-plus text-lg" },
});
(__VLS_ctx.t.access.createBtn);
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
    modelValue: (__VLS_ctx.show),
}));
const __VLS_4 = __VLS_3({
    modelValue: (__VLS_ctx.show),
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
__VLS_5.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_5.slots;
    (__VLS_ctx.t.access.create);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300" },
});
(__VLS_ctx.t.access.type);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.rule_type),
    ...{ class: "input" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "blacklist",
});
(__VLS_ctx.t.access.blacklist);
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "whitelist",
});
(__VLS_ctx.t.access.whitelist);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300" },
});
(__VLS_ctx.t.access.ipCidr);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-red-500" },
});
(__VLS_ctx.t.common.required);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "input" },
    placeholder: (__VLS_ctx.t.access.ipPlaceholder),
});
(__VLS_ctx.form.pattern);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300" },
});
(__VLS_ctx.t.access.proxyId);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "input" },
    placeholder: (__VLS_ctx.t.access.proxyIdPlaceholder),
});
(__VLS_ctx.form.proxy_id);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.create) },
    ...{ class: "btn-primary w-full" },
});
(__VLS_ctx.t.access.create);
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
            show: show,
            form: form,
            cols: cols,
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
