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
