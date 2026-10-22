import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hmac, safeEqual } from './crypto';
import { getSettingRaw } from './settings';

const COOKIE = 'admin_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  const sig = await hmac(payload);
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentAdmin(): Promise<{ email: string } | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw || !raw.includes('.')) return null;
  const [payload, sig] = raw.split('.');
  if (!safeEqual(sig, await hmac(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || data.exp < Date.now()) return null;
    const admin = await getSettingRaw('admin');
    if (!admin?.email || admin.email !== data.email) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}

// For API routes: returns null instead of redirecting.
export async function adminOrNull() {
  return currentAdmin();
}

export async function adminExists() {
  const admin = await getSettingRaw('admin');
  return !!admin?.email && !!admin?.passwordHash;
}
