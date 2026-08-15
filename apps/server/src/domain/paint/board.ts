/**
 * 1000x600 版面模型。
 * 用于保存当前画布的 RGB 像素数据。
 */
export interface Board {
    width: number;
    height: number;
    data: Uint8Array;
}

/**
 * 创建一个空白版面。
 * 未来也可以从上游缓冲区或本地快照构造。
 */
export function createBoard(width: number, height: number, data?: Uint8Array): Board {
    void width;
    void height;
    void data;
    throw new Error('createBoard is not implemented');
}
