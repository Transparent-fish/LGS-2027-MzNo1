/**
 * 判断输入是否为可用字符串。
 * controller 层可用它做最基础的参数校验。
 */
export function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 判断输入是否为有限数字。
 * 用于请求体和配置项的最小校验。
 */
export function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}
