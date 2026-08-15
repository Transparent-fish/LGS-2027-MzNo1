import type { FastifyInstance } from 'fastify';
import type { TokenController } from './controllers/tokenController.js';
import type { PaintController } from './controllers/paintController.js';
import type { StatusController } from './controllers/statusController.js';
import { registerTokenRoutes } from './routes/tokenRoutes.js';
import { registerPaintRoutes } from './routes/paintRoutes.js';
import { registerStatusRoutes } from './routes/statusRoutes.js';

/**
 * 注册后端全部 HTTP 路由。
 * 组合根调用这个函数，避免路由分散在入口文件里。
 */
export function registerRoutes(
    app: FastifyInstance,
    controllers: {
        tokenController: TokenController;
        paintController: PaintController;
        statusController: StatusController;
    },
): void {
    registerTokenRoutes(app, controllers.tokenController);
    registerPaintRoutes(app, controllers.paintController);
    registerStatusRoutes(app, controllers.statusController);
}
