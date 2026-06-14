import { NextResponse } from 'next/server';
import { trackServerEvent } from '@/services/tracking/track-server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await trackServerEvent({
    name: body.name || 'unknown_event',
    userId: body.userId,
    sessionId: body.sessionId,
    source: body.source,
    path: body.path,
    metadata: body.metadata || {}
  });
  return NextResponse.json({ ok: true, ...result });
}
