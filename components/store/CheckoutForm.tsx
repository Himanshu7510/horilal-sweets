'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartContext';
import { usePricing } from './CartView';
import { inr } from '@/lib/format';
import { track } from '@/lib/track';
import { WhatsAppIcon } from './WhatsAppIcon';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const SAVED = 'store_checkout_details';

export function CheckoutForm({
  states,
  codNote,
  estimate,
  waLabel,
  waNote,
}: {
  states: string[];
  codNote: string;
  estimate: string;
  waLabel: string;
  waNote: string;
}) {
  const { items, ready, clear } = useCart();
  const router = useRouter();
  const [f, setF] = useState({ name: '', phone: '', email: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', note: '' });
  const [method, setMethod] = useState<'online' | 'cod' | 'whatsapp'>('online');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const priced = usePricing(method, coupon);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SAVED) || 'null');
      const pin = localStorage.getItem('store_pincode') || '';
      setF((x) => ({ ...x, ...(s || {}), pincode: s?.pincode || pin, note: '' }));
    } catch {}
  }, []);

  // Pick an available payment method once pricing loads.
  useEffect(() => {
    if (!priced) return;
    const ok = { online: priced.onlineAvailable, cod: priced.codAvailable, whatsapp: priced.whatsappAtCheckout };
    if (!ok[method]) {
      const next = (['online', 'cod', 'whatsapp'] as const).find((m) => ok[m]);
      if (next) setMethod(next);
    }
  }, [priced, method]);

  // Report the start of checkout once.
  const [begun, setBegun] = useState(false);
  useEffect(() => {
    if (!ready || begun || !items.length) return;
    setBegun(true);
    const t = setTimeout(
      () => track('begin_checkout', { items: items.map((i) => ({ id: String(i.productId), name: i.name, variant: i.variant, price: i.price, qty: i.qty })) }),
      800
    );
    return () => clearTimeout(t);
  }, [ready, begun, items]);

  const set = (k: string) => (e: any) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { note, ...remember } = f;
      localStorage.setItem(SAVED, JSON.stringify(remember));
    } catch {}
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, variantIndex: i.variantIndex, qty: i.qty })),
          customer: { name: f.name, phone: f.phone, email: f.email },
          address: { line1: f.line1, line2: f.line2, landmark: f.landmark, city: f.city, state: f.state, pincode: f.pincode },
          note: f.note,
          coupon,
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

      if (data.redirect) {
        clear();
        router.push(data.redirect);
        return;
      }

      if (data.razorpay) {
        const ok = await loadRazorpay();
        if (!ok) throw new Error('Couldn’t load the payment window. Check your connection and try again.');
        const rzp = new window.Razorpay({
          ...data.razorpay,
          handler: async (resp: any) => {
            setBusy(true);
            const v = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderNumber: data.orderNumber, ...resp }),
            });
            const vd = await v.json();
            if (!v.ok) {
              setError(vd.error || 'Payment verification failed. If money was deducted, contact us with your order number ' + data.orderNumber + '.');
              setBusy(false);
              return;
            }
            clear();
            router.push(vd.redirect);
          },
          modal: {
            ondismiss: () => {
              setBusy(false);
              setError('Payment was cancelled. Your cart is still here — you can try again.');
            },
          },
        });
        rzp.on('payment.failed', (r: any) => {
          setError(r?.error?.description || 'Payment failed. Try again or choose another method.');
          setBusy(false);
        });
        rzp.open();
        return;
      }
    } catch (err: any) {
      setError(err.message);
    }
    setBusy(false);
  }

  if (!ready) return <div className="mt-10 h-40 animate-pulse rounded-2xl bg-brand-soft" />;
  if (!items.length)
    return (
      <div className="mt-10 rounded-[22px] bg-brand-soft p-10 text-center">
        <p className="text-lg font-semibold">Your cart is empty.</p>
        <Link href="/shop" className="btn btn-brand mt-6">Browse sweets</Link>
      </div>
    );

  const noPayment = priced && !priced.onlineAvailable && !priced.codAvailable && !priced.whatsappAtCheckout;

  return (
    <form onSubmit={submit} className="mt-8 grid gap-10 md:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <fieldset>
          <legend className="text-xl font-bold">Contact</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[15px] font-medium">Full name</span>
              <input required autoComplete="name" className="field" value={f.name} onChange={set('name')} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[15px] font-medium">Mobile number</span>
              <input required inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" className="field" value={f.phone} onChange={set('phone')} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[15px] font-medium">Email <span className="font-normal text-ink-soft">(for order updates)</span></span>
              <input type="email" autoComplete="email" className="field" value={f.email} onChange={set('email')} />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xl font-bold">Delivery address</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[15px] font-medium">House / flat, building, street</span>
              <input required autoComplete="address-line1" className="field" value={f.line1} onChange={set('line1')} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[15px] font-medium">Area / locality</span>
              <input autoComplete="address-line2" className="field" value={f.line2} onChange={set('line2')} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[15px] font-medium">Landmark <span className="font-normal text-ink-soft">(optional)</span></span>
              <input className="field" value={f.landmark} onChange={set('landmark')} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[15px] font-medium">Pincode</span>
              <input required inputMode="numeric" maxLength={6} autoComplete="postal-code" className="field" value={f.pincode} onChange={(e) => setF((x) => ({ ...x, pincode: e.target.value.replace(/\D/g, '') }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[15px] font-medium">City</span>
              <input required autoComplete="address-level2" className="field" value={f.city} onChange={set('city')} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[15px] font-medium">State</span>
              <select required className="field" value={f.state} onChange={set('state')}>
                <option value="">Select state</option>
                {states.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[15px] font-medium">Gift message or delivery note <span className="font-normal text-ink-soft">(optional)</span></span>
              <textarea className="field min-h-20" maxLength={500} value={f.note} onChange={set('note')} />
            </label>
          </div>
          {estimate && <p className="mt-3 text-[15px] text-ink-soft">Usually delivered in {estimate}.</p>}
        </fieldset>

        <fieldset>
          <legend className="text-xl font-bold">Payment</legend>
          <div className="mt-4 space-y-3">
            {priced?.onlineAvailable && (
              <label className={`flex cursor-pointer gap-3 rounded-2xl border-2 bg-white p-4 ${method === 'online' ? 'border-brand' : 'border-line'}`}>
                <input type="radio" name="pm" checked={method === 'online'} onChange={() => setMethod('online')} className="mt-1 accent-[var(--brand)]" />
                <span>
                  <span className="block font-semibold">Pay online</span>
                  <span className="text-[15px] text-ink-soft">UPI, cards, net banking and wallets, secured by Razorpay</span>
                </span>
              </label>
            )}
            {priced?.codAvailable && (
              <label className={`flex cursor-pointer gap-3 rounded-2xl border-2 bg-white p-4 ${method === 'cod' ? 'border-brand' : 'border-line'}`}>
                <input type="radio" name="pm" checked={method === 'cod'} onChange={() => setMethod('cod')} className="mt-1 accent-[var(--brand)]" />
                <span>
                  <span className="block font-semibold">Cash on delivery</span>
                  <span className="text-[15px] text-ink-soft">{codNote}</span>
                </span>
              </label>
            )}
            {priced?.whatsappAtCheckout && (
              <label className={`flex cursor-pointer gap-3 rounded-2xl border-2 bg-white p-4 ${method === 'whatsapp' ? 'border-[#25D366]' : 'border-line'}`}>
                <input type="radio" name="pm" checked={method === 'whatsapp'} onChange={() => setMethod('whatsapp')} className="mt-1 accent-[#25D366]" />
                <span>
                  <span className="flex items-center gap-1.5 font-semibold"><span className="text-[#25D366]"><WhatsAppIcon /></span>{waLabel}</span>
                  <span className="text-[15px] text-ink-soft">{waNote}</span>
                </span>
              </label>
            )}
            {noPayment && <p className="rounded-xl bg-accent-soft p-3 text-[15px]">Payments aren’t set up yet. Please contact us to place your order.</p>}
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-[22px] bg-white p-6 shadow-[0_1px_0_var(--color-line),0_10px_30px_-18px_rgba(43,21,52,0.35)] md:sticky md:top-24">
        <h2 className="text-lg font-bold">Your order</h2>
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={`${i.productId}-${i.variantIndex}`} className="flex gap-3 text-[15px]">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                <span className="absolute -right-0 -top-0 rounded-bl-lg bg-ink px-1.5 text-xs font-bold text-white">{i.qty}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-snug">{i.name}</div>
                <div className="text-ink-soft">{i.variant}</div>
              </div>
              <div>{inr(i.price * i.qty)}</div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex gap-2">
          <label htmlFor="coupon" className="sr-only">Coupon code</label>
          <input id="coupon" placeholder="Coupon code" className="field uppercase" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} />
          <button type="button" className="btn btn-ghost shrink-0 py-2 text-brand" onClick={() => setCoupon(couponInput.trim())} disabled={!couponInput.trim()}>
            Apply
          </button>
        </div>
        {coupon && priced?.couponMessage && (
          <p className={`mt-2 text-[15px] ${priced.couponCode ? 'text-[#3e6b1f]' : 'text-brand'}`}>
            {priced.couponCode ? `${priced.couponCode} applied — ${priced.couponMessage}` : priced.couponMessage}
            {priced.couponCode && (
              <button type="button" className="ml-2 underline" onClick={() => { setCoupon(''); setCouponInput(''); }}>Remove</button>
            )}
          </p>
        )}

        {priced ? (
          <dl className="mt-5 space-y-2 text-[15px]">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(priced.subtotal)}</dd></div>
            {priced.discount > 0 && <div className="flex justify-between text-[#3e6b1f]"><dt>Discount</dt><dd>−{inr(priced.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{priced.deliveryFee ? inr(priced.deliveryFee) : 'Free'}</dd></div>
            {priced.codFee > 0 && <div className="flex justify-between"><dt>Cash on delivery fee</dt><dd>{inr(priced.codFee)}</dd></div>}
            <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>Total</dt><dd>{inr(priced.total)}</dd></div>
          </dl>
        ) : (
          <div className="mt-5 h-24 animate-pulse rounded-xl bg-brand-soft" />
        )}

        {priced?.errors?.length > 0 && (
          <ul className="mt-3 space-y-1 text-[15px] text-brand">{priced.errors.map((e: string, k: number) => <li key={k}>{e}</li>)}</ul>
        )}
        {error && <p role="alert" className="mt-4 rounded-xl bg-brand-soft p-3 text-[15px] font-medium text-brand">{error}</p>}

        <button
          type="submit"
          disabled={busy || !priced || priced.errors?.length > 0 || noPayment}
          className="btn btn-brand mt-5 w-full py-3.5 text-base"
        >
          {busy ? 'Placing order…' : method === 'online' ? `Pay ${priced ? inr(priced.total) : ''}` : method === 'whatsapp' ? 'Place order & open WhatsApp' : 'Place order'}
        </button>
        <p className="mt-3 text-center text-sm text-ink-soft">
          By placing this order you agree to our <Link href="/p/terms" className="underline">terms</Link>.
        </p>
      </aside>
    </form>
  );
}
