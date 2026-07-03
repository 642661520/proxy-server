import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import '@unocss/reset/tailwind.css';
import './styles/theme.css';
import 'uno.css';
// Apply theme immediately before Vue mounts
const stored = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark');
}
else {
    document.documentElement.classList.remove('dark');
}
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
