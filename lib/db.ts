// Database layer.
// Uses Postgres when DATABASE_URL / POSTGRES_URL is set (Neon, Supabase, any Postgres).
// Falls back to an embedded Postgres (PGlite) for local development and first-run demos.
import { seedDatabase } from './seed';

type Row = Record<string, any>;
export type Db = {
  kind: 'postgres' | 'pglite';
  query: (text: string, params?: any[]) => Promise<Row[]>;
};

const g = globalThis as any;

export function databaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    undefined
  );
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    sort INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id INT,
    short_description TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    ingredients TEXT NOT NULL DEFAULT '',
    shelf_life TEXT NOT NULL DEFAULT '',
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    badge TEXT NOT NULL DEFAULT '',
    is_veg BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    sort INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer JSONB NOT NULL DEFAULT '{}'::jsonb,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal INT NOT NULL DEFAULT 0,
    discount INT NOT NULL DEFAULT 0,
    delivery_fee INT NOT NULL DEFAULT 0,
    cod_fee INT NOT NULL DEFAULT 0,
    total INT NOT NULL DEFAULT 0,
    coupon_code TEXT NOT NULL DEFAULT '',
    payment_method TEXT NOT NULL DEFAULT 'cod',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending_payment',
    shipping JSONB NOT NULL DEFAULT '{}'::jsonb,
    note TEXT NOT NULL DEFAULT '',
    admin_note TEXT NOT NULL DEFAULT '',
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    stock_applied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'percent',
    value INT NOT NULL DEFAULT 0,
    min_order INT NOT NULL DEFAULT 0,
    max_discount INT NOT NULL DEFAULT 0,
    usage_limit INT NOT NULL DEFAULT 0,
    used INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true,
    description TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT true,
    in_footer BOOLEAN NOT NULL DEFAULT true,
    in_header BOOLEAN NOT NULL DEFAULT false,
    sort INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
];

async function connect(): Promise<Db> {
  const url = databaseUrl();
  if (url) {
    const postgres = (await import('postgres')).default;
    const local = /localhost|127\.0\.0\.1/.test(url);
    const sql = postgres(url, {
      ssl: local ? false : 'require',
      max: Number(process.env.DB_POOL_MAX) || 3,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 15,
      onnotice: () => {},
    });
    return {
      kind: 'postgres',
      // We always pass JSON as strings. Casting through text stops the driver from
      // JSON-encoding those strings a second time.
      query: async (text, params = []) =>
        (await sql.unsafe(text.replace(/\$(\d+)::jsonb/g, '($$$1::text)::jsonb'), params as any[])) as unknown as Row[],
    };
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = process.env.VERCEL ? '/tmp/pglite-store' : './.data/pglite';
  const fs = await import('node:fs');
  fs.mkdirSync(dir, { recursive: true });
  const pg = new PGlite(dir);
  await pg.waitReady;
  return {
    kind: 'pglite',
    query: async (text, params = []) => (await pg.query(text, params)).rows as Row[],
  };
}

// Repairs JSON values that an earlier version stored as quoted strings. Safe to run every start.
const REPAIRS: [string, string[]][] = [
  ['settings', ['value']],
  ['products', ['images', 'variants']],
  ['orders', ['customer', 'address', 'items', 'payment', 'shipping', 'timeline']],
];

async function init(): Promise<Db> {
  const db = await connect();
  for (const stmt of SCHEMA) await db.query(stmt);
  for (const [table, cols] of REPAIRS) {
    for (const col of cols) {
      await db.query(`UPDATE ${table} SET ${col} = (${col} #>> '{}')::jsonb WHERE jsonb_typeof(${col}) = 'string'`);
    }
  }
  await seedDatabase(db);
  return db;
}

export function getDb(): Promise<Db> {
  if (!g.__storeDb) {
    g.__storeDb = init().catch((e) => {
      g.__storeDb = null;
      throw e;
    });
  }
  return g.__storeDb;
}

export async function q(text: string, params: any[] = []): Promise<Row[]> {
  const db = await getDb();
  return db.query(text, params);
}

export async function q1(text: string, params: any[] = []): Promise<Row | null> {
  const rows = await q(text, params);
  return rows[0] ?? null;
}

export async function dbKind(): Promise<'postgres' | 'pglite'> {
  return (await getDb()).kind;
}

export const json = (v: any) => JSON.stringify(v ?? null);
