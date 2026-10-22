import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/store/CheckoutForm';
import { getSetting } from '@/lib/settings';
import { INDIAN_STATES } from '@/lib/format';
import { publicWaConfig } from '@/lib/whatsapp';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const [payment, delivery, waSettings, site] = await Promise.all([getSetting('payment'), getSetting('delivery'), getSetting('whatsapp'), getSetting('site')]);
  const wa = publicWaConfig(waSettings, site);
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl sm:text-5xl">Checkout</h1>
      <CheckoutForm states={INDIAN_STATES} codNote={payment.codNote} estimate={delivery.estimate} waLabel={wa.checkoutLabel} waNote={wa.checkoutNote} />
    </div>
  );
}
