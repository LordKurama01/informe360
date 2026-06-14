import { NextResponse } from 'next/server';
import { trackServerEvent } from '@/services/tracking/track-server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  await trackServerEvent({
    name: error ? 'google_calendar_oauth_failed' : 'google_calendar_oauth_callback_received',
    path: '/api/google/calendar/callback',
    metadata: { hasCode: Boolean(code), error }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const status = error ? 'calendar_error' : 'calendar_prepared';
  return NextResponse.redirect(`${appUrl}/app/calendar?status=${status}`);
}
