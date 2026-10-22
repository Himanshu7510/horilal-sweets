'use client';

import { useEffect } from 'react';
import { track, type TrackItem } from '@/lib/track';

// Reports a purchase once per order, even if the confirmation page is reloaded.
export function PurchaseTracker({ order }: { order: { number: string; total: number; items: TrackItem[] } }) {
  useEffect(() => {
    const key = `tracked_purchase_${order.number}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {}
    // Give the tracking scripts a moment to load.
    const t = setTimeout(() => track('purchase', { items: order.items, value: order.total, orderId: order.number }), 800);
    return () => clearTimeout(t);
  }, [order]);
  return null;
}

export function ViewItemTracker({ item }: { item: TrackItem }) {
  useEffect(() => {
    const t = setTimeout(() => track('view_item', { items: [item] }), 800);
    return () => clearTimeout(t);
  }, [item]);
  return null;
}
