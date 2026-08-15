/**
 * Token 领域规则。
 * 这里集中放 token 名称、UID、密钥长度等业务约束。
 */
export interface TokenPolicy {
    isValidName(name: string): boolean;
    isValidUid(uid: number): boolean;
    isValidAccessKey(accessKey: string): boolean;
}

/**
 * 创建默认 Token 规则对象。
 * 后续可以按服务端约束继续扩展校验逻辑。
 */
export function createTokenPolicy(): TokenPolicy {
    throw new Error('createTokenPolicy is not implemented');
}
