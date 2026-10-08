import { supabase } from '../lib/supabase';
import { uploadLocalFile } from './upload';
import { photoStoragePath } from './form-evidence';

/** Save an inspection photo under its owning organization and immutable form run. */
export async function uploadFormPhoto(organizationId: string, runId: string, fieldKey: string, uri: string) {
  const filename = (uri.split('/').pop() || 'photo').split('?')[0];
  const upload = await uploadLocalFile({
    bucket: 'hse-evidence',
    organizationId,
    entityId: 'form-runs/' + runId,
    uri,
    mimeType: 'image/jpeg',
    prefix: 'inspection',
    stableId: fieldKey + '-' + filename,
    upsert: true,
  });
  return upload.path;
}

/** Signed URL is short-lived; never convert a private reference into a permanent URL. */
export async function signedFormPhoto(value: string): Promise<string> {
  const path = photoStoragePath(value);
  if (!path) throw new Error('Referencia de fotografía inválida.');
  const { data, error } = await supabase.storage.from('hse-evidence').createSignedUrl(path, 900);
  if (error || !data?.signedUrl) throw error || new Error('No se pudo abrir la evidencia.');
  return data.signedUrl;
}
