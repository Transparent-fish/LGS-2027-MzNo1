import { createApp } from 'vue';
import { createPinia } from 'pinia';
import naive from 'naive-ui';
import AppShell from './app/AppShell.vue';
import { router } from './router';

createApp(AppShell).use(createPinia()).use(naive).use(router).mount('#app');
