/**
 * 绘画任务的像素描述。
 * 表示待发送到上游的单个像素更新。
 */
export interface PaintPixel {
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
}

/**
 * 绘画调度状态。
 * 代表当前绘画流程所处的阶段。
 */
export type PaintStatus = 'idle' | 'running' | 'paused' | 'stopping';

/**
 * 对外展示的绘画进度。
 * 前端面板依赖这个结构刷新状态。
 */
export interface PaintProgress {
    status: PaintStatus;
    total: number;
    painted: number;
    failed: number;
    ackCounts: Record<number, number>;
    queueLength: number;
    lastError?: string;
}

/**
 * 绘画控制命令。
 * 用于 controller 调度 scheduler 的输入对象。
 */
export interface PaintStartInput {
    tokenId: string;
    imagePath: string;
    mode: 'paint' | 'guard';
}
