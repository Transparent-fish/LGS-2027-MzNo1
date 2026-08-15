import WebSocket from 'ws';
import { PacketParser, type ParsedPacket } from './packet.js';
import { OP } from './opcode.js';

/**
 * 上游绘版 WebSocket 连接管理。
 * - URL 后缀：读写无 / 只读 ?readonly=1 / 只写 ?writeonly=1
 * - 收到 0xfc Ping 立即回 0xfb Pong
 * - 断线指数退避重连；429/1008 视为封禁，停止重连
 * - 粘包拆解后的包单元通过 onPacket 回调交给上层
 */

export type WsMode = 'readwrite' | 'readonly' | 'writeonly';

export interface WsCallbacks {
  onPacket: (p: ParsedPacket) => void;
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onFatal?: (reason: string) => void;
}

export class PaintboardWs {
  private ws: WebSocket | null = null;
  private parser = new PacketParser();
  private closed = false;
  private reconnectDelay = 1000;
  private pingTimer: NodeJS.Timeout | null = null;

  constructor(
    private baseUrl: string,
    private mode: WsMode,
    private callbacks: WsCallbacks,
    private maxReconnectSecs = 60,
  ) {}

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  start(): void {
    this.closed = false;
    this.connect();
  }

  stop(): void {
    this.closed = true;
    this.clearPingTimer();
    this.ws?.close();
    this.ws = null;
  }

  send(buf: Buffer): void {
    if (this.connected) this.ws!.send(buf);
  }

  private url(): string {
    switch (this.mode) {
      case 'readonly':
        return `${this.baseUrl}?readonly=1`;
      case 'writeonly':
        return `${this.baseUrl}?writeonly=1`;
      default:
        return this.baseUrl;
    }
  }

  private connect(): void {
    if (this.closed) return;
    const ws = new WebSocket(this.url());
    this.ws = ws;

    ws.on('open', () => {
      this.reconnectDelay = 1000;
      this.callbacks.onOpen?.();
    });

    ws.on('message', (data) => {
      const buf = data instanceof Buffer ? data : Buffer.from(data as ArrayBuffer);
      for (const p of this.parser.push(buf)) {
        if (p.op === OP.PING) {
          ws.send(Buffer.from([OP.PONG]));
          continue;
        }
        this.callbacks.onPacket(p);
      }
    });

    ws.on('close', (code, reason) => {
      this.clearPingTimer();
      this.callbacks.onClose?.(code, reason.toString());
      if (this.closed) return;
      if (code === 1008 || code === 429) {
        this.callbacks.onFatal?.(`连接被拒 (${code}: ${reason})，疑似 IP 封禁，停止重连`);
        return;
      }
      // 指数退避重连
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectSecs * 1000);
      setTimeout(() => this.connect(), this.reconnectDelay);
    });

    ws.on('error', (err) => {
      // 触发 close；此处仅记录
      this.callbacks.onClose?.(1006, err.message);
    });
  }

  private clearPingTimer(): void {
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
      this.pingTimer = null;
    }
  }
}
