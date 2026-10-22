import Link from 'next/link';
import { getSiteBundle } from '@/lib/settings';
import { listCategories, listProducts } from '@/lib/catalog';
import { ProductCard } from '@/components/store/ProductCard';
import { paragraphs } from '@/lib/markdown';

export default async function HomePage() {
  const { home, site } = await getSiteBundle();
  const [categories, featured] = await Promise.all([listCategories(), listProducts({ featured: true })]);
  const boxItems = featured.filter((p) => p.images?.[0]).slice(0, 6);
  const features = (home.features || []).filter((f: any) => f?.title);
  const testimonials = (home.testimonials || []).filter((t: any) => t?.text);

  return (
    <>
      {/* Hero: an open box of mithai */}
      <section className="scallop-bottom bg-brand-soft pb-6">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pt-16">
          <div>
            <h1 className="font-display max-w-[13ch] text-[44px] text-ink sm:text-[58px] lg:text-[68px]">{home.heroTitle}</h1>
            <p className="mt-5 max-w-[46ch] text-lg text-ink-soft">{home.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {home.heroCtaText && (
                <Link href={home.heroCtaLink || '/shop'} className="btn btn-brand px-7 py-3 text-base">
                  {home.heroCtaText}
                </Link>
              )}
              {home.heroSecondaryText && (
                <Link href={home.heroSecondaryLink || '/shop'} className="btn btn-ghost px-7 py-3 text-base text-brand">
                  {home.heroSecondaryText}
                </Link>
              )}
            </div>
          </div>

          {home.heroImage ? (
            <img src={home.heroImage} alt={site.brandName} className="aspect-[5/4] w-full rounded-[28px] object-cover shadow-xl" />
          ) : (
            <div className="relative mx-auto w-full max-w-[520px]">
              <div className="rounded-[28px] bg-brand p-3 shadow-[0_30px_60px_-20px_rgba(43,21,52,0.45)] sm:p-4">
                <div className="grid grid-cols-3 gap-2 rounded-[18px] bg-[color-mix(in_oklab,var(--accent)_70%,white)] p-2 sm:gap-2.5 sm:p-2.5">
                  {boxItems.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-white"
                      title={p.name}
                    >
                      <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 right-6 rotate-[-4deg] rounded-full bg-accent px-4 py-1.5 text-[15px] font-semibold text-ink shadow-md">
                Packed fresh today
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      {home.showCategories && categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl">{home.categoriesTitle}</h2>
          <div className="-mx-4 mt-6 flex snap-x gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 md:grid-cols-6">
            {categories.map((c: any) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="group w-28 shrink-0 snap-start text-center sm:w-auto">
                <div className="mx-auto aspect-square w-full overflow-hidden rounded-full border-4 border-white bg-brand-soft shadow-sm">
                  {c.image && <img src={c.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />}
                </div>
                <div className="mt-2.5 font-semibold leading-tight group-hover:text-brand">{c.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl">{home.featuredTitle}</h2>
              {home.featuredSubtitle && <p className="mt-1.5 text-ink-soft">{home.featuredSubtitle}</p>}
            </div>
            <Link href="/shop" className="font-semibold text-brand underline-offset-4 hover:underline">
              See all sweets
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-4">
            {featured.slice(0, 8).map((p) => (
              <ProductCard key={p.id} p={p} showVeg={site.showVegMark} />
            ))}
          </div>
        </section>
      )}

      {/* Festive banner */}
      {home.festiveOn && home.festiveTitle && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <div className="doily relative grid overflow-hidden rounded-[28px] bg-ink text-white md:grid-cols-[1.3fr_1fr]">
            <div className="p-8 sm:p-12">
              <h2 className="font-display text-[34px] text-accent sm:text-[44px]">{home.festiveTitle}</h2>
              <p className="mt-4 max-w-[44ch] text-white/80">{home.festiveText}</p>
              {home.festiveCtaText && (
                <Link href={home.festiveCtaLink || '/shop'} className="btn mt-7 bg-accent px-7 py-3 text-ink hover:bg-white">
                  {home.festiveCtaText}
                </Link>
              )}
            </div>
            <div className="relative min-h-56">
              <img
                src={home.festiveImage || '/sweets/giftbox.svg'}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Story */}
      {home.storyTitle && (
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-20 sm:px-6 md:grid-cols-2">
          <img
            src={home.storyImage || '/sweets/besan.svg'}
            alt=""
            className="aspect-[4/3] w-full rounded-[28px] object-cover"
          />
          <div>
            <h2 className="font-display text-3xl sm:text-[42px]">{home.storyTitle}</h2>
            <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink-soft">
              {paragraphs(home.storyText).map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
            <Link href="/p/about" className="mt-6 inline-block font-semibold text-brand underline-offset-4 hover:underline">
              Read our story
            </Link>
          </div>
        </section>
      )}

      {/* Promises */}
      {features.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <div className="grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f: any, i: number) => (
              <div key={i} className="bg-white p-6">
                <div className="mb-3 h-2.5 w-10 rounded-full bg-accent" aria-hidden />
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl">{home.testimonialsTitle}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonials.map((t: any, i: number) => (
              <figure key={i} className="rounded-[22px] bg-brand-soft p-6">
                <blockquote className="text-[17px] leading-relaxed">“{t.text}”</blockquote>
                <figcaption className="mt-4 text-[15px] font-semibold text-brand">
                  {t.name}
                  {t.city && <span className="font-normal text-ink-soft">, {t.city}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
