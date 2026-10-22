// Razorpay integration: https://razorpay.com/docs/api/orders/
import crypto from 'node:crypto';
import { getSettingWithSecrets } from './settings';
import { safeEqual } from './crypto';

const API = 'https://api.razorpay.com/v1';

async function creds() {
  const p = await getSettingWithSecrets('payment');
  if (!p.razorpayKeyId || !p.razorpayKeySecret) throw new Error('Razorpay keys are not set. Add them in Admin → Payments.');
  return { keyId: p.razorpayKeyId as string, keySecret: p.razorpayKeySecret as string, settings: p };
}

function authHeader(keyId: string, keySecret: string) {
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

export async function createRazorpayOrder(amountRupees: number, receipt: string, notes: Record<string, string> = {}) {
  const { keyId, keySecret } = await creds();
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader(keyId, keySecret) },
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency: 'INR', receipt, notes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.description || `Razorpay returned ${res.status}`);
  return { id: data.id as string, amount: data.amount as number, keyId };
}

export async function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const { keySecret } = await creds();
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature || '');
}

export async function verifyWebhookSignature(body: string, signature: string) {
  const p = await getSettingWithSecrets('payment');
  if (!p.razorpayWebhookSecret) return false;
  const expected = crypto.createHmac('sha256', p.razorpayWebhookSecret).update(body).digest('hex');
  return safeEqual(expected, signature || '');
}

export async function fetchPayment(paymentId: string) {
  const { keyId, keySecret } = await creds();
  const res = await fetch(`${API}/payments/${paymentId}`, { headers: { Authorization: authHeader(keyId, keySecret) } });
  return res.json();
}

export async function refundPayment(paymentId: string, amountRupees?: number) {
  const { keyId, keySecret } = await creds();
  const res = await fetch(`${API}/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader(keyId, keySecret) },
    body: JSON.stringify(amountRupees ? { amount: Math.round(amountRupees * 100) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.description || `Razorpay returned ${res.status}`);
  return data;
}

export async function testRazorpay() {
  const { keyId, keySecret } = await creds();
  const res = await fetch(`${API}/orders?count=1`, { headers: { Authorization: authHeader(keyId, keySecret) } });
  if (res.ok) return { ok: true, message: `Connected. ${keyId.startsWith('rzp_live') ? 'Live mode' : 'Test mode'} keys are working.` };
  const data = await res.json().catch(() => ({}));
  return { ok: false, message: data?.error?.description || `Razorpay returned ${res.status}` };
}
