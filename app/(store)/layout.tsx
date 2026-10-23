import Link from 'next/link';
import { CartProvider } from '@/components/store/CartContext';
import { AddedToast, CartButton } from '@/components/store/CartButton';
import { getSiteBundle, getSetting } from '@/lib/settings';
import { TrackingScripts } from '@/components/store/TrackingScripts';
import { FloatingWhatsApp } from '@/components/store/WaButton';
import { waLink, publicWaConfig } from '@/lib/whatsapp';
import { WhatsAppIcon } from '@/components/store/WhatsAppIcon';
import { listCategories, listPages } from '@/lib/catalog';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { site, footer } = await getSiteBundle();
  const [headerPages, footerPages, categories, waSettings, tracking] = await Promise.all([
    listPages({ header: true }),
    listPages({ footer: true }),
    listCategories(),
    getSetting('whatsapp'),
    getSetting('tracking'),
  ]);
  const wa = publicWaConfig(waSettings, site);
  const waChat = waSettings.chatButton ? waLink(waSettings.number || site.whatsapp, waSettings.chatMessage || '') : '';
  const waOrder = wa.ordering ? '/whatsapp-order' : '';
  const year = new Date().getFullYear();

  const nav = [
    { href: '/shop', label: 'Shop all' },
    ...categories.slice(0, 3).map((c: any) => ({ href: `/shop?category=${c.slug}`, label: c.name, wide: true })),
    ...headerPages.map((p: any) => ({ href: `/p/${p.slug}`, label: p.title })),
    { href: '/track', label: 'Track order' },
  ];

  return (
    <CartProvider>
      {site.announcementOn && site.announcement && (
        <div className="bg-ink px-4 py-2 text-center text-sm text-white/90">{site.announcement}</div>
      )}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <details className="relative lg:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-line" aria-label="Menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <nav className="absolute left-0 top-12 z-50 w-64 rounded-2xl border border-line bg-white p-2 shadow-xl">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 hover:bg-brand-soft">
                  {n.label}
                </Link>
              ))}
              <Link href="/contact" className="block rounded-lg px-3 py-2 hover:bg-brand-soft">
                Contact
              </Link>
              {waOrder && wa.headerLink && (
                <Link href={waOrder} className="mt-1 flex items-center gap-2 rounded-lg bg-[#E7F8EE] px-3 py-2 font-semibold text-[#14532d]">
                  <span className="text-[#25D366]"><WhatsAppIcon /></span> Order on WhatsApp
                </Link>
              )}
            </nav>
          </details>

          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            {site.logo ? (
              <img src={site.logo} alt={site.brandName} className="h-10 w-auto max-w-40 object-contain" />
            ) : (
              <span className="font-display text-[28px] leading-none text-brand">{site.brandName}</span>
            )}
          </Link>

          <nav className="ml-4 hidden flex-1 items-center gap-0.5 lg:flex">
            {nav.map((n: any) => (
              <Link
                key={n.href}
                href={n.href}
                className={`${n.wide ? 'hidden xl:block' : ''} whitespace-nowrap rounded-full px-3 py-1.5 text-[15px] font-medium text-ink-soft hover:bg-brand-soft hover:text-ink`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <form action="/shop" className="hidden sm:block">
              <label className="sr-only" htmlFor="site-search">Search sweets</label>
              <input
                id="site-search"
                name="q"
                placeholder="Search sweets"
                className="w-40 rounded-full border border-line bg-white px-4 py-2 text-[15px] focus:w-56 focus:outline-brand md:w-48"
              />
            </form>
            {waOrder && wa.headerLink && (
              <Link
                href={waOrder}
                className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-[#25D366] px-3.5 py-1.5 text-[15px] font-semibold text-[#14532d] hover:bg-[#E7F8EE] md:inline-flex"
              >
                <span className="text-[#25D366]"><WhatsAppIcon /></span> Order on WhatsApp
              </Link>
            )}
            <CartButton />
          </div>
        </div>
      </header>

      <main className="min-h-[60vh]">{children}</main>

      <footer className="mt-20 bg-ink text-white/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 text-center sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:text-left">
          <div>
            <div className="font-display text-3xl text-white">{site.brandName}</div>
            <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed md:mx-0">{footer.about}</p>
            <div className="mt-5 flex justify-center gap-3 text-sm md:justify-start">
              {footer.instagram && <a className="underline-offset-4 hover:underline" href={footer.instagram} target="_blank" rel="noreferrer">Instagram</a>}
              {footer.facebook && <a className="underline-offset-4 hover:underline" href={footer.facebook} target="_blank" rel="noreferrer">Facebook</a>}
              {footer.youtube && <a className="underline-offset-4 hover:underline" href={footer.youtube} target="_blank" rel="noreferrer">YouTube</a>}
            </div>
          </div>
          <div>
            <div className="mb-3 font-semibold text-white">Shop</div>
            <ul className="space-y-1.5 text-[15px]">
              <li><Link href="/shop" className="hover:text-white">All sweets</Link></li>
              {categories.map((c: any) => (
                <li key={c.id}><Link href={`/shop?category=${c.slug}`} className="hover:text-white">{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-3 font-semibold text-white">Help</div>
            <ul className="space-y-1.5 text-[15px]">
              <li><Link href="/track" className="hover:text-white">Track your order</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact us</Link></li>
              {footerPages.map((p: any) => (
                <li key={p.id}><Link href={`/p/${p.slug}`} className="hover:text-white">{p.title}</Link></li>
              ))}
            </ul>
          </div>
          <div className="text-[15px]">
            <div className="mb-3 font-semibold text-white">Visit or call</div>
            {footer.address && <p className="whitespace-pre-line">{footer.address}</p>}
            {footer.phone && <p className="mt-2"><a href={`tel:${footer.phone}`} className="hover:text-white">{footer.phone}</a></p>}
            {footer.email && <p><a href={`mailto:${footer.email}`} className="hover:text-white">{footer.email}</a></p>}
            {footer.hours && <p className="mt-2 text-white/60">{footer.hours}</p>}
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-1 px-4 py-5 text-center text-sm text-white/55 sm:px-6 md:justify-start md:text-left">
            <span>{footer.copyright || `© ${year} ${site.brandName}`}</span>
            {footer.fssai && <span>FSSAI Lic. No. {footer.fssai}</span>}
            {footer.gstin && <span>GSTIN {footer.gstin}</span>}
          </div>
        </div>
      </footer>

      {(waChat || waOrder) && <FloatingWhatsApp chatHref={waChat} orderHref={waOrder} />}
      <TrackingScripts tracking={tracking} />
      <AddedToast />
    </CartProvider>
  );
}
