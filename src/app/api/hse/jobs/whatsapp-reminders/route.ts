import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../services/supabase/server';
import { sendWhatsAppReminder } from '../../../../../services/hse/channels/meta-whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReminderRow = {
  id: string;
  organization_id: string;
  finding_id: string | null;
  created_by: string;
  site_id: string | null;
  title: string | null;
  notes: string | null;
  scheduled_for: string;
};

type IdentityRow = {
  id: string;
  external_account_id: string;
  external_user_id: string;
};

function authorized(request: Request): boolean {
  const secret = process.env.HSE_JOBS_SECRET?.trim();
  if (!secret) return false;
  const authorization = request.headers.get('authorization');
  const explicit = request.headers.get('x-hse-job-secret');
  return authorization === `Bearer ${secret}` || explicit === secret;
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

async function reminderTitle(admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>, reminder: ReminderRow): Promise<string> {
  if (reminder.title?.trim()) return reminder.title.trim();
  if (reminder.finding_id) {
    const { data } = await admin
      .from('findings')
      .select('code,title')
      .eq('id', reminder.finding_id)
      .eq('organization_id', reminder.organization_id)
      .maybeSingle();
    if (data?.title) return `${data.code || 'HSE'} · ${data.title}`;
  }
  return reminder.notes?.trim() || 'Seguimiento HSE';
}

async function identityForReminder(admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>, reminder: ReminderRow): Promise<IdentityRow | null> {
  const configuredAccount = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();
  let query = admin
    .from('hse_channel_identities')
    .select('id,external_account_id,external_user_id')
    .eq('provider', 'whatsapp')
    .eq('organization_id', reminder.organization_id)
    .eq('user_id', reminder.created_by)
    .eq('active', true);
  if (configuredAccount) query = query.eq('external_account_id', configuredAccount);
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as IdentityRow | null;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('reminders')
    .select('id,organization_id,finding_id,created_by,site_id,title,notes,scheduled_for')
    .eq('channel', 'whatsapp')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(50);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  let sent = 0;
  let failed = 0;
  let unlinked = 0;

  for (const reminder of (data || []) as ReminderRow[]) {
    try {
      const identity = await identityForReminder(admin, reminder);
      if (!identity) {
        unlinked += 1;
        await admin.from('reminders').update({ error_message: 'No active WhatsApp identity linked to reminder owner' }).eq('id', reminder.id);
        continue;
      }

      const title = await reminderTitle(admin, reminder);
      const when = dateLabel(reminder.scheduled_for);
      const providerMessageId = await sendWhatsAppReminder(identity.external_user_id, title, when, identity.external_account_id);
      const sentAt = new Date().toISOString();

      const { error: auditError } = await admin.from('hse_channel_messages').insert({
        identity_id: identity.id,
        organization_id: reminder.organization_id,
        user_id: reminder.created_by,
        site_id: reminder.site_id,
        direction: 'outbound',
        provider_message_id: providerMessageId,
        idempotency_key: providerMessageId || `reminder:${reminder.id}`,
        message_type: 'text',
        body_text: `Recordatorio HSE: ${title} · ${when}`,
        media: [],
        metadata: { source: 'whatsapp_reminder_job', reminder_id: reminder.id },
        occurred_at: sentAt,
      });
      if (auditError) throw auditError;

      const { error: updateError } = await admin.from('reminders').update({
        status: 'sent',
        sent_at: sentAt,
        error_message: null,
      }).eq('id', reminder.id).eq('status', 'pending');
      if (updateError) throw updateError;
      sent += 1;
    } catch (dispatchError) {
      failed += 1;
      const message = dispatchError instanceof Error ? dispatchError.message : 'WhatsApp reminder failed';
      await admin.from('reminders').update({ status: 'failed', error_message: message }).eq('id', reminder.id).eq('status', 'pending');
      console.error('WhatsApp reminder dispatch failed', reminder.id, message);
    }
  }

  return NextResponse.json({ ok: true, checked: data?.length || 0, sent, failed, unlinked });
}
