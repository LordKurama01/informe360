alter table public.findings
  add column if not exists location_text text,
  add column if not exists element_text text,
  add column if not exists closure_comment text,
  add column if not exists version integer not null default 1 check (version > 0);

create or replace function private.bump_finding_version()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.version = old.version + 1;
  return new;
end;
$$;
revoke all on function private.bump_finding_version() from public;
drop trigger if exists findings_bump_version on public.findings;
create trigger findings_bump_version before update on public.findings for each row execute function private.bump_finding_version();

create table if not exists public.finding_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  finding_id uuid not null references public.findings(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('created','updated','status_changed')),
  from_status text,
  to_status text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_finding_events_finding_created on public.finding_events(finding_id, created_at desc);
create index if not exists idx_finding_events_org_created on public.finding_events(organization_id, created_at desc);

create or replace function private.log_finding_event()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into public.finding_events(organization_id, finding_id, actor_id, event_type, to_status)
    values (new.organization_id, new.id, (select auth.uid()), 'created', new.status);
    return new;
  end if;
  if new.status is distinct from old.status then
    insert into public.finding_events(organization_id, finding_id, actor_id, event_type, from_status, to_status, note)
    values (new.organization_id, new.id, (select auth.uid()), 'status_changed', old.status, new.status, new.closure_comment);
  elsif row(new.title, new.description, new.category, new.severity, new.location_text, new.element_text, new.responsible_user_id, new.responsible_text, new.due_at)
        is distinct from
        row(old.title, old.description, old.category, old.severity, old.location_text, old.element_text, old.responsible_user_id, old.responsible_text, old.due_at) then
    insert into public.finding_events(organization_id, finding_id, actor_id, event_type, to_status)
    values (new.organization_id, new.id, (select auth.uid()), 'updated', new.status);
  end if;
  return new;
end;
$$;
revoke all on function private.log_finding_event() from public;
drop trigger if exists findings_audit_event on public.findings;
create trigger findings_audit_event after insert or update on public.findings for each row execute function private.log_finding_event();

alter table public.finding_events enable row level security;
drop policy if exists finding_events_select on public.finding_events;
create policy finding_events_select on public.finding_events for select to authenticated using (private.is_org_member(organization_id));
revoke all on public.finding_events from anon, authenticated;
grant select on public.finding_events to authenticated;
grant all on public.finding_events to service_role;

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios','android')),
  device_name text,
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_device_push_tokens_user_active on public.device_push_tokens(user_id, active);
create index if not exists idx_device_push_tokens_org_active on public.device_push_tokens(organization_id, active);
drop trigger if exists device_push_tokens_updated_at on public.device_push_tokens;
create trigger device_push_tokens_updated_at before update on public.device_push_tokens for each row execute function private.set_updated_at();
alter table public.device_push_tokens enable row level security;
create policy device_push_tokens_select_own on public.device_push_tokens for select to authenticated using (user_id=(select auth.uid()) and private.is_org_member(organization_id));
create policy device_push_tokens_insert_own on public.device_push_tokens for insert to authenticated with check (user_id=(select auth.uid()) and private.is_org_member(organization_id));
create policy device_push_tokens_update_own on public.device_push_tokens for update to authenticated using (user_id=(select auth.uid()) and private.is_org_member(organization_id)) with check (user_id=(select auth.uid()) and private.is_org_member(organization_id));
create policy device_push_tokens_delete_own on public.device_push_tokens for delete to authenticated using (user_id=(select auth.uid()));
revoke all on public.device_push_tokens from anon;
grant select,insert,update,delete on public.device_push_tokens to authenticated;
grant all on public.device_push_tokens to service_role;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('hse-captures','hse-captures',false,26214400,array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/webm'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy hse_captures_select on storage.objects for select to authenticated using (bucket_id='hse-captures' and private.is_org_member(nullif((storage.foldername(name))[1],'')::uuid));
create policy hse_captures_insert on storage.objects for insert to authenticated with check (bucket_id='hse-captures' and private.is_org_member(nullif((storage.foldername(name))[1],'')::uuid));
create policy hse_captures_update on storage.objects for update to authenticated using (bucket_id='hse-captures' and private.is_org_member(nullif((storage.foldername(name))[1],'')::uuid)) with check (bucket_id='hse-captures' and private.is_org_member(nullif((storage.foldername(name))[1],'')::uuid));
create policy hse_captures_delete on storage.objects for delete to authenticated using (bucket_id='hse-captures' and private.is_org_member(nullif((storage.foldername(name))[1],'')::uuid));
