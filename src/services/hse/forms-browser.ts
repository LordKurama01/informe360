'use client';

import { getBrowserSupabase } from '@/services/supabase/browser';
import type { HseWorkspace } from './browser';
import type { HseFormSchema } from '@/shared/hse/forms/types';
import { validateFormSchema } from '@/shared/hse/forms/validation.mjs';

export type HseFormTemplate = { id:string; organization_id:string; name:string; category:string; description:string|null; status:'draft'|'active'|'archived'; created_at:string; updated_at:string; publishedVersion?: {id:string;version:number;schema_json:HseFormSchema;published_at:string|null}|null };
export type HseFormRunRow = { id:string; status:string; started_at:string; submitted_at:string|null; template_id:string; template_version_id:string; site_id:string|null };

export async function listFormTemplates(workspace:HseWorkspace):Promise<HseFormTemplate[]> {
  const supabase=getBrowserSupabase();
  const {data:templates,error}=await supabase.from('form_templates').select('id,organization_id,name,category,description,status,created_at,updated_at').eq('organization_id',workspace.organizationId).order('updated_at',{ascending:false});
  if(error)throw error;
  if(!templates?.length)return[];
  const {data:versions,error:versionError}=await supabase.from('form_template_versions').select('id,template_id,version,schema_json,published_at').in('template_id',templates.map(t=>t.id)).eq('status','published').order('version',{ascending:false});
  if(versionError)throw versionError;
  const map=new Map<string,(typeof versions)[number]>();for(const row of versions||[])if(!map.has(row.template_id))map.set(row.template_id,row);
  return templates.map(template=>({...template,publishedVersion:map.get(template.id) as HseFormTemplate['publishedVersion']||null})) as HseFormTemplate[];
}

export async function createFormTemplate(workspace:HseWorkspace,input:{name:string;category:string;description?:string;schema:HseFormSchema}){
  const validation=validateFormSchema(input.schema);if(!validation.ok)throw new Error(validation.errors.join('\n'));
  const supabase=getBrowserSupabase();const {data:userData}=await supabase.auth.getUser();if(!userData.user)throw new Error('Sesión vencida');
  const {data:template,error}=await supabase.from('form_templates').insert({organization_id:workspace.organizationId,name:input.name.trim(),category:input.category.trim()||'checklist',description:input.description?.trim()||null,status:'draft',created_by:userData.user.id}).select('id').single();if(error)throw error;
  const {data:version,error:versionError}=await supabase.from('form_template_versions').insert({organization_id:workspace.organizationId,template_id:template.id,version:1,schema_json:input.schema,status:'draft',created_by:userData.user.id}).select('id').single();if(versionError)throw versionError;
  return {templateId:template.id,versionId:version.id};
}

export async function createDraftVersion(workspace:HseWorkspace,templateId:string,schema:HseFormSchema){
  const validation=validateFormSchema(schema);if(!validation.ok)throw new Error(validation.errors.join('\n'));
  const supabase=getBrowserSupabase();const {data:userData}=await supabase.auth.getUser();if(!userData.user)throw new Error('Sesión vencida');
  const {data:last}=await supabase.from('form_template_versions').select('version').eq('template_id',templateId).order('version',{ascending:false}).limit(1).maybeSingle();
  const {data,error}=await supabase.from('form_template_versions').insert({organization_id:workspace.organizationId,template_id:templateId,version:(last?.version||0)+1,schema_json:schema,status:'draft',created_by:userData.user.id}).select('id,version').single();if(error)throw error;return data;
}

export async function publishFormVersion(versionId:string){const {error}=await getBrowserSupabase().rpc('publish_form_version',{p_version_id:versionId});if(error)throw error;}

export async function listFormRuns(workspace:HseWorkspace,templateId?:string):Promise<HseFormRunRow[]>{let q=getBrowserSupabase().from('form_runs').select('id,status,started_at,submitted_at,template_id,template_version_id,site_id').eq('organization_id',workspace.organizationId).order('started_at',{ascending:false}).limit(100);if(templateId)q=q.eq('template_id',templateId);const {data,error}=await q;if(error)throw error;return(data||[]) as HseFormRunRow[];}


/** User-triggered import of standard inspection templates, not demo records. */
export async function installStandardInspectionTemplates(workspace: HseWorkspace): Promise<number> {
  const { data, error } = await getBrowserSupabase().rpc('seed_hse_inspection_templates', {
    p_organization_id: workspace.organizationId,
  });
  if (error) throw error;
  return typeof data === 'number' && Number.isFinite(data) ? data : 0;
}


export type HseInspectionBundle = {
  run: {
    id: string; organization_id: string; site_id: string | null;
    template_id: string; template_version_id: string;
    status: 'draft' | 'in_progress' | 'submitted' | 'reviewed' | 'cancelled';
    started_at: string; submitted_at: string | null;
  };
  template: { id: string; name: string; category: string };
  version: { id: string; version: number; schema_json: HseFormSchema };
  answers: Record<string, unknown>;
};

/** The same invoker RPC used by the native app enforces membership and published versions. */
export async function startHseInspection(workspace: HseWorkspace, template: HseFormTemplate): Promise<string> {
  if (template.organization_id !== workspace.organizationId || template.category !== 'inspection' ||
      template.status !== 'active' || !template.publishedVersion?.id) {
    throw new Error('La plantilla no está activa o no pertenece a este espacio.');
  }
  const clientId = crypto.randomUUID();
  const { data, error } = await getBrowserSupabase().rpc('create_form_run', {
    p_template_version_id: template.publishedVersion.id,
    p_site_id: workspace.siteId,
    p_client_run_id: clientId,
  });
  if (error) throw error;
  if (typeof data !== 'string') throw new Error('No se pudo iniciar la inspección.');
  return data;
}

/** RLS + explicit tenant/site/template checks avoid opening a different company's run. */
export async function getHseInspection(workspace: HseWorkspace, runId: string): Promise<HseInspectionBundle> {
  const supabase = getBrowserSupabase();
  const { data: run, error: runError } = await supabase.from('form_runs')
    .select('id,organization_id,site_id,template_id,template_version_id,status,started_at,submitted_at')
    .eq('id', runId).eq('organization_id', workspace.organizationId).single();
  if (runError) throw runError;
  if (workspace.siteId && run.site_id !== workspace.siteId) throw new Error('La inspección no pertenece al sitio activo.');

  const [{ data: template, error: templateError }, { data: version, error: versionError },
    { data: rows, error: answerError }] = await Promise.all([
    supabase.from('form_templates').select('id,name,category').eq('id', run.template_id)
      .eq('organization_id', workspace.organizationId).single(),
    supabase.from('form_template_versions').select('id,version,schema_json')
      .eq('id', run.template_version_id).eq('organization_id', workspace.organizationId).single(),
    supabase.from('form_answers').select('field_id,value_json')
      .eq('form_run_id', runId).eq('organization_id', workspace.organizationId),
  ]);
  if (templateError || versionError || answerError) throw templateError || versionError || answerError;
  if (template.category !== 'inspection') throw new Error('El registro no corresponde a una inspección.');
  const schema = version.schema_json as HseFormSchema;
  const validated = validateFormSchema(schema);
  if (!validated.ok) throw new Error('La plantilla publicada contiene campos inválidos.');
  const answers: Record<string, unknown> = {};
  for (const row of rows || []) answers[row.field_id] = row.value_json;
  return { run, template, version: { ...version, schema_json: schema }, answers } as HseInspectionBundle;
}

function assertEditable(bundle: HseInspectionBundle, workspace: HseWorkspace) {
  if (bundle.run.organization_id !== workspace.organizationId ||
      (workspace.siteId && bundle.run.site_id !== workspace.siteId) ||
      !['draft', 'in_progress'].includes(bundle.run.status)) {
    throw new Error('La inspección está cerrada o pertenece a otro espacio.');
  }
}

export async function saveHseInspectionDraft(
  workspace: HseWorkspace, bundle: HseInspectionBundle, answers: Record<string, unknown>,
): Promise<void> {
  assertEditable(bundle, workspace);
  const supabase = getBrowserSupabase();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError || new Error('Sesión requerida');
  const allowed = new Set(bundle.version.schema_json.sections.flatMap(s => s.fields.map(f => f.id)));
  const entries = Object.entries(answers).filter(([id, value]) => allowed.has(id) && value !== undefined);
  if (!entries.length) return;
  const rows = entries.map(([field_id, value_json]) => ({
    organization_id: workspace.organizationId,
    form_run_id: bundle.run.id,
    field_id,
    value_json,
    answered_by: auth.user.id,
  }));
  const { error } = await supabase.from('form_answers').upsert(rows, { onConflict: 'form_run_id,field_id' });
  if (error) throw error;
}

export async function submitHseInspection(
  workspace: HseWorkspace, bundle: HseInspectionBundle, answers: Record<string, unknown>,
): Promise<void> {
  assertEditable(bundle, workspace);
  const { evaluateRequiredFields } = await import('@/shared/hse/forms/validation.mjs');
  const missing = evaluateRequiredFields(bundle.version.schema_json, answers);
  if (missing.length) throw new Error('Completá los campos obligatorios: ' + missing.join(', '));
  await saveHseInspectionDraft(workspace, bundle, answers);
  const { data, error } = await getBrowserSupabase().from('form_runs')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', bundle.run.id).eq('organization_id', workspace.organizationId)
    .in('status', ['draft', 'in_progress']).select('id');
  if (error) throw error;
  if (!data?.length) throw new Error('La inspección cambió de estado. Actualizá antes de continuar.');
}

/** Private evidence: only a scoped storage reference goes into form_answers. */
export async function uploadHseInspectionPhoto(
  workspace: HseWorkspace, runId: string, fieldId: string, file: File,
): Promise<string> {
  const types: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const ext = types[file.type];
  if (!ext || file.size > 6 * 1024 * 1024 || file.size === 0) {
    throw new Error('Seleccioná una imagen JPG, PNG o WebP de hasta 6 MB.');
  }
  const field = fieldId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${workspace.organizationId}/form-runs/${runId}/inspection-${field}-${crypto.randomUUID()}.${ext}`;
  const { error } = await getBrowserSupabase().storage.from('hse-evidence')
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return 'hse-evidence:' + path;
}

export async function signedHseInspectionPhoto(value: string, workspace: HseWorkspace, runId: string) {
  const prefix = 'hse-evidence:' + workspace.organizationId + '/form-runs/' + runId + '/';
  if (!value.startsWith(prefix) || value.includes('..') || value.includes('://')) {
    throw new Error('La referencia fotográfica no pertenece a esta inspección.');
  }
  const { data, error } = await getBrowserSupabase().storage.from('hse-evidence')
    .createSignedUrl(value.slice('hse-evidence:'.length), 900);
  if (error || !data?.signedUrl) throw error || new Error('No se pudo obtener la fotografía.');
  return data.signedUrl;
}
