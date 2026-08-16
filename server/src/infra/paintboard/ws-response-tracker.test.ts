import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWsResponseTracker } from './ws-response-tracker.js';
import type { AckPacket } from '../../domain/protocol/types.js';

const ACK: AckPacket = { paintId: 1, code: 0xef };

describe('ws-response-tracker', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('register 后 tryResolve 解析对应 Promise', async () => {
        const tracker = createWsResponseTracker();
        const promise = tracker.register(1, 1000);
        expect(tracker.tryResolve(1, ACK)).toBe(true);
        await expect(promise).resolves.toEqual(ACK);
    });

    it('未注册的 paintId 返回 false', () => {
        const tracker = createWsResponseTracker();
        expect(tracker.tryResolve(99, ACK)).toBe(false);
    });

    it('超时后 reject 并清理', async () => {
        vi.useFakeTimers();
        const tracker = createWsResponseTracker();
        const promise = tracker.register(2, 50);
        expect(tracker.pendingCount()).toBe(1);

        vi.advanceTimersByTime(60);
        await expect(promise).rejects.toThrow('回执超时');
        expect(tracker.pendingCount()).toBe(0);
    });

    it('remove 主动拒绝并清理', async () => {
        const tracker = createWsResponseTracker();
        const promise = tracker.register(3, 1000);
        tracker.remove(3);
        await expect(promise).rejects.toThrow('已主动移除');
        expect(tracker.pendingCount()).toBe(0);
    });
});
