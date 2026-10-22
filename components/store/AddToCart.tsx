'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartContext';
import { inr } from '@/lib/format';
import { track } from '@/lib/track';
import { waLink, fillTemplate, itemLines, rupees } from '@/lib/whatsapp';
import { WaAnchor } from './WaButton';
import { WhatsAppIcon } from './WhatsAppIcon';

type V = { label: string; price: number; mrp: number; stock: number };

export function AddToCart({
  product,
  wa,
}: {
  product: { id: number; name: string; slug: string; image: string; variants: V[] };
  wa?: { number: string; message: string } | null;
}) {
  const { add } = useCart();
  const router = useRouter();
  const firstInStock = Math.max(0, product.variants.findIndex((v) => Number(v.stock) > 0));
  const [vi, setVi] = useState(firstInStock);
  const [qty, setQty] = useState(1);
  const v = product.variants[vi];
  const out = !v || Number(v.stock) <= 0;
  const off = v && Number(v.mrp) > Number(v.price) ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;

  const addTracked = (it: ReturnType<typeof item>) => {
    add(it);
    track('add_to_cart', { items: [{ id: String(it.productId), name: it.name, variant: it.variant, price: it.price, qty: it.qty }] });
  };

  const waHref =
    wa && v
      ? waLink(wa.number, fillTemplate(wa.message, {
          items: itemLines([{ name: product.name, variant: v.label, qty, price: Number(v.price) }]),
          total: rupees(Number(v.price) * qty),
          product: product.name,
        }))
      : '';

  const item = () => ({
    productId: product.id,
    variantIndex: vi,
    qty,
    name: product.name,
    variant: v.label,
    price: Number(v.price),
    image: product.image,
    slug: product.slug,
  });

  return (
    <div className="mt-6">
      {v && (
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">{inr(v.price)}</span>
          {off > 0 && (
            <>
              <span className="text-lg text-ink-soft line-through">{inr(v.mrp)}</span>
              <span className="rounded-full bg-pista/15 px-2 py-0.5 text-sm font-semibold text-[#4d6b25]">{off}% off</span>
            </>
          )}
        </div>
      )}
      <p className="mt-1 text-sm text-ink-soft">Inclusive of all taxes</p>

      {product.variants.length > 1 && (
        <fieldset className="mt-6">
          <legend className="mb-2 font-semibold">Choose a size</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((x, idx) => {
              const sold = Number(x.stock) <= 0;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={sold}
                  onClick={() => setVi(idx)}
                  aria-pressed={idx === vi}
                  className={`rounded-xl border-2 px-4 py-2 text-left leading-tight ${
                    idx === vi ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/50'
                  } ${sold ? 'opacity-45 line-through' : ''}`}
                >
                  <span className="block font-semibold">{x.label}</span>
                  <span className="block text-sm text-ink-soft">{inr(x.price)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-line bg-white">
          <button type="button" className="h-11 w-11 text-xl" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
          <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
          <button
            type="button"
            className="h-11 w-11 text-xl"
            onClick={() => setQty((q) => Math.min(Number(v?.stock || 1), 50, q + 1))}
            aria-label="Increase quantity"
          >+</button>
        </div>
        <button type="button" disabled={out} onClick={() => addTracked(item())} className="btn btn-brand h-11 px-7">
          {out ? 'Sold out' : 'Add to cart'}
        </button>
        {!out && (
          <button
            type="button"
            onClick={() => {
              addTracked(item());
              router.push('/checkout');
            }}
            className="btn btn-ghost h-11 px-6 text-brand"
          >
            Buy now
          </button>
        )}
      </div>
      {waHref && !out && (
        <WaAnchor
          href={waHref}
          placement="product"
          className="btn mt-3 h-11 bg-[#25D366] px-6 text-white hover:bg-[#1ebe5b]"
        >
          <WhatsAppIcon /> Order on WhatsApp
        </WaAnchor>
      )}
      {!out && Number(v.stock) <= 5 && <p className="mt-3 text-sm font-semibold text-brand">Only {v.stock} left</p>}
    </div>
  );
}
