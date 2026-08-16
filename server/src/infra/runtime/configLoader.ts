import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 后端运行配置。
 */
export interface AppConfig {
    port: number;
    apiBase: string;
    wsUrl: string;
    writeConnections: number;
    maxPacketsPerSec: number;
    cdTimeMs: number;
    batchSize: number;
    batchFlushMs: number;
    comparisonIntervalMs: number;
    syncIntervalMs: number;
    maxReconnectSecs: number;
    penaltyScale: number;
    cannyLow: number;
    cannyHigh: number;
    dataDir: string;
}

const defaultConfig: AppConfig = {
    port: 8787,
    apiBase: 'https://paintboard.luogu.me',
    wsUrl: 'wss://paintboard.luogu.me/api/paintboard/ws',
    writeConnections: 3,
    maxPacketsPerSec: 230,
    cdTimeMs: 3000,
    batchSize: 100,
    batchFlushMs: 100,
    comparisonIntervalMs: 2000,
    syncIntervalMs: 7500,
    maxReconnectSecs: 60,
    penaltyScale: 1.0,
    cannyLow: 20,
    cannyHigh: 40,
    dataDir: join(process.cwd(), 'data'),
};

/**
 * 定位仓库根目录的 config.json。
 * 兼容「在仓库根目录创建 config.json」与「在 server 包内运行」两种场景。
 */
function resolveConfigPath(): string | undefined {
    const cwd = process.cwd();
    const candidates = [join(cwd, 'config.json'), join(cwd, '..', 'config.json')];
    for (const candidate of candidates) {
        if (existsSync(candidate)) {
            return candidate;
        }
    }
    return undefined;
}

/**
 * 加载后端配置，缺失字段回退默认值。
 */
export function loadConfig(): AppConfig {
    const configPath = resolveConfigPath();
    if (!configPath) {
        return defaultConfig;
    }

    try {
        const raw = JSON.parse(readFileSync(configPath, 'utf8')) as Partial<AppConfig>;
        return {
            ...defaultConfig,
            ...raw,
        };
    } catch {
        return defaultConfig;
    }
}
