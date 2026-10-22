import { NextResponse } from 'next/server';
import { priceCart } from '@/lib/pricing';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const priced = await priceCart(body.items || [], { coupon: body.coupon, paymentMethod: body.paymentMethod });
  return NextResponse.json(priced);
}
