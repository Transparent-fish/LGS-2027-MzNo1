/**
 * 上游绘版 HTTP 客户端。
 * 负责获取版面和申请 PaintKey。
 */
export interface PaintboardHttpClient {
    getBoard(): Promise<Uint8Array>;
    getToken(input: { uid: number; accessKey: string }): Promise<{ token?: string }>;
}

/**
 * 创建上游 HTTP 客户端。
 * 当前仅保留接口，后续再补 fetch 封装。
 */
export function createPaintboardHttpClient(apiBase: string): PaintboardHttpClient {
    void apiBase;
    throw new Error('createPaintboardHttpClient is not implemented');
}
