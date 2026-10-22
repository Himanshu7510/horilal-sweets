import { NextResponse } from 'next/server';
import { getOrderByNumber, finalizeOrder, orderToken } from '@/lib/orders';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const order = await getOrderByNumber(String(b.orderNumber || ''));
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  if (order.payment?.razorpayOrderId !== b.razorpay_order_id) {
    return NextResponse.json({ error: 'Payment does not match this order.' }, { status: 400 });
  }
  const ok = await verifyPaymentSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature);
  if (!ok) return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
  await finalizeOrder(order.id, { razorpayOrderId: b.razorpay_order_id, razorpayPaymentId: b.razorpay_payment_id });
  const token = await orderToken(order.order_number);
  return NextResponse.json({ redirect: `/order/${order.order_number}?t=${token}` });
}
