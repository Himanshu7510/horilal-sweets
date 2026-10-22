// Server-side cart pricing. The browser's cart is never trusted for prices.
import { q, q1 } from './db';
import { getSetting } from './settings';
import { pincodeList } from './format';

export type CartInput = { productId: number; variantIndex: number; qty: number }[];

export type PricedLine = {
  productId: number;
  variantIndex: number;
  name: string;
  variant: string;
  sku: string;
  image: string;
  price: number;
  mrp: number;
  qty: number;
  lineTotal: number;
  weightGrams: number;
};

export async function checkPincode(pincode: string) {
  const delivery = await getSetting('delivery');
  const pin = String(pincode || '').trim();
  if (!/^\d{6}$/.test(pin)) return { ok: false, message: 'Enter a valid 6-digit pincode.' };
  const blocked = pincodeList(delivery.blockedPincodes);
  if (blocked.includes(pin)) return { ok: false, message: 'Sorry, we don’t deliver to this pincode yet.' };
  const allowed = pincodeList(delivery.serviceablePincodes);
  if (allowed.length && !allowed.some((a) => pin === a || (a.endsWith('*') && pin.startsWith(a.slice(0, -1))))) {
    return { ok: false, message: 'Sorry, we don’t deliver to this pincode yet.' };
  }
  return { ok: true, message: `Delivers in ${delivery.estimate || 'a few days'}.` };
}

export async function validateCoupon(code: string, subtotal: number) {
  const c = await q1(`SELECT * FROM coupons WHERE upper(code) = upper($1)`, [String(code || '').trim()]);
  if (!c || !c.active) return { ok: false, discount: 0, message: 'This coupon code isn’t valid.' };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { ok: false, discount: 0, message: 'This coupon has expired.' };
  if (c.usage_limit > 0 && c.used >= c.usage_limit) return { ok: false, discount: 0, message: 'This coupon has been fully used.' };
  if (subtotal < c.min_order) return { ok: false, discount: 0, message: `Add items worth ₹${c.min_order - subtotal} more to use this coupon.` };
  let discount = c.type === 'percent' ? Math.round((subtotal * c.value) / 100) : c.value;
  if (c.max_discount > 0) discount = Math.min(discount, c.max_discount);
  discount = Math.min(discount, subtotal);
  return { ok: true, discount, code: c.code, message: c.description || `Saved ₹${discount}` };
}

export async function priceCart(input: CartInput, opts: { coupon?: string; paymentMethod?: string } = {}) {
  const errors: string[] = [];
  const ids = [...new Set((input || []).map((i) => Number(i.productId)).filter(Boolean))];
  const products = ids.length ? await q(`SELECT * FROM products WHERE id = ANY($1::int[])`, [ids]) : [];
  const lines: PricedLine[] = [];

  for (const item of input || []) {
    const p = products.find((x: any) => x.id === Number(item.productId));
    const qty = Math.max(1, Math.min(50, Math.floor(Number(item.qty) || 1)));
    if (!p || !p.active) {
      errors.push('An item in your cart is no longer available and was removed.');
      continue;
    }
    const v = p.variants?.[Number(item.variantIndex) || 0];
    if (!v) {
      errors.push(`${p.name}: the selected size is no longer available.`);
      continue;
    }
    if (Number(v.stock) < qty) {
      errors.push(Number(v.stock) > 0 ? `Only ${v.stock} left of ${p.name} (${v.label}).` : `${p.name} (${v.label}) is out of stock.`);
      continue;
    }
    lines.push({
      productId: p.id,
      variantIndex: Number(item.variantIndex) || 0,
      name: p.name,
      variant: v.label,
      sku: v.sku || `${p.slug}-${Number(item.variantIndex) || 0}`,
      image: p.images?.[0] || '',
      price: Number(v.price),
      mrp: Number(v.mrp || v.price),
      qty,
      lineTotal: Number(v.price) * qty,
      weightGrams: Number(v.weightGrams || 0),
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const delivery = await getSetting('delivery');
  const payment = await getSetting('payment');

  let discount = 0;
  let couponCode = '';
  let couponMessage = '';
  if (opts.coupon) {
    const c = await validateCoupon(opts.coupon, subtotal);
    couponMessage = c.message;
    if (c.ok) {
      discount = c.discount;
      couponCode = c.code;
    }
  }

  const afterDiscount = subtotal - discount;
  let deliveryFee = Number(delivery.flatFee || 0);
  if (Number(delivery.freeAbove) > 0 && afterDiscount >= Number(delivery.freeAbove)) deliveryFee = 0;
  if (!lines.length) deliveryFee = 0;
  const codFee = opts.paymentMethod === 'cod' ? Number(delivery.codFee || 0) : 0;
  const total = afterDiscount + deliveryFee + codFee;
  const weightKg = Math.max(
    Number(delivery.defaultWeightKg || 0.5),
    lines.reduce((s, l) => s + l.weightGrams * l.qty, 0) / 1000
  );

  if (lines.length && Number(delivery.minOrder) > 0 && subtotal < Number(delivery.minOrder)) {
    errors.push(`The minimum order value is ₹${delivery.minOrder}.`);
  }

  return {
    lines,
    subtotal,
    discount,
    couponCode,
    couponMessage,
    deliveryFee,
    codFee,
    total,
    weightKg,
    errors,
    freeAbove: Number(delivery.freeAbove || 0),
    codAvailable: !!payment.codEnabled && (!Number(payment.codMaxOrder) || total <= Number(payment.codMaxOrder)),
    onlineAvailable: !!payment.razorpayEnabled && !!payment.razorpayKeyId,
  };
}
