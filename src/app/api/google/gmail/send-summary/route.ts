import { NextResponse } from 'next/server';
import { trackServerEvent } from '@/services/tracking/track-server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  await trackServerEvent({ name: 'gmail_summary_requested', path: '/api/google/gmail/send-summary', metadata: body });
  return NextResponse.json({ ok: true, mode: 'prepared', message: 'Gmail API preparada. Requiere OAuth scope específico antes de enviar correos reales.' });
}
