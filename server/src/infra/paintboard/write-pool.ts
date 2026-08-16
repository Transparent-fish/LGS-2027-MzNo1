import type { PacketCodec } from '../../domain/protocol/packetCodec.js';
import type { AckPacket, PaintOperation } from '../../domain/protocol/types.js';
import { createPaintboardWsClient } from './ws-actor.js';
import type { PaintboardWsClient, WsActorState } from './ws-actor.js';

export interface WritePoolOptions {
    url: string;
    codec: PacketCodec;
    connections: number;
    maxPacketsPerSec?: number;
    maxReconnectSecs?: number;
    ackTimeoutMs?: number;
    onAck?(packet: AckPacket): void;
    onFatal?(reason: string): void;
}

export interface ConnectionStatus {
    index: number;
    state: WsActorState;
    pending: number;
}

/**
 * writeonly 连接池。
 * 按负载最小的原则把批次分发给各写连接，规避单连接 256/s 限制。
 */
export interface WritePool {
    start(): void;
    stop(): void;
    sendPaint(op: PaintOperation): Promise<AckPacket>;
    sendBatch(ops: PaintOperation[]): void;
    connected(): boolean;
    connectedCount(): number;
    total(): number;
    pendingSize(): number;
    status(): ConnectionStatus[];
}

/**
 * 创建写连接池。
 */
export function createWritePool(options: WritePoolOptions): WritePool {
    const count = Math.max(1, Math.min(5, options.connections));
    const clients: PaintboardWsClient[] = [];

    for (let i = 0; i < count; i += 1) {
        const client = createPaintboardWsClient({
            url: options.url,
            mode: 'writeonly',
            codec: options.codec,
            maxPacketsPerSec: options.maxPacketsPerSec,
            maxReconnectSecs: options.maxReconnectSecs,
            ackTimeoutMs: options.ackTimeoutMs,
            callbacks: {
                onAck: (packet) => options.onAck?.(packet),
                onFatal: (reason) => options.onFatal?.(reason),
            },
        });
        clients.push(client);
    }

    function pickLeastBusy(): PaintboardWsClient {
        let best = clients[0];
        for (const client of clients) {
            if (client.pendingSize() < best.pendingSize()) {
                best = client;
            }
        }
        return best;
    }

    return {
        start() {
            for (const client of clients) {
                client.start();
            }
        },
        stop() {
            for (const client of clients) {
                client.stop();
            }
        },
        sendPaint(op) {
            return pickLeastBusy().sendPaint(op);
        },
        sendBatch(ops) {
            if (ops.length === 0) {
                return;
            }
            pickLeastBusy().sendBatch(ops);
        },
        connected() {
            return clients.some((client) => client.connected());
        },
        connectedCount() {
            return clients.filter((client) => client.connected()).length;
        },
        total() {
            return clients.length;
        },
        pendingSize() {
            return clients.reduce((sum, client) => sum + client.pendingSize(), 0);
        },
        status() {
            return clients.map((client, index) => ({
                index,
                state: client.state(),
                pending: client.pendingSize(),
            }));
        },
    };
}
