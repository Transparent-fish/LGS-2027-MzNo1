/**
 * Token 领域记录。
 * 表示后端持久化的 Token 数据结构。
 */
export interface TokenRecord {
    id: string;
    name: string;
    uid: number;
    accessKeyEnc: string;
    paintKeyEnc?: string;
    createdAt: string;
    lastUsedAt?: string;
}

/**
 * 对前端暴露的 Token 视图。
 * 不包含任何明文密钥。
 */
export interface TokenView {
    id: string;
    name: string;
    uid: number;
    paintKeyReady: boolean;
    createdAt: string;
    lastUsedAt?: string;
}

/**
 * 创建或更新 Token 时使用的输入结构。
 * 用于领域服务接收外部数据。
 */
export interface TokenInput {
    name: string;
    uid: number;
    accessKey: string;
}
