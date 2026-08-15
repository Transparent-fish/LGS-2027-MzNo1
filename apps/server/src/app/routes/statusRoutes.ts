import type { FastifyInstance } from 'fastify';
import type { StatusController } from '../controllers/statusController.js';

/**
 * 注册状态查询路由。
 * 用于面板轮询或初始化状态同步。
 */
export function registerStatusRoutes(app: FastifyInstance, controller: StatusController): void {
    void app;
    void controller;
}
