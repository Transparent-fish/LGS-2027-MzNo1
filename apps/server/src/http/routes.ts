import type { FastifyInstance } from 'fastify';
import { createHttp, type PaintboardHttp } from '../api/http.js';
import * as tokens from '../storage/tokens.js';
import type { Painter } from '../pipeline/painter.js';
import type { WsHub } from './ws-hub.js';

/**
 * REST 接口：
 * - /api/tokens*  Token 管理（加密存储，paintKey 脱敏）
 * - /api/paint/*  绘画启停（发送逻辑在 Painter，由老师实现）
 * - /api/status   当前状态
 */
export function registerRoutes(
  app: FastifyInstance,
  opts: { http: PaintboardHttp; painter: Painter; hub: WsHub },
): void {
  const { http, painter, hub } = opts;

  // ---- Token ----
  app.get('/api/tokens', async () => ({ tokens: tokens.listTokens() }));

  app.post('/api/tokens', async (req) => {
    const body = req.body as { name?: string; uid?: number; accessKey?: string };
    if (!body || !body.name || typeof body.uid !== 'number' || !body.accessKey) {
      return { ok: false, error: 'name/uid/accessKey 必填' };
    }
    const rec = tokens.addToken({ name: body.name, uid: body.uid, accessKey: body.accessKey });
    // 添加后尝试换取 PaintKey
    try {
      const res = await http.getToken({ uid: body.uid, accessKey: body.accessKey });
      if (res.token) {
        tokens.setPaintKey(rec.id, res.token);
        return { ok: true, id: rec.id, paintKeyReady: true };
      }
      return { ok: true, id: rec.id, paintKeyReady: false, errorType: res.errorType };
    } catch (e) {
      return { ok: true, id: rec.id, paintKeyReady: false, error: String(e) };
    }
  });

  app.put('/api/tokens/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { name?: string; uid?: number; accessKey?: string };
    const rec = tokens.updateToken(id, {
      name: body?.name,
      uid: body?.uid,
      accessKey: body?.accessKey,
    });
    if (!rec) return { ok: false, error: 'Token 不存在' };
    return { ok: true };
  });

  app.delete('/api/tokens/:id', async (req) => {
    const { id } = req.params as { id: string };
    return { ok: tokens.deleteToken(id) };
  });

  app.post('/api/tokens/:id/refresh', async (req) => {
    const { id } = req.params as { id: string };
    const accessKey = tokens.revealAccessKey(id);
    const rec = tokens.getToken(id);
    if (!accessKey || !rec) return { ok: false, error: 'Token 不存在' };
    try {
      const res = await http.getToken({ uid: rec.uid, accessKey });
      if (res.token) {
        tokens.setPaintKey(id, res.token);
        return { ok: true, paintKeyReady: true };
      }
      return { ok: false, errorType: res.errorType };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });

  // ---- 绘画 ----
  app.post('/api/paint/start', async (req) => {
    const body = req.body as { tokenId?: string; imagePath?: string; mode?: 'paint' | 'guard' };
    // TODO(老师): 接收 tokenId + 图片，调用 painter.start()
    hub.broadcast({ type: 'log', line: `[api] paint start 请求 tokenId=${body?.tokenId}` });
    return { ok: true, message: 'start 骨架已就绪，发送逻辑待实现' };
  });

  app.post('/api/paint/stop', async () => {
    painter.stop();
    hub.broadcast({ type: 'log', line: '[api] paint stop' });
    return { ok: true };
  });

  app.post('/api/paint/pause', async () => {
    painter.pause();
    return { ok: true };
  });

  app.post('/api/paint/resume', async () => {
    painter.resume();
    return { ok: true };
  });

  // ---- 状态 ----
  app.get('/api/status', async () => ({
    painter: painter.progress(),
    connected: false, // TODO(老师): 接上 PaintboardWs.connected
    tokens: tokens.listTokens().length,
  }));
}
