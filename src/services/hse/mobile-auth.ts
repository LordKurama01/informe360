import { createClient, type User } from '@supabase/supabase-js';

export type MobileAuthResult = { user: User; token: string } | { error: string; status: number };

export async function authenticateMobileRequest(request: Request): Promise<MobileAuthResult> {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return { error: 'Missing bearer token', status: 401 };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { error: 'Supabase server configuration missing', status: 503 };

  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: 'Invalid session', status: 401 };
  return { user: data.user, token };
}
