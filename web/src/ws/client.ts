/**
 * 浏览器 ← 后端 实时事件订阅。
 * 开发环境经 Vite 代理 ws://127.0.0.1:8787。
 */

export type HubStatus = 'idle' | 'running' | 'paused' | 'stopping';

export type HubEvent =
  | { type: 'status'; status: HubStatus }
  | { type: 'progress'; payload: Record<string, unknown> }
  | { type: 'log'; line: string }
  | { type: 'tokens'; payload: unknown };

export class HubClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectDelay = 1000;
  private handlers = new Set<(ev: HubEvent) => void>();

  on(handler: (ev: HubEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  off(handler: (ev: HubEvent) => void): void {
    this.handlers.delete(handler);
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    this.ws = new WebSocket(`${proto}://${location.host}/ws`);
    this.ws.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data as string) as HubEvent;
        for (const h of this.handlers) h(ev);
      } catch {
        // 忽略解析失败
      }
    };
    this.ws.onclose = () => {
      this.ws = null;
      this.scheduleReconnect();
    };
    this.ws.onerror = () => this.ws?.close();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
      this.connect();
    }, this.reconnectDelay);
  }

  close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  disconnect(): void {
    this.close();
  }
}

export const hub = new HubClient();
