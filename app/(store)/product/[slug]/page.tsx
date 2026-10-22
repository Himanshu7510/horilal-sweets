import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug, listProducts } from '@/lib/catalog';
import { getSetting } from '@/lib/settings';
import { ProductCard, VegMark } from '@/components/store/ProductCard';
import { AddToCart } from '@/components/store/AddToCart';
import { PincodeCheck } from '@/components/store/PincodeCheck';
import { Gallery } from '@/components/store/Gallery';
import { paragraphs } from '@/lib/markdown';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  return { title: p.name, description: p.short_description, openGraph: { images: p.images?.slice(0, 1) } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const [site, delivery, related] = await Promise.all([
    getSetting('site'),
    getSetting('delivery'),
    p.category_slug ? listProducts({ category: p.category_slug }) : Promise.resolve([]),
  ]);
  const more = related.filter((r) => r.id !== p.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <nav className="text-[15px] text-ink-soft" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-brand">Shop</Link>
        {p.category_slug && (
          <>
            {' / '}
            <Link href={`/shop?category=${p.category_slug}`} className="hover:text-brand">{p.category_name}</Link>
          </>
        )}
      </nav>

      <div className="mt-5 grid gap-10 md:grid-cols-2 md:gap-14">
        <Gallery images={p.images || []} name={p.name} />

        <div>
          <div className="flex items-center gap-3">
            {site.showVegMark && <VegMark veg={p.is_veg} />}
            {p.badge && <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[13px] font-semibold">{p.badge}</span>}
          </div>
          <h1 className="font-display mt-3 text-4xl sm:text-5xl">{p.name}</h1>
          {p.short_description && <p className="mt-3 text-lg text-ink-soft">{p.short_description}</p>}

          <AddToCart
            product={{ id: p.id, name: p.name, slug: p.slug, image: p.images?.[0] || '', variants: p.variants || [] }}
          />

          <div className="mt-6">
            <PincodeCheck />
          </div>

          <dl className="mt-8 divide-y divide-line border-y border-line text-[15px]">
            {p.ingredients && (
              <div className="grid grid-cols-[120px_1fr] gap-4 py-3">
                <dt className="font-semibold">Ingredients</dt>
                <dd className="text-ink-soft">{p.ingredients}</dd>
              </div>
            )}
            {p.shelf_life && (
              <div className="grid grid-cols-[120px_1fr] gap-4 py-3">
                <dt className="font-semibold">Shelf life</dt>
                <dd className="text-ink-soft">{p.shelf_life}</dd>
              </div>
            )}
            <div className="grid grid-cols-[120px_1fr] gap-4 py-3">
              <dt className="font-semibold">Delivery</dt>
              <dd className="text-ink-soft">
                {delivery.estimate}
                {Number(delivery.freeAbove) > 0 && `. Free delivery above ₹${delivery.freeAbove}.`}
              </dd>
            </div>
          </dl>

          {p.description && (
            <div className="mt-6 space-y-3 leading-relaxed text-ink-soft">
              {paragraphs(p.description).map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {more.length > 0 && (
        <section className="pt-20">
          <h2 className="font-display text-3xl">You may also like</h2>
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-4">
            {more.map((r) => (
              <ProductCard key={r.id} p={r} showVeg={site.showVegMark} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
