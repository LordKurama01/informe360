alter table public.findings
  add column if not exists code text,
  add column if not exists priority text not null default 'medium' check (priority in ('low','medium','high','urgent'));

create sequence if not exists public.finding_code_seq;
grant usage, select on sequence public.finding_code_seq to authenticated, service_role;

create or replace function private.assign_finding_code()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.code is null or btrim(new.code) = '' then
    new.code := 'HSE-' || extract(year from coalesce(new.created_at, now()))::int::text || '-' || lpad(nextval('public.finding_code_seq')::text, 5, '0');
  end if;
  if new.priority is null then
    new.priority := case when new.severity='critical' then 'urgent' when new.severity='high' then 'high' else 'medium' end;
  end if;
  return new;
end;
$$;
revoke all on function private.assign_finding_code() from public;

drop trigger if exists findings_assign_code on public.findings;
create trigger findings_assign_code before insert on public.findings for each row execute function private.assign_finding_code();

update public.findings
set code = 'HSE-' || extract(year from created_at)::int::text || '-' || lpad(nextval('public.finding_code_seq')::text, 5, '0')
where code is null;

alter table public.findings alter column code set not null;
create unique index if not exists idx_findings_code on public.findings(code);
create index if not exists idx_findings_priority on public.findings(organization_id, priority, status);
create index if not exists idx_findings_search on public.findings using gin (
  to_tsvector('simple'::regconfig,
    coalesce(code,'') || ' ' || coalesce(title,'') || ' ' || coalesce(description,'') || ' ' ||
    coalesce(location_text,'') || ' ' || coalesce(element_text,'') || ' ' ||
    coalesce(responsible_text,'') || ' ' || coalesce(category,''))
);

alter table public.evidence_files
  add column if not exists phase text not null default 'supporting' check (phase in ('initial','supporting','closure'));
create index if not exists idx_evidence_finding_phase on public.evidence_files(finding_id, phase, created_at desc);

drop function if exists public.create_finding_bundle(uuid,text,text,text,text,text,text,text,timestamptz,text);
create function public.create_finding_bundle(
  p_field_entry_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_severity text default 'medium',
  p_location_text text default null,
  p_element_text text default null,
  p_responsible_text text default null,
  p_due_at timestamptz default null,
  p_action text default null,
  p_priority text default null
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  entry public.field_entries%rowtype;
  finding_id uuid;
  resolved_priority text;
begin
  select * into entry from public.field_entries where id = p_field_entry_id;
  if not found then raise exception 'field entry not found'; end if;
  if entry.created_by <> (select auth.uid()) then raise exception 'field entry is not owned by current user'; end if;
  if p_severity not in ('low','medium','high','critical') then raise exception 'invalid severity'; end if;
  resolved_priority := coalesce(p_priority, case when p_severity='critical' then 'urgent' when p_severity='high' then 'high' else 'medium' end);
  if resolved_priority not in ('low','medium','high','urgent') then raise exception 'invalid priority'; end if;

  insert into public.findings(
    organization_id, site_id, field_entry_id, created_by, title, description, category,
    severity, priority, due_at, responsible_text, location_text, element_text
  ) values (
    entry.organization_id, entry.site_id, entry.id, (select auth.uid()), trim(p_title), p_description, p_category,
    p_severity, resolved_priority, p_due_at, p_responsible_text, p_location_text, p_element_text
  ) returning id into finding_id;

  if nullif(trim(coalesce(p_action,'')), '') is not null then
    insert into public.smart_actions(organization_id, finding_id, created_by, action, responsible_text, due_at)
    values(entry.organization_id, finding_id, (select auth.uid()), trim(p_action), p_responsible_text, p_due_at);
  end if;

  if p_due_at is not null then
    insert into public.reminders(organization_id, finding_id, created_by, scheduled_for, channel)
    values(entry.organization_id, finding_id, (select auth.uid()), p_due_at, 'in_app');
  end if;

  update public.field_entries set processing_status='structured', processing_error=null where id=entry.id;
  return finding_id;
end;
$$;
revoke all on function public.create_finding_bundle(uuid,text,text,text,text,text,text,text,timestamptz,text,text) from public, anon;
grant execute on function public.create_finding_bundle(uuid,text,text,text,text,text,text,text,timestamptz,text,text) to authenticated, service_role;

create or replace function public.search_findings(
  p_organization_id uuid,
  p_query text,
  p_site_id uuid default null,
  p_include_closed boolean default true
) returns setof public.findings
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select f.*
  from public.findings f
  where f.organization_id = p_organization_id
    and (p_site_id is null or f.site_id = p_site_id)
    and (p_include_closed or f.status not in ('closed','cancelled'))
    and (
      nullif(btrim(p_query),'') is null
      or to_tsvector('simple'::regconfig,
        coalesce(f.code,'') || ' ' || coalesce(f.title,'') || ' ' || coalesce(f.description,'') || ' ' ||
        coalesce(f.location_text,'') || ' ' || coalesce(f.element_text,'') || ' ' ||
        coalesce(f.responsible_text,'') || ' ' || coalesce(f.category,''))
        @@ websearch_to_tsquery('simple'::regconfig, p_query)
      or f.code ilike '%' || p_query || '%'
      or f.title ilike '%' || p_query || '%'
    )
  order by f.created_at desc
  limit 200;
$$;
revoke all on function public.search_findings(uuid,text,uuid,boolean) from public, anon;
grant execute on function public.search_findings(uuid,text,uuid,boolean) to authenticated, service_role;

create or replace function public.hse_dashboard_summary(
  p_organization_id uuid,
  p_site_id uuid default null
) returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with scoped as (
    select * from public.findings f
    where f.organization_id = p_organization_id
      and (p_site_id is null or f.site_id = p_site_id)
  ), counts as (
    select
      count(*) filter (where status not in ('closed','cancelled')) as open_count,
      count(*) filter (where status not in ('closed','cancelled') and due_at < now()) as overdue_count,
      count(*) filter (where status not in ('closed','cancelled') and due_at >= now() and due_at <= now() + interval '7 days') as due_next_7_days,
      count(*) filter (where status='closed') as closed_count,
      count(*) filter (where status='closed' and due_at is not null and closed_at is not null and closed_at <= due_at) as closed_on_time,
      count(*) filter (where status not in ('closed','cancelled') and severity='critical') as critical_open
    from scoped
  )
  select jsonb_build_object(
    'open', open_count,
    'overdue', overdue_count,
    'dueNext7Days', due_next_7_days,
    'closed', closed_count,
    'closedOnTime', closed_on_time,
    'closureCompliancePct', case when closed_count=0 then 0 else round((closed_on_time::numeric / closed_count::numeric) * 100)::int end,
    'criticalOpen', critical_open
  ) from counts;
$$;
revoke all on function public.hse_dashboard_summary(uuid,uuid) from public, anon;
grant execute on function public.hse_dashboard_summary(uuid,uuid) to authenticated, service_role;

create or replace function public.create_report_from_findings(
  p_organization_id uuid,
  p_site_id uuid,
  p_title text,
  p_report_type text,
  p_finding_ids uuid[],
  p_generated_report jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  report_id uuid;
  uid uuid := (select auth.uid());
  selected_count integer;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if not private.is_org_member(p_organization_id) then raise exception 'organization access denied'; end if;

  select count(*) into selected_count
  from public.findings f
  where f.organization_id=p_organization_id
    and f.id = any(p_finding_ids)
    and (p_site_id is null or f.site_id=p_site_id);
  if selected_count <> cardinality(p_finding_ids) then raise exception 'one or more findings are not accessible'; end if;

  insert into public.reports(organization_id,site_id,created_by,title,report_type,generated_report,status,ai_provider)
  values(p_organization_id,p_site_id,uid,trim(p_title),p_report_type,coalesce(p_generated_report,'{}'::jsonb),'generated','hse-copilot')
  returning id into report_id;

  insert into public.report_findings(organization_id,report_id,finding_id)
  select p_organization_id, report_id, unnest(p_finding_ids);

  return report_id;
end;
$$;
revoke all on function public.create_report_from_findings(uuid,uuid,text,text,uuid[],jsonb) from public, anon;
grant execute on function public.create_report_from_findings(uuid,uuid,text,text,uuid[],jsonb) to authenticated, service_role;

create or replace function public.seed_hse_demo()
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  uid uuid := (select auth.uid());
  org_id uuid;
  site_id uuid;
  entry_id uuid;
  finding_ids uuid[] := '{}';
  fid uuid;
  report_id uuid;
  demo_slug text;
begin
  if uid is null then raise exception 'authentication required'; end if;
  demo_slug := 'hse-demo-' || substr(replace(uid::text,'-',''),1,12);

  select id into org_id from public.organizations where slug=demo_slug limit 1;
  if org_id is not null then
    select id into site_id from public.sites where organization_id=org_id order by created_at limit 1;
    return jsonb_build_object('organizationId',org_id,'siteId',site_id,'created',false);
  end if;

  insert into public.organizations(name,slug,created_by)
  values('Empresa Demo HSE',demo_slug,uid) returning id into org_id;

  insert into public.sites(organization_id,name,address,city,province,country_code,created_by)
  values(org_id,'Base Operativa Demo','Ruta de acceso 100','Junín','Buenos Aires','AR',uid) returning id into site_id;

  insert into public.field_entries(organization_id,site_id,created_by,input_type,raw_text,processing_status)
  values(org_id,site_id,uid,'text','Sala de bombas. Pérdida visible en manguera hidráulica. Mantenimiento debe revisarla.','raw') returning id into entry_id;
  fid := public.create_finding_bundle(entry_id,'Pérdida en manguera hidráulica','Se observa pérdida hidráulica visible en conexión flexible.','Equipos','high','Sala de bombas','Manguera hidráulica','Mantenimiento',now()-interval '1 day','Revisar conexión y reemplazar manguera si corresponde','high'); finding_ids := array_append(finding_ids,fid);

  insert into public.field_entries(organization_id,site_id,created_by,input_type,raw_text,processing_status)
  values(org_id,site_id,uid,'text','Dos matafuegos presentan identificación ilegible.','raw') returning id into entry_id;
  fid := public.create_finding_bundle(entry_id,'Identificación de matafuegos ilegible','Dos equipos requieren revisión de identificación y registro.','Protección contra incendios','medium','Taller','Matafuegos','Seguridad',now()+interval '1 day','Verificar identificación y condición documental','medium'); finding_ids := array_append(finding_ids,fid);

  insert into public.field_entries(organization_id,site_id,created_by,input_type,raw_text,processing_status)
  values(org_id,site_id,uid,'text','Falta delimitación temporal en zona de trabajo.','raw') returning id into entry_id;
  fid := public.create_finding_bundle(entry_id,'Falta delimitación temporal','La zona de intervención no posee delimitación suficiente.','Señalización','high','Playa operativa','Área de trabajo','Operaciones',now()+interval '2 days','Instalar delimitación y señalización temporal','high'); finding_ids := array_append(finding_ids,fid);

  insert into public.field_entries(organization_id,site_id,created_by,input_type,raw_text,processing_status)
  values(org_id,site_id,uid,'text','Arnés con etiqueta de identificación deteriorada.','raw') returning id into entry_id;
  fid := public.create_finding_bundle(entry_id,'Arnés con identificación deteriorada','La etiqueta no permite una identificación confiable del equipo.','Trabajo en altura','critical','Depósito EPP','Arnés de seguridad','HSE',now()-interval '2 days','Retirar de servicio y verificar trazabilidad','urgent'); finding_ids := array_append(finding_ids,fid);

  insert into public.field_entries(organization_id,site_id,created_by,input_type,raw_text,processing_status)
  values(org_id,site_id,uid,'text','Materiales fuera de ubicación generando desorden.','raw') returning id into entry_id;
  fid := public.create_finding_bundle(entry_id,'Orden y limpieza mejorable','Materiales fuera de sector asignado.','Housekeeping','low','Depósito','Materiales varios','Logística',now()+interval '5 days','Ordenar materiales y liberar circulación','low'); finding_ids := array_append(finding_ids,fid);

  insert into public.field_entries(organization_id,site_id,created_by,input_type,raw_text,processing_status)
  values(org_id,site_id,uid,'text','Salida de emergencia parcialmente obstruida.','raw') returning id into entry_id;
  fid := public.create_finding_bundle(entry_id,'Salida de emergencia obstruida','Material almacenado reduce el paso útil de salida.','Emergencias','high','Galpón principal','Salida de emergencia','Operaciones',now()-interval '1 day','Retirar material y mantener acceso libre','high');
  update public.findings set status='closed',closed_at=now()-interval '12 hours',closed_by=uid,closure_comment='Se retiró el material y se verificó el paso libre.' where id=fid;
  update public.smart_actions set status='completed',completed_at=now()-interval '12 hours' where finding_id=fid;
  update public.reminders set status='cancelled' where finding_id=fid and status='pending';
  finding_ids := array_append(finding_ids,fid);

  insert into public.field_entries(organization_id,site_id,created_by,input_type,raw_text,processing_status)
  values(org_id,site_id,uid,'text','Señal de advertencia caída en acceso secundario.','raw') returning id into entry_id;
  fid := public.create_finding_bundle(entry_id,'Señalización caída','Cartel de advertencia fuera de posición.','Señalización','low','Acceso secundario','Cartel de advertencia','Mantenimiento',now()+interval '2 days','Reponer y fijar señalización','low');
  update public.findings set status='closed',closed_at=now(),closed_by=uid,closure_comment='Cartel repuesto y fijado correctamente.' where id=fid;
  update public.smart_actions set status='completed',completed_at=now() where finding_id=fid;
  update public.reminders set status='cancelled' where finding_id=fid and status='pending';
  finding_ids := array_append(finding_ids,fid);

  insert into public.field_entries(organization_id,site_id,created_by,input_type,raw_text,processing_status)
  values(org_id,site_id,uid,'text','Cableado provisorio sin protección mecánica suficiente.','raw') returning id into entry_id;
  fid := public.create_finding_bundle(entry_id,'Cableado provisorio expuesto','Tendido provisorio con exposición a tránsito y daño mecánico.','Electricidad','medium','Sector mantenimiento','Cableado provisorio','Mantenimiento eléctrico',now()+interval '3 days','Proteger o reubicar el tendido provisorio','medium');
  update public.findings set status='in_progress' where id=fid;
  update public.smart_actions set status='in_progress' where finding_id=fid;
  finding_ids := array_append(finding_ids,fid);

  report_id := public.create_report_from_findings(
    org_id,site_id,'Recorrido HSE · Base Operativa Demo','Cacería técnica / recorrido de hallazgos',finding_ids[1:4],
    jsonb_build_object(
      'executiveSummary','Recorrido HSE con cuatro hallazgos priorizados y acciones asignadas.',
      'status','demo-ready',
      'findingCount',4,
      'generatedBy','Informe360 HSE Copilot'
    )
  );

  return jsonb_build_object('organizationId',org_id,'siteId',site_id,'reportId',report_id,'created',true,'findingCount',cardinality(finding_ids));
end;
$$;
revoke all on function public.seed_hse_demo() from public, anon;
grant execute on function public.seed_hse_demo() to authenticated, service_role;
