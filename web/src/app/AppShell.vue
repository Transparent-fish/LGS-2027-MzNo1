<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu } from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import { navItems } from './navItems';
import { usePaintStore } from '../stores/paint';

const route = useRoute();
const router = useRouter();
const paint = usePaintStore();

const activeKey = computed(() => route.path);

const options: MenuOption[] = navItems.map((item) => ({
    ...item,
    label: () => h('span', item.label as string),
}));

function onSelect(key: string): void {
    router.push(key);
}

onMounted(() => {
    paint.attachHub();
    void paint.refreshStatus();
});

onBeforeUnmount(() => {
    paint.detachHub();
});
</script>

<template>
    <n-config-provider :inline-theme-disabled="false">
        <n-message-provider>
            <n-layout has-sider class="shell">
                <n-layout-sider bordered :width="220" :native-scrollbar="false" class="shell__sider">
                    <div class="shell__brand">LGS Paintboard</div>
                    <n-menu
                        :options="options"
                        :value="activeKey"
                        :default-value="'/dashboard'"
                        :root-indent="8"
                        :indent="16"
                        @update:value="onSelect"
                    />
                </n-layout-sider>

                <n-layout>
                    <n-layout-header bordered class="shell__header">
                        <span class="shell__header-text">绘版控制面板</span>
                        <n-tag :type="paint.connected ? 'success' : 'error'" round size="small">
                            {{ paint.connected ? '已连接' : '未连接' }}
                        </n-tag>
                    </n-layout-header>

                    <n-layout-content class="shell__content" content-style="padding: 24px;">
                        <router-view />
                    </n-layout-content>
                </n-layout>
            </n-layout>
        </n-message-provider>
    </n-config-provider>
</template>

<style scoped>
.shell {
    min-height: 100vh;
}

.shell__sider {
    display: flex;
    flex-direction: column;
}

.shell__brand {
    padding: 18px 16px;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
}

.shell__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 56px;
}

.shell__header-text {
    color: #374151;
    font-size: 14px;
    font-weight: 600;
}

.shell__content {
    background: #f3f4f6;
}
</style>
