import type { FastifyInstance } from 'fastify';
import type { PaintController } from '../controllers/paintController.js';

/**
 * 注册绘画相关路由。
 * 负责把启动、停止、暂停、恢复等动作挂到 HTTP 接口上。
 */
export function registerPaintRoutes(app: FastifyInstance, controller: PaintController): void {
    void app;
    void controller;
}
