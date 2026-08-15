import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newId } from '../util/id.js';

/**
 * Token 加密存储。
 * - accessKey / paintKey 用 AES-256-GCM 加密后落盘（data/tokens.json）
 * - 密钥来源：环境变量 PAINTBOARD_SECRET，未设置则首次运行自动生成到 data/.secret
 * - 写入采用临时文件 + rename 原子替换，防半写损坏
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = join(__dirname, '..', '..', 'data');
const TOKENS_FILE = join(DATA_DIR, 'tokens.json');
const SECRET_FILE = join(DATA_DIR, '.secret');

export interface TokenRecord {
  id: string;
  name: string;
  uid: number;
  /** AES-GCM 加密后的 accessKey，格式 iv:tag:data（base64） */
  accessKeyEnc: string;
  /** 加密后的 paintKey，未获取则缺省 */
  paintKeyEnc?: string;
  createdAt: string;
  lastUsedAt?: string;
}

/** 对外返回的脱敏视图 */
export interface TokenView {
  id: string;
  name: string;
  uid: number;
  paintKeyReady: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function getOrCreateSecret(): string {
  const fromEnv = process.env.PAINTBOARD_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (existsSync(SECRET_FILE)) return readFileSync(SECRET_FILE, 'utf8').trim();
  const secret = randomBytes(32).toString('hex');
  ensureDataDir();
  writeFileSync(SECRET_FILE, secret, { encoding: 'utf8', mode: 0o600 });
  return secret;
}

function encrypt(plain: string): string {
  const key = Buffer.from(getOrCreateSecret(), 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), data.toString('base64')].join(':');
}

function decrypt(enc: string): string {
  const key = Buffer.from(getOrCreateSecret(), 'hex');
  const [ivB64, tagB64, dataB64] = enc.split(':');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

function loadRecords(): TokenRecord[] {
  if (!existsSync(TOKENS_FILE)) return [];
  try {
    const raw = JSON.parse(readFileSync(TOKENS_FILE, 'utf8'));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveRecords(records: TokenRecord[]): void {
  ensureDataDir();
  const tmp = `${TOKENS_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(records, null, 2), 'utf8');
  renameSync(tmp, TOKENS_FILE);
}

export function listTokens(): TokenView[] {
  return loadRecords().map((r) => ({
    id: r.id,
    name: r.name,
    uid: r.uid,
    paintKeyReady: Boolean(r.paintKeyEnc),
    createdAt: r.createdAt,
    lastUsedAt: r.lastUsedAt,
  }));
}

export function getToken(id: string): TokenRecord | undefined {
  return loadRecords().find((r) => r.id === id);
}

export function addToken(input: { name: string; uid: number; accessKey: string }): TokenRecord {
  const records = loadRecords();
  const record: TokenRecord = {
    id: newId('tok_'),
    name: input.name,
    uid: input.uid,
    accessKeyEnc: encrypt(input.accessKey),
    createdAt: new Date().toISOString(),
  };
  records.push(record);
  saveRecords(records);
  return record;
}

export function updateToken(id: string, patch: { name?: string; uid?: number; accessKey?: string }): TokenRecord | undefined {
  const records = loadRecords();
  const idx = records.findIndex((r) => r.id === id);
  if (idx < 0) return undefined;
  if (patch.name !== undefined) records[idx].name = patch.name;
  if (patch.uid !== undefined) records[idx].uid = patch.uid;
  if (patch.accessKey !== undefined) records[idx].accessKeyEnc = encrypt(patch.accessKey);
  saveRecords(records);
  return records[idx];
}

export function setPaintKey(id: string, paintKey: string): boolean {
  const records = loadRecords();
  const idx = records.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  records[idx].paintKeyEnc = encrypt(paintKey);
  records[idx].lastUsedAt = new Date().toISOString();
  saveRecords(records);
  return true;
}

export function deleteToken(id: string): boolean {
  const records = loadRecords();
  const next = records.filter((r) => r.id !== id);
  if (next.length === records.length) return false;
  saveRecords(next);
  return true;
}

/** 解密出明文 accessKey；仅后端内部使用，勿对外暴露 */
export function revealAccessKey(id: string): string | undefined {
  const r = getToken(id);
  return r ? decrypt(r.accessKeyEnc) : undefined;
}

/** 解密出明文 paintKey；仅后端内部使用，勿对外暴露 */
export function revealPaintKey(id: string): string | undefined {
  const r = getToken(id);
  return r?.paintKeyEnc ? decrypt(r.paintKeyEnc) : undefined;
}
