import { deletePersistedCapture } from './media';
import { hasInternetConnection } from './network';
import { listOfflineCaptures, markOfflineCaptureFailure, removeOfflineCapture } from './offline-queue';
import { processCapture } from './capture-pipeline';
import { eligibleForSync, type Scope as SyncScope } from './sync-scope';

export type SyncResult = { attempted: number; synced: number; failed: number; pending: number; online: boolean };

let inFlight: Promise<SyncResult> | null = null;

async function performSync(scope: SyncScope): Promise<SyncResult> {
  const online = await hasInternetConnection();
  const items = await listOfflineCaptures();
  // Legacy captures without an owner remain on-device for deliberate recovery.
  const eligible = eligibleForSync(items, scope);
  if (!online || !eligible.length) return { attempted: 0, synced: 0, failed: 0, pending: items.length, online };

  let synced = 0;
  let failed = 0;
  for (const item of [...eligible].reverse()) {
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
  return { attempted: eligible.length, synced, failed, pending, online: true };
}

/** Only one uploader may process the local queue at a time. */
export function syncOfflineCaptures(scope: SyncScope): Promise<SyncResult> {
  if (inFlight) return inFlight;
  const running = performSync(scope);
  inFlight = running;
  void running.then(
    () => { if (inFlight === running) inFlight = null; },
    () => { if (inFlight === running) inFlight = null; },
  );
  return running;
}
