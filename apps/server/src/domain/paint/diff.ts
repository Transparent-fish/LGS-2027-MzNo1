import type { Board } from './board.js';
import type { PaintPixel } from './paintTypes.js';

/**
 * 计算目标版面与当前版面的差异。
 * 结果会被绘画调度器转换为发送队列。
 */
export function diffBoard(target: Board, current: Board, threshold = 0): PaintPixel[] {
    void target;
    void current;
    void threshold;
    throw new Error('diffBoard is not implemented');
}
