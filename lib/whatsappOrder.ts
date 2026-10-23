// Builds the WhatsApp message a customer sends after placing a WhatsApp order.
import { getSetting } from './settings';
import { orderToken } from './orders';
import { fillTemplate, itemLines, rupees, waLink } from './whatsapp';

export function fmtDeliveryDate(d: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return '';
  return new Date(d + 'T12:00:00+05:30').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export async function orderWhatsAppUrl(order: any, origin: string) {
  const [wa, site] = await Promise.all([getSetting('whatsapp'), getSetting('site')]);
  const a = order.address || {};
  const token = await orderToken(order.order_number);
  const date = fmtDeliveryDate(a.deliveryDate);
  const text = fillTemplate(wa.orderMessage, {
    order: order.order_number,
    items: itemLines(order.items || []),
    total: rupees(order.total) + (order.delivery_fee ? ` (incl. ₹${order.delivery_fee} delivery)` : ''),
    name: order.customer?.name || '',
    phone: order.customer?.phone || '',
    address: [a.line1, a.line2, a.landmark && `Near ${a.landmark}`, a.city, a.state, a.pincode].filter(Boolean).join(', '),
    date: date ? `Delivery date: ${date}` : '',
    note: order.note ? `Note: ${order.note}` : '',
    link: `${origin}/order/${order.order_number}?t=${token}`,
  })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return waLink(wa.number || site.whatsapp, text);
}

export function requestOrigin(h: Headers) {
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
