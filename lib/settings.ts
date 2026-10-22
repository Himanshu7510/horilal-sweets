import { cache } from 'react';
import { q, q1 } from './db';
import { DEFAULT_SETTINGS, SECRET_FIELDS } from './defaults';
import { decrypt, encrypt } from './crypto';

// Raw settings (secrets still encrypted). Cached per request.
export const getSettingRaw = cache(async (key: string): Promise<any> => {
  const row = await q1(`SELECT value FROM settings WHERE key = $1`, [key]);
  return { ...(DEFAULT_SETTINGS[key] || {}), ...(row?.value || {}) };
});

// Settings safe to render anywhere: secret fields are blanked out.
export async function getSetting(key: string): Promise<any> {
  const raw = await getSettingRaw(key);
  const out = { ...raw };
  for (const f of SECRET_FIELDS[key] || []) out[f] = '';
  return out;
}

// Settings with secrets decrypted — server-side use only (payments, couriers).
export async function getSettingWithSecrets(key: string): Promise<any> {
  const raw = await getSettingRaw(key);
  const out = { ...raw };
  for (const f of SECRET_FIELDS[key] || []) out[f] = await decrypt(raw[f] || '');
  return out;
}

// Which secret fields already have a saved value (to show "saved" in the admin).
export async function secretStatus(key: string): Promise<Record<string, boolean>> {
  const raw = await getSettingRaw(key);
  const out: Record<string, boolean> = {};
  for (const f of SECRET_FIELDS[key] || []) out[f] = !!raw[f];
  return out;
}

export async function saveSetting(key: string, patch: Record<string, any>) {
  const current = (await q1(`SELECT value FROM settings WHERE key = $1`, [key]))?.value || {};
  const next = { ...current };
  for (const [k, val] of Object.entries(patch)) {
    if ((SECRET_FIELDS[key] || []).includes(k)) {
      // Blank secret means "keep the saved one". A single "-" clears it.
      if (val === '-') next[k] = '';
      else if (val) next[k] = await encrypt(String(val));
    } else {
      next[k] = val;
    }
  }
  await q(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(next)]
  );
}

export const getSiteBundle = cache(async () => {
  const [site, footer, seo, home] = await Promise.all([
    getSetting('site'),
    getSetting('footer'),
    getSetting('seo'),
    getSetting('home'),
  ]);
  return { site, footer, seo, home };
});
