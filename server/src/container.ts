import type { AppConfig } from './infra/runtime/configLoader.js';

/**
 * 后端依赖容器。
 * Phase 0 阶段仅持有配置，完整装配在后续阶段接入。
 */
export interface ServerContainer {
    config: AppConfig;
}

/**
 * 创建后端依赖容器（组合根）。
 * 后续阶段在此装配仓储、连接、领域服务与路由。
 */
export function createServerContainer(config: AppConfig): ServerContainer {
    return { config };
}
