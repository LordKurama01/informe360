import Storage from 'expo-sqlite/kv-store';
import type { HseFormAnswers } from '../types/forms';
import { saveFormAnswers, startFormRun } from './forms';
import { readLocalArray, updateLocalArray } from './local-kv';

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

async function read(): Promise<OfflineFormDraft[]> { return readLocalArray<OfflineFormDraft>(Storage, KEY); }


export async function listOfflineFormDrafts() { return read(); }
export async function getOfflineFormDraft(clientRunId: string) { return (await read()).find(item => item.clientRunId === clientRunId) || null; }

export async function saveOfflineFormDraft(input: Omit<OfflineFormDraft, 'updatedAt'|'syncError'>) {
  const item: OfflineFormDraft = { ...input, updatedAt: new Date().toISOString(), syncError: null };
  return updateLocalArray<OfflineFormDraft, OfflineFormDraft>(Storage, KEY, items => {
    if (items.length >= 50 && !items.some(existing => existing.clientRunId === input.clientRunId)) {
      throw new Error('Almacenamiento de formularios lleno. No se descartaron borradores.');
    }
    return { items: [item, ...items.filter(existing => existing.clientRunId !== input.clientRunId)], result: item };
  });
}

export async function removeOfflineFormDraft(clientRunId: string) {
  await updateLocalArray<OfflineFormDraft, void>(Storage, KEY, items => ({
    items: items.filter(item => item.clientRunId !== clientRunId), result: undefined,
  }));
}

export async function syncOfflineFormDraft(clientRunId: string) {
  const items = await read();
  const item = items.find(draft => draft.clientRunId === clientRunId);
  if (!item) return null;
  try {
    const runId = item.serverRunId || (await startFormRun(item.templateVersionId, item.siteId, item.clientRunId)).runId;
    await saveFormAnswers(runId, item.answers);
    return updateLocalArray<OfflineFormDraft, OfflineFormDraft | null>(Storage, KEY, drafts => {
      const current = drafts.find(draft => draft.clientRunId === clientRunId);
      if (!current) return { items: drafts, result: null };
      const changed = JSON.stringify(current.answers) !== JSON.stringify(item.answers);
      const synced = {
        ...current,
        serverRunId: runId,
        syncError: changed ? 'Existen respuestas nuevas pendientes de enviar.' : null,
        updatedAt: changed ? current.updatedAt : new Date().toISOString(),
      };
      return { items: drafts.map(draft => draft.clientRunId === clientRunId ? synced : draft), result: synced };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || 'Error de sincronización');
    await updateLocalArray<OfflineFormDraft, void>(Storage, KEY, drafts => ({
      items: drafts.map(draft => draft.clientRunId === clientRunId ? { ...draft, syncError: message } : draft),
      result: undefined,
    }));
    throw error;
  }
}
