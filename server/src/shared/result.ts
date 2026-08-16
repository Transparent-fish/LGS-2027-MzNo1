import type { AppError } from './errors.js';

/**
 * 统一结果类型。
 * 成功时返回数据，失败时返回结构化错误。
 */
export interface Result<T> {
    ok: boolean;
    data?: T;
    error?: AppError;
}

/**
 * 创建成功结果。
 */
export function ok<T>(data: T): Result<T> {
    return { ok: true, data };
}

/**
 * 创建失败结果。
 */
export function fail<T>(error: AppError): Result<T> {
    return { ok: false, error };
}
