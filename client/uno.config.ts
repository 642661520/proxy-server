import { defineConfig, presetUno, presetIcons, transformerDirectives } from 'unocss';

export default defineConfig({
  presets: [
    presetUno({ dark: 'class' }),
    presetIcons({ scale: 1.2, extraProperties: { 'display': 'inline-block', 'vertical-align': 'middle' } }),
  ],
  transformers: [transformerDirectives()],
  shortcuts: {
    'btn': 'h-10 inline-flex items-center justify-center gap-2 px-4 rounded-lg font-medium transition-all duration-200 cursor-pointer border-none outline-none text-sm select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    'btn-primary': 'btn bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    'btn-secondary': 'btn bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-700',
    'btn-danger': 'btn bg-red-600 text-white hover:bg-red-700',
    'btn-ghost': 'btn bg-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
    'btn-sm': 'h-8 px-3 text-xs',
    'input': 'h-10 w-full px-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500',
    'card': 'bg-white rounded-xl border border-slate-200 p-6 dark:bg-slate-800 dark:border-slate-700',
    'table-th': 'px-4 py-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider',
    'table-td': 'px-4 py-3 text-sm text-slate-700 dark:text-slate-200',
    // Status badges
    'badge-success': 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'badge-error': 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'badge-default': 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  },
});