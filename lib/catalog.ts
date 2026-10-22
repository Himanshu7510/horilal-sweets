import { q, q1 } from './db';

export type Variant = { label: string; price: number; mrp: number; stock: number; sku: string; weightGrams: number };
export type Product = {
  id: number;
  name: string;
  slug: string;
  category_id: number | null;
  category_name?: string;
  category_slug?: string;
  short_description: string;
  description: string;
  ingredients: string;
  shelf_life: string;
  images: string[];
  variants: Variant[];
  badge: string;
  is_veg: boolean;
  featured: boolean;
  active: boolean;
  sort: number;
};

const SELECT = `SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

export async function listCategories(activeOnly = true) {
  return q(
    `SELECT c.*, (SELECT count(*)::int FROM products p WHERE p.category_id = c.id AND p.active) AS product_count
     FROM categories c ${activeOnly ? 'WHERE c.active' : ''} ORDER BY c.sort, c.name`
  );
}

export async function listProducts(opts: { category?: string; q?: string; featured?: boolean; activeOnly?: boolean; sort?: string } = {}) {
  const where: string[] = [];
  const params: any[] = [];
  if (opts.activeOnly !== false) where.push('p.active');
  if (opts.category) {
    params.push(opts.category);
    where.push(`c.slug = $${params.length}`);
  }
  if (opts.featured) where.push('p.featured');
  if (opts.q) {
    params.push(`%${opts.q}%`);
    where.push(`(p.name ILIKE $${params.length} OR p.short_description ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }
  let order = 'p.sort, p.id';
  if (opts.sort === 'price-asc') order = `(p.variants->0->>'price')::int ASC`;
  if (opts.sort === 'price-desc') order = `(p.variants->0->>'price')::int DESC`;
  if (opts.sort === 'new') order = 'p.created_at DESC';
  const rows = await q(`${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`, params);
  return rows as unknown as Product[];
}

export async function getProductBySlug(slug: string) {
  return (await q1(`${SELECT} WHERE p.slug = $1 AND p.active`, [slug])) as unknown as Product | null;
}

export async function getProductById(id: number) {
  return (await q1(`${SELECT} WHERE p.id = $1`, [id])) as unknown as Product | null;
}

export async function listPages(opts: { footer?: boolean; header?: boolean } = {}) {
  const where = ['active'];
  if (opts.footer) where.push('in_footer');
  if (opts.header) where.push('in_header');
  return q(`SELECT id, slug, title, in_footer, in_header FROM pages WHERE ${where.join(' AND ')} ORDER BY sort, id`);
}

export async function getPage(slug: string) {
  return q1(`SELECT * FROM pages WHERE slug = $1 AND active`, [slug]);
}

export const fromPrice = (p: Product) => {
  const prices = (p.variants || []).map((v) => Number(v.price)).filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : 0;
};

export const totalStock = (p: Product) => (p.variants || []).reduce((s, v) => s + Number(v.stock || 0), 0);
