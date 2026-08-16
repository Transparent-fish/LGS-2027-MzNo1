<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { NButton, NPopconfirm, NSpace, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useTokensStore } from '../stores/tokens';
import type { TokenFormState, TokenView } from '../api/client';

const message = useMessage();
const tokensStore = useTokensStore();

const showModal = ref(false);
const editingId = ref<string | null>(null);
const form = ref<TokenFormState>({ name: '', uid: 0, accessKey: '' });
const submitting = ref(false);

const modalTitle = computed(() => (editingId.value ? '编辑 Token' : '新增 Token'));

onMounted(() => {
    void tokensStore.refresh();
});

function openCreate(): void {
    editingId.value = null;
    form.value = { name: '', uid: 0, accessKey: '' };
    showModal.value = true;
}

function openEdit(token: TokenView): void {
    editingId.value = token.id;
    form.value = { name: token.name, uid: token.uid, accessKey: '' };
    showModal.value = true;
}

async function submit(): Promise<void> {
    if (!form.value.name || !form.value.uid || !form.value.accessKey) {
        message.warning('name / uid / accessKey 必填');
        return;
    }

    submitting.value = true;
    try {
        if (editingId.value) {
            const result = await tokensStore.update(editingId.value, form.value);
            if (result.ok) {
                message.success('已更新');
                showModal.value = false;
                return;
            }
            message.error(result.error ?? '更新失败');
            return;
        }

        const result = await tokensStore.add(form.value);
        if (result.ok) {
            showModal.value = false;
            if (result.paintKeyReady) message.success('已添加并获取 PaintKey');
            else message.warning(`已添加，但 PaintKey 获取失败：${result.errorType ?? result.error ?? '未知'}`);
            return;
        }

        message.error(result.error ?? '添加失败');
    } finally {
        submitting.value = false;
    }
}

async function refreshKey(id: string): Promise<void> {
    const result = await tokensStore.refreshPaintKey(id);
    if (result.ok && result.paintKeyReady) {
        message.success('PaintKey 已刷新');
        return;
    }
    message.error(`刷新失败：${result.errorType ?? result.error ?? '未知'}`);
}

async function remove(id: string): Promise<void> {
    const result = await tokensStore.remove(id);
    if (result.ok) {
        message.success('已删除');
        return;
    }
    message.error(result.error ?? '删除失败');
}

const columns: DataTableColumns<TokenView> = [
    { title: '名称', key: 'name' },
    { title: 'UID', key: 'uid' },
    {
        title: 'PaintKey',
        key: 'paintKeyReady',
        render: (row) => h('span', { class: row.paintKeyReady ? 'state state--success' : 'state state--danger' }, row.paintKeyReady ? '已获取' : '未获取'),
    },
    { title: '创建时间', key: 'createdAt' },
    { title: '最近使用', key: 'lastUsedAt', render: (row) => row.lastUsedAt ?? '—' },
    {
        title: '操作',
        key: 'actions',
        render: (row) =>
            h(
                NSpace,
                { size: 'small' },
                {
                    default: () => [
                        h(NButton, { size: 'small', onClick: () => refreshKey(row.id) }, { default: () => '刷新 PaintKey' }),
                        h(NButton, { size: 'small', onClick: () => openEdit(row) }, { default: () => '编辑' }),
                        h(
                            NPopconfirm,
                            { onPositiveClick: () => remove(row.id) },
                            {
                                trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
                                default: () => '确认删除该 Token？',
                            },
                        ),
                    ],
                },
            ),
    },
];
</script>

<template>
    <div class="page-shell">
        <section class="page-shell__header">
            <div>
                <h1 class="page-shell__title">Token 管理</h1>
                <p class="page-shell__subtitle">维护绘画 Token，支持新增、编辑、删除与 PaintKey 刷新。</p>
            </div>
            <n-button type="primary" @click="openCreate">新增 Token</n-button>
        </section>

        <section class="panel">
            <div class="panel__header">
                <div>
                    <h2 class="panel__title">已存 Token</h2>
                    <p class="panel__description">PaintKey 会在后端加密存储，列表仅显示脱敏状态。</p>
                </div>
            </div>

            <n-data-table
                :columns="columns"
                :data="tokensStore.tokens"
                :loading="tokensStore.loading"
                :pagination="{ pageSize: 10 }"
            />
        </section>

        <n-modal v-model:show="showModal" preset="card" :title="modalTitle" style="width: min(100%, 520px)">
            <n-form label-placement="left" label-width="96">
                <n-form-item label="名称">
                    <n-input v-model:value="form.name" placeholder="例如：主号" />
                </n-form-item>
                <n-form-item label="UID">
                    <n-input-number v-model:value="form.uid" :min="1" style="width: 100%" />
                </n-form-item>
                <n-form-item label="AccessKey">
                    <n-input v-model:value="form.accessKey" type="password" show-password-on="click" placeholder="编辑时留空表示不修改" />
                </n-form-item>
                <n-space justify="end">
                    <n-button @click="showModal = false">取消</n-button>
                    <n-button type="primary" :loading="submitting" @click="submit">保存</n-button>
                </n-space>
            </n-form>
        </n-modal>
    </div>
</template>

<style scoped>
.page-shell {
    display: grid;
    gap: 16px;
}

.page-shell__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.page-shell__title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
}

.page-shell__subtitle {
    margin: 8px 0 0;
    color: #6b7280;
    line-height: 1.6;
}

.panel {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.panel__header {
    margin-bottom: 16px;
}

.panel__title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
}

.panel__description {
    margin: 6px 0 0;
    color: #6b7280;
    line-height: 1.6;
}

.state {
    font-weight: 600;
}

.state--success {
    color: #1d7a46;
}

.state--danger {
    color: #b42318;
}

@media (max-width: 960px) {
    .page-shell__header {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
