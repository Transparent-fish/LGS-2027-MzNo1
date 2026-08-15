import type { PaintPixel } from './paintTypes.js';

/**
 * 待确认任务。
 * 用于记录已发送像素与回执识别码之间的映射关系。
 */
export interface PendingPaintTask {
    paintId: number;
    pixel: PaintPixel;
    sentAt: number;
    retries: number;
}

/**
 * 回执表。
 * 管理识别码与待处理任务的对应关系。
 */
export interface AckTable {
    add(task: PendingPaintTask): void;
    take(paintId: number): PendingPaintTask | undefined;
    clear(): void;
    size(): number;
}

/**
 * 创建回执表。
 * 后续可接入 Map 作为具体实现。
 */
export function createAckTable(): AckTable {
    throw new Error('createAckTable is not implemented');
}
