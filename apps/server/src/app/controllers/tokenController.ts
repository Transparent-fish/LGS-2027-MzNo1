import type { TokenService } from '../../domain/token/tokenService.js';

/**
 * Token 接口控制器。
 * 负责承接 HTTP 请求并调用 Token 领域服务。
 */
export interface TokenController {
    listTokens(): Promise<unknown>;
    createToken(body: unknown): Promise<unknown>;
    updateToken(id: string, body: unknown): Promise<unknown>;
    deleteToken(id: string): Promise<unknown>;
    refreshToken(id: string): Promise<unknown>;
}

/**
 * 创建 Token 控制器。
 * 当前只保留方法签名，便于后续把路由和业务逻辑分离。
 */
export function createTokenController(service: TokenService): TokenController {
    void service;
    throw new Error('createTokenController is not implemented');
}
