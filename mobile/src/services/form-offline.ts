import Storage from 'expo-sqlite/kv-store';
import type { HseFormAnswers } from '../types/forms';
import { saveFormAnswers, startFormRun } from './forms';

const KEY = 'hse.offline.forms.v1';
export type OfflineFormDraft = {
  clientRunId: string;
  serverRunId: string | null;
  templateVersionId: string;
  templateId: string;
  siteId: string | null;
  answers: HseFormAnswers;
  updatedAt: string;
  syncError: string | null;
};

async function read(): Promise<OfflineFormDraft[]> {
  const raw = await Storage.getItem(KEY);
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed as OfflineFormDraft[] : []; }
  catch { return []; }
}
async function write(items: OfflineFormDraft[]) { await Storage.setItem(KEY, JSON.stringify(items)); }

export async function listOfflineFormDrafts() { return read(); }
export async function getOfflineFormDraft(clientRunId: string) { return (await read()).find(item => item.clientRunId === clientRunId) || null; }

export async function saveOfflineFormDraft(input: Omit<OfflineFormDraft, 'updatedAt'|'syncError'>) {
  const items = await read();
  const item: OfflineFormDraft = { ...input, updatedAt: new Date().toISOString(), syncError: null };
  await write([item, ...items.filter(existing => existing.clientRunId !== input.clientRunId)].slice(0, 50));
  return item;
}

export async function removeOfflineFormDraft(clientRunId: string) { await write((await read()).filter(item => item.clientRunId !== clientRunId)); }

export async function syncOfflineFormDraft(clientRunId: string) {
  const items = await read();
  const item = items.find(draft => draft.clientRunId === clientRunId);
  if (!item) return null;
  try {
    const runId = item.serverRunId || (await startFormRun(item.templateVersionId, item.siteId, item.clientRunId)).runId;
    await saveFormAnswers(runId, item.answers);
    const synced = { ...item, serverRunId: runId, syncError: null, updatedAt: new Date().toISOString() };
    await write(items.map(draft => draft.clientRunId === clientRunId ? synced : draft));
    return synced;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || 'Error de sincronización');
    await write(items.map(draft => draft.clientRunId === clientRunId ? { ...draft, syncError: message, updatedAt: new Date().toISOString() } : draft));
    throw error;
  }
}
