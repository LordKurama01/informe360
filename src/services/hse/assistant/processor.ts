import type { SupabaseClient } from '@supabase/supabase-js';
import { analyzeImage, structureFieldEntry, transcribeAudio } from '../../ai/hse/router';
import { getSupabaseAdmin } from '../../supabase/server';
import { resolveUserDueText } from '../../../shared/hse/date-resolution.mjs';
import { downloadMetaMedia, sendWhatsAppText } from '../channels/meta-whatsapp';
import type { HseChannelIdentity, NormalizedWhatsAppMessage } from '../channels/types';
import { classifyHseIntent, extractContextLabel, isConfirmationText, isRejectionText, reminderTitleFromText } from './intent-router';
import type { HseAssistantIntent, HseConversationContext, ProposedClosePayload, ProposedFindingPayload } from './types';
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

type CloseRpcRow = {
  finding_id: string;
  finding_code: string;
  next_version: number;
};

type EvidencePhase = 'initial' | 'supporting' | 'closure';

type ProposedEvidencePayload = {
  kind: 'evidence';
  findingId: string;
  findingCode: string;
  findingTitle: string;
  phase: EvidencePhase;
  media: ProcessedMedia[];
};

type FindingTarget = { id: string; code: string; title: string; status: string };

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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function argentinaDayBounds(now = new Date()): { start: string; end: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map(part => [part.type, part.value]));
  const localDate = `${parts.year}-${parts.month}-${parts.day}`;
  const startDate = new Date(`${localDate}T00:00:00-03:00`);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  return { start: startDate.toISOString(), end: endDate.toISOString() };
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

async function updateConversationContext(
  admin: SupabaseClient,
  identity: HseChannelIdentity,
  patch: { active_site_id?: string | null; active_location_text?: string | null; active_finding_id?: string | null },
): Promise<void> {
  const { error } = await admin.from('hse_conversation_contexts').upsert({
    identity_id: identity.id,
    organization_id: identity.organization_id,
    user_id: identity.user_id,
    ...patch,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'identity_id' });
  if (error) throw error;
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

function isProposedClose(value: unknown): value is ProposedClosePayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const payload = value as Partial<ProposedClosePayload>;
  return payload.kind === 'close_finding' && typeof payload.findingId === 'string' && typeof payload.findingCode === 'string' && typeof payload.findingTitle === 'string';
}

function isProposedEvidence(value: unknown): value is ProposedEvidencePayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const payload = value as Partial<ProposedEvidencePayload>;
  return payload.kind === 'evidence' && typeof payload.findingId === 'string' && typeof payload.findingCode === 'string' && Array.isArray(payload.media);
}

async function linkEvidence(
  admin: SupabaseClient,
  identity: HseChannelIdentity,
  findingId: string,
  media: ProcessedMedia[],
  phase: EvidencePhase,
): Promise<number> {
  let linked = 0;
  for (const item of media) {
    const { error } = await admin.from('evidence_files').insert({
      organization_id: identity.organization_id,
      finding_id: findingId,
      storage_bucket: 'hse-evidence',
      storage_path: item.storagePath,
      file_name: item.fileName,
      mime_type: item.mimeType,
      size_bytes: item.byteSize,
      sha256: item.sha256 || null,
      uploaded_by: identity.user_id,
      phase,
    });
    if (error) {
      if (error.code === '23505') continue;
      throw error;
    }
    linked += 1;
  }
  return linked;
}

async function executeFindingConfirmation(admin: SupabaseClient, identity: HseChannelIdentity, pendingId: string, payload: ProposedFindingPayload, sourceMessageId: string): Promise<void> {
  await admin.from('hse_assistant_commands').update({ status: 'confirmed' }).eq('id', pendingId);
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
    await admin.from('hse_assistant_commands').update({ status: 'failed', error_message: rpcError.message }).eq('id', pendingId);
    throw rpcError;
  }
  const row = Array.isArray(data) ? data[0] as FindingRpcRow | undefined : undefined;
  if (!row?.finding_id) throw new Error('Finding RPC returned no finding');

  const initialMedia: ProcessedMedia[] = (payload.mediaPaths || []).map(storagePath => ({
    kind: 'image',
    storagePath,
    fileName: storagePath.split('/').pop() || 'whatsapp-image',
    mimeType: 'image/jpeg',
    byteSize: 0,
  }));
  await linkEvidence(admin, identity, row.finding_id, initialMedia, 'initial');

  await admin.from('hse_assistant_commands').update({
    status: 'executed',
    executed_at: new Date().toISOString(),
    result: { finding_id: row.finding_id, finding_code: row.finding_code, action_id: row.action_id, reminder_id: row.reminder_id },
  }).eq('id', pendingId);
  await updateConversationContext(admin, identity, { active_finding_id: row.finding_id });
  await auditCommand(admin, identity, sourceMessageId, 'CREATE_FINDING', 'executed', { confirmation_for: pendingId, decision: 'confirm' }, { finding_id: row.finding_id, finding_code: row.finding_code });

  const reminderLine = payload.dueAt ? `\n⏰ Seguimiento: ${formatDateTime(payload.dueAt)}` : '';
  await reply(admin, identity, `✅ ${row.finding_code || 'Hallazgo'} registrado.${reminderLine}\nYa aparece en HSE Copilot y queda como hallazgo activo de esta conversación.`);
}

async function executeCloseConfirmation(admin: SupabaseClient, identity: HseChannelIdentity, pendingId: string, payload: ProposedClosePayload, sourceMessageId: string): Promise<void> {
  await admin.from('hse_assistant_commands').update({ status: 'confirmed' }).eq('id', pendingId);
  const { data, error } = await admin.rpc('close_channel_finding', {
    p_actor_id: identity.user_id,
    p_organization_id: identity.organization_id,
    p_finding_id: payload.findingId,
    p_comment: payload.comment,
  });
  if (error) {
    await admin.from('hse_assistant_commands').update({ status: 'failed', error_message: error.message }).eq('id', pendingId);
    throw error;
  }
  const row = Array.isArray(data) ? data[0] as CloseRpcRow | undefined : undefined;
  if (!row?.finding_id) throw new Error('Close RPC returned no finding');

  await admin.from('hse_assistant_commands').update({
    status: 'executed',
    executed_at: new Date().toISOString(),
    result: { finding_id: row.finding_id, finding_code: row.finding_code, version: row.next_version },
  }).eq('id', pendingId);
  await updateConversationContext(admin, identity, { active_finding_id: null });
  await auditCommand(admin, identity, sourceMessageId, 'CLOSE_FINDING', 'executed', { confirmation_for: pendingId, decision: 'confirm' }, { finding_id: row.finding_id, finding_code: row.finding_code });
  await reply(admin, identity, `✅ ${row.finding_code || payload.findingCode} cerrado. Las acciones pendientes quedaron completadas y los recordatorios futuros fueron cancelados.`);
}

async function executeEvidenceConfirmation(admin: SupabaseClient, identity: HseChannelIdentity, pendingId: string, payload: ProposedEvidencePayload, sourceMessageId: string): Promise<void> {
  await admin.from('hse_assistant_commands').update({ status: 'confirmed' }).eq('id', pendingId);
  const count = await linkEvidence(admin, identity, payload.findingId, payload.media, payload.phase);
  await admin.from('hse_assistant_commands').update({
    status: 'executed',
    executed_at: new Date().toISOString(),
    result: { finding_id: payload.findingId, finding_code: payload.findingCode, evidence_count: count, phase: payload.phase },
  }).eq('id', pendingId);
  await auditCommand(admin, identity, sourceMessageId, 'ADD_EVIDENCE', 'executed', { confirmation_for: pendingId, decision: 'confirm' }, { finding_id: payload.findingId, evidence_count: count, phase: payload.phase });
  await reply(admin, identity, `📷 Evidencia asociada a ${payload.findingCode} (${count} archivo${count === 1 ? '' : 's'}).`);
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
    await auditCommand(admin, identity, sourceMessageId, pending.intent as HseAssistantIntent, 'executed', { confirmation_for: pending.id, decision: 'reject' }, { rejected: true });
    const message = pending.intent === 'CLOSE_FINDING'
      ? 'Cierre cancelado. El hallazgo sigue abierto.'
      : pending.intent === 'ADD_EVIDENCE'
        ? 'Evidencia descartada. No se vinculó ningún archivo al hallazgo.'
        : 'Descartado. No se creó ningún hallazgo.';
    await reply(admin, identity, message);
    return true;
  }

  if (pending.intent === 'CREATE_FINDING' && isProposedFinding(pending.payload)) {
    await executeFindingConfirmation(admin, identity, String(pending.id), pending.payload, sourceMessageId);
    return true;
  }

  if (pending.intent === 'CLOSE_FINDING' && isProposedClose(pending.payload)) {
    await executeCloseConfirmation(admin, identity, String(pending.id), pending.payload, sourceMessageId);
    return true;
  }

  if (pending.intent === 'ADD_EVIDENCE' && isProposedEvidence(pending.payload)) {
    await executeEvidenceConfirmation(admin, identity, String(pending.id), pending.payload, sourceMessageId);
    return true;
  }

  await reply(admin, identity, 'Ese comando pendiente todavía no tiene un ejecutor seguro. No hice cambios.');
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
  await updateConversationContext(admin, identity, { active_site_id: matchedSiteId, active_location_text: label });
  await auditCommand(admin, identity, sourceMessageId, 'SET_CONTEXT', 'executed', { label }, { active_site_id: matchedSiteId, active_location_text: label });
  await reply(admin, identity, `📍 Contexto activo: *${label}*.\nLo voy a usar en los próximos registros hasta que me indiques otro lugar.`);
}

async function insertOperationalReminder(
  admin: SupabaseClient,
  identity: HseChannelIdentity,
  title: string,
  notes: string,
  dueAt: string,
  siteId: string | null,
  findingId: string | null = null,
): Promise<string> {
  const { data, error } = await admin.from('reminders').insert({
    organization_id: identity.organization_id,
    finding_id: findingId,
    created_by: identity.user_id,
    site_id: siteId,
    title,
    notes,
    scheduled_for: dueAt,
    channel: 'whatsapp',
    status: 'pending',
  }).select('id').single();
  if (error) throw error;
  return String(data.id);
}

async function createReminder(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, text: string, context: HseConversationContext): Promise<void> {
  const due = resolveUserDueText(text);
  const title = reminderTitleFromText(text);
  if (!due) {
    await auditCommand(admin, identity, sourceMessageId, 'CREATE_REMINDER', 'proposed', { text, title, site_id: context.activeSiteId }, { needs_date: true });
    await reply(admin, identity, '¿Para cuándo? Podés responder sólo “mañana”, “viernes a las 9” o una fecha como 18/09/2026.');
    return;
  }
  const reminderId = await insertOperationalReminder(admin, identity, title, text, due.iso, context.activeSiteId);
  await auditCommand(admin, identity, sourceMessageId, 'CREATE_REMINDER', 'executed', { text, title, due_at: due.iso }, { reminder_id: reminderId });
  await reply(admin, identity, `⏰ Recordatorio creado\n*${title}*\n📅 ${formatDateTime(due.iso)}`);
}

async function tryCompleteReminderDate(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, text: string): Promise<boolean> {
  const due = resolveUserDueText(text);
  if (!due) return false;
  const threshold = new Date(Date.now() - 30 * 60_000).toISOString();
  const { data: pending, error } = await admin
    .from('hse_assistant_commands')
    .select('id,payload,result')
    .eq('identity_id', identity.id)
    .eq('intent', 'CREATE_REMINDER')
    .eq('status', 'proposed')
    .gte('created_at', threshold)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!pending || !(pending.result as { needs_date?: boolean } | null)?.needs_date) return false;
  const payload = (pending.payload || {}) as { text?: string; title?: string; site_id?: string | null };
  const title = payload.title?.trim() || reminderTitleFromText(payload.text || 'Recordatorio HSE');
  const reminderId = await insertOperationalReminder(admin, identity, title, payload.text || title, due.iso, payload.site_id || null);
  await admin.from('hse_assistant_commands').update({
    status: 'executed',
    executed_at: new Date().toISOString(),
    result: { reminder_id: reminderId, due_at: due.iso },
  }).eq('id', pending.id);
  await auditCommand(admin, identity, sourceMessageId, 'CREATE_REMINDER', 'executed', { continuation_for: pending.id, due_at: due.iso }, { reminder_id: reminderId });
  await reply(admin, identity, `⏰ Listo. *${title}*\n📅 ${formatDateTime(due.iso)}`);
  return true;
}

async function rescheduleReminder(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, text: string): Promise<void> {
  const due = resolveUserDueText(text);
  if (!due) {
    await reply(admin, identity, 'Decime la nueva fecha/hora. Por ejemplo: “pasalo para el viernes a las 9”.');
    return;
  }

  let findingId: string | null = null;
  const code = explicitFindingCode(text);
  if (code) {
    const { data: finding, error: findingError } = await admin.from('findings').select('id').eq('organization_id', identity.organization_id).eq('code', code).maybeSingle();
    if (findingError) throw findingError;
    findingId = finding?.id ? String(finding.id) : null;
  }

  let query = admin.from('reminders')
    .select('id,title,finding_id')
    .eq('organization_id', identity.organization_id)
    .eq('created_by', identity.user_id)
    .eq('channel', 'whatsapp')
    .in('status', ['pending', 'failed']);
  if (findingId) query = query.eq('finding_id', findingId);
  const { data: reminder, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!reminder) {
    await reply(admin, identity, 'No encontré un recordatorio de WhatsApp pendiente para reprogramar.');
    return;
  }

  const { error: updateError } = await admin.from('reminders').update({
    scheduled_for: due.iso,
    status: 'pending',
    sent_at: null,
    error_message: null,
  }).eq('id', reminder.id);
  if (updateError) throw updateError;
  await auditCommand(admin, identity, sourceMessageId, 'RESCHEDULE_REMINDER', 'executed', { reminder_id: reminder.id, due_at: due.iso }, { rescheduled: true });
  await reply(admin, identity, `⏰ Reprogramado: *${reminder.title || 'Recordatorio HSE'}*\n📅 ${formatDateTime(due.iso)}`);
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

function explicitFindingCode(text: string): string | null {
  return text.match(/\bHSE-\d+\b/i)?.[0]?.toUpperCase() || null;
}

async function resolveOpenFindingTarget(admin: SupabaseClient, identity: HseChannelIdentity, text: string, context: HseConversationContext): Promise<{ target: FindingTarget | null; explicit: boolean; ambiguous: FindingTarget[] }> {
  const code = explicitFindingCode(text);
  let query = admin.from('findings')
    .select('id,code,title,status')
    .eq('organization_id', identity.organization_id)
    .in('status', ['open', 'in_progress']);
  let explicit = false;
  if (code) {
    query = query.eq('code', code);
    explicit = true;
  } else if (context.activeFindingId) {
    query = query.eq('id', context.activeFindingId);
  } else if (context.activeSiteId) {
    query = query.eq('site_id', context.activeSiteId);
  } else {
    return { target: null, explicit, ambiguous: [] };
  }
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(3);
  if (error) throw error;
  const rows = (data || []) as FindingTarget[];
  return { target: rows.length === 1 ? rows[0] : null, explicit, ambiguous: rows.length > 1 ? rows : [] };
}

async function closeFindingProposal(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, text: string, context: HseConversationContext): Promise<void> {
  const resolved = await resolveOpenFindingTarget(admin, identity, text, context);
  if (resolved.ambiguous.length) {
    await reply(admin, identity, `Encontré más de uno. Decime el código exacto:\n${resolved.ambiguous.map(item => `${item.code} · ${item.title}`).join('\n')}`);
    return;
  }
  if (!resolved.target) {
    await reply(admin, identity, 'Decime qué hallazgo querés cerrar usando su código, por ejemplo “cerrá HSE-1042”.');
    return;
  }
  const payload: ProposedClosePayload = {
    kind: 'close_finding',
    findingId: resolved.target.id,
    findingCode: resolved.target.code,
    findingTitle: resolved.target.title,
    comment: text.trim(),
  };
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  await auditCommand(admin, identity, sourceMessageId, 'CLOSE_FINDING', 'awaiting_confirmation', payload as unknown as Record<string, unknown>, {}, expiresAt);
  await reply(admin, identity, `⚠️ *Confirmar cierre*\n${payload.findingCode} · ${payload.findingTitle}\n\nSi tenés foto de cómo quedó, mandala ahora. Después respondé *SI* para cerrarlo o *NO* para cancelar.`);
}

function evidencePhase(text: string): EvidencePhase {
  return /\b(cierre|cerrado|como quedo|cómo quedó|arreglado|reparado|resuelto|solucionado|despues|después)\b/i.test(text) ? 'closure' : 'supporting';
}

async function addEvidence(
  admin: SupabaseClient,
  identity: HseChannelIdentity,
  sourceMessageId: string,
  text: string,
  context: HseConversationContext,
  media: ProcessedMedia[],
): Promise<void> {
  if (!media.length) {
    await reply(admin, identity, 'Mandame la foto, audio o archivo que querés agregar como evidencia.');
    return;
  }
  const resolved = await resolveOpenFindingTarget(admin, identity, text, context);
  if (resolved.ambiguous.length) {
    await reply(admin, identity, `¿A cuál hallazgo corresponde? Enviame la evidencia con el código:\n${resolved.ambiguous.map(item => `${item.code} · ${item.title}`).join('\n')}`);
    return;
  }
  if (!resolved.target) {
    await reply(admin, identity, 'No puedo asociar esa evidencia sin un hallazgo claro. Indicame el código HSE-####.');
    return;
  }
  const phase = evidencePhase(text);
  if (resolved.explicit) {
    const count = await linkEvidence(admin, identity, resolved.target.id, media, phase);
    await auditCommand(admin, identity, sourceMessageId, 'ADD_EVIDENCE', 'executed', { finding_id: resolved.target.id, phase, explicit: true }, { evidence_count: count });
    await reply(admin, identity, `📷 Evidencia asociada a ${resolved.target.code} (${count} archivo${count === 1 ? '' : 's'}).`);
    return;
  }

  const payload: ProposedEvidencePayload = {
    kind: 'evidence',
    findingId: resolved.target.id,
    findingCode: resolved.target.code,
    findingTitle: resolved.target.title,
    phase,
    media,
  };
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  await auditCommand(admin, identity, sourceMessageId, 'ADD_EVIDENCE', 'awaiting_confirmation', payload as unknown as Record<string, unknown>, {}, expiresAt);
  await reply(admin, identity, `📷 ¿Asocio esta evidencia a *${resolved.target.code} · ${resolved.target.title}*?\nRespondé *SI* o *NO*.`);
}

async function attachEvidenceToPendingClose(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, media: ProcessedMedia[]): Promise<boolean> {
  if (!media.length) return false;
  const { data: pending, error } = await admin.from('hse_assistant_commands')
    .select('id,payload')
    .eq('identity_id', identity.id)
    .eq('intent', 'CLOSE_FINDING')
    .eq('status', 'awaiting_confirmation')
    .gte('confirmation_expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!pending || !isProposedClose(pending.payload)) return false;
  const count = await linkEvidence(admin, identity, pending.payload.findingId, media, 'closure');
  await auditCommand(admin, identity, sourceMessageId, 'ADD_EVIDENCE', 'executed', { finding_id: pending.payload.findingId, phase: 'closure', close_command_id: pending.id }, { evidence_count: count });
  await reply(admin, identity, `📷 Evidencia de cierre agregada a ${pending.payload.findingCode}.\nEl cierre sigue pendiente: respondé *SI* para cerrarlo o *NO* para cancelar.`);
  return true;
}

async function dailySummary(admin: SupabaseClient, identity: HseChannelIdentity, sourceMessageId: string, context: HseConversationContext): Promise<void> {
  const bounds = argentinaDayBounds();
  const { data: commands, error: commandError } = await admin.from('hse_assistant_commands')
    .select('intent,status')
    .eq('identity_id', identity.id)
    .gte('created_at', bounds.start)
    .lt('created_at', bounds.end);
  if (commandError) throw commandError;

  let findingsQuery = admin.from('findings')
    .select('id,status,due_at,severity')
    .eq('organization_id', identity.organization_id)
    .in('status', ['open', 'in_progress']);
  if (context.activeSiteId) findingsQuery = findingsQuery.eq('site_id', context.activeSiteId);
  const { data: openFindings, error: findingError } = await findingsQuery;
  if (findingError) throw findingError;

  const executed = (commands || []).filter(item => item.status === 'executed');
  const count = (intent: string) => executed.filter(item => item.intent === intent).length;
  const now = Date.now();
  const overdue = (openFindings || []).filter(item => item.due_at && new Date(item.due_at).getTime() < now).length;
  const critical = (openFindings || []).filter(item => item.severity === 'critical').length;
  const lines = [
    '📊 *Resumen HSE de hoy*',
    '',
    `🦺 Hallazgos creados: ${count('CREATE_FINDING')}`,
    `📝 Notas de campo: ${count('FIELD_NOTE')}`,
    `📷 Evidencias agregadas: ${count('ADD_EVIDENCE')}`,
    `⏰ Recordatorios creados/reprogramados: ${count('CREATE_REMINDER') + count('RESCHEDULE_REMINDER')}`,
    `✅ Cierres: ${count('CLOSE_FINDING')}`,
    '',
    `📌 Abiertos ahora: ${(openFindings || []).length}`,
    `🔴 Vencidos: ${overdue}`,
    `🟠 Críticos abiertos: ${critical}`,
  ];
  await auditCommand(admin, identity, sourceMessageId, 'DAILY_SUMMARY', 'executed', { site_id: context.activeSiteId, day_start: bounds.start }, { command_count: executed.length, open: openFindings?.length || 0, overdue, critical });
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

    if (transcript && await tryCompleteReminderDate(admin, identity, inbound.id, transcript)) return;
    if (mediaResult.processed.length && await attachEvidenceToPendingClose(admin, identity, inbound.id, mediaResult.processed)) return;
    if (transcript && await executePendingConfirmation(admin, identity, inbound.id, transcript)) return;

    if (!transcript && !mediaResult.imageDraft) {
      await reply(admin, identity, 'Recibí el mensaje, pero no pude extraer texto o evidencia procesable. Probá con audio, texto o foto.');
      return;
    }

    const context = await currentContext(admin, identity);
    const evidenceContinuation = mediaResult.processed.length > 0 && Boolean(context.activeFindingId) && (
      !transcript || /\b(evidencia|cierre|como quedo|cómo quedó|arreglado|reparado|resuelto|solucionado|seguimiento|foto)\b/i.test(transcript)
    );
    const classification = evidenceContinuation
      ? { intent: 'ADD_EVIDENCE' as HseAssistantIntent, confidence: 0.99, reason: 'active-finding media continuation' }
      : classifyHseIntent(transcript || message.text || 'evidencia fotográfica');

    switch (classification.intent) {
      case 'SET_CONTEXT':
        await setContext(admin, identity, inbound.id, transcript);
        break;
      case 'CREATE_REMINDER':
        await createReminder(admin, identity, inbound.id, transcript, context);
        break;
      case 'RESCHEDULE_REMINDER':
        await rescheduleReminder(admin, identity, inbound.id, transcript);
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
      case 'CLOSE_FINDING':
        await closeFindingProposal(admin, identity, inbound.id, transcript, context);
        break;
      case 'ADD_EVIDENCE':
        await addEvidence(admin, identity, inbound.id, transcript, context, mediaResult.processed);
        break;
      case 'DAILY_SUMMARY':
        await dailySummary(admin, identity, inbound.id, context);
        break;
      default:
        await auditCommand(admin, identity, inbound.id, classification.intent, 'proposed', { text: transcript, confidence: classification.confidence }, { supported: false });
        await reply(admin, identity, classification.intent === 'QUERY_PROCEDURE'
          ? 'Para normativa/procedimientos sólo respondo desde documentación HSE validada. Esa consulta todavía requiere abrir HSE Copilot con la fuente correspondiente; no voy a inventar una respuesta.'
          : 'Entendí lo que querés hacer, pero esa acción todavía requiere abrir HSE Copilot para ejecutarla de forma segura. No hice cambios.');
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown WhatsApp HSE error';
    console.error('HSE WhatsApp processing failed', messageText);
    await admin.from('hse_channel_messages').update({ metadata: { processing_error: messageText } }).eq('id', inbound.id);
    await reply(admin, identity, 'Tu mensaje quedó recibido, pero no pude terminar de procesarlo. No creé ni cerré ningún registro automáticamente.');
    throw error;
  }
}
