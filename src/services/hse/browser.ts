'use client';

import { getBrowserSupabase } from '@/services/supabase/browser';

export type HseWorkspace = { organizationId: string; organizationName: string; siteId: string | null; siteName: string | null; role: string };
export type HseFinding = { id: string; code: string; title: string; description: string | null; severity: 'low'|'medium'|'high'|'critical'; priority: 'low'|'medium'|'high'|'urgent'; status: 'open'|'in_progress'|'closed'|'cancelled'; due_at: string | null; closed_at: string | null; location_text: string | null; element_text: string | null; responsible_text: string | null; category: string | null; closure_comment: string | null; created_at: string };
export type HseSummary = { open: number; overdue: number; dueNext7Days: number; closed: number; closedOnTime: number; closureCompliancePct: number; criticalOpen: number };

export async function getCurrentHseUser() {
  const { data } = await getBrowserSupabase().auth.getUser();
  return data.user;
}

export async function hseSignIn(email: string, password: string) {
  const { error } = await getBrowserSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function hseSignUp(email: string, password: string) {
  const { error } = await getBrowserSupabase().auth.signUp({ email: email.trim(), password });
  if (error) throw error;
}

export async function hseSignOut() { await getBrowserSupabase().auth.signOut(); }

export async function getHseWorkspace(): Promise<HseWorkspace | null> {
  const supabase = getBrowserSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data: memberships, error: memberError } = await supabase.from('organization_members').select('organization_id,role,created_at').eq('user_id', userData.user.id).order('created_at').limit(20);
  if (memberError) throw memberError;
  const member = memberships?.[0];
  if (!member) return null;
  const [{ data: org, error: orgError }, { data: sites, error: siteError }] = await Promise.all([
    supabase.from('organizations').select('id,name').eq('id', member.organization_id).single(),
    supabase.from('sites').select('id,name').eq('organization_id', member.organization_id).order('created_at'),
  ]);
  if (orgError) throw orgError;
  if (siteError) throw siteError;
  const site = sites?.[0] || null;
  return { organizationId: org.id, organizationName: org.name, siteId: site?.id || null, siteName: site?.name || null, role: member.role };
}

export async function getHseSummary(workspace: HseWorkspace): Promise<HseSummary> {
  const { data, error } = await getBrowserSupabase().rpc('hse_dashboard_summary', { p_organization_id: workspace.organizationId, p_site_id: workspace.siteId });
  if (error) throw error;
  return data as HseSummary;
}

export async function getHseFindings(workspace: HseWorkspace, query = ''): Promise<HseFinding[]> {
  const supabase = getBrowserSupabase();
  if (query.trim()) {
    const { data, error } = await supabase.rpc('search_findings', { p_organization_id: workspace.organizationId, p_query: query.trim(), p_site_id: workspace.siteId, p_include_closed: true });
    if (error) throw error;
    return (data || []) as HseFinding[];
  }
  let request = supabase.from('findings').select('id,code,title,description,severity,priority,status,due_at,closed_at,location_text,element_text,responsible_text,category,closure_comment,created_at').eq('organization_id', workspace.organizationId).order('created_at', { ascending: false }).limit(200);
  if (workspace.siteId) request = request.eq('site_id', workspace.siteId);
  const { data, error } = await request;
  if (error) throw error;
  return (data || []) as HseFinding[];
}

export async function seedHseDemo(): Promise<void> {
  const { error } = await getBrowserSupabase().rpc('seed_hse_demo');
  if (error) throw error;
}

export async function createHseReport(workspace: HseWorkspace, findings: HseFinding[], title?: string) {
  if (!findings.length) throw new Error('Seleccioná al menos un hallazgo');
  const generated = {
    executiveSummary: `Informe HSE generado desde ${findings.length} hallazgo${findings.length === 1 ? '' : 's'} operacionales.`,
    findings: findings.map(finding => ({ code: finding.code, title: finding.title, severity: finding.severity, priority: finding.priority, status: finding.status, location: finding.location_text, element: finding.element_text, responsible: finding.responsible_text, dueAt: finding.due_at, closure: finding.closure_comment })),
    generatedBy: 'Informe360 HSE Copilot', generatedAt: new Date().toISOString(),
  };
  const { data, error } = await getBrowserSupabase().rpc('create_report_from_findings', {
    p_organization_id: workspace.organizationId,
    p_site_id: workspace.siteId,
    p_title: title?.trim() || `Informe HSE · ${workspace.siteName || workspace.organizationName}`,
    p_report_type: 'Cacería técnica / recorrido de hallazgos',
    p_finding_ids: findings.map(f => f.id),
    p_generated_report: generated,
  });
  if (error) throw error;
  return data as string;
}

export async function getHseReport(reportId: string) {
  const supabase = getBrowserSupabase();
  const [{ data: report, error: reportError }, { data: links, error: linksError }] = await Promise.all([
    supabase.from('reports').select('id,title,report_type,status,generated_report,created_at,organization_id,site_id').eq('id', reportId).single(),
    supabase.from('report_findings').select('finding_id,findings(id,code,title,description,severity,priority,status,due_at,closed_at,location_text,element_text,responsible_text,category,closure_comment,created_at)').eq('report_id', reportId),
  ]);
  if (reportError) throw reportError;
  if (linksError) throw linksError;
  return { report, findings: (links || []).map(link => link.findings).filter(Boolean).flat() as unknown as HseFinding[] };
}
