-- Informe360 fresh start — Supabase project wvjmsltqrztlvgmayicr
-- Applied to the new Informe360 project on 2026-09-12.
-- This replaces the legacy monolithic schema that belonged to an inaccessible backend.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  city text,
  province text,
  country_code text not null default 'AR',
  latitude numeric,
  longitude numeric,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.field_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  input_type text not null check (input_type in ('text','audio','photo','mixed')),
  raw_text text,
  audio_storage_path text,
  photo_storage_paths text[] not null default '{}',
  captured_at timestamptz not null default now(),
  processing_status text not null default 'raw' check (processing_status in ('raw','processing','structured','failed')),
  processing_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  field_entry_id uuid references public.field_entries(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  description text,
  category text,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','in_progress','closed','cancelled')),
  due_at timestamptz,
  responsible_user_id uuid references auth.users(id) on delete set null,
  responsible_text text,
  ai_confidence numeric check (ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)),
  closed_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.smart_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  finding_id uuid references public.findings(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  action text not null,
  description text,
  responsible_user_id uuid references auth.users(id) on delete set null,
  responsible_text text,
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  finding_id uuid references public.findings(id) on delete cascade,
  action_id uuid references public.smart_actions(id) on delete cascade,
  storage_bucket text not null default 'hse-evidence',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  sha256_hex text,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (finding_id is not null or action_id is not null),
  unique (storage_bucket, storage_path)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  finding_id uuid references public.findings(id) on delete cascade,
  action_id uuid references public.smart_actions(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  scheduled_for timestamptz not null,
  channel text not null default 'push' check (channel in ('push','email','in_app')),
  status text not null default 'pending' check (status in ('pending','sent','cancelled','failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (finding_id is not null or action_id is not null)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text,
  report_type text,
  field_notes text,
  audio_transcript text,
  photo_notes text,
  generated_report jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','generated','final','archived')),
  ai_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_findings (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  finding_id uuid not null references public.findings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, finding_id)
);

create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  provider text not null,
  model text,
  prompt_type text,
  input_summary text,
  output_preview text,
  latency_ms integer,
  raw_response text,
  created_at timestamptz not null default now()
);

create table public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  name text not null,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  source text,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_org_members_user on public.organization_members(user_id, organization_id);
create index idx_sites_org on public.sites(organization_id);
create index idx_field_entries_org_captured on public.field_entries(organization_id, captured_at desc);
create index idx_findings_org_status_due on public.findings(organization_id, status, due_at);
create index idx_actions_org_status_due on public.smart_actions(organization_id, status, due_at);
create index idx_evidence_org_finding on public.evidence_files(organization_id, finding_id);
create index idx_reminders_pending on public.reminders(status, scheduled_for) where status = 'pending';
create index idx_reports_org_created on public.reports(organization_id, created_at desc);
create index idx_ai_logs_created on public.ai_generation_logs(created_at desc);
create index idx_tracking_created on public.tracking_events(created_at desc);

create or replace function private.set_updated_at() returns trigger language plpgsql set search_path = public, pg_temp as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger organizations_updated_at before update on public.organizations for each row execute function private.set_updated_at();
create trigger sites_updated_at before update on public.sites for each row execute function private.set_updated_at();
create trigger field_entries_updated_at before update on public.field_entries for each row execute function private.set_updated_at();
create trigger findings_updated_at before update on public.findings for each row execute function private.set_updated_at();
create trigger smart_actions_updated_at before update on public.smart_actions for each row execute function private.set_updated_at();
create trigger reminders_updated_at before update on public.reminders for each row execute function private.set_updated_at();
create trigger reports_updated_at before update on public.reports for each row execute function private.set_updated_at();

create or replace function private.is_org_member(target_org uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$ select exists (select 1 from public.organization_members m where m.organization_id = target_org and m.user_id = (select auth.uid())); $$;
create or replace function private.is_org_admin(target_org uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$ select exists (select 1 from public.organization_members m where m.organization_id = target_org and m.user_id = (select auth.uid()) and m.role in ('owner','admin')); $$;
revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.is_org_admin(uuid) from public;
grant execute on function private.is_org_member(uuid) to authenticated, service_role;
grant execute on function private.is_org_admin(uuid) to authenticated, service_role;

create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$ begin insert into public.profiles (id,email,full_name,avatar_url) values (new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name'),new.raw_user_meta_data->>'avatar_url') on conflict (id) do nothing; return new; end; $$;
revoke all on function private.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function private.add_org_owner() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$ begin insert into public.organization_members (organization_id,user_id,role) values (new.id,new.created_by,'owner') on conflict (organization_id,user_id) do update set role='owner'; return new; end; $$;
revoke all on function private.add_org_owner() from public;
create trigger on_organization_created after insert on public.organizations for each row execute function private.add_org_owner();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.sites enable row level security;
alter table public.field_entries enable row level security;
alter table public.findings enable row level security;
alter table public.smart_actions enable row level security;
alter table public.evidence_files enable row level security;
alter table public.reminders enable row level security;
alter table public.reports enable row level security;
alter table public.report_findings enable row level security;
alter table public.ai_generation_logs enable row level security;
alter table public.tracking_events enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy organizations_select_member on public.organizations for select to authenticated using (private.is_org_member(id));
create policy organizations_insert_creator on public.organizations for insert to authenticated with check (created_by=(select auth.uid()));
create policy organizations_update_admin on public.organizations for update to authenticated using (private.is_org_admin(id)) with check (private.is_org_admin(id));
create policy organizations_delete_owner on public.organizations for delete to authenticated using (exists (select 1 from public.organization_members m where m.organization_id=id and m.user_id=(select auth.uid()) and m.role='owner'));
create policy members_select_member on public.organization_members for select to authenticated using (private.is_org_member(organization_id));
create policy members_insert_admin on public.organization_members for insert to authenticated with check (private.is_org_admin(organization_id));
create policy members_update_admin on public.organization_members for update to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy members_delete_admin on public.organization_members for delete to authenticated using (private.is_org_admin(organization_id));
create policy sites_select on public.sites for select to authenticated using (private.is_org_member(organization_id));
create policy sites_insert on public.sites for insert to authenticated with check (private.is_org_member(organization_id) and created_by=(select auth.uid()));
create policy sites_update on public.sites for update to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy sites_delete on public.sites for delete to authenticated using (private.is_org_admin(organization_id));
create policy field_entries_select on public.field_entries for select to authenticated using (private.is_org_member(organization_id));
create policy field_entries_insert on public.field_entries for insert to authenticated with check (private.is_org_member(organization_id) and created_by=(select auth.uid()));
create policy field_entries_update on public.field_entries for update to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy field_entries_delete on public.field_entries for delete to authenticated using (created_by=(select auth.uid()) or private.is_org_admin(organization_id));
create policy findings_select on public.findings for select to authenticated using (private.is_org_member(organization_id));
create policy findings_insert on public.findings for insert to authenticated with check (private.is_org_member(organization_id) and created_by=(select auth.uid()));
create policy findings_update on public.findings for update to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy findings_delete on public.findings for delete to authenticated using (created_by=(select auth.uid()) or private.is_org_admin(organization_id));
create policy actions_select on public.smart_actions for select to authenticated using (private.is_org_member(organization_id));
create policy actions_insert on public.smart_actions for insert to authenticated with check (private.is_org_member(organization_id) and created_by=(select auth.uid()));
create policy actions_update on public.smart_actions for update to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy actions_delete on public.smart_actions for delete to authenticated using (created_by=(select auth.uid()) or private.is_org_admin(organization_id));
create policy evidence_select on public.evidence_files for select to authenticated using (private.is_org_member(organization_id));
create policy evidence_insert on public.evidence_files for insert to authenticated with check (private.is_org_member(organization_id) and uploaded_by=(select auth.uid()));
create policy evidence_delete on public.evidence_files for delete to authenticated using (uploaded_by=(select auth.uid()) or private.is_org_admin(organization_id));
create policy reminders_select on public.reminders for select to authenticated using (private.is_org_member(organization_id));
create policy reminders_insert on public.reminders for insert to authenticated with check (private.is_org_member(organization_id) and created_by=(select auth.uid()));
create policy reminders_update on public.reminders for update to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy reminders_delete on public.reminders for delete to authenticated using (created_by=(select auth.uid()) or private.is_org_admin(organization_id));
create policy reports_select on public.reports for select to authenticated using (private.is_org_member(organization_id));
create policy reports_insert on public.reports for insert to authenticated with check (private.is_org_member(organization_id) and created_by=(select auth.uid()));
create policy reports_update on public.reports for update to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy reports_delete on public.reports for delete to authenticated using (created_by=(select auth.uid()) or private.is_org_admin(organization_id));
create policy report_findings_select on public.report_findings for select to authenticated using (private.is_org_member(organization_id));
create policy report_findings_insert on public.report_findings for insert to authenticated with check (private.is_org_member(organization_id));
create policy report_findings_delete on public.report_findings for delete to authenticated using (private.is_org_member(organization_id));

revoke all on all tables in schema public from anon;
grant select,insert,update,delete on public.profiles,public.organizations,public.organization_members,public.sites,public.field_entries,public.findings,public.smart_actions,public.evidence_files,public.reminders,public.reports,public.report_findings to authenticated;
grant all on public.profiles,public.organizations,public.organization_members,public.sites,public.field_entries,public.findings,public.smart_actions,public.evidence_files,public.reminders,public.reports,public.report_findings,public.ai_generation_logs,public.tracking_events to service_role;
grant usage,select on all sequences in schema public to authenticated,service_role;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('hse-evidence','hse-evidence',false,26214400,array['image/jpeg','image/png','image/webp','application/pdf','audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/webm'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy hse_evidence_select on storage.objects for select to authenticated using (bucket_id='hse-evidence' and private.is_org_member(nullif((storage.foldername(name))[1],'')::uuid));
create policy hse_evidence_insert on storage.objects for insert to authenticated with check (bucket_id='hse-evidence' and private.is_org_member(nullif((storage.foldername(name))[1],'')::uuid));
create policy hse_evidence_update on storage.objects for update to authenticated using (bucket_id='hse-evidence' and private.is_org_member(nullif((storage.foldername(name))[1],'')::uuid)) with check (bucket_id='hse-evidence' and private.is_org_member(nullif((storage.foldername(name))[1],'')::uuid));
create policy hse_evidence_delete on storage.objects for delete to authenticated using (bucket_id='hse-evidence' and private.is_org_member(nullif((storage.foldername(name))[1],'')::uuid));
