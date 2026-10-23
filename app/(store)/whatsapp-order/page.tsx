import Link from 'next/link';
import type { Metadata } from 'next';
import { getSetting } from '@/lib/settings';
import { listCategories, listProducts } from '@/lib/catalog';
import { publicWaConfig } from '@/lib/whatsapp';
import { INDIAN_STATES } from '@/lib/format';
import { WhatsAppOrderForm } from '@/components/store/WhatsAppOrderForm';

export const metadata: Metadata = { title: 'Order on WhatsApp' };

export default async function WhatsAppOrderPage({ searchParams }: { searchParams: Promise<{ add?: string; from?: string; category?: string }> }) {
  const sp = await searchParams;
  const [waSettings, site, delivery, categories, products] = await Promise.all([
    getSetting('whatsapp'),
    getSetting('site'),
    getSetting('delivery'),
    listCategories(),
    listProducts(),
  ]);
  const wa = publicWaConfig(waSettings, site);

  if (!wa.ordering) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-16 text-center">
        <h1 className="font-display text-4xl">WhatsApp ordering is closed</h1>
        <p className="mt-3 text-ink-soft">You can still order online.</p>
        <Link href="/shop" className="btn btn-brand mt-6">Browse sweets</Link>
      </div>
    );
  }

  // Only what the form needs, so the page stays light on phones.
  const catalogue = products
    .filter((p) => (p.variants || []).length)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.images?.[0] || '',
      category: p.category_slug || '',
      short: p.short_description || '',
      veg: p.is_veg,
      badge: p.badge || '',
      variants: (p.variants || []).map((v) => ({ label: v.label, price: Number(v.price), mrp: Number(v.mrp || 0), stock: Number(v.stock || 0) })),
    }));
  const cats = categories
    .filter((c: any) => catalogue.some((p) => p.category === c.slug))
    .map((c: any) => ({ slug: c.slug, name: c.name, image: c.image || '' }));

  return (
    <WhatsAppOrderForm
      catalogue={catalogue}
      categories={cats}
      states={INDIAN_STATES}
      texts={{
        title: waSettings.formTitle || 'Order on WhatsApp',
        intro: waSettings.formIntro || '',
        sweetsQuestion: waSettings.sweetsQuestion || 'Which sweets would you like?',
        detailsQuestion: waSettings.detailsQuestion || 'Where should we deliver?',
      }}
      askDate={waSettings.askDeliveryDate !== false}
      delivery={{
        fee: Number(delivery.flatFee || 0),
        freeAbove: Number(delivery.freeAbove || 0),
        minOrder: Number(delivery.minOrder || 0),
        estimate: delivery.estimate || '',
      }}
      showVeg={site.showVegMark}
      initial={{ add: sp.add || '', fromCart: sp.from === 'cart', category: sp.category || '' }}
    />
  );
}
