import { NextResponse } from 'next/server';
import { q1 } from '@/lib/db';
import { priceCart, checkPincode } from '@/lib/pricing';
import { getSetting } from '@/lib/settings';
import { createRazorpayOrder } from '@/lib/razorpay';
import { finalizeOrder, newOrderNumber, orderToken, addTimeline } from '@/lib/orders';

const clean = (s: any, n = 200) => String(s ?? '').trim().slice(0, n);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const c = body.customer || {};
  const a = body.address || {};
  const paymentMethod = body.paymentMethod === 'online' ? 'online' : 'cod';

  const customer = { name: clean(c.name, 80), phone: clean(c.phone, 15).replace(/[^\d+]/g, ''), email: clean(c.email, 120) };
  const address = {
    line1: clean(a.line1),
    line2: clean(a.line2),
    landmark: clean(a.landmark, 120),
    city: clean(a.city, 80),
    state: clean(a.state, 80),
    pincode: clean(a.pincode, 6),
  };

  const missing: string[] = [];
  if (customer.name.length < 2) missing.push('name');
  if (!/^(\+?91)?[6-9]\d{9}$/.test(customer.phone)) missing.push('a valid 10-digit mobile number');
  if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email)) missing.push('a valid email');
  if (address.line1.length < 3) missing.push('address');
  if (!address.city) missing.push('city');
  if (!address.state) missing.push('state');
  if (missing.length) return NextResponse.json({ error: `Please add ${missing.join(', ')}.` }, { status: 400 });

  const pin = await checkPincode(address.pincode);
  if (!pin.ok) return NextResponse.json({ error: pin.message }, { status: 400 });

  const priced = await priceCart(body.items || [], { coupon: body.coupon, paymentMethod: paymentMethod === 'cod' ? 'cod' : 'online' });
  if (!priced.lines.length) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  if (priced.errors.length) return NextResponse.json({ error: priced.errors.join(' '), priced }, { status: 409 });
  if (paymentMethod === 'cod' && !priced.codAvailable) return NextResponse.json({ error: 'Cash on delivery isn’t available for this order.' }, { status: 400 });
  if (paymentMethod === 'online' && !priced.onlineAvailable) return NextResponse.json({ error: 'Online payment isn’t available right now. Choose cash on delivery.' }, { status: 400 });

  const orderNumber = await newOrderNumber();
  const order = await q1(
    `INSERT INTO orders (order_number, customer, address, items, subtotal, discount, delivery_fee, cod_fee, total, coupon_code, payment_method, payment_status, status, note)
     VALUES ($1,$2::jsonb,$3::jsonb,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,'pending','pending_payment',$12) RETURNING *`,
    [
      orderNumber,
      JSON.stringify(customer),
      JSON.stringify(address),
      JSON.stringify(priced.lines),
      priced.subtotal,
      priced.discount,
      priced.deliveryFee,
      priced.codFee,
      priced.total,
      priced.couponCode,
      paymentMethod === 'cod' ? 'cod' : 'razorpay',
      clean(body.note, 500),
    ]
  );
  await addTimeline(order.id, 'pending_payment', 'Order created');
  const token = await orderToken(orderNumber);

  if (paymentMethod === 'cod') {
    await finalizeOrder(order.id);
    return NextResponse.json({ orderNumber, redirect: `/order/${orderNumber}?t=${token}` });
  }

  try {
    const rz = await createRazorpayOrder(priced.total, orderNumber, { order_number: orderNumber });
    await q1(`UPDATE orders SET payment = $2::jsonb WHERE id = $1`, [order.id, JSON.stringify({ razorpayOrderId: rz.id })]);
    const site = await getSetting('site');
    const pay = await getSetting('payment');
    return NextResponse.json({
      orderNumber,
      token,
      razorpay: {
        key: rz.keyId,
        order_id: rz.id,
        amount: rz.amount,
        currency: 'INR',
        name: site.brandName,
        description: `Order ${orderNumber}`,
        image: site.logo || undefined,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        notes: { order_number: orderNumber },
        theme: { color: pay.razorpayThemeColor || site.primaryColor },
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Couldn’t start online payment: ${e.message}` }, { status: 502 });
  }
}
