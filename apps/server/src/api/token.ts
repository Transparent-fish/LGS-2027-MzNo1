/** PaintKey 相关类型。Token 指 PaintKey（绘画凭证），非保存站登录 Token。 */

export type TokenErrorType = 'INVALID_ACCESS_KEY' | 'UID_MISMATCH' | 'SERVER_ERROR' | 'BAD_REQUEST';

export interface TokenResponse {
  token?: string;
  errorType?: TokenErrorType;
}

export interface GetTokenInput {
  uid: number;
  accessKey: string;
}
