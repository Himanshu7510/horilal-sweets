import Link from 'next/link';
import { notFound } from 'next/navigation';
import { q1 } from '@/lib/db';
import { getSetting } from '@/lib/settings';
import { inr, fmtDate } from '@/lib/format';
import { ORDER_STATUSES } from '@/lib/defaults';
import { Badge, Card, PageHeader, btnLight } from '@/components/admin/Page';
import { StatusForm, NoteForm, ManualShipping, ShiprocketPanel, PaymentActions } from './OrderActions';
import { deleteOrder } from '../../../actions';
import { ActionButton } from '@/components/admin/ui';

export const metadata = { title: 'Order' };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const o = await q1(`SELECT * FROM orders WHERE id = $1`, [id]);
  if (!o) notFound();
  const delivery = await getSetting('delivery');
  const s = o.shipping || {};
  const unpaid = o.status === 'pending_payment';

  return (
    <>
      <PageHeader
        title={`Order ${o.order_number}`}
        sub={<>Placed {fmtDate(o.created_at)} · <Badge value={o.status} /></>}
        actions={
          <>
            <Link href={`/admin/invoice/${o.id}`} target="_blank" className={btnLight}>Print invoice</Link>
            <Link href="/admin/orders" className={btnLight}>All orders</Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Items">
            <ul className="divide-y divide-gray-100">
              {o.items.map((i: any, k: number) => (
                <li key={k} className="flex items-center gap-3 py-2.5 text-sm">
                  {i.image && <img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <div className="font-semibold">{i.name}</div>
                    <div className="text-gray-600">{i.variant} · {inr(i.price)} × {i.qty}</div>
                  </div>
                  <div className="font-semibold">{inr(i.lineTotal)}</div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between"><dt>Discount ({o.coupon_code})</dt><dd>−{inr(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Delivery</dt><dd>{inr(o.delivery_fee)}</dd></div>
              {o.cod_fee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{inr(o.cod_fee)}</dd></div>}
              <div className="flex justify-between pt-1 text-base font-bold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
            </dl>
            {o.note && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm">
                <div className="font-semibold">Customer note</div>
                <p className="whitespace-pre-line">{o.note}</p>
              </div>
            )}
          </Card>

          <Card title="Update status">
            {unpaid ? (
              <p className="mb-3 text-sm text-gray-600">This order hasn’t been paid yet. The customer may have closed the payment window. You can mark it paid if you received the money another way, or cancel it.</p>
            ) : null}
            <StatusForm id={o.id} current={o.status} statuses={ORDER_STATUSES.filter((x) => x.value !== 'pending_payment')} />
            <ol className="mt-5 space-y-2 border-l-2 border-gray-200 pl-4 text-sm">
              {[...(o.timeline || [])].reverse().map((t: any, k: number) => (
                <li key={k}>
                  <span className="font-semibold">{t.label}</span> <span className="text-gray-500">· {fmtDate(t.at)}</span>
                  {t.note && <div className="text-gray-600">{t.note}</div>}
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Shipping">
            {(s.awb || s.trackingNumber) && (
              <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm">
                <div><span className="text-gray-600">Courier:</span> <strong>{s.courier || '—'}</strong></div>
                <div><span className="text-gray-600">Tracking no.:</span> <strong>{s.awb || s.trackingNumber}</strong></div>
                {s.trackingUrl && <a href={s.trackingUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand">Open tracking page</a>}
                {s.lastTracking?.status && <div className="mt-1"><span className="text-gray-600">Latest:</span> {s.lastTracking.status} <span className="text-gray-500">({fmtDate(s.lastTracking.at)})</span></div>}
              </div>
            )}
            {delivery.provider === 'shiprocket' && !unpaid && (
              <div className="mb-5">
                <ShiprocketPanel id={o.id} shipping={s} />
              </div>
            )}
            <details open={delivery.provider !== 'shiprocket'}>
              <summary className="cursor-pointer text-sm font-semibold text-gray-800">
                {delivery.provider === 'shiprocket' ? 'Enter tracking details manually instead' : 'Courier & tracking details'}
              </summary>
              <div className="mt-3">
                <ManualShipping id={o.id} shipping={s} />
              </div>
            </details>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <div className="text-sm">
              <div className="font-semibold">{o.customer.name}</div>
              <a href={`tel:${o.customer.phone}`} className="block text-brand">{o.customer.phone}</a>
              {o.customer.email && <a href={`mailto:${o.customer.email}`} className="block text-brand">{o.customer.email}</a>}
              <a href={`https://wa.me/${String(o.customer.phone).replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-green-700">
                Message on WhatsApp
              </a>
            </div>
            <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
              <div className="mb-1 font-semibold">Delivery address</div>
              <p className="text-gray-700">
                {o.address.line1}<br />
                {o.address.line2 && <>{o.address.line2}<br /></>}
                {o.address.landmark && <>Near {o.address.landmark}<br /></>}
                {o.address.city}, {o.address.state} – {o.address.pincode}
              </p>
            </div>
          </Card>

          <Card title="Payment">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Method</span><strong>{o.payment_method === 'cod' ? 'Cash on delivery' : 'Online (Razorpay)'}</strong></div>
              <div className="flex justify-between"><span>Status</span><Badge value={o.payment_status} label={o.payment_status.replace('_', ' ')} /></div>
              {o.payment?.razorpayPaymentId && <div className="flex justify-between gap-2"><span>Payment ID</span><span className="truncate font-mono text-xs">{o.payment.razorpayPaymentId}</span></div>}
              {o.payment?.reference && <div className="flex justify-between gap-2"><span>Reference</span><span>{o.payment.reference}</span></div>}
              {o.payment?.refundAmount && <div className="flex justify-between"><span>Refunded</span><span>{inr(o.payment.refundAmount)}</span></div>}
            </div>
            <div className="mt-4">
              <PaymentActions id={o.id} total={o.total} canMarkPaid={o.payment_status !== 'paid' && !o.payment_status.includes('refund')} canRefund={!!o.payment?.razorpayPaymentId && o.payment_status === 'paid'} />
            </div>
          </Card>

          <Card title="Private note">
            <NoteForm id={o.id} note={o.admin_note} />
          </Card>

          {(unpaid || o.status === 'cancelled') && (
            <ActionButton
              action={deleteOrder.bind(null, o.id)}
              confirm="Delete this order permanently?"
              redirectTo="/admin/orders"
              className="text-sm font-semibold text-red-700"
            >
              Delete this order
            </ActionButton>
          )}
        </div>
      </div>
    </>
  );
}
