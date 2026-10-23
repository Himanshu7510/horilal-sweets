import type { Metadata } from 'next';
import { CartView } from '@/components/store/CartView';
import { getSetting } from '@/lib/settings';
import { publicWaConfig } from '@/lib/whatsapp';

export const metadata: Metadata = { title: 'Your cart' };

export default async function CartPage() {
  const wa = publicWaConfig(await getSetting('whatsapp'), await getSetting('site'));
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl sm:text-5xl">Your cart</h1>
      <CartView waOrder={wa.cart} />
    </div>
  );
}
