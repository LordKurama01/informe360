import { supabase } from '../lib/supabase';
import type { Workspace } from './workspace';
import type { FormRunBundle, FormTemplateSummary, HseFormAnswers, HseFormSchema } from '../types/forms';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const r = Math.floor(Math.random() * 16);
    const v = char === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function listActiveFormTemplates(workspace: Workspace, category?: string): Promise<FormTemplateSummary[]> {
  let templatesQuery = supabase.from('form_templates').select('id,name,category,description,status').eq('organization_id', workspace.organizationId).eq('status', 'active').order('name');
  if (category) templatesQuery = templatesQuery.eq('category', category);
  const { data: templates, error: templatesError } = await templatesQuery;
  if (templatesError) throw templatesError;
  if (!templates?.length) return [];
  const ids = templates.map(item => item.id);
  const { data: versions, error: versionsError } = await supabase.from('form_template_versions').select('id,template_id,version,schema_json,published_at').in('template_id', ids).eq('status', 'published').order('version', { ascending: false });
  if (versionsError) throw versionsError;
  const byTemplate = new Map<string, (typeof versions)[number]>();
  for (const version of versions || []) if (!byTemplate.has(version.template_id)) byTemplate.set(version.template_id, version);
  return templates.flatMap(template => {
    const version = byTemplate.get(template.id);
    if (!version) return [];
    return [{ ...template, publishedVersionId: version.id, version: version.version, schema: version.schema_json as HseFormSchema }];
  });
}

export async function getPublishedTemplate(templateId: string): Promise<FormTemplateSummary> {
  const { data: template, error: templateError } = await supabase.from('form_templates').select('id,name,category,description,status').eq('id', templateId).single();
  if (templateError) throw templateError;
  const { data: version, error: versionError } = await supabase.from('form_template_versions').select('id,version,schema_json').eq('template_id', templateId).eq('status', 'published').order('version', { ascending: false }).limit(1).single();
  if (versionError) throw versionError;
  return { ...template, publishedVersionId: version.id, version: version.version, schema: version.schema_json as HseFormSchema };
}

export async function startFormRun(templateVersionId: string, siteId: string | null, clientRunId = uuidv4()) {
  const { data, error } = await supabase.rpc('create_form_run', { p_template_version_id: templateVersionId, p_site_id: siteId, p_client_run_id: clientRunId });
  if (error) throw error;
  return { runId: data as string, clientRunId };
}

export async function saveFormAnswers(runId: string, answers: HseFormAnswers) {
  const [{ data: userData, error: userError }, { data: run, error: runError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('form_runs').select('organization_id,status').eq('id', runId).single(),
  ]);
  if (userError || !userData.user) throw userError || new Error('Sesión vencida');
  if (runError) throw runError;
  if (!['draft','in_progress'].includes(run.status)) throw new Error('El formulario ya no admite cambios');
  const rows = Object.entries(answers).map(([field_id, value_json]) => ({ organization_id: run.organization_id, form_run_id: runId, field_id, value_json, answered_by: userData.user.id }));
  if (!rows.length) return;
  const { error } = await supabase.from('form_answers').upsert(rows, { onConflict: 'form_run_id,field_id' });
  if (error) throw error;
}

export async function submitFormRun(runId: string, answers: HseFormAnswers) {
  await saveFormAnswers(runId, answers);
  const { error } = await supabase.from('form_runs').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', runId).in('status', ['draft','in_progress']);
  if (error) throw error;
}

export async function getFormRunBundle(runId: string): Promise<FormRunBundle> {
  const { data: run, error: runError } = await supabase.from('form_runs').select('id,organization_id,site_id,template_id,template_version_id,status,started_at,submitted_at,notes').eq('id', runId).single();
  if (runError) throw runError;
  const [{ data: template, error: templateError }, { data: version, error: versionError }, { data: answerRows, error: answersError }] = await Promise.all([
    supabase.from('form_templates').select('id,name,category').eq('id', run.template_id).single(),
    supabase.from('form_template_versions').select('id,version,schema_json').eq('id', run.template_version_id).single(),
    supabase.from('form_answers').select('field_id,value_json').eq('form_run_id', runId),
  ]);
  if (templateError) throw templateError;
  if (versionError) throw versionError;
  if (answersError) throw answersError;
  const answers: HseFormAnswers = {};
  for (const row of answerRows || []) answers[row.field_id] = row.value_json;
  return { run: run as FormRunBundle['run'], template, version: { ...version, schema_json: version.schema_json as HseFormSchema }, answers };
}
