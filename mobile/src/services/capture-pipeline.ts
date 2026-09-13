import { supabase } from '../lib/supabase';
import { analyzeImage, manualDraft, structureText, transcribeAudio } from './api';
import { savePendingDraft, type PendingDraft } from './drafts';
import { updateFieldEntry } from './findings';
import { compressEvidenceImage } from './media';
import type { OfflineCapture } from './offline-queue';
import { uploadLocalFile } from './upload';

async function upsertFieldEntry(capture: OfflineCapture) {
  const { data, error } = await supabase.rpc('upsert_field_entry_from_client', {
    p_organization_id: capture.workspace.organizationId,
    p_site_id: capture.workspace.siteId,
    p_client_capture_id: capture.id,
    p_input_type: capture.inputType,
    p_raw_text: capture.rawText,
  });
  if (error) throw error;
  return data as string;
}

async function structureSafely(text: string) {
  try {
    const result = await structureText(text);
    return { draft: result.draft, dueAt: result.due_at, provider: result.provider };
  } catch {
    return { draft: manualDraft(text), dueAt: null, provider: 'manual' };
  }
}

export async function processCapture(capture: OfflineCapture, saveForImmediateReview = false): Promise<PendingDraft> {
  const fieldEntryId = await upsertFieldEntry(capture);
  let rawText = capture.rawText?.trim() || '';
  let capturePath: string | null = null;
  let photoStoragePaths: string[] | undefined;
  let audioStoragePath: string | undefined;
  let pending: PendingDraft;

  if (capture.inputType === 'text') {
    const structured = await structureSafely(rawText);
    pending = { fieldEntryId, rawText, draft: structured.draft, dueAt: structured.dueAt, provider: structured.provider };
  } else if (capture.inputType === 'photo') {
    if (!capture.mediaUri) throw new Error('La captura fotográfica local no está disponible');
    const compressed = await compressEvidenceImage(capture.mediaUri);
    const upload = await uploadLocalFile({
      bucket: 'hse-captures',
      organizationId: capture.workspace.organizationId,
      entityId: `field-entries/${fieldEntryId}`,
      uri: compressed.uri,
      mimeType: 'image/jpeg',
      prefix: 'photo',
      stableId: capture.id,
      upsert: true,
    });
    capturePath = upload.path;
    photoStoragePaths = [upload.path];
    try {
      const result = await analyzeImage(compressed.uri, rawText);
      pending = { fieldEntryId, rawText, draft: result.draft, dueAt: null, provider: result.provider, capturePath };
    } catch {
      pending = { fieldEntryId, rawText, draft: manualDraft(rawText || 'Evidencia fotográfica pendiente de revisar'), dueAt: null, provider: 'manual', capturePath };
    }
  } else {
    if (!capture.mediaUri) throw new Error('La captura de audio local no está disponible');
    const upload = await uploadLocalFile({
      bucket: 'hse-captures',
      organizationId: capture.workspace.organizationId,
      entityId: `field-entries/${fieldEntryId}`,
      uri: capture.mediaUri,
      mimeType: capture.mimeType || 'audio/mp4',
      prefix: 'voice',
      stableId: capture.id,
      upsert: true,
    });
    capturePath = upload.path;
    audioStoragePath = upload.path;
    try {
      const transcription = await transcribeAudio(capture.mediaUri);
      rawText = transcription.text.trim();
      const structured = await structureSafely(rawText);
      pending = { fieldEntryId, rawText, draft: structured.draft, dueAt: structured.dueAt, provider: `${transcription.provider}+${structured.provider}`, capturePath };
    } catch {
      pending = { fieldEntryId, rawText, draft: manualDraft(rawText || 'Audio pendiente de transcripción manual'), dueAt: null, provider: 'manual', capturePath };
    }
  }

  await updateFieldEntry(fieldEntryId, {
    raw_text: rawText || null,
    processing_status: 'structured',
    processing_error: null,
    ...(photoStoragePaths ? { photo_storage_paths: photoStoragePaths } : {}),
    ...(audioStoragePath ? { audio_storage_path: audioStoragePath } : {}),
    metadata: {
      client_capture_id: capture.id,
      review_draft: pending.draft,
      review_due_at: pending.dueAt,
      review_provider: pending.provider,
      capture_path: pending.capturePath || null,
      synced_at: new Date().toISOString(),
    },
  });

  if (saveForImmediateReview) await savePendingDraft(pending);
  return pending;
}
