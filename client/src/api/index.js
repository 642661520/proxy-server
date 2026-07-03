import axios from 'axios';
export const api = axios.create({
    baseURL: '/api/v1',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
api.interceptors.response.use((res) => res, (err) => {
    if (err.response?.status === 401) {
        localStorage.removeItem('token');
        const currentHash = window.location.hash;
        if (!currentHash.includes('#/login')) {
            window.location.hash = '#/login';
        }
    }
    // For 403, 429, 500 etc — let the caller handle, but ensure message is available
    return Promise.reject(err);
});
