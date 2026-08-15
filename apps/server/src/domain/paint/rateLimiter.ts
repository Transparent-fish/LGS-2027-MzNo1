/**
 * 发包限速器。
 * 用于控制每秒发送的绘画包数量，避免触发上游限制。
 */
export interface RateLimiter {
    tryAcquire(): boolean;
    reset(): void;
}

/**
 * 创建限速器。
 * 当前仅保留签名，具体令牌桶逻辑后续补充。
 */
export function createRateLimiter(maxPacketsPerSec: number): RateLimiter {
    void maxPacketsPerSec;
    throw new Error('createRateLimiter is not implemented');
}
