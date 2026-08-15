import type { GetTokenInput, TokenResponse } from './token.js';

/**
 * 上游 HTTP 封装（fetch，Node 20+ 内置）。
 * - getBoard：拉取 1000x600 版面，RGB 每像素 3 字节，行序存储
 * - getToken：用 uid + accessKey 换取 PaintKey（UUID）
 */

export interface PaintboardHttp {
  getBoard(): Promise<Uint8Array>;
  getToken(input: GetTokenInput): Promise<TokenResponse>;
}

export function createHttp(apiBase: string): PaintboardHttp {
  return {
    async getBoard() {
      const res = await fetch(`${apiBase}/api/paintboard/getboard`);
      if (!res.ok) throw new Error(`getboard failed: HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.length !== 1000 * 600 * 3) {
        throw new Error(`getboard size mismatch: ${buf.length} != ${1000 * 600 * 3}`);
      }
      return buf;
    },

    async getToken(input: GetTokenInput) {
      const res = await fetch(`${apiBase}/api/auth/gettoken`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`gettoken failed: HTTP ${res.status}`);
      return (await res.json()) as TokenResponse;
    },
  };
}
