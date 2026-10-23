'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from './CartContext';
import { VegMark } from './VegMark';
import { WhatsAppIcon } from './WhatsAppIcon';
import { PurchaseTracker } from './PurchaseTracker';
import { inr } from '@/lib/format';
import { track } from '@/lib/track';

type Variant = { label: string; price: number; mrp: number; stock: number };
type Item = { id: number; name: string; slug: string; image: string; category: string; short: string; veg: boolean; badge: string; variants: Variant[] };
type Cat = { slug: string; name: string; image: string };

const SAVED = 'store_checkout_details';
const GREEN = '#25D366';

function tomorrowIST() {
  const d = new Date(Date.now() + 5.5 * 3600e3 + 24 * 3600e3);
  return d.toISOString().slice(0, 10);
}

function Stepper({ qty, max, onChange, label }: { qty: number; max: number; onChange: (n: number) => void; label: string }) {
  if (max <= 0) return <span className="text-sm font-semibold text-ink-soft">Sold out</span>;
  if (qty === 0)
    return (
      <button
        type="button"
        onClick={() => onChange(1)}
        className="h-9 min-w-20 rounded-full border-2 border-brand px-4 text-[15px] font-bold text-brand hover:bg-brand-soft"
        aria-label={`Add ${label}`}
      >
        Add
      </button>
    );
  return (
    <div className="flex h-9 items-center rounded-full bg-brand text-white">
      <button type="button" className="h-9 w-9 text-lg font-bold" onClick={() => onChange(qty - 1)} aria-label={`One less ${label}`}>−</button>
      <span className="w-7 text-center font-bold" aria-live="polite" aria-label={`${qty} of ${label}`}>{qty}</span>
      <button type="button" className="h-9 w-9 text-lg font-bold disabled:opacity-40" disabled={qty >= max} onClick={() => onChange(qty + 1)} aria-label={`One more ${label}`}>+</button>
    </div>
  );
}

export function WhatsAppOrderForm({
  catalogue,
  categories,
  states,
  texts,
  askDate,
  delivery,
  showVeg,
  initial,
}: {
  catalogue: Item[];
  categories: Cat[];
  states: string[];
  texts: { title: string; intro: string; sweetsQuestion: string; detailsQuestion: string };
  askDate: boolean;
  delivery: { fee: number; freeAbove: number; minOrder: number; estimate: string };
  showVeg: boolean;
  initial: { add: string; fromCart: boolean; category: string };
}) {
  const cart = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sel, setSel] = useState<Record<string, number>>({}); // "productId:variantIndex" -> qty
  const [cat, setCat] = useState(categories.some((c) => c.slug === initial.category) ? initial.category : '');
  const [search, setSearch] = useState('');
  const [f, setF] = useState({ name: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', date: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pin, setPin] = useState<{ ok: boolean; message: string } | null>(null);
  const [priced, setPriced] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { orderNumber: string; redirect: string; whatsappUrl: string; total: number; items: any[] }>(null);
  const top = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const byId = useMemo(() => new Map(catalogue.map((p) => [p.id, p])), [catalogue]);

  // Pre-select from the product page (?add=id:size:qty) or bring the whole cart (?from=cart).
  useEffect(() => {
    if (started.current) return;
    if (initial.fromCart && !cart.ready) return;
    started.current = true;
    const next: Record<string, number> = {};
    if (initial.fromCart) {
      for (const i of cart.items) if (byId.has(i.productId)) next[`${i.productId}:${i.variantIndex}`] = i.qty;
    } else if (initial.add) {
      const [id, vi, qty] = initial.add.split(':').map(Number);
      const v = byId.get(id)?.variants[vi || 0];
      if (v && v.stock > 0) next[`${id}:${vi || 0}`] = Math.max(1, Math.min(v.stock, qty || 1));
    }
    setSel(next);
    if (initial.fromCart && Object.keys(next).length) setStep(2);
    try {
      const s = JSON.parse(localStorage.getItem(SAVED) || 'null');
      if (s) setF((x) => ({ ...x, name: s.name || '', phone: s.phone || '', line1: s.line1 || '', line2: s.line2 || '', landmark: s.landmark || '', city: s.city || '', state: s.state || '', pincode: s.pincode || '' }));
      else {
        const p = localStorage.getItem('store_pincode');
        if (p) setF((x) => ({ ...x, pincode: p }));
      }
    } catch {}
  }, [cart.ready, cart.items, initial, byId]);

  const lines = useMemo(
    () =>
      Object.entries(sel)
        .filter(([, q]) => q > 0)
        .map(([k, qty]) => {
          const [id, vi] = k.split(':').map(Number);
          const p = byId.get(id)!;
          const v = p?.variants[vi];
          return p && v ? { key: k, productId: id, variantIndex: vi, qty, name: p.name, variant: v.label, price: v.price, image: p.image } : null;
        })
        .filter(Boolean) as { key: string; productId: number; variantIndex: number; qty: number; name: string; variant: string; price: number; image: string }[],
    [sel, byId]
  );
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);

  const go = (n: 1 | 2 | 3) => {
    setStep(n);
    setError('');
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // Price the order on the server for the review step (delivery fee, stock, minimum order).
  useEffect(() => {
    if (step !== 3) return;
    setPriced(null);
    let live = true;
    fetch('/api/cart/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: lines.map((l) => ({ productId: l.productId, variantIndex: l.variantIndex, qty: l.qty })), paymentMethod: 'whatsapp' }),
    })
      .then((r) => r.json())
      .then((d) => live && setPriced(d))
      .catch(() => live && setError('Couldn’t load prices. Check your connection and try again.'));
    track('begin_checkout', { items: lines.map((l) => ({ id: String(l.productId), name: l.name, variant: l.variant, price: l.price, qty: l.qty })) });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const visible = useMemo(() => {
    const qy = search.trim().toLowerCase();
    return catalogue.filter((p) => (!cat || p.category === cat) && (!qy || p.name.toLowerCase().includes(qy) || p.short.toLowerCase().includes(qy)));
  }, [catalogue, cat, search]);
  const groups = useMemo(() => {
    if (cat || search.trim()) return [{ slug: cat, name: '', items: visible }];
    const out = categories.map((c) => ({ slug: c.slug, name: c.name, items: visible.filter((p) => p.category === c.slug) })).filter((g) => g.items.length);
    const rest = visible.filter((p) => !categories.some((c) => c.slug === p.category));
    if (rest.length) out.push({ slug: '_other', name: 'More sweets', items: rest });
    return out;
  }, [visible, categories, cat, search]);

  const set = (k: string) => (e: any) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: '' }));
  };

  async function checkPin(p: string) {
    if (!/^\d{6}$/.test(p)) return setPin(null);
    try {
      const r = await fetch(`/api/pincode?pin=${p}`);
      setPin(await r.json());
    } catch {}
  }

  function validateDetails() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Enter your name.';
    if (!/^(\+?91)?[6-9]\d{9}$/.test(f.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a 10-digit mobile number.';
    if (f.line1.trim().length < 3) e.line1 = 'Enter your house number and street.';
    if (!/^\d{6}$/.test(f.pincode)) e.pincode = 'Enter a 6-digit pincode.';
    else if (pin && !pin.ok) e.pincode = pin.message;
    if (!f.city.trim()) e.city = 'Enter your city.';
    if (!f.state) e.state = 'Choose your state.';
    if (f.date && f.date < tomorrowIST()) e.date = 'Choose tomorrow or a later date.';
    setErrors(e);
    if (Object.keys(e).length) {
      const first = document.getElementById(`wa-${Object.keys(e)[0]}`);
      first?.focus();
      return false;
    }
    try {
      const { date, note, ...remember } = f;
      localStorage.setItem(SAVED, JSON.stringify({ ...remember, phone: f.phone.replace(/[\s-]/g, '') }));
    } catch {}
    return true;
  }

  async function send() {
    setError('');
    setBusy(true);
    // Open a tab during the tap so phones don't block it; it is pointed at WhatsApp once the order is saved.
    let win: Window | null = null;
    try {
      win = window.open('', '_blank');
    } catch {}
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.productId, variantIndex: l.variantIndex, qty: l.qty })),
          customer: { name: f.name, phone: f.phone.replace(/[\s-]/g, '') },
          address: { line1: f.line1, line2: f.line2, landmark: f.landmark, city: f.city, state: f.state, pincode: f.pincode, deliveryDate: f.date },
          note: f.note,
          paymentMethod: 'whatsapp',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      track('whatsapp_click', { placement: 'order_form' });
      setDone({ ...data, items: lines.map((l) => ({ id: String(l.productId), name: l.name, variant: l.variant, price: l.price, qty: l.qty })) });
      if (initial.fromCart) cart.clear();
      if (win && !win.closed) win.location.href = data.whatsappUrl;
      requestAnimationFrame(() => top.current?.scrollIntoView({ block: 'start' }));
    } catch (e: any) {
      try {
        win?.close();
      } catch {}
      setError(e.message);
    }
    setBusy(false);
  }

  // ---------- Done ----------
  if (done) {
    return (
      <div ref={top} className="mx-auto max-w-xl scroll-mt-24 px-4 pb-10 pt-10 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: GREEN }}>
          <WhatsAppIcon size={34} />
        </div>
        <h1 className="font-display mt-5 text-4xl">Order {done.orderNumber} saved</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Send it to us on WhatsApp so we can confirm availability, delivery and payment. Your details are already typed in — just press send.
        </p>
        <a
          href={done.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="btn mt-7 w-full max-w-sm py-3.5 text-lg text-white"
          style={{ background: GREEN }}
        >
          <WhatsAppIcon size={22} /> Send order on WhatsApp
        </a>
        <div className="mt-5">
          <Link href={done.redirect} className="font-semibold text-brand underline-offset-4 hover:underline">View order details</Link>
        </div>
        <PurchaseTracker order={{ number: done.orderNumber, total: done.total, items: done.items }} />
      </div>
    );
  }

  const stepNames = ['Choose sweets', 'Delivery details', 'Review & send'];
  const field = (k: string) => `field ${errors[k] ? 'border-red-400 bg-red-50' : ''}`;
  const minShort = delivery.minOrder > 0 && subtotal < delivery.minOrder ? delivery.minOrder - subtotal : 0;

  return (
    <div ref={top} className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-36 pt-8 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white" style={{ background: GREEN }}>
          <WhatsAppIcon size={24} />
        </span>
        <h1 className="font-display text-[34px] leading-tight sm:text-5xl">{texts.title}</h1>
      </div>
      {texts.intro && <p className="mt-3 max-w-2xl text-ink-soft">{texts.intro}</p>}

      <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Order steps">
        {stepNames.map((n, i) => {
          const s = (i + 1) as 1 | 2 | 3;
          const reachable = s < step;
          return (
            <li key={n}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && go(s)}
                aria-current={s === step ? 'step' : undefined}
                className="w-full text-left disabled:cursor-default"
              >
                <span className={`block h-1.5 rounded-full ${s <= step ? 'bg-brand' : 'bg-line'}`} />
                <span className={`mt-2 block text-[13px] leading-tight sm:text-sm ${s === step ? 'font-bold text-ink' : s < step ? 'font-medium text-brand' : 'text-ink-soft'}`}>
                  {i + 1}. {n}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* ---------- Step 1: choose sweets ---------- */}
      {step === 1 && (
        <section className="mt-8">
          <h2 className="font-display text-[28px] sm:text-4xl">{texts.sweetsQuestion}</h2>
          <p className="mt-1 text-ink-soft">Pick a category, then add the sizes and quantities you want.</p>

          <div className="sticky top-[65px] z-30 -mx-4 mt-5 bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {[{ slug: '', name: 'All sweets', image: '' }, ...categories].map((c) => (
                <button
                  key={c.slug || 'all'}
                  type="button"
                  onClick={() => setCat(c.slug)}
                  aria-pressed={cat === c.slug}
                  className={`flex shrink-0 snap-start items-center gap-2 rounded-full border py-1 pl-1 pr-4 text-[15px] font-semibold ${
                    cat === c.slug ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand'
                  } ${c.image ? '' : 'pl-4'}`}
                >
                  {c.image && <img src={c.image} alt="" className="h-8 w-8 rounded-full object-cover" />}
                  {c.name}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="wa-search">Search sweets</label>
            <input
              id="wa-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sweets, e.g. kaju katli"
              className="field mt-2 rounded-full"
            />
          </div>

          {groups.map((g) => (
            <div key={g.slug || 'all'} className="mt-6">
              {g.name && <h3 className="mb-3 text-xl font-bold">{g.name}</h3>}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {g.items.map((p) => {
                  const chosen = p.variants.some((_, vi) => (sel[`${p.id}:${vi}`] || 0) > 0);
                  return (
                    <article key={p.id} className={`rounded-[20px] bg-white p-3.5 shadow-sm ring-1 ${chosen ? 'ring-2 ring-brand' : 'ring-line'}`}>
                      <div className="flex gap-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-brand-soft">
                          {p.image && <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-start gap-1.5">
                            {showVeg && <span className="mt-1"><VegMark veg={p.veg} /></span>}
                            <h4 className="font-semibold leading-snug">{p.name}</h4>
                          </div>
                          {p.badge && <span className="mt-1 inline-block rounded-full bg-accent-soft px-2 text-xs font-semibold">{p.badge}</span>}
                          {p.short && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{p.short}</p>}
                        </div>
                      </div>
                      <ul className="mt-3 divide-y divide-line border-t border-line">
                        {p.variants.map((v, vi) => {
                          const k = `${p.id}:${vi}`;
                          return (
                            <li key={vi} className="flex items-center justify-between gap-3 py-2">
                              <div className="text-[15px]">
                                <span className="font-semibold">{v.label}</span>
                                <span className="ml-2">{inr(v.price)}</span>
                                {v.mrp > v.price && <span className="ml-1.5 text-sm text-ink-soft line-through">{inr(v.mrp)}</span>}
                              </div>
                              <Stepper
                                qty={sel[k] || 0}
                                max={Math.min(v.stock, 50)}
                                label={`${p.name} ${v.label}`}
                                onChange={(n) => setSel((x) => ({ ...x, [k]: Math.max(0, n) }))}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
          {!visible.length && (
            <p className="mt-8 rounded-2xl bg-brand-soft p-6 text-center">No sweets match “{search}”. Try another name.</p>
          )}
        </section>
      )}

      {/* ---------- Step 2: delivery details ---------- */}
      {step === 2 && (
        <section className="mt-8 max-w-2xl">
          <h2 className="font-display text-[28px] sm:text-4xl">{texts.detailsQuestion}</h2>
          <p className="mt-1 text-ink-soft">We’ll use these details to deliver your order and contact you on WhatsApp.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-medium">Your name</span>
              <input id="wa-name" autoComplete="name" className={field('name')} value={f.name} onChange={set('name')} />
              {errors.name && <span className="mt-1 block text-sm text-red-700">{errors.name}</span>}
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-medium">Mobile number</span>
              <input id="wa-phone" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" className={field('phone')} value={f.phone} onChange={set('phone')} />
              {errors.phone && <span className="mt-1 block text-sm text-red-700">{errors.phone}</span>}
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-medium">House / flat, building, street</span>
              <input id="wa-line1" autoComplete="address-line1" className={field('line1')} value={f.line1} onChange={set('line1')} />
              {errors.line1 && <span className="mt-1 block text-sm text-red-700">{errors.line1}</span>}
            </label>
            <label className="block">
              <span className="mb-1 block font-medium">Area / locality</span>
              <input autoComplete="address-line2" className="field" value={f.line2} onChange={set('line2')} />
            </label>
            <label className="block">
              <span className="mb-1 block font-medium">Landmark <span className="font-normal text-ink-soft">(optional)</span></span>
              <input className="field" value={f.landmark} onChange={set('landmark')} />
            </label>
            <label className="block">
              <span className="mb-1 block font-medium">Pincode</span>
              <input
                id="wa-pincode"
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                className={field('pincode')}
                value={f.pincode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  setF((x) => ({ ...x, pincode: v }));
                  setErrors((x) => ({ ...x, pincode: '' }));
                  if (v.length === 6) checkPin(v);
                  else setPin(null);
                }}
              />
              {errors.pincode ? (
                <span className="mt-1 block text-sm text-red-700">{errors.pincode}</span>
              ) : pin ? (
                <span className={`mt-1 block text-sm ${pin.ok ? 'text-[#3e6b1f]' : 'text-red-700'}`}>{pin.message}</span>
              ) : null}
            </label>
            <label className="block">
              <span className="mb-1 block font-medium">City</span>
              <input id="wa-city" autoComplete="address-level2" className={field('city')} value={f.city} onChange={set('city')} />
              {errors.city && <span className="mt-1 block text-sm text-red-700">{errors.city}</span>}
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-medium">State</span>
              <select id="wa-state" className={field('state')} value={f.state} onChange={set('state')}>
                <option value="">Select state</option>
                {states.map((s) => <option key={s}>{s}</option>)}
              </select>
              {errors.state && <span className="mt-1 block text-sm text-red-700">{errors.state}</span>}
            </label>
            {askDate && (
              <label className="block sm:col-span-2">
                <span className="mb-1 block font-medium">When do you need it? <span className="font-normal text-ink-soft">(optional)</span></span>
                <input id="wa-date" type="date" min={tomorrowIST()} className={`${field('date')} sm:max-w-xs`} value={f.date} onChange={set('date')} />
                {errors.date ? (
                  <span className="mt-1 block text-sm text-red-700">{errors.date}</span>
                ) : (
                  delivery.estimate && <span className="mt-1 block text-sm text-ink-soft">Usual delivery time: {delivery.estimate}.</span>
                )}
              </label>
            )}
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-medium">Anything else? <span className="font-normal text-ink-soft">(optional)</span></span>
              <textarea
                className="field min-h-20"
                maxLength={500}
                placeholder="Gift message, occasion, packing instructions…"
                value={f.note}
                onChange={set('note')}
              />
            </label>
          </div>
        </section>
      )}

      {/* ---------- Step 3: review ---------- */}
      {step === 3 && (
        <section className="mt-8 max-w-2xl">
          <h2 className="font-display text-[28px] sm:text-4xl">Check your order</h2>
          <p className="mt-1 text-ink-soft">When you tap send, your order is saved and WhatsApp opens with everything filled in.</p>

          <div className="mt-6 rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-line">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Sweets</h3>
              <button type="button" onClick={() => go(1)} className="text-[15px] font-semibold text-brand">Change</button>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3 py-2.5 text-[15px]">
                  {l.image && <img src={l.image} alt="" className="h-12 w-12 rounded-xl object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold leading-snug">{l.name}</div>
                    <div className="text-ink-soft">{l.variant} × {l.qty}</div>
                  </div>
                  <div className="font-semibold">{inr(l.price * l.qty)}</div>
                </li>
              ))}
            </ul>
            {priced ? (
              <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[15px]">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(priced.subtotal)}</dd></div>
                <div className="flex justify-between"><dt>Delivery</dt><dd>{priced.deliveryFee ? inr(priced.deliveryFee) : 'Free'}</dd></div>
                <div className="flex justify-between pt-1 text-lg font-bold"><dt>Total</dt><dd>{inr(priced.total)}</dd></div>
              </dl>
            ) : (
              <div className="mt-3 h-20 animate-pulse rounded-xl bg-brand-soft" />
            )}
            {priced?.errors?.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-xl bg-brand-soft p-3 text-[15px] text-brand">
                {priced.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>

          <div className="mt-4 rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-line">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Deliver to</h3>
              <button type="button" onClick={() => go(2)} className="text-[15px] font-semibold text-brand">Change</button>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">{f.name}</span> · {f.phone}
              <br />
              {[f.line1, f.line2, f.landmark && `Near ${f.landmark}`].filter(Boolean).join(', ')}
              <br />
              {f.city}, {f.state} {f.pincode}
            </p>
            {f.date && <p className="mt-2 text-[15px] font-medium">Needed by {new Date(f.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>}
            {f.note && <p className="mt-2 text-[15px] text-ink-soft">Note: {f.note}</p>}
          </div>
          <p className="mt-4 text-sm text-ink-soft">Payment is arranged on WhatsApp after we confirm your order.</p>
        </section>
      )}

      {/* ---------- Action bar ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 sm:px-6">
          {error && <p role="alert" className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          {step === 1 && minShort > 0 && count > 0 && <p className="mb-2 text-sm text-brand">Minimum order is {inr(delivery.minOrder)} — add {inr(minShort)} more.</p>}
          {step === 1 && minShort === 0 && delivery.freeAbove > 0 && count > 0 && subtotal < delivery.freeAbove && (
            <p className="mb-2 text-sm text-ink-soft">Add {inr(delivery.freeAbove - subtotal)} more for free delivery.</p>
          )}
          <div className="flex items-center gap-3">
            {step > 1 ? (
              <button type="button" onClick={() => go((step - 1) as 1 | 2)} className="btn btn-ghost h-12 px-5 text-ink">
                Back
              </button>
            ) : (
              <div className="min-w-0 flex-1 leading-tight">
                <div className="font-bold">{count ? `${count} item${count > 1 ? 's' : ''} · ${inr(subtotal)}` : 'No sweets added yet'}</div>
                <div className="text-sm text-ink-soft">{count ? `${lines.length} kind${lines.length > 1 ? 's' : ''} of sweets` : 'Tap Add next to a size'}</div>
              </div>
            )}
            {step === 1 && (
              <button type="button" disabled={!count || minShort > 0} onClick={() => go(2)} className="btn btn-brand h-12 px-6 text-base">
                Next: delivery
              </button>
            )}
            {step === 2 && (
              <button type="button" onClick={() => validateDetails() && go(3)} className="btn btn-brand ml-auto h-12 flex-1 text-base sm:max-w-xs">
                Next: review order
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                disabled={busy || !priced || priced.errors?.length > 0 || !lines.length}
                onClick={send}
                className="btn ml-auto h-12 flex-1 text-base text-white sm:max-w-sm"
                style={{ background: GREEN }}
              >
                <WhatsAppIcon size={20} /> {busy ? 'Saving your order…' : 'Send order on WhatsApp'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
