import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api';
export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '');
    const user = ref(null);
    const isLoggedIn = computed(() => !!token.value);
    async function login(username, password) {
        const res = await api.post('/auth/login', { username, password });
        token.value = res.data.token;
        user.value = res.data.user;
        localStorage.setItem('token', token.value);
        return res.data;
    }
    async function fetchMe() {
        if (!token.value)
            return;
        try {
            const res = await api.get('/auth/me');
            user.value = res.data.user;
        }
        catch {
            logout();
        }
    }
    function logout() {
        token.value = '';
        user.value = null;
        localStorage.removeItem('token');
    }
    return { token, user, isLoggedIn, login, fetchMe, logout };
});
