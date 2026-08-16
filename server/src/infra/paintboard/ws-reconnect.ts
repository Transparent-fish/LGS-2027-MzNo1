/**
 * WS 重连策略。
 * 指数退避，可被禁用（例如 IP 封禁后停止重连）。
 */
export interface WsReconnectManager {
    shouldReconnect(): boolean;
    nextDelayMs(): number;
    reset(): void;
    disable(): void;
}

/**
 * 创建指数退避重连管理器。
 */
export function createWsReconnectManager(
    initialDelayMs: number,
    maxDelayMs: number,
): WsReconnectManager {
    let enabled = true;
    let currentDelayMs = initialDelayMs;

    return {
        shouldReconnect() {
            return enabled;
        },
        nextDelayMs() {
            const next = currentDelayMs;
            currentDelayMs = Math.min(currentDelayMs * 2, maxDelayMs);
            return next;
        },
        reset() {
            currentDelayMs = initialDelayMs;
        },
        disable() {
            enabled = false;
        },
    };
}
