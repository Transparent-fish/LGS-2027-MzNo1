import { opcode } from './opcode.js';
import type { AckCode } from './opcode.js';
import type { AckPacket, PaintOperation, PixelEvent } from './types.js';

/**
 * 解析后的协议包。
 */
export interface ParsedPacket {
    op: number;
    payload: Uint8Array;
}

/**
 * 协议包编解码器。
 * 负责把像素任务编码成上游可识别的二进制数据，并拆解粘包。
 */
export interface PacketCodec {
    encodePaintRequest(op: PaintOperation): Uint8Array;
    decodeChunks(buffer: Uint8Array): ParsedPacket[];
    decodeAck(packet: ParsedPacket): AckPacket | undefined;
    decodePixelEvent(packet: ParsedPacket): PixelEvent | undefined;
}

function writeUint16LE(target: Uint8Array, offset: number, value: number): void {
    target[offset] = value & 0xff;
    target[offset + 1] = (value >> 8) & 0xff;
}

function writeUint32LE(target: Uint8Array, offset: number, value: number): void {
    target[offset] = value & 0xff;
    target[offset + 1] = (value >> 8) & 0xff;
    target[offset + 2] = (value >> 16) & 0xff;
    target[offset + 3] = (value >> 24) & 0xff;
}

function readUint16LE(buffer: Uint8Array, offset: number): number {
    return buffer[offset] | (buffer[offset + 1] << 8);
}

function readUint32LE(buffer: Uint8Array, offset: number): number {
    return (
        buffer[offset]
        | (buffer[offset + 1] << 8)
        | (buffer[offset + 2] << 16)
        | (buffer[offset + 3] << 24)
    ) >>> 0;
}

/**
 * 将 UUID 字符串编码为 16 字节二进制。
 * 按 docs/api.md：去掉横线后每两个 hex 字符转一个字节。
 */
function encodeToken(token: string): Uint8Array {
    const hex = token.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i += 1) {
        const pair = hex.slice(i * 2, i * 2 + 2);
        bytes[i] = pair ? Number.parseInt(pair, 16) : 0;
    }
    return bytes;
}

/**
 * 创建协议包编解码器。
 */
export function createPacketCodec(): PacketCodec {
    return {
        encodePaintRequest(op) {
            const buffer = new Uint8Array(31);
            buffer[0] = opcode.paintRequest;
            writeUint16LE(buffer, 1, op.x);
            writeUint16LE(buffer, 3, op.y);
            buffer[5] = op.r;
            buffer[6] = op.g;
            buffer[7] = op.b;

            const uidBytes = [op.uid & 0xff, (op.uid >> 8) & 0xff, (op.uid >> 16) & 0xff];
            buffer.set(uidBytes, 8);

            buffer.set(encodeToken(op.token), 11);

            writeUint32LE(buffer, 27, op.paintId);
            return buffer;
        },

        decodeChunks(buffer) {
            const packets: ParsedPacket[] = [];
            let offset = 0;

            while (offset < buffer.length) {
                const op = buffer[offset];

                if (op === opcode.ping) {
                    packets.push({ op, payload: buffer.slice(offset, offset + 1) });
                    offset += 1;
                    continue;
                }

                if (op === opcode.paintEvent) {
                    if (offset + 8 > buffer.length) {
                        break;
                    }
                    packets.push({ op, payload: buffer.slice(offset + 1, offset + 8) });
                    offset += 8;
                    continue;
                }

                if (op === opcode.ack) {
                    if (offset + 6 > buffer.length) {
                        break;
                    }
                    packets.push({ op, payload: buffer.slice(offset + 1, offset + 6) });
                    offset += 6;
                    continue;
                }

                break;
            }

            return packets;
        },

        decodeAck(packet) {
            if (packet.op !== opcode.ack || packet.payload.length < 5) {
                return undefined;
            }

            return {
                paintId: readUint32LE(packet.payload, 0),
                code: packet.payload[4] as AckCode,
            };
        },

        decodePixelEvent(packet) {
            if (packet.op !== opcode.paintEvent || packet.payload.length < 7) {
                return undefined;
            }

            return {
                x: readUint16LE(packet.payload, 0),
                y: readUint16LE(packet.payload, 2),
                r: packet.payload[4] ?? 0,
                g: packet.payload[5] ?? 0,
                b: packet.payload[6] ?? 0,
            };
        },
    };
}
