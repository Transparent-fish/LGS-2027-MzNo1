/**
 * 后端统一错误对象。
 * 用于在 controller、service 和 infra 层之间传递结构化错误。
 */
export interface AppError {
    code: string;
    message: string;
}

/**
 * 创建一个结构化错误对象。
 */
export function createAppError(code: string, message: string): AppError {
    return { code, message };
}
