import { loadConfig } from './infra/runtime/configLoader.js';

/**
 * 后端程序入口。
 * Phase 0 阶段只完成引导骨架，业务装配在后续阶段接入。
 */
export function main(): void {
    const config = loadConfig();
    console.log(`[server] 配置已加载：port=${config.port} writeConnections=${config.writeConnections}`);
}

main();
