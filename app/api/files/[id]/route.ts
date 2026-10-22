import { q1 } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await q1(`SELECT mime, data FROM uploads WHERE id = $1`, [id]);
  if (!row) return new Response('Not found', { status: 404 });
  const body = new Uint8Array(row.data instanceof Uint8Array ? row.data : Buffer.from(row.data));
  return new Response(body as unknown as BodyInit, {
    headers: {
      'Content-Type': row.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...(row.mime === 'image/svg+xml' ? { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" } : {}),
    },
  });
}
