import Link from 'next/link';
import { q, q1 } from '@/lib/db';
import { inr, fmtDate } from '@/lib/format';
import { Badge, PageHeader, btnLight } from '@/components/admin/Page';

export const metadata = { title: 'Orders' };

const TABS = [
  { key: '', label: 'All' },
  { key: 'to_ship', label: 'To ship' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'pending_payment', label: 'Unpaid / abandoned' },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const status = sp.status || '';
  const search = (sp.q || '').trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 30;

  const where: string[] = [];
  const params: any[] = [];
  if (status === 'to_ship') where.push(`status IN ('placed','confirmed','packed')`);
  else if (status === 'shipped') where.push(`status IN ('shipped','out_for_delivery')`);
  else if (status === 'cancelled') where.push(`status IN ('cancelled','returned')`);
  else if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  } else where.push(`status <> 'pending_payment'`);
  if (search) {
    params.push(`%${search}%`);
    where.push(`(order_number ILIKE $${params.length} OR customer->>'name' ILIKE $${params.length} OR customer->>'phone' ILIKE $${params.length} OR customer->>'email' ILIKE $${params.length})`);
  }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [rows, count] = await Promise.all([
    q(`SELECT * FROM orders ${w} ORDER BY created_at DESC LIMIT ${per} OFFSET ${(page - 1) * per}`, params),
    q1(`SELECT count(*)::int AS n FROM orders ${w}`, params),
  ]);
  const pages = Math.max(1, Math.ceil(count.n / per));
  const link = (patch: Record<string, any>) => {
    const p = new URLSearchParams({ ...(status && { status }), ...(search && { q: search }), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v || v === '1' && k === 'page') p.delete(k);
    return `/admin/orders${p.toString() ? '?' + p : ''}`;
  };

  return (
    <>
      <PageHeader title="Orders" sub={`${count.n} order${count.n === 1 ? '' : 's'}`} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={link({ status: t.key, page: '' })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${status === t.key ? 'bg-ink text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}
          >
            {t.label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2" action="/admin/orders">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={search} placeholder="Order no., name or phone" className="field w-60 py-1.5" />
          <button className={btnLight}>Search</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-4 py-2.5">Order</th>
              <th className="px-3 py-2.5">Customer</th>
              <th className="px-3 py-2.5">Items</th>
              <th className="px-3 py-2.5">Payment</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((o: any) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand">{o.order_number}</Link>
                  <div className="text-xs text-gray-500">{fmtDate(o.created_at)}</div>
                </td>
                <td className="px-3 py-3">
                  <div>{o.customer?.name}</div>
                  <div className="text-xs text-gray-500">{o.customer?.phone} · {o.address?.city}</div>
                </td>
                <td className="px-3 py-3 text-gray-700">{(o.items || []).reduce((s: number, i: any) => s + i.qty, 0)} items</td>
                <td className="px-3 py-3">
                  <Badge value={o.payment_status} label={o.payment_method === 'cod' ? (o.payment_status === 'paid' ? 'COD · paid' : 'COD') : o.payment_status === 'paid' ? 'Paid online' : o.payment_status} />
                </td>
                <td className="px-3 py-3"><Badge value={o.status} /></td>
                <td className="px-4 py-3 text-right font-semibold">{inr(o.total)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-600">No orders here yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link className={btnLight} href={link({ page: String(page - 1) })}>Previous</Link>}
          <span>Page {page} of {pages}</span>
          {page < pages && <Link className={btnLight} href={link({ page: String(page + 1) })}>Next</Link>}
        </div>
      )}
    </>
  );
}
