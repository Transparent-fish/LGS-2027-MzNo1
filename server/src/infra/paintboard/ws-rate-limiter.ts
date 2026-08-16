/**
 * 每连接发包限速器。
 * 采用令牌桶，控制每秒发送的绘画包数量，避免触发上游 256/s 限制。
 */
export interface WsRateLimiter {
    tryAcquire(): boolean;
    reset(): void;
}

/**
 * 创建令牌桶限速器。
 */
export function createWsRateLimiter(maxPacketsPerSec: number): WsRateLimiter {
    const maxTokens = Math.max(1, maxPacketsPerSec);
    let tokens = maxTokens;
    let lastRefillAt = Date.now();

    function refill(): void {
        const now = Date.now();
        const elapsed = now - lastRefillAt;
        if (elapsed <= 0) {
            return;
        }

        const refillCount = Math.floor((elapsed / 1000) * maxTokens);
        if (refillCount <= 0) {
            return;
        }

        tokens = Math.min(maxTokens, tokens + refillCount);
        lastRefillAt = now;
    }

    return {
        tryAcquire() {
            refill();
            if (tokens <= 0) {
                return false;
            }

            tokens -= 1;
            return true;
        },
        reset() {
            tokens = maxTokens;
            lastRefillAt = Date.now();
        },
    };
}
