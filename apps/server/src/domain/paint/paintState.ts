import type { PaintProgress, PaintStatus } from './paintTypes.js';

/**
 * 绘画状态快照。
 * 将调度过程中的统计信息集中保存，便于对外输出进度。
 */
export interface PaintState {
    status: PaintStatus;
    total: number;
    painted: number;
    failed: number;
    queueLength: number;
    lastError?: string;
    ackCounts: Record<number, number>;
}

/**
 * 创建默认绘画状态。
 * 这个状态会作为调度器启动时的初始快照。
 */
export function createPaintState(): PaintState {
    throw new Error('createPaintState is not implemented');
}

/**
 * 将内部状态转换为前端展示进度。
 * 方便 controller 或 websocket hub 直接输出。
 */
export function toPaintProgress(state: PaintState): PaintProgress {
    void state;
    throw new Error('toPaintProgress is not implemented');
}
