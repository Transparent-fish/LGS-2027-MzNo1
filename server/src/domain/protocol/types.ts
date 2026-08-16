/**
 * 绘画操作。
 * 与参考项目的 PaintOperation 对齐。
 */
export interface PaintOperation {
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    uid: number;
    token: string;
    paintId: number;
}

/**
 * 上游推送的像素事件（0xfa）。
 */
export interface PixelEvent {
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
}

/**
 * 上游回执（0xff）。
 */
export interface AckPacket {
    paintId: number;
    code: number;
}
