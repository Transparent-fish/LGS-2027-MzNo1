/**
 * 协议操作码常量。
 * 用于描述上游绘版 WebSocket 的消息类型。
 */
export interface OpcodeSet {
    ping: number;
    pong: number;
    paintEvent: number;
    ack: number;
    paintRequest: number;
}

/**
 * 默认操作码集合。
 * 具体数值按协议文档和实测结果维护。
 */
export const opcode: OpcodeSet = {
    ping: 0xfc,
    pong: 0xfb,
    paintEvent: 0xfa,
    ack: 0xff,
    paintRequest: 0xfe,
};
