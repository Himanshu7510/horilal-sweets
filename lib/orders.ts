import { q, q1 } from './db';
import { hmac } from './crypto';
import { getSetting } from './settings';
import { statusLabel } from './defaults';

export async function orderToken(orderNumber: string) {
  return (await hmac('order:' + orderNumber)).slice(0, 20);
}

export async function newOrderNumber() {
  const site = await getSetting('site');
  const prefix = String(site.orderPrefix || 'OD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'OD';
  const now = new Date(Date.now() + 5.5 * 3600 * 1000); // IST
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
  for (let i = 0; i < 5; i++) {
    const n = `${prefix}${ymd}${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await q1(`SELECT 1 FROM orders WHERE order_number = $1`, [n]);
    if (!exists) return n;
  }
  return `${prefix}${Date.now()}`;
}

export async function getOrderByNumber(n: string) {
  return q1(`SELECT * FROM orders WHERE order_number = $1`, [n]);
}

async function adjustStock(items: any[], direction: -1 | 1) {
  for (const i of items || []) {
    await q(
      `UPDATE products SET variants = jsonb_set(
         variants, ARRAY[$2::text, 'stock'],
         to_jsonb(GREATEST(0, COALESCE((variants->($2::int)->>'stock')::int, 0) + $3::int))
       ) WHERE id = $1 AND jsonb_array_length(variants) > $2::int`,
      [i.productId, i.variantIndex, direction * Number(i.qty)]
    );
  }
}

export async function addTimeline(orderId: number, status: string, note = '') {
  await q(
    `UPDATE orders SET timeline = timeline || $2::jsonb, updated_at = now() WHERE id = $1`,
    [orderId, JSON.stringify([{ status, label: statusLabel(status), note, at: new Date().toISOString() }])]
  );
}

// Called once an order is confirmed: COD placed, or online payment captured. Safe to call twice.
export async function finalizeOrder(orderId: number, payment?: Record<string, any>) {
  const order = await q1(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (!order) return null;
  if (payment) {
    await q(
      `UPDATE orders SET payment_status = 'paid', payment = payment || $2::jsonb, updated_at = now() WHERE id = $1`,
      [orderId, JSON.stringify({ ...payment, paidAt: new Date().toISOString() })]
    );
  }
  if (order.status === 'pending_payment') {
    await q(`UPDATE orders SET status = 'placed', updated_at = now() WHERE id = $1`, [orderId]);
    await addTimeline(
      orderId,
      'placed',
      payment ? 'Payment received' : order.payment_method === 'whatsapp' ? 'Ordered via WhatsApp — confirm and collect payment' : 'Cash on delivery order'
    );
  }
  // Apply stock exactly once.
  const claimed = await q(`UPDATE orders SET stock_applied = true WHERE id = $1 AND NOT stock_applied RETURNING id`, [orderId]);
  if (claimed.length) {
    await adjustStock(order.items, -1);
    if (order.coupon_code) await q(`UPDATE coupons SET used = used + 1 WHERE upper(code) = upper($1)`, [order.coupon_code]);
  }
  return q1(`SELECT * FROM orders WHERE id = $1`, [orderId]);
}

export async function setOrderStatus(orderId: number, status: string, note = '') {
  const order = await q1(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (!order || order.status === status) return;
  await q(`UPDATE orders SET status = $2, updated_at = now() WHERE id = $1`, [orderId, status]);
  await addTimeline(orderId, status, note);
  // Return stock when an order is cancelled or returned.
  if (['cancelled', 'returned'].includes(status) && order.stock_applied) {
    const released = await q(`UPDATE orders SET stock_applied = false WHERE id = $1 AND stock_applied RETURNING id`, [orderId]);
    if (released.length) await adjustStock(order.items, 1);
  }
}
