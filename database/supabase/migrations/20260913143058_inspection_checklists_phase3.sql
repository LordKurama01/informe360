-- Phase 3: inspection/checklist specialization over the dynamic form engine.
create table public.form_run_findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  form_run_id uuid not null references public.form_runs(id) on delete cascade,
  field_id text not null,
  finding_id uuid not null references public.findings(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(form_run_id, field_id)
);
create index idx_form_run_findings_run on public.form_run_findings(form_run_id);
create index idx_form_run_findings_finding on public.form_run_findings(finding_id);
alter table public.form_run_findings enable row level security;
create policy form_run_findings_select on public.form_run_findings for select to authenticated using (private.is_org_member(organization_id));
create policy form_run_findings_insert on public.form_run_findings for insert to authenticated with check (private.is_org_member(organization_id) and created_by=(select auth.uid()));
create policy form_run_findings_delete on public.form_run_findings for delete to authenticated using (private.is_org_admin(organization_id));
grant select,insert,delete on public.form_run_findings to authenticated;
grant all on public.form_run_findings to service_role;

create or replace function public.create_finding_from_form_answer(
  p_run_id uuid,
  p_field_id text,
  p_title text,
  p_description text default null,
  p_severity text default 'medium',
  p_priority text default null,
  p_responsible_text text default null,
  p_due_at timestamptz default null
) returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare v_run public.form_runs%rowtype; v_version public.form_template_versions%rowtype; v_answer jsonb; v_field jsonb; v_section jsonb; v_found boolean:=false; v_finding_id uuid; v_priority text;
begin
  select * into v_run from public.form_runs where id=p_run_id;
  if not found then raise exception 'form run not found'; end if;
  if not private.is_org_member(v_run.organization_id) then raise exception 'not authorized'; end if;
  select * into v_version from public.form_template_versions where id=v_run.template_version_id;
  select value_json into v_answer from public.form_answers where form_run_id=p_run_id and field_id=p_field_id;
  if v_answer is null or trim(both '"' from v_answer::text) <> 'non_compliant' then raise exception 'field is not a recorded non-compliance'; end if;
  for v_section in select value from jsonb_array_elements(v_version.schema_json->'sections') loop
    for v_field in select value from jsonb_array_elements(v_section->'fields') loop
      if v_field->>'id'=p_field_id and v_field->>'type'='compliance' and coalesce((v_field->>'createFindingOnFail')::boolean,false)=true then v_found:=true; exit; end if;
    end loop;
    if v_found then exit; end if;
  end loop;
  if not v_found then raise exception 'field is not configured to create findings'; end if;
  if p_severity not in ('low','medium','high','critical') then raise exception 'invalid severity'; end if;
  v_priority:=coalesce(p_priority,case when p_severity='critical' then 'urgent' when p_severity='high' then 'high' else 'medium' end);
  if v_priority not in ('low','medium','high','urgent') then raise exception 'invalid priority'; end if;
  select finding_id into v_finding_id from public.form_run_findings where form_run_id=p_run_id and field_id=p_field_id;
  if v_finding_id is not null then return v_finding_id; end if;
  insert into public.findings(organization_id,site_id,created_by,title,description,category,severity,priority,due_at,responsible_text)
  values(v_run.organization_id,v_run.site_id,(select auth.uid()),trim(p_title),p_description,'Inspección',p_severity,v_priority,p_due_at,p_responsible_text) returning id into v_finding_id;
  insert into public.form_run_findings(organization_id,form_run_id,field_id,finding_id,created_by) values(v_run.organization_id,p_run_id,p_field_id,v_finding_id,(select auth.uid()));
  return v_finding_id;
end; $$;
revoke all on function public.create_finding_from_form_answer(uuid,text,text,text,text,text,text,timestamptz) from public,anon;
grant execute on function public.create_finding_from_form_answer(uuid,text,text,text,text,text,text,timestamptz) to authenticated,service_role;

create or replace function public.seed_hse_inspection_templates(p_organization_id uuid) returns integer language plpgsql security definer set search_path = public, private, pg_temp as $$
declare uid uuid:=(select auth.uid()); created_count integer:=0; t_id uuid;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if not private.is_org_admin(p_organization_id) then raise exception 'admin required'; end if;
  if not exists(select 1 from public.form_templates where organization_id=p_organization_id and name='Trabajo en altura' and category='inspection') then
    insert into public.form_templates(organization_id,name,category,description,status,created_by) values(p_organization_id,'Trabajo en altura','inspection','Checklist operativo. Validar criterios contra el procedimiento vigente de la empresa.','active',uid) returning id into t_id;
    insert into public.form_template_versions(organization_id,template_id,version,schema_json,status,published_at,created_by) values(p_organization_id,t_id,1,'{"version":1,"title":"Trabajo en altura","description":"Verificación previa y en campo. No reemplaza el procedimiento vigente.","category":"inspection","sections":[{"id":"altura","title":"Sistema y EPP","fields":[{"id":"arnes_integridad","type":"compliance","label":"Arnés, cintas y costuras en condición visual aceptable","required":true,"createFindingOnFail":true},{"id":"conectores","type":"compliance","label":"Conectores y trabas verificados","required":true,"createFindingOnFail":true},{"id":"anclaje","type":"compliance","label":"Punto/sistema de anclaje verificado según procedimiento aplicable","required":true,"createFindingOnFail":true},{"id":"rescate","type":"compliance","label":"Medios y plan de rescate disponibles según tarea","required":true,"createFindingOnFail":true},{"id":"observaciones","type":"text","label":"Observaciones","multiline":true},{"id":"evidencia","type":"photo","label":"Evidencia fotográfica"}]}]}'::jsonb,'published',now(),uid); created_count:=created_count+1;
  end if;
  if not exists(select 1 from public.form_templates where organization_id=p_organization_id and name='Espacio confinado' and category='inspection') then
    insert into public.form_templates(organization_id,name,category,description,status,created_by) values(p_organization_id,'Espacio confinado','inspection','Verificación previa al ingreso y durante la tarea.','active',uid) returning id into t_id;
    insert into public.form_template_versions(organization_id,template_id,version,schema_json,status,published_at,created_by) values(p_organization_id,t_id,1,'{"version":1,"title":"Espacio confinado","description":"Validar siempre contra el procedimiento y permiso aplicable.","category":"inspection","sections":[{"id":"ec","title":"Condiciones de ingreso","fields":[{"id":"autorizacion","type":"compliance","label":"Permiso/autorización requerida verificada","required":true,"createFindingOnFail":true},{"id":"aislamiento","type":"compliance","label":"Aislamiento de energías verificado","required":true,"createFindingOnFail":true},{"id":"atmosfera","type":"compliance","label":"Monitoreo de atmósfera realizado según procedimiento","required":true,"createFindingOnFail":true},{"id":"vigia","type":"compliance","label":"Vigía/rol de control asignado cuando corresponde","required":true,"createFindingOnFail":true},{"id":"plan_rescate","type":"compliance","label":"Plan y medios de rescate verificados","required":true,"createFindingOnFail":true},{"id":"observaciones","type":"text","label":"Observaciones","multiline":true},{"id":"evidencia","type":"photo","label":"Evidencia fotográfica"}]}]}'::jsonb,'published',now(),uid); created_count:=created_count+1;
  end if;
  if not exists(select 1 from public.form_templates where organization_id=p_organization_id and name='Matafuegos / extintores' and category='inspection') then
    insert into public.form_templates(organization_id,name,category,description,status,created_by) values(p_organization_id,'Matafuegos / extintores','inspection','Inspección visual y documental sin inferir periodicidades normativas.','active',uid) returning id into t_id;
    insert into public.form_template_versions(organization_id,template_id,version,schema_json,status,published_at,created_by) values(p_organization_id,t_id,1,'{"version":1,"title":"Matafuegos / extintores","description":"Registrar condición observada. Los vencimientos se resuelven desde reglas/documentación validada.","category":"inspection","sections":[{"id":"ext","title":"Estado del equipo","fields":[{"id":"acceso","type":"compliance","label":"Acceso al equipo libre y visible","required":true,"createFindingOnFail":true},{"id":"identificacion","type":"compliance","label":"Identificación y registro legibles","required":true,"createFindingOnFail":true},{"id":"estado","type":"compliance","label":"Estado físico visual sin daños evidentes","required":true,"createFindingOnFail":true},{"id":"registro","type":"compliance","label":"Registro/control disponible para verificar","required":true,"createFindingOnFail":true},{"id":"observaciones","type":"text","label":"Observaciones","multiline":true},{"id":"evidencia","type":"photo","label":"Foto del equipo"}]}]}'::jsonb,'published',now(),uid); created_count:=created_count+1;
  end if;
  if not exists(select 1 from public.form_templates where organization_id=p_organization_id and name='Equipo de rescate / Pirosalva' and category='inspection') then
    insert into public.form_templates(organization_id,name,category,description,status,created_by) values(p_organization_id,'Equipo de rescate / Pirosalva','inspection','Checklist visual/documental para disponibilidad del equipo.','active',uid) returning id into t_id;
    insert into public.form_template_versions(organization_id,template_id,version,schema_json,status,published_at,created_by) values(p_organization_id,t_id,1,'{"version":1,"title":"Equipo de rescate / Pirosalva","description":"No establece por sí mismo frecuencias de certificación.","category":"inspection","sections":[{"id":"rescate","title":"Disponibilidad y condición","fields":[{"id":"identificacion","type":"compliance","label":"Identificación del equipo legible","required":true,"createFindingOnFail":true},{"id":"integridad","type":"compliance","label":"Integridad visual verificada","required":true,"createFindingOnFail":true},{"id":"acceso","type":"compliance","label":"Ubicación y acceso adecuados para la tarea","required":true,"createFindingOnFail":true},{"id":"documentacion","type":"compliance","label":"Documentación/certificado disponible cuando el procedimiento lo exige","required":true,"createFindingOnFail":true},{"id":"observaciones","type":"text","label":"Observaciones","multiline":true},{"id":"evidencia","type":"photo","label":"Evidencia fotográfica"}]}]}'::jsonb,'published',now(),uid); created_count:=created_count+1;
  end if;
  return created_count;
end; $$;
revoke all on function public.seed_hse_inspection_templates(uuid) from public,anon;
grant execute on function public.seed_hse_inspection_templates(uuid) to authenticated,service_role;
