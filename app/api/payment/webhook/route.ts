// Razorpay webhook: set this URL in Razorpay Dashboard → Settings → Webhooks
// and subscribe to "payment.captured" and "order.paid".
import { NextResponse } from 'next/server';
import { q1 } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { finalizeOrder } from '@/lib/orders';

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature') || '';
  if (!(await verifyWebhookSignature(raw, sig))) return NextResponse.json({ ok: false }, { status: 401 });
  const evt = JSON.parse(raw || '{}');
  const payment = evt?.payload?.payment?.entity;
  const rzOrderId = payment?.order_id || evt?.payload?.order?.entity?.id;
  if (rzOrderId && ['payment.captured', 'order.paid'].includes(evt.event)) {
    const order = await q1(`SELECT id FROM orders WHERE payment->>'razorpayOrderId' = $1`, [rzOrderId]);
    if (order) await finalizeOrder(order.id, { razorpayOrderId: rzOrderId, razorpayPaymentId: payment?.id || '', method: payment?.method || '' });
  }
  if (rzOrderId && evt.event === 'payment.failed') {
    await q1(
      `UPDATE orders SET payment_status = 'failed', updated_at = now() WHERE payment->>'razorpayOrderId' = $1 AND payment_status = 'pending'`,
      [rzOrderId]
    );
  }
  return NextResponse.json({ ok: true });
}
