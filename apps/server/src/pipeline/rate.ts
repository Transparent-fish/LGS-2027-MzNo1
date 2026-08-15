/** 令牌桶限速：控制每秒发包数，服务端上限 256/s，默认留余量 230/s */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(private ratePerSec: number, burst = 1) {
    this.tokens = burst;
    this.lastRefill = Date.now();
  }

  /** 尝试取一个令牌；成功返回 true */
  tryTake(): boolean {
    const now = Date.now();
    this.tokens = Math.min(1, this.tokens + ((now - this.lastRefill) / 1000) * this.ratePerSec);
    this.lastRefill = now;
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /** 距下次可取令牌的毫秒数 */
  waitMs(): number {
    const now = Date.now();
    const need = 1 - (this.tokens + ((now - this.lastRefill) / 1000) * this.ratePerSec);
    return need > 0 ? Math.ceil((need / this.ratePerSec) * 1000) : 0;
  }
}
