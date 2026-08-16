import { describe, expect, it } from 'vitest';
import { createWsReconnectManager } from './ws-reconnect.js';

describe('ws-reconnect', () => {
    it('指数退避，从初始延迟翻倍直至上限', () => {
        const manager = createWsReconnectManager(1000, 10000);
        expect(manager.nextDelayMs()).toBe(1000);
        expect(manager.nextDelayMs()).toBe(2000);
        expect(manager.nextDelayMs()).toBe(4000);
        expect(manager.nextDelayMs()).toBe(8000);
        expect(manager.nextDelayMs()).toBe(10000);
        expect(manager.nextDelayMs()).toBe(10000);
    });

    it('reset 回到初始延迟', () => {
        const manager = createWsReconnectManager(500, 8000);
        manager.nextDelayMs();
        manager.nextDelayMs();
        manager.reset();
        expect(manager.nextDelayMs()).toBe(500);
    });

    it('disable 后不再重连', () => {
        const manager = createWsReconnectManager(1000, 10000);
        expect(manager.shouldReconnect()).toBe(true);
        manager.disable();
        expect(manager.shouldReconnect()).toBe(false);
    });
});
