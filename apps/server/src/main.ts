import type { ServerContainer } from './container.js';
import { loadConfig } from './infra/runtime/configLoader.js';
import { createServerContainer } from './container.js';

/**
 * 后端程序入口。
 * 这里只负责启动时的最高层协调，不包含业务实现。
 */
export function main(container: ServerContainer): void {
    void container;
}

/**
 * 后端启动引导。
 * 先加载配置，再创建依赖容器，最后交给主入口处理。
 */
export function bootstrap(): void {
    const config = loadConfig();
    const container = createServerContainer(config);
    main(container);
}
