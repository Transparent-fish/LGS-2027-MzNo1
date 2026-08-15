import type { TokenRecord } from '../../domain/token/tokenTypes.js';

/**
 * Token 仓储。
 * 负责 Token 记录的持久化读写，不处理业务规则。
 */
export interface TokenRepository {
    list(): Promise<TokenRecord[]>;
    findById(id: string): Promise<TokenRecord | undefined>;
    save(records: TokenRecord[]): Promise<void>;
}

/**
 * 创建 Token 仓储。
 * 未来可以接入文件、数据库或其他持久化方式。
 */
export function createTokenRepository(): TokenRepository {
    throw new Error('createTokenRepository is not implemented');
}
