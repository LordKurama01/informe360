import { NextResponse } from 'next/server';
import { trackServerEvent } from '@/services/tracking/track-server';

export async function POST(request: Request) {
  const body = await request.json();
  await trackServerEvent({ name: 'payment_registered', path: '/api/payments/manual', metadata: body });
  return NextResponse.json({ ok: true, payment: { id: `pay_${Date.now()}`, status: 'registered_manual', ...body } });
}
