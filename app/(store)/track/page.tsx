import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getOrderByNumber, orderToken } from '@/lib/orders';

export const metadata: Metadata = { title: 'Track your order' };

async function lookup(formData: FormData) {
  'use server';
  const number = String(formData.get('number') || '').trim().toUpperCase();
  const phone = String(formData.get('phone') || '').replace(/\D/g, '').slice(-10);
  const order = number ? await getOrderByNumber(number) : null;
  const orderPhone = String(order?.customer?.phone || '').replace(/\D/g, '').slice(-10);
  if (!order || !phone || orderPhone !== phone) redirect('/track?error=1');
  redirect(`/order/${order.order_number}?t=${await orderToken(order.order_number)}`);
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 pt-12 sm:px-6">
      <h1 className="font-display text-4xl sm:text-5xl">Track your order</h1>
      <p className="mt-3 text-ink-soft">Enter the order number from your confirmation and the mobile number you ordered with.</p>
      <form action={lookup} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1 block font-medium">Order number</span>
          <input name="number" required className="field uppercase" placeholder="e.g. HS2610221234" />
        </label>
        <label className="block">
          <span className="mb-1 block font-medium">Mobile number</span>
          <input name="phone" required inputMode="tel" className="field" />
        </label>
        {error && <p role="alert" className="rounded-xl bg-brand-soft p-3 text-[15px] font-medium text-brand">We couldn’t find an order with those details. Check both and try again.</p>}
        <button className="btn btn-brand w-full py-3">Find my order</button>
      </form>
    </div>
  );
}
