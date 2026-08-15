import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ServerConfig {
  /** 后端 API 端口（Vite dev 通过 5173 代理到此） */
  port: number;
  /** 上游绘版 API 地址 */
  apiBase: string;
  /** WebSocket 地址 */
  wsUrl: string;
  /** 限速：每秒最大发包数（服务端上限 256，默认留余量） */
  maxPacketsPerSec: number;
  /** 冷却等待秒数（收到 0xee 后） */
  cooldownSecs: number;
  /** 断线重连最大退避秒数 */
  maxReconnectSecs: number;
}

const DEFAULTS: ServerConfig = {
  port: 8787,
  apiBase: 'https://paintboard.luogu.me',
  wsUrl: 'wss://paintboard.luogu.me/api/paintboard/ws',
  maxPacketsPerSec: 230,
  cooldownSecs: 10,
  maxReconnectSecs: 60,
};

export function loadConfig(): ServerConfig {
  const p = join(process.cwd(), 'config.json');
  if (!existsSync(p)) return DEFAULTS;
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    return { ...DEFAULTS, ...raw };
  } catch {
    return DEFAULTS;
  }
}
