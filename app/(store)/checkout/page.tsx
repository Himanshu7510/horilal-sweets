import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/store/CheckoutForm';
import { getSetting } from '@/lib/settings';
import { INDIAN_STATES } from '@/lib/format';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const [payment, delivery] = await Promise.all([getSetting('payment'), getSetting('delivery')]);
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl sm:text-5xl">Checkout</h1>
      <CheckoutForm states={INDIAN_STATES} codNote={payment.codNote} estimate={delivery.estimate} />
    </div>
  );
}
