'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = {
  productId: number;
  variantIndex: number;
  qty: number;
  name: string;
  variant: string;
  price: number;
  image: string;
  slug: string;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (item: CartItem) => void;
  setQty: (productId: number, variantIndex: number, qty: number) => void;
  remove: (productId: number, variantIndex: number) => void;
  clear: () => void;
  replace: (items: CartItem[]) => void;
  lastAdded: CartItem | null;
  dismissAdded: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = 'store_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.productId === item.productId && x.variantIndex === item.variantIndex);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], ...item, qty: Math.min(50, next[i].qty + item.qty) };
        return next;
      }
      return [...prev, item];
    });
    setLastAdded(item);
  }, []);

  const setQty = useCallback((productId: number, variantIndex: number, qty: number) => {
    setItems((prev) =>
      prev
        .map((x) => (x.productId === productId && x.variantIndex === variantIndex ? { ...x, qty: Math.max(0, Math.min(50, qty)) } : x))
        .filter((x) => x.qty > 0)
    );
  }, []);

  const remove = useCallback((productId: number, variantIndex: number) => {
    setItems((prev) => prev.filter((x) => !(x.productId === productId && x.variantIndex === variantIndex)));
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
      add,
      setQty,
      remove,
      clear: () => setItems([]),
      replace: (next) => setItems(next),
      lastAdded,
      dismissAdded: () => setLastAdded(null),
    }),
    [items, ready, add, setQty, remove, lastAdded]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart must be inside CartProvider');
  return c;
}
