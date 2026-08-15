import type { FastifyInstance } from 'fastify';
import type { TokenController } from '../controllers/tokenController.js';

/**
 * 注册 Token 相关路由。
 * 路由只负责把 URL 映射到控制器，不处理业务细节。
 */
export function registerTokenRoutes(app: FastifyInstance, controller: TokenController): void {
    void app;
    void controller;
}
