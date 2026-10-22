'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from './CartContext';

export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
      aria-label={`Cart, ${count} items`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      <span>Cart</span>
      {ready && count > 0 && (
        <span className="ml-0.5 min-w-6 rounded-full bg-accent px-1.5 text-center text-sm font-bold text-ink">{count}</span>
      )}
    </Link>
  );
}

export function AddedToast() {
  const { lastAdded, dismissAdded } = useCart();
  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(dismissAdded, 3500);
    return () => clearTimeout(t);
  }, [lastAdded, dismissAdded]);
  if (!lastAdded) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink p-3 pr-4 text-white shadow-xl sm:right-6 sm:left-auto sm:mx-0"
    >
      {lastAdded.image && <img src={lastAdded.image} alt="" className="h-12 w-12 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1 text-sm leading-snug">
        <div className="truncate font-semibold">Added {lastAdded.name}</div>
        <div className="text-white/70">
          {lastAdded.variant} × {lastAdded.qty}
        </div>
      </div>
      <Link href="/cart" onClick={dismissAdded} className="rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-ink">
        View cart
      </Link>
    </div>
  );
}
