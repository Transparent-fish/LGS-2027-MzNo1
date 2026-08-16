import { EventEmitter } from 'node:events';

/**
 * 全局事件类型与载荷映射。
 * 用于协议层、版面同步、绘制引擎之间的解耦通信。
 */
export interface PaintEventMap {
    pixelUpdate: { x: number; y: number; r: number; g: number; b: number };
    paintSuccess: { uid: number; x: number; y: number; r: number; g: number; b: number };
    paintFailure: { uid: number; x: number; y: number; code: number };
    batchUpdate: { updates: Array<{ x: number; y: number; r: number; g: number; b: number }> };
}

export type PaintEventType = keyof PaintEventMap;

/**
 * 事件总线。
 * 对标参考项目的全局事件总线（event::post / event::subscribe）。
 */
export interface EventBus {
    on<K extends PaintEventType>(
        type: K,
        handler: (payload: PaintEventMap[K]) => void,
    ): () => void;
    post<K extends PaintEventType>(type: K, payload: PaintEventMap[K]): void;
}

class DefaultEventBus implements EventBus {
    private readonly emitter = new EventEmitter();

    on<K extends PaintEventType>(
        type: K,
        handler: (payload: PaintEventMap[K]) => void,
    ): () => void {
        this.emitter.on(type, handler);
        return () => {
            this.emitter.off(type, handler);
        };
    }

    post<K extends PaintEventType>(type: K, payload: PaintEventMap[K]): void {
        this.emitter.emit(type, payload);
    }
}

/**
 * 创建事件总线实例。
 */
export function createEventBus(): EventBus {
    return new DefaultEventBus();
}

/**
 * 全局默认事件总线。
 * 简单场景直接使用，复杂场景由组合根注入独立实例。
 */
export const eventBus: EventBus = createEventBus();
