'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const GROUPS = [
  {
    label: 'Store',
    items: [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/orders', label: 'Orders', badge: 'orders' },
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/categories', label: 'Categories' },
      { href: '/admin/coupons', label: 'Coupons' },
      { href: '/admin/messages', label: 'Messages', badge: 'messages' },
    ],
  },
  {
    label: 'Website',
    items: [
      { href: '/admin/content?tab=brand', match: '/admin/content', label: 'Brand & content' },
      { href: '/admin/pages', label: 'Pages' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/payments', label: 'Payments' },
      { href: '/admin/delivery', label: 'Delivery' },
      { href: '/admin/account', label: 'Account' },
    ],
  },
];

export function AdminNav({ newOrders, unread }: { newOrders: number; unread: number }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-5 lg:overflow-visible lg:pb-6">
      {GROUPS.map((g) => (
        <div key={g.label} className="flex gap-1 lg:block lg:space-y-0.5">
          <div className="hidden px-2 pb-1 text-xs font-semibold text-white/40 lg:block">{g.label}</div>
          {g.items.map((it: any) => {
            const base = it.match || it.href;
            const active = base === '/admin' ? path === '/admin' : path.startsWith(base);
            const count = it.badge === 'orders' ? newOrders : it.badge === 'messages' ? unread : 0;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-md px-3 py-2 text-[14px] ${
                  active ? 'bg-white/15 font-semibold text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                {it.label}
                {count > 0 && <span className="rounded-full bg-accent px-1.5 text-xs font-bold text-ink">{count}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
