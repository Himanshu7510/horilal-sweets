// Shiprocket integration: https://apidocs.shiprocket.in/
import { getSettingWithSecrets } from './settings';
import { q, q1 } from './db';

const API = 'https://apiv2.shiprocket.in/v1/external';
const g = globalThis as any;

async function token(force = false): Promise<string> {
  const d = await getSettingWithSecrets('delivery');
  if (!d.shiprocketEmail || !d.shiprocketPassword) {
    throw new Error('Shiprocket login is not set. Add the API user email and password in Admin → Delivery.');
  }
  const cacheKey = d.shiprocketEmail;
  const cached = g.__srToken;
  if (!force && cached && cached.key === cacheKey && cached.exp > Date.now()) return cached.token;
  const stored = await q1(`SELECT value FROM settings WHERE key = '_shiprocket_token'`);
  if (!force && stored?.value?.key === cacheKey && stored.value.exp > Date.now()) {
    g.__srToken = stored.value;
    return stored.value.token;
  }
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: d.shiprocketEmail, password: d.shiprocketPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) throw new Error(data?.message || `Shiprocket login failed (${res.status})`);
  const entry = { key: cacheKey, token: data.token, exp: Date.now() + 8 * 24 * 3600 * 1000 };
  g.__srToken = entry;
  await q(
    `INSERT INTO settings (key, value) VALUES ('_shiprocket_token', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(entry)]
  );
  return data.token;
}

async function call(path: string, init: RequestInit = {}, retry = true): Promise<any> {
  const t = await token();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}`, ...(init.headers || {}) },
  });
  if (res.status === 401 && retry) {
    await token(true);
    return call(path, init, false);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || (data?.errors ? JSON.stringify(data.errors) : `Shiprocket returned ${res.status}`);
    throw new Error(msg);
  }
  return data;
}

export async function testShiprocket() {
  try {
    await token(true);
    const pickups = await call('/settings/company/pickup');
    const names = (pickups?.data?.shipping_address || []).map((p: any) => p.pickup_location).filter(Boolean);
    return { ok: true, message: `Connected. Pickup locations: ${names.join(', ') || 'none found — add one in Shiprocket'}` };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}

export async function checkServiceability(deliveryPincode: string, weightKg: number, cod: boolean) {
  const d = await getSettingWithSecrets('delivery');
  if (!d.shiprocketPickupPincode) return null;
  const params = new URLSearchParams({
    pickup_postcode: d.shiprocketPickupPincode,
    delivery_postcode: deliveryPincode,
    weight: String(weightKg || d.defaultWeightKg || 0.5),
    cod: cod ? '1' : '0',
  });
  const data = await call(`/courier/serviceability/?${params}`, { method: 'GET' });
  const couriers = data?.data?.available_courier_companies || [];
  return {
    serviceable: couriers.length > 0,
    etd: couriers[0]?.etd || '',
    cheapest: couriers.reduce((m: any, c: any) => (!m || c.rate < m.rate ? c : m), null),
  };
}

export async function createShipment(orderId: number) {
  const order = await q1(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (!order) throw new Error('Order not found');
  const d = await getSettingWithSecrets('delivery');
  const [first, ...rest] = String(order.customer.name || 'Customer').trim().split(' ');
  const weight = Math.max(
    Number(d.defaultWeightKg || 0.5),
    (order.items || []).reduce((s: number, i: any) => s + Number(i.weightGrams || 0) * i.qty, 0) / 1000
  );
  const created = new Date(order.created_at);
  const pad = (n: number) => String(n).padStart(2, '0');
  const orderDate = `${created.getFullYear()}-${pad(created.getMonth() + 1)}-${pad(created.getDate())} ${pad(created.getHours())}:${pad(created.getMinutes())}`;

  const body = {
    order_id: order.order_number,
    order_date: orderDate,
    pickup_location: d.shiprocketPickupLocation || 'Primary',
    billing_customer_name: first,
    billing_last_name: rest.join(' ') || '.',
    billing_address: order.address.line1,
    billing_address_2: [order.address.line2, order.address.landmark].filter(Boolean).join(', '),
    billing_city: order.address.city,
    billing_pincode: order.address.pincode,
    billing_state: order.address.state,
    billing_country: 'India',
    billing_email: order.customer.email || 'noreply@example.com',
    billing_phone: order.customer.phone,
    shipping_is_billing: true,
    order_items: (order.items || []).map((i: any) => ({
      name: `${i.name} (${i.variant})`,
      sku: i.sku || `${i.productId}-${i.variantIndex}`,
      units: i.qty,
      selling_price: i.price,
    })),
    payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
    shipping_charges: order.delivery_fee + order.cod_fee,
    total_discount: order.discount,
    sub_total: order.subtotal,
    length: Number(d.pkgLength || 20),
    breadth: Number(d.pkgBreadth || 15),
    height: Number(d.pkgHeight || 8),
    weight: Number(weight.toFixed(2)),
  };

  const created1 = await call('/orders/create/adhoc', { method: 'POST', body: JSON.stringify(body) });
  const shipping: any = {
    ...(order.shipping || {}),
    provider: 'shiprocket',
    shiprocketOrderId: created1.order_id,
    shipmentId: created1.shipment_id,
    createdAt: new Date().toISOString(),
  };

  if (d.shiprocketAutoAwb && created1.shipment_id) {
    try {
      const awb = await call('/courier/assign/awb', { method: 'POST', body: JSON.stringify({ shipment_id: created1.shipment_id }) });
      const r = awb?.response?.data || {};
      shipping.awb = r.awb_code || '';
      shipping.courier = r.courier_name || '';
      if (shipping.awb) shipping.trackingUrl = `https://shiprocket.co/tracking/${shipping.awb}`;
    } catch (e: any) {
      shipping.awbError = e.message;
    }
  }

  if (d.shiprocketAutoPickup && shipping.awb) {
    try {
      await call('/courier/generate/pickup', { method: 'POST', body: JSON.stringify({ shipment_id: [created1.shipment_id] }) });
      shipping.pickupRequested = true;
    } catch (e: any) {
      shipping.pickupError = e.message;
    }
  }

  await q(`UPDATE orders SET shipping = $2::jsonb, updated_at = now() WHERE id = $1`, [orderId, JSON.stringify(shipping)]);
  return shipping;
}

export async function assignAwb(orderId: number) {
  const order = await q1(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  const shipping = order?.shipping || {};
  if (!shipping.shipmentId) throw new Error('Create the Shiprocket shipment first.');
  const awb = await call('/courier/assign/awb', { method: 'POST', body: JSON.stringify({ shipment_id: shipping.shipmentId }) });
  const r = awb?.response?.data || {};
  shipping.awb = r.awb_code || shipping.awb || '';
  shipping.courier = r.courier_name || shipping.courier || '';
  if (shipping.awb) shipping.trackingUrl = `https://shiprocket.co/tracking/${shipping.awb}`;
  delete shipping.awbError;
  await q(`UPDATE orders SET shipping = $2::jsonb, updated_at = now() WHERE id = $1`, [orderId, JSON.stringify(shipping)]);
  return shipping;
}

export async function requestPickup(orderId: number) {
  const order = await q1(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  const shipping = order?.shipping || {};
  if (!shipping.shipmentId) throw new Error('Create the Shiprocket shipment first.');
  await call('/courier/generate/pickup', { method: 'POST', body: JSON.stringify({ shipment_id: [shipping.shipmentId] }) });
  shipping.pickupRequested = true;
  delete shipping.pickupError;
  await q(`UPDATE orders SET shipping = $2::jsonb, updated_at = now() WHERE id = $1`, [orderId, JSON.stringify(shipping)]);
  return shipping;
}

export async function trackAwb(awb: string) {
  const data = await call(`/courier/track/awb/${encodeURIComponent(awb)}`, { method: 'GET' });
  const td = data?.tracking_data || {};
  const activities = (td.shipment_track_activities || []).map((a: any) => ({
    date: a.date,
    status: a.activity || a['sr-status-label'] || '',
    location: a.location || '',
  }));
  return {
    status: td.shipment_track?.[0]?.current_status || '',
    etd: td.etd || '',
    activities,
    url: td.track_url || '',
  };
}
