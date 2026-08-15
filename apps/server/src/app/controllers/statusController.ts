import type { PaintScheduler } from '../../domain/paint/paintScheduler.js';
import type { TokenService } from '../../domain/token/tokenService.js';

/**
 * 状态接口控制器。
 * 对外提供当前绘画状态、连接状态和 Token 数量等只读信息。
 */
export interface StatusController {
    getStatus(): Promise<unknown>;
}

/**
 * 创建状态控制器。
 * 便于将状态聚合逻辑集中到单独模块。
 */
export function createStatusController(
    scheduler: PaintScheduler,
    tokenService: TokenService,
): StatusController {
    void scheduler;
    void tokenService;
    throw new Error('createStatusController is not implemented');
}
