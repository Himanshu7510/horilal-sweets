import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { q } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const base = `${h.get('x-forwarded-proto') || 'https'}://${h.get('host')}`;
  const [products, categories, pages] = await Promise.all([
    q(`SELECT slug, created_at FROM products WHERE active ORDER BY sort, id`),
    q(`SELECT slug FROM categories WHERE active ORDER BY sort`),
    q(`SELECT slug, updated_at FROM pages WHERE active ORDER BY sort`),
  ]);
  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    ...categories.map((c: any) => ({ url: `${base}/shop?category=${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...products.map((p: any) => ({ url: `${base}/product/${p.slug}`, lastModified: p.created_at, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...pages.map((p: any) => ({ url: `${base}/p/${p.slug}`, lastModified: p.updated_at, changeFrequency: 'monthly' as const, priority: 0.4 })),
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.4 },
  ];
}
