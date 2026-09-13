-- HSE Copilot WhatsApp field channel.
-- Additive only: existing findings, actions and reminders remain the source of truth.

create table if not exists public.hse_channel_identities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  provider text not null default 'whatsapp' check (provider in ('whatsapp')),
  external_account_id text not null,
  external_user_id text not null,
  display_name text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_account_id, external_user_id)
);

create table if not exists public.hse_channel_messages (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references public.hse_channel_identities(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  direction text not null check (direction in ('inbound','outbound')),
  provider_message_id text,
  idempotency_key text,
  message_type text not null check (message_type in ('text','audio','image','document','video','interactive','system')),
  body_text text,
  transcript text,
  media jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_hse_channel_messages_provider_id
  on public.hse_channel_messages(identity_id, direction, provider_message_id)
  where provider_message_id is not null;
create unique index if not exists idx_hse_channel_messages_idempotency
  on public.hse_channel_messages(identity_id, direction, idempotency_key)
  where idempotency_key is not null;
create index if not exists idx_hse_channel_messages_org_time
  on public.hse_channel_messages(organization_id, occurred_at desc);

create table if not exists public.hse_assistant_commands (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references public.hse_channel_identities(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_message_id uuid references public.hse_channel_messages(id) on delete set null,
  intent text not null check (intent in (
    'CREATE_FINDING','UPDATE_FINDING','ADD_EVIDENCE','CREATE_REMINDER','RESCHEDULE_REMINDER',
    'QUERY_PENDING','QUERY_FINDINGS','FIELD_NOTE','SET_CONTEXT','CLOSE_FINDING',
    'DAILY_SUMMARY','QUERY_PROCEDURE','UNKNOWN'
  )),
  status text not null default 'proposed' check (status in ('proposed','awaiting_confirmation','confirmed','executed','rejected','failed')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  confirmation_expires_at timestamptz,
  executed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_hse_commands_identity_status
  on public.hse_assistant_commands(identity_id, status, created_at desc);

create table if not exists public.hse_conversation_contexts (
  identity_id uuid primary key references public.hse_channel_identities(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  active_site_id uuid references public.sites(id) on delete set null,
  active_location_text text,
  active_finding_id uuid references public.findings(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Free operational reminders (e.g. “recordame mañana hablar con electricidad”)
-- remain in Informe360 even if an external calendar/channel is disconnected.
alter table public.reminders add column if not exists title text;
alter table public.reminders add column if not exists notes text;
alter table public.reminders add column if not exists site_id uuid references public.sites(id) on delete set null;

alter table public.reminders drop constraint if exists reminders_check;
alter table public.reminders drop constraint if exists reminders_target_check;
alter table public.reminders add constraint reminders_target_check check (
  finding_id is not null or action_id is not null or nullif(btrim(title), '') is not null
);

alter table public.reminders drop constraint if exists reminders_channel_check;
alter table public.reminders add constraint reminders_channel_check check (channel in ('push','email','in_app','whatsapp'));

create index if not exists idx_reminders_user_channel_pending
  on public.reminders(created_by, channel, scheduled_for)
  where status = 'pending';

-- Reuse the existing updated_at helper.
drop trigger if exists hse_channel_identities_updated_at on public.hse_channel_identities;
create trigger hse_channel_identities_updated_at before update on public.hse_channel_identities
for each row execute function private.set_updated_at();

drop trigger if exists hse_assistant_commands_updated_at on public.hse_assistant_commands;
create trigger hse_assistant_commands_updated_at before update on public.hse_assistant_commands
for each row execute function private.set_updated_at();

drop trigger if exists hse_conversation_contexts_updated_at on public.hse_conversation_contexts;
create trigger hse_conversation_contexts_updated_at before update on public.hse_conversation_contexts
for each row execute function private.set_updated_at();

alter table public.hse_channel_identities enable row level security;
alter table public.hse_channel_messages enable row level security;
alter table public.hse_assistant_commands enable row level security;
alter table public.hse_conversation_contexts enable row level security;

create policy hse_channel_identities_select on public.hse_channel_identities
for select to authenticated
using (user_id = (select auth.uid()) or private.is_org_admin(organization_id));

create policy hse_channel_messages_select on public.hse_channel_messages
for select to authenticated
using (private.is_org_member(organization_id));

create policy hse_assistant_commands_select on public.hse_assistant_commands
for select to authenticated
using (private.is_org_member(organization_id));

create policy hse_conversation_contexts_select on public.hse_conversation_contexts
for select to authenticated
using (user_id = (select auth.uid()) or private.is_org_admin(organization_id));

revoke all on public.hse_channel_identities from anon, authenticated;
revoke all on public.hse_channel_messages from anon, authenticated;
revoke all on public.hse_assistant_commands from anon, authenticated;
revoke all on public.hse_conversation_contexts from anon, authenticated;
grant select on public.hse_channel_identities to authenticated;
grant select on public.hse_channel_messages to authenticated;
grant select on public.hse_assistant_commands to authenticated;
grant select on public.hse_conversation_contexts to authenticated;
grant all on public.hse_channel_identities to service_role;
grant all on public.hse_channel_messages to service_role;
grant all on public.hse_assistant_commands to service_role;
grant all on public.hse_conversation_contexts to service_role;

-- WhatsApp webhooks run with the server-only service role. This RPC deliberately
-- validates the actor's membership and site/field-entry ownership before creating
-- an official finding bundle. It is not callable by browser/mobile users.
create or replace function public.create_channel_finding_bundle(
  p_actor_id uuid,
  p_organization_id uuid,
  p_site_id uuid,
  p_field_entry_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_severity text,
  p_priority text,
  p_due_at timestamptz,
  p_responsible_text text,
  p_action text,
  p_ai_confidence numeric
)
returns table(finding_id uuid, finding_code text, action_id uuid, reminder_id uuid)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_finding public.findings%rowtype;
  v_action_id uuid;
  v_reminder_id uuid;
  v_entry public.field_entries%rowtype;
begin
  if p_actor_id is null or not exists (
    select 1 from public.organization_members m
    where m.organization_id = p_organization_id and m.user_id = p_actor_id
  ) then
    raise exception 'Actor is not a member of the organization';
  end if;

  if p_site_id is not null and not exists (
    select 1 from public.sites s
    where s.id = p_site_id and s.organization_id = p_organization_id
  ) then
    raise exception 'Site does not belong to organization';
  end if;

  select * into v_entry from public.field_entries where id = p_field_entry_id;
  if v_entry.id is null
     or v_entry.organization_id <> p_organization_id
     or v_entry.created_by <> p_actor_id then
    raise exception 'Field entry does not belong to actor and organization';
  end if;

  insert into public.findings (
    organization_id, site_id, field_entry_id, created_by, title, description,
    category, severity, priority, due_at, responsible_text, ai_confidence
  ) values (
    p_organization_id, p_site_id, p_field_entry_id, p_actor_id, p_title, p_description,
    p_category, p_severity, p_priority, p_due_at, p_responsible_text, p_ai_confidence
  ) returning * into v_finding;

  if nullif(btrim(p_action), '') is not null then
    insert into public.smart_actions (
      organization_id, finding_id, created_by, action, responsible_text, due_at
    ) values (
      p_organization_id, v_finding.id, p_actor_id, p_action, p_responsible_text, p_due_at
    ) returning id into v_action_id;
  end if;

  if p_due_at is not null then
    insert into public.reminders (
      organization_id, finding_id, action_id, created_by, site_id, title,
      scheduled_for, channel, status
    ) values (
      p_organization_id, v_finding.id, v_action_id, p_actor_id, p_site_id,
      coalesce(nullif(btrim(p_title), ''), 'Seguimiento HSE'),
      p_due_at, 'whatsapp', 'pending'
    ) returning id into v_reminder_id;
  end if;

  update public.field_entries
  set processing_status = 'structured', processing_error = null, updated_at = now()
  where id = p_field_entry_id;

  return query select v_finding.id, v_finding.code, v_action_id, v_reminder_id;
end;
$$;

revoke all on function public.create_channel_finding_bundle(uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz,text,text,numeric) from public, anon, authenticated;
grant execute on function public.create_channel_finding_bundle(uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz,text,text,numeric) to service_role;
