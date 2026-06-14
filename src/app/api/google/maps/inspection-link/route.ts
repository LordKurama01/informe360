import { NextResponse } from 'next/server';
import { trackServerEvent } from '@/services/tracking/track-server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const address = String(body.address || '');
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  await trackServerEvent({ name: 'maps_inspection_link_created', path: '/api/google/maps/inspection-link', metadata: { address } });
  return NextResponse.json({ ok: true, url });
}
