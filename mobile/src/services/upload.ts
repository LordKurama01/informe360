import { supabase } from '../lib/supabase';

const extFromMime = (mime: string) => mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('audio') ? 'm4a' : 'jpg';

export async function uploadLocalFile({ bucket, organizationId, entityId, uri, mimeType, prefix }: { bucket: 'hse-captures' | 'hse-evidence'; organizationId: string; entityId: string; uri: string; mimeType: string; prefix: string }) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('No se pudo leer el archivo local');
  const bytes = await response.arrayBuffer();
  const fileName = `${prefix}-${Date.now()}.${extFromMime(mimeType)}`;
  const path = `${organizationId}/${entityId}/${fileName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: mimeType, upsert: false });
  if (error) throw error;
  return { path, fileName, byteSize: bytes.byteLength };
}
