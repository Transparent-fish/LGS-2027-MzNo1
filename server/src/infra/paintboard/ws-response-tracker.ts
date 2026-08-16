import type { AckPacket } from '../../domain/protocol/types.js';

interface PendingEntry {
    resolve: (packet: AckPacket) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
}

/**
 * 回执追踪器。
 * 把 paintId 映射到等待中的 Promise，收到回执时解析并清理。
 */
export interface WsResponseTracker {
    register(paintId: number, timeoutMs: number): Promise<AckPacket>;
    tryResolve(paintId: number, packet: AckPacket): boolean;
    remove(paintId: number): void;
    pendingCount(): number;
}

/**
 * 创建回执追踪器。
 */
export function createWsResponseTracker(): WsResponseTracker {
    const entries = new Map<number, PendingEntry>();

    return {
        register(paintId, timeoutMs) {
            const existing = entries.get(paintId);
            if (existing) {
                existing.resolve({ paintId, code: 0xea });
                clearTimeout(existing.timer);
            }

            return new Promise<AckPacket>((resolve, reject) => {
                const timer = setTimeout(() => {
                    entries.delete(paintId);
                    reject(new Error(`paintId ${paintId} 回执超时`));
                }, timeoutMs);

                entries.set(paintId, { resolve, reject, timer });
            });
        },

        tryResolve(paintId, packet) {
            const entry = entries.get(paintId);
            if (!entry) {
                return false;
            }

            clearTimeout(entry.timer);
            entries.delete(paintId);
            entry.resolve(packet);
            return true;
        },

        remove(paintId) {
            const entry = entries.get(paintId);
            if (entry) {
                clearTimeout(entry.timer);
                entries.delete(paintId);
                entry.reject(new Error(`paintId ${paintId} 已主动移除`));
            }
        },

        pendingCount() {
            return entries.size;
        },
    };
}
