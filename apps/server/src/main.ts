import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { loadConfig } from './config.js';
import { createHttp } from './api/http.js';
import { PaintboardWs } from './protocol/ws.js';
import { Painter } from './pipeline/painter.js';
import { WsHub } from './http/ws-hub.js';
import { registerRoutes } from './http/routes.js';

async function main() {
  const cfg = loadConfig();
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(websocket);

  const http = createHttp(cfg.apiBase);
  const hub = new WsHub();

  // 上游连接：只读订阅绘画事件；发送逻辑由老师实现
  const upWs = new PaintboardWs(cfg.wsUrl, 'readonly', {
    onPacket: (p) => {
      if (p.op === 0xfa) {
        // TODO(老师): 更新本地版面 / 守护模式补画
      }
    },
    onOpen: () => hub.broadcast({ type: 'log', line: '[ws] 上游连接已打开' }),
    onClose: (code, reason) => hub.broadcast({ type: 'log', line: `[ws] 上游断开 ${code}: ${reason}` }),
    onFatal: (reason) => hub.broadcast({ type: 'log', line: `[ws] ${reason}` }),
  }, cfg.maxReconnectSecs);

  const painter = new Painter(upWs, cfg.maxPacketsPerSec, {
    onProgress: (p) => hub.broadcast({ type: 'progress', payload: { ...p } }),
    onLog: (line) => hub.broadcast({ type: 'log', line }),
  });

  registerRoutes(app, { http, painter, hub });

  // 面板 WebSocket（浏览器 ← 后端）
  app.get('/ws', { websocket: true }, (socket) => {
    hub.add(socket);
  });

  upWs.start();

  await app.listen({ port: cfg.port, host: '127.0.0.1' });
  console.log(`[server] listening on http://127.0.0.1:${cfg.port}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
