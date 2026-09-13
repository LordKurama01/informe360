import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useAuth } from './auth-provider';
import { onNetworkAvailable } from '../services/network';
import { pendingOfflineCount } from '../services/offline-queue';
import { syncOfflineCaptures, type SyncResult } from '../services/sync';

export type SyncContextValue = {
  pendingCount: number;
  syncing: boolean;
  lastResult: SyncResult | null;
  refreshPending(): Promise<void>;
  syncNow(): Promise<SyncResult>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const refreshPending = useCallback(async () => setPendingCount(await pendingOfflineCount()), []);
  const syncNow = useCallback(async () => {
    if (!session) {
      const result = { attempted: 0, synced: 0, failed: 0, pending: await pendingOfflineCount(), online: false };
      setPendingCount(result.pending);
      return result;
    }
    setSyncing(true);
    try {
      const result = await syncOfflineCaptures();
      setLastResult(result);
      setPendingCount(result.pending);
      return result;
    } finally {
      setSyncing(false);
    }
  }, [session]);

  useEffect(() => { void refreshPending(); }, [refreshPending]);
  useEffect(() => {
    if (!session) return;
    void syncNow();
    return onNetworkAvailable(() => syncNow());
  }, [session, syncNow]);

  const value = useMemo(() => ({ pendingCount, syncing, lastResult, refreshPending, syncNow }), [pendingCount, syncing, lastResult, refreshPending, syncNow]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const value = useContext(SyncContext);
  if (!value) throw new Error('useSync must be used inside SyncProvider');
  return value;
}
