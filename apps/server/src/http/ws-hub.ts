import type WebSocket from 'ws';

/**
 * 浏览器 ← 后端 的实时推送通道。
 * 后端状态变化通过 broadcast 推给所有已连接的面板页面。
 */
export type HubEvent =
  | { type: 'status'; status: string }
  | { type: 'progress'; payload: Record<string, unknown> }
  | { type: 'log'; line: string }
  | { type: 'tokens'; payload: unknown };

export class WsHub {
  private clients = new Set<WebSocket>();

  add(ws: WebSocket): void {
    this.clients.add(ws);
    ws.on('close', () => this.clients.delete(ws));
  }

  broadcast(ev: HubEvent): void {
    const data = JSON.stringify(ev);
    for (const ws of this.clients) {
      if (ws.readyState === 1 /* OPEN */) ws.send(data);
    }
  }
}
