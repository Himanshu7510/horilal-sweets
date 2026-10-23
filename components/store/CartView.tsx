'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import { inr } from '@/lib/format';
import { WhatsAppIcon } from './WhatsAppIcon';

export function usePricing(paymentMethod?: string, coupon?: string) {
  const { items, ready } = useCart();
  const [priced, setPriced] = useState<any>(null);
  const key = JSON.stringify(items.map((i) => [i.productId, i.variantIndex, i.qty])) + (paymentMethod || '') + (coupon || '');
  useEffect(() => {
    if (!ready) return;
    let live = true;
    fetch('/api/cart/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, paymentMethod, coupon }),
    })
      .then((r) => r.json())
      .then((d) => live && setPriced(d))
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
  return priced;
}

export function CartView({ waOrder }: { waOrder?: boolean }) {
  const { items, ready, setQty, remove } = useCart();
  const priced = usePricing();

  if (!ready) return <div className="mt-10 h-40 animate-pulse rounded-2xl bg-brand-soft" />;
  if (!items.length)
    return (
      <div className="mt-10 rounded-[22px] bg-brand-soft p-10 text-center">
        <p className="text-lg font-semibold">Your cart is empty.</p>
        <p className="mt-1 text-ink-soft">Add a box of something sweet to get started.</p>
        <Link href="/shop" className="btn btn-brand mt-6">Browse sweets</Link>
      </div>
    );

  const remaining = priced?.freeAbove ? priced.freeAbove - (priced.subtotal - priced.discount) : 0;

  return (
    <div className="mt-8 grid gap-10 md:grid-cols-[1fr_340px]">
      <ul className="divide-y divide-line border-y border-line">
        {items.map((i) => (
          <li key={`${i.productId}-${i.variantIndex}`} className="flex gap-4 py-5">
            <Link href={`/product/${i.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-brand-soft">
              {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${i.slug}`} className="font-semibold hover:text-brand">{i.name}</Link>
              <div className="text-[15px] text-ink-soft">{i.variant} · {inr(i.price)}</div>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center rounded-full border border-line bg-white">
                  <button className="h-9 w-9" onClick={() => setQty(i.productId, i.variantIndex, i.qty - 1)} aria-label="Decrease quantity">−</button>
                  <span className="w-7 text-center font-semibold">{i.qty}</span>
                  <button className="h-9 w-9" onClick={() => setQty(i.productId, i.variantIndex, i.qty + 1)} aria-label="Increase quantity">+</button>
                </div>
                <button className="text-[15px] text-ink-soft underline-offset-4 hover:text-brand hover:underline" onClick={() => remove(i.productId, i.variantIndex)}>
                  Remove
                </button>
              </div>
            </div>
            <div className="font-semibold">{inr(i.price * i.qty)}</div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-[22px] bg-white p-6 shadow-[0_1px_0_var(--color-line),0_10px_30px_-18px_rgba(43,21,52,0.35)]">
        <h2 className="text-lg font-bold">Order summary</h2>
        {priced ? (
          <>
            <dl className="mt-4 space-y-2 text-[15px]">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(priced.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{priced.deliveryFee ? inr(priced.deliveryFee) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>Total</dt><dd>{inr(priced.total)}</dd></div>
            </dl>
            {remaining > 0 && <p className="mt-3 rounded-xl bg-accent-soft px-3 py-2 text-[15px]">Add {inr(remaining)} more for free delivery.</p>}
            {priced.errors?.length > 0 && (
              <ul className="mt-3 space-y-1 text-[15px] text-brand">
                {priced.errors.map((e: string, k: number) => <li key={k}>{e}</li>)}
              </ul>
            )}
          </>
        ) : (
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-brand-soft" />
        )}
        <Link
          href="/checkout"
          aria-disabled={!priced || priced.errors?.length > 0}
          className={`btn btn-brand mt-5 w-full py-3 text-base ${!priced || priced.errors?.length ? 'pointer-events-none opacity-50' : ''}`}
        >
          Continue to checkout
        </Link>
        {waOrder && (
          <Link
            href="/whatsapp-order?from=cart"
            aria-disabled={!priced || priced.errors?.length > 0}
            className={`btn mt-3 w-full bg-[#25D366] py-3 text-base text-white hover:bg-[#1ebe5b] ${!priced || priced.errors?.length ? 'pointer-events-none opacity-50' : ''}`}
          >
            <WhatsAppIcon /> Order on WhatsApp
          </Link>
        )}
        <Link href="/shop" className="mt-3 block text-center text-[15px] text-ink-soft hover:text-brand">Keep shopping</Link>
      </aside>
    </div>
  );
}
