/**
 * Token 加解密能力。
 * 用于保护 accessKey 和 paintKey 的落盘安全。
 */
export interface TokenCrypto {
    encrypt(plain: string): string;
    decrypt(cipherText: string): string;
}

/**
 * 创建 Token 加解密器。
 * 当前只定义接口，后续接入 AES-GCM 实现。
 */
export function createTokenCrypto(): TokenCrypto {
    throw new Error('createTokenCrypto is not implemented');
}
