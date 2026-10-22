import Link from 'next/link';
import type { Metadata } from 'next';
import { listCategories, listProducts } from '@/lib/catalog';
import { ProductCard } from '@/components/store/ProductCard';
import { getSetting } from '@/lib/settings';

export const metadata: Metadata = { title: 'Shop' };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const category = sp.category || '';
  const query = (sp.q || '').trim();
  const sort = sp.sort || '';
  const [categories, products, site] = await Promise.all([
    listCategories(),
    listProducts({ category, q: query, sort }),
    getSetting('site'),
  ]);
  const current = categories.find((c: any) => c.slug === category);
  const link = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(category && { category }), ...(query && { q: query }), ...(sort && { sort }), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return `/shop${s ? '?' + s : ''}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl sm:text-5xl">{query ? `Results for “${query}”` : current?.name || 'All sweets'}</h1>
      {current?.description && <p className="mt-2 max-w-xl text-ink-soft">{current.description}</p>}

      <div className="mt-7 flex flex-wrap items-center gap-2">
        <Link
          href={link({ category: '' })}
          className={`rounded-full border px-4 py-1.5 text-[15px] font-medium ${!category ? 'border-brand bg-brand text-white' : 'border-line bg-white hover:border-brand'}`}
        >
          All
        </Link>
        {categories.map((c: any) => (
          <Link
            key={c.id}
            href={link({ category: c.slug })}
            className={`rounded-full border px-4 py-1.5 text-[15px] font-medium ${category === c.slug ? 'border-brand bg-brand text-white' : 'border-line bg-white hover:border-brand'}`}
          >
            {c.name}
          </Link>
        ))}
        <form className="ml-auto flex items-center gap-2" action="/shop">
          {category && <input type="hidden" name="category" value={category} />}
          {query && <input type="hidden" name="q" value={query} />}
          <label htmlFor="sort" className="text-[15px] text-ink-soft">Sort</label>
          <select id="sort" name="sort" defaultValue={sort} className="rounded-full border border-line bg-white px-3 py-1.5 text-[15px]">
            <option value="">Recommended</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="new">Newest</option>
          </select>
          <button className="rounded-full bg-ink px-3 py-1.5 text-[15px] font-semibold text-white">Apply</button>
        </form>
      </div>

      {products.length ? (
        <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} showVeg={site.showVegMark} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-[22px] bg-brand-soft p-10 text-center">
          <p className="text-lg font-semibold">No sweets match that search.</p>
          <p className="mt-1 text-ink-soft">Try a different word, or browse everything.</p>
          <Link href="/shop" className="btn btn-brand mt-5">Browse all sweets</Link>
        </div>
      )}
    </div>
  );
}
