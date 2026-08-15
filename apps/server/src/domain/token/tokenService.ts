import type { Result } from '../../shared/result.js';
import type { TokenInput, TokenRecord, TokenView } from './tokenTypes.js';
import type { TokenPolicy } from './tokenPolicy.js';

/**
 * Token 领域服务。
 * 负责 Token 的新增、更新、删除、刷新和视图转换。
 */
export interface TokenService {
    list(): Promise<TokenView[]>;
    create(input: TokenInput): Promise<Result<TokenView>>;
    update(id: string, input: Partial<TokenInput>): Promise<Result<TokenView>>;
    remove(id: string): Promise<Result<void>>;
    refreshPaintKey(id: string): Promise<Result<TokenView>>;
    findById(id: string): Promise<TokenRecord | undefined>;
}

/**
 * 创建 Token 领域服务。
 * 这里只保留接口和返回形状，具体逻辑后续补实现。
 */
export function createTokenService(policy: TokenPolicy): TokenService {
    void policy;
    throw new Error('createTokenService is not implemented');
}
