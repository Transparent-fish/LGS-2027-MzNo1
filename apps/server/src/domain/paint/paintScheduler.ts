import type { PaintProgress, PaintStartInput } from './paintTypes.js';
import type { PaintQueue } from './paintQueue.js';
import type { PaintState } from './paintState.js';

/**
 * 绘画调度器。
 * 负责组织启动、暂停、恢复、停止和进度查询。
 */
export interface PaintScheduler {
    start(input: PaintStartInput): Promise<void>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    progress(): PaintProgress;
    state(): PaintState;
}

/**
 * 创建绘画调度器。
 * 调度器后续将接入任务队列、回执表、速率限制和上游连接。
 */
export function createPaintScheduler(queue: PaintQueue): PaintScheduler {
    void queue;
    throw new Error('createPaintScheduler is not implemented');
}
