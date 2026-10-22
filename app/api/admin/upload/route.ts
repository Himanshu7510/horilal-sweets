import { NextResponse } from 'next/server';
import { adminOrNull } from '@/lib/auth';
import { q } from '@/lib/db';
import { randomId } from '@/lib/crypto';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'image/x-icon', 'image/vnd.microsoft.icon'];

export async function POST(req: Request) {
  if (!(await adminOrNull())) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Upload a JPG, PNG, WebP, GIF or SVG image.' }, { status: 400 });
  if (file.size > 6 * 1024 * 1024) return NextResponse.json({ error: 'Images must be under 6 MB.' }, { status: 400 });

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60);

  // Prefer Vercel Blob (fast CDN) when a store is connected.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      const blob = await put(`uploads/${safeName}`, file, { access: 'public', addRandomSuffix: true, contentType: file.type });
      return NextResponse.json({ url: blob.url });
    } catch (e: any) {
      // fall through to database storage
      console.error('Blob upload failed, storing in database instead:', e?.message);
    }
  }

  const id = `${randomId(8)}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await q(`INSERT INTO uploads (id, mime, data) VALUES ($1, $2, $3)`, [id, file.type, Buffer.from(bytes)]);
  return NextResponse.json({ url: `/api/files/${id}` });
}
