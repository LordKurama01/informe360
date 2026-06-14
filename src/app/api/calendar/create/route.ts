import { NextResponse } from 'next/server';
import { trackServerEvent } from '@/services/tracking/track-server';

export async function POST(request: Request) {
  const body = await request.json();
  await trackServerEvent({ name: 'calendar_event_created', path: '/api/calendar/create', metadata: body });
  return NextResponse.json({ ok: true, mode: 'internal-calendar', event: { ...body, id: `evt_${Date.now()}` } });
}
