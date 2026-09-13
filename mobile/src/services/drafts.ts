import * as SecureStore from 'expo-secure-store';
import type { StructuredFindingDraft } from '../types/hse';

const PENDING = 'hse_pending_structured_draft';
const RAW = 'hse_pending_raw_capture';
export type PendingDraft = { fieldEntryId: string; rawText: string; draft: StructuredFindingDraft; dueAt: string | null; provider: string; capturePath?: string | null };

export async function savePendingDraft(value: PendingDraft) { await SecureStore.setItemAsync(PENDING, JSON.stringify(value)); }
export async function loadPendingDraft(): Promise<PendingDraft | null> { const raw = await SecureStore.getItemAsync(PENDING); if (!raw) return null; try { return JSON.parse(raw) as PendingDraft; } catch { return null; } }
export async function clearPendingDraft() { await SecureStore.deleteItemAsync(PENDING); }
export async function saveRawDraft(value: { mode: string; text: string; savedAt: string }) { await SecureStore.setItemAsync(RAW, JSON.stringify(value)); }
export async function loadRawDraft() { const raw = await SecureStore.getItemAsync(RAW); if (!raw) return null; try { return JSON.parse(raw) as { mode: string; text: string; savedAt: string }; } catch { return null; } }
export async function clearRawDraft() { await SecureStore.deleteItemAsync(RAW); }
