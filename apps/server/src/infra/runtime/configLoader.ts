/**
 * 后端运行配置。
 * 组合根和基础设施适配器都会依赖这个对象。
 */
export interface AppConfig {
    port: number;
    apiBase: string;
    wsUrl: string;
    maxPacketsPerSec: number;
    cooldownSecs: number;
    maxReconnectSecs: number;
}

/**
 * 加载后端配置。
 * 具体实现后续可扩展为读取 JSON、环境变量和默认值。
 */
export function loadConfig(): AppConfig {
    throw new Error('loadConfig is not implemented');
}
