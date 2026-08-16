import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: '/dashboard' },
        { path: '/dashboard', name: 'dashboard', component: () => import('./pages/DashboardPage.vue') },
        { path: '/tokens', name: 'tokens', component: () => import('./pages/TokensPage.vue') },
    ],
});
