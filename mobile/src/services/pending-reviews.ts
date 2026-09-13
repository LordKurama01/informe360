import { supabase } from '../lib/supabase';
import { savePendingDraft, type PendingDraft } from './drafts';
import type { Workspace } from './workspace';

export type PendingReview = {
  id: string;
  rawText: string;
  capturedAt: string;
  pending: PendingDraft;
};

export async function listPendingReviews(workspace: Workspace): Promise<PendingReview[]> {
  let entriesQuery = supabase.from('field_entries').select('id,raw_text,captured_at,metadata').eq('organization_id', workspace.organizationId).eq('processing_status', 'structured').order('captured_at', { ascending: false }).limit(100);
  if (workspace.siteId) entriesQuery = entriesQuery.eq('site_id', workspace.siteId);
  const { data: entries, error } = await entriesQuery;
  if (error) throw error;
  if (!entries?.length) return [];

  const ids = entries.map(entry => entry.id);
  const { data: linked, error: linkedError } = await supabase.from('findings').select('field_entry_id').in('field_entry_id', ids);
  if (linkedError) throw linkedError;
  const used = new Set((linked || []).map(row => row.field_entry_id).filter(Boolean));

  return entries.flatMap(entry => {
    if (used.has(entry.id)) return [];
    const metadata = (entry.metadata || {}) as Record<string, unknown>;
    const draft = metadata.review_draft;
    if (!draft || typeof draft !== 'object') return [];
    const pending: PendingDraft = {
      fieldEntryId: entry.id,
      rawText: entry.raw_text || '',
      draft: draft as PendingDraft['draft'],
      dueAt: typeof metadata.review_due_at === 'string' ? metadata.review_due_at : null,
      provider: typeof metadata.review_provider === 'string' ? metadata.review_provider : 'manual',
      capturePath: typeof metadata.capture_path === 'string' ? metadata.capture_path : null,
    };
    return [{ id: entry.id, rawText: entry.raw_text || '', capturedAt: entry.captured_at, pending }];
  });
}

export async function openPendingReview(item: PendingReview) {
  await savePendingDraft(item.pending);
}
