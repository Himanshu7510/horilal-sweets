import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { q1 } from '@/lib/db';
import { getSetting } from '@/lib/settings';
import { inr, fmtDay } from '@/lib/format';
import { PrintButton } from './PrintButton';

export const metadata = { title: 'Invoice', robots: { index: false } };

export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const o = await q1(`SELECT * FROM orders WHERE id = $1`, [Number((await params).id)]);
  if (!o) notFound();
  const [site, footer] = await Promise.all([getSetting('site'), getSetting('footer')]);
  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-[14px] text-gray-900 print:p-0">
      <div className="mb-6 flex justify-end print:hidden"><PrintButton /></div>
      <div className="flex items-start justify-between gap-6 border-b border-gray-300 pb-5">
        <div>
          {site.logo ? <img src={site.logo} alt="" className="h-12" /> : <div className="font-display text-3xl">{site.brandName}</div>}
          <p className="mt-2 whitespace-pre-line text-gray-600">{footer.address}</p>
          <p className="text-gray-600">{[footer.phone, footer.email].filter(Boolean).join(' · ')}</p>
          {footer.gstin && <p className="text-gray-600">GSTIN: {footer.gstin}</p>}
          {footer.fssai && <p className="text-gray-600">FSSAI: {footer.fssai}</p>}
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">Invoice</div>
          <div>{o.order_number}</div>
          <div className="text-gray-600">{fmtDay(o.created_at)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 py-5">
        <div>
          <div className="font-semibold">Bill & ship to</div>
          <p className="text-gray-700">
            {o.customer.name}<br />
            {o.address.line1}{o.address.line2 && `, ${o.address.line2}`}<br />
            {o.address.landmark && <>Near {o.address.landmark}<br /></>}
            {o.address.city}, {o.address.state} – {o.address.pincode}<br />
            {o.customer.phone}
          </p>
        </div>
        <div className="text-right">
          <div className="font-semibold">Payment</div>
          <p className="text-gray-700">{o.payment_method === 'cod' ? 'Cash on delivery' : 'Paid online'}<br />Status: {o.payment_status}</p>
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-gray-300 text-left">
            <th className="py-2">Item</th><th className="py-2">Size</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i: any, k: number) => (
            <tr key={k} className="border-b border-gray-200">
              <td className="py-2">{i.name}</td><td className="py-2">{i.variant}</td>
              <td className="py-2 text-right">{inr(i.price)}</td><td className="py-2 text-right">{i.qty}</td>
              <td className="py-2 text-right">{inr(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-4 w-64 space-y-1">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
        {o.discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{inr(o.discount)}</dd></div>}
        <div className="flex justify-between"><dt>Delivery</dt><dd>{inr(o.delivery_fee)}</dd></div>
        {o.cod_fee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{inr(o.cod_fee)}</dd></div>}
        <div className="flex justify-between border-t border-gray-300 pt-1 text-base font-bold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
      </dl>
      {o.note && <p className="mt-8 rounded border border-gray-200 p-3"><strong>Note:</strong> {o.note}</p>}
      <p className="mt-10 text-center text-gray-500">Thank you for ordering from {site.brandName}!</p>
    </div>
  );
}
