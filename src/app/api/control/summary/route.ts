import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabase/server';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: true, mode: 'mock', summary: { users: 0, paidUsers: 0, revenueARS: 0, reports: 0, aiLogs: 0, events: 0 } });
  }
  const [users, payments, reports, logs, events] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('payments').select('amount_ars,status', { count: 'exact' }),
    supabase.from('reports').select('id', { count: 'exact', head: true }),
    supabase.from('ai_generation_logs').select('id', { count: 'exact', head: true }),
    supabase.from('tracking_events').select('id', { count: 'exact', head: true })
  ]);
  const revenueARS = (payments.data || []).filter((p: any) => p.status === 'paid' || p.status === 'registered_manual').reduce((sum: number, p: any) => sum + Number(p.amount_ars || 0), 0);
  return NextResponse.json({ ok: true, mode: 'supabase', summary: { users: users.count || 0, payments: payments.count || 0, revenueARS, reports: reports.count || 0, aiLogs: logs.count || 0, events: events.count || 0 } });
}
