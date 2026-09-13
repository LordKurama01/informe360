import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useAuth } from './auth-provider';
import { clearWorkspace, resolveWorkspace, type Workspace } from '../services/workspace';

type WorkspaceContextValue = { workspace: Workspace | null; loading: boolean; refresh(): Promise<void> };
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!session) { setWorkspace(null); setLoading(false); await clearWorkspace(); return; }
    setLoading(true);
    try { setWorkspace(await resolveWorkspace()); } finally { setLoading(false); }
  }, [session]);
  useEffect(() => { void refresh(); }, [refresh]);
  return <WorkspaceContext.Provider value={useMemo(() => ({ workspace, loading, refresh }), [workspace, loading, refresh])}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() { const value = useContext(WorkspaceContext); if (!value) throw new Error('useWorkspace must be used inside WorkspaceProvider'); return value; }
