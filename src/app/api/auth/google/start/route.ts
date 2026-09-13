import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { trackServerEvent } from '@/services/tracking/track-server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  await trackServerEvent({ name: 'google_login_started', path: '/api/auth/google/start' });

  if (!url || !publishableKey) {
    return NextResponse.redirect(new URL('/app?auth=demo-google&mode=missing-supabase', requestUrl.origin));
  }

  const supabase = createClient(url, publishableKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${appUrl}/app?auth=google` }
  });

  if (error || !data.url) {
    await trackServerEvent({ name: 'google_login_failed', path: '/api/auth/google/start', metadata: { error: error?.message } });
    return NextResponse.redirect(new URL('/login?error=google_oauth', requestUrl.origin));
  }

  return NextResponse.redirect(data.url);
}
