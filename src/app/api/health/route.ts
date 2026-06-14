import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'Informe360 AI Agent',
    version: '2.0.0-xprize-final',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    googleAuthPrepared: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    googleCalendarPrepared: Boolean(process.env.GOOGLE_CALENDAR_REDIRECT_URI),
    googleMapsPrepared: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
    gmailPrepared: Boolean(process.env.GOOGLE_GMAIL_REDIRECT_URI),
    googleCloudPrepared: Boolean(process.env.GOOGLE_CLOUD_PROJECT_ID),
    startedAt: process.env.XPRIZE_BUILD_START_DATE || '2026-06-02'
  });
}
