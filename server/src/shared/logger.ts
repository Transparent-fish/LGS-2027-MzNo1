import { pino } from 'pino';

/**
 * 后端统一日志器。
 * 基于 pino，日志级别可通过 LOG_LEVEL 环境变量调整。
 */
export const logger = pino({
    level: process.env.LOG_LEVEL ?? 'info',
});
