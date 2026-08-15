/**
 * 生成后端内部唯一 ID。
 * 常用于 Token、任务或其他领域实体的主键生成。
 */
export interface IdGenerator {
    next(prefix: string): string;
}

/**
 * 创建 ID 生成器。
 * 先保留接口，后续再接入 nanoid 或其他实现。
 */
export function createIdGenerator(): IdGenerator {
    throw new Error('createIdGenerator is not implemented');
}
