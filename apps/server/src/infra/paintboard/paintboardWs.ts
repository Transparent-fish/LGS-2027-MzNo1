import type { ParsedPacket } from '../../domain/protocol/packetCodec.js';

/**
 * 上游绘版 WebSocket 客户端。
 * 负责连接、重连、收包和发送二进制数据。
 */
export interface PaintboardWsClient {
    connected(): boolean;
    start(): void;
    stop(): void;
    send(buffer: Uint8Array): void;
    onPacket(handler: (packet: ParsedPacket) => void): void;
}

/**
 * 创建上游 WebSocket 客户端。
 * 这里只保留接口，后续再补重连和协议处理。
 */
export function createPaintboardWsClient(url: string): PaintboardWsClient {
    void url;
    throw new Error('createPaintboardWsClient is not implemented');
}
