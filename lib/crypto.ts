import crypto from 'node:crypto';
import { q, q1 } from './db';

const g = globalThis as any;

// Secret used to sign admin sessions and encrypt stored API keys.
// Set AUTH_SECRET in Vercel; otherwise a random one is generated and stored once.
export async function getAppSecret(): Promise<string> {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (g.__appSecret) return g.__appSecret;
  const row = await q1(`SELECT value FROM settings WHERE key = '_secret'`);
  if (row?.value?.secret) return (g.__appSecret = row.value.secret);
  const secret = crypto.randomBytes(32).toString('hex');
  await q(
    `INSERT INTO settings (key, value) VALUES ('_secret', $1::jsonb) ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify({ secret })]
  );
  const again = await q1(`SELECT value FROM settings WHERE key = '_secret'`);
  return (g.__appSecret = again.value.secret);
}

export async function hmac(data: string): Promise<string> {
  const secret = await getAppSecret();
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function encrypt(plain: string): Promise<string> {
  if (!plain) return '';
  const key = crypto.createHash('sha256').update(await getAppSecret()).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return 'enc:' + Buffer.concat([iv, tag, enc]).toString('base64');
}

export async function decrypt(value: string): Promise<string> {
  if (!value) return '';
  if (!value.startsWith('enc:')) return value;
  try {
    const raw = Buffer.from(value.slice(4), 'base64');
    const key = crypto.createHash('sha256').update(await getAppSecret()).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  return safeEqual(test, hash);
}

export const randomId = (n = 4) => crypto.randomBytes(n).toString('hex');
