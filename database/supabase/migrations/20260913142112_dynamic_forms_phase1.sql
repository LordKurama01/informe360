-- Dynamic HSE forms: versioned templates, immutable published versions, runs and answers.
create table public.form_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null default 'checklist',
  description text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.form_template_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid not null references public.form_templates(id) on delete cascade,
  version integer not null check (version > 0),
  schema_json jsonb not null,
  status text not null default 'draft' check (status in ('draft','published','retired')),
  published_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, version)
);
create table public.form_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  template_id uuid not null references public.form_templates(id) on delete restrict,
  template_version_id uuid not null references public.form_template_versions(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','in_progress','submitted','reviewed','cancelled')),
  client_run_id uuid,
  started_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, client_run_id)
);
create table public.form_answers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  form_run_id uuid not null references public.form_runs(id) on delete cascade,
  field_id text not null,
  value_json jsonb,
  answered_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(form_run_id, field_id)
);
create index idx_form_templates_org_category on public.form_templates(organization_id, category, status);
create index idx_form_versions_template_status on public.form_template_versions(template_id, status, version desc);
create index idx_form_runs_org_status_started on public.form_runs(organization_id, status, started_at desc);
create index idx_form_runs_site_started on public.form_runs(site_id, started_at desc) where site_id is not null;
create index idx_form_answers_run on public.form_answers(form_run_id);
create trigger form_templates_updated_at before update on public.form_templates for each row execute function private.set_updated_at();
create trigger form_template_versions_updated_at before update on public.form_template_versions for each row execute function private.set_updated_at();
create trigger form_runs_updated_at before update on public.form_runs for each row execute function private.set_updated_at();
create trigger form_answers_updated_at before update on public.form_answers for each row execute function private.set_updated_at();
create or replace function private.prevent_published_form_version_mutation() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if old.status = 'published' and (new.schema_json is distinct from old.schema_json or new.template_id is distinct from old.template_id or new.version is distinct from old.version) then raise exception 'published form versions are immutable'; end if;
  return new;
end; $$;
revoke all on function private.prevent_published_form_version_mutation() from public;
create trigger protect_published_form_version before update on public.form_template_versions for each row execute function private.prevent_published_form_version_mutation();
alter table public.form_templates enable row level security;
alter table public.form_template_versions enable row level security;
alter table public.form_runs enable row level security;
alter table public.form_answers enable row level security;
create policy form_templates_select on public.form_templates for select to authenticated using (private.is_org_member(organization_id));
create policy form_templates_insert on public.form_templates for insert to authenticated with check (private.is_org_admin(organization_id) and created_by=(select auth.uid()));
create policy form_templates_update on public.form_templates for update to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy form_templates_delete on public.form_templates for delete to authenticated using (private.is_org_admin(organization_id));
create policy form_versions_select on public.form_template_versions for select to authenticated using (private.is_org_member(organization_id));
create policy form_versions_insert on public.form_template_versions for insert to authenticated with check (private.is_org_admin(organization_id) and created_by=(select auth.uid()) and exists (select 1 from public.form_templates t where t.id=template_id and t.organization_id=organization_id));
create policy form_versions_update on public.form_template_versions for update to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy form_versions_delete on public.form_template_versions for delete to authenticated using (private.is_org_admin(organization_id) and status <> 'published');
create policy form_runs_select on public.form_runs for select to authenticated using (private.is_org_member(organization_id));
create policy form_runs_insert on public.form_runs for insert to authenticated with check (private.is_org_member(organization_id) and started_by=(select auth.uid()));
create policy form_runs_update on public.form_runs for update to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy form_runs_delete on public.form_runs for delete to authenticated using (private.is_org_admin(organization_id) and status in ('draft','cancelled'));
create policy form_answers_select on public.form_answers for select to authenticated using (private.is_org_member(organization_id));
create policy form_answers_insert on public.form_answers for insert to authenticated with check (private.is_org_member(organization_id) and answered_by=(select auth.uid()) and exists (select 1 from public.form_runs r where r.id=form_run_id and r.organization_id=organization_id));
create policy form_answers_update on public.form_answers for update to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy form_answers_delete on public.form_answers for delete to authenticated using (private.is_org_member(organization_id));
grant select, insert, update, delete on public.form_templates to authenticated;
grant select, insert, update, delete on public.form_template_versions to authenticated;
grant select, insert, update, delete on public.form_runs to authenticated;
grant select, insert, update, delete on public.form_answers to authenticated;
grant all on public.form_templates, public.form_template_versions, public.form_runs, public.form_answers to service_role;
create or replace function public.create_form_run(p_template_version_id uuid, p_site_id uuid default null, p_client_run_id uuid default null) returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare v_version public.form_template_versions%rowtype; v_existing uuid; v_run_id uuid;
begin
  select * into v_version from public.form_template_versions where id=p_template_version_id and status='published';
  if not found then raise exception 'published template version not found'; end if;
  if not private.is_org_member(v_version.organization_id) then raise exception 'not authorized'; end if;
  if p_site_id is not null and not exists (select 1 from public.sites s where s.id=p_site_id and s.organization_id=v_version.organization_id) then raise exception 'site does not belong to organization'; end if;
  if p_client_run_id is not null then select id into v_existing from public.form_runs where organization_id=v_version.organization_id and client_run_id=p_client_run_id; if v_existing is not null then return v_existing; end if; end if;
  insert into public.form_runs(organization_id,site_id,template_id,template_version_id,status,client_run_id,started_by) values(v_version.organization_id,p_site_id,v_version.template_id,v_version.id,'in_progress',p_client_run_id,(select auth.uid())) returning id into v_run_id;
  return v_run_id;
end; $$;
revoke all on function public.create_form_run(uuid,uuid,uuid) from public;
grant execute on function public.create_form_run(uuid,uuid,uuid) to authenticated, service_role;
create or replace function public.publish_form_version(p_version_id uuid) returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare v_row public.form_template_versions%rowtype;
begin
  select * into v_row from public.form_template_versions where id=p_version_id for update;
  if not found then raise exception 'version not found'; end if;
  if not private.is_org_admin(v_row.organization_id) then raise exception 'not authorized'; end if;
  if v_row.status='published' then return; end if;
  update public.form_template_versions set status='retired' where template_id=v_row.template_id and status='published';
  update public.form_template_versions set status='published', published_at=now() where id=p_version_id;
  update public.form_templates set status='active' where id=v_row.template_id;
end; $$;
revoke all on function public.publish_form_version(uuid) from public;
grant execute on function public.publish_form_version(uuid) to authenticated, service_role;
