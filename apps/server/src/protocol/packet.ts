import { OP, OP_LEN } from './opcode.js';

/**
 * 粘包拆解器。
 * 服务端将所有二进制信息拼接发送，一条消息可能含多个包单元。
 * 用内部 Buffer 累积，按「首字节操作码 → 查表长度 → 切片」循环消费。
 * 拆包与组包均在这里，发送逻辑在 pipeline/painter.ts。
 */

export interface PaintEvent {
  op: typeof OP.PAINT_EVENT;
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
}

export interface AckEvent {
  op: typeof OP.ACK;
  id: number;
  code: number;
}

export type ParsedPacket = PaintEvent | AckEvent | { op: typeof OP.PING };

export class PacketParser {
  private buf = Buffer.alloc(0);

  /** 追加一段原始数据，返回拆出的所有包单元 */
  push(data: Buffer): ParsedPacket[] {
    this.buf = this.buf.length === 0 ? Buffer.from(data) : Buffer.concat([this.buf, data]);
    const out: ParsedPacket[] = [];
    for (;;) {
      if (this.buf.length < 1) break;
      const op = this.buf[0];
      const len = OP_LEN[op];
      if (len === undefined) {
        // 未知操作码：丢弃首字节，避免死循环
        this.buf = this.buf.subarray(1);
        continue;
      }
      if (this.buf.length < len) break; // 等下一帧
      const unit = this.buf.subarray(0, len);
      this.buf = this.buf.subarray(len);
      const parsed = parseUnit(op, unit);
      if (parsed) out.push(parsed);
    }
    return out;
  }
}

function parseUnit(op: number, unit: Buffer): ParsedPacket | null {
  switch (op) {
    case OP.PING:
      return { op: OP.PING };
    case OP.PAINT_EVENT: {
      return {
        op: OP.PAINT_EVENT,
        x: unit.readUInt16LE(1),
        y: unit.readUInt16LE(3),
        r: unit.readUInt8(5),
        g: unit.readUInt8(6),
        b: unit.readUInt8(7),
      };
    }
    case OP.ACK:
      return { op: OP.ACK, id: unit.readUInt32LE(1), code: unit.readUInt8(5) };
    default:
      return null;
  }
}

/** 组 0xfe 绘画请求包，31 字节 */
export function buildPaintPacket(args: {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  uid: number;
  paintKey: string; // UUID 字符串（32 hex）
  paintId: number; // 绘图识别码 Uint32
}): Buffer {
  const { x, y, r, g, b, uid, paintKey, paintId } = args;
  const buf = Buffer.alloc(31);
  buf.writeUInt8(OP.PAINT_REQ, 0);
  buf.writeUInt16LE(x, 1);
  buf.writeUInt16LE(y, 3);
  buf.writeUInt8(r, 5);
  buf.writeUInt8(g, 6);
  buf.writeUInt8(b, 7);
  // uid 拆成三个 Uint8（低 24 位）
  buf.writeUInt8(uid & 0xff, 8);
  buf.writeUInt8((uid >> 8) & 0xff, 9);
  buf.writeUInt8((uid >> 16) & 0xff, 10);
  // Token：UUID，去除连字符后按 hex 写入 16 字节
  const hex = paintKey.replace(/-/g, '');
  if (hex.length !== 32) throw new Error(`invalid paintKey: ${paintKey}`);
  const tokenBytes = Buffer.from(hex, 'hex');
  tokenBytes.copy(buf, 11);
  // 识别码
  buf.writeUInt32LE(paintId, 27);
  return buf;
}
