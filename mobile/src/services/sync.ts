import { deletePersistedCapture } from './media';
import { hasInternetConnection } from './network';
import { listOfflineCaptures, markOfflineCaptureFailure, removeOfflineCapture } from './offline-queue';
import { processCapture } from './capture-pipeline';

export type SyncResult = { attempted: number; synced: number; failed: number; pending: number; online: boolean };

export async function syncOfflineCaptures(): Promise<SyncResult> {
  const online = await hasInternetConnection();
  const items = await listOfflineCaptures();
  if (!online || !items.length) return { attempted: 0, synced: 0, failed: 0, pending: items.length, online };

  let synced = 0;
  let failed = 0;
  for (const item of [...items].reverse()) {
    try {
      await processCapture(item, false);
      await removeOfflineCapture(item.id);
      await deletePersistedCapture(item.mediaUri);
      synced += 1;
    } catch (error) {
      await markOfflineCaptureFailure(item.id, error);
      failed += 1;
    }
  }
  const pending = (await listOfflineCaptures()).length;
  return { attempted: items.length, synced, failed, pending, online: true };
}
