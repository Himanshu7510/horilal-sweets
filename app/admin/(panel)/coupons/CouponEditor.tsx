'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Notice, Toggle, type Result } from '@/components/admin/ui';
import { saveCoupon, deleteCoupon } from '../../actions';

export function CouponEditor({ initial }: { initial: any }) {
  const router = useRouter();
  const isNew = !initial.id;
  const [open, setOpen] = useState(false);
  const [c, setC] = useState(initial);
  const [res, setRes] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string, v: any) => setC((x: any) => ({ ...x, [k]: v }));
  const num = (k: string) => (e: any) => set(k, e.target.value.replace(/\D/g, ''));

  if (isNew && !open)
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-xl border-2 border-dashed border-gray-300 p-4 text-sm font-semibold text-gray-700 hover:border-gray-400">
        + Create a coupon
      </button>
    );

  const summary = `${c.type === 'percent' ? `${c.value || 0}% off` : `₹${c.value || 0} off`}${Number(c.min_order) ? ` on orders above ₹${c.min_order}` : ''}${c.type === 'percent' && Number(c.max_discount) ? `, up to ₹${c.max_discount}` : ''}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveCoupon(c);
          setRes(r);
          if (r.ok && isNew) {
            setC(initial);
            setOpen(false);
          }
          router.refresh();
        });
      }}
      className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-gray-900 px-2.5 py-1 font-mono text-sm font-bold tracking-wide text-white">{c.code || 'NEWCODE'}</span>
        <span className="text-sm text-gray-700">{summary}</span>
        {!isNew && <span className="text-sm text-gray-500">· used {c.used}{Number(c.usage_limit) ? ` of ${c.usage_limit}` : ''} times</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Code</span>
          <input className="field uppercase" required value={c.code} onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Discount type</span>
          <select className="field" value={c.type} onChange={(e) => set('type', e.target.value)}>
            <option value="percent">Percentage (%)</option>
            <option value="flat">Fixed amount (₹)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{c.type === 'percent' ? 'Percent off' : 'Amount off (₹)'}</span>
          <input className="field" inputMode="numeric" required value={c.value} onChange={num('value')} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Minimum order (₹)</span>
          <input className="field" inputMode="numeric" value={c.min_order} onChange={num('min_order')} />
        </label>
        {c.type === 'percent' && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Maximum discount (₹)</span>
            <input className="field" inputMode="numeric" value={c.max_discount} onChange={num('max_discount')} />
            <span className="mt-1 block text-xs text-gray-500">0 = no limit</span>
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Total uses allowed</span>
          <input className="field" inputMode="numeric" value={c.usage_limit} onChange={num('usage_limit')} />
          <span className="mt-1 block text-xs text-gray-500">0 = unlimited</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Expires on</span>
          <input type="date" className="field" value={c.expires_at || ''} onChange={(e) => set('expires_at', e.target.value)} />
        </label>
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-sm font-medium">Message at checkout</span>
          <input className="field" placeholder="e.g. 10% off your first order" value={c.description} onChange={(e) => set('description', e.target.value)} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
        <Toggle checked={c.active} onChange={(v) => set('active', v)} label="Active" />
        <button disabled={pending} className="btn btn-brand rounded-lg py-2">{pending ? 'Saving…' : isNew ? 'Create coupon' : 'Save'}</button>
        {isNew ? (
          <button type="button" className="text-sm text-gray-600" onClick={() => setOpen(false)}>Cancel</button>
        ) : (
          <button
            type="button"
            className="text-sm font-semibold text-red-700"
            onClick={() => {
              if (!window.confirm(`Delete coupon ${c.code}?`)) return;
              start(async () => {
                await deleteCoupon(c.id);
                router.refresh();
              });
            }}
          >
            Delete
          </button>
        )}
        <Notice result={res} />
      </div>
    </form>
  );
}
