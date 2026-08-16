<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { usePaintStore } from '../stores/paint';
import { useTokensStore } from '../stores/tokens';

const message = useMessage();
const tokensStore = useTokensStore();
const paint = usePaintStore();

const tokenId = ref<string | null>(null);
const imagePath = ref('');
const mode = ref<'paint' | 'guard'>('paint');
const starting = ref(false);

const progress = computed(() => paint.progress);
const percent = computed(() => {
    const value = progress.value;
    if (value.total <= 0) return 0;
    return Math.round((value.painted / value.total) * 100);
});

onMounted(() => {
    void tokensStore.refresh();
});

async function handleStart(): Promise<void> {
    if (!tokenId.value) {
        message.warning('请先选择 Token');
        return;
    }

    const trimmed = imagePath.value.trim();
    if (!trimmed) {
        message.warning('请填写目标图片路径');
        return;
    }

    starting.value = true;
    try {
        const result = await paint.start({
            tokenId: tokenId.value,
            imagePath: trimmed,
            mode: mode.value,
        });
        if (result.ok) message.success('开始绘画');
        else message.error(result.message ?? '启动失败');
    } finally {
        starting.value = false;
    }
}

async function handleStop(): Promise<void> {
    const result = await paint.stop();
    if (result.ok) message.info('已停止');
}

async function handlePause(): Promise<void> {
    const result = await paint.pause();
    if (result.ok) message.info('已暂停');
}

async function handleResume(): Promise<void> {
    const result = await paint.resume();
    if (result.ok) message.info('已恢复');
}
</script>

<template>
    <div class="page-shell">
        <section class="page-shell__header">
            <div>
                <h1 class="page-shell__title">绘画控制台</h1>
                <p class="page-shell__subtitle">选择 Token、指定目标图像，控制绘画流程与运行状态。</p>
            </div>
            <n-tag :type="paint.statusTagType" round size="small">
                {{ progress.status }}
            </n-tag>
        </section>

        <section class="panel">
            <div class="panel__header">
                <div>
                    <h2 class="panel__title">控制台</h2>
                    <p class="panel__description">启动前先确认 Token 可用，并填写本机可访问的目标图片路径。</p>
                </div>
            </div>

            <n-form label-placement="left" label-width="100">
                <n-form-item label="Token">
                    <n-select
                        v-model:value="tokenId"
                        clearable
                        placeholder="选择绘画用 Token"
                        :options="tokensStore.tokenOptions"
                    />
                </n-form-item>

                <n-form-item label="图片路径">
                    <n-input v-model:value="imagePath" placeholder="目标图片路径（本机绝对路径）" />
                </n-form-item>

                <n-form-item label="模式">
                    <n-segmented v-model:value="mode" :options="paint.modeOptions" />
                </n-form-item>

                <n-form-item label="操作">
                    <n-space>
                        <n-button type="primary" :loading="starting" :disabled="progress.status === 'running'" @click="handleStart">
                            开始绘画
                        </n-button>
                        <n-button :disabled="progress.status === 'idle'" @click="handleStop">停止</n-button>
                        <n-button v-if="progress.status === 'running'" @click="handlePause">暂停</n-button>
                        <n-button v-if="progress.status === 'paused'" @click="handleResume">恢复</n-button>
                    </n-space>
                </n-form-item>
            </n-form>
        </section>

        <section class="metrics-grid">
            <article class="panel metric">
                <div class="metric__label">进度</div>
                <n-progress type="line" :percentage="percent" :show-indicator="true" />
                <dl class="metric__list">
                    <div><dt>状态</dt><dd>{{ progress.status }}</dd></div>
                    <div><dt>队列长度</dt><dd>{{ progress.queueLength }}</dd></div>
                    <div><dt>已画</dt><dd>{{ progress.painted }} / {{ progress.total }}</dd></div>
                    <div><dt>失败</dt><dd>{{ progress.failed }}</dd></div>
                </dl>
            </article>

            <article class="panel metric">
                <div class="metric__label">连接</div>
                <dl class="metric__list">
                    <div>
                        <dt>上游连接</dt>
                        <dd>
                            <n-tag :type="paint.connected ? 'success' : 'error'" round size="small">
                                {{ paint.connected ? '已连接' : '未连接' }}
                            </n-tag>
                        </dd>
                    </div>
                    <div><dt>Token 数量</dt><dd>{{ tokensStore.tokens.length }}</dd></div>
                    <div><dt>任务状态</dt><dd>{{ progress.status }}</dd></div>
                    <div><dt>等待队列</dt><dd>{{ progress.queueLength }}</dd></div>
                </dl>
            </article>
        </section>

        <section class="panel">
            <div class="panel__header">
                <div>
                    <h2 class="panel__title">运行日志</h2>
                    <p class="panel__description">显示后端推送的状态与调度日志。</p>
                </div>
            </div>

            <div class="log-panel">
                <div v-for="(line, index) in paint.logs" :key="`${index}-${line}`" class="log-panel__line">{{ line }}</div>
                <div v-if="paint.logs.length === 0" class="log-panel__empty">暂无日志</div>
            </div>
        </section>
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
    letter-spacing: 0;
    color: #111827;
}

.page-shell__subtitle {
    margin: 8px 0 0;
    color: #6b7280;
    line-height: 1.6;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.panel {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
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

.metric__label {
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
}

.metric__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
    margin: 16px 0 0;
}

.metric__list div {
    display: grid;
    gap: 4px;
}

.metric__list dt {
    color: #6b7280;
    font-size: 12px;
}

.metric__list dd {
    margin: 0;
    color: #111827;
    font-size: 14px;
    font-weight: 600;
}

.log-panel {
    min-height: 220px;
    max-height: 320px;
    overflow: auto;
    padding: 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
    color: #334155;
}

.log-panel__line {
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
}

.log-panel__empty {
    color: #9ca3af;
}

@media (max-width: 960px) {
    .metrics-grid {
        grid-template-columns: 1fr;
    }

    .page-shell__header,
    .panel__header {
        flex-direction: column;
        align-items: flex-start;
    }

    .metric__list {
        grid-template-columns: 1fr;
    }
}
</style>
