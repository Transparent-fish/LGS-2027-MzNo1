import WebSocket from 'ws';
import { opcode } from '../../domain/protocol/opcode.js';
import type { PacketCodec } from '../../domain/protocol/packetCodec.js';
import type { AckPacket, PaintOperation, PixelEvent } from '../../domain/protocol/types.js';
import { createWsRateLimiter } from './ws-rate-limiter.js';
import { createWsReconnectManager } from './ws-reconnect.js';
import { createWsResponseTracker } from './ws-response-tracker.js';
import type { WsResponseTracker } from './ws-response-tracker.js';
import type { WsReconnectManager } from './ws-reconnect.js';
import type { WsRateLimiter } from './ws-rate-limiter.js';

/**
 * 上游 WS 连接模式。
 */
export type WsMode = 'readwrite' | 'readonly' | 'writeonly';

/**
 * 连接生命周期状态。
 */
export type WsActorState = 'idle' | 'connecting' | 'open' | 'closed' | 'fatal';

/**
 * 连接回调。
 */
export interface WsActorCallbacks {
    onPixelEvent?(event: PixelEvent): void;
    onAck?(packet: AckPacket): void;
    onOpen?(): void;
    onClose?(code: number, reason: string): void;
    onFatal?(reason: string): void;
}

export interface WsActorOptions {
    url: string;
    mode: WsMode;
    codec: PacketCodec;
    maxPacketsPerSec?: number;
    maxReconnectSecs?: number;
    ackTimeoutMs?: number;
    callbacks: WsActorCallbacks;
}

/**
 * 上游 WS 客户端。
 * 负责连接、心跳应答、粘包拆解、指数退避重连、限速发送与回执追踪。
 */
export interface PaintboardWsClient {
    connected(): boolean;
    state(): WsActorState;
    start(): void;
    stop(): void;
    sendPaint(op: PaintOperation): Promise<AckPacket>;
    sendBatch(ops: PaintOperation[]): void;
    pendingSize(): number;
}

const MAX_BATCH_BYTES = 32 * 1024;
const PUMP_INTERVAL_MS = 20;
const ACK_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RECONNECT_MS = 60_000;
const DEFAULT_MAX_PACKETS_PER_SEC = 230;

function buildUrl(baseUrl: string, mode: WsMode): string {
    const suffix =
        mode === 'readonly' ? 'readonly=1' : mode === 'writeonly' ? 'writeonly=1' : undefined;
    if (!suffix) {
        return baseUrl;
    }
    return baseUrl.includes('?') ? `${baseUrl}&${suffix}` : `${baseUrl}?${suffix}`;
}

/**
 * 创建基于 Actor 模型的 WS 客户端。
 */
export function createPaintboardWsClient(options: WsActorOptions): PaintboardWsClient {
    const rawMaxReconnectMs = (options.maxReconnectSecs ?? 60) * 1000;
    const maxReconnectMs = rawMaxReconnectMs > 0 ? rawMaxReconnectMs : DEFAULT_MAX_RECONNECT_MS;
    const ackTimeoutMs = options.ackTimeoutMs ?? ACK_TIMEOUT_MS;

    const reconnect: WsReconnectManager = createWsReconnectManager(1000, maxReconnectMs);
    const tracker: WsResponseTracker = createWsResponseTracker();
    const rate: WsRateLimiter = createWsRateLimiter(
        options.maxPacketsPerSec ?? DEFAULT_MAX_PACKETS_PER_SEC,
    );

    let socket: WebSocket | null = null;
    let closed = false;
    let state: WsActorState = 'idle';
    let pumpTimer: NodeJS.Timeout | null = null;
    const pending: Uint8Array[] = [];

    function emitOpen(): void {
        options.callbacks.onOpen?.();
    }

    function emitClose(code: number, reason: string): void {
        options.callbacks.onClose?.(code, reason);
    }

    function emitFatal(reason: string): void {
        options.callbacks.onFatal?.(reason);
    }

    function startPump(): void {
        stopPump();
        pumpTimer = setInterval(pump, PUMP_INTERVAL_MS);
    }

    function stopPump(): void {
        if (pumpTimer) {
            clearInterval(pumpTimer);
            pumpTimer = null;
        }
    }

    function sendRaw(buffer: Buffer): void {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(buffer);
        }
    }

    function pump(): void {
        if (state !== 'open') {
            return;
        }

        const chunks: Uint8Array[] = [];
        let total = 0;
        while (pending.length > 0 && total < MAX_BATCH_BYTES) {
            if (!rate.tryAcquire()) {
                break;
            }
            const next = pending.shift();
            if (!next) {
                break;
            }
            chunks.push(next);
            total += next.length;
        }

        if (chunks.length > 0) {
            sendRaw(Buffer.concat(chunks.map((c) => Buffer.from(c))));
        }
    }

    function handleMessage(data: Uint8Array): void {
        const packets = options.codec.decodeChunks(data);
        for (const packet of packets) {
            if (packet.op === opcode.ping) {
                sendRaw(Buffer.from([opcode.pong]));
                continue;
            }

            if (packet.op === opcode.paintEvent) {
                const event = options.codec.decodePixelEvent(packet);
                if (event) {
                    options.callbacks.onPixelEvent?.(event);
                }
                continue;
            }

            if (packet.op === opcode.ack) {
                const ack = options.codec.decodeAck(packet);
                if (ack) {
                    tracker.tryResolve(ack.paintId, ack);
                    options.callbacks.onAck?.(ack);
                }
            }
        }
    }

    function handleClose(code: number, reason: string): void {
        stopPump();
        state = 'closed';
        emitClose(code, reason.toString());

        if (closed) {
            return;
        }

        if (code === 1008 || code === 429) {
            state = 'fatal';
            emitFatal(`连接被拒 (${code}: ${reason})，疑似 IP 封禁，停止重连`);
            return;
        }

        if (!reconnect.shouldReconnect()) {
            return;
        }

        const delay = reconnect.nextDelayMs();
        setTimeout(open, delay);
    }

    function open(): void {
        if (closed) {
            return;
        }

        state = 'connecting';
        socket = new WebSocket(buildUrl(options.url, options.mode));

        socket.on('open', () => {
            state = 'open';
            reconnect.reset();
            rate.reset();
            startPump();
            emitOpen();
        });

        socket.on('message', (data) => {
            const buffer = Buffer.isBuffer(data)
                ? data
                : Buffer.from(data as ArrayBuffer);
            handleMessage(buffer);
        });

        socket.on('close', (code, reason) => {
            handleClose(code, reason.toString());
        });

        socket.on('error', () => {
            socket?.close();
        });
    }

    return {
        connected() {
            return state === 'open';
        },
        state() {
            return state;
        },
        start() {
            closed = false;
            open();
        },
        stop() {
            closed = true;
            stopPump();
            socket?.close();
            socket = null;
            state = 'closed';
        },
        sendPaint(op) {
            if (state !== 'open') {
                return Promise.reject(new Error('连接未就绪'));
            }

            const promise = tracker.register(op.paintId, ackTimeoutMs);
            pending.push(options.codec.encodePaintRequest(op));
            return promise;
        },
        sendBatch(ops) {
            if (state !== 'open') {
                return;
            }
            for (const op of ops) {
                pending.push(options.codec.encodePaintRequest(op));
            }
        },
        pendingSize() {
            return pending.length;
        },
    };
}
