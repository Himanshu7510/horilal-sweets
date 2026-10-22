'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { q, q1 } from '@/lib/db';
import { requireAdmin, createSession, clearSession, adminExists } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { getSettingRaw, saveSetting } from '@/lib/settings';
import { slugify } from '@/lib/format';
import { finalizeOrder, setOrderStatus } from '@/lib/orders';
import { testRazorpay, refundPayment } from '@/lib/razorpay';
import { testShiprocket, createShipment, assignAwb, requestPickup, trackAwb } from '@/lib/shiprocket';

type Result = { ok: boolean; message: string; id?: number };
const ok = (message: string, id?: number): Result => ({ ok: true, message, id });
const fail = (message: string): Result => ({ ok: false, message });
const done = () => revalidatePath('/', 'layout');

// ---------- Auth ----------

export async function loginAction(_: any, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  if (!(await adminExists())) {
    // First run: create the owner account.
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email address.' };
    if (password.length < 8) return { error: 'Use a password with at least 8 characters.' };
    if (password !== String(formData.get('confirm') || '')) return { error: 'The two passwords don’t match.' };
    await saveSetting('admin', { email, passwordHash: hashPassword(password) });
    await createSession(email);
    redirect('/admin');
  }
  const admin = await getSettingRaw('admin');
  await new Promise((r) => setTimeout(r, 400));
  if (email !== admin.email || !verifyPassword(password, admin.passwordHash)) {
    return { error: 'That email and password don’t match.' };
  }
  await createSession(email);
  redirect('/admin');
}

export async function logoutAction() {
  await clearSession();
  redirect('/admin/login');
}

export async function changeCredentials(values: { email: string; current: string; password: string; confirm: string }): Promise<Result> {
  await requireAdmin();
  const admin = await getSettingRaw('admin');
  if (!verifyPassword(values.current || '', admin.passwordHash)) return fail('Your current password is incorrect.');
  const email = String(values.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email address.');
  const patch: any = { email };
  if (values.password) {
    if (values.password.length < 8) return fail('Use a password with at least 8 characters.');
    if (values.password !== values.confirm) return fail('The new passwords don’t match.');
    patch.passwordHash = hashPassword(values.password);
  }
  await saveSetting('admin', patch);
  await createSession(email);
  return ok('Login details updated.');
}

// ---------- Settings (brand, homepage, footer, SEO, payments, delivery) ----------

const EDITABLE = ['site', 'home', 'footer', 'seo', 'payment', 'delivery'];

export async function saveSettingsAction(key: string, values: Record<string, any>): Promise<Result> {
  await requireAdmin();
  if (!EDITABLE.includes(key)) return fail('Unknown settings section.');
  await saveSetting(key, values);
  done();
  return ok('Changes saved and live on your store.');
}

export async function testPaymentAction(): Promise<Result> {
  await requireAdmin();
  try {
    return await testRazorpay();
  } catch (e: any) {
    return fail(e.message);
  }
}

export async function testDeliveryAction(): Promise<Result> {
  await requireAdmin();
  return testShiprocket();
}

// ---------- Products ----------

export async function saveProduct(data: any): Promise<Result> {
  await requireAdmin();
  const name = String(data.name || '').trim();
  if (!name) return fail('Add a product name.');
  const slug = slugify(data.slug || name);
  const variants = (data.variants || [])
    .filter((v: any) => String(v.label || '').trim())
    .map((v: any) => ({
      label: String(v.label).trim(),
      price: Math.max(0, Math.round(Number(v.price) || 0)),
      mrp: Math.max(0, Math.round(Number(v.mrp) || 0)),
      stock: Math.max(0, Math.round(Number(v.stock) || 0)),
      sku: String(v.sku || '').trim(),
      weightGrams: Math.max(0, Math.round(Number(v.weightGrams) || 0)),
    }));
  if (!variants.length) return fail('Add at least one size with a price.');
  if (variants.some((v: any) => v.price <= 0)) return fail('Every size needs a price above ₹0.');
  const clash = await q1(`SELECT id FROM products WHERE slug = $1 AND id <> $2`, [slug, Number(data.id) || 0]);
  if (clash) return fail('Another product already uses this web address. Change the URL slug.');
  const params = [
    name,
    slug,
    Number(data.category_id) || null,
    String(data.short_description || ''),
    String(data.description || ''),
    String(data.ingredients || ''),
    String(data.shelf_life || ''),
    JSON.stringify((data.images || []).filter(Boolean)),
    JSON.stringify(variants),
    String(data.badge || ''),
    !!data.is_veg,
    !!data.featured,
    !!data.active,
    Math.round(Number(data.sort) || 0),
  ];
  let id = Number(data.id) || 0;
  if (id) {
    await q(
      `UPDATE products SET name=$1, slug=$2, category_id=$3, short_description=$4, description=$5, ingredients=$6, shelf_life=$7,
       images=$8::jsonb, variants=$9::jsonb, badge=$10, is_veg=$11, featured=$12, active=$13, sort=$14 WHERE id=$15`,
      [...params, id]
    );
  } else {
    const row = await q1(
      `INSERT INTO products (name, slug, category_id, short_description, description, ingredients, shelf_life, images, variants, badge, is_veg, featured, active, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11,$12,$13,$14) RETURNING id`,
      params
    );
    id = row.id;
  }
  done();
  return ok('Product saved.', id);
}

export async function deleteProduct(id: number): Promise<Result> {
  await requireAdmin();
  await q(`DELETE FROM products WHERE id = $1`, [id]);
  done();
  return ok('Product deleted.');
}

export async function toggleProduct(id: number, field: 'active' | 'featured'): Promise<Result> {
  await requireAdmin();
  await q(`UPDATE products SET ${field === 'active' ? 'active = NOT active' : 'featured = NOT featured'} WHERE id = $1`, [id]);
  done();
  return ok('Updated.');
}

export async function updateStock(id: number, variantIndex: number, stock: number): Promise<Result> {
  await requireAdmin();
  await q(
    `UPDATE products SET variants = jsonb_set(variants, ARRAY[$2::text,'stock'], to_jsonb($3::int)) WHERE id = $1`,
    [id, variantIndex, Math.max(0, Math.round(stock))]
  );
  done();
  return ok('Stock updated.');
}

// ---------- Categories ----------

export async function saveCategory(data: any): Promise<Result> {
  await requireAdmin();
  const name = String(data.name || '').trim();
  if (!name) return fail('Add a category name.');
  const slug = slugify(data.slug || name);
  const clash = await q1(`SELECT id FROM categories WHERE slug = $1 AND id <> $2`, [slug, Number(data.id) || 0]);
  if (clash) return fail('Another category already uses this URL slug.');
  const params = [name, slug, String(data.description || ''), String(data.image || ''), Math.round(Number(data.sort) || 0), !!data.active];
  if (Number(data.id)) {
    await q(`UPDATE categories SET name=$1, slug=$2, description=$3, image=$4, sort=$5, active=$6 WHERE id=$7`, [...params, Number(data.id)]);
  } else {
    await q(`INSERT INTO categories (name, slug, description, image, sort, active) VALUES ($1,$2,$3,$4,$5,$6)`, params);
  }
  done();
  return ok('Category saved.');
}

export async function deleteCategory(id: number): Promise<Result> {
  await requireAdmin();
  await q(`UPDATE products SET category_id = NULL WHERE category_id = $1`, [id]);
  await q(`DELETE FROM categories WHERE id = $1`, [id]);
  done();
  return ok('Category deleted. Its products are now uncategorised.');
}

// ---------- Coupons ----------

export async function saveCoupon(data: any): Promise<Result> {
  await requireAdmin();
  const code = String(data.code || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!code) return fail('Add a coupon code.');
  const value = Math.round(Number(data.value) || 0);
  if (value <= 0) return fail('Add a discount value.');
  if (data.type === 'percent' && value > 100) return fail('A percentage discount can’t be more than 100.');
  const clash = await q1(`SELECT id FROM coupons WHERE upper(code) = $1 AND id <> $2`, [code, Number(data.id) || 0]);
  if (clash) return fail('That code already exists.');
  const params = [
    code,
    data.type === 'flat' ? 'flat' : 'percent',
    value,
    Math.round(Number(data.min_order) || 0),
    Math.round(Number(data.max_discount) || 0),
    Math.round(Number(data.usage_limit) || 0),
    data.expires_at ? new Date(data.expires_at + 'T23:59:59+05:30').toISOString() : null,
    !!data.active,
    String(data.description || ''),
  ];
  if (Number(data.id)) {
    await q(
      `UPDATE coupons SET code=$1, type=$2, value=$3, min_order=$4, max_discount=$5, usage_limit=$6, expires_at=$7, active=$8, description=$9 WHERE id=$10`,
      [...params, Number(data.id)]
    );
  } else {
    await q(
      `INSERT INTO coupons (code, type, value, min_order, max_discount, usage_limit, expires_at, active, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      params
    );
  }
  done();
  return ok('Coupon saved.');
}

export async function deleteCoupon(id: number): Promise<Result> {
  await requireAdmin();
  await q(`DELETE FROM coupons WHERE id = $1`, [id]);
  done();
  return ok('Coupon deleted.');
}

// ---------- Pages ----------

export async function savePage(data: any): Promise<Result> {
  await requireAdmin();
  const title = String(data.title || '').trim();
  if (!title) return fail('Add a page title.');
  const slug = slugify(data.slug || title);
  const clash = await q1(`SELECT id FROM pages WHERE slug = $1 AND id <> $2`, [slug, Number(data.id) || 0]);
  if (clash) return fail('Another page already uses this URL slug.');
  const params = [slug, title, String(data.content || ''), !!data.active, !!data.in_footer, !!data.in_header, Math.round(Number(data.sort) || 0)];
  let id = Number(data.id) || 0;
  if (id) {
    await q(`UPDATE pages SET slug=$1, title=$2, content=$3, active=$4, in_footer=$5, in_header=$6, sort=$7, updated_at=now() WHERE id=$8`, [...params, id]);
  } else {
    id = (await q1(`INSERT INTO pages (slug, title, content, active, in_footer, in_header, sort) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, params)).id;
  }
  done();
  return ok('Page saved.', id);
}

export async function deletePage(id: number): Promise<Result> {
  await requireAdmin();
  await q(`DELETE FROM pages WHERE id = $1`, [id]);
  done();
  return ok('Page deleted.');
}

// ---------- Messages ----------

export async function markMessage(id: number, read: boolean): Promise<Result> {
  await requireAdmin();
  await q(`UPDATE messages SET read = $2 WHERE id = $1`, [id, read]);
  revalidatePath('/admin/messages');
  return ok('Updated.');
}

export async function deleteMessage(id: number): Promise<Result> {
  await requireAdmin();
  await q(`DELETE FROM messages WHERE id = $1`, [id]);
  revalidatePath('/admin/messages');
  return ok('Message deleted.');
}

// ---------- Orders ----------

export async function updateOrderStatus(id: number, status: string, note: string): Promise<Result> {
  await requireAdmin();
  const order = await q1(`SELECT status FROM orders WHERE id = $1`, [id]);
  if (!order) return fail('Order not found.');
  if (order.status === 'pending_payment' && status !== 'cancelled') {
    return fail('This order hasn’t been paid. Mark the payment as received first, or cancel it.');
  }
  await setOrderStatus(id, status, note);
  revalidatePath(`/admin/orders/${id}`);
  return ok('Order status updated.');
}

export async function markOrderPaid(id: number, reference: string): Promise<Result> {
  await requireAdmin();
  await finalizeOrder(id, { manual: true, reference: String(reference || '').slice(0, 100) });
  revalidatePath(`/admin/orders/${id}`);
  return ok('Payment marked as received.');
}

export async function saveAdminNote(id: number, note: string): Promise<Result> {
  await requireAdmin();
  await q(`UPDATE orders SET admin_note = $2, updated_at = now() WHERE id = $1`, [id, String(note || '').slice(0, 2000)]);
  revalidatePath(`/admin/orders/${id}`);
  return ok('Note saved.');
}

export async function saveManualShipping(id: number, data: any): Promise<Result> {
  await requireAdmin();
  const order = await q1(`SELECT shipping FROM orders WHERE id = $1`, [id]);
  if (!order) return fail('Order not found.');
  const shipping = {
    ...(order.shipping || {}),
    courier: String(data.courier || '').trim(),
    trackingNumber: String(data.trackingNumber || '').trim(),
    trackingUrl: String(data.trackingUrl || '').trim(),
  };
  if (!shipping.provider) shipping.provider = 'manual';
  await q(`UPDATE orders SET shipping = $2::jsonb, updated_at = now() WHERE id = $1`, [id, JSON.stringify(shipping)]);
  if (data.markShipped && shipping.trackingNumber) await setOrderStatus(id, 'shipped', `Shipped with ${shipping.courier || 'courier'} · ${shipping.trackingNumber}`);
  revalidatePath(`/admin/orders/${id}`);
  return ok('Shipping details saved.');
}

export async function shiprocketAction(id: number, step: 'create' | 'awb' | 'pickup' | 'track'): Promise<Result & { data?: any }> {
  await requireAdmin();
  try {
    if (step === 'create') {
      const s = await createShipment(id);
      revalidatePath(`/admin/orders/${id}`);
      return {
        ok: true,
        message: s.awb ? `Shipment created. AWB ${s.awb} via ${s.courier}.` : `Shipment created on Shiprocket.${s.awbError ? ' AWB not assigned yet: ' + s.awbError : ''}`,
      };
    }
    if (step === 'awb') {
      const s = await assignAwb(id);
      revalidatePath(`/admin/orders/${id}`);
      return ok(`AWB ${s.awb} assigned via ${s.courier}.`);
    }
    if (step === 'pickup') {
      await requestPickup(id);
      const order = await q1(`SELECT status FROM orders WHERE id = $1`, [id]);
      if (['placed', 'confirmed', 'packed'].includes(order.status)) await setOrderStatus(id, 'shipped', 'Pickup requested on Shiprocket');
      revalidatePath(`/admin/orders/${id}`);
      return ok('Pickup requested.');
    }
    const order = await q1(`SELECT shipping FROM orders WHERE id = $1`, [id]);
    if (!order?.shipping?.awb) return fail('This order has no AWB number yet.');
    const t = await trackAwb(order.shipping.awb);
    await q(`UPDATE orders SET shipping = shipping || $2::jsonb WHERE id = $1`, [id, JSON.stringify({ lastTracking: { ...t, at: new Date().toISOString() } })]);
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true, message: t.status ? `Current status: ${t.status}` : 'No tracking updates yet.', data: t };
  } catch (e: any) {
    return fail(e.message);
  }
}

export async function refundOrder(id: number, amount: number): Promise<Result> {
  await requireAdmin();
  const order = await q1(`SELECT * FROM orders WHERE id = $1`, [id]);
  if (!order?.payment?.razorpayPaymentId) return fail('This order wasn’t paid online, so there’s nothing to refund through Razorpay.');
  try {
    const r = await refundPayment(order.payment.razorpayPaymentId, amount > 0 ? amount : undefined);
    await q(
      `UPDATE orders SET payment_status = $2, payment = payment || $3::jsonb, updated_at = now() WHERE id = $1`,
      [id, amount > 0 && amount < order.total ? 'partially_refunded' : 'refunded', JSON.stringify({ refundId: r.id, refundAmount: (r.amount || 0) / 100 })]
    );
    revalidatePath(`/admin/orders/${id}`);
    return ok(`Refund of ₹${(r.amount || 0) / 100} started. It reaches the customer in 5–7 days.`);
  } catch (e: any) {
    return fail(e.message);
  }
}

export async function deleteOrder(id: number): Promise<Result> {
  await requireAdmin();
  const order = await q1(`SELECT status FROM orders WHERE id = $1`, [id]);
  if (order && order.status !== 'pending_payment' && order.status !== 'cancelled') {
    return fail('Only unpaid or cancelled orders can be deleted.');
  }
  await q(`DELETE FROM orders WHERE id = $1`, [id]);
  return ok('Order deleted.');
}
