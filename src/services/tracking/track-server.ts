import type { TrackingEventPayload } from '@/types/tracking';
import { getSupabaseAdmin } from '@/services/supabase/server';

export async function trackServerEvent(payload: TrackingEventPayload) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { stored: false, reason: 'Supabase not configured' };
  const { error } = await supabase.from('tracking_events').insert({
    name: payload.name,
    user_id: payload.userId || null,
    session_id: payload.sessionId || null,
    source: payload.source || null,
    path: payload.path || null,
    metadata: payload.metadata || {}
  });
  if (error) return { stored: false, reason: error.message };
  return { stored: true };
}
