import { supabase } from '../lib/supabase';
import type { DashboardSummary, EvidencePhase, Finding, FindingBundle, Priority, StructuredFindingDraft } from '../types/hse';
import type { Workspace } from './workspace';

async function userId() { const { data, error } = await supabase.auth.getUser(); if (error || !data.user) throw error || new Error('No authenticated user'); return data.user.id; }

export async function createFieldEntry(workspace: Workspace, inputType: 'text' | 'audio' | 'photo' | 'mixed', rawText: string | null) {
  const uid = await userId();
  const { data, error } = await supabase.from('field_entries').insert({ organization_id: workspace.organizationId, site_id: workspace.siteId, created_by: uid, input_type: inputType, raw_text: rawText, processing_status: 'raw' }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export async function updateFieldEntry(id: string, patch: Record<string, unknown>) { const { error } = await supabase.from('field_entries').update(patch).eq('id', id); if (error) throw error; }

function defaultPriority(draft: StructuredFindingDraft): Priority {
  return draft.severity === 'critical' ? 'urgent' : draft.severity === 'high' ? 'high' : draft.severity === 'low' ? 'low' : 'medium';
}

export async function createFindingBundle(fieldEntryId: string, draft: StructuredFindingDraft, dueAt: string | null, priority?: Priority) {
  const { data, error } = await supabase.rpc('create_finding_bundle', { p_field_entry_id: fieldEntryId, p_title: draft.title, p_description: draft.description, p_category: draft.category, p_severity: draft.severity, p_location_text: draft.location_text, p_element_text: draft.element_text, p_responsible_text: draft.responsible_text, p_due_at: dueAt, p_action: draft.action, p_priority: priority || defaultPriority(draft) });
  if (error) throw error;
  return data as string;
}

export async function listFindings(workspace: Workspace): Promise<Finding[]> {
  let query = supabase.from('findings').select('*').eq('organization_id', workspace.organizationId).order('created_at', { ascending: false });
  if (workspace.siteId) query = query.eq('site_id', workspace.siteId);
  const { data, error } = await query.limit(200);
  if (error) throw error;
  return (data || []) as Finding[];
}

export async function searchFindings(workspace: Workspace, query: string, includeClosed = true): Promise<Finding[]> {
  const { data, error } = await supabase.rpc('search_findings', {
    p_organization_id: workspace.organizationId,
    p_query: query.trim(),
    p_site_id: workspace.siteId,
    p_include_closed: includeClosed,
  });
  if (error) throw error;
  return (data || []) as Finding[];
}

export async function getDashboardSummary(workspace: Workspace): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc('hse_dashboard_summary', { p_organization_id: workspace.organizationId, p_site_id: workspace.siteId });
  if (error) throw error;
  return data as DashboardSummary;
}

export async function getFindingBundle(id: string): Promise<FindingBundle> {
  const [findingResult, actionsResult, evidenceResult, eventsResult] = await Promise.all([
    supabase.from('findings').select('*').eq('id', id).single(),
    supabase.from('smart_actions').select('id,action,status,due_at,responsible_text').eq('finding_id', id).order('created_at'),
    supabase.from('evidence_files').select('id,file_name,mime_type,storage_path,phase,created_at').eq('finding_id', id).order('created_at', { ascending: false }),
    supabase.from('finding_events').select('id,event_type,from_status,to_status,note,created_at').eq('finding_id', id).order('created_at', { ascending: false }),
  ]);
  for (const result of [findingResult, actionsResult, evidenceResult, eventsResult]) if (result.error) throw result.error;
  return { finding: findingResult.data as Finding, actions: actionsResult.data || [], evidence: evidenceResult.data || [], events: eventsResult.data || [] } as FindingBundle;
}

export async function closeFinding(finding: Finding, comment: string) { const uid = await userId(); const { error } = await supabase.from('findings').update({ status: 'closed', closed_at: new Date().toISOString(), closed_by: uid, closure_comment: comment.trim() || null }).eq('id', finding.id).eq('version', finding.version); if (error) throw error; }
export async function reopenFinding(finding: Finding) { const { error } = await supabase.from('findings').update({ status: 'open', closed_at: null, closed_by: null, closure_comment: null }).eq('id', finding.id).eq('version', finding.version); if (error) throw error; }

export async function addEvidence(workspace: Workspace, findingId: string, upload: { path: string; fileName: string; byteSize: number }, mimeType: string, phase: EvidencePhase = 'supporting') { const uid = await userId(); const { error } = await supabase.from('evidence_files').insert({ organization_id: workspace.organizationId, finding_id: findingId, storage_bucket: 'hse-evidence', storage_path: upload.path, file_name: upload.fileName, mime_type: mimeType, byte_size: upload.byteSize, uploaded_by: uid, phase }); if (error) throw error; }

export async function signedEvidenceUrl(path: string) {
  const { data, error } = await supabase.storage.from('hse-evidence').createSignedUrl(path, 900);
  if (error) throw error;
  return data.signedUrl;
}

export async function listPendingReminders(workspace: Workspace) { const { data, error } = await supabase.from('reminders').select('id,scheduled_for,status,finding_id,findings(title,code)').eq('organization_id', workspace.organizationId).eq('status', 'pending').order('scheduled_for').limit(100); if (error) throw error; return data || []; }

export async function createReportFromFindings(workspace: Workspace, findingIds: string[], title?: string) {
  if (!findingIds.length) throw new Error('Seleccioná al menos un hallazgo');
  const selected = await Promise.all(findingIds.map(id => getFindingBundle(id)));
  const generatedReport = {
    executiveSummary: `Informe generado desde ${selected.length} hallazgo${selected.length === 1 ? '' : 's'} operacionales.`,
    findings: selected.map(({ finding }) => ({ code: finding.code, title: finding.title, severity: finding.severity, priority: finding.priority, status: finding.status, location: finding.location_text, element: finding.element_text, responsible: finding.responsible_text, dueAt: finding.due_at, closure: finding.closure_comment })),
    generatedBy: 'Informe360 HSE Copilot',
    generatedAt: new Date().toISOString(),
  };
  const { data, error } = await supabase.rpc('create_report_from_findings', {
    p_organization_id: workspace.organizationId,
    p_site_id: workspace.siteId,
    p_title: title?.trim() || `Informe HSE · ${workspace.siteName || workspace.organizationName}`,
    p_report_type: 'Cacería técnica / recorrido de hallazgos',
    p_finding_ids: findingIds,
    p_generated_report: generatedReport,
  });
  if (error) throw error;
  return { reportId: data as string, generatedReport };
}
