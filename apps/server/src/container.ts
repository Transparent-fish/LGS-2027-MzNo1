import type { AppConfig } from './infra/runtime/configLoader.js';
import type { TokenService } from './domain/token/tokenService.js';
import type { PaintScheduler } from './domain/paint/paintScheduler.js';
import type { WsHub } from './app/ws/wsHub.js';

/**
 * 后端组合根依赖容器。
 * 用于集中保存启动时需要的所有核心服务实例。
 */
export interface ServerContainer {
    config: AppConfig;
    tokenService: TokenService;
    paintScheduler: PaintScheduler;
    wsHub: WsHub;
}

/**
 * 创建后端依赖容器。
 * 当前仅保留函数签名，后续再补具体装配逻辑。
 */
export function createServerContainer(config: AppConfig): ServerContainer {
    void config;
    throw new Error('createServerContainer is not implemented');
}
