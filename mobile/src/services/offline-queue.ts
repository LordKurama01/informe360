import Storage from 'expo-sqlite/kv-store';
import type { Workspace } from './workspace';

const KEY = 'hse.offline.capture.queue.v1';

export type OfflineCapture = {
  id: string;
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
  const raw = await Storage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as OfflineCapture[] : [];
  } catch {
    return [];
  }
}

async function write(items: OfflineCapture[]) {
  await Storage.setItem(KEY, JSON.stringify(items));
}

export async function queueOfflineCapture(input: Omit<OfflineCapture, 'id' | 'createdAt' | 'attempts'>) {
  const items = await listOfflineCaptures();
  const item: OfflineCapture = {
    ...input,
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  };
  await write([item, ...items].slice(0, 100));
  return item;
}

export async function removeOfflineCapture(id: string) {
  await write((await listOfflineCaptures()).filter(item => item.id !== id));
}

export async function markOfflineCaptureFailure(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Error de sincronización');
  const items = await listOfflineCaptures();
  await write(items.map(item => item.id === id ? { ...item, attempts: item.attempts + 1, lastError: message } : item));
}

export async function pendingOfflineCount() {
  return (await listOfflineCaptures()).length;
}
