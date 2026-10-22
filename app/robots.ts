import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const base = `${h.get('x-forwarded-proto') || 'https'}://${h.get('host')}`;
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/cart', '/checkout', '/order'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
