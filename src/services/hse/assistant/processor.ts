import type { SupabaseClient } from '@supabase/supabase-js';
import { analyzeImage, structureFieldEntry, transcribeAudio } from '../../ai/hse/router';
import { getSupabaseAdmin } from '../../supabase/server';
import { resolveUserDueText } from '../../../shared/hse/date-resolution.mjs';
import { downloadMetaMedia, sendWhatsAppText } from '../channels/meta-whatsapp';
import type { HseChannelIdentity, NormalizedWhatsAppMessage } from '../channels/types';
import { classifyHseIntent, extractContextLabel, isConfirmationText, isRejectionText, reminderTitleFromText } from './intent-router';
import type { HseAssistantIntent, HseConversationContext, ProposedFindingPayload } from './types';
import type { StructuredFindingDraft } from '../../ai/hse/contract.mjs';

type ProcessedMedia = {
  kind: 'audio' | 'image' | 'document' | 'video';
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  sha256?: string;
};

type ChannelMessageRow = { id: string };

type FindingRpcRow = {
  finding_id: string;
  finding_code: string;
  action_id: string | null;
  reminder_id: string | null;
};

function priorityFromSeverity(severity: StructuredFindingDraft['severity']): ProposedFindingPayload['priority'] {
  return ({ low: 'low', medium: 'medium', high: 'high', critical: 'urgent' } as const)[severity];
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'whatsapp-media';
}

function inputType(message: NormalizedWhatsAppMessage): 'text' | 'audio' | 'photo' | 'mixed' {
  const hasText = Boolean(message.text?.trim());
  if (message.messageType === 'audio') return hasText ? 'mixed' : 'audio';
  if (message.messageType === 'image') return hasText ? 'mixed' : 'photo';
  return 'text';
}

function formatDate(value: string | null): string {
  if (!value) return 'sin fecha';
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'medium',
  }).format(new Date(value));
}

async function resolveIdentity(admin: SupabaseClient, message: NormalizedWhatsAppMessage): Promise<HseChannelIdentity | null> {
  const { data, error } = await admin
    .from('hse_channel_identities')
    .select('id,organization_id,user_id,site_id,provider,external_account_id,external_user_id,display_name,active')
    .eq('provider', 'whatsapp')
    .eq('external_account_id', message.externalAccountId)
    .eq('external_user_id', message.externalUserId)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: membership, error: membershipError } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('organization_id', data.organization_id)
    .eq('user_id', data.user_id)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) return null;

  if (data.site_id) {
    const { data: site, error: siteError } = await admin
      .from('sites')
      .select('id')
      .eq('id', data.site_id)
      .eq('organization_id', data.organization_id)
      .maybeSingle();
    if (siteError) throw siteError;
    if (!site) return null;
  }

  if (message.displayName && message.displayName !== data.display_name) {
    await admin.from('hse_channel_identities').update({ display_name: message.displayName }).eq('id', data.id);
  }
  return data as HseChannelIdentity;
}

async function currentContext(admin: SupabaseClient, identity: HseChannelIdentity): Promise<HseConversationContext> {
  const { data, error } = await admin
    .from('hse_conversation_contexts')
    .select('active_site_id,active_location_text,active_finding_id')
    .eq('identity_id', identity.id)
    .maybeSingle();
  if (error) throw error;
  return {
    activeSiteId: (data?.active_site_id as string | null | undefined) ?? identity.site_id,
    activeLocationText: (data?.active_location_text as string | null | undefined) ?? null,
    activeFindingId: (data?.active_finding_id as string | null | undefined) ?? null,
  };
}

async function insertInboundMessage(admin: SupabaseClient, identity: HseChannelIdentity, message: NormalizedWhatsAppMessage): Promise<ChannelMessageRow | null> {
  const { data: existing, error: existingError } = await admin
    .from('hse_channel_messages')
    .select('id')
    .eq('identity_id', identity.id)
    .eq('direction', 'inbound')
    .eq('provider_message_id', message.providerMessageId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return null;

  const { data, error } = await admin
    .from('hse_channel_messages')
    .insert({
      identity_id: identity.id,
      organization_id: identity.organization_id,
      user_id: identity.user_id,
      site_id: identity.site_id,
      direction: 'inbound',
      provider_message_id: message.providerMessageId,
      idempotency_key: message.idempotencyKey,
      message_type: message.messageType,
      body_text: message.text || null,
      media: message.attachments,
      metadata: message.metadata,
      occurred_at: message.occurredAt,
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') return null;
    throw error;
  }
  return data as ChannelMessageRow;
}

async function reply(admin: SupabaseClient, identity: HseChannelIdentity, body: string): Promise<void> {
  const providerMessageId = await sendWhatsAppText(identity.external_user_id, body, identity.external_account_id);
  const { error } = await admin.from('hse_channel_messages').insert({
    identity_id: identity.id,
    organization_id: identity.organization_id,
    user_id: identity.user_id,
    site_id: identity.site_id,
    direction: 'outbound',
    provider_message_id: providerMessageId,
    idempotency_key: providerMessageId,
    message_type: 'text',
    body_text: body,
    media: [],
    metadata: { source: 'hse_copilot' },
    occurred_at: new Date().toISOString(),
  });
  if (error) console.error('Could not audit outbound WhatsApp message', error.message);
}

async function persistMedia(admin: SupabaseClient, identity: HseChannelIdentity, message: NormalizedWhatsAppMessage): Promise<{ processed: ProcessedMedia[]; transcript: string; imageDraft: StructuredFindingDraft | null; provider: string | null; model: string | null }> {
  const processed: ProcessedMedia[] = [];
  let transcript = message.text?.trim() || '';
  let imageDraft: StructuredFindingDraft | null = null;
  let provider: string | null = null;
  let model: string | null = null;

  for (const attachment of message.attachments) {
    const download = await downloadMetaMedia(attachment.id, attachment.fileName || `whatsapp-${attachment.id}`);
    const path = `${identity.organization_id}/channel/${identity.id}/${message.providerMessageId}/${safeFileName(download.fileName)}`;
    const bytes = await download.file.arrayBuffer();
    const { error: uploadError } = await admin.storage.from('hse-evidence').upload(path, bytes, {
      contentType: download.mimeType,
      upsert: false,
    });
    if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) throw uploadError;
    processed.push({
      kind: attachment.kind,
      storagePath: path,
      fileName: download.fileName,
      mimeType: download.mimeType,
      byteSize: download.byteSize,
      sha256: download.sha256,
    });

    if (attachment.kind === 'audio') {
      const result = await transcribeAudio(download.file);
      transcript = [transcript, result.text].filter(Boolean).join('\n').trim();
      provider = result.provider;
      model = result.model;
    } else if (attachment.kind === 'image') {
      const result = await analyzeImage(download.file, transcript || attachment.caption);
      imageDraft = result.draft;
      provider = result.provider;
      model = result.model;
    }
  }

  return { processed, transcript, imageDraft, provider, model };
}

async function auditCommand(
  admin: SupabaseClient,
  identity: HseChannelIdentity,
  sourceMessageId: string,
  intent: HseAssistantIntent,
  status: 'proposed' | 'awaiting_confirmation' | 'confirmed' | 'executed' | 'rejected' | 'failed',
  payload: Record<string, unknown>,
  result: Record<string, unknown> = {},
  confirmationExpiresAt: string | null = null,
): Promise<string> {
  const { data, error } = await admin.from('hse_assistant_commands').insert({
    identity_id: identity.id,
    organization_id: identity.organization_id,
    user_id: identity.user_id,
    source_message_id: sourceMessageId,
    intent,
    status,
    payload,
    result,
    confirmation_expires_at: confirmationExpiresAt,
    executed_at: status === 'executed' ? new Date().toISOString() : null,
  }).select('id').single();
  if (error) throw error;
  return String(data.id);
}

function contextText(context: HseConversationContext): string | null {
  return context.activeLocationText;
}

async function createFindingProposal(
  admin: SupabaseClient,
  identity: HseChannelIdentity,
  message: NormalizedWhatsAppMessage,
  sourceMessageId: string,
  transcript: string,
  context: HseConversationContext,
  media: ProcessedMedia[],
  imageDraft: StructuredFindingDraft | null,
  mediaProvider: string | null,
  mediaModel: string | null,
): Promise<void> {
  const sourceText = transcript || message.text?.trim() || 'Evidencia de campo para revisar';
  const structured = imageDraft ? { draft: imageDraft, provider: mediaProvider || 'vision', model: mediaModel || 'configured' } : await structureFieldEntry(sourceText);
  const draft: StructuredFindingDraft = {
    ...structured.draft,
    location_text: structured.draft.location_text || contextText(context),
  };
  const due = resolveUserDueText(sourceText);
  const photoPaths = media.filter(item => item.kind === 'image').map(item => item.storagePath);
  const audioPath = media.find(item => item.kind === 'audio')?.storagePath || null;

  const { data: entry, error: entryError } = await admin.from('field_entries').insert({
    organization_id: identity.organization_id,
    site_id: context.activeSiteId,
    created_by: identity.user_id,
    input_type: inputType(message),
    raw_text: sourceText,
    audio_storage_path: audioPath,
    photo_storage_paths: photoPaths,
    captured_at: message.occurredAt,
    processing_status: 'processing',
    metadata: {
      channel: 'whatsapp',
      provider_message_id: message.providerMessageId,
      source_message_id: sourceMessageId,
      ai_provider: structured.provider,
      ai_model: structured.model,
      original_message_type: message.messageType,
    },
    client_capture_id: `wa:${message.providerMessageId}`,
  }).select('id').single();
  if (entryError) throw entryError;

  const payload: ProposedFindingPayload = {
    kind: 'finding',
    fieldEntryId: String(entry.id),
    draft,
    dueAt: due?.iso || null,
    priority: priorityFromSeverity(draft.severity),
    siteId: context.activeSiteId,
    originalText: sourceText,
    mediaPaths: photoPaths,
  };
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  await auditCommand(admin, identity, sourceMessageId, 'CREATE_FINDING', 'awaiting_confirmation', payload as unknown as Record<string, unknown>, {}, expiresAt);

  const lines = [
    '🦺 *Hallazgo preparado*',
    '',
    `*${draft.title}*`,
    draft.location_text ? `📍 ${draft.location_text}` : null,
    draft.element_text ? `🔧 ${draft.element_text}` : null,
    draft.responsible_text ? `👤 ${draft.responsible_text}` : null,
    `⚠️ Severidad: ${draft.severity}`,
    `📅 Vencimiento: ${formatDate(due?.iso || null)}`,
    draft.action ? `✅ Acción: ${draft.action}` : null,
    '',
    'Respondé *SI* para registrarlo o *NO* para descartarlo.',
  ].filter((line): line is string => Boolean(line));
  await reply(admin, identity, lines.join('\n'));
}

function isProposedFinding(value: unknown): value is ProposedFindingPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const payload = value as Partial<ProposedFindingPayload>;
  return payload.kind === 'finding' && typeof payload.fieldEntryId === 'string' && Boolean(payload.draft) && typeof payload.originalText === 'string';
}

async function executePendingConfirmation(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, text: string): Promise<boolean> {
  if (!isConfirmationText(text) && !isRejectionText(text)) return false;
  const { data: pending, error } = await admin
    .from('hse_assistant_commands')
    .select('id,intent,payload,confirmation_expires_at')
    .eq('identity_id', identity.id)
    .eq('status', 'awaiting_confirmation')
    .gte('confirmation_expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!pending) return false;

  if (isRejectionText(text)) {
    await admin.from('hse_assistant_commands').update({ status: 'rejected', result: { reason: 'user_rejected' } }).eq('id', pending.id);
    await auditCommand(admin, identity, sourceMessageId, 'CREATE_FINDING', 'executed', { confirmation_for: pending.id, decision: 'reject' }, { rejected: true });
    await reply(admin, identity, 'Descartado. No se creó ningún hallazgo.');
    return true;
  }

  if (pending.intent !== 'CREATE_FINDING' || !isProposedFinding(pending.payload)) {
    await reply(admin, identity, 'Ese comando pendiente todavía no tiene un ejecutor seguro. No hice cambios.');
    return true;
  }

  const payload = pending.payload;
  await admin.from('hse_assistant_commands').update({ status: 'confirmed' }).eq('id', pending.id);
  const { data, error: rpcError } = await admin.rpc('create_channel_finding_bundle', {
    p_actor_id: identity.user_id,
    p_organization_id: identity.organization_id,
    p_site_id: payload.siteId,
    p_field_entry_id: payload.fieldEntryId,
    p_title: payload.draft.title,
    p_description: payload.draft.description,
    p_category: payload.draft.category,
    p_severity: payload.draft.severity,
    p_priority: payload.priority,
    p_due_at: payload.dueAt,
    p_responsible_text: payload.draft.responsible_text,
    p_action: payload.draft.action,
    p_ai_confidence: payload.draft.confidence,
  });
  if (rpcError) {
    await admin.from('hse_assistant_commands').update({ status: 'failed', error_message: rpcError.message }).eq('id', pending.id);
    throw rpcError;
  }
  const row = Array.isArray(data) ? data[0] as FindingRpcRow | undefined : undefined;
  if (!row?.finding_id) throw new Error('Finding RPC returned no finding');

  for (const storagePath of payload.mediaPaths || []) {
    const { error: evidenceError } = await admin.from('evidence_files').insert({
      organization_id: identity.organization_id,
      finding_id: row.finding_id,
      storage_bucket: 'hse-evidence',
      storage_path: storagePath,
      file_name: storagePath.split('/').pop() || 'whatsapp-image',
      uploaded_by: identity.user_id,
      phase: 'initial',
    });
    if (evidenceError && evidenceError.code !== '23505') console.error('Could not link WhatsApp evidence', evidenceError.message);
  }

  await admin.from('hse_assistant_commands').update({
    status: 'executed',
    executed_at: new Date().toISOString(),
    result: { finding_id: row.finding_id, finding_code: row.finding_code, action_id: row.action_id, reminder_id: row.reminder_id },
  }).eq('id', pending.id);
  await auditCommand(admin, identity, sourceMessageId, 'CREATE_FINDING', 'executed', { confirmation_for: pending.id, decision: 'confirm' }, { finding_id: row.finding_id, finding_code: row.finding_code });

  const reminderLine = payload.dueAt ? `\n⏰ Seguimiento: ${formatDate(payload.dueAt)}` : '';
  await reply(admin, identity, `✅ ${row.finding_code || 'Hallazgo'} registrado.${reminderLine}\nYa aparece en HSE Copilot.`);
  return true;
}

async function setContext(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, text: string): Promise<void> {
  const label = extractContextLabel(text);
  if (!label) {
    await reply(admin, identity, 'Decime el contexto así: “Estoy en Equipo 14” o “Ahora estoy en Taller”.');
    return;
  }
  const { data: sites, error } = await admin
    .from('sites')
    .select('id,name')
    .eq('organization_id', identity.organization_id)
    .ilike('name', `%${label}%`)
    .limit(2);
  if (error) throw error;
  const matchedSiteId = sites?.length === 1 ? String(sites[0].id) : identity.site_id;
  const { error: contextError } = await admin.from('hse_conversation_contexts').upsert({
    identity_id: identity.id,
    organization_id: identity.organization_id,
    user_id: identity.user_id,
    active_site_id: matchedSiteId,
    active_location_text: label,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'identity_id' });
  if (contextError) throw contextError;
  await auditCommand(admin, identity, sourceMessageId, 'SET_CONTEXT', 'executed', { label }, { active_site_id: matchedSiteId, active_location_text: label });
  await reply(admin, identity, `📍 Contexto activo: *${label}*.\nLo voy a usar en los próximos registros hasta que me indiques otro lugar.`);
}

async function createReminder(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, text: string, context: HseConversationContext): Promise<void> {
  const due = resolveUserDueText(text);
  if (!due) {
    await auditCommand(admin, identity, sourceMessageId, 'CREATE_REMINDER', 'proposed', { text }, { needs_date: true });
    await reply(admin, identity, '¿Para cuándo? Podés decirme, por ejemplo, “mañana” o una fecha como 18/09/2026.');
    return;
  }
  const title = reminderTitleFromText(text);
  const { data, error } = await admin.from('reminders').insert({
    organization_id: identity.organization_id,
    created_by: identity.user_id,
    site_id: context.activeSiteId,
    title,
    notes: text,
    scheduled_for: due.iso,
    channel: 'whatsapp',
    status: 'pending',
  }).select('id').single();
  if (error) throw error;
  await auditCommand(admin, identity, sourceMessageId, 'CREATE_REMINDER', 'executed', { text, title, due_at: due.iso }, { reminder_id: data.id });
  await reply(admin, identity, `⏰ Recordatorio creado\n*${title}*\n📅 ${formatDate(due.iso)}`);
}

async function fieldNote(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, text: string, context: HseConversationContext, message: NormalizedWhatsAppMessage): Promise<void> {
  const { data, error } = await admin.from('field_entries').insert({
    organization_id: identity.organization_id,
    site_id: context.activeSiteId,
    created_by: identity.user_id,
    input_type: inputType(message),
    raw_text: text,
    captured_at: message.occurredAt,
    processing_status: 'structured',
    metadata: { channel: 'whatsapp', kind: 'field_note', provider_message_id: message.providerMessageId },
    client_capture_id: `wa-note:${message.providerMessageId}`,
  }).select('id').single();
  if (error) throw error;
  await auditCommand(admin, identity, sourceMessageId, 'FIELD_NOTE', 'executed', { text }, { field_entry_id: data.id });
  await reply(admin, identity, '📝 Nota de campo guardada.');
}

async function queryPending(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, context: HseConversationContext): Promise<void> {
  let query = admin
    .from('findings')
    .select('id,code,title,severity,status,due_at')
    .eq('organization_id', identity.organization_id)
    .in('status', ['open', 'in_progress'])
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(10);
  if (context.activeSiteId) query = query.eq('site_id', context.activeSiteId);
  const { data: findings, error } = await query;
  if (error) throw error;
  const now = Date.now();
  const items = findings || [];
  const overdue = items.filter(item => item.due_at && new Date(item.due_at).getTime() < now).length;
  await auditCommand(admin, identity, sourceMessageId, 'QUERY_PENDING', 'executed', { site_id: context.activeSiteId }, { count: items.length, overdue });
  if (!items.length) {
    await reply(admin, identity, '✅ No encontré hallazgos abiertos en el contexto actual.');
    return;
  }
  const lines = [`📋 *Pendientes HSE* · ${items.length}${overdue ? ` · 🔴 ${overdue} vencido${overdue === 1 ? '' : 's'}` : ''}`, ''];
  for (const item of items) {
    const late = item.due_at && new Date(item.due_at).getTime() < now ? '🔴' : item.severity === 'critical' ? '🟠' : '•';
    lines.push(`${late} ${item.code} · ${item.title}${item.due_at ? ` · ${formatDate(item.due_at)}` : ''}`);
  }
  await reply(admin, identity, lines.join('\n'));
}

async function updateInboundAudit(admin: SupabaseClient, sourceMessageId: string, transcript: string, media: ProcessedMedia[]): Promise<void> {
  const { error } = await admin.from('hse_channel_messages').update({
    transcript: transcript || null,
    media,
  }).eq('id', sourceMessageId);
  if (error) throw error;
}

export async function processWhatsAppMessage(message: NormalizedWhatsAppMessage): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin client is not configured');

  const identity = await resolveIdentity(admin, message);
  if (!identity) {
    await sendWhatsAppText(
      message.externalUserId,
      'Este número todavía no está vinculado a HSE Copilot. Pedile a un administrador que lo asocie a tu usuario y organización.',
      message.externalAccountId,
    );
    return;
  }

  const inbound = await insertInboundMessage(admin, identity, message);
  // Meta can retry the same webhook. provider_message_id is the idempotency key:
  // an already-audited inbound message must not execute a second command.
  if (!inbound) return;

  try {
    const mediaResult = await persistMedia(admin, identity, message);
    const transcript = mediaResult.transcript || message.text?.trim() || '';
    await updateInboundAudit(admin, inbound.id, transcript, mediaResult.processed);

    if (transcript && await executePendingConfirmation(admin, identity, inbound.id, transcript)) return;

    if (!transcript && !mediaResult.imageDraft) {
      await reply(admin, identity, 'Recibí el mensaje, pero no pude extraer texto o evidencia procesable. Probá con audio, texto o foto.');
      return;
    }

    const context = await currentContext(admin, identity);
    const classification = classifyHseIntent(transcript || message.text || 'evidencia fotográfica');

    switch (classification.intent) {
      case 'SET_CONTEXT':
        await setContext(admin, identity, inbound.id, transcript);
        break;
      case 'CREATE_REMINDER':
        await createReminder(admin, identity, inbound.id, transcript, context);
        break;
      case 'QUERY_PENDING':
      case 'QUERY_FINDINGS':
        await queryPending(admin, identity, inbound.id, context);
        break;
      case 'FIELD_NOTE':
        await fieldNote(admin, identity, inbound.id, transcript, context, message);
        break;
      case 'CREATE_FINDING':
        await createFindingProposal(admin, identity, message, inbound.id, transcript, context, mediaResult.processed, mediaResult.imageDraft, mediaResult.provider, mediaResult.model);
        break;
      default:
        await auditCommand(admin, identity, inbound.id, classification.intent, 'proposed', { text: transcript, confidence: classification.confidence }, { supported: false });
        await reply(admin, identity, 'Entendí lo que querés hacer, pero esa acción todavía requiere abrir HSE Copilot para ejecutarla de forma segura. No hice cambios.');
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown WhatsApp HSE error';
    console.error('HSE WhatsApp processing failed', messageText);
    await admin.from('hse_channel_messages').update({ metadata: { processing_error: messageText } }).eq('id', inbound.id);
    await reply(admin, identity, 'Tu mensaje quedó recibido, pero no pude terminar de procesarlo. No creé ni cerré ningún registro automáticamente.');
    throw error;
  }
}
