import { nanoid } from 'nanoid';

/** 生成短 ID，用于 Token 记录与任务标识 */
export function newId(prefix = ''): string {
  return `${prefix}${nanoid(10)}`;
}
