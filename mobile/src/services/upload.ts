import { supabase } from '../lib/supabase';

const extFromMime = (mime: string) => mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('audio') ? 'm4a' : 'jpg';

export async function uploadLocalFile({ bucket, organizationId, entityId, uri, mimeType, prefix, stableId, upsert = false }: { bucket: 'hse-captures' | 'hse-evidence'; organizationId: string; entityId: string; uri: string; mimeType: string; prefix: string; stableId?: string; upsert?: boolean }) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('No se pudo leer el archivo local');
  const bytes = await response.arrayBuffer();
  const safeStableId = stableId?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  const fileName = `${prefix}-${safeStableId || Date.now()}.${extFromMime(mimeType)}`;
  const path = `${organizationId}/${entityId}/${fileName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: mimeType, upsert });
  if (error) throw error;
  return { path, fileName, byteSize: bytes.byteLength };
}
