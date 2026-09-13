import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';

export type Workspace = { organizationId: string; organizationName: string; siteId: string | null; siteName: string | null; role: string };
const KEY = 'hse_workspace';

export async function saveWorkspace(workspace: Workspace) { await SecureStore.setItemAsync(KEY, JSON.stringify(workspace)); }
export async function clearWorkspace() { await SecureStore.deleteItemAsync(KEY); }
export async function loadStoredWorkspace(): Promise<Workspace | null> { const raw = await SecureStore.getItemAsync(KEY); if (!raw) return null; try { return JSON.parse(raw) as Workspace; } catch { return null; } }

export async function resolveWorkspace(): Promise<Workspace | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const stored = await loadStoredWorkspace();
  const memberships = await supabase.from('organization_members').select('organization_id, role').eq('user_id', userData.user.id).order('created_at').limit(20);
  if (memberships.error) throw memberships.error;
  const member = memberships.data?.find((item) => item.organization_id === stored?.organizationId) || memberships.data?.[0];
  if (!member) return null;
  const [{ data: organization, error: orgError }, { data: sites, error: sitesError }] = await Promise.all([
    supabase.from('organizations').select('id,name').eq('id', member.organization_id).single(),
    supabase.from('sites').select('id,name').eq('organization_id', member.organization_id).order('created_at'),
  ]);
  if (orgError) throw orgError;
  if (sitesError) throw sitesError;
  const site = sites?.find((item) => item.id === stored?.siteId) || sites?.[0] || null;
  const workspace = { organizationId: organization.id, organizationName: organization.name, siteId: site?.id || null, siteName: site?.name || null, role: member.role };
  await saveWorkspace(workspace);
  return workspace;
}

export async function createWorkspace(organizationName: string, siteName: string): Promise<Workspace> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError || new Error('No authenticated user');
  const { data: org, error: orgError } = await supabase.from('organizations').insert({ name: organizationName.trim(), created_by: userData.user.id }).select('id,name').single();
  if (orgError) throw orgError;
  const { data: site, error: siteError } = await supabase.from('sites').insert({ organization_id: org.id, name: siteName.trim(), created_by: userData.user.id, country_code: 'AR' }).select('id,name').single();
  if (siteError) throw siteError;
  const workspace = { organizationId: org.id, organizationName: org.name, siteId: site.id, siteName: site.name, role: 'owner' };
  await saveWorkspace(workspace);
  return workspace;
}
