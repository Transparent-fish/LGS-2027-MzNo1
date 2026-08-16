import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWsRateLimiter } from './ws-rate-limiter.js';

describe('ws-rate-limiter', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('初始桶满时允许连续消耗 maxPacketsPerSec 次', () => {
        const limiter = createWsRateLimiter(10);
        for (let i = 0; i < 10; i += 1) {
            expect(limiter.tryAcquire()).toBe(true);
        }
        expect(limiter.tryAcquire()).toBe(false);
    });

    it('按时间补充令牌', () => {
        vi.useFakeTimers();
        const limiter = createWsRateLimiter(10);
        for (let i = 0; i < 10; i += 1) {
            limiter.tryAcquire();
        }
        expect(limiter.tryAcquire()).toBe(false);

        vi.advanceTimersByTime(1000);
        expect(limiter.tryAcquire()).toBe(true);
    });

    it('补充后不超过桶容量上限', () => {
        vi.useFakeTimers();
        const limiter = createWsRateLimiter(10);
        for (let i = 0; i < 10; i += 1) {
            limiter.tryAcquire();
        }
        vi.advanceTimersByTime(5000);
        for (let i = 0; i < 10; i += 1) {
            expect(limiter.tryAcquire()).toBe(true);
        }
        expect(limiter.tryAcquire()).toBe(false);
    });

    it('reset 立即恢复满桶', () => {
        const limiter = createWsRateLimiter(5);
        for (let i = 0; i < 5; i += 1) {
            limiter.tryAcquire();
        }
        expect(limiter.tryAcquire()).toBe(false);
        limiter.reset();
        expect(limiter.tryAcquire()).toBe(true);
    });
});
