/**
 * 旧路径下的 Token 基础校验函数。
 * 作为临时适配层保留，后续会迁移到 `domain/token/tokenPolicy.ts`。
 */
export function checkToKen(toKen: string): boolean {
    void toKen;
    throw new Error('checkToKen is not implemented');
}
