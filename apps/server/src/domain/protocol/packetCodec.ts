import type { PaintPixel } from '../paint/paintTypes.js';

/**
 * 解析后的协议包。
 * 用于把原始 WebSocket 字节流映射为结构化事件。
 */
export interface ParsedPacket {
    op: number;
    payload: Uint8Array;
}

/**
 * 协议包编码器。
 * 负责把像素任务编码成上游可识别的二进制数据。
 */
export interface PacketCodec {
    encodePaintRequest(pixel: PaintPixel, paintId: number, uid: number, token: string): Uint8Array;
    decodeChunks(buffer: Uint8Array): ParsedPacket[];
}

/**
 * 创建协议包编解码器。
 * 当前仅保留接口，后续实现粘包拆包与组包规则。
 */
export function createPacketCodec(): PacketCodec {
    throw new Error('createPacketCodec is not implemented');
}
