/**
 * 协议操作码常量。
 * 与 docs/api.md 保持一致。
 */
export const opcode = {
    /** S2C 心跳 Ping */
    ping: 0xfc,
    /** C2S 心跳 Pong */
    pong: 0xfb,
    /** S2C 绘画事件 */
    paintEvent: 0xfa,
    /** S2C 绘画回执 */
    ack: 0xff,
    /** C2S 绘画请求 */
    paintRequest: 0xfe,
} as const;

export type OpcodeValue = (typeof opcode)[keyof typeof opcode];

/**
 * 绘画回执状态码。
 */
export type AckCode = 0xef | 0xee | 0xed | 0xec | 0xeb | 0xea;
