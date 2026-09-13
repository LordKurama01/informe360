import { supabase } from '../lib/supabase';
import type { Workspace } from './workspace';
import { listActiveFormTemplates } from './forms';

export type InspectionRunSummary={id:string;status:string;started_at:string;submitted_at:string|null;template_id:string;templateName:string};

export async function seedInspectionTemplates(workspace:Workspace){const {data,error}=await supabase.rpc('seed_hse_inspection_templates',{p_organization_id:workspace.organizationId});if(error)throw error;return Number(data||0);}
export async function listInspectionTemplates(workspace:Workspace){return listActiveFormTemplates(workspace,'inspection');}
export async function listRecentInspectionRuns(workspace:Workspace):Promise<InspectionRunSummary[]>{
  const templates=await listInspectionTemplates(workspace);if(!templates.length)return[];const names=new Map(templates.map(item=>[item.id,item.name]));
  let q=supabase.from('form_runs').select('id,status,started_at,submitted_at,template_id').eq('organization_id',workspace.organizationId).in('template_id',templates.map(item=>item.id)).order('started_at',{ascending:false}).limit(30);if(workspace.siteId)q=q.eq('site_id',workspace.siteId);
  const {data,error}=await q;if(error)throw error;return(data||[]).map(row=>({...row,templateName:names.get(row.template_id)||'Inspección'}));
}
export async function createFindingFromNonCompliance(runId:string,fieldId:string,label:string){
  const {data,error}=await supabase.rpc('create_finding_from_form_answer',{p_run_id:runId,p_field_id:fieldId,p_title:`No conformidad: ${label}`,p_description:`Ítem marcado como No cumple durante una inspección. Campo: ${label}.`,p_severity:'medium',p_priority:'medium',p_responsible_text:null,p_due_at:null});
  if(error)throw error;return data as string;
}
export async function linkedFindingsForRun(runId:string){const {data,error}=await supabase.from('form_run_findings').select('field_id,finding_id').eq('form_run_id',runId);if(error)throw error;return data||[];}
