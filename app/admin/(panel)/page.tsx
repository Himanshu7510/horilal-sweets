import Link from 'next/link';
import { q, q1, dbKind } from '@/lib/db';
import { getSetting, secretStatus } from '@/lib/settings';
import { inr, fmtDate } from '@/lib/format';
import { Badge, Card, PageHeader } from '@/components/admin/Page';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard() {
  const paid = `status NOT IN ('pending_payment','cancelled','returned')`;
  const [wa, tracking] = await Promise.all([getSetting('whatsapp'), getSetting('tracking')]);
  const [stats, recent, lowStock, site, footer, payment, delivery, paySecrets, kind] = await Promise.all([
    q1(`SELECT
        (SELECT count(*)::int FROM orders WHERE ${paid} AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata') AS today_orders,
        (SELECT COALESCE(sum(total),0)::int FROM orders WHERE ${paid} AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata') AS today_revenue,
        (SELECT count(*)::int FROM orders WHERE ${paid} AND created_at >= now() - interval '30 days') AS month_orders,
        (SELECT COALESCE(sum(total),0)::int FROM orders WHERE ${paid} AND created_at >= now() - interval '30 days') AS month_revenue,
        (SELECT count(*)::int FROM orders WHERE status IN ('placed','confirmed','packed')) AS to_ship,
        (SELECT count(*)::int FROM products WHERE active) AS products`),
    q(`SELECT * FROM orders WHERE status <> 'pending_payment' ORDER BY created_at DESC LIMIT 8`),
    q(`SELECT p.id, p.name, v->>'label' AS label, (v->>'stock')::int AS stock
       FROM products p, jsonb_array_elements(p.variants) v
       WHERE p.active AND (v->>'stock')::int <= 5 ORDER BY (v->>'stock')::int, p.name LIMIT 8`),
    getSetting('site'),
    getSetting('footer'),
    getSetting('payment'),
    getSetting('delivery'),
    secretStatus('payment'),
    dbKind(),
  ]);

  const checklist = [
    { done: kind === 'postgres', label: 'Connect a permanent database', href: null, hint: 'Vercel → your project → Storage → Neon Postgres' },
    { done: !!site.logo || site.brandName !== 'Horilal Sweets', label: 'Add your brand name and logo', href: '/admin/content?tab=brand' },
    { done: !!footer.phone && !!footer.address, label: 'Add your address and phone number', href: '/admin/content?tab=footer' },
    { done: !!payment.razorpayKeyId && paySecrets.razorpayKeySecret && payment.razorpayEnabled, label: 'Set up online payments (Razorpay)', href: '/admin/payments' },
    { done: delivery.provider === 'shiprocket' || !!delivery.estimate, label: 'Choose delivery charges and courier', href: '/admin/delivery' },
    { done: !!footer.fssai, label: 'Add your FSSAI licence number', href: '/admin/content?tab=footer' },
    { done: !!(wa.number || site.whatsapp), label: 'Add your WhatsApp number for orders', href: '/admin/whatsapp' },
    { done: !!(tracking.metaPixelId || tracking.ga4Id || tracking.gtmId), label: 'Connect Meta Pixel or Google Analytics', href: '/admin/marketing' },
  ];
  const pending = checklist.filter((c) => !c.done);

  const tiles = [
    { label: 'Orders today', value: stats.today_orders },
    { label: 'Sales today', value: inr(stats.today_revenue) },
    { label: 'Sales, last 30 days', value: inr(stats.month_revenue), sub: `${stats.month_orders} orders` },
    { label: 'Waiting to ship', value: stats.to_ship, href: '/admin/orders?status=to_ship' },
  ];

  return (
    <>
      <PageHeader title="Dashboard" sub={`Welcome back. Here’s how ${site.brandName} is doing.`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => {
          const inner = (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70">
              <div className="text-sm text-gray-600">{t.label}</div>
              <div className="mt-1 text-2xl font-bold">{t.value}</div>
              {t.sub && <div className="text-sm text-gray-500">{t.sub}</div>}
            </div>
          );
          return t.href ? <Link key={t.label} href={t.href}>{inner}</Link> : <div key={t.label}>{inner}</div>;
        })}
      </div>

      {pending.length > 0 && (
        <Card title="Finish setting up your store" className="mt-6">
          <ul className="divide-y divide-gray-100">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-3 py-2.5">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${c.done ? 'bg-green-600 text-white' : 'border-2 border-gray-300'}`}>
                  {c.done ? '✓' : ''}
                </span>
                <span className={c.done ? 'text-gray-500 line-through' : ''}>{c.label}</span>
                {!c.done && c.href && <Link href={c.href} className="ml-auto text-sm font-semibold text-brand">Set up</Link>}
                {!c.done && !c.href && c.hint && <span className="ml-auto text-right text-xs text-gray-500">{c.hint}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-sm font-semibold text-brand">View all</Link>}>
          {recent.length ? (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {recent.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5">
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand">{o.order_number}</Link>
                        <div className="text-xs text-gray-500">{fmtDate(o.created_at)}</div>
                      </td>
                      <td className="px-2 py-2.5">{o.customer?.name}</td>
                      <td className="px-2 py-2.5"><Badge value={o.status} /></td>
                      <td className="px-5 py-2.5 text-right font-semibold">{inr(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No orders yet. They’ll appear here as soon as customers check out.</p>
          )}
        </Card>

        <Card title="Low stock" actions={<Link href="/admin/products" className="text-sm font-semibold text-brand">Manage</Link>}>
          {lowStock.length ? (
            <ul className="space-y-2 text-sm">
              {lowStock.map((s: any, i: number) => (
                <li key={i} className="flex justify-between gap-3">
                  <Link href={`/admin/products/${s.id}`} className="hover:text-brand">{s.name} <span className="text-gray-500">· {s.label}</span></Link>
                  <span className={`font-semibold ${s.stock === 0 ? 'text-red-700' : 'text-amber-700'}`}>{s.stock === 0 ? 'Sold out' : `${s.stock} left`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">Everything is well stocked.</p>
          )}
        </Card>
      </div>
    </>
  );
}
