import type { PaintPixel } from './paintTypes.js';

/**
 * 绘画任务队列。
 * 用于管理待发送、待重试和已完成的像素任务。
 */
export interface PaintQueue {
    push(pixel: PaintPixel): void;
    shift(): PaintPixel | undefined;
    clear(): void;
    size(): number;
}

/**
 * 创建绘画任务队列。
 * 先保留最小接口，具体实现后续补充。
 */
export function createPaintQueue(): PaintQueue {
    throw new Error('createPaintQueue is not implemented');
}
