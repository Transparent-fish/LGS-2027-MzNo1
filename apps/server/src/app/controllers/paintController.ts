import type { PaintScheduler } from '../../domain/paint/paintScheduler.js';

/**
 * 绘画接口控制器。
 * 负责接收启动、停止、暂停、恢复等绘画请求。
 */
export interface PaintController {
    start(body: unknown): Promise<unknown>;
    stop(): Promise<unknown>;
    pause(): Promise<unknown>;
    resume(): Promise<unknown>;
}

/**
 * 创建绘画控制器。
 * 只定义请求入口，不承载具体绘画执行逻辑。
 */
export function createPaintController(scheduler: PaintScheduler): PaintController {
    void scheduler;
    throw new Error('createPaintController is not implemented');
}
