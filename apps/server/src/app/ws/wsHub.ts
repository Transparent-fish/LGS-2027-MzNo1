/**
 * 面板 WebSocket Hub。
 * 负责把后端状态、日志、进度广播给前端订阅者。
 */
export interface WsHub {
    addClient(client: WebSocket): void;
    removeClient(client: WebSocket): void;
    broadcast(message: unknown): void;
}

/**
 * 创建一个 WebSocket Hub。
 * 这里只保留接口，后续再补内部管理逻辑。
 */
export function createWsHub(): WsHub {
    throw new Error('createWsHub is not implemented');
}
