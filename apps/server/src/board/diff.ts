import type { Board } from './board.js';

export interface Pixel {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
}

/** 计算目标图与版面的差异像素；可选只返回差异超过阈值的点 */
export function diffBoard(target: Board, current: Board, threshold = 0): Pixel[] {
  const out: Pixel[] = [];
  const { width, height } = current;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [cr, cg, cb] = current.colorAt(x, y);
      const [tr, tg, tb] = target.colorAt(x, y);
      const d = Math.abs(cr - tr) + Math.abs(cg - tg) + Math.abs(cb - tb);
      if (d > threshold) out.push({ x, y, r: tr, g: tg, b: tb });
    }
  }
  return out;
}
