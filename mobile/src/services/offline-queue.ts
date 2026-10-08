import Storage from 'expo-sqlite/kv-store';
import { supabase } from '../lib/supabase';
import type { Workspace } from './workspace';
import { readLocalArray, updateLocalArray } from './local-kv';

const KEY = 'hse.offline.capture.queue.v1';

export type OfflineCapture = {
  id: string;
  ownerUserId?: string; // Legacy captures may lack ownership; do not auto-upload them.
  workspace: Workspace;
  inputType: 'text' | 'audio' | 'photo';
  rawText: string | null;
  mediaUri?: string | null;
  mimeType?: string | null;
  createdAt: string;
  attempts: number;
  lastError?: string | null;
};

export async function listOfflineCaptures(): Promise<OfflineCapture[]> {
  return readLocalArray<OfflineCapture>(Storage, KEY);
}



export async function queueOfflineCapture(input: Omit<OfflineCapture, 'id' | 'createdAt' | 'attempts'>) {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user?.id) throw new Error('Iniciá sesión antes de guardar nuevas capturas.');
  const item: OfflineCapture = {
    ownerUserId: data.session.user.id,
    ...input,
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  };
  return updateLocalArray<OfflineCapture, OfflineCapture>(Storage, KEY, items => {
    if (items.length >= 100) throw new Error('Cola de capturas completa. Sincronizá antes de guardar otra.');
    return { items: [item, ...items], result: item };
  });
}

export async function removeOfflineCapture(id: string) {
  await updateLocalArray<OfflineCapture, void>(Storage, KEY, items => ({ items: items.filter(item => item.id !== id), result: undefined }));
}

export async function markOfflineCaptureFailure(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Error de sincronización');
  await updateLocalArray<OfflineCapture, void>(Storage, KEY, items => ({ items: items.map(item => item.id === id ? { ...item, attempts: item.attempts + 1, lastError: message } : item), result: undefined }));
}

export async function pendingOfflineCount() {
  return (await listOfflineCaptures()).length;
}
