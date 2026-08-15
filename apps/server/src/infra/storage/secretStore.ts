/**
 * 密钥存储。
 * 负责保存或读取本地加密密钥。
 */
export interface SecretStore {
    readSecret(): Promise<string | undefined>;
    writeSecret(secret: string): Promise<void>;
}

/**
 * 创建密钥存储对象。
 * 具体文件读写实现后续再补充。
 */
export function createSecretStore(): SecretStore {
    throw new Error('createSecretStore is not implemented');
}
