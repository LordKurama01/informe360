import { supabase } from '../lib/supabase';
import { saveWorkspace, type Workspace } from './workspace';

type SeedResult = { organizationId: string; siteId: string | null; reportId?: string; created?: boolean; findingCount?: number };

export async function seedDemoWorkspace(): Promise<Workspace> {
  const { data, error } = await supabase.rpc('seed_hse_demo');
  if (error) throw error;
  const result = data as SeedResult;
  const [{ data: organization, error: orgError }, { data: site, error: siteError }, { data: user }] = await Promise.all([
    supabase.from('organizations').select('id,name').eq('id', result.organizationId).single(),
    result.siteId ? supabase.from('sites').select('id,name').eq('id', result.siteId).single() : Promise.resolve({ data: null, error: null }),
    supabase.auth.getUser(),
  ]);
  if (orgError) throw orgError;
  if (siteError) throw siteError;
  if (!user.user) throw new Error('Sesión vencida');
  const { data: membership, error: memberError } = await supabase.from('organization_members').select('role').eq('organization_id', result.organizationId).eq('user_id', user.user.id).single();
  if (memberError) throw memberError;
  const workspace: Workspace = {
    organizationId: organization.id,
    organizationName: organization.name,
    siteId: site?.id || null,
    siteName: site?.name || null,
    role: membership.role,
  };
  await saveWorkspace(workspace);
  return workspace;
}
