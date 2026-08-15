import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api, type PaintProgress } from '../api/client';
import { hub, type HubEvent } from '../ws/client';

const defaultProgress = (): PaintProgress => ({
    status: 'idle',
    total: 0,
    painted: 0,
    failed: 0,
    ackCounts: {},
    queueLength: 0,
});

export const usePaintStore = defineStore('paint', () => {
    const progress = ref<PaintProgress>(defaultProgress());
    const connected = ref(false);
    const logs = ref<string[]>([]);
    const maxLogs = 500;

    const statusTagType = computed(() => {
        switch (progress.value.status) {
            case 'running':
                return 'success';
            case 'paused':
                return 'warning';
            case 'stopping':
                return 'error';
            default:
                return 'default';
        }
    });

    const modeOptions = [
        { label: '一次画完', value: 'paint' },
        { label: '守护补画', value: 'guard' },
    ] as const;

    function pushLog(line: string): void {
        logs.value.push(line);
        if (logs.value.length > maxLogs) {
            logs.value.splice(0, logs.value.length - maxLogs);
        }
    }

    function onHubEvent(event: HubEvent): void {
        switch (event.type) {
            case 'progress':
                progress.value = { ...progress.value, ...event.payload };
                break;
            case 'log':
                pushLog(event.line);
                break;
            case 'status':
                progress.value = { ...progress.value, status: event.status };
                break;
        }
    }

    function attachHub(): void {
        hub.on(onHubEvent);
        hub.connect();
    }

    function detachHub(): void {
        hub.off(onHubEvent);
        hub.disconnect();
    }

    async function refreshStatus(): Promise<void> {
        try {
            const response = await api.status();
            progress.value = response.painter;
            connected.value = response.connected;
        } catch {
            // 后端未就绪时静默
        }
    }

    async function start(body: { tokenId: string; imagePath?: string; mode?: 'paint' | 'guard' }) {
        return api.startPaint(body);
    }

    async function stop() {
        return api.stopPaint();
    }

    async function pause() {
        return api.pausePaint();
    }

    async function resume() {
        return api.resumePaint();
    }

    return {
        progress,
        connected,
        logs,
        statusTagType,
        modeOptions,
        attachHub,
        detachHub,
        onHubEvent,
        refreshStatus,
        start,
        stop,
        pause,
        resume,
        pushLog,
    };
});
