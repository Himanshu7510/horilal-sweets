import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getOrderByNumber, orderToken } from '@/lib/orders';
import { safeEqual } from '@/lib/crypto';
import { fmtDate, inr } from '@/lib/format';
import { statusLabel } from '@/lib/defaults';
import { headers } from 'next/headers';
import { orderWhatsAppUrl, requestOrigin, fmtDeliveryDate } from '@/lib/whatsappOrder';
import { WhatsAppIcon } from '@/components/store/WhatsAppIcon';
import { PurchaseTracker } from '@/components/store/PurchaseTracker';

export const metadata: Metadata = { title: 'Your order', robots: { index: false } };

const STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { number } = await params;
  const { t } = await searchParams;
  const order = await getOrderByNumber(number);
  if (!order || !safeEqual(t || '', await orderToken(number))) notFound();

  const stepIndex = STEPS.indexOf(order.status === 'out_for_delivery' ? 'shipped' : order.status);
  const awaiting = order.status === 'pending_payment';
  const closed = ['cancelled', 'returned'].includes(order.status);

  let waUrl = '';
  if (order.payment_method === 'whatsapp' && !closed) {
    waUrl = await orderWhatsAppUrl(order, requestOrigin(await headers()));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      {awaiting ? (
        <>
          <h1 className="font-display text-4xl sm:text-5xl">Payment not completed</h1>
          <p className="mt-3 text-lg text-ink-soft">
            We haven’t received payment for order {order.order_number}. If money was deducted, it will be confirmed automatically within a few minutes — refresh this page to check.
          </p>
        </>
      ) : closed ? (
        <>
          <h1 className="font-display text-4xl sm:text-5xl">Order {statusLabel(order.status).toLowerCase()}</h1>
          <p className="mt-3 text-lg text-ink-soft">Order {order.order_number} was {statusLabel(order.status).toLowerCase()}. Contact us if you have questions.</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-4xl sm:text-5xl">Thank you, {String(order.customer.name || '').split(' ')[0]}!</h1>
          <p className="mt-3 text-lg text-ink-soft">
            Your order <strong className="text-ink">{order.order_number}</strong> is confirmed. Save this page to check its status anytime.
          </p>
        </>
      )}

      {waUrl && (
        <div className="mt-6 rounded-[22px] bg-[#E7F8EE] p-5">
          <p className="font-semibold text-[#14532d]">One last step: send your order to us on WhatsApp</p>
          <p className="mt-1 text-[15px] text-[#14532d]/80">We’ll reply to confirm availability, delivery time and how to pay.</p>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="btn mt-4 bg-[#25D366] px-6 py-3 text-base text-white hover:bg-[#1ebe5b]"
          >
            <WhatsAppIcon size={20} /> Send order on WhatsApp
          </a>
        </div>
      )}

      {!awaiting && !closed && (
        <PurchaseTracker
          order={{
            number: order.order_number,
            total: order.total,
            items: (order.items || []).map((i: any) => ({ id: String(i.productId), name: i.name, variant: i.variant, price: i.price, qty: i.qty })),
          }}
        />
      )}

      {!awaiting && !closed && (
        <ol className="mt-8 grid grid-cols-5 gap-1" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="text-center text-[13px] sm:text-sm">
              <div className={`h-2 rounded-full ${i <= stepIndex ? 'bg-brand' : 'bg-line'}`} />
              <div className={`mt-2 ${i <= stepIndex ? 'font-semibold text-ink' : 'text-ink-soft'}`}>{statusLabel(s)}</div>
            </li>
          ))}
        </ol>
      )}

      {(order.shipping?.awb || order.shipping?.trackingNumber) && (
        <div className="mt-6 rounded-2xl bg-accent-soft p-4 text-[15px]">
          <div className="font-semibold">
            Shipped with {order.shipping.courier || 'our courier partner'} · Tracking number {order.shipping.awb || order.shipping.trackingNumber}
          </div>
          {order.shipping.trackingUrl && (
            <a href={order.shipping.trackingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-brand underline">
              Track shipment
            </a>
          )}
        </div>
      )}

      <div className="mt-8 rounded-[22px] bg-white p-6 shadow-[0_1px_0_var(--color-line),0_10px_30px_-18px_rgba(43,21,52,0.35)]">
        <ul className="divide-y divide-line">
          {order.items.map((i: any, k: number) => (
            <li key={k} className="flex gap-3 py-3 text-[15px]">
              {i.image && <img src={i.image} alt="" className="h-14 w-14 rounded-xl object-cover" />}
              <div className="flex-1">
                <div className="font-semibold">{i.name}</div>
                <div className="text-ink-soft">{i.variant} × {i.qty}</div>
              </div>
              <div>{inr(i.lineTotal)}</div>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-line pt-4 text-[15px]">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between"><dt>Discount ({order.coupon_code})</dt><dd>−{inr(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{order.delivery_fee ? inr(order.delivery_fee) : 'Free'}</dd></div>
          {order.cod_fee > 0 && <div className="flex justify-between"><dt>Cash on delivery fee</dt><dd>{inr(order.cod_fee)}</dd></div>}
          <div className="flex justify-between pt-2 text-lg font-bold"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
          <div className="flex justify-between text-ink-soft">
            <dt>Payment</dt>
            <dd>{order.payment_method === 'cod' ? 'Cash on delivery' : order.payment_method === 'whatsapp' ? (order.payment_status === 'paid' ? 'Paid' : 'To be confirmed on WhatsApp') : order.payment_status === 'paid' ? 'Paid online' : 'Online — not completed'}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid gap-6 text-[15px] sm:grid-cols-2">
        <div>
          <div className="font-semibold">Delivering to</div>
          <p className="mt-1 text-ink-soft">
            {order.customer.name}<br />
            {order.address.line1}{order.address.line2 && `, ${order.address.line2}`}<br />
            {order.address.city}, {order.address.state} {order.address.pincode}<br />
            {order.customer.phone}
          </p>
          {order.address.deliveryDate && <p className="mt-1 font-medium">Delivery date: {fmtDeliveryDate(order.address.deliveryDate)}</p>}
        </div>
        <div>
          <div className="font-semibold">Placed on</div>
          <p className="mt-1 text-ink-soft">{fmtDate(order.created_at)}</p>
        </div>
      </div>

      <Link href="/shop" className="btn btn-brand mt-10">Continue shopping</Link>
    </div>
  );
}
