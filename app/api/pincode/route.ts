import { NextResponse } from 'next/server';
import { checkPincode } from '@/lib/pricing';
import { getSetting } from '@/lib/settings';
import { checkServiceability } from '@/lib/shiprocket';

export async function GET(req: Request) {
  const pin = new URL(req.url).searchParams.get('pin') || '';
  const res = await checkPincode(pin);
  if (!res.ok) return NextResponse.json(res);
  const d = await getSetting('delivery');
  if (d.provider === 'shiprocket' && d.shiprocketCheckServiceability) {
    try {
      const s = await checkServiceability(pin, Number(d.defaultWeightKg || 0.5), false);
      if (s && !s.serviceable) return NextResponse.json({ ok: false, message: 'Sorry, couriers don’t deliver to this pincode yet.' });
      if (s?.etd) return NextResponse.json({ ok: true, message: `Delivers by around ${s.etd}.` });
    } catch {
      // If Shiprocket is unreachable, fall back to the basic check.
    }
  }
  return NextResponse.json(res);
}
