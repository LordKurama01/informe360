import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextValue = { session: Session | null; loading: boolean; signIn(email: string, password: string): Promise<string | null>; signUp(email: string, password: string): Promise<string | null>; signOut(): Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    const app = AppState.addEventListener('change', (state) => state === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh());
    return () => { data.subscription.unsubscribe(); app.remove(); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    async signIn(email, password) { const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); return error?.message || null; },
    async signUp(email, password) { const { data, error } = await supabase.auth.signUp({ email: email.trim(), password }); if (error) return error.message; return data.session ? null : 'Cuenta creada. Revisá el correo si Supabase solicita confirmación.'; },
    async signOut() { await supabase.auth.signOut(); },
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; }
