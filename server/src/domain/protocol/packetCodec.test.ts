import { describe, expect, it } from 'vitest';
import { createPacketCodec } from './packetCodec.js';
import { opcode } from './opcode.js';
import type { PaintOperation } from './types.js';

const UUID_TOKEN = '12345678-9abc-def0-1234-56789abcdef0';

function makeOperation(overrides: Partial<PaintOperation> = {}): PaintOperation {
    return {
        x: 100,
        y: 200,
        r: 10,
        g: 20,
        b: 30,
        uid: 0x123456,
        token: UUID_TOKEN,
        paintId: 0x78563412,
        ...overrides,
    };
}

describe('packetCodec.encodePaintRequest', () => {
    it('生成 31 字节的 0xfe 包', () => {
        const codec = createPacketCodec();
        const buffer = codec.encodePaintRequest(makeOperation());
        expect(buffer.length).toBe(31);
        expect(buffer[0]).toBe(opcode.paintRequest);
    });

    it('坐标与颜色使用小端序写入', () => {
        const codec = createPacketCodec();
        const buffer = codec.encodePaintRequest(makeOperation());
        expect(buffer[1]).toBe(100);
        expect(buffer[2]).toBe(0);
        expect(buffer[3]).toBe(200);
        expect(buffer[4]).toBe(0);
        expect(buffer[5]).toBe(10);
        expect(buffer[6]).toBe(20);
        expect(buffer[7]).toBe(30);
    });

    it('uid 拆成低 24 位三字节', () => {
        const codec = createPacketCodec();
        const buffer = codec.encodePaintRequest(makeOperation());
        expect(buffer[8]).toBe(0x56);
        expect(buffer[9]).toBe(0x34);
        expect(buffer[10]).toBe(0x12);
    });

    it('UUID 按 hex 解析为 16 字节', () => {
        const codec = createPacketCodec();
        const buffer = codec.encodePaintRequest(makeOperation());
        const tokenHex = UUID_TOKEN.replace(/-/g, '');
        for (let i = 0; i < 16; i += 1) {
            expect(buffer[11 + i]).toBe(Number.parseInt(tokenHex.slice(i * 2, i * 2 + 2), 16));
        }
    });

    it('识别码以 u32 小端写入', () => {
        const codec = createPacketCodec();
        const buffer = codec.encodePaintRequest(makeOperation());
        expect(buffer[27]).toBe(0x12);
        expect(buffer[28]).toBe(0x34);
        expect(buffer[29]).toBe(0x56);
        expect(buffer[30]).toBe(0x78);
    });
});

describe('packetCodec.decodeChunks', () => {
    it('拆解粘包：ping + 绘画事件 + 回执', () => {
        const codec = createPacketCodec();
        const ping = new Uint8Array([opcode.ping]);
        const event = new Uint8Array([
            opcode.paintEvent,
            0x34, 0x12, 0x78, 0x56, 0xaa, 0xbb, 0xcc,
        ]);
        const ack = new Uint8Array([
            opcode.ack,
            0x12, 0x34, 0x56, 0x78, 0xef,
        ]);

        const merged = new Uint8Array([...ping, ...event, ...ack]);
        const packets = codec.decodeChunks(merged);

        expect(packets).toHaveLength(3);
        expect(packets[0].op).toBe(opcode.ping);
        expect(packets[1].op).toBe(opcode.paintEvent);
        expect(packets[2].op).toBe(opcode.ack);
    });

    it('半包（长度不足）时停止，不越界', () => {
        const codec = createPacketCodec();
        const truncated = new Uint8Array([opcode.ack, 0x12]);
        const packets = codec.decodeChunks(truncated);
        expect(packets).toHaveLength(0);
    });
});

describe('packetCodec.decodeAck', () => {
    it('解析识别码与状态码', () => {
        const codec = createPacketCodec();
        const packet = { op: opcode.ack, payload: new Uint8Array([0x12, 0x34, 0x56, 0x78, 0xee]) };
        const ack = codec.decodeAck(packet);
        expect(ack).toEqual({ paintId: 0x78563412, code: 0xee });
    });

    it('非回执包返回 undefined', () => {
        const codec = createPacketCodec();
        const packet = { op: opcode.paintEvent, payload: new Uint8Array(7) };
        expect(codec.decodeAck(packet)).toBeUndefined();
    });
});

describe('packetCodec.decodePixelEvent', () => {
    it('解析坐标与颜色', () => {
        const codec = createPacketCodec();
        const packet = {
            op: opcode.paintEvent,
            payload: new Uint8Array([0x34, 0x12, 0x78, 0x56, 0xaa, 0xbb, 0xcc]),
        };
        const event = codec.decodePixelEvent(packet);
        expect(event).toEqual({ x: 0x1234, y: 0x5678, r: 0xaa, g: 0xbb, b: 0xcc });
    });
});
